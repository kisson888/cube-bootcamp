import { chromium } from "playwright";
import fs from "fs";

const BASE = process.env.E2E_BASE || "http://localhost:8139";
const URL = BASE + "/#/tutorial";
const launchArgs = ["--no-sandbox","--disable-dev-shm-usage","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--disable-gpu-sandbox","--enable-webgl"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: launchArgs });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const shot = (name) => page.locator('div[data-testid="practice-cube"] canvas').screenshot({ path: "/tmp/" + name });

try {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector('div[data-testid="practice-cube"] canvas', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.locator('div[data-testid="practice-cube"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box = await page.evaluate(() => { const c = document.querySelector('div[data-testid="practice-cube"] canvas'); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;

  // rest frame
  await sleep(300); await shot("rest.png");

  // start a drag, hold at ~60% (90px up), capture two frames at the SAME pose
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 9; i++) { await page.mouse.move(cx, cy - 90 * (i / 9)); await sleep(20); }
  await sleep(200); await shot("twist1.png");
  await sleep(250); await shot("twist2.png");
  // a bit further (75%)
  for (let i = 10; i <= 12; i++) { await page.mouse.move(cx, cy - 120 * (i / 12)); await sleep(20); }
  await sleep(200); await shot("twist3.png");
  await page.mouse.up();
  await sleep(400); await shot("after.png");

  // temporal-stability check: compare twist1 vs twist2 (identical pose, different frames)
  const b1 = fs.readFileSync("/tmp/twist1.png");
  const b2 = fs.readFileSync("/tmp/twist2.png");
  const diffBytes = b1.length !== b2.length ? "len-mismatch" : (Buffer.compare(b1, b2) === 0 ? "identical" : "differ");
  console.log("twist1 vs twist2 (same pose, diff frames):", diffBytes);
  console.log("files:", ["rest.png","twist1.png","twist2.png","twist3.png","after.png"].map(f => f + "=" + fs.statSync("/tmp/" + f).size + "b").join(" "));
  console.log("errors:", errors.length ? errors : "none");
} catch (e) {
  console.log("EXCEPTION:", e.message);
} finally {
  await browser.close();
}
