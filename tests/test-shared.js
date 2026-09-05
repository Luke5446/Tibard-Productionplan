const { chromium } = require('playwright');
const base='file://'+require('path').join(__dirname,'..','index.html');
const published={rows:[{code:'A1',desc:'x',inStock:50,onSOP:0,onPOP:0,s1m:1,s3m:3,s6m:6,s12m:12,dailyUsage:6/182,available:50,daysOfStock:999,status:'healthy',onWOP:0,pipeline:0,wopRec:0,actWop:0,included:false,manAdj:false}],
  WOs:[],completedWOs:[{ref:'S-OLD',code:'A1',desc:'x',qty:2,start:'2026-08-01',due:'2026-08-05',completed:'2026-08-04'}],
  smSeen:{k:{what:'wo',ref:'S-1'}},smNotes:{},smParts:{'OH|1':1},smPending:[],smDropped:[{key:'d',dismissedAt:'2026-08-20'}],smMade:[{ref:'S-1',qty:3,raisedAt:'2026-08-22'}],smDocs:{'S-1':{name:'S-1.xlsx'}},
  styleEdits:{'ZZ--':{code:'ZZ--',customer:'C'}},chartEdits:{},chartColEdits:{},
  bufSnaps:[{date:'2026-08-24',pct:94.5,critical:10,low:8,ok:80,healthy:659,skus:757,unitsShort:100,onWOP:50},{date:'2026-08-25',pct:93.9,critical:12,low:9,ok:80,healthy:656,skus:757,unitsShort:120,onWOP:60}],
  savedAt:'2026-08-25T14:00:00Z'};
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const errs=[];
 // 1. a viewer (no ?edit) loads everything that was published, not just three arrays
 const v=await b.newPage(); v.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await v.goto(base); await v.waitForTimeout(300);
 const r1=await v.evaluate(async pub=>{ window.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve(pub)});
   await new Promise(res=>fetchShared(res)); await new Promise(r=>setTimeout(r,100));
   return {rows:rows.length, smMade:smMade.length, smDropped:smDropped.length, smParts:JSON.stringify(smParts), styleEdits:Object.keys(styleEdits).length, snaps:bufSnaps.length, docs:Object.keys(smDocs).length}; }, published);
 console.log('viewer restore   ->', JSON.stringify(r1));
 // the KPI tab on the viewer shows the published series
 await v.click('#tabKpi'); await v.waitForTimeout(200);
 const r2=await v.evaluate(()=>({hero:document.querySelector('.kpi-hero .num').textContent, aug:kpiCompute().months.find(m=>m.key==='2026-08')}));
 console.log('viewer kpi       ->', JSON.stringify({hero:r2.hero, augSnapDays:r2.aug.snapDays, augAvg:r2.aug.avgPct, augSmRaised:r2.aug.smRaised, augSmDone:r2.aug.smDone}));
 await v.close();
 // 2. an editor with its own state absorbs published snapshots by date, keeping its own
 const e=await b.newPage(); e.on('pageerror',x=>errs.push('PAGEERROR: '+x.message));
 await e.goto(base+'?edit'); await e.waitForTimeout(300);
 const r3=await e.evaluate(pub=>{ bufSnaps=[{date:'2026-08-25',pct:90,critical:1,low:1,ok:1,healthy:1,skus:4,unitsShort:0,onWOP:0},{date:'2026-09-03',pct:92,critical:1,low:1,ok:1,healthy:1,skus:4,unitsShort:0,onWOP:0}];
   const added=absorbSnapshots(pub.bufSnaps); return {added, dates:bufSnaps.map(x=>x.date+':'+x.pct)}; }, published);
 console.log('editor absorb    ->', JSON.stringify(r3));
 await e.close();
 const pass = r1.rows===1 && r1.smMade===1 && r1.smDropped===1 && r1.smParts==='{"OH|1":1}' && r1.styleEdits===1 && r1.snaps===2 && r1.docs===1
   && r2.hero==='93.9%' && r2.aug.snapDays===2 && r2.aug.avgPct===94.2 && r2.aug.smRaised===1 && r2.aug.smDone===1
   && r3.added===1 && r3.dates.join()==='2026-08-24:94.5,2026-08-25:90,2026-09-03:92';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
