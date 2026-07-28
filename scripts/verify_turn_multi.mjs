import { chromium } from "/root/.nvm/versions/node/v22.13.1/lib/node_modules/playwright/index.mjs";

const sig = () => {
  const root = document.querySelector('[data-testid="free-cube"]');
  const faces = [...root.querySelectorAll(".cubie-face")];
  const arr = faces.map((f) => f.getAttribute("data-pos") + "|" + f.getAttribute("data-face") + "|" + (f.querySelector(".sticker")?.style.getPropertyValue("--c") || "").trim());
  arr.sort();
  const rotated = [...root.querySelectorAll(".cubie")].filter((c) => /rotate3d\(/.test(c.style.transform || "")).length;
  const filt = root.querySelector(".sticker") ? getComputedStyle(root.querySelector(".sticker")).filter : "none";
  return { sig: arr.join(","), rotated, filt };
};

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto("http://localhost:4180/#/tutorial", { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="free-cube"] .cubie', { timeout: 10000 });
await page.locator('[data-testid="free-cube"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

// 检查受光亮度是否已应用
const filt0 = await page.evaluate(sig);
console.log("贴纸 filter（受光）:", filt0.filt);

// 多个抓取点：data-face + data-pos + 拖拽方向
const grabs = [
  { name: "前层顶中[0,1,1] 右拖→U", face: 4, pos: "0,1,1", dx: 90, dy: 0 },
  { name: "前层右中[1,0,1] 上拖→R", face: 4, pos: "1,0,1", dx: 0, dy: -90 },
  { name: "前层角[1,1,1] 右拖→U", face: 4, pos: "1,1,1", dx: 90, dy: 0 },
  { name: "前层底中[0,-1,1] 右拖→D", face: 4, pos: "0,-1,1", dx: 90, dy: 0 },
];

let allPass = true;
for (const g of grabs) {
  const sel = `[data-testid="free-cube"] .cubie-face[data-face="${g.face}"][data-pos="${g.pos}"]`;
  const box = await page.locator(sel).boundingBox();
  if (!box) { console.log(`✗ ${g.name}: 找不到元素`); allPass = false; continue; }
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const f0 = await page.evaluate(sig);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(cx + (g.dx * i) / 10, cy + (g.dy * i) / 10, { steps: 1 }); await page.waitForTimeout(12); }
  const mid = await page.evaluate(sig);
  await page.mouse.up();
  await page.waitForTimeout(450);
  const f1 = await page.evaluate(sig);
  const turnWorks = mid.rotated > 0 && f0.sig !== f1.sig;
  if (!turnWorks) allPass = false;
  console.log(`${turnWorks ? "✓" : "✗"} ${g.name}: 转动中cubie=${mid.rotated}, 状态变化=${f0.sig !== f1.sig}`);
  // 复位
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('[data-testid="free-cube"] button')];
    const r = btns.find((b) => b.textContent.includes("复原"));
    r && r.click();
  });
  await page.waitForTimeout(150);
}

// 背景抓取 → 应转视角（orbit），不应拧层
const stageBox = await page.locator('[data-testid="free-cube"] div.cursor-grab').boundingBox();
const beforeRot = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="free-cube"] .cube-3d')).transform.slice(0, 20));
// 抓舞台左上角（立方体居中，角落是空白）
await page.mouse.move(stageBox.x + 14, stageBox.y + 14);
await page.mouse.down();
for (let i = 1; i <= 8; i++) { await page.mouse.move(stageBox.x + 14 + i * 9, stageBox.y + 14 + i * 5, { steps: 1 }); await page.waitForTimeout(12); }
await page.mouse.up();
await page.waitForTimeout(200);
const afterRot = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="free-cube"] .cube-3d')).transform.slice(0, 20));
const orbitWorks = beforeRot !== afterRot;
console.log(`${orbitWorks ? "✓" : "✗"} 空白处拖动=转视角(orbit): ${orbitWorks}`);
if (!orbitWorks) allPass = false;

await page.screenshot({ path: "/tmp/cube_v2.png" });
console.log("\n控制台错误:", errors.length === 0 ? "无 ✓" : "✗ " + JSON.stringify(errors.slice(0, 4)));
if (errors.length) allPass = false;
await browser.close();
console.log(allPass ? "\nALL PASS ✅" : "\nFAIL ❌");
process.exitCode = allPass ? 0 : 1;
