// The PM's real journey: press WOP on a works order card for a code with no
// data, and be able to add it there and then.
const { chromium } = require('playwright');
const T=a=>a.join('\t');
const paste=[
 T(['TIB-9','TIBARD','0000863035','2','MOMOTS482295MM14IV','MOMO T-SHIRT NAVY M','8','2026-09-18','MOMO','WORKS ORDER','Tibard']),
 T(['TIB-8','TIBARD','0000863035','1','LOGOAPPLICATION','MOMO logo left chest','8','2026-09-18','MOMO','NOTE - charge or logo line','']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; const alerts=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file:///home/user/Tibard-Productionplan/index.html?edit'); await p.waitForTimeout(400);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(150);
 await p.evaluate(()=>{ window.confirm=()=>true; smTickAll(true); smCreateAllShown(); }); await p.waitForTimeout(200);

 // route 1: the WOP button on the works order card / modal
 const r1=await p.evaluate(()=>{
   let asked=null; window.confirm=(m)=>{asked=m; return true;}; window.alert=(m)=>{asked='ALERT: '+m;};
   const i=WOs.findIndex(w=>w.sm);
   printWOPTracked(i, WOs[i].items[0].code, WOs[i].items[0].qty);
   return {asked:asked?asked.slice(0,60):null, editorOpen:document.getElementById('styleEditModal').classList.contains('open'),
           code:document.getElementById('seCode').value};
 });
 console.log('WOP button route:', JSON.stringify(r1));

 // fill in and print from there
 const [pop]=await Promise.all([p.waitForEvent('popup'), p.evaluate(()=>{
   window.print=()=>{};
   document.getElementById('seName').value='MOMO t-shirt navy';
   document.getElementById('seFabrics').value='Navy single jersey | JER2201 | C4';
   document.getElementById('seTrims').value='Thread | Navy';
   smSaveStyle(true);
 })]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
 const doc=await pop.evaluate(()=>({t:document.title, fab:document.body.innerText.includes('JER2201'),
   logo:document.body.innerText.includes('MOMO logo left chest')}));
 console.log('printed after adding:', JSON.stringify(doc));
 await pop.close();

 const after=await p.evaluate(()=>({prints:smPrintable('MOMOTS482295MM14IV'), edits:Object.keys(styleEdits)}));
 console.log('now printable:', JSON.stringify(after));

 // viewers get a different message, not the editor
 await p.goto('file:///home/user/Tibard-Productionplan/index.html'); await p.waitForTimeout(400);
 const ro=await p.evaluate(()=>{ let m=null; window.alert=x=>{m=x;}; window.confirm=()=>true;
   return {msg:(printWOP('S-X','NOSUCHCODE',1,'')===false)?'refused':'printed', alert:m?m.slice(0,45):null}; });
 console.log('view-only:', JSON.stringify(ro));
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await b.close();
})();
