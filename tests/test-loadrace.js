// The editor's start: the two logs come back over the network while
// IndexedDB is still being read. A mark applied to the localStorage copy
// before IndexedDB had been read saved that older copy over the newer one
// (Luke, 7 Oct 2026: a works order raised, the page refreshed, the works
// order gone). Here localStorage holds an older state (one works order),
// IndexedDB the newer (two), and the warehouse log a book-in mark that
// applies to both: after the load the newer state stands, the mark is
// applied to it, and what is saved back still has the second works order.
const { chromium } = require('playwright');
const URL='file://'+require('path').join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext(); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const log={entries:[{k:'embbook|E-A|GIRHT016003', kind:'embbook', ref:'E-A', code:'GIRHT016003', baseCode:'HT016003', qty:5, bookedAt:'2026-10-07T08:00:00.000Z', files:[]}], savedAt:'2026-10-07T08:00:00.000Z'};
 await p.route('https://luke5446.github.io/Tibard-Cutlog/warehouse.json*', r=>r.fulfill({status:200, contentType:'application/json', body:JSON.stringify(log)}));
 await p.route('https://luke5446.github.io/Tibard-Cutlog/cutlog.json*', r=>r.fulfill({status:200, contentType:'application/json', body:JSON.stringify({entries:[], savedAt:''})}));
 await p.route('https://luke5446.github.io/Tibard-Stock-Planner/**', r=>r.fulfill({status:404, body:''}));
 await p.route('https://api.github.com/**', r=>r.fulfill({status:404, body:'{}'}));
 await p.goto(URL+'?edit'); await p.waitForTimeout(500);
 // seed: the older state in localStorage, the newer in IndexedDB
 await p.evaluate(()=>new Promise(res=>{ localStorage.removeItem('tibard_cutlog_token');
   const rowA={code:'HT016003',desc:'BLACK VELCRO FASTEN SKULL CAP',inStock:50,onSOP:0,onPOP:0,s1m:1,s3m:3,s6m:6,s12m:12,dailyUsage:6/182,available:50,daysOfStock:999,status:'healthy',onWOP:0,pipeline:0,wopRec:0,actWop:0,included:false,manAdj:false,freeStock:50};
   const woA={ref:'E-A', start:'2026-10-06', due:'2026-10-10', items:[{code:'GIRHT016003', qty:5}], createdAt:'2026-10-06', printed:true, printedAt:'2026-10-06', embOnly:true, pickCode:'HT016003'};
   const woB={ref:'WO-1463', start:'2026-10-07', due:'2026-10-14', items:[{code:'GBKAPP064464', qty:10}], createdAt:'2026-10-07'};
   const base={smSeen:{},smNotes:{},smParts:{},smPending:[],smDropped:[],smMade:[],smDocs:{},bufSnaps:[],styleEdits:{},chartEdits:{},chartColEdits:{},fabStock:{rows:{},pastedAt:''},fabricOverrides:{},completedWOs:[]};
   const older=Object.assign({}, base, {rows:[rowA], WOs:[woA], savedAt:'2026-10-07T09:00:00.000Z'});
   const newer=Object.assign({}, base, {rows:[rowA], WOs:[woA, woB], savedAt:'2026-10-07T09:05:00.000Z'});
   localStorage.setItem('tibard_production', JSON.stringify(older));
   idbSet(JSON.stringify(newer), function(){ res(); }); }));
 await p.goto(URL+'?edit'); await p.waitForTimeout(2500);
 const r=await p.evaluate(()=>new Promise(res=>{ const live=WOs.map(w=>w.ref).join(), done=completedWOs.map(c=>c.ref+':'+c.completed).join();
   idbGet(function(json){ const s=JSON.parse(json); res({live, done, ready:stateReady, idbLive:s.WOs.map(w=>w.ref).join(), idbDone:s.completedWOs.map(c=>c.ref).join(), local:JSON.parse(localStorage.getItem('tibard_production')).WOs.map(w=>w.ref).join()}); }); }));
 console.log('after load ->', JSON.stringify(r));
 const pass = r.ready && r.live==='WO-1463' && r.done==='E-A:2026-10-07' && r.idbLive==='WO-1463' && r.idbDone==='E-A' && r.local==='WO-1463' && errs.length===0;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
