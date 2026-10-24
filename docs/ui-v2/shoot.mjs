// node shoot.mjs a b c  → a-home.png a-read.png ... (390x844 @2x)
import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : ['a','b','c'];
const b = await chromium.launch();
for (const d of dirs) {
  const ctx = await b.newContext({ viewport: { width: 1000, height: 1900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log(d, 'PAGEERROR', e.message));
  await p.goto('file://' + process.cwd() + `/mock-${d}.html`);
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  for (const id of ['home', 'read', 'milestone', 'finish']) {
    const el = await p.$('#' + id);
    if (el) await el.screenshot({ path: `${d}-${id}.png` });
  }
  await ctx.close();
}
await b.close();
console.log('ok');
