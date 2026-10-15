// The lay the PM sets for a product the cutting room has no lay plan for
// (Luke, 14 Oct 2026): taken at one garment per ply until set; the prompt on
// the works order panel's "✎ lay" link; the plies and the 3 cm wastage in the
// standard metres following it; the panel, the Fabric tab list, the printed
// works order's "Lay (set in the planner)" row and the cutting time showing
// it; the setting surviving a reload and going out with publish; remove.
const { chromium } = require('playwright');
const path = require('path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; let fails=0;
 const ck=(n,ok,x)=>{ if(ok) console.log('  ok -',n); else { fails++; console.log('  FAIL -',n,x==null?'':JSON.stringify(x)); } };
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const URL='file://'+path.join(__dirname,'..','index.html')+'?edit';
 await p.goto(URL); await p.waitForTimeout(450);

 // SNSAPP052803: All Costings 1.1 m, no lay plan, no marker on its record
 const r1=await p.evaluate(()=>{
   const it={code:'SNSAPP052803', qty:10};
   const before={lay:cutLayFor('SNSAPP052803'), u:fabricUsageFor('SNSAPP052803').lay, rec:fabricRecordFor(it), plan:cutWoPlan([{code:'SNSAPP052803', qty:10}]), cell:fabricCellFor(0, it)};
   window.prompt=()=>'4'; window.alert=()=>{};
   layOverrideSet('SNSAPP052803');
   const after={lay:cutLayFor('SNSAPP052803'), u:fabricUsageFor('SNSAPP052803').lay, rec:fabricRecordFor(it), plan:cutWoPlan([{code:'SNSAPP052803', qty:10}]), cell:fabricCellFor(0, it), store:layOverrides.SNSAPP052803, std:fabricStd(1.1, 10, 4, 'SNSAPP052803')};
   let cap=''; window.open=function(){ return {document:{open(){},write:h=>{cap+=h;},close(){}}, focus(){}, print(){}, close(){}}; };
   printWOP('WO-T','SNSAPP052803',10,null,null);
   const m=cap.match(/LECTRA PATTERN<\/div><table>([\s\S]*?)<\/table>/); after.lectra=m ? m[1].replace(/<[^>]+>/g,'|').replace(/\|+/g,'|').replace(/&mdash;/g,'-') : 'none';
   smShowTab('fabric'); after.fabTab=(document.getElementById('fabView')||document.body).innerText.replace(/\s+/g,' ');
   return {before, after};
 });
 const B=r1.before, A=r1.after;
 ck('before: no lay plan, one garment per ply, 10 plies on 10, flagged on the cutting plan, link on the panel', B.lay.lay===1&&B.lay.src===''&&B.u===1&&B.rec.std===11.3&&B.rec.plies===10&&B.plan.lays===10&&B.plan.unknown.join()==='SNSAPP052803'&&/no lay plan/.test(B.cell)&&/layOverrideSet\('SNSAPP052803'\)/.test(B.cell)&&/&#9998; lay/.test(B.cell), B);
 ck('set to 4: kept against the product with the day, the lookup says so', A.store&&A.store.lay===4&&/^\d{4}-\d{2}-\d{2}$/.test(A.store.setAt)&&A.lay.lay===4&&A.lay.src==='set in the planner'&&A.u===4, [A.store,A.lay,A.u]);
 ck('standard follows: 10 at 1.1 m is 3 plies, 11.09 m; cutting plan 3 lays, nothing unknown', A.std===11.09&&A.rec.std===11.09&&A.rec.plies===3&&A.plan.lays===3&&A.plan.unknown.length===0, [A.std,A.rec,A.plan]);
 ck('panel shows 4 per ply (set here) with the link, no warning', /std 11\.09 m/.test(A.cell)&&/<b>4 per ply<\/b> \(set here\)/.test(A.cell)&&/&#9998; lay/.test(A.cell)&&!/no lay plan/.test(A.cell), A.cell);
 ck('print: Lay (set in the planner) row with the plies and wastage', /Lay \(set in the planner\)\|4 garments per ply - 3 plies for 10, plus 3 cm wastage per ply = 0\.09 m\|/.test(A.lectra), A.lectra);
 ck('Fabric tab lists it with a remove link', /Lays set in the planner/.test(A.fabTab)&&/SNSAPP052803 → 4 per ply remove/.test(A.fabTab), A.fabTab.match(/Lays set.{0,120}/));

 await p.reload(); await p.waitForTimeout(450);
 const r2=await p.evaluate(()=>{
   const kept={store:layOverrides.SNSAPP052803, lay:cutLayFor('SNSAPP052803')};
   if(!rows.length) rows=[{code:'ZZSEED',desc:'',qty:0}];   // publish refuses an empty buffer
   URL.createObjectURL=b=>{ b.text().then(t=>window.__pub=t); return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; window.alert=()=>{}; window.confirm=()=>true; publishData();
   return new Promise(res=>setTimeout(()=>{ rows=rows.filter(r=>r.code!=='ZZSEED'); res({kept, published:JSON.parse(window.__pub).layOverrides}); },250)); });
 ck('survives a reload', r2.kept.store&&r2.kept.store.lay===4&&r2.kept.lay.src==='set in the planner', r2.kept);
 ck('goes out with publish', r2.published&&r2.published.SNSAPP052803&&r2.published.SNSAPP052803.lay===4, r2.published);

 const r3=await p.evaluate(()=>{
   window.prompt=()=>'0'; window.alert=()=>{};
   layOverrideSet('SNSAPP052803');
   const zero={store:layOverrides.SNSAPP052803, lay:cutLayFor('SNSAPP052803')};
   window.prompt=()=>'5'; layOverrideSet('SNSAPP052803'); layOverrideClear('SNSAPP052803');
   const cleared={store:layOverrides.SNSAPP052803, lay:cutLayFor('SNSAPP052803'), plan:cutWoPlan([{code:'SNSAPP052803', qty:10}])};
   window.prompt=()=>'abc'; let alerted=''; window.alert=m=>{ alerted=m; }; layOverrideSet('SNSAPP052803');
   return {zero, cleared, alerted, still:layOverrides.SNSAPP052803};
 });
 ck('0 takes it off; remove on the Fabric tab too; back to one per ply and flagged', r3.zero.store===undefined&&r3.zero.lay.lay===1&&r3.cleared.store===undefined&&r3.cleared.lay.src===''&&r3.cleared.plan.unknown.join()==='SNSAPP052803', r3);
 ck('a figure that is not a whole number is refused', /Whole garments/.test(r3.alerted)&&r3.still===undefined, r3.alerted);

 // a sized style: the entry is kept against the record's code, so every size shares it
 const r4=await p.evaluate(()=>{ window.prompt=()=>'2'; window.alert=()=>{};
   const k=layKeyFor('OHCJMCHESHIRE3201'), before=cutLayFor('OHCJMCHESHIRE3201');
   if(before.src) return {k, before, skipped:true};
   layOverrideSet('OHCJMCHESHIRE3201'); const out={k, before, a:cutLayFor('OHCJMCHESHIRE3201'), b:cutLayFor('OHCJMCHESHIRE4801'), black:cutLayFor('OHCJMCHESHIRE4803'), keys:Object.keys(layOverrides)}; layOverrideClear(k); return out; });
 if(r4.skipped) console.log('  (Cheshire has a lay plan now: family check skipped)');
 else ck('one entry covers every size of the white Cheshire; the black record is its own', r4.k==='OHCJMCHESHIRE--01'&&r4.a.lay===2&&r4.b.lay===2&&r4.black.lay===1&&r4.keys.join()==='OHCJMCHESHIRE--01', r4);

 console.log('errors:', errs.length?errs.join(' | '):'none');
 console.log(fails?('FAILED '+fails):'ALL PASSED');
 await b.close(); process.exit(fails||errs.length?1:0);
})();
