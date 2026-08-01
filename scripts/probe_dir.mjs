// 拖拽方向验证（升级版见 probe_commit.mjs，按“提交后的 move 是否互为逆操作”判定）。
// 依赖 InteractiveCube 中 testId 对应的 window.__cubeProbe 临时钩子（发布版已移除）。
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE || "http://localhost:8139";
const URL = BASE + "/#/tutorial";
const launchArgs = ["--no-sandbox","--disable-dev-shm-usage","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--disable-gpu-sandbox","--enable-webgl"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: launchArgs });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const probe = () => page.evaluate(() => (window.__cubeProbe && window.__cubeProbe["practice-cube"]) ? window.__cubeProbe["practice-cube"]() : null);

const parseMove = (m) => { if (!m) return null; const prime = m.endsWith("'"); return { base: m.replace("'", ""), prime }; };

const result = {};
try {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector('div[data-testid="practice-cube"] canvas', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.locator('div[data-testid="practice-cube"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box = await page.evaluate(() => { const c = document.querySelector('div[data-testid="practice-cube"] canvas'); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;

  for (const dir of ["up", "down"]) {
    const sy0 = cy, syT = dir === "up" ? cy - 95 : cy + 95;
    await page.mouse.move(cx, sy0);
    await page.mouse.down();
    let mv = null, em = null;
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(cx, sy0 + (syT - sy0) * (i / 10));
      await sleep(25);
      const p = await probe();
      if (p && p.move) { mv = p.move; em = p.eM; }
    }
    await page.mouse.up();
    await sleep(500);
    result[dir] = mv;
    result.eMs = result.eMs || {};
    result.eMs[dir] = em;
    console.log(dir, "-> move:", mv, JSON.stringify(parseMove(mv)));
    // reset for next attempt
    const reset = page.getByText("重来", { exact: false });
    if (await reset.count()) { await reset.first().click(); await sleep(300); }
  }

  const up = parseMove(result.up), dn = parseMove(result.down);
  // read eM during each drag for a definitive direction check
  const eMs = result.eMs || {};
  console.log("up eM:", JSON.stringify(eMs.up), "down eM:", JSON.stringify(eMs.down));
  const opp = eMs.up && eMs.down &&
    eMs.up[0] === -eMs.down[0] && eMs.up[1] === -eMs.down[1] && eMs.up[2] === -eMs.down[2];
  console.log("up/down rotation axes are opposite (follows finger):", opp);
  console.log("errors:", errors.length ? errors : "none");
  console.log(opp ? "DIRECTION: PASS" : "DIRECTION: FAIL");
  process.exitCode = opp ? 0 : 1;
} catch (e) {
  console.log("EXCEPTION:", e.message);
  process.exitCode = 2;
} finally {
  await browser.close();
}
