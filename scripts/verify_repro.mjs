import { chromium } from "/root/.nvm/versions/node/v22.13.1/lib/node_modules/playwright/index.mjs";

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--use-gl=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:4180/#/tutorial", { waitUntil: "networkidle" });
await page.waitForSelector(".cube-3d .cubie", { timeout: 10000 });
await page.waitForTimeout(300);

// 第 2 个 .cube-3d = 练习魔方（enableTurn=true）
const cubes = await page.locator(".cube-3d").count();
console.log("页面 .cube-3d 数量:", cubes);

async function tryDrag(idx, label) {
  const box = await page.locator(".cube-3d").nth(idx).boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const before = await page.evaluate((i) => {
    const c = document.querySelectorAll(".cube-3d")[i];
    return getComputedStyle(c).transform.slice(0, 24);
  }, idx);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let s = 1; s <= 6; s++) { await page.mouse.move(cx + s * 10, cy); await page.waitForTimeout(15); }
  const mid = await page.evaluate((i) => {
    const root = document.querySelectorAll(".cube-3d")[i];
    const rotated = [...root.querySelectorAll(".cubie")].filter((c) => /rotate3d\(/.test(c.style.transform || "")).length;
    return rotated;
  }, idx);
  const after = await page.evaluate((i) => {
    const c = document.querySelectorAll(".cube-3d")[i];
    return getComputedStyle(c).transform.slice(0, 24);
  }, idx);
  await page.mouse.up();
  console.log(`[${label}] 拖拽前 cube3d 变换: ${before}`);
  console.log(`[${label}] 拖拽中 含 rotate3d 的 cubie 数: ${mid}  => ${mid > 0 ? "拧层 ✓" : "整体旋转(轨道) ✗"}`);
  console.log(`[${label}] 拖拽后 cube3d 变换: ${after}  (变化=${before !== after})`);
}

await tryDrag(1, "练习魔方(中心)");
await browser.close();
