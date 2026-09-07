const { chromium } = require('playwright');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
// OHCJSCUMBRIA5601 is 1.55 m in All Costings; ZZNOUSAGE is in nothing.
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(URL); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-08T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); });
 const u=await p.evaluate(()=>({cumbria:fabricUsageFor('ohcjscumbria5601'), none:fabricUsageFor('ZZNOUSAGE'), count:Object.keys(FABRIC_USAGE).length}));
 console.log('usage lookup   ->', JSON.stringify(u));
 // a works order with one costed line and one unknown line
 await p.evaluate(()=>{ document.getElementById('woRef').value='S-FAB1'; document.getElementById('woStart').value='2026-09-01'; document.getElementById('woDue').value='2026-09-20';
   document.getElementById('woTA').value='OHCJSCUMBRIA5601\t6\nZZNOUSAGE\t2'; saveWO(); });
 const panel=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-FAB1'); openWOModal(i);
   const cells=[...document.querySelectorAll('#woModalBody tr')].map(tr=>tr.children[5].textContent.trim().replace(/\s+/g,' '));
   const ph=[...document.querySelectorAll('#woModalBody input[type=number]')].map(x=>x.placeholder);
   return {i, header:[...document.querySelectorAll('#woModal thead th')].map(t=>t.textContent.trim()), cells, placeholders:ph}; });
 console.log('panel          ->', JSON.stringify(panel));
 // the cutting room types an actual on the costed line, and survives a reload
 await p.evaluate(i=>{ setMetresActual(i,'OHCJSCUMBRIA5601','10.1'); }, panel.i);
 await p.reload(); await p.waitForTimeout(500);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-08T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); });
 const kept=await p.evaluate(()=>WOs.find(w=>w.ref==='S-FAB1').items.map(it=>it.code+':'+it.metresActual));
 console.log('after reload   ->', JSON.stringify(kept));
 // complete -> the record carries standard and actual
 const rec=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-FAB1'); completeWholeWO(i);
   return completedWOs.filter(c=>c.ref==='S-FAB1').map(c=>({code:c.code, fabric:c.fabric})); });
 console.log('completed      ->', JSON.stringify(rec));
 // write-off export: capture the .xlsx, save it for an independent check, second run has nothing
 const xl=await p.evaluate(async()=>{ let blob=null; URL.createObjectURL=b=>{blob=b; return 'blob:x';}; HTMLAnchorElement.prototype.click=function(){};
   exportFabricWriteOff(); const buf=blob? Array.from(new Uint8Array(await blob.arrayBuffer())) : null; const first=window.__alerts.slice(); window.__alerts=[];
   exportFabricWriteOff(); return {buf, type:blob&&blob.type, first, second:window.__alerts, marked:completedWOs.filter(c=>c.fabricExportedAt).length}; });
 require('fs').mkdirSync(__dirname+'/out',{recursive:true}); require('fs').writeFileSync(__dirname+'/out/writeoff.xlsx', Buffer.from(xl.buf));
 console.log('write-off xlsx ->', xl.buf.length, 'bytes', xl.type); console.log('  alerts:', JSON.stringify(xl.first), '| again:', JSON.stringify(xl.second), '| marked:', xl.marked);
 // KPI columns
 const k=await p.evaluate(()=>{ smShowTab('kpi'); const m=kpiCompute().months.find(x=>x.key==='2026-09');
   const row=[...document.querySelectorAll('.kpi-tbl tbody tr')].find(tr=>tr.children[0].textContent.startsWith('Sept'));
   return {fabStd:m.fabStd, fabAct:m.fabAct, fabVar:m.fabVar, fabLines:m.fabLines, fabMissing:m.fabMissing, heads:[...document.querySelectorAll('.kpi-tbl thead th')].map(t=>t.textContent.trim()).slice(4,8), cells:[...row.children].map(td=>td.textContent.trim().replace(/\s+/g,' ')).slice(4,8)}; });
 console.log('kpi            ->', JSON.stringify(k));
 const f=rec.find(r=>r.code==='OHCJSCUMBRIA5601').fabric, g=rec.find(r=>r.code==='ZZNOUSAGE').fabric;

 const pass = u.cumbria && u.cumbria.metres===1.55 && u.cumbria.code && u.none===null && u.count>8000
   && panel.header.includes('Metres cut') && panel.placeholders[0]==='9.3' && /no usage on file/.test(panel.cells[1])
   && kept.join()==='OHCJSCUMBRIA5601:10.1,ZZNOUSAGE:undefined'
   && f && f.std===9.3 && f.actual===10.1 && f.perGarment===1.55 && f.source==='All Costings' && g===null
   && xl.buf && xl.buf.length>1500 && /spreadsheetml/.test(xl.type) && xl.marked===1
   && /1 write-off line\(s\) from 1 completed line\(s\), 10 m/.test(xl.first[0]) && /skipped/.test(xl.first[0]) && /Nothing new/.test(xl.second[0])
   && k.fabStd===9.3 && k.fabAct===10.1 && Math.abs(k.fabVar-8.6)<0.1 && k.fabLines===1 && k.fabMissing===1 && k.heads[2]==='Fabric m' && k.cells[2].startsWith('9') && k.cells[3]==='+8.6%';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
