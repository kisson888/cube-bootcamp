import { chromium } from "/root/.nvm/versions/node/v22.13.1/lib/node_modules/playwright/index.mjs";
const BASE = "http://localhost:4180";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e)));

async function dump(url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const root = document.querySelector('[data-testid="free-cube"]');
    const allBtns = [...document.querySelectorAll("button")].map((b) => b.textContent.trim());
    const bodyText = document.body.innerText.slice(0, 300);
    const freeCubeHtml = root ? root.innerHTML.slice(0, 400) : "NO free-cube";
    return { allBtns, bodyText, freeCubeHtml, hasWebglMsg: document.body.innerText.includes("WebGL") };
  });
  console.log(`\n===== ${url} =====`);
  console.log("buttons:", JSON.stringify(info.allBtns));
  console.log("hasWebglMsg:", info.hasWebglMsg);
  console.log("bodyText:", JSON.stringify(info.bodyText));
  console.log("freeCubeHtml:", JSON.stringify(info.freeCubeHtml));
}

await dump(`${BASE}/#/interactive`);
await dump(`${BASE}/#/tutorial`);
await browser.close();
