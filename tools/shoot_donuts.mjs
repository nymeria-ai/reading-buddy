// QA for the donuts (donuts) text: every part, every word renders with exact nikud, no overflow, scenes load.
import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve(new URL('..', import.meta.url).pathname); const out = root + '/docs/shots/donuts'; fs.mkdirSync(out, { recursive: true });
const types = { html: 'text/html', webp: 'image/webp', png: 'image/png', mp3: 'audio/mpeg', json: 'application/json' };
let srv, base = process.argv[2];
if (!base) { srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'Content-Type': types[f.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) }).listen(0); base = `http://localhost:${srv.address().port}/index.html` }
const browser = await chromium.launch(); let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++ };
for (const [w, h] of [[360, 740], [390, 844], [430, 932], [768, 1024], [1024, 1366]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [], bad = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()) });
  await page.goto(base); await page.waitForTimeout(600);
  await page.evaluate(() => { localStorage.clear(); store.set('name', 'גֶּפֶן'); store.set('text', 'donuts'); store.set('part', 0) });
  await page.reload(); await page.waitForTimeout(900); await page.evaluate(() => document.fonts.ready);
  const home = await page.evaluate(() => ({ t: curText && curText.id, sub: $('book-sub').textContent, parts: document.querySelectorAll('#parts .part').length }));
  ok(home.t === 'donuts' && home.parts === 5, `${w} home: ${JSON.stringify(home)}`);
  await page.screenshot({ path: `${out}/${w}-home.png` });
  const src = await page.evaluate(() => curText.text.split(/\n\s*\n/).map(x => x.replace(/\s+/g, ' ').trim()));
  for (let p = 0; p < 4; p++) {
    await page.evaluate(p => { opts.mode = 'tap'; store.set('part', p) }, p);
    await page.reload(); await page.waitForTimeout(700); await page.evaluate(() => document.fonts.ready);
    await page.evaluate(p => { opts.mode = 'tap'; const el = document.querySelectorAll('#parts .part')[p]; el && el.click() }, p); await page.waitForTimeout(200);
    await page.click('#go'); await page.waitForTimeout(700);
    if (w === 390) await page.screenshot({ path: `${out}/${w}-p${p + 1}-intro.png` });
    await page.click('#intro'); await page.waitForTimeout(2600);
    const r = await page.evaluate(() => { const bad = []; const words = []; for (let k = 0; k < W.length; k++) { wi = k; si = 0; render(); words.push(W[k].syl.join('')); const c = $('card').getBoundingClientRect(); const s = [...$('word').querySelectorAll('.syl,.punct')].map(e => e.getBoundingClientRect()); if (Math.min(...s.map(b => b.left)) < c.left - 1 || Math.max(...s.map(b => b.right)) > c.right + 1) bad.push(W[k].core) } wi = 0; si = 0; render(); return { words, bad, fs: FS } });
    const expect = src[p].split(' ').map(x => x.replace(/[^\u05B0-\u05EA0-9־-]/g, '')).join('|');
    const got = r.words.map(x => x.replace(/[^\u05B0-\u05EA0-9־-]/g, '')).join('|');
    ok(expect === got, `${w} part ${p + 1}: ${r.words.length} words match source exactly${expect === got ? '' : '\n exp ' + expect + '\n got ' + got}`);
    ok(r.bad.length === 0, `${w} part ${p + 1}: no overflow (font ${r.fs}px) ${r.bad.join(',')}`);
    if (w === 390 || w === 360) { await page.click('#next'); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${w}-p${p + 1}-read.png` }) }
  }
  ok(errs.length === 0, `${w} no JS errors ${errs.join(' | ')}`); ok(bad.length === 0, `${w} no 4xx ${bad.join(' | ')}`);
  await ctx.close();
}
await browser.close(); srv && srv.close(); console.log(fail ? `FAILED ${fail}` : 'ALL PASS'); process.exit(fail ? 1 : 0);
