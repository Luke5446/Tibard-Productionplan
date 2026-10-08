// A page that is behind must not save or publish (Luke, 7 Oct 2026: WO-1306
// completed with its quantity changed to 51, published, and back as if never
// completed - twice). Two windows on the same browser: B completes the works
// order; A, still holding the older state, then makes a change and tries to
// publish. A's save is refused with the alert, IndexedDB keeps B's state, A
// does not publish; B goes on saving; A reloaded shows the completion.
const { chromium } = require('playwright');
const URL='file://'+require('path').join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext(); const errs=[]; let puts=0;
 const prep=async(p)=>{ p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
   await p.route('https://luke5446.github.io/**', r=>r.fulfill({status:404, body:''}));
   await p.route('https://api.github.com/**', r=>{ if(r.request().method()==='PUT'){ puts++; return r.fulfill({status:200, contentType:'application/json', body:'{"content":{"sha":"x"}}'}); } r.fulfill({status:200, contentType:'application/json', body:'{"sha":"s1"}'}); }); };
 const A=await ctx.newPage(); await prep(A);
 await A.goto(URL+'?edit'); await A.waitForTimeout(400);
 await A.evaluate(()=>new Promise(res=>{ try{ localStorage.clear(); }catch(e){}
   const row={code:'OHAP300531',desc:'NAVY BIB APRON',inStock:50,onSOP:0,onPOP:0,s1m:1,s3m:3,s6m:6,s12m:12,dailyUsage:6/182,available:50,daysOfStock:999,status:'healthy',onWOP:0,pipeline:0,wopRec:0,actWop:0,included:false,manAdj:false,freeStock:50};
   const wo={ref:'WO-1306', start:'2026-09-24', due:'2026-10-22', items:[{code:'OHAP300531', qty:50}], createdAt:'2026-09-24', printed:true, printedAt:'2026-09-24'};
   const st={rows:[row], WOs:[wo], completedWOs:[], smSeen:{},smNotes:{},smParts:{},smPending:[],smDropped:[],smMade:[],smDocs:{},bufSnaps:[],styleEdits:{},chartEdits:{},chartColEdits:{},fabStock:{rows:{},pastedAt:''},fabricOverrides:{}, savedAt:'2026-10-07T13:00:00.000Z'};
   localStorage.setItem('tibard_production', JSON.stringify(st)); idbSet(JSON.stringify(st), ()=>res()); }));
 const setup=async(p)=>{ await p.goto(URL+'?edit'); await p.waitForTimeout(600); await p.evaluate(()=>{ window.now=()=>new Date('2026-10-07T15:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); try{ localStorage.setItem('tibard_prod_token','tok'); }catch(e){} }); };
 await setup(A);
 const B=await ctx.newPage(); await prep(B); await setup(B);
 const idb=p=>p.evaluate(()=>new Promise(res=>idbGet(j=>{ const s=JSON.parse(j); res({live:s.WOs.map(w=>w.ref+':'+w.items.map(i=>i.qty).join()).join(), done:s.completedWOs.map(c=>c.ref+':'+c.qty).join(), at:s.savedAt}); })));
 // B: quantity to 51, then complete the whole works order
 await B.evaluate(()=>{ WOs[0].items[0].qty=51; saveState(); }); await B.waitForTimeout(400);
 await B.evaluate(()=>{ completeWholeWO(0); }); await B.waitForTimeout(600);
 const afterB=await idb(B);
 // A, behind: changes the due date and saves; then tries to publish
 await A.evaluate(()=>{ WOs[0].due='2026-10-30'; saveState(); }); await A.waitForTimeout(600);
 const afterA=await idb(A);
 const aState=await A.evaluate(()=>({alerts:window.__alerts.splice(0), ind:document.getElementById('saveInd').textContent, note:document.getElementById('storeNote').textContent, live:WOs.map(w=>w.ref).join()}));
 await A.evaluate(()=>{ publishData(); }); await A.waitForTimeout(600);
 const aPub=await A.evaluate(()=>({alerts:window.__alerts.splice(0)}));
 const putsAfterA=puts;
 // B goes on: another change saves, and B publishes
 await B.evaluate(()=>{ smNotes['x']='note'; saveState(); }); await B.waitForTimeout(400);
 const afterB2=await idb(B);
 const bState=await B.evaluate(()=>({alerts:window.__alerts.splice(0), ind:document.getElementById('saveInd').textContent}));
 await B.evaluate(()=>{ publishData(); }); await B.waitForTimeout(800);
 const putsAfterB=puts;
 // A reloaded picks up B's state and can save again
 await setup(A); await A.evaluate(()=>{ WOs.push({ref:'WO-NEW', start:'2026-10-07', due:'2026-10-20', items:[{code:'OHAP300531', qty:5}], createdAt:'2026-10-07'}); saveState(); }); await A.waitForTimeout(500);
 const afterReload=await A.evaluate(()=>({live:WOs.map(w=>w.ref).join(), done:completedWOs.map(c=>c.ref+':'+c.qty).join(), alerts:window.__alerts.length}));
 const afterReloadIdb=await idb(A);
 console.log(JSON.stringify({afterB, afterA, aState, aPub, putsAfterA, afterB2, bState, putsAfterB, afterReload, afterReloadIdb}));
 const ok = afterB.live==='' && afterB.done==='WO-1306:51'
   && afterA.live==='' && afterA.done==='WO-1306:51' && afterA.at===afterB.at
   && aState.alerts.length===1 && /This page is behind/.test(aState.alerts[0]) && /NOT been saved/.test(aState.alerts[0]) && /NOT SAVED/.test(aState.ind) && /behind another window/.test(aState.note)
   && aPub.alerts.length===1 && /Not published/.test(aPub.alerts[0]) && putsAfterA===0
   && afterB2.done==='WO-1306:51' && bState.alerts.length===0 && !/NOT SAVED/.test(bState.ind) && putsAfterB===1
   && afterReload.live==='WO-NEW' && afterReload.done==='WO-1306:51' && afterReload.alerts===0 && afterReloadIdb.live==='WO-NEW:5' && afterReloadIdb.done==='WO-1306:51'
   && errs.length===0;
 console.log(ok?'PASS':'FAIL'); if(!ok) console.log(errs.join('\n'));
 await b.close(); process.exit(ok?0:1);
})();
