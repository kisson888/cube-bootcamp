import { chromium } from "/root/.nvm/versions/node/v22.13.1/lib/node_modules/playwright/index.mjs";

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:4180/#/tutorial", { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="free-cube"] .cubie', { timeout: 10000 });
await page.waitForTimeout(400);

const sel = '[data-testid="free-cube"] .cubie-face[data-face="4"][data-pos="0,1,1"]';
const box = await page.locator(sel).boundingBox();
console.log("目标色块 boundingBox:", JSON.stringify(box));
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;

const info = await page.evaluate(([x, y]) => {
  const el = document.elementFromPoint(x, y);
  const desc = (e) => e ? (e.tagName + "." + (e.className?.toString().slice(0, 30)) + " df=" + e.getAttribute?.("data-face") + " dp=" + e.getAttribute?.("data-pos")) : "null";
  return { at: desc(el), parent: desc(el?.parentElement), grandparent: desc(el?.parentElement?.parentElement) };
}, [cx, cy]);
console.log("elementFromPoint:", JSON.stringify(info));

// 按下并立即检查 dragging 类
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.waitForTimeout(50);
const dragging = await page.evaluate(() => {
  const d = document.querySelector('[data-testid="free-cube"] .cube-3d');
  return { cls: d?.className, transform: getComputedStyle(d).transform.slice(0, 30) };
});
console.log("按下后 cube-3d:", JSON.stringify(dragging));

// 移动一点点
for (let i = 1; i <= 5; i++) { await page.mouse.move(cx + i * 10, cy); await page.waitForTimeout(20); }
const mid = await page.evaluate(() => {
  const root = document.querySelector('[data-testid="free-cube"]');
  const rotated = [...root.querySelectorAll(".cubie")].filter((c) => /rotate3d\(/.test(c.style.transform || ""));
  return { rotatedCount: rotated.length, sample: rotated[0]?.style.transform?.slice(0, 60) };
});
console.log("小幅移动后:", JSON.stringify(mid));
await page.mouse.up();

await browser.close();
