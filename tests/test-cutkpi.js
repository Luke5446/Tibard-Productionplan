// Cutting time and the cut room's target (Luke, 7 Oct 2026):
//   - 25 min a works order up to 50 lays, +15 min each further 50 (or part)
//   - lays = qty over the default marker's garments per lay (lay plan, then
//     the works order data's marker); no lay plan = one per lay, flagged
//   - 450 min Mon-Thu, 285 Fri, nothing at the weekend
//   - the queue tile: minutes, working days from today, the day it runs out
//   - the target tile: last 5 working days before today against capacity,
//     red under 90%; today so far underneath
//   - each works order on To cut shows its lays and minutes
const { chromium } = require('playwright');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.route('https://api.github.com/**', r=>r.fulfill({status:404, body:'{}'})); await p.route('https://luke5446.github.io/**', r=>r.fulfill({status:404, body:''}));
 await p.goto(URL); await p.waitForTimeout(400);
 const run=async(nowIso, extraTodo)=>p.evaluate(([nowIso, extraTodo])=>{
   window.now=()=>new Date(nowIso);
   const L=(ref,code,qty,cutAt,extra)=>({k:ref+'|'+code+(extra?'|X':''), ref, code, desc:'', qty, fabric:'F', std:1, printedAt:'2026-10-01', cutAt, extra:!!extra});
   cutLog.entries=[
     L('WO-A','OHAPP0534241',60), L('WO-A','OHAPP0534241',60,null,true),   // 15 lays at 4 per lay; the mesh extra is the same run
     L('WO-B','APP063103PCS',260),                                        // 52 lays at 5 per lay: 40 min
     L('WO-C','ZZNOLAY',10),                                               // no lay plan: 10 lays, flagged
     L('WO-D','OHAP300501',30),                                            // works order data marker, 2 per lay
     ...Array.from({length:extraTodo},(_,i)=>L('WO-Q'+i,'OHAPP0534241',8)),
     L('WO-E','OHAPP0534241',20,'2026-10-06'), L('WO-F','OHAPP0534241',20,'2026-10-06'),   // Tue: 50 min
     ...Array.from({length:18},(_,i)=>L('WO-M'+i,'OHAPP0534241',8,'2026-10-05')),      // Mon: full day
     ...Array.from({length:11},(_,i)=>L('WO-R'+i,'OHAPP0534241',8,'2026-10-02')),      // Fri: 275 of 285
     ...Array.from({length:18},(_,i)=>L('WO-T'+i,'OHAPP0534241',8,'2026-10-01')),      // Thu
     ...Array.from({length:18},(_,i)=>L('WO-W'+i,'OHAPP0534241',8,'2026-09-30')),      // Wed
     L('WO-S','OHAPP0534241',8,'2026-10-03'),                                           // a Saturday: outside the week
     L('WO-X','OHAPP0534241',400,'2026-10-07'),                                         // today: 100 lays, 40 min
   ];
   cutLog.loadedAt=new Date(); cutLog.error='';
   smShowTab('cut'); cutRender();
   const tiles=[...document.querySelectorAll('#cutBody .kpi-tile')].map(t=>t.innerText.replace(/\s+/g,' ').trim());
   const todo=cutLog.entries.filter(e=>!e.cutAt), cut=cutLog.entries.filter(e=>e.cutAt);
   const k=cutKpi(cut, d2s(now())), est=cutQueueEstimate(todo);
   return {tiles, est, kpi:{pct:Math.round(k.pct*1000)/1000, cutMins:k.cutMins, target:k.target, from:k.from, to:k.to, days:k.days.map(d=>d.day+':'+d.mins+'/'+d.cap).join(' '), today:k.today, under:k.under},
     rows:[...document.querySelectorAll('#cutBody table.cut-tbl tr.cut-first td:first-child')].map(td=>td.innerText.replace(/\s+/g,' ').trim()).slice(0,4),
     mins:[0,1,50,51,100,101,150].map(cutWoMins).join(','), lay:[cutLayFor('OHAPP0534241').lay, cutLayFor('APP063103PCS').lay, cutLayFor('OHAP300501').lay, cutLayFor('ZZNOLAY').lay, cutLayFor('ZZNOLAY').src].join('|'),
     redTile:!!document.querySelector('#cutBody .kpi-tile.warn')};
 }, [nowIso, extraTodo]);
 const r=await run('2026-10-07T10:00:00', 0);   // a Wednesday
 console.log(JSON.stringify(r));
 // a queue that runs past the week: 4 + 40 works orders at 25 min = 1115 min from Wednesday: Wed 450, Thu 450, Fri 215 of 285 -> 2.8 days, runs out Friday
 const r2=await run('2026-10-07T10:00:00', 40);
 console.log(JSON.stringify(r2.est), r2.tiles[1]);
 // on a Monday the five days are the previous Mon-Fri; 2026-10-12
 const r3=await run('2026-10-12T09:00:00', 0);
 console.log(JSON.stringify(r3.kpi));
 const ok = r.mins==='25,25,25,40,40,55,55'
   && r.lay==='4|5|2|1|'
   && r.est.wos===4 && r.est.mins===115 && r.est.days===0.3 && r.est.runsOut==='2026-10-07' && r.est.unknown===1
   && r.kpi.cutMins===1675 && r.kpi.target===2085 && r.kpi.pct===0.803 && r.kpi.under===true && r.kpi.from==='2026-09-30' && r.kpi.to==='2026-10-06'
   && r.kpi.days==='2026-09-30:450/450 2026-10-01:450/450 2026-10-02:275/285 2026-10-05:450/450 2026-10-06:50/450'
   && r.kpi.today.mins===40 && r.kpi.today.wos===1 && r.kpi.today.cap===450
   && /≈ 0.3 days of cutting \(115 min\) · runs out 07 Oct 2026 1 with no lay plan/.test(r.tiles[1])
   && /Cutting target, last 5 working days 80% ⚠ under 90% target · 1675 of 2085 min · 67 works orders · 30 Sept 2026 to 06 Oct 2026 today so far 40 min of 450 · 1 works order/.test(r.tiles[2])
   && r.redTile===true
   && r.rows.join('|')==='WO-A 15 lays · 25 min|WO-B 52 lays · 40 min|WO-C 10 lays · 25 min no lay plan|WO-D 15 lays · 25 min'
   && r2.est.wos===44 && r2.est.mins===1115 && r2.est.days===2.8 && r2.est.runsOut==='2026-10-09'
   && r3.kpi.from==='2026-10-05' && r3.kpi.to==='2026-10-09' && r3.kpi.target===2085 && r3.kpi.cutMins===540 && r3.kpi.under===true && r3.kpi.today.cap===450 && r3.kpi.today.mins===0
   && errs.length===0;
 console.log(ok?'PASS':'FAIL'); if(!ok) console.log(errs.join('\n'));
 await b.close(); process.exit(ok?0:1);
})();
