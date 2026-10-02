// The cutting room log. Printing pushes a works order's fabric lines to a
// shared file in its own GitHub repo; the cutting room PC marks them cut
// and can adjust the metres with a comment; everyone else reads the copy
// GitHub Pages serves. GitHub is stood in for here by an in-memory store
// behind the two URLs, including one refused save (a stale sha) that the
// app must read past and apply again. WIP = cut and not completed.
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
   mk('S-T1','CICJM0193XXS01\t7'); mk('S-T2','APP300503\t10');
   document.getElementById('woRef').value='S-OLD'; document.getElementById('woStart').value='2026-09-01'; document.getElementById('woDue').value='2026-09-20'; document.getElementById('woTA').value='APP300503\t4'; saveWO();
   window.open=()=>({document:{open(){},write(){},close(){}}});
   printWOPTracked(WOs.findIndex(w=>w.ref==='S-T1'),'CICJM0193XXS01',7);
   markWOPrinted(WOs.findIndex(w=>w.ref==='S-T2')); markWOPrinted(WOs.findIndex(w=>w.ref==='S-OLD')); }, buf);
 await p.waitForTimeout(600);
 const s1=entries().map(e=>e.ref+':'+e.code+':'+e.fabric+':'+e.std+':'+(e.printedAt||'')+(e.extra?':extra':'')).sort();
 await p.evaluate(()=>{ delWO(WOs.findIndex(w=>w.ref==='S-T2')); }); await p.waitForTimeout(500);
 const s1b=entries().filter(e=>e.ref==='S-T2').map(e=>e.cancelledAt||'live');
 const s1c=await p.evaluate(()=>{ smShowTab('cut'); return new Promise(r=>setTimeout(()=>r({notPushed:cutNotPushed().length, rows:document.querySelectorAll('#cutBody .cut-tbl tbody tr').length, tag:(document.querySelector('#cutBody .sm-tag.ok')||{}).textContent||''}),500)); });

 // 2. the cutting room PC (a viewer with the token): the two lines wait; cut all; adjust the main cloth with a comment
 await open(false,'tok-cutting');
 const s2=await p.evaluate(()=>{ smShowTab('cut'); return new Promise(r=>setTimeout(()=>r({src:cutLog.source, rows:[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>tr.textContent.replace(/\s+/g,' ').trim().slice(0,60)), cutAll:!!document.querySelector('#cutBody button[onclick^="cutMarkWO"]'), todo:(document.querySelector('#cutBody .kpi-tile .v')||{}).textContent}),600)); });
 // typing in the search box: the tab redraws on each key and the box keeps its focus and text
 await p.click('#cutQ'); await p.keyboard.type('S-T1'); await p.waitForTimeout(200);
 const sq=await p.evaluate(()=>({q:cutQ, val:document.getElementById('cutQ').value, focused:document.activeElement===document.getElementById('cutQ'), rows:document.querySelectorAll('#cutBody .cut-tbl tbody tr').length, polling:!!cutPoll}));
 await p.evaluate(()=>{ cutQ=''; cutRender(); });
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
 await p.evaluate(()=>cutUnmark('S-T1|CICJM0193XXS01|MESH2290901')); await p.waitForTimeout(500);
 refuseOnce=true; const putsBefore=puts; const alertsBefore=await p.evaluate(()=>window.__alerts.length);
 await p.evaluate(()=>cutMark('S-T1|CICJM0193XXS01|MESH2290901')); await p.waitForTimeout(800);
 const s6={retried:puts-putsBefore, cut:entries().filter(e=>e.fabric==='MESH2290901').map(e=>e.cutAt||'-').join(), alerts:(await p.evaluate(()=>window.__alerts.length))-alertsBefore};
 // a line that reached the file twice reads as one
 store=JSON.stringify(Object.assign(JSON.parse(store),{entries:JSON.parse(store).entries.concat([JSON.parse(store).entries[0]])}));
 // 4. anyone else: reads the Pages copy, sees the log, no buttons
 await open(false,'');
 const s7=await p.evaluate(()=>{ smShowTab('cut'); cutSec='log'; return new Promise(r=>setTimeout(()=>r({src:cutLog.source, rows:document.querySelectorAll('#cutBody .cut-tbl tbody tr').length, buttons:document.querySelectorAll('#cutBody .cut-tbl button').length, tag:(document.querySelector('#cutBody .sm-tag')||{}).textContent||''}),600)); });
 // 5. the editor completes the works order: it leaves WIP, the log shows the completion date; WIP as at the day before still counts it
 await open(true,'tok-editor');
 await p.waitForTimeout(500);
 const s9=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-T1'); openWOModal(i); const cell=fabricCellFor(i, WOs[i].items[0]).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
   return {loadedAtStartup:!!cutLog.loadedAt, cell:cell.slice(0,200), placeholder:(fabricCellFor(i, WOs[i].items[0]).match(/placeholder="([^"]*)"/)||[])[1]}; });
 const s8=await p.evaluate(()=>{ window.now=()=>new Date('2026-10-02T10:00:00'); completeWholeWO(WOs.findIndex(w=>w.ref==='S-T1')); smShowTab('cut'); cutSec='log';
   return new Promise(r=>setTimeout(()=>{ cutRender(); const done=[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>tr.children[9].textContent.trim());
     smShowTab('kpi'); kpiWipAsAt='2026-10-01'; kpiRender(); const kpiBefore=(document.querySelector('#kpiWip .kpi-tile .v')||{}).textContent; const rowsBefore=document.querySelectorAll('#kpiWip table tbody tr').length;
     kpiWipAsAt=''; kpiRender(); const kpiNow=(document.querySelector('#kpiWip .kpi-tile .v')||{}).textContent; const assumedNow=[...document.querySelectorAll('#kpiWip table tbody tr')].map(tr=>tr.children[3].textContent.trim());
     const c=completedWOs.find(x=>x.ref==='S-T1'&&x.code==='CICJM0193XXS01'); const l=fabLines().find(x=>x.ref==='S-T1'&&x.code==='CICJM0193XXS01');
     smShowTab('fabric'); fabOpen.mon['2026-10']=true; fabOpen.day['2026-10-02']=true; fabRender(); const row=[...document.querySelectorAll('#fabBody .sm-tbl tbody tr, #fabBody .fab-stk tbody tr')].map(tr=>tr.textContent.replace(/\s+/g,' ')).find(t=>/S-T1/.test(t))||'';
     r({wipNow:cutWip('2026-10-02').total, wipBefore:cutWip('2026-10-01').total, done, kpiBefore, rowsBefore, kpiNow, assumedNow,
        rec:{actual:c.fabric.actual, std:c.fabric.std, source:c.fabric.source, note:c.fabric.cutNote, meshActual:c.fabric.extras[0].actual, meshStd:c.fabric.extras[0].std}, ledger:{metres:l.metres, varPct:Math.round(l.varPct*10)/10, note:l.cutNote}, rowHasNote:/roll end, 0.65 m short/.test(row)}); },600)); });
 console.log('printed   ->', JSON.stringify(s1), JSON.stringify(s1b), JSON.stringify(s1c));
 console.log('cutting   ->', JSON.stringify(s2), JSON.stringify(sq)); console.log('marked    ->', s3a, s3b, JSON.stringify(s3), JSON.stringify(s4));
 console.log('figures   ->', JSON.stringify(s5)); console.log('conflict  ->', JSON.stringify(s6)); console.log('viewer    ->', JSON.stringify(s7)); console.log('panel     ->', JSON.stringify(s9)); console.log('completed ->', JSON.stringify(s8));
 const pass = s1.join('|')==='S-T1:CICJM0193XXS01:MESH2290901:1.75:2026-10-01:extra|S-T1:CICJM0193XXS01:PC2001ECO:7.35:2026-10-01|S-T2:APP300503:PC2003ECO:5:2026-10-01'
   && s1b.join()==='2026-10-01' && s1c.notPushed===0 && !entries().some(e=>e.ref==='S-OLD') && s1c.rows===2 && /mark cuts/.test(s1c.tag)
   && s2.src==='api' && s2.rows.length===2 && s2.cutAll && s2.todo==='2' && sq.q==='S-T1' && sq.val==='S-T1' && sq.focused && sq.rows===2 && sq.polling
   && s3a===1 && s3b===0 && s3.join()==='2026-10-01:1.75,2026-10-01:8' && s4.join('|')==='MESH2290901:1.75::std|PC2001ECO:8:roll end, 0.65 m short:adj'
   && /Cut today=9.8 m/.test(s5.tiles.join()) && /Live, not on the log=0/.test(s5.tiles.join()) && s5.logRows.length===2 && s5.logRows.some(r=>r[0]==='01 Oct 2026'&&r[7].startsWith('8.00')&&r[8]==='roll end, 0.65 m short'&&r[9]==='in WIP'&&/Undo/.test(r[10]))
   && s5.day.length===1 && s5.day[0][2]==='9.75' && s5.wip.length===3 && s5.wip[0][0].startsWith('PC2001ECO') && s5.wip[0][5]==='£17.12' && s5.wip[2][5]==='£19.19' && Math.abs(s5.wipCalc.total.value-19.19)<0.01
   && s6.retried===2 && s6.cut==='2026-10-01' && s6.alerts===0
   && s7.src==='pages' && s7.rows===2 && JSON.parse(store).entries.length===4 && s7.buttons===0 && s7.tag==='view only'
   && s8.wipNow.lines===1 && s8.wipNow.assumed===1 && Math.abs(s8.wipNow.value-4.64)<0.01 && s8.wipBefore.lines===3 && s8.wipBefore.logged===2 && Math.abs(s8.wipBefore.value-23.83)<0.01
   && s8.done.join()==='02 Oct 2026,02 Oct 2026' && s8.kpiBefore==='£23.83' && s8.rowsBefore===4 && s8.kpiNow==='£4.64' && s8.assumedNow.join('|')==='2.00 m taken as cut|'
   && s9.loadedAtStartup && /cut 01 Oct 2026 .middot; cutting room: 8 m .middot; roll end, 0.65 m short \(used as the actual\)/.test(s9.cell) && s9.placeholder==='8'
   && s8.rec.actual===8 && s8.rec.std===7.35 && /cut log/.test(s8.rec.source) && s8.rec.note==='roll end, 0.65 m short' && s8.rec.meshActual===undefined && s8.rec.meshStd===1.75
   && s8.ledger.metres===9.75 && s8.ledger.varPct===8.8 && s8.ledger.note==='roll end, 0.65 m short' && s8.rowHasNote;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
