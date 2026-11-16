const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
if (execFileSync('git', ['diff', '6fcd35b00356ed26bbb303f024ce6d82aa779176', '--', 'src'], {encoding:'utf8'}).trim()) throw new Error('Run on the H0 source revision to avoid overwriting baseline evidence.');
fs.mkdirSync('.tmp', {recursive:true});
const source = fs.readFileSync('e2e/helpers/h0-h3-fixture.ts', 'utf8');
fs.writeFileSync('.tmp/h0-h3-fixture.cjs', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
const { installH0H3Fixture } = require(path.resolve('.tmp/h0-h3-fixture.cjs'));
(async () => {
 const commit = execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
 const dir = 'docs/h0-h3-2026-11-16/baseline'; fs.mkdirSync(dir, {recursive:true});
 const browser = await chromium.launch({headless:true});
 const records = [];
 for (const width of [390,1440]) for (const [screen,route] of [['inicio','/home'],['partidos','/matches'],['ranking','/leaderboard'],['perfil','/player/profile']]) for (const state of ['data','empty','error','loading']) {
  if(screen === 'ranking' && width === 390 && state === 'data') { records.push({screen, route, viewport:{width,height:844},state,commit:'f6e2a64028aa22753acf200f1f853c15a872afba',environment:'local, development, datos demo identificados',screenshot:'../../../output/playwright/h5-stats/demo-390.png',reused:true}); continue; }
  const ctx = await browser.newContext({viewport:{width,height:844}}); const page = await ctx.newPage();
  const fixture = await installH0H3Fixture(page,state);
  try {
   await page.goto('http://127.0.0.1:8101'+route);
   await page.locator('app-metallic-bottom-nav').waitFor();
   if(state==='loading') await page.waitForTimeout(250); else { await page.waitForTimeout(400); await page.waitForLoadState('networkidle'); }
   if(!page.url().endsWith(route)) throw new Error('Unexpected route '+page.url());
   await page.evaluate(() => Promise.all(Array.from(document.images,img=>img.decode().catch(()=>undefined))));
   const filename = `${screen}-${state}-${width}.png`;
   await page.screenshot({path:path.join(dir,filename),fullPage:true});
   const body = await page.locator('body').innerText();
   const entry = {screen,route,viewport:{width,height:844},state,commit,environment:'local 8101, API interceptada, environmentName=test, sin demo',screenshot:filename,requests:fixture.requests,observed:body.replace(/\s+/g,' ').slice(0,2000)};
   if(screen==='perfil' && state==='data') { await page.locator('.player-command-center__stats').scrollIntoViewIfNeeded(); await page.screenshot({path:path.join(dir,`perfil-stats-${width}.png`),fullPage:true}); entry.detailScreenshot=`perfil-stats-${width}.png`; }
   records.push(entry); console.log('CAPTURED',screen,state,width);
  } catch(error) { records.push({screen,route,viewport:{width,height:844},state,commit,blocked:String(error)}); console.log('BLOCKED',screen,state,width,String(error)); }
  fixture.release(); await ctx.close();
 }
 await browser.close(); fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(records,null,2)+'\n');
 if(records.length !== 32) throw new Error("Incomplete H0 matrix"); if(records.some(r=>r.blocked)) process.exitCode=1;
})();
