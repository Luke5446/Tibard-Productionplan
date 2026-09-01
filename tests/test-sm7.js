// The works order data editor must hold what the costing sheet holds:
// trims with Sage code / description / qty / cost, and fabrics the same way.
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file:///home/user/Tibard-Productionplan/index.html?edit'); await p.waitForTimeout(500);

 // opening a known style must merge the two old lists into one
 const merged=await p.evaluate(()=>{
   smOpenStyleEditor('OHCJSMCHESHIRE--01', null);
   return {fabCols:seFab[0]?seFab[0].length:0, trmCols:seTrm[0]?seTrm[0].length:0,
     labelsRow:seTrm.filter(t=>t[0]==='Labels')[0],
     fabRows:document.querySelectorAll('#seFabBox tbody tr').length,
     trmRows:document.querySelectorAll('#seTrmBox tbody tr').length,
     inputs:document.querySelectorAll('#seTrmBox input').length};
 });
 console.log('merged on open:', JSON.stringify(merged));
 console.log('  Labels row now carries code+cost:', merged.labelsRow && merged.labelsRow[3]==='LABELOH5771' && merged.labelsRow[4]===0.04335 ? 'PASS':'FAIL');

 // add a trim with no Sage code, as the costing sheet allows
 const added=await p.evaluate(()=>{
   seTrm.push(['Bias binding','Navy 12mm',2,'',0.031]); seRenderTrm();
   seFab.push(['Navy single jersey','JER2201','C4',1.4,2.15]); seRenderFab();
   smSaveStyle(false);
   const st=styleEdits['OHCJSMCHESHIRE--01'];
   return {trims:st.trims.length, fabrics:st.fabrics.length,
     newTrim:st.trims[st.trims.length-1], newFab:st.fabrics[st.fabrics.length-1]};
 });
 await p.waitForTimeout(150);
 console.log('saved unified:', JSON.stringify(added));

 // the printed works order shows the new columns
 const [pop]=await Promise.all([p.waitForEvent('popup'),
   p.evaluate(()=>{window.print=()=>{}; printWOP('S-TEST','OHCJSMCHESHIRE0101',5,'2026-09-20',null);})]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
 const doc=await pop.evaluate(()=>{
   const t=document.body.innerText;
   return {sageCol:t.includes('Sage code'), qtyCol:t.includes('Qty/unit'),
     labelCode:t.includes('LABELOH5771'), noCode:t.includes('no code yet'),
     fabCode:t.includes('JER2201'), fabQty:t.includes('1.4')};
 });
 console.log('printed doc:', JSON.stringify(doc));
 await pop.close();

 // the trim costs helper picks the edited list up
 const cost=await p.evaluate(()=>{
   document.getElementById('tcStyle').value='OHCJSMCHESHIRE--01'; renderTrimCosts();
   const t=document.getElementById('tcBody').innerText;
   return {hasBias:t.includes('Bias binding'), noCode:t.includes('no code yet'), hasTotal:/£/.test(t)};
 });
 console.log('trim costs helper:', JSON.stringify(cost));

 await p.reload(); await p.waitForTimeout(400);
 console.log('after reload:', JSON.stringify(await p.evaluate(()=>({edits:Object.keys(styleEdits).length,
   trims:(styleEdits['OHCJSMCHESHIRE--01']||{}).trims.length}))));
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await p.evaluate(()=>smOpenStyleEditor('OHCJSMCHESHIRE--01',null)); await p.waitForTimeout(250);
 await p.screenshot({path:'editor.png',fullPage:true});
 await b.close();
})();
