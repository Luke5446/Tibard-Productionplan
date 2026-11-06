// Sage standard costs and finishing-only works orders (Luke, 6 Nov 2026):
//   - the KPI tab's paste box takes code / cost lines, uppercases the codes,
//     skips a header, a line with no cost and codes the planner does not know
//     (Sage has ~107k costed codes), and the list survives a reload
//     and is published in data.json
//   - stdCostFor: the code's cost, or for a finishing job the BULK code's
//     cost + £1 (null when the BULK code is not on the list)
//   - the finishing tick shows in the create modal only when a ticked code is
//     on the Clockwork Bulk list, and marks only those works orders
//   - the manual form shows the tick once a Clockwork code is typed
//   - a completed finishing line carries the flag and no fabric record
const { chromium } = require('playwright');
const T=a=>a.join('\t');
// buffer paste with the Clockwork column (col N = Y): code, desc, inStock, onSOP, onPOP, 1m, 3m, 6m, 12m, cat, -, -, -, clockwork
const buf=[T(['CT3082MM26','GINGHAM TRS M','0','0','0','5','15','30','60','CT','','','','Y','','']),
           T(['OHAPP054415','APRON A','5','0','0','10','30','60','120','AP','','','','N','',''])].join('\n');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
let fails=0; const ok=(c,m)=>{ console.log((c?'ok   ':'FAIL ')+m); if(!c) fails++; };
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.confirm=()=>true; window.alert=()=>{}; });
 await p.evaluate(t=>{document.getElementById('pasteTA').value=t; loadPaste();},buf); await p.waitForTimeout(200);
 const cw=await p.evaluate(()=>rows.map(r=>r.code+':'+!!r.clockwork).join(','));
 ok(cw==='CT3082MM26:true,OHAPP054415:false','clockwork flag read from the paste: '+cw);

 // paste the cost list
 const r1=await p.evaluate(()=>{ document.getElementById('stdCostTA').value='Code\tStdCost\nct3082mm26\t9.5\nBULKCT3082MM26\t4.25\nOHAPP054415\t£3.10\nNOCOST\t\nUNKNOWNCODE1\t7\nBULKOHAPP054415\t2';
   stdCostPaste(); return {n:Object.keys(stdCosts.costs).length, a:stdCostFor('CT3082MM26'), f:stdCostFor('ct3082mm26',true), o:stdCostFor('OHAPP054415'), nf:stdCostFor('OHAPP054415',true), info:document.getElementById('stdCostInfo').textContent}; });
 ok(r1.n===3,'three costs kept (header, empty cost, a code the planner does not know and a BULK code of a made product dropped): '+r1.n);
 ok(r1.a===9.5&&r1.o===3.1,'home code costs: '+r1.a+' / '+r1.o);
 ok(r1.f===5.25,'finishing = BULK cost + 1: '+r1.f);
 ok(r1.nf===null,'finishing with no BULK code is unpriced');
 ok(/3 codes \(1 BULK\)/.test(r1.info),'status line: '+r1.info);

 // create modal: finishing offered only for the Clockwork code, marks only it
 const r2=await p.evaluate(()=>{ rows.forEach(r=>{r.included=true; r.actWop=10;}); showCreateWO();
   const shown=document.getElementById('createFinWrap').style.display; document.getElementById('createFinishing').checked=true;
   document.getElementById('createDue').value='2026-11-20'; const before=WOs.length; doCreateWOs();
   return {shown, made:WOs.slice(before).map(w=>w.items[0].code+':'+!!w.finishing)}; });
 ok(r2.shown==='flex','finishing tick shown in the create modal');
 ok(r2.made.join(',')==='CT3082MM26:true,OHAPP054415:false','only the Clockwork code marked finishing: '+r2.made);
 const r3=await p.evaluate(()=>{ rows.forEach(r=>{r.included=r.code==='OHAPP054415'; r.actWop=3;}); showCreateWO(); const d=document.getElementById('createFinWrap').style.display; closeCreate(); return d; });
 ok(r3==='none','tick hidden when no ticked code is Clockwork');

 // manual form shows the tick once a Clockwork code is typed
 const r4=await p.evaluate(()=>{ const ta=document.getElementById('woTA'); ta.value='OHAPP054415 5'; woFinCheck(); const a=document.getElementById('woFinWrap').style.display;
   ta.value='CT3082MM26\t12'; woFinCheck(); const b=document.getElementById('woFinWrap').style.display; document.getElementById('woFinishing').checked=true;
   document.getElementById('woRef').value='S-FIN1'; document.getElementById('woDue').value='2026-11-21'; saveWO(); const w=WOs.find(x=>x.ref==='S-FIN1'); return {a,b,fin:w&&w.finishing}; });
 ok(r4.a==='none'&&r4.b==='flex','manual form tick: hidden for a made code, shown for a Clockwork code');
 ok(r4.fin===true,'manual finishing works order flagged');

 // complete it: flag kept, no fabric; card tag shown
 const r5=await p.evaluate(()=>{ const i=WOs.findIndex(x=>x.ref==='S-FIN1'); const tag=/Finishing<\/span>/.test(document.getElementById('woCards')?document.getElementById('woCards').innerHTML:document.body.innerHTML);
   const wo=WOs[i]; wo.items.forEach(it=>recordCompleted(wo,it,'2026-11-06',0)); const c=completedWOs.find(x=>x.ref==='S-FIN1'); return {tag, fin:c.finishing, fab:c.fabric===undefined, qty:c.qty}; });
 ok(r5.tag,'finishing tag on the card');
 ok(r5.fin===true&&r5.fab&&r5.qty===12,'completed line: finishing flag, no fabric record, qty 12');

 // reload: costs survive; published state carries them
 await p.reload(); await p.waitForTimeout(500);
 const r6=await p.evaluate(()=>({n:Object.keys(stdCosts.costs).length, at:stdCosts.pastedAt, pub:JSON.parse(publishState()).stdCosts}));
 ok(r6.n===3&&r6.pub&&r6.pub.costs.BULKCT3082MM26===4.25&&r6.pub.finishAdd===1,'costs survive a reload and are published: '+JSON.stringify(r6.pub).slice(0,80));
 ok(!errs.length,'no page errors'+(errs.length?': '+errs.join(' | '):''));
 await b.close(); console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
})();
