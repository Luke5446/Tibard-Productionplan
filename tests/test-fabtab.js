const { chromium } = require('playwright');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
// Three works orders completed on three days across two months:
//   A-A   20 Aug  OHAPP0534GD x10     -> 6 m CO5014DEN (All Costings, no marker)
//   S-B    1 Sep  OHCJMCHESHIRE3201 x5 -> 7.05 m PC14001 + 0.51 m MESH2290901 (per-size marker)
//   S-C    8 Sep  OHAPP0534GD x15 + ZZNOUSAGE x2 -> 9 m CO5014DEN, and one line with no usage on file
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(URL); await p.waitForTimeout(400);
 const stub=()=>{ window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); };
 await p.evaluate(stub);
 const mk=(ref,day,ta)=>p.evaluate(([ref,day,ta])=>{ window.now=()=>new Date(day+'T10:00:00');
   document.getElementById('woRef').value=ref; document.getElementById('woStart').value=day; document.getElementById('woDue').value=day; document.getElementById('woTA').value=ta; saveWO();
   completeWholeWO(WOs.findIndex(w=>w.ref===ref)); }, [ref,day,ta]);
 await mk('A-A','2026-08-20','OHAPP0534GD\t10');
 await mk('S-B','2026-09-01','OHCJMCHESHIRE3201\t5');
 await mk('S-C','2026-09-08','OHAPP0534GD\t15\nZZNOUSAGE\t2');
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-08T10:00:00'); });

 // the record froze a price per metre; the tab opens collapsed
 const t0=await p.evaluate(()=>{ smShowTab('fabric');
   const c=completedWOs.find(x=>x.ref==='S-B');
   return { price:c.fabric.price, meshPrice:c.fabric.extras[0].price, pcPrice:FABRIC_PRICES['PC14001'], badge:document.getElementById('fabTabCount').textContent,
     tabOn:document.getElementById('tabFabric').classList.contains('on'), months:[...document.querySelectorAll('#fabBody .sm-mon-h')].map(h=>h.textContent.trim().replace(/\s+/g,' ')),
     tables:document.querySelectorAll('#fabBody .sm-tbl').length, k:(()=>{const k=fabCompute(); return {today:k.today.metres, todayCost:Math.round(k.today.cost*100)/100, month:k.month.metres, open:k.open.lines, noFab:k.noFab, aug:k.months.find(m=>m.key==='2026-08').b.metres};})() }; });
 console.log('opens          ->', JSON.stringify(t0));
 // open September, then the 8th: day headers, then the table for that day only
 const t1=await p.evaluate(()=>{ fabToggle('mon','2026-09'); const days=[...document.querySelectorAll('#fabBody .fab-day-h')].map(h=>h.textContent.trim().replace(/\s+/g,' '));
   fabToggle('day','2026-09-08'); const rows=[...document.querySelectorAll('#fabBody .sm-tbl tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.trim().replace(/\s+/g,' ')));
   return {days, tables:document.querySelectorAll('#fabBody .sm-tbl').length, rows}; });
 console.log('expand         ->', JSON.stringify(t1));
 // tick the day: only its one exportable line; tick all: three
 const t2=await p.evaluate(()=>{ fabTickGroup('2026-09-08',true); const a=fabTickedLines().map(l=>l.ref); fabTickAll(true); const b=fabTickedLines().map(l=>l.ref); fabTickAll(false); fabTickGroup('2026-09-08',true);
   return {day:a, all:b, btn:document.querySelector('#fabBody .btn-p').textContent.trim().replace(/\s+/g,' '), pref:JSON.parse(localStorage.getItem('tibard_fab_sections')).mon}; });
 console.log('ticks          ->', JSON.stringify(t2));
 // export only what is ticked; the line is marked with the file; nothing ticked -> nothing exported
 const t3=await p.evaluate(async()=>{ let blob=null; URL.createObjectURL=b=>{blob=b; return 'blob:x';}; let dl=null; HTMLAnchorElement.prototype.click=function(){ dl=this.download; };
   exportFabricWriteOff(); const text=await blob.text(); const a1=window.__alerts.slice(); window.__alerts=[]; exportFabricWriteOff();
   const c=completedWOs.find(x=>x.ref==='S-C'&&x.code==='OHAPP0534GD');
   return {csv:text.split('\r\n').filter(Boolean), dl, a1, a2:window.__alerts, state:fabState(c), file:c.fabricExportFile, still:fabCompute().open.lines,
     row:[...document.querySelectorAll('#fabBody .sm-tbl tbody tr')].map(tr=>tr.children[10].textContent.trim().replace(/\s+/g,' '))}; });
 console.log('export         ->', JSON.stringify(t3));
 // dismiss and undo; an actual typed in the tab; undo export behind its warning
 const t4=await p.evaluate(()=>{ const ia=completedWOs.findIndex(x=>x.ref==='A-A'); fabDismiss(ia); const s1=fabState(completedWOs[ia]); const k1=fabCompute();
   fabUndoDismiss(ia); const s2=fabState(completedWOs[ia]);
   const ib=completedWOs.findIndex(x=>x.ref==='S-B'); fabSetActual(ib,'8'); const lb=fabLines().find(l=>l.ref==='S-B');
   const ic=completedWOs.findIndex(x=>x.ref==='S-C'&&x.code==='OHAPP0534GD'); fabUndoExport(ic);
   return {s1, augAfterDismiss:k1.months.find(m=>m.key==='2026-08').b.metres, augDismissed:k1.months.find(m=>m.key==='2026-08').b.dismissed, s2, actual:lb.actual, metres:lb.metres, varPct:Math.round(lb.varPct*10)/10, cost:Math.round(lb.cost*100)/100,
     monthAfter:fabCompute().month.metres, undone:fabState(completedWOs[ic]), open:fabCompute().open.lines}; });
 console.log('dismiss/undo   ->', JSON.stringify(t4));
 // the state survives a reload and a completion undo: an exported line put back and completed again stays exported
 await p.evaluate(()=>{ smShowTab('fabric'); fabTickGroup('2026-09-08',true); URL.createObjectURL=()=>'blob:x'; HTMLAnchorElement.prototype.click=function(){}; exportFabricWriteOff(); });
 await p.reload(); await p.waitForTimeout(500); await p.evaluate(stub); await p.evaluate(()=>{ window.now=()=>new Date('2026-09-08T10:00:00'); });
 const t5=await p.evaluate(()=>{ const c=completedWOs.find(x=>x.ref==='S-C'&&x.code==='OHAPP0534GD'); const before={state:fabState(c), file:c.fabricExportFile, actualB:completedWOs.find(x=>x.ref==='S-B').fabric.actual};
   undoCompleted(completedWOs.indexOf(c)); const wo=WOs.find(w=>w.ref==='S-C'); const item=wo.items[0];
   completeWholeWO(WOs.indexOf(wo)); const again=completedWOs.find(x=>x.ref==='S-C'&&x.code==='OHAPP0534GD');
   return {before, itemFlag:item.fabricExportedAt, after:fabState(again), file:again.fabricExportFile, open:fabCompute().open.lines}; });
 console.log('reload/reopen  ->', JSON.stringify(t5));
 // a viewer sees the ledger but no controls
 await p.goto(URL.replace('?edit','')); await p.waitForTimeout(500);
 const t6=await p.evaluate(()=>{ window.now=()=>new Date('2026-09-08T10:00:00'); loadState(); smShowTab('fabric'); fabOpen.mon['2026-09']=true; fabOpen.day['2026-09-08']=true; fabRender();
   return {inputs:document.querySelectorAll('#fabBody .sm-tbl input, #fabBody .sm-mon input, #fabBody .btn').length, states:[...document.querySelectorAll('#fabBody .fab-st')].map(e=>e.textContent).join('|'), lines:fabCompute().total}; });
 console.log('viewer         ->', JSON.stringify(t6));

 const pass = t0.price>0 && t0.price===t0.pcPrice && t0.meshPrice>0 && t0.badge==='3' && t0.tabOn && t0.months.length===2 && /Sept.*2026.*3 lines/.test(t0.months[0]) && /Aug.*2026.*1 line /.test(t0.months[1]) && t0.tables===0
   && t0.k.today===9 && t0.k.todayCost===Math.round(9*t0.k.todayCost/9*100)/100 && Math.abs(t0.k.month-16.56)<0.01 && t0.k.open===3 && t0.k.noFab===1 && t0.k.aug===6
   && t1.days.length===2 && /08 Sept 2026/.test(t1.days[0]) && t1.tables===1 && t1.rows.length===2 && t1.rows[0][1]==='S-C' && t1.rows[0][8]==='9.00' && /no usage on file/.test(t1.rows[1][4]) && t1.rows[1][10]==='Open'
   && t2.day.join()==='S-C' && t2.all.length===3 && /Export ticked \(CSV\) 1/.test(t2.btn) && t2.pref['2026-09']===true
   && t3.csv.length===2 && t3.csv[1]==='CO5014DEN,HOME,,9,Cutting,S-C,08/09/2026,Manual Reduction' && t3.dl==='Fabric_WriteOff_2026-09-08_1000.csv' && /1 write-off line/.test(t3.a1[0]) && /Tick the lines/.test(t3.a2[0])
   && t3.state==='exported' && t3.file===t3.dl && t3.still===2 && /^Exported.*08 Sept 2026/.test(t3.row[0])
   && t4.s1==='dismissed' && t4.augAfterDismiss===0 && t4.augDismissed===6 && t4.s2==='open' && t4.actual===8 && Math.abs(t4.metres-8.51)<0.01 && Math.abs(t4.varPct-13.5)<0.1 && t4.cost>0 && Math.abs(t4.monthAfter-17.51)<0.01 && t4.undone==='open' && t4.open===3
   && t5.before.state==='exported' && t5.before.file===t3.dl && t5.before.actualB===8 && t5.itemFlag==='2026-09-08' && t5.after==='exported' && t5.file===t3.dl && t5.open===2
   && t6.inputs===0 && /Exported/.test(t6.states) && t6.lines===4;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
