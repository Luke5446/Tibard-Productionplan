const { chromium } = require('playwright');
const T=a=>a.join('\t');
const sm=[
 T(['OH-1','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN BIB APRON','12','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey','PO 9912','MALDON SALT']),
 T(['OH-2','OLIVER HARVEY','0000114816','3','OHCJSCUMBRIA3603','CUMBRIA CHEF JACKET 36','6','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey','PO 9912','MALDON SALT']),
].join('\n');
// buffer paste: code, desc, inStock, onSOP, onPOP, 1m, 3m, 6m, 12m
const buf=[T(['OHAPP054415','APRON A','5','0','0','10','30','60','120']), T(['APP300503','APRON B','0','0','0','5','15','30','60'])].join('\n');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';

(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(URL); await p.waitForTimeout(400);
 // pin the clock so the stamps are exact
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-04T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });

 // route 1: manual form
 const r1=await p.evaluate(()=>{ document.getElementById('woRef').value='S-TEST1'; document.getElementById('woStart').value='2026-09-01';
   document.getElementById('woDue').value='2026-09-20'; document.getElementById('woTA').value='OHAPP054415\t7'; saveWO();
   const w=WOs.find(x=>x.ref==='S-TEST1'); return {createdAt:w&&w.createdAt, start:w&&w.start}; });
 console.log('manual form      ->', JSON.stringify(r1));

 // route 2: create from the buffer table
 await p.evaluate(t=>{document.getElementById('pasteTA').value=t; loadPaste();},buf); await p.waitForTimeout(200);
 const r2=await p.evaluate(()=>{ rows.forEach(r=>{r.included=true; r.actWop=Math.max(1,Math.round(r.actWop||5));});
   document.getElementById('createStart').value='2026-09-02'; document.getElementById('createDue').value='2026-09-25';
   const before=WOs.length; doCreateWOs(); const made=WOs.slice(before); return made.map(w=>w.ref+':'+w.createdAt); });
 console.log('from buffer      ->', JSON.stringify(r2));

 // route 3: special makes, single and batch
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},sm); await p.waitForTimeout(200);
 const r3=await p.evaluate(()=>{ const seen=smPending.map(o=>o.seenAt);
   smCreate(smPending[0].key); smTickAll(true); smCreateAllShown();
   return {seenAt:seen, wos:WOs.filter(w=>w.sm).map(w=>w.ref+' created:'+w.createdAt+' seen:'+w.sm.seenAt), made:smMade.map(m=>m.ref+' seen:'+m.seenAt+' raised:'+m.raisedAt)}; });
 console.log('special makes    ->', JSON.stringify(r3));

 // route 4: split inherits the parent's date, even days later
 const r4=await p.evaluate(()=>{ window.now=()=>new Date('2026-09-10T10:00:00'); window.prompt=()=>'3';
   const i=WOs.findIndex(w=>w.ref==='S-TEST1'); splitWO(i); const n=WOs[WOs.length-1];
   return {parent:WOs[i].createdAt, child:n.createdAt, childRef:n.ref, sameDay:n.createdAt===WOs[i].createdAt}; });
 console.log('split            ->', JSON.stringify(r4));

 // route 5: completion carries createdAt + printedAt into history
 const r5=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-TEST1'); window.print=()=>{};
   printWOPTracked(i,'OHAPP054415',4); window.now=()=>new Date('2026-09-12T10:00:00');
   const idx=WOs.findIndex(w=>w.ref==='S-TEST1'); completeWholeWO(idx);
   const c=completedWOs.find(x=>x.ref==='S-TEST1'); return c&&{createdAt:c.createdAt, printedAt:c.printedAt, completed:c.completed, leadDays:(new Date(c.completed)-new Date(c.createdAt))/864e5}; });
 console.log('completed record ->', JSON.stringify(r5));

 // route 6: re-open keeps the recorded date; a legacy record with none stays blank
 const r6=await p.evaluate(()=>{ const idx=completedWOs.findIndex(x=>x.ref==='S-TEST1'); undoCompleted(idx);
   const w=WOs.find(x=>x.ref==='S-TEST1');
   completedWOs.push({ref:'WO-OLD',code:'APP300503',desc:'legacy',qty:1,start:'2026-06-01',due:'2026-06-10',completed:'2026-06-09'});
   undoCompleted(completedWOs.length-1); const o=WOs.find(x=>x.ref==='WO-OLD');
   return {reopened:w&&w.createdAt, legacy:o&&o.createdAt}; });
 console.log('re-open          ->', JSON.stringify(r6));

 // survives a reload
 await p.reload(); await p.waitForTimeout(500);
 const r7=await p.evaluate(()=>({ live:WOs.filter(w=>w.createdAt).length+'/'+WOs.length, sm:WOs.filter(w=>w.sm).every(w=>w.sm.seenAt), made:smMade.every(m=>m.seenAt&&m.raisedAt) }));
 console.log('after reload     ->', JSON.stringify(r7));

 const pass = r1.createdAt==='2026-09-04' && r2.every(x=>x.endsWith('2026-09-04')) && r3.seenAt.every(x=>x==='2026-09-04')
   && r4.sameDay && r5 && r5.createdAt==='2026-09-04' && r5.printedAt==='2026-09-10' && r5.leadDays===8
   && r6.reopened==='2026-09-04' && r6.legacy===undefined && r7.sm && r7.made;
 console.log(pass?'PASS':'FAIL');
 console.log('errors:', errs.length?errs.join('\n'):'none');
 await b.close();
})();
