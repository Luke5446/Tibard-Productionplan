// The cutting room log. Printing pushes a works order's fabric lines to a
// shared file in its own GitHub repo; the cutting room PC marks them cut
// and can adjust the metres with a comment; everyone else reads the copy
// GitHub Pages serves. GitHub is stood in for here by an in-memory store
// behind the two URLs, including one refused save (a stale sha) that the
// app must read past and apply again. WIP = cut and not completed. A line
// with no fabric or metres on file goes to the Cutting review tab, not the
// cutting room; a works order changed before the cut replaces its waiting
// lines; one already cut is left alone. The lists come up for a search only.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=T(['APP300503','BLACK BIB APRON','40','120','0','30','90','160','300']);
const URL='file://'+require('path').join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext(); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 // ── the stand-in for GitHub ──
 let store=null, sha=0, puts=0, refuseOnce=false, log=[];
 const enc=s=>Buffer.from(s,'utf8').toString('base64'), dec=s=>Buffer.from(s,'base64').toString('utf8');
 await p.route('https://api.github.com/**', async route=>{
   const req=route.request(); log.push(req.method()+' '+(req.headers()['authorization']||'no auth'));
   if(req.method()==='GET'){ if(!store) return route.fulfill({status:404, contentType:'application/json', body:'{"message":"Not Found"}'}); return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:enc(store), sha:'sha'+sha})}); }
   if(req.method()==='PUT'){ puts++; const body=JSON.parse(req.postData()); if(refuseOnce){ refuseOnce=false; return route.fulfill({status:409, contentType:'application/json', body:'{"message":"is at a different sha"}'}); }
     if(store && body.sha!=='sha'+sha) return route.fulfill({status:409, contentType:'application/json', body:'{"message":"sha mismatch"}'});
     store=dec(body.content); sha++; return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:{sha:'sha'+sha}, commit:{message:body.message}})}); }
   route.fulfill({status:405, body:''}); });
 await p.route('https://luke5446.github.io/Tibard-Cutlog/**', route=>{ log.push('PAGES'); if(!store) return route.fulfill({status:404, body:'not found'}); route.fulfill({status:200, contentType:'application/json', body:store}); });
 const entries=()=>store?JSON.parse(store).entries:[];
 const open=async(edit, token)=>{ await p.goto(URL+(edit?'?edit':'')); await p.waitForTimeout(400); await p.evaluate(tok=>{ window.now=()=>new Date('2026-10-01T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); try{ if(tok) localStorage.setItem('tibard_cutlog_token',tok); else localStorage.removeItem('tibard_cutlog_token'); }catch(e){} }, token); };

 // 1. editor with the token: a printed works order lands in the log, main cloth and mesh as two lines; a deleted printed one is withdrawn
 await open(true,'tok-editor');
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste();
   const mk=(ref,ta)=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-30'; document.getElementById('woDue').value='2026-10-10'; document.getElementById('woTA').value=ta; saveWO(); };
   mk('S-T1','CICJM0193XXS01\t7'); mk('S-T2','APP300503\t10'); mk('S-T3','ZZNOUSAGE\t5');
   document.getElementById('woRef').value='S-OLD'; document.getElementById('woStart').value='2026-09-01'; document.getElementById('woDue').value='2026-09-20'; document.getElementById('woTA').value='APP300503\t4'; saveWO();
   window.open=()=>({document:{open(){},write(){},close(){}}});
   var cardBtn=document.getElementById('woc-print-'+WOs.findIndex(w=>w.ref==='S-T1')), cardLabel=cardBtn.textContent.trim(); cardBtn.click();   // the card's own print button: no panel opens
   window.__cardPrint={modal:document.getElementById('woModal').classList.contains('open'), label:cardLabel, printed:WOs.find(w=>w.ref==='S-T1').printed, printedCardStill:!!document.getElementById('woc-print-'+WOs.findIndex(w=>w.ref==='S-T1'))};
   markWOPrinted(WOs.findIndex(w=>w.ref==='S-T2')); markWOPrinted(WOs.findIndex(w=>w.ref==='S-OLD')); markWOPrinted(WOs.findIndex(w=>w.ref==='S-T3')); }, buf);
 await p.waitForTimeout(600);
 const s1=entries().map(e=>e.ref+':'+e.code+':'+e.fabric+':'+e.std+':'+(e.printedAt||'')+(e.extra?':extra':'')).sort();
 const cp=await p.evaluate(()=>window.__cardPrint);
 // S-T3 has no fabric on file: not on the log, on the Cutting review tab with a badge
 const r1=await p.evaluate(()=>{ smShowTab('cutrev'); return {lines:cutReviewLines().map(l=>l.wo.ref+':'+l.it.code+':'+l.why), badge:document.getElementById('cutRevCount').textContent, shown:document.getElementById('cutRevCount').style.display, rows:[...document.querySelectorAll('#cutRevBody .cut-tbl tbody tr')].map(tr=>tr.textContent.replace(/\s+/g,' ').trim()), fix:document.querySelectorAll('#cutRevBody button[onclick^="setFabricCode"]').length}; });
 // the PM changes the quantity on S-T2 before it is cut: the waiting line follows, a moment later, on its own
 await p.evaluate(()=>{ WOs.find(w=>w.ref==='S-T2').items[0].qty=12; saveState(); }); await p.waitForTimeout(2400);
 const r2=entries().filter(e=>e.ref==='S-T2').map(e=>e.qty+':'+e.std+':'+(e.cutAt||'waiting'));
 // the PM puts ZZNOUSAGE on a cloth: still no usage on file, so review says to type the metres; typed for the line, it goes across at that figure
 await p.evaluate(()=>{ WOs.find(w=>w.ref==='S-T3').items[0].fabricCode='PC2003ECO'; saveState(); cutRevRender(); }); await p.waitForTimeout(2400);
 const r3a={log:entries().filter(e=>e.ref==='S-T3').length, why:await p.evaluate(()=>cutReviewLines().map(l=>l.why).join()), hint:await p.evaluate(()=>fabricCellFor(WOs.findIndex(w=>w.ref==='S-T3'), WOs.find(w=>w.ref==='S-T3').items[0]).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())};
 await p.evaluate(()=>{ setMetresActual(WOs.findIndex(w=>w.ref==='S-T3'), 'ZZNOUSAGE', '6'); }); await p.waitForTimeout(2400);
 const r3={log:entries().filter(e=>e.ref==='S-T3').map(e=>e.fabric+':'+e.std+':'+e.qty), review:await p.evaluate(()=>({n:cutReviewLines().length, badge:document.getElementById('cutRevCount').style.display, empty:(document.querySelector('#cutRevBody .sm-empty')||{}).textContent||''}))};
 await p.evaluate(()=>{ delWO(WOs.findIndex(w=>w.ref==='S-T2')); }); await p.waitForTimeout(500);
 const s1b=entries().filter(e=>e.ref==='S-T2').map(e=>e.cancelledAt||'live');
 const s1c=await p.evaluate(()=>{ smShowTab('cut'); return new Promise(r=>setTimeout(()=>r({notPushed:cutNotPushed().length, rows:document.querySelectorAll('#cutBody .cut-tbl tbody tr').length, prompt:(document.querySelector('#cutBody .sm-empty')||{}).textContent||'', tag:(document.querySelector('#cutBody .sm-tag.ok')||{}).textContent||''}),500)); });

 // 2. the cutting room PC (a viewer with the token): nothing listed until a search; the works order's two lines come up; cut all; adjust the main cloth with a comment
 await open(false,'tok-cutting');
 const s2=await p.evaluate(()=>{ smShowTab('cut'); return new Promise(r=>setTimeout(()=>r({src:cutLog.source, rows:document.querySelectorAll('#cutBody .cut-tbl tbody tr').length, order:[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>(tr.children[0].querySelector('strong')||{}).textContent||'').map((t,i,a)=>t||a.slice(0,i).reverse().find(Boolean)).join(), head:document.querySelector('#cutBody .cut-tbl thead').textContent.replace(/\s+/g,' ').trim(), flipped:(function(){ document.querySelector('#cutBody .cut-tbl thead th:nth-child(2)').click(); var o=[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>(tr.children[0].querySelector('strong')||{}).textContent||'').map((t,i,a)=>t||a.slice(0,i).reverse().find(Boolean)).join(); cutSortDesc=false; cutRender(); return o; })(), prompt:(document.querySelector('#cutBody .sm-empty')||{}).textContent||'', todo:(function(){ var t=[...document.querySelectorAll('#cutBody .kpi-tile')].find(x=>/^To cut/.test(x.querySelector('.l').textContent)); return t?t.querySelector('.v').textContent:''; })(), boxAfterChips:(function(){ var q=document.getElementById('cutQ'); return !!q && q.previousElementSibling && /Metres per day/.test(q.previousElementSibling.textContent) && q.style.marginLeft!=='auto'; })()}),600)); });
 // typing in the search box: the tab redraws on each key and the box keeps its focus and text; the lines come up for the search
 await p.click('#cutQ'); await p.keyboard.type('S-T1'); await p.waitForTimeout(200);
 const sq=await p.evaluate(()=>({q:cutQ, val:document.getElementById('cutQ').value, focused:document.activeElement===document.getElementById('cutQ'), rows:document.querySelectorAll('#cutBody .cut-tbl tbody tr').length, cutAll:!!document.querySelector('#cutBody button[onclick^="cutMarkWO"]'), polling:!!cutPoll}));
 // sort by due date, and the New today tile as a filter (S-T3 made to look printed yesterday and due sooner, in this page only)
 const s2c=await p.evaluate(()=>{ cutQ=''; const t3=cutLog.entries.find(e=>e.ref==='S-T3'); const was={p:t3.printedAt, d:t3.due}; t3.printedAt='2026-09-30'; t3.due='2026-10-05'; cutRender();
   const refs=()=>[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>(tr.children[0].querySelector('strong')||{}).textContent||'').filter(Boolean).join();
   const tiles=()=>[...document.querySelectorAll('#cutBody .kpi-tile')].slice(0,2).map(t=>t.querySelector('.l').textContent+'='+t.querySelector('.v').textContent);
   const out={tiles:tiles(), byPrinted:refs()};
   document.querySelector('#cutBody .cut-tbl thead th:nth-child(3)').click(); out.byDue=refs(); out.dueHead=document.querySelector('#cutBody .cut-tbl thead th:nth-child(3)').textContent.trim();
   document.querySelector('#cutBody .cut-tbl thead th:nth-child(3)').click(); out.byDueDesc=refs();
   document.getElementById('cutNewTile').click(); out.newOnly=refs(); out.note=!!document.querySelector('#cutBody .sm-note button'); out.newTile=tiles()[0];
   document.querySelector('#cutBody .sm-note button').click(); out.back=refs();
   cutSortKey='printed'; cutSortDesc=false; t3.printedAt=was.p; t3.due=was.d; cutQ='S-T1'; cutRender(); return out; });
 // the main cloth gave more: 8 m with no comment is refused, with a comment it is taken; the mesh stays at standard
 const s3a=await p.evaluate(()=>{ document.querySelector('input[data-cutm="S-T1|CICJM0193XXS01|PC2001ECO"]').value='8'; cutMarkWO('S-T1'); return window.__alerts.length; });
 await p.waitForTimeout(300); const s3b=entries().filter(e=>e.ref==='S-T1'&&e.cutAt).length;
 await p.evaluate(()=>{ document.querySelector('input[data-cutn="S-T1|CICJM0193XXS01|PC2001ECO"]').value='roll end, 0.65 m short'; cutMarkWO('S-T1'); }); await p.waitForTimeout(600);
 const s3=entries().filter(e=>e.ref==='S-T1').map(e=>e.cutAt+':'+e.metres).sort();
 const s4=entries().filter(e=>e.ref==='S-T1').map(e=>e.fabric+':'+e.metres+':'+(e.note||'')+':'+(e.adjustedAt?'adj':'std')).sort();
 const s5=await p.evaluate(()=>{ cutSec='log'; cutRender(); const tiles=[...document.querySelectorAll('#cutBody .kpi-tile')].map(t=>t.querySelector('.l').textContent+'='+t.querySelector('.v').textContent.replace(/\s+/g,' '));
   const logRows=[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.replace(/\s+/g,' ').trim()));
   cutSec='days'; cutRender(); const day=[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.replace(/\s+/g,' ').trim()));
   smShowTab('kpi'); const wip=[...document.querySelectorAll('#kpiWip table tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.replace(/\s+/g,' ').trim()));
   return {tiles, logRows, day, wip, wipCalc:cutWip('2026-10-01')}; });
 // 3. a save refused once (someone else saved in between) is read past and applied again
 await p.evaluate(()=>cutUnmark('S-T1|CICJM0193XXS01|MESHPW31401')); await p.waitForTimeout(500);
 refuseOnce=true; const putsBefore=puts; const alertsBefore=await p.evaluate(()=>window.__alerts.length);
 await p.evaluate(()=>cutMark('S-T1|CICJM0193XXS01|MESHPW31401')); await p.waitForTimeout(800);
 const s6={retried:puts-putsBefore, cut:entries().filter(e=>e.fabric==='MESHPW31401').map(e=>e.cutAt||'-').join(), alerts:(await p.evaluate(()=>window.__alerts.length))-alertsBefore};
 // a line that reached the file twice reads as one
 store=JSON.stringify(Object.assign(JSON.parse(store),{entries:JSON.parse(store).entries.concat([JSON.parse(store).entries[0]])}));
 // 4. anyone else: reads the Pages copy, sees the log for a search, no buttons
 await open(false,'');
 const s7=await p.evaluate(()=>{ smShowTab('cut'); cutSec='log'; cutQ=''; return new Promise(r=>setTimeout(()=>{ cutRender(); const logPrompt=/Type a works order.*on the log/.test((document.querySelector('#cutBody .sm-empty')||{}).textContent||'') && !document.querySelector('#cutBody .cut-tbl'); cutSec='todo'; cutRender(); const todoRows=document.querySelectorAll('#cutBody .cut-tbl tbody tr').length; cutSec='log'; cutQ='S-T1'; cutRender(); r({logPrompt, todoRows, src:cutLog.source, n:cutLog.entries.length, rows:document.querySelectorAll('#cutBody .cut-tbl tbody tr').length, buttons:document.querySelectorAll('#cutBody .cut-tbl button').length, tag:(document.querySelector('#cutBody .sm-tag')||{}).textContent||''}); },600)); });
 const s7n=JSON.parse(store).entries.length;   // the doubled line is still in the file: nothing has saved since
 // 5. the editor completes the works order: it leaves WIP, the log shows the completion date; WIP as at the day before still counts it
 await open(true,'tok-editor');
 await p.waitForTimeout(500);
 const s9=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-T1'); openWOModal(i); const cell=fabricCellFor(i, WOs[i].items[0]).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
   return {loadedAtStartup:!!cutLog.loadedAt, cell:cell.slice(0,200), placeholder:(fabricCellFor(i, WOs[i].items[0]).match(/placeholder="([^"]*)"/)||[])[1]}; });
 // S-T1 is cut: a quantity change, then a fabric change, on the works order leave its cut lines as they are and add nothing
 await p.evaluate(()=>{ WOs.find(w=>w.ref==='S-T1').items[0].qty=8; saveState(); }); await p.waitForTimeout(2400);
 const r4=[...new Set(entries().filter(e=>e.ref==='S-T1').map(e=>e.fabric+':'+e.qty+':'+e.std+':'+(e.cutAt||'waiting')))].sort();   // (the file still holds the doubled line from step 3 until something is saved)
 await p.evaluate(()=>{ const it=WOs.find(w=>w.ref==='S-T1').items[0]; it.qty=7; it.fabricCode='PC2003ECO'; saveState(); }); await p.waitForTimeout(2400);
 const r5={lines:[...new Set(entries().filter(e=>e.ref==='S-T1').map(e=>e.fabric+':'+(e.cutAt||'waiting')))].sort(), notPushed:await p.evaluate(()=>cutNotPushed().length), review:await p.evaluate(()=>cutReviewLines().length)};
 await p.evaluate(()=>{ delete WOs.find(w=>w.ref==='S-T1').items[0].fabricCode; saveState(); }); await p.waitForTimeout(2400);
 const s8=await p.evaluate(()=>{ window.now=()=>new Date('2026-10-02T10:00:00'); completeWholeWO(WOs.findIndex(w=>w.ref==='S-T1')); smShowTab('cut'); cutSec='log'; cutQ='S-T1';
   return new Promise(r=>setTimeout(()=>{ cutRender(); const done=[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>tr.children[9].textContent.trim());
     smShowTab('kpi'); kpiWipAsAt='2026-10-01'; kpiRender(); const kpiBefore=(document.querySelector('#kpiWip .kpi-tile .v')||{}).textContent; const rowsBefore=document.querySelectorAll('#kpiWip table tbody tr').length;
     kpiWipAsAt=''; kpiRender(); const kpiNow=(document.querySelector('#kpiWip .kpi-tile .v')||{}).textContent; const assumedNow=[...document.querySelectorAll('#kpiWip table tbody tr')].map(tr=>tr.children[3].textContent.trim());
     const c=completedWOs.find(x=>x.ref==='S-T1'&&x.code==='CICJM0193XXS01'); const l=fabLines().find(x=>x.ref==='S-T1'&&x.code==='CICJM0193XXS01');
     smShowTab('fabric'); fabOpen.mon['2026-10']=true; fabOpen.day['2026-10-02']=true; fabRender(); const row=[...document.querySelectorAll('#fabBody .sm-tbl tbody tr, #fabBody .fab-stk tbody tr')].map(tr=>tr.textContent.replace(/\s+/g,' ')).find(t=>/S-T1/.test(t))||'';
     r({wipNow:cutWip('2026-10-02').total, wipBefore:cutWip('2026-10-01').total, done, kpiBefore, rowsBefore, kpiNow, assumedNow,
        rec:{actual:c.fabric.actual, std:c.fabric.std, source:c.fabric.source, note:c.fabric.cutNote, meshActual:c.fabric.extras[0].actual, meshStd:c.fabric.extras[0].std}, ledger:{metres:l.metres, varPct:Math.round(l.varPct*10)/10, note:l.cutNote}, rowHasNote:/roll end, 0.65 m short/.test(row)}); },600)); });
 // 6. splits. S-T3 is marked cut, then split for an urgent two: the new works order, printed, asks the cutting room for
 //    nothing and is not on review. S-T5 is split while it still waits: the new one gets its own line and S-T5's follows.
 const sp=await p.evaluate(()=>{ window.now=()=>new Date('2026-10-02T10:00:00'); window.__alerts=[]; cutMark('S-T3|ZZNOUSAGE|PC2003ECO'); return new Promise(r=>setTimeout(()=>{
   window.prompt=()=>'2'; splitWO(WOs.findIndex(w=>w.ref==='S-T3')); const kid=WOs[WOs.length-1]; markWOPrinted(WOs.length-1);
   document.getElementById('woRef').value='S-T5'; document.getElementById('woStart').value='2026-10-01'; document.getElementById('woDue').value='2026-10-12'; document.getElementById('woTA').value='APP300503\t4'; saveWO(); markWOPrinted(WOs.findIndex(w=>w.ref==='S-T5'));
   setTimeout(()=>{ splitWO(WOs.findIndex(w=>w.ref==='S-T5')); const kid2=WOs[WOs.length-1]; markWOPrinted(WOs.length-1);
     setTimeout(()=>r({kid:kid.ref, kidFrom:kid.splitFrom, kidQty:kid.items[0].qty, parentQty:WOs.find(w=>w.ref==='S-T3').items[0].qty, kid2:kid2.ref, kid2From:kid2.splitFrom, review:cutReviewLines().map(l=>l.wo.ref).join(), notPushed:cutNotPushed().map(w=>w.ref).join()}), 2600); }, 800); }, 800)); });
 const spLog=entries().filter(e=>['S-T3','S-T5',sp.kid,sp.kid2].includes(e.ref)).map(e=>e.ref+':'+e.code+':'+e.qty+':'+e.std+':'+(e.cutAt?'cut':(e.cancelledAt?'withdrawn':'waiting'))).sort();
 console.log('splits    ->', JSON.stringify(sp), JSON.stringify(spLog));
 console.log('printed   ->', JSON.stringify(s1), JSON.stringify(s1b), JSON.stringify(s1c));
 console.log('review    ->', JSON.stringify(r1), JSON.stringify(r2), JSON.stringify(r3a), JSON.stringify(r3)); console.log('cut, edit ->', JSON.stringify(r4), JSON.stringify(r5));
 console.log('cutting   ->', JSON.stringify(s2), JSON.stringify(sq)); console.log('sort/new  ->', JSON.stringify(s2c)); console.log('marked    ->', s3a, s3b, JSON.stringify(s3), JSON.stringify(s4));
 console.log('figures   ->', JSON.stringify(s5)); console.log('conflict  ->', JSON.stringify(s6)); console.log('viewer    ->', JSON.stringify(s7)); console.log('panel     ->', JSON.stringify(s9)); console.log('completed ->', JSON.stringify(s8));
 console.log('card print->', JSON.stringify(cp));
 const pass = cp.modal===false && cp.label==='🖨 Print WOP' && cp.printed===true && cp.printedCardStill===false
   && s1.join('|')==='S-T1:CICJM0193XXS01:MESHPW31401:1.75:2026-10-01:extra|S-T1:CICJM0193XXS01:PC2001ECO:7.35:2026-10-01|S-T2:APP300503:PC2003ECO:5:2026-10-01'
   && r1.lines.join()==='S-T3:ZZNOUSAGE:no fabric on file' && r1.badge==='1' && r1.shown==='' && r1.rows.length===1 && /S-T3.*ZZNOUSAGE.*5 ?no fabric on file.*Open.*fabric/.test(r1.rows[0]) && r1.fix===1
   && r2.join()==='12:6:waiting' && r3a.log===0 && /^no metres on file for PC2003ECO: type the metres/.test(r3a.why) && /no usage on file .*PC2003ECO.*type the metres for the line/.test(r3a.hint)
   && r3.log.join()==='PC2003ECO:6:5' && r3.review.n===0 && r3.review.badge==='none' && /Nothing to review/.test(r3.review.empty)
   && s1b.join()==='2026-10-01' && s1c.notPushed===0 && !entries().some(e=>e.ref==='S-OLD') && s1c.rows===3 && s1c.prompt==='' && /mark cuts/.test(s1c.tag)
   && s2.src==='api' && s2.rows===3 && s2.order==='S-T1,S-T1,S-T3' && s2.head==='Works orderPrinted ▲DueProductQtyFabricStd mCut m · comment' && s2.flipped==='S-T3,S-T1,S-T1' && s2.todo==='3' && s2.boxAfterChips && sq.q==='S-T1' && sq.val==='S-T1' && sq.focused && sq.rows===2 && sq.cutAll && sq.polling
   && s7.logPrompt && s7.todoRows===1
   && s2c.tiles.join()==='New today=1,Live works orders to cut=2' && s2c.byPrinted==='S-T3,S-T1' && s2c.byDue==='S-T3,S-T1' && s2c.dueHead==='Due ▲' && s2c.byDueDesc==='S-T1,S-T3'
   && s2c.newOnly==='S-T1' && s2c.note && s2c.back==='S-T1,S-T3'
   && r4.join('|')==='MESHPW31401:7:1.75:2026-10-01|PC2001ECO:7:7.35:2026-10-01' && r5.lines.join('|')==='MESHPW31401:2026-10-01|PC2001ECO:2026-10-01' && r5.notPushed===0 && r5.review===0
   && s3a===1 && s3b===0 && s3.join()==='2026-10-01:1.75,2026-10-01:8' && s4.join('|')==='MESHPW31401:1.75::std|PC2001ECO:8:roll end, 0.65 m short:adj'
   && /Cut today=9.8 m/.test(s5.tiles.join()) && /Live, not on the log=0/.test(s5.tiles.join()) && s5.logRows.length===2 && s5.logRows.some(r=>r[0]==='01 Oct 2026'&&r[7].startsWith('8.00')&&r[8]==='roll end, 0.65 m short'&&r[9]==='in WIP'&&/Undo/.test(r[10]))
   && s5.day.length===1 && s5.day[0][1]==='1' && s5.day[0][2]==='2' && s5.day[0][3]==='9.75' && s5.wip.length===3 && s5.wip[0][0].startsWith('PC2001ECO') && s5.wip[0][5]==='£17.12' && s5.wip[2][5]==='£21.06' && Math.abs(s5.wipCalc.total.value-21.06)<0.01
   && s6.retried===2 && s6.cut==='2026-10-01' && s6.alerts===0
   && s7.src==='pages' && s7.rows===2 && s7.n===4 && s7n===5 && s7.buttons===0 && s7.tag==='view only'
   && s8.wipNow.lines===1 && s8.wipNow.assumed===1 && Math.abs(s8.wipNow.value-4.64)<0.01 && s8.wipBefore.lines===3 && s8.wipBefore.logged===2 && Math.abs(s8.wipBefore.value-25.70)<0.01
   && s8.done.join()==='02 Oct 2026,02 Oct 2026' && s8.kpiBefore==='£25.70' && s8.rowsBefore===4 && s8.kpiNow==='£4.64' && s8.assumedNow.join('|')==='2.00 m taken as cut|'
   && s9.loadedAtStartup && /cut 01 Oct 2026 .middot; cutting room: 8 m .middot; roll end, 0.65 m short \(used as the actual\)/.test(s9.cell) && s9.placeholder==='8'
   && s8.rec.actual===8 && s8.rec.std===7.35 && /cut log/.test(s8.rec.source) && s8.rec.note==='roll end, 0.65 m short' && s8.rec.meshActual===undefined && s8.rec.meshStd===1.75
   && sp.kidFrom==='S-T3' && sp.kidQty===2 && sp.parentQty===3 && sp.kid2From==='S-T5' && sp.review==='' && sp.notPushed===''
   && spLog.join('|')===['S-T3:ZZNOUSAGE:5:6:cut','S-T5:APP300503:2:1:waiting',sp.kid2+':APP300503:2:1:waiting'].sort().join('|')
   && s8.ledger.metres===9.75 && s8.ledger.varPct===8.8 && s8.ledger.note==='roll end, 0.65 m short' && s8.rowHasNote;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
