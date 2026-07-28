import { chromium } from "/root/.nvm/versions/node/v22.13.1/lib/node_modules/playwright/index.mjs";

const sig = () =>
  (() => {
    const root = document.querySelector('[data-testid="free-cube"]');
    const faces = [...root.querySelectorAll(".cubie-face")];
    const arr = faces.map((f) => {
      const pos = f.getAttribute("data-pos");
      const face = f.getAttribute("data-face");
      const c = f.querySelector(".sticker")?.style.getPropertyValue("--c")?.trim();
      return pos + "|" + face + "|" + c;
    });
    arr.sort();
    const counts = {};
    faces.forEach((f) => {
      const c = f.querySelector(".sticker")?.style.getPropertyValue("--c")?.trim();
      counts[c] = (counts[c] || 0) + 1;
    });
    const rotated = [...root.querySelectorAll(".cubie")].some((c) =>
      /rotate3d\(/.test(c.style.transform || "")
    );
    return { sig: arr.join(","), counts, cubies: [...root.querySelectorAll(".cubie")].length, rotated };
  })();

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto("http://localhost:4180/#/tutorial", { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="free-cube"] .cubie', { timeout: 10000 });
await page.locator('[data-testid="free-cube"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

const f0 = await page.evaluate(sig);
console.log("初始 cubies 数:", f0.cubies, "| 颜色计数:", JSON.stringify(f0.counts));

await page.screenshot({ path: "/tmp/cube_initial.png" });

// 抓「前层顶行中心」色块 [0,1,1] 的 F 面，向右拖动 => 应转顶层 U
const sel = '[data-testid="free-cube"] .cubie-face[data-face="4"][data-pos="0,1,1"]';
const box0 = await page.locator(sel).boundingBox();
if (!box0) throw new Error("找不到目标色块 " + sel);
console.log("目标色块视口坐标:", JSON.stringify(box0));
const cx = box0.x + box0.width / 2;
const cy = box0.y + box0.height / 2;
await page.mouse.move(cx, cy);
await page.mouse.down();
for (let i = 1; i <= 10; i++) {
  await page.mouse.move(cx + i * 10, cy, { steps: 1 });
  await page.waitForTimeout(15);
}
const mid = await page.evaluate(sig);
console.log("拖拽中 rotate3d 生效:", mid.rotated, "| cubies:", mid.cubies);
await page.screenshot({ path: "/tmp/cube_mid_drag.png" });
await page.mouse.up();
await page.waitForTimeout(500);

const f1 = await page.evaluate(sig);
console.log("拖拽后 cubies 数:", f1.cubies, "| 颜色计数:", JSON.stringify(f1.counts));
await page.screenshot({ path: "/tmp/cube_after.png" });

const changed = f0.sig !== f1.sig;
const countOk =
  JSON.stringify(f0.counts) === JSON.stringify(f1.counts) &&
  Object.values(f1.counts).every((v) => v === 9);

console.log("\n=== 结果 ===");
console.log("cubie 数量=26:", f1.cubies === 26 ? "✓" : "✗ (" + f1.cubies + ")");
console.log("拖拽中层转动(rotate3d):", mid.rotated ? "✓" : "✗");
console.log("提交后魔方状态改变:", changed ? "✓" : "✗");
console.log("转动合法(每色仍 9 块):", countOk ? "✓" : "✗");
console.log("控制台错误:", errors.length === 0 ? "无 ✓" : "✗ " + JSON.stringify(errors.slice(0, 5)));

await browser.close();
const ok = f1.cubies === 26 && mid.rotated && changed && countOk && errors.length === 0;
process.exitCode = ok ? 0 : 1;
console.log(ok ? "\nALL PASS" : "\nFAIL");
