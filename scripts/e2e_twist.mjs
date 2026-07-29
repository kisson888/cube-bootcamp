import { chromium } from "playwright";

const BASE = "http://localhost:8139";
const URL = BASE + "/#/tutorial";
const launchArgs = [
  "--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-sandbox", "--enable-webgl",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function log(...a) { console.log(...a); }

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: launchArgs });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
page.on("console", (m) => { if (m.type() === "error") errors.push("console:" + m.text()); });
page.on("pageerror", (e) => errors.push("pageerror:" + e.message));

const practiceText = () => page.evaluate(() => {
  const el = document.querySelector('div[data-testid="practice-cube"]');
  const leftCol = el ? el.parentElement : null;
  const fb = leftCol ? leftCol.children[1] : null;
  return fb ? fb.innerText.replace(/\s+/g, " ").trim() : "";
});

const result = { webgl: null, fallback: null, before: null, after: null, committed: false, tries: [] };
try {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector('div[data-testid="practice-cube"] canvas', { timeout: 15000 });
  await page.waitForTimeout(1200);

  result.webgl = await page.evaluate(() => {
    const c = document.querySelector('div[data-testid="practice-cube"] canvas');
    return c && (c.getContext("webgl2") || c.getContext("webgl")) ? "active" : "none";
  });
  const body0 = await page.evaluate(() => document.body.innerText);
  result.fallback = body0.includes("当前环境不支持 WebGL") ? "shown" : "absent";
  result.before = await practiceText();

  await page.locator('div[data-testid="practice-cube"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box = await page.evaluate(() => {
    const c = document.querySelector('div[data-testid="practice-cube"] canvas');
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const candidates = [[cx, cy], [cx, cy + 40], [cx - 30, cy + 20], [cx + 30, cy + 20], [cx, cy - 30]];
  const DRAG = 150;

  for (const [sx, sy] of candidates) {
    const beforeP = await practiceText();
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) { await page.mouse.move(sx, sy - DRAG * (i / 12)); await sleep(25); }
    await page.mouse.up();
    await sleep(600);
    const afterP = await practiceText();
    const committed = beforeP !== afterP;
    result.tries.push({ sx: Math.round(sx), sy: Math.round(sy), beforeP, afterP, committed });
    result.after = afterP;
    if (committed) { result.committed = true; result.chosen = [Math.round(sx), Math.round(sy)]; break; }
  }

  log("=== E2E TWIST (hook-free, production-equivalent) ===");
  log("webgl context :", result.webgl);
  log("webgl fallback:", result.fallback);
  log("feedback before:", result.before);
  log("feedback after :", result.after);
  log("committed turn :", result.committed, result.chosen ? "at " + JSON.stringify(result.chosen) : "");
  log("tries:", JSON.stringify(result.tries));
  log("errors:", errors.length ? errors : "none");
  const ok = result.webgl === "active" && result.fallback === "absent" && result.committed && errors.length === 0;
  log(ok ? "OVERALL: PASS" : "OVERALL: FAIL");
  process.exitCode = ok ? 0 : 1;
} catch (e) {
  log("EXCEPTION:", e.message, "\n", e.stack);
  log("errors:", errors);
  process.exitCode = 2;
} finally {
  await browser.close();
}
