const { chromium } = require('playwright');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(URL); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-07T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); });
 const u=await p.evaluate(()=>({
   small:fabricUsageFor('OHCJMCHESHIRE3201'), large:fabricUsageFor('OHCJMCHESHIRE6401'),          // per size, with mesh
   twoUp:fabricUsageFor('OHCJSCUMBRIA3401'), flat:FABRIC_USAGE['OHCJMCHESHIRE6401'],              // averaged over a 2-garment marker; the flat figure it replaces
   apron:fabricUsageFor('OHAPP0534GD') }));                                                          // not a jacket: still All Costings
 console.log('lookups ->', JSON.stringify(u));
 // complete a 64" Cheshire x4 and check the record, the panel, the write-off lines and the KPI
 await p.evaluate(()=>{ document.getElementById('woRef').value='S-MK1'; document.getElementById('woStart').value='2026-09-01'; document.getElementById('woDue').value='2026-09-20';
   document.getElementById('woTA').value='OHCJMCHESHIRE6401\t4'; saveWO(); });
 const panel=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-MK1'); openWOModal(i); return document.querySelector('#woModalBody tr').children[5].textContent.trim().replace(/\s+/g,' '); });
 console.log('panel   ->', panel);
 const rec=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-MK1'); completeWholeWO(i); return completedWOs.find(c=>c.ref==='S-MK1').fabric; });
 console.log('record  ->', JSON.stringify(rec));
 const wo=await p.evaluate(async()=>{ let blob=null; URL.createObjectURL=b=>{blob=b; return 'blob:x';}; HTMLAnchorElement.prototype.click=function(){};
   exportFabricWriteOff(); return (await blob.text()).split('\r\n').filter(Boolean); });
 console.log('write-off ->', JSON.stringify(wo));
 const k=await p.evaluate(()=>{ const m=kpiCompute().months.find(x=>x.key==='2026-09'); return {fabStd:m.fabStd}; });
 console.log('kpi     ->', JSON.stringify(k));
 const pass = u.small.metres===1.41 && u.large.metres===1.73 && u.large.code==='PC14001' && /^marker/.test(u.large.source) && u.large.extras.length===1 && u.large.extras[0].code==='MESH2290901' && Math.abs(u.large.extras[0].metres-0.1018)<0.001
   && u.flat[1]===1.45 && u.twoUp.metres===1.13 && u.apron.source==='All Costings'
   && /std 6.92 m · PC14001 \+ 0.41 m MESH2290901/.test(panel)
   && rec.std===6.92 && rec.extras.length===1 && rec.extras[0].std===0.41 && rec.extras[0].code==='MESH2290901'
   && wo.length===3 && wo[1]==='PC14001,HOME,,6.92,Cutting,S-MK1,07/09/2026,Manual Reduction' && wo[2]==='MESH2290901,HOME,,0.41,Cutting,S-MK1,07/09/2026,Manual Reduction'
   && Math.abs(k.fabStd-7.33)<0.001;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
