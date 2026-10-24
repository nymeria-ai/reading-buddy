// QA for the "para" text + boy/girl voice: node tools/shoot_para_gender.mjs  (serves the repo over http to avoid file:// fetch noise)
import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve(new URL('..', import.meta.url).pathname); const out = root + '/docs/shots'; fs.mkdirSync(out, { recursive: true });
const types = { html: 'text/html', webp: 'image/webp', png: 'image/png', mp3: 'audio/mpeg', json: 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'Content-Type': types[f.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) }).listen(0);
const url = `http://localhost:${srv.address().port}/index.html`;
const browser = await chromium.launch(); let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++ };
for (const [name, s] of Object.entries({ phone: { w: 390, h: 844, m: true }, desk: { w: 1440, h: 900, m: false } })) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: s.m, hasTouch: s.m, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = []; const bad = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()) });
  await page.goto(url + '?t=para'); await page.waitForTimeout(800);
  // ---- default = boy
  const g0 = await page.evaluate(() => ({ g: gnd(), hero: $('hero-say').textContent, h3: document.querySelector('[data-m*="קוֹרְאִים"]').textContent, sel: document.querySelector('#gender .sel')?.dataset.g, texts: [...document.querySelectorAll('#texts .btn')].map(b => b.textContent.trim()), parts: PARTS.length, thumbs: [...document.querySelectorAll('#parts img.thumb')].map(i => i.getAttribute('src')) }));
  ok(g0.g === 'm' && g0.sel === 'm' && g0.hero.includes('בּוֹא ') && g0.h3.includes('לְךָ'), `${name} default boy UI: ${g0.hero} / ${g0.h3}`);
  ok(g0.texts.some(t => t.includes('שׁוֹקוֹלָד פָּרָה')), `${name} para in library`);
  ok(g0.parts === 4 && g0.thumbs.length === 4, `${name} para 4 parts, thumbs ${g0.thumbs.join(',')}`);
  await page.screenshot({ path: `${out}/para-${name}-1-start-boy.png` });
  // every gendered line resolves to -m for boy
  const vm = await page.evaluate(() => Object.keys(VOICE).flatMap(k => VOICE[k].map((v, i) => [k, i, typeof v, vText(k, i), vSrc(k, i)])));
  ok(vm.filter(r => r[2] === 'object').every(r => r[4].endsWith('-m.mp3')), `${name} boy: all ${vm.filter(r => r[2] === 'object').length} gendered lines -> -m.mp3`);
  ok(vm.every(r => !/אַתְּ |בָּךְ|בּוֹאִי|אִתָּךְ|נַסִּי|סִיַּמְתְּ|קָרָאת /.test(r[3])), `${name} boy: no feminine text in any line`);
  // ---- read each part: scene shows, step through every syllable of every word
  for (let p = 0; p < 4; p++) {
    await page.evaluate(p => { sel = p; store.set('part', p); opts.mode = 'tap'; opts.syl = true; opts.snd = true }, p);
    await page.click('#go'); await page.waitForTimeout(400);
    const sc = await page.evaluate(() => ({ src: $('scene').getAttribute('src'), on: $('scene').classList.contains('on'), nat: $('scene').naturalWidth, say: $('say').textContent }));
    ok(sc.on && sc.src === `img/para/${p + 1}.webp` && sc.nat === 900, `${name} part ${p + 1} scene ${sc.src} ${sc.nat}px`);
    await page.click('#intro'); await page.waitForTimeout(400);
    if (p === 1) await page.screenshot({ path: `${out}/para-${name}-2-read-part2.png` });
    const steps = await page.evaluate(() => W.reduce((a, w) => a + w.syl.length, 0));
    let shot = false;
    for (let k = 0; k < steps + 5; k++) {
      const st = await page.evaluate(() => ({ on: $('s-read').classList.contains('on'), w: W[wi] && (W[wi].pre + W[wi].core + W[wi].post), html: $('word').innerHTML }));
      if (!st.on) break;
      if (!shot && st.w && /\d/.test(st.w)) { await page.screenshot({ path: `${out}/para-${name}-3-number.png` }); shot = true }
      await page.evaluate(() => { busy = false; nextStep() }); await page.waitForTimeout(k % 8 === 0 ? 470 : 20);
      await page.evaluate(() => new Promise(r => setTimeout(r, 0)));
      await page.waitForFunction(() => !busy, null, { timeout: 2000 }).catch(() => { });
    }
    await page.waitForTimeout(700);
    const end = await page.evaluate(() => ({ on: $('s-end').classList.contains('on'), title: $('end-title').textContent, body: $('end-body').innerText }));
    ok(end.on, `${name} part ${p + 1}: stepped ${steps} syllables to the end screen`);
    if (p === 0) { ok(end.title.includes('סִיַּמְתָּ') && end.body.includes('קָרָאתָ'), `${name} boy end: ${end.title} | ${end.body.split('\n')[0]}`); await page.screenshot({ path: `${out}/para-${name}-4-end-boy.png` }) }
    await page.click('#tohome'); await page.waitForTimeout(300);
  }
  // ---- switch to girl live (no reload)
  await page.click('#gender [data-g="f"]'); await page.waitForTimeout(200);
  const g1 = await page.evaluate(() => ({ g: gnd(), stored: localStorage.getItem('rb_gender'), hero: $('hero-say').textContent, h3: document.querySelector('[data-m*="קוֹרְאִים"]').textContent, ph: $('name').placeholder, intro: document.querySelector('#intro .bubble').textContent, srcs: Object.keys(VOICE).flatMap(k => VOICE[k].map((v, i) => [typeof v, vSrc(k, i), vText(k, i)])) }));
  ok(g1.g === 'f' && g1.stored === '"f"' && g1.hero.includes('בּוֹאִי') && g1.h3.includes('לָךְ') && g1.ph.includes('שֶׁלָּךְ') && g1.intro.includes('בּוֹאִי'), `${name} girl live swap: ${g1.hero} / ${g1.h3} / ${g1.intro}`);
  ok(g1.srcs.filter(r => r[0] === 'object').every(r => r[1].endsWith('-f.mp3')), `${name} girl: gendered lines -> -f.mp3`);
  await page.screenshot({ path: `${out}/para-${name}-5-start-girl.png` });
  // play a gendered line and check the audio element source actually requested
  await page.evaluate(() => { sel = 0; opts.mode = 'tap' }); await page.click('#go'); await page.waitForTimeout(900); await page.click('#intro'); await page.waitForTimeout(200);
  const sp = await page.evaluate(() => { pandaSay('stuck', 2); return { say: $('say').textContent, src: Object.keys(audioCache).filter(k => k.includes('stuck-2')) } });
  ok(sp.say.includes('בּוֹאִי') && sp.src.some(s => s.endsWith('stuck-2-f.mp3')), `${name} girl bubble+audio: ${sp.say} ${sp.src}`);
  await page.screenshot({ path: `${out}/para-${name}-6-read-girl.png` });
  await page.evaluate(() => { wi = W.length - 1; si = W[wi].syl.length - 1; busy = false; nextStep() }); await page.waitForTimeout(1200);
  const e2 = await page.evaluate(() => ({ title: $('end-title').textContent, body: $('end-body').innerText }));
  ok(e2.title.includes('סִיַּמְתְּ') && e2.body.includes('קָרָאת '), `${name} girl end: ${e2.title} | ${e2.body.split('\n')[0]}`);
  await page.screenshot({ path: `${out}/para-${name}-7-end-girl.png` });
  // back to boy for Gefen
  await page.click('#tohome'); await page.click('#gender [data-g="m"]');
  ok(await page.evaluate(() => gnd() === 'm' && $('hero-say').textContent.includes('בּוֹא ')), `${name} back to boy live`);
  // all audio files referenced exist
  const all = await page.evaluate(() => { const o = []; ['m', 'f'].forEach(g => { store.set('gender', g); Object.keys(VOICE).forEach(k => VOICE[k].forEach((_, i) => o.push(vSrc(k, i)))) }); store.set('gender', 'm'); return [...new Set(o)] });
  const missing = all.filter(f => !fs.existsSync(path.join(root, f)));
  ok(missing.length === 0, `${name} audio files exist (${all.length}) missing: ${missing.join(',')}`);
  ok(errs.length === 0, `${name} console errors: ${JSON.stringify(errs)}`);
  ok(bad.length === 0, `${name} http errors: ${JSON.stringify(bad)}`);
  await ctx.close();
}
await browser.close(); srv.close(); console.log(fail ? `${fail} FAILED` : 'ALL PASS'); process.exit(fail ? 1 : 0);
