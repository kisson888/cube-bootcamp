import { chromium } from "/root/.nvm/versions/node/v22.13.1/lib/node_modules/playwright/index.mjs";

const BASE = "http://localhost:4180";
const pageErrors = [];

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => pageErrors.push(String(e)));

const results = [];
async function check(label, fn) {
  try {
    const r = await fn();
    results.push({ label, ok: true, detail: r });
  } catch (e) {
    results.push({ label, ok: false, detail: String(e).split("\n")[0] });
  }
}

// A. /#/interactive 默认 net 视图（之前会崩溃的用例）
await page.goto(`${BASE}/#/interactive`, { waitUntil: "networkidle" });
await check("A1 /interactive 渲染出视图切换按钮", async () => {
  await page.locator('[data-view="net"]').first().waitFor({ timeout: 8000 });
  await page.locator('[data-view="3d"]').first().waitFor({ timeout: 8000 });
  return "展开图 + 3D 视图 按钮存在";
});
await check("A2 /interactive 的 net 视图 SVG 已渲染", async () => {
  const n = await page.locator('svg').count();
  if (n < 1) throw new Error("未找到 svg");
  return `${n} 个 svg`;
});
await check("A3 /interactive 默认 net 视图无崩溃", async () => {
  if (pageErrors.length) throw new Error(pageErrors.join(" | "));
  return "无 pageerror";
});

// B. 在 /interactive 由 net 切到 3D：应优雅降级，不崩溃/白屏
await check("B1 点击3D视图后出现 WebGL 降级提示", async () => {
  await page.locator('[data-view="3d"]').first().click();
  await page.locator('[data-testid="webgl-fallback"]').waitFor({ timeout: 8000 });
  return "降级提示已显示";
});
await check("B2 切换 3D 后仍无 pageerror", async () => {
  if (pageErrors.length) throw new Error(pageErrors.join(" | "));
  return "无 pageerror";
});

// C. /#/tutorial 初始即 3D（initialView=3d）
await page.goto(`${BASE}/#/tutorial`, { waitUntil: "networkidle" });
await check("C1 /tutorial free-cube 容器存在", async () => {
  await page.locator('[data-testid="free-cube"]').waitFor({ timeout: 8000 });
  return "free-cube 存在";
});
await check("C2 /tutorial 初始3D 显示降级提示（非白屏崩溃）", async () => {
  const n = await page.locator('[data-testid="webgl-fallback"]').count();
  if (n < 1) throw new Error("未出现降级提示");
  return `降级提示已显示（${n} 个 3D 实例均降级）`;
});
await check("C3 /tutorial 无 pageerror", async () => {
  if (pageErrors.length) throw new Error(pageErrors.join(" | "));
  return "无 pageerror";
});

await browser.close();

let pass = 0;
for (const r of results) {
  console.log(`${r.ok ? "✅" : "❌"} ${r.label} => ${r.detail}`);
  if (r.ok) pass++;
}
console.log(`\n通过 ${pass}/${results.length}`);
if (pageErrors.length) {
  console.log("\n致命 pageerror:");
  pageErrors.forEach((e) => console.log("  - " + e));
}
process.exit(pass === results.length && pageErrors.length === 0 ? 0 : 1);
