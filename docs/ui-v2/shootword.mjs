import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
const [d,sel,out]=process.argv.slice(2);
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1000,height:950},deviceScaleFactor:3})).newPage();
await p.goto('file://'+process.cwd()+`/mock-${d}.html`);await p.waitForTimeout(2000);
const el=await p.$(sel);const bb=await el.boundingBox();
await p.screenshot({path:out,clip:{x:bb.x-20,y:bb.y-20,width:bb.width+40,height:bb.height+40}});
await b.close();
