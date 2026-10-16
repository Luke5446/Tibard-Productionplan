// A works order cut and then split, and the locks that go with a cut line.
// The cloth the cutting room logged follows the split by quantity (11 m cut
// for 10, split 5 and 5, is 5.5 m on each), each half writes off its own
// share when booked in, and the cutting room is never asked for the new
// works order. A split is refused while the cutting room's quantity differs
// from the works order's (12 cut against 10) until the works order is
// brought into line - the one quantity change a cut line allows. A cut
// line's quantity cannot otherwise be changed, and a cut works order cannot
// be removed. (Luke, 15 Oct 2026: WO-1352 cut for 17, taken down to 4, and
// WO-1544 raised by hand for the rest.)
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=T(['APP300503','BLACK BIB APRON','40','120','0','30','90','160','300']);
const URL='file://'+require('path').join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext(); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 let store=null, sha=0;
 const enc=s=>Buffer.from(s,'utf8').toString('base64'), dec=s=>Buffer.from(s,'base64').toString('utf8');
 await p.route('https://api.github.com/**', async route=>{
   const req=route.request();
   if(req.method()==='GET'){ if(!store) return route.fulfill({status:404, contentType:'application/json', body:'{"message":"Not Found"}'}); return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:enc(store), sha:'sha'+sha})}); }
   if(req.method()==='PUT'){ const body=JSON.parse(req.postData()); if(store && body.sha!=='sha'+sha) return route.fulfill({status:409, contentType:'application/json', body:'{"message":"sha mismatch"}'});
     store=dec(body.content); sha++; return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:{sha:'sha'+sha}, commit:{message:body.message}})}); }
   route.fulfill({status:405, body:''}); });
 await p.route('https://luke5446.github.io/Tibard-Cutlog/**', route=>{ if(!store) return route.fulfill({status:404, body:'not found'}); route.fulfill({status:200, contentType:'application/json', body:store}); });
 const entries=()=>store?JSON.parse(store).entries:[];
 const open=async(edit, token)=>{ await p.goto(URL+(edit?'?edit':'')); await p.waitForTimeout(400); await p.evaluate(tok=>{ window.now=()=>new Date('2026-10-01T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); window.open=()=>({document:{open(){},write(){},close(){}}}); try{ if(tok) localStorage.setItem('tibard_cutlog_token',tok); else localStorage.removeItem('tibard_cutlog_token'); }catch(e){} }, token); await p.waitForTimeout(1200); };
 const cut=async(ref, metres, note, qty)=>{ await p.evaluate(([ref,metres,note,qty])=>{ cutSec='todo'; cutQ=ref; cutRender(); const k=ref+'|APP300503|PC2003ECO';
   document.querySelector('input[data-cutm="'+k+'"]').value=metres; document.querySelector('input[data-cutn="'+k+'"]').value=note; if(qty!=null) document.querySelector('input[data-cutq="'+k+'"]').value=String(qty); cutMark(k); }, [ref,metres,note,qty]); await p.waitForTimeout(800); };
 const out={};

 // three printed works orders of ten aprons
 await open(true,'tok-editor');
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste();
   const mk=(ref)=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-30'; document.getElementById('woDue').value='2026-10-10'; document.getElementById('woTA').value='APP300503\t10'; saveWO(); };
   mk('S-A'); mk('S-B'); mk('S-C'); ['S-A','S-B','S-C'].forEach(r=>markWOPrinted(WOs.findIndex(w=>w.ref===r))); }, buf);
 await p.waitForTimeout(2000);
 out.printed=entries().map(e=>e.ref+':'+e.qty+':'+e.std).sort();
 const std10=entries()[0].std;

 // the cutting room: S-A cut at 11 m (a roll end), S-B cut for 12 at 12 m, S-C still to cut
 await open(false,'tok-cutting'); await p.evaluate(()=>smShowTab('cut')); await p.waitForTimeout(600);
 await cut('S-A', '11', 'roll end'); await cut('S-B', '12', 'two extra from the lay', 12);
 out.cut=entries().map(e=>e.ref+':'+(e.cutAt||'waiting')+':'+(e.metres!=null?e.metres:'-')+':'+(e.qtyCut!=null?e.qtyCut:'-')).sort();

 // the PM: S-A split 5 and 5 - the 11 m follows, 5.5 m each, and the new works order is not asked for
 await open(true,'tok-editor');
 out.split=await p.evaluate(()=>{ window.prompt=()=>'5'; const i=WOs.findIndex(w=>w.ref==='S-A'); const n0=WOs.length; splitWO(i); const c=WOs[WOs.length-1], a=WOs.find(w=>w.ref==='S-A');
   const fa=fabricRecordFor(a.items[0], a), fc=fabricRecordFor(c.items[0], c);
   return {made:WOs.length===n0+1, parent:[a.items[0].qty, a.items[0].metresActual, !!a.items[0].cutShare], child:[c.ref, c.splitFrom, c.items[0].qty, c.items[0].metresActual, !!c.items[0].cutShare],
     recA:[fa.actual, fa.cutAt, fa.cutNote, /share of the cut/.test(fa.source), fa.cutShare], recC:[fc.actual, fc.cutAt, fc.cutNote, /share of the cut/.test(fc.source)],
     said:window.__alerts.filter(m=>/Cloth already cut/.test(m)).length, lines:[ '5.5 m stays on S-A', '5.5 m goes with the new works order' ].every(s=>window.__alerts.some(m=>m.indexOf(s)>=0)),
     review:cutReviewLines().map(l=>l.wo.ref), notPushed:cutNotPushed().map(w=>w.ref)}; });
 await p.waitForTimeout(2600);
 out.splitLog=entries().map(e=>e.ref+':'+e.qty+':'+(e.cutAt||'waiting')).sort();
 const childRef=await p.evaluate(()=>WOs[WOs.length-1].ref);

 // S-B: 12 cut against 10 - no split and no other quantity until it is brought to 12; 8 refused, 12 taken, then a 6 and 6 split carries 6 m each
 out.twelve=await p.evaluate(()=>{ window.__alerts=[]; window.prompt=()=>'6'; const i=WOs.findIndex(w=>w.ref==='S-B'); const n0=WOs.length; splitWO(i);
   const refused=WOs.length===n0 && /cut 12 against the 10/.test(window.__alerts[0]||'');
   // a printed works order's card shows for a search, and the split opens the new works order's panel
   const card=(ref)=>{ closeWOModal(); document.getElementById('woSearch').value=ref; renderWOCards(); return WOs.findIndex(w=>w.ref===ref); };
   card('S-B'); editWODate(i); document.getElementById('woc-qty-'+i+'-0').value='8'; saveWODate(i); const eight=WOs[i].items[0].qty;
   card('S-B'); editWODate(i); document.getElementById('woc-qty-'+i+'-0').value='12'; saveWODate(i); const twelve=WOs[i].items[0].qty;
   const n1=WOs.length; splitWO(i); const c=WOs[WOs.length-1], bw=WOs.find(w=>w.ref==='S-B');
   const first={refused:refused, eight:eight, eightMsg:/except to the 12 the cutting room logged/.test(window.__alerts[1]||''), twelve:twelve, split:WOs.length===n1+1, parent:[bw.items[0].qty, bw.items[0].metresActual], child:[c.splitFrom, c.items[0].qty, c.items[0].metresActual]};
   window.prompt=()=>'2'; const ic=WOs.indexOf(c), n2=WOs.length; splitWO(ic); const g=WOs[WOs.length-1], gl=cutLineFor(g, 'APP300503'); window.__alerts=[]; delWO(card(g.ref)); const gKept=WOs.some(w=>w.ref===g.ref) && /cannot be removed/.test(window.__alerts[0]||'');
   const again={made:WOs.length===n2+1, mid:[c.items[0].qty, c.items[0].metresActual], grand:[g.splitFrom, g.items[0].qty, g.items[0].metresActual, !!g.items[0].cutShare], cloth:gl ? [gl.ref, gl.viaParent, cutCutWithParent(g,'APP300503')] : null, kept:gKept, review:cutReviewLines().map(l=>l.wo.ref), notPushed:cutNotPushed().map(w=>w.ref)};
   return Object.assign({again:again}, first); });

 // S-A (cut) keeps its 5 and stays; the new works order (cut with S-A) keeps its 5; S-C (not cut) can still be changed and removed
 out.locks=await p.evaluate((childRef)=>{ window.__alerts=[]; const card=(ref)=>{ closeWOModal(); document.getElementById('woSearch').value=ref; renderWOCards(); return WOs.findIndex(w=>w.ref===ref); }; const n0=WOs.length;
   const ia=card('S-A'); editWODate(ia); document.getElementById('woc-qty-'+ia+'-0').value='3'; saveWODate(ia); const aQty=WOs[ia].items[0].qty, aMsg=window.__alerts[0]||'';
   const ic=card(childRef); editWODate(ic); document.getElementById('woc-qty-'+ic+'-0').value='2'; saveWODate(ic); const cQty=WOs[ic].items[0].qty, cMsg=window.__alerts[1]||'';
   delWO(card('S-A')); const aStill=WOs.some(w=>w.ref==='S-A'), delMsg=window.__alerts[2]||'';
   delWO(card(childRef)); const cStill=WOs.some(w=>w.ref===childRef);
   const i3=card('S-C'); editWODate(i3); document.getElementById('woc-qty-'+i3+'-0').value='7'; saveWODate(i3); const c7=WOs[i3].items[0].qty; delWO(WOs.findIndex(w=>w.ref==='S-C'));
   return {aQty:aQty, aMsg:/has been cut \(5 garments, its 5.5 m share of the 11 m cut 01 Oct 2026\), so its quantity cannot be changed\./.test(aMsg) && /Split WO/.test(aMsg), cQty:cQty, cMsg:/cut 01 Oct 2026 with S-A/.test(cMsg), aStill:aStill, delMsg:/cannot be removed: the cutting room has cut its cloth/.test(delMsg), cStill:cStill, c7:c7, cGone:!WOs.some(w=>w.ref==='S-C'), n:WOs.length===n0-1}; }, childRef);
 await p.waitForTimeout(800);
 out.locksLog=entries().map(e=>e.ref+':'+(e.cancelledAt?'withdrawn':e.cutAt?'cut':'waiting')).sort();

 // booked in: each half writes off its own 5.5 m, nothing for the variance review; an undo gives the share back
 out.done=await p.evaluate((childRef)=>{ completeWholeWO(WOs.findIndex(w=>w.ref==='S-A')); completeWholeWO(WOs.findIndex(w=>w.ref===childRef));
   const recs=completedWOs.filter(c=>c.ref==='S-A'||c.ref===childRef).map(c=>[c.ref, c.qty, c.fabric.std, c.fabric.actual, c.fabric.cutAt, !!c.fabric.cutShare]);
   const odd=fabOddLines().map(l=>l.ref), led=fabLines().filter(l=>l.ref==='S-A'||l.ref===childRef).map(l=>l.ref+':'+l.metres);
   undoCompleted(completedWOs.findIndex(c=>c.ref===childRef)); const back=WOs.find(w=>w.ref===childRef).items[0];
   const legacy=fabricRecordFor({code:'APP300503', qty:3}, {ref:'S-L', splitFrom:'S-B', items:[{code:'APP300503', qty:3}]});   // 3 of the 12 cut at 12 m, no share kept
   // WO-1552 off WO-1428: split before shares were kept, so the parent is down to 7 of the 10 cut with no share; it splits again all the same, and parent, old child and new child take their parts of the 11 m
   const bk=WOs.find(w=>w.ref==='S-B'); const old={ref:'S-OLD', start:bk.start, due:bk.due, items:[{code:'APP300503', qty:3}], splitFrom:'S-B', createdAt:bk.createdAt, printed:true, printedAt:'2026-10-01'};
   bk.items[0]={code:'APP300503', qty:9}; WOs.push(old);   // S-B back to a share-less 9 of the 12 cut, 3 gone to S-OLD
   const oldRec=fabricRecordFor(old.items[0], old), bRecBefore=fabricRecordFor(bk.items[0], bk);
   window.__alerts=[]; window.prompt=()=>'4'; const n0=WOs.length; splitWO(WOs.indexOf(bk)); const nw=WOs[WOs.length-1]; closeWOModal();
   const again={oldPart:[oldRec.actual, !!oldRec.cutShare], bBefore:[bRecBefore.actual, !!bRecBefore.cutShare], split:WOs.length===n0+1 && !window.__alerts.some(m=>/Bring the works order/.test(m)), parent:[bk.items[0].qty, bk.items[0].metresActual], nw:[nw.splitFrom, nw.items[0].qty, nw.items[0].metresActual], oldStill:fabricRecordFor(old.items[0], old).actual};
   return {recs:recs, odd:odd, ledger:led, back:[back.qty, back.metresActual, !!back.cutShare], legacy:[legacy.actual, legacy.cutAt, !!legacy.cutShare, /share of the cut/.test(legacy.source)], again:again}; }, childRef);

 // the shares survive a reload
 await open(true,'tok-editor');
 out.reload=await p.evaluate((childRef)=>{ const c=WOs.find(w=>w.ref===childRef), b=WOs.find(w=>w.ref==='S-B'); return [c.items[0].metresActual, !!c.items[0].cutShare, c.splitFrom, b.items[0].metresActual, !!b.items[0].cutShare]; }, childRef);

 console.log(JSON.stringify(out, null, 1));
 const half=Math.round(11/2*100)/100;
 const ok=[
  out.printed.join()==='S-A:10:'+std10+',S-B:10:'+std10+',S-C:10:'+std10,
  out.cut.join()==='S-A:2026-10-01:11:-,S-B:2026-10-01:12:12,S-C:waiting:-:-',
  out.split.made && out.split.parent.join()==='5,'+half+',true' && out.split.child.slice(1).join()==='S-A,5,'+half+',true',
  out.split.recA.join()===half+',2026-10-01,roll end,true,true' && out.split.recC.join()===half+',2026-10-01,roll end,true',
  out.split.said===1 && out.split.lines && out.split.review.length===0 && out.split.notPushed.length===0,
  out.splitLog.join()==='S-A:10:2026-10-01,S-B:10:2026-10-01,S-C:10:waiting',
  out.twelve.refused && out.twelve.eight===10 && out.twelve.eightMsg && out.twelve.twelve===12 && out.twelve.split && out.twelve.parent.join()==='6,6' && out.twelve.child.join()==='S-B,6,6',
  out.twelve.again.made && out.twelve.again.mid.join()==='4,4' && out.twelve.again.grand.join()==='WO-0002,2,2,true' && (out.twelve.again.cloth||[]).join()==='S-B,true,true' && out.twelve.again.kept && out.twelve.again.review.length===0 && out.twelve.again.notPushed.length===0,
  out.locks.aQty===5 && out.locks.aMsg && out.locks.cQty===5 && out.locks.cMsg && out.locks.aStill && out.locks.delMsg && out.locks.cStill && out.locks.c7===7 && out.locks.cGone && out.locks.n,
  out.locksLog.join()==='S-A:cut,S-B:cut,S-C:withdrawn',
  out.done.recs.map(r=>r.slice(1).join()).join('|')==='5,'+Math.round(std10/2*100)/100+','+half+',2026-10-01,true|5,'+Math.round(std10/2*100)/100+','+half+',2026-10-01,true',
  out.done.odd.length===0 && out.done.ledger.join()==='S-A:'+half+','+childRef+':'+half && out.done.back.join()==='5,'+half+',true' && out.done.legacy.join()==='3,2026-10-01,true,true',
  out.done.again.oldPart.join()==='3,true' && out.done.again.bBefore.join()==='9,true' && out.done.again.split && out.done.again.parent.join()==='5,5' && out.done.again.nw.join()==='S-B,4,4' && out.done.again.oldStill===3,
  out.reload.join()===half+',true,S-A,5,true',
  errs.length===0 ];
 console.log(ok.every(Boolean)?'ALL PASS':'FAIL '+ok.map((v,i)=>v?'':i).filter(x=>x!=='').join(','), errs);
 await b.close(); process.exit(ok.every(Boolean)?0:1);
})();
