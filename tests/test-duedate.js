// A works order due date moved from the order tracker (9 Nov 2026): the tracker's
// Publish writes `due` + dueSetAt/dueSetBy='ordertracker' into data.json. The
// editor absorbs a published date stamped later than its own (on load through
// mergePublishedSnapshots, and again just before its own publish, so the publish
// does not undo it), keeps a date it moved itself since, and stamps its own due
// edits dueSetBy 'planner'.
const { chromium } = require('playwright');
const base='file://'+require('path').join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const errs=[]; const e=await b.newPage(); e.on('pageerror',x=>errs.push('PAGEERROR: '+x.message));
 await e.goto(base+'?edit'); await e.waitForTimeout(300);
 const r=await e.evaluate(()=>{
   WOs=[{ref:'WO-0100',start:'2026-11-01',due:'2026-11-20',items:[{code:'A1',qty:5}]},
        {ref:'WO-0101',start:'2026-11-01',due:'2026-11-21',items:[{code:'A1',qty:5}],dueSetAt:'2026-11-09T12:00:00Z',dueSetBy:'planner'},
        {ref:'WO-0102',start:'2026-11-01',due:'2026-11-22',items:[{code:'A1',qty:5}]}];
   const pub=[{ref:'WO-0100',due:'2026-12-01',dueSetAt:'2026-11-09T10:00:00Z',dueSetBy:'ordertracker'},   // moved by the tracker: taken
              {ref:'wo-0101 ',due:'2026-12-02',dueSetAt:'2026-11-09T09:00:00Z',dueSetBy:'ordertracker'},  // the planner moved it later: kept
              {ref:'WO-0102',due:'2026-11-22'},                                                           // no stamp: nothing
              {ref:'WO-0999',due:'2026-12-03',dueSetAt:'2026-11-09T10:00:00Z',dueSetBy:'ordertracker'}];  // not here: nothing
   const n=absorbDueDates(pub); const again=absorbDueDates(pub);
   // the editor's own edit on a WO stamps it 'planner', so a later tracker stamp older than it is ignored
   dueStamp(WOs[0],'planner'); WOs[0].due='2026-12-05';
   const n2=absorbDueDates([{ref:'WO-0100',due:'2026-12-01',dueSetAt:'2026-11-09T10:00:00Z',dueSetBy:'ordertracker'}]);
   return {n, again, n2, d0:WOs[0].due, by0:WOs[0].dueSetBy, d1:WOs[1].due, at1:WOs[1].dueSetAt, d2:WOs[2].due, at2:WOs[2].dueSetAt||'', count:WOs.length};
 });
 console.log('absorb ->', JSON.stringify(r));
 // before a publish the published file is read once more and a tracker date taken, so the publish carries it (served over http: on file:// nothing is read)
 const fs=require('fs'), html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
 const h=await b.newPage(); h.on('pageerror',x=>errs.push('PAGEERROR: '+x.message));
 await h.route('http://planner.test/**', r=>{ const u=r.request().url();
   if(/data\.json/.test(u)) return r.fulfill({status:200, contentType:'application/json', body:JSON.stringify({rows:[],WOs:[{ref:'WO-0200',due:'2026-12-10',dueSetAt:'2026-11-09T10:00:00Z',dueSetBy:'ordertracker'}]})});
   if(/index\.html/.test(u)) return r.fulfill({status:200, contentType:'text/html', body:html}); r.fulfill({status:404, body:''}); });
 await h.route(/github\.(com|io)/, r=>r.fulfill({status:404, body:''}));
 await h.goto('http://planner.test/index.html?edit'); await h.waitForTimeout(400);
 const r2=await h.evaluate(async()=>{
   WOs=[{ref:'WO-0200',start:'2026-11-01',due:'2026-11-20',items:[{code:'A1',qty:5}]}];
   await new Promise(res=>absorbPublishedDue(res));
   const st=JSON.parse(publishState());
   return {due:WOs[0].due, pubDue:st.WOs[0].due, by:st.WOs[0].dueSetBy};
 });
 await h.close();
 console.log('pre-publish ->', JSON.stringify(r2));
 const pass = r.n===1 && r.again===0 && r.n2===0 && r.d0==='2026-12-05' && r.by0==='planner' && r.d1==='2026-11-21' && r.at1==='2026-11-09T12:00:00Z' && r.d2==='2026-11-22' && r.at2==='' && r.count===3
   && r2.due==='2026-12-10' && r2.pubDue==='2026-12-10' && r2.by==='ordertracker';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
