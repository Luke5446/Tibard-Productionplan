const { chromium } = require('playwright');
const T=a=>a.join('\t');
const paste=[
 T(['OH-1','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN BIB APRON','12','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey','PO 9912','MALDON SALT']),
 T(['OH-2','OLIVER HARVEY','0000114816','3','OHCJSCUMBRIA3603','CUMBRIA CHEF JACKET 36','6','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey','PO 9912','MALDON SALT']),
 T(['TIB-1','TIBARD','0000862833','1','CT01964601','CHEF TROUSERS BLACK 32R','20','2026-09-30','KLONDYKE','WORKS ORDER','Tibard','','KLONDYKE']),
].join('\n');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
const shape=()=>({
  banners:[...document.querySelectorAll('.sm-bh .ttl')].map(x=>x.textContent.trim()),
  chevrons:[...document.querySelectorAll('.sm-bh .cv')].map(x=>x.textContent.trim()),
  pendRows:document.querySelectorAll('#smPendingList .sm-tbl tbody tr').length,
  liveRows:document.querySelectorAll('#smList .sm-tbl tbody tr').length});

(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(URL); await p.waitForTimeout(400);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(200);

 // raise one of the three, so both lists have something in them
 await p.evaluate(()=>{window.confirm=()=>true;
   smPending.forEach((o,i)=>smTick(o.key, i===0)); smCreateAllShown();}); await p.waitForTimeout(250);

 const open=await p.evaluate(shape);
 console.log('banners:', JSON.stringify(open.banners));
 console.log('open  ->', JSON.stringify({chevrons:open.chevrons, pendRows:open.pendRows, liveRows:open.liveRows}));

 // the live list carries no action buttons any more
 const clean=await p.evaluate(()=>({
   heads:[...document.querySelectorAll('#smList .sm-tbl thead th')].map(h=>h.textContent.trim()),
   controls:document.querySelectorAll('#smList .sm-tbl button, #smList .sm-tbl a').length,
   cells:document.querySelector('#smList .sm-tbl tbody tr').children.length}));
 console.log('live columns:', JSON.stringify(clean.heads));
 console.log('  Document column gone:', clean.heads.includes('Document')?'FAIL':'PASS',
             '| buttons or links in the table:', clean.controls, '| cells per row:', clean.cells);

 // clicking a banner collapses just that section
 await p.evaluate(()=>document.querySelectorAll('.sm-bh')[1].click()); await p.waitForTimeout(120);
 console.log('live shut  ->', JSON.stringify(await p.evaluate(shape)));
 await p.evaluate(()=>document.querySelectorAll('.sm-bh')[0].click()); await p.waitForTimeout(120);
 console.log('both shut  ->', JSON.stringify(await p.evaluate(shape)));

 // and the choice survives a reload
 await p.reload(); await p.waitForTimeout(500);
 await p.click('#tabSpecial'); await p.waitForTimeout(200);
 console.log('reloaded   ->', JSON.stringify(await p.evaluate(shape)));

 // a button inside a banner acts without collapsing the section
 await p.evaluate(()=>document.querySelectorAll('.sm-bh')[0].click()); await p.waitForTimeout(150);
 await p.evaluate(()=>[...document.querySelectorAll('.sm-bh .act button')]
   .find(x=>/Tick all/.test(x.textContent)).click()); await p.waitForTimeout(150);
 const after=await p.evaluate(()=>({rows:document.querySelectorAll('#smPendingList .sm-tbl tbody tr').length,
   ticked:smPending.filter(o=>o.included).length}));
 console.log('Tick all inside the banner ->', JSON.stringify(after), '(rows must stay > 0)');

 // the works order document now lives on the works order panel
 const panel=await p.evaluate(()=>{
   const i=WOs.findIndex(w=>w.sm); openWOModal(i);
   return {offered:/Link file/.test(document.getElementById('woModalMeta').textContent), ref:WOs[i].ref};
 });
 await p.evaluate(r=>{ smDocs[r]={name:r+'.xlsx',at:'2026-09-01'};
   openWOModal(WOs.findIndex(w=>w.ref===r)); }, panel.ref);
 const linked=await p.evaluate(()=>{ const a=document.querySelector('#woModalMeta a[target=_blank]');
   return a?{text:a.textContent.trim(), href:a.getAttribute('href')}:null; });
 console.log('works order panel: Link file offered =', panel.offered, '| once linked:', JSON.stringify(linked));

 console.log('errors:', errs.length?errs.join('\n'):'none');
 await b.close();
})();
