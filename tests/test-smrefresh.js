// A line the app already holds is refreshed by a later paste - the outstanding
// balance falls as Sage part-despatches, and promised dates move. Recreates the
// TGIWCL241507 case: 200 on the first paste, dismissed, 80 on the next paste.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const line=(qty,promised)=>T(['TIB-161986496','TIBARD','0000868795','7','TGIWCL241507','TGI WAITER CLOTH','200'.replace('200',qty),promised,'ALLIANCE DISPOSABLES LTD','WORKS ORDER','Tibard','PO 4471','Alliance Disposables Ltd']);
const other =(qty)=>T(['TIB-162174957','TIBARD','0000869611','4','TGIWCL241507','TGI WAITER CLOTH',qty,'2026-09-21','ALLIANCE DISPOSABLES LTD','WORKS ORDER','Tibard','PO 4520','Alliance Disposables Ltd']);
(async()=>{
 const b=await chromium.launch({executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-03T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; smShowTab('special'); });
 const run=async t=>{ await p.evaluate(x=>{document.getElementById('smTA').value=x; smLoadPaste();},t); await p.waitForTimeout(100); return p.evaluate(()=>document.getElementById('smResult').textContent.replace(/\s+/g,' ').trim()); };
 const r1=await run([line('200','2026-09-08'), other('200')].join('\n'));
 // 3 Sep: the first order is dismissed; the second is left in the queue with 150 typed to make
 await p.evaluate(()=>{ smDismiss('TIB-161986496'); smSetQty('TIB-162174957','150'); });
 // 8 Sep: Sage now shows 80 outstanding on the first, 120 on the second, and the first's date moved
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-08T10:00:00'); });
 const r2=await run([line('80','2026-09-15'), other('120')].join('\n'));
 const a=await p.evaluate(()=>{ if(!smHistShow) smToggleHist(); if(!smOpenMonths['drop-2026-09']) smToggleMonth('drop-2026-09'); const d=smDropped[0], q=smPending[0];
   return { r:{dropQty:d.qty, dropWas:d.qtyWas, dropDate:d.promised, dropChanged:d.changedAt, dropStill:smSeen[d.key]&&smSeen[d.key].what,
              pendQty:q.qty, pendWas:q.qtyWas, pendTake:q.take, pendChanged:q.changedAt},
     dismText:document.querySelector('#smHist .sm-dism, .sm-dism') ? [...document.querySelectorAll('.sm-dism')].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | ') : '',
     orderedCell:[...document.querySelectorAll('#smPend .sm-tbl tbody tr, .sm-tbl tbody tr')].map(tr=>tr.children[4]&&tr.children[4].textContent.replace(/\s+/g,' ').trim()).filter(Boolean).join(' | ') }; });
 console.log('first paste  ->', r1);
 console.log('second paste ->', r2);
 console.log('records      ->', JSON.stringify(a.r));
 console.log('dismissed row->', a.dismText); console.log('ordered cell ->', a.orderedCell);
 // undo puts the 80 back in the queue, with the change still visible; a take above the new balance was clamped
 await p.evaluate(()=>{ smUndismiss('TIB-161986496'); });
 const u=await p.evaluate(()=>{ const q=smPending.find(o=>o.key==='TIB-161986496'); return {qty:q.qty, was:q.qtyWas, take:smTake0(q), dismissedAt:q.dismissedAt, n:smPending.length}; });
 console.log('after undo   ->', JSON.stringify(u));
 // a third paste at the same balance changes nothing and says so
 const r3=await run([line('80','2026-09-15'), other('120')].join('\n'));
 const same=await p.evaluate(()=>smPending.map(o=>o.qty+'/'+(o.qtyWas||'-')).join(','));
 console.log('third paste  ->', r3, '|', same);
 // the history survives a reload
 await p.reload(); await p.waitForTimeout(400);
 const kept=await p.evaluate(()=>smPending.map(o=>o.key+':'+o.qty+':'+(o.qtyWas||'-')).sort().join(','));
 console.log('after reload ->', kept);
 const pass = /2 lines ready/.test(r1) && /1 dismissed previously/.test(r2) && /2 known lines updated from Sage/.test(r2)
   && a.r.dropQty===80 && a.r.dropWas===200 && a.r.dropDate==='2026-09-15' && a.r.dropChanged==='2026-09-08' && a.r.dropStill==='dismissed'
   && a.r.pendQty===120 && a.r.pendWas===200 && a.r.pendTake===120 && a.r.pendChanged==='2026-09-08'
   && /× 80 \(was 200\)/.test(a.dismText) && /120 ?was 200/.test(a.orderedCell)
   && u.qty===80 && u.was===200 && u.take===80 && u.dismissedAt===undefined && u.n===2
   && !/updated from Sage/.test(r3) && same==='80/200,120/200'
   && kept==='TIB-161986496:80:200,TIB-162174957:120:200';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
