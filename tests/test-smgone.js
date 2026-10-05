// The special makes queue is what the latest paste says. A line waiting for a
// works order that a later paste of the sheet does not show (sales corrected
// the order in Sage, or cancelled it) comes off the queue and sits in the
// history as gone; if a later paste has it again it is offered again, once.
// Luke, 5 Oct 2026: a CT code sales changed in Sage was still asking for a WO.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const nhs=T(['TIB-1','TIBARD','0000871872','1','NHSPTTNCLTPSM2001/221','WHITE/HOSPITAL BLUE TRIM LADIES MATERNITY TUNIC SZ 20','2','2026-10-05','NHS PROFESSIONALS LTD INTERNAL','WORKS ORDER','Tibard','137381','NHS Professionals Ltd Internal']);
const ct =T(['TIB-2','TIBARD','0000871905','1','CT0196XL03S','BLACK CHEFS TROUSERS SZ XL','6','2026-10-12','NEW WORLD TRADING CO (UK) LTD','WORKS ORDER','Tibard','NWTC16573765','New World Trading Co (UK) Ltd']);
(async()=>{
 const b=await chromium.launch({executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-10-05T09:00:00'); window.confirm=()=>true; window.alert=()=>{}; smShowTab('special'); });
 const run=async t=>{ await p.evaluate(x=>{document.getElementById('smTA').value=x; smLoadPaste();},t); await p.waitForTimeout(100); return p.evaluate(()=>document.getElementById('smResult').textContent.replace(/\s+/g,' ').trim()); };
 const queue=()=>p.evaluate(()=>smPending.map(o=>o.code+':'+o.qty+(o.take!=null?'/'+o.take:'')).join());
 // morning: both lines are offered; the PM types 1 to make on the NHS line
 const r1=await run([nhs, ct].join('\n')); const q1=await queue();
 await p.evaluate(()=>smSetQty('TIB-1','1'));
 // sales correct the CT line in Sage; the refreshed sheet no longer has it
 const r2=await run(nhs); const q2=await queue();
 const h=await p.evaluate(()=>{ if(!smHistShow) smToggleHist(); if(!smOpenMonths['drop-2026-10']) smToggleMonth('drop-2026-10'); smRender();
   return {dropped:smDropped.map(o=>o.code+':'+(o.gone?'gone '+o.goneAt:'dismissed')).join(), seen:smSeen['TIB-2']?smSeen['TIB-2'].what:'none', row:[...document.querySelectorAll('.sm-dism')].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | '), head:[...document.querySelectorAll('.sm-hsub')].map(e=>e.textContent).join(' ')}; });
 // the line comes back on a later paste: offered again, once, with no stale copy left in the history
 const r3=await run([nhs, ct].join('\n')); const q3=await queue();
 const n3=await p.evaluate(()=>({dropped:smDropped.length, pend:smPending.length}));
 // undo on a gone line puts it back in the queue too
 const r4=await run(nhs); await p.evaluate(()=>smUndismiss('TIB-2')); const q4=await queue();
 const u4=await p.evaluate(()=>({gone:smPending.some(o=>o.gone||o.goneAt||o.dismissedAt), dropped:smDropped.length}));
 // a pasted sheet with nothing changed takes nothing off
 const r5=await run([nhs, ct].join('\n')); const q5=await queue();
 console.log('1 ->', r1, '|', q1); console.log('2 ->', r2, '|', q2); console.log('hist ->', JSON.stringify(h)); console.log('3 ->', r3, '|', q3, JSON.stringify(n3)); console.log('4 ->', q4, JSON.stringify(u4)); console.log('5 ->', r5, '|', q5);
 const pass = q1==='NHSPTTNCLTPSM2001/221:2,CT0196XL03S:6'
   && /1 line no longer on the sheet, taken off the queue \(CT0196XL03S\)/.test(r2) && q2==='NHSPTTNCLTPSM2001/221:2/1'
   && h.dropped==='CT0196XL03S:gone 2026-10-05' && h.seen==='none' && /CT0196XL03S × 6 · SO 871905 · .*gone from the sheet 05 Oct 2026/.test(h.row) && /Undo/.test(h.row) && /Dismissed or gone from the sheet \(1\)/.test(h.head)
   && /^1 line ready for review/.test(r3) && q3==='NHSPTTNCLTPSM2001/221:2/1,CT0196XL03S:6' && n3.dropped===0 && n3.pend===2
   && q4==='NHSPTTNCLTPSM2001/221:2/1,CT0196XL03S:6' && !u4.gone && u4.dropped===0
   && /^0 lines ready for review/.test(r5) && !/taken off/.test(r5) && q5==='NHSPTTNCLTPSM2001/221:2/1,CT0196XL03S:6'
   && errs.length===0;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
