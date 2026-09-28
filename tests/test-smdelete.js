// A raised special make that Sage then moves, and one that is deleted:
//   - a later paste updates the raised works order's promised date (and its
//     due date when the PM has not set one of their own), description and
//     customer order number, stamps the change and says so in the result;
//   - a due date the PM moved is left alone;
//   - deleting the works order gives the sales order line back: the next
//     paste offers it for review again, the history shows the deletion and
//     the KPI month no longer counts it;
//   - a line left "seen" by a deletion made before this existed (order
//     871161) comes back on the next paste all the same;
//   - a completed special make is not offered again.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const L=(key,so,code,desc,qty,promised,po)=>T([key,'TIBARD',so,'1',code,desc,String(qty),promised,'ACME LTD','WORKS ORDER','Tibard',po||'PO 1','Acme Ltd','']);
(async()=>{
 const b=await chromium.launch({executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-25T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; smShowTab('special'); });
 const run=async t=>{ await p.evaluate(x=>{document.getElementById('smTA').value=x; smLoadPaste();},t); await p.waitForTimeout(100); return p.evaluate(()=>document.getElementById('smResult').textContent.replace(/\s+/g,' ').trim()); };
 // 25 Sep: three lines arrive; all three are raised
 const r1=await run([L('TIB-1','0000871161','OHCJSMOXFORD4003','BLACK S/S OXFORD 40',1,'2026-09-24'), L('TIB-2','0000871162','OHCJSMOXFORD4203','BLACK S/S OXFORD 42',2,'2026-09-30'), L('TIB-3','0000871163','OHCJSMOXFORD4403','BLACK S/S OXFORD 44',3,'2026-10-02')].join('\n'));
 const made=await p.evaluate(()=>{ ['TIB-1','TIB-2','TIB-3'].forEach(k=>smCreate(k)); return WOs.filter(w=>w.sm).map(w=>w.ref+':'+w.due).join(' '); });
 // the PM moves the second one's due date by hand
 await p.evaluate(()=>{ WOs.find(w=>w.sm.lineKey==='TIB-2').due='2026-09-28'; saveState(); });
 // 28 Sep: sales moved the first two dates and reworded the second; the third is completed
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-28T10:00:00'); const i=WOs.findIndex(w=>w.sm.lineKey==='TIB-3'); completeWholeWO(i); });
 const r2=await run([L('TIB-1','0000871161','OHCJSMOXFORD4003','BLACK S/S OXFORD 40',1,'2026-10-06'), L('TIB-2','0000871162','OHCJSMOXFORD4203','BLACK S/S OXFORD 42 + LOGO',2,'2026-10-09','PO 77'), L('TIB-3','0000871163','OHCJSMOXFORD4403','BLACK S/S OXFORD 44',3,'2026-10-02')].join('\n'));
 const a=await p.evaluate(()=>{ const w1=WOs.find(w=>w.sm.lineKey==='TIB-1'), w2=WOs.find(w=>w.sm.lineKey==='TIB-2');
   return { w1:[w1.due,w1.sm.promised,w1.sm.promisedWas,(w1.sm.changed||[]).join('+'),w1.sm.changedAt].join('|'),
            w2:[w2.due,w2.sm.promised,w2.sm.desc,w2.sm.custOrder,(w2.sm.changed||[]).join('+')].join('|'),
            row:(document.querySelector('#smLive')||document.body).textContent.replace(/\s+/g,' ').match(/Sage update [^✎]*?\(was 2026-09-24\)/)?'badge':'no badge',
            pending:smPending.length, live:WOs.filter(w=>w.sm).length }; });
 // the first works order is deleted: its line is released
 const d=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.sm.lineKey==='TIB-1'); delWO(i); return [smSeen['TIB-1']?'seen':'free', smMade.filter(m=>m.key==='TIB-1').map(m=>m.deletedAt||'-').join(), kpiCompute().months.find(m=>m.key==='2026-09').smRaised].join('|'); });
 const r3=await run([L('TIB-1','0000871161','OHCJSMOXFORD4003','BLACK S/S OXFORD 40',1,'2026-10-06'), L('TIB-3','0000871163','OHCJSMOXFORD4403','BLACK S/S OXFORD 44',3,'2026-10-02')].join('\n'));
 const q=await p.evaluate(()=>{ if(!smHistShow) smToggleHist(); if(!smOpenMonths['made-2026-09']) smToggleMonth('made-2026-09');
   return { pending:smPending.map(o=>o.key+':'+o.promised).join(','), hist:(document.getElementById('smHist')||document.body).textContent.replace(/\s+/g,' ').match(/S-TIB871161-Pt1[^|]*?deleted 28 Sept 2026, line back for review/)?'marked':'not marked' }; });
 // a line left "seen" by a deletion made before this fix: nothing live, nothing completed
 await p.evaluate(()=>{ smSeen['TIB-9']={what:'wo', ref:'S-TIB871169-Pt1'}; smMade.push({key:'TIB-9', ref:'S-TIB871169-Pt1', part:1, code:'X', qty:1, so:'0000871169', company:'TIBARD', raisedAt:'2026-09-20', promised:'2026-09-24'}); });
 const r4=await run(L('TIB-9','0000871169','OHCJSMOXFORD4803','BLACK S/S OXFORD 48',1,'2026-10-06'));
 const z=await p.evaluate(()=>[smPending.map(o=>o.key).join(','), smMade.find(m=>m.key==='TIB-9').deletedAt||'-'].join('|'));
 console.log('paste 1 ->', r1); console.log('made    ->', made);
 console.log('paste 2 ->', r2); console.log('after   ->', JSON.stringify(a));
 console.log('delete  ->', d); console.log('paste 3 ->', r3); console.log('queue   ->', JSON.stringify(q));
 console.log('paste 4 ->', r4); console.log('legacy  ->', z);
 const pass = /3 lines ready/.test(r1) && made==='S-TIB871161-Pt1:2026-09-24 S-TIB871162-Pt1:2026-09-30 S-TIB871163-Pt1:2026-10-02'
   && /3 already raised/.test(r2) && /2 raised works orders updated from Sage/.test(r2)
   && a.w1==='2026-10-06|2026-10-06|2026-09-24|date|2026-09-28' && a.w2==='2026-09-28|2026-10-09|BLACK S/S OXFORD 42 + LOGO|PO 77|date+description+customer order'
   && a.row==='badge' && a.pending===0 && a.live===2
   && d==='free|2026-09-28|2' && /1 line ready/.test(r3) && !/back for review/.test(r3) && /1 already raised/.test(r3)
   && q.pending==='TIB-1:2026-10-06' && q.hist==='marked'
   && /1 line ready/.test(r4) && /1 line back for review/.test(r4) && z==='TIB-1,TIB-9|2026-09-28';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
