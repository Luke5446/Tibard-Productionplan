const { chromium } = require('playwright');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
// A fixture with answers worked out by hand. Today is 2026-09-04.
const state={
 rows:[], WOs:[
  {ref:'WO-0101',start:'2026-08-20',due:'2026-09-01',items:[{code:'A',qty:10}],createdAt:'2026-08-18'},   // overdue, 17 days old
  {ref:'WO-0102',start:'2026-09-01',due:'2026-09-30',items:[{code:'B',qty:5},{code:'C',qty:5}]},          // no createdAt (legacy)
  {ref:'S-OH1-Pt1',start:'',due:'2026-09-20',items:[{code:'X',qty:3}],createdAt:'2026-09-03',sm:{seenAt:'2026-09-02',so:'1',company:'OLIVER HARVEY',customer:'K'}},
 ],
 completedWOs:[
  // August: 3 WOs (one over two lines), 100 units. Per WO: on time 2 of 3 -> 66.7%. planned-start leads 5,10,2 -> median 5. raised: 8,12 -> median 10 of 2
  {ref:'WO-0001',code:'A',qty:40,start:'2026-08-05',due:'2026-08-12',completed:'2026-08-10',createdAt:'2026-08-02'},   // on time, start 5, raised 8
  {ref:'WO-0001',code:'B',qty:10,start:'2026-08-05',due:'2026-08-12',completed:'2026-08-10',createdAt:'2026-08-02'},   // on time (same WO)
  {ref:'WO-0002',code:'C',qty:30,start:'2026-08-10',due:'2026-08-15',completed:'2026-08-20',createdAt:'2026-08-08'},   // LATE, start 10, raised 12
  {ref:'WO-0003',code:'D',qty:20,start:'2026-08-27',due:'2026-08-30',completed:'2026-08-29'},                           // on time, start 2, no createdAt
  // September: 1 WO, 7 units, on time. Last 7 days from 4 Sep also catches WO-0003 on 29 Aug: 2 WOs, 27 units
  {ref:'WO-0004',code:'E',qty:7,start:'2026-09-01',due:'2026-09-05',completed:'2026-09-02',createdAt:'2026-08-30'},
 ],
 smMade:[{ref:'S-OH1-Pt1',qty:3,raisedAt:'2026-09-03',seenAt:'2026-09-02'},{ref:'S-T1-Pt1',qty:9,raisedAt:'2026-08-15'}],
 smDropped:[{key:'k1',dismissedAt:'2026-08-16'},{key:'k2',dismissedAt:'2026-09-01'}],
 smPending:[{key:'p1',seenAt:'2026-08-28',code:'Z',qty:1,so:'2',company:'TIBARD',customer:'',desc:'',cat:'WORKS ORDER',promised:'2026-09-10'}],
 // August snapshots: 94, 92, 93 -> avg 93.0, low 92, days<=93: 2 of 3.  September: 95 -> avg 95, 0 of 1
 bufSnaps:[{date:'2026-08-29',pct:94,critical:1,low:1,ok:5,healthy:93,skus:100,unitsShort:10,onWOP:0},
           {date:'2026-08-30',pct:92,critical:4,low:4,ok:5,healthy:87,skus:100,unitsShort:40,onWOP:0},
           {date:'2026-08-31',pct:93,critical:3,low:4,ok:5,healthy:88,skus:100,unitsShort:30,onWOP:0},
           {date:'2026-09-03',pct:95,critical:2,low:3,ok:5,healthy:90,skus:100,unitsShort:20,onWOP:0}],
 smSeen:{},smNotes:{},smParts:{},smDocs:{},styleEdits:{},chartEdits:{},chartColEdits:{},savedAt:'2026-09-04T09:00:00Z'};
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(URL); await p.waitForTimeout(300);
 await p.evaluate(s=>localStorage.setItem('tibard_production',JSON.stringify(s)),state);
 await p.reload(); await p.waitForTimeout(500);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-04T10:00:00'); });
 await p.click('#tabKpi'); await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{
   const k=kpiCompute(); const aug=k.months.find(m=>m.key==='2026-08'), sep=k.months.find(m=>m.key==='2026-09');
   const cells=[...document.querySelectorAll('.kpi-tbl tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.trim().replace(/\s+/g,' ')));
   return { tabOn:document.getElementById('tabKpi').classList.contains('on'), kpiShown:!document.getElementById('kpiView').classList.contains('hidden'), bufferHidden:document.getElementById('dataWrap').style.display==='none',
     hero:document.querySelector('.kpi-hero .num').textContent, pill:document.querySelector('.kpi-pill').textContent.trim(), delta:(document.querySelector('.kpi-delta')||{}).textContent,
     aug:{wos:aug.wos,units:aug.units,onTime:aug.onTimePct,medStart:aug.medStart,medRaised:aug.medRaised,nRaised:aug.nRaised,smRaised:aug.smRaised,smUnits:aug.smUnits,dism:aug.smDismissed,avg:aug.avgPct,min:aug.minPct,below:aug.daysBelow,days:aug.snapDays},
     sep:{wos:sep.wos,units:sep.units,onTime:sep.onTimePct,smRaised:sep.smRaised,dism:sep.smDismissed,avg:sep.avgPct,below:sep.daysBelow},
     last7:k.last7, overdue:k.overdue, oldest:k.oldestOpen, agedN:k.agedN, liveN:k.liveN, pending:k.pending,
     augRow:cells.find(c=>c[0].startsWith('Aug')), marks:document.querySelectorAll('#kpiBody .mark').length };
 });
 console.log(JSON.stringify(r,null,1));
 // hover shows a tooltip
 const bb=await (await p.$('#kpiBody circle.mark')).boundingBox(); await p.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2); await p.waitForTimeout(120);
 const tip=await p.evaluate(()=>{const t=document.getElementById('kpiTip'); return {shown:!t.hidden, text:t.textContent};});
 console.log('tooltip:', JSON.stringify(tip));
 const a=r.aug, s=r.sep;
 const pass = r.tabOn && r.kpiShown && r.bufferHidden && r.hero==='95.0%' && /On target/.test(r.pill) && /\+2\.0 pts/.test(r.delta)
   && a.wos===3 && a.units===100 && Math.abs(a.onTime-66.667)<0.01 && a.medStart===5 && a.medRaised===10 && a.nRaised===2 && a.smRaised===1 && a.smUnits===9 && a.dism===1
   && a.avg===93 && a.min===92 && a.below===2 && a.days===3
   && s.wos===1 && s.units===7 && s.onTime===100 && s.smRaised===1 && s.dism===1 && s.avg===95 && s.below===0
   && r.last7.wos===2 && r.last7.units===27 && r.overdue===1 && r.oldest===17 && r.agedN===2 && r.liveN===3 && r.pending.n===1 && r.pending.oldest===7
   && r.augRow[3]==='67%' && r.augRow[4]==='5d' && r.augRow[5]==='10d /2' && tip.shown && /94% in stock/.test(tip.text);
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
