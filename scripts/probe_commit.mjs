// 确定性验证：拖拽方向是否“跟手”。
// 注意：本脚本依赖 InteractiveCube 中 testId 对应的 window.__cubeProbe 临时读取钩子
// （发布版已移除）。如需复跑，请临时在 InteractiveCube 内重新挂载该钩子。
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

const base = (m) => (m || "").replace("'", "");
const isPrime = (m) => !!(m || "").endsWith("'");
const inverseOf = (a, b) => base(a) === base(b) && isPrime(a) !== isPrime(b);
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];

async function commitDrag(dir) {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector('div[data-testid="practice-cube"] canvas', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.locator('div[data-testid="practice-cube"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await page.evaluate(() => { const c = document.querySelector('div[data-testid="practice-cube"] canvas'); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const dist = Math.min(box.h / 2 - 25, 130);
  const sx0 = cx, sy0 = cy;
  let sxT = cx, syT = cy;
  if (dir === "up") syT = cy - dist;
  else if (dir === "down") syT = cy + dist;
  else if (dir === "left") sxT = cx - dist;
  else sxT = cx + dist;
  await page.mouse.move(sx0, sy0);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(sx0 + (sxT - sx0) * (i / 12), sy0 + (syT - sy0) * (i / 12));
    await sleep(20);
  }
  await sleep(120);
  const mid = await probe();
  await page.mouse.up();
  await sleep(450);
  const after = await probe();
  return { mid, last: after && after.lastMove };
}

const result = {};
try {
  const up = await commitDrag("up");
  const dn = await commitDrag("down");
  const lf = await commitDrag("left");
  const rt = await commitDrag("right");
  result.up = up.last; result.down = dn.last; result.left = lf.last; result.right = rt.last;
  console.log("UP   :", up.last, "eM", JSON.stringify(up.mid && up.mid.eM));
  console.log("DOWN :", dn.last, "eM", JSON.stringify(dn.mid && dn.mid.eM));
  console.log("LEFT :", lf.last, "eM", JSON.stringify(lf.mid && lf.mid.eM));
  console.log("RIGHT:", rt.last, "eM", JSON.stringify(rt.mid && rt.mid.eM));
  const vOK = inverseOf(result.up, result.down);
  const hOK = inverseOf(result.left, result.right);
  const eUp = up.mid && up.mid.eM, eLf = lf.mid && lf.mid.eM;
  const perp = eUp && eLf && Math.abs(dot(eUp, eLf)) < 1e-6;
  console.log("vertical up/down inverse:", vOK);
  console.log("horizontal left/right inverse:", hOK);
  console.log("vertical ⊥ horizontal axes:", perp);
  const ok = vOK && hOK && perp && !errors.length;
  console.log("errors:", errors.length ? errors : "none");
  console.log(ok ? "COMMIT_DIRECTION: PASS" : "COMMIT_DIRECTION: FAIL");
  process.exitCode = ok ? 0 : 1;
} catch (e) {
  console.log("EXCEPTION:", e.message);
  process.exitCode = 2;
} finally {
  await browser.close();
}
