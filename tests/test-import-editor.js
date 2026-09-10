// An export from the Works Order Editor (style-edits-changes-<date>.json): a new special from
// the costing app plus an edited stock style, with the charts they use alongside.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const exp = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures-editor-export.json'),'utf8'));
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+path.join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);

 // add an edited stock style to the export: the first baked-in style with its name changed
 const stock=await p.evaluate(()=>{const st=JSON.parse(JSON.stringify(STYLE_MASTER.styles[0]));st.name=(st.name||'')+' EDITED';st.trims=(st.trims||[]).map(r=>[r[0]||'',r[1]||'',r[2]==null?'':r[2],r[3]||'',null]);st.editedAt='2026-09-10';return st;});
 exp.styles.push(stock);
 const r=await p.evaluate(j=>{
   window.alert=m=>{window.__alert=m;};
   smOpenImport(); smDoImport(JSON.stringify(j));
   const ct=styleEdits['CT0001'], ed=styleEdits[j.styles[1].code.toUpperCase()];
   return {ct:!!ct, ctImported:!!(ct&&ct.importedAt), ctTrim:ct&&ct.trims[0], ctChart:ct&&ct.chart,
     chartRows:(chartEdits['CT0001-MEAS']||[]).length, chartCols:chartColEdits['CT0001-MEAS']||null,
     ctPrintable:smPrintable('CT0001'),
     ed:!!ed, edImported:!!(ed&&ed.importedAt), edName:ed&&ed.name, edResolves:styleForCode(j.styles[1].code.replace('--','40'))?styleForCode(j.styles[1].code.replace('--','40')).style.name:null,
     alert:window.__alert, listed:[...document.querySelectorAll('#smImportedList *')].some(e=>/CT0001/.test(e.textContent))};
 }, exp);
 console.log('CT0001:', JSON.stringify({saved:r.ct,imported:r.ctImported,chart:r.ctChart,chartRows:r.chartRows,chartCols:r.chartCols,printable:r.ctPrintable,listed:r.listed}));
 console.log('  first trim kept in editor shape ->', JSON.stringify(r.ctTrim));
 console.log('edited stock style:', JSON.stringify({saved:r.ed,listedAsImported:r.edImported,name:r.edName,resolvesToEdited:r.edResolves}));
 console.log('  alert:', (r.alert||'').split('\n').slice(0,4).join(' / '));

 const [pop]=await Promise.all([p.waitForEvent('popup'),
   p.evaluate(()=>{window.print=()=>{}; printWOP('S-TEST','CT0001',12,'2026-09-20',null);})]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(300);
 const doc=await pop.evaluate(()=>{const t=document.body.innerText; return {
   trimCode:t.includes('CMP-THR-EP80-09700-03'), noCost:!/3\.45048/.test(t), meas:t.includes('Inside leg length'),
   mfg:t.includes('Double turn hem'), fin:t.includes('Check, trim hem stitching'), customer:t.includes('Clean Linen')};});
 console.log('printed works order:', JSON.stringify(doc));
 await pop.screenshot({path:'tests/out/imported-editor-wo.png',fullPage:true}); await pop.close();

 await p.reload(); await p.waitForTimeout(400);
 console.log('after reload:', JSON.stringify(await p.evaluate(()=>({ct:!!styleEdits['CT0001'], printable:smPrintable('CT0001')}))));
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await b.close();
})();
