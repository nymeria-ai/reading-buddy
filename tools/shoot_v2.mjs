// UI v2 (Direction A) QA: node tools/shoot_v2.mjs [base-url]
// Serves the repo over http (or uses the given URL), shoots home / settings / reading / milestone / finish
// at 360, 390, 430, 768, 1024 (+1180 landscape), boy + girl, and asserts layout invariants.
import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve(new URL('..', import.meta.url).pathname); const out = root + '/docs/shots/v2'; fs.mkdirSync(out, { recursive: true });
const types = { html: 'text/html', webp: 'image/webp', png: 'image/png', mp3: 'audio/mpeg', json: 'application/json' };
let srv, base = process.argv[2];
if (!base) { srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'Content-Type': types[f.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) }).listen(0); base = `http://localhost:${srv.address().port}/index.html` }
const browser = await chromium.launch(); let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++ };
const sizes = [[360, 740, 1], [390, 844, 1], [430, 932, 1], [768, 1024, 1], [1024, 1366, 1], [1180, 820, 0]];
const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
// layout probe for the reading screen
const probe = () => {
  const R = id => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } };
  const word = $('word'), card = $('card');
  const sy = [...word.querySelectorAll('.syl,.punct')].map(e => e.getBoundingClientRect());
  const wl = Math.min(...sy.map(b => b.left)), wr = Math.max(...sy.map(b => b.right));
  return { vw: innerWidth, vh: innerHeight, docScroll: document.scrollingElement.scrollHeight, readScroll: $('s-read').scrollHeight, card: R('card'), word: R('word'), wl, wr, buddy: R('buddy-img'), say: R('say'), sayOn: $('say').classList.contains('show'), controls: R('controls'), ctx: R('ctx'), heard: R('heard'), fs: parseFloat(getComputedStyle(word).fontSize), scene: R('scene'), sceneOn: getComputedStyle($('scene')).display !== 'none', split: SPLIT };
};
const over = (a, b) => a && b && a.w > 0 && b.w > 0 && a.l < b.r - 1 && a.r > b.l + 1 && a.t < b.b - 1 && a.b > b.t + 1;
for (const [w, h, mob] of sizes) {
  if (only && !only.includes(w)) continue;
  for (const g of (w === 390 ? ['m', 'f'] : ['m'])) {
    const tag = `${w}-${g}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: !!mob, hasTouch: !!mob, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); const errs = []; const bad = [];
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
    page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()) });
    await page.goto(base + '?t=para'); await page.waitForTimeout(900); await page.evaluate(() => document.fonts.ready);
    // fresh state + some history so home shows done/today/streak
    await page.evaluate(g => { localStorage.clear(); store.set('gender', g); store.set('name', g === 'f' ? 'נוֹעָה' : 'גֶּפֶן'); store.set('best', { 'para:0': { times: 3, secs: 160, last: 150 }, 'para:1': { times: 1, secs: 190, last: 190 } }); store.set('part', 2); store.set('xp', 120); const d = new Date(); d.setDate(d.getDate() - 1); store.set('streak', { last: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), n: 3 }); store.set('text', 'para') }, g);
    await page.reload(); await page.waitForTimeout(900); await page.evaluate(() => document.fonts.ready);
    const home = await page.evaluate(() => ({ font: getComputedStyle(document.body).fontFamily, rubik: document.fonts.check('900 40px Rubik'), hero: $('hero-say').textContent, av: $('av-name').textContent, streak: $('streak-n').textContent, xp: $('xp-n').textContent, sub: $('book-sub').textContent, bar: $('book-bar').style.width, parts: [...document.querySelectorAll('#parts .part')].map(p => p.className + '|' + p.innerText.replace(/\n/g, ' ')), hScroll: document.getElementById('s-start').scrollWidth > innerWidth + 1, go: (() => { const b = $('go').getBoundingClientRect(); return b.bottom <= innerHeight && b.top > 0 && $('go').scrollWidth <= $('go').clientWidth + 1 })(), topbar: (() => { const b = $('topbar').getBoundingClientRect(); return b.right <= innerWidth && b.left >= 0 })() }));
    ok(home.rubik, `${tag} Rubik 900 loaded`);
    ok(home.hero.includes(g === 'f' ? 'בּוֹאִי' : 'בּוֹא ') && home.av.length > 1 && home.streak === '3' && home.xp === '120', `${tag} home top bar/hero: ${home.av} 🔥${home.streak} ⭐${home.xp} | ${home.hero}`);
    ok(home.sub.includes(g === 'f' ? 'קָרָאת' : 'קָרָאתָ') && home.bar === '50%', `${tag} book card: ${home.sub} bar ${home.bar}`);
    ok(home.parts.length === 5 && home.parts[0].includes('done') && home.parts[2].includes('sel'), `${tag} parts: ${home.parts.join(' / ')}`);
    ok(!home.hScroll && home.go && home.topbar, `${tag} home: no h-scroll, CTA visible & unclipped, top bar in view`);
    await page.screenshot({ path: `${out}/${tag}-1-home.png` });
    // settings sheet
    await page.click('#gear'); await page.waitForTimeout(350);
    const sh = await page.evaluate(() => ({ on: $('sheet').classList.contains('on'), name: $('name').value, gsel: document.querySelector('#gender .sel')?.dataset.g, h: document.querySelector('[data-m*="קוֹרְאִים"]').textContent, texts: document.querySelectorAll('#texts .card').length, inView: (() => { const b = document.querySelector('#sheet .in').getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight + 1 })() }));
    ok(sh.on && sh.gsel === g && sh.texts >= 2 && sh.inView && sh.h.includes(g === 'f' ? 'לָךְ' : 'לְךָ'), `${tag} settings sheet: gender=${sh.gsel} "${sh.h}" texts=${sh.texts}`);
    await page.screenshot({ path: `${out}/${tag}-2-settings.png` });
    if (w === 390 && g === 'm') { await page.click('#add'); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/${tag}-2b-settings-add.png` }); await page.click('#add') }
    // turn on sentence for the read check
    await page.evaluate(() => { const c = $('o-ctx'); if (!c.checked) c.click() });
    await page.click('#sheet-ok'); await page.waitForTimeout(250);
    // read: tap mode, part 3
    await page.evaluate(() => { opts.mode = 'tap'; document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('sel', x.dataset.mode === 'tap')) });
    await page.click('#go'); await page.waitForTimeout(700);
    const intro = await page.evaluate(() => ({ on: $('intro').classList.contains('on'), txt: document.querySelector('#intro .go').textContent, say: $('say').textContent }));
    ok(intro.on && intro.txt.includes(g === 'f' ? 'בּוֹאִי' : 'בּוֹא '), `${tag} scene intro: ${intro.txt}`);
    await page.screenshot({ path: `${out}/${tag}-3-intro.png` });
    await page.click('#intro'); await page.waitForTimeout(2600);
    for (let i = 0; i < 4; i++) { await page.click('#next'); await page.waitForTimeout(480) }
    // mid-word with a syllable highlighted
    await page.evaluate(() => { while (W[wi].syl.length < 3 && wi < W.length - 2) wi++; si = 1; FS = FS; render() });
    await page.waitForTimeout(150);
    await page.evaluate(() => pandaSay('cheer', 3, true)); await page.waitForTimeout(300);
    let P = await page.evaluate(probe);
    const hl = await page.evaluate(() => ({ now: document.querySelector('#word .syl.now')?.textContent, past: document.querySelectorAll('#word .syl.past').length, fut: document.querySelectorAll('#word .syl.fut').length, cnt: $('wcount').textContent, ctxc: document.querySelector('#ctx .w.c')?.textContent }));
    ok(hl.now && hl.past === 1 && hl.cnt.startsWith('מִלָּה') && hl.ctxc, `${tag} syllable highlight now="${hl.now}" past=${hl.past} fut=${hl.fut} | ${hl.cnt} | ctx="${hl.ctxc}"`);
    const chk = P => {
      ok(P.readScroll <= P.vh + 1 && P.docScroll <= P.vh + 1, `${tag} reading: no scroll (${P.readScroll}/${P.vh})`);
      ok(P.wl >= P.card.l + 2 && P.wr <= P.card.r - 2, `${tag} word inside card (word ${Math.round(P.wl)}-${Math.round(P.wr)} card ${Math.round(P.card.l)}-${Math.round(P.card.r)}) fs=${P.fs}`);
      ok(!over(P.buddy, P.card) && !(P.sayOn && over(P.say, P.card)), `${tag} panda/bubble never cover the word card`);
      ok(!over(P.buddy, P.ctx) && !over(P.buddy, P.heard) && !(P.sayOn && (over(P.say, P.ctx) || over(P.say, P.heard))), `${tag} panda/bubble clear of sentence + heard pill`);
      ok(!P.sayOn || (P.say.w > 60 && P.say.l >= 0 && P.say.r <= P.vw), `${tag} bubble sane width ${Math.round(P.say.w)}`);
      ok(P.card.t >= 0 && P.controls.t >= P.card.b - 1 && (!P.ctx || P.ctx.h === 0 || P.ctx.b <= P.controls.t + 1), `${tag} bands ordered, card/ctx above controls`);
      ok(P.fs >= (P.vw < 380 ? 48 : P.vw < 400 ? 52 : P.vw < 900 ? 58 : 72), `${tag} word size ${P.fs}px split=${P.split}`);
      ok(P.controls.b <= P.vh + 1, `${tag} controls in view`);
      if (P.vw >= 900) ok(P.sceneOn && P.scene.l >= P.card.r - 1 && P.buddy.r <= P.card.l + 1, `${tag} iPad 3 columns RTL (scene | card | panda)`);
    };
    chk(P);
    await page.screenshot({ path: `${out}/${tag}-4-read.png` });
    // nikud check: word glyph ink must stay inside the card vertically (render with canvas measure)
    const nk = await page.evaluate(() => { const c = document.createElement('canvas').getContext('2d'); c.font = `900 ${FS}px Rubik`; let worst = 0; for (const w of W) { const m = c.measureText(w.syl.join('')); worst = Math.max(worst, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) } const lh = FS * 1.65; return { worst: Math.round(worst), lh: Math.round(lh) } });
    ok(nk.worst <= nk.lh, `${tag} nikud fits line box (ink ${nk.worst}px ≤ line ${nk.lh}px)`);
    // every word of the part: none overflows the card at the uniform size
    const ovf = await page.evaluate(() => { const bad = []; const save = [wi, si]; for (let k = 0; k < W.length; k++) { wi = k; si = 0; render(); const c = $('card').getBoundingClientRect(); const s = [...$('word').querySelectorAll('.syl,.punct')].map(e => e.getBoundingClientRect()); if (Math.min(...s.map(b => b.left)) < c.left || Math.max(...s.map(b => b.right)) > c.right) bad.push(W[k].core) } [wi, si] = save; render(); return bad });
    ok(ovf.length === 0, `${tag} all ${'words'} fit the card: ${ovf.join(',')}`);
    // milestone
    await page.evaluate(() => { wi = 9; si = W[9].syl.length - 1; busy = false; render(); nextStep() });
    await page.waitForTimeout(900);
    const ms = await page.evaluate(() => { const c = document.querySelector('#big .mcard').getBoundingClientRect(), im = document.querySelector('#big .mcard img').getBoundingClientRect(); return { on: $('big').classList.contains('on'), t: document.querySelector('#big .t').textContent, sub: document.querySelector('#big .sub').textContent, talking, imgTop: im.top, cb: c.bottom } });
    ok(ms.on && ms.sub.length > 3 && ms.imgTop >= 0 && ms.cb <= h, `${tag} milestone: "${ms.t}" / "${ms.sub}" panda top ${Math.round(ms.imgTop)}`);
    if (g === 'f') ok(!/אַתָּה|שַׂחְקָן |קָרָאתָ/.test(ms.t + ms.sub), `${tag} milestone feminine`); else ok(!/אַתְּ|קָרָאת /.test(ms.t + ms.sub), `${tag} milestone masculine`);
    await page.screenshot({ path: `${out}/${tag}-5-milestone.png` });
    await page.waitForTimeout(3200);
    ok(await page.evaluate(() => !$('big').classList.contains('on')), `${tag} milestone auto-closes (3.3s)`);
    // smart-mic mode layout (heard pill visible) – no network, just layout
    await page.evaluate(() => { $('s-read').classList.add('micmode'); $('mic').style.display = 'flex'; $('heard').textContent = '🎧 שׁוֹקוֹלָד'; FS = 0; render() }); await page.waitForTimeout(100);
    P = await page.evaluate(probe); chk(P);
    ok(!over(P.heard, P.buddy) && P.heard.b <= P.controls.t, `${tag} mic layout: heard pill clear of panda/controls`);
    await page.screenshot({ path: `${out}/${tag}-4b-read-mic.png` });
    await page.evaluate(() => { $('s-read').classList.remove('micmode'); $('mic').style.display = 'none'; $('heard').textContent = ''; FS = 0; render() });
    // finish
    await page.evaluate(() => { wi = W.length - 1; si = W[wi].syl.length - 1; busy = false; nextStep() }); await page.waitForTimeout(1300);
    const fin = await page.evaluate(() => ({ on: $('s-end').classList.contains('on'), title: $('end-title').textContent, stats: [...document.querySelectorAll('#end-body .stat')].map(s => s.innerText.replace(/\n/g, ' ')), btn: (() => { const b = $('again').getBoundingClientRect(); return b.bottom <= innerHeight })(), streak: store.get('streak', {}).n, xp: store.get('xp', 0) }));
    ok(fin.on && fin.stats.length === 4 && fin.btn, `${tag} finish 2x2: ${fin.title} | ${fin.stats.join(' / ')}`);
    ok(fin.title.includes(g === 'f' ? 'סִיַּמְתְּ' : 'סִיַּמְתָּ') && fin.stats[0].includes(g === 'f' ? 'קָרָאת' : 'קָרָאתָ'), `${tag} finish gender`);
    ok(fin.streak === 4 && fin.xp > 120, `${tag} streak bumped to ${fin.streak}, xp ${fin.xp}`);
    await page.screenshot({ path: `${out}/${tag}-6-finish.png` });
    // reload persistence
    await page.click('#tohome'); await page.waitForTimeout(200); await page.reload(); await page.waitForTimeout(900);
    const per = await page.evaluate(() => ({ g: gnd(), name: $('av-name').textContent, streak: $('streak-n').textContent, xp: +$('xp-n').textContent, ctx: $('o-ctx').checked, t: curText.id, part: sel, times: store.get('best', {})['para:2']?.times }));
    ok(per.g === g && per.streak === '4' && per.xp > 120 && per.ctx && per.t === 'para' && per.part === 2 && per.times === 1, `${tag} reload persistence ${JSON.stringify(per)}`);
    ok(errs.length === 0, `${tag} console errors: ${JSON.stringify(errs)}`);
    ok(bad.length === 0, `${tag} http errors: ${JSON.stringify(bad)}`);
    await ctx.close();
  }
}
await browser.close(); srv && srv.close(); console.log(fail ? `${fail} FAILED` : 'ALL PASS'); process.exit(fail ? 1 : 0);
