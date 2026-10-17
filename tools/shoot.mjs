// headless screenshots of the app: node tools/shoot.mjs
import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
import path from 'path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const url = 'file://' + root + '/index.html';
const out = root + '/docs/shots';
import fs from 'fs'; fs.mkdirSync(out, { recursive: true });
const sizes = { phone: { w: 390, h: 844, mobile: true }, ipad: { w: 1180, h: 820, mobile: false } };
const browser = await chromium.launch();
for (const [name, s] of Object.entries(sizes)) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: s.mobile, hasTouch: s.mobile, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(name, 'PAGEERROR', e.message));
  await page.goto(url);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}-1-start.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.getElementById('s-start').scrollTo(0, 99999));
  await page.screenshot({ path: `${out}/${name}-1b-start-bottom.png` });
  // enable sentence for a richer view
  await page.evaluate(() => { const c = document.getElementById('o-ctx'); if (!c.checked) c.click(); });
  await page.click('#go');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}-2-intro.png` });
  await page.click('#intro');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}-3-read-talking.png` });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/${name}-4-read-idle.png` });
  for (let i = 0; i < 7; i++) { await page.click('#next'); await page.waitForTimeout(520); }
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}-5-read-later.png` });
  const info = await page.evaluate(() => {
    const r = id => { const b = document.getElementById(id).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    return { vh: innerHeight, scrollH: document.getElementById('s-read').scrollHeight, card: r('card'), ctx: r('ctx'), buddy: r('buddy-img'), say: r('say'), controls: r('controls'), fs: getComputedStyle(document.getElementById('word')).fontSize };
  });
  console.log(name, JSON.stringify(info));
  await ctx.close();
}
await browser.close();
