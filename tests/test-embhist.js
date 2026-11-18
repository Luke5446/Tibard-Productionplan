// The Embroidery tab's Done history and who completes an embroidery-only or
// DTF works order (Luke, 18 Nov 2026). The two SHARP DTF aprons made on 17
// Nov were completed by the PM from the works order card: no done mark on
// the Embroidery tab, no book-in, no Sage files, and the jobs vanished.
//   - the card and the panel carry no Complete button for an embroidery-only
//     works order; completeWholeWO refuses with a message and the order stays
//   - the Embroidery queue lists every live embroidery-only line, picked or
//     not ("not picked yet"), so the embroidery room can always mark it done
//   - Done history: every done mark by the day it was marked, searchable,
//     with the machine and the book-in; a line stays there after the
//     warehouse books it in and it leaves the queue
//   - a line completed from the card before the guard is in the history
//     flagged "completed from the card" and on EMB to book in, so the
//     warehouse can still move the stock in Sage
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=[T(['HT016003','BLACK VELCRO FASTEN SKULL CAP','568','203','0','60','180','360','700']), T(['APP300503','BLACK BIB APRON','40','120','0','30','90','160','300'])].join('\n');
const URL='file://'+require('path').join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext(); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const files={}, shas={};
 const enc=s=>Buffer.from(s,'utf8').toString('base64'), dec=s=>Buffer.from(s,'base64').toString('utf8');
 await p.route('https://api.github.com/repos/Luke5446/Tibard-Cutlog/contents/**', async route=>{ const req=route.request(); const file=req.url().split('/contents/')[1].split('?')[0];
   if(req.method()==='GET'){ if(!files[file]) return route.fulfill({status:404, contentType:'application/json', body:'{"message":"Not Found"}'}); return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:enc(files[file]), sha:'sha'+(shas[file]||0)})}); }
   if(req.method()==='PUT'){ const body=JSON.parse(req.postData()); if(files[file] && body.sha!=='sha'+(shas[file]||0)) return route.fulfill({status:409, body:'{}'}); files[file]=dec(body.content); shas[file]=(shas[file]||0)+1; return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:{sha:'sha'+shas[file]}})}); }
   route.fulfill({status:405, body:''}); });
 await p.route('https://luke5446.github.io/Tibard-Cutlog/**', route=>{ const file=route.request().url().split('/Tibard-Cutlog/')[1].split('?')[0]; if(!files[file]) return route.fulfill({status:404, body:''}); route.fulfill({status:200, contentType:'application/json', body:files[file]}); });
 await p.route('https://luke5446.github.io/Tibard-Stock-Planner/**', r=>r.fulfill({status:404, body:''}));
 const entries=f=>files[f]?JSON.parse(files[f]).entries:[];
 const wait=ms=>p.waitForTimeout(ms);
 await p.goto(URL+'?edit'); await wait(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-11-18T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); window.open=function(){ return {document:{open(){},write(){},close(){}}, focus(){}, print(){}, close(){}}; }; try{ localStorage.setItem('tibard_cutlog_token','tok-editor'); }catch(e){} });

 // 1. an embroidery-only works order and a DTF one, plus a normal one; neither branded card has a Complete button, the apron's has
 const s1=await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste();
   const mk=(ref,code,qty,emb)=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-11-18'; document.getElementById('woDue').value='2026-11-25'; document.getElementById('woTA').value=code+'\t'+qty; document.getElementById('woEmbOnly').checked=!!emb; saveWO(); };
   mk('E-GIR1','GIRHT016003',18,true); mk('S-DTF1','TRGAPP300503SHARP',4,false); mk('S-AP1','APP300503',5,false);
   const card=r=>[...document.querySelectorAll('.woc')].find(c=>c.textContent.indexOf(r)>=0);
   const dtf=WOs.find(w=>w.ref==='S-DTF1');
   return {dtf:!!(dtf.embOnly&&dtf.dtf), pick:dtf.pickCode, gir:/Complete whole WO/.test(card('E-GIR1').textContent), dtfBtn:/Complete whole WO/.test(card('S-DTF1').textContent), dtfNote:/Done on the Embroidery tab/.test(card('S-DTF1').textContent), ap:/Complete whole WO/.test(card('S-AP1').textContent)}; }, buf);
 // 2. the PM cannot complete them: the function refuses, the orders stay; the panel hides the button
 const s2=await p.evaluate(()=>{ const n0=WOs.length; completeWholeWO(WOs.findIndex(w=>w.ref==='S-DTF1')); completeWholeWO(WOs.findIndex(w=>w.ref==='E-GIR1'));
   openWOModal(WOs.findIndex(w=>w.ref==='S-DTF1')); const hid=document.getElementById('woModalCompleteAll').style.display==='none'; closeWOModal();
   openWOModal(WOs.findIndex(w=>w.ref==='S-AP1')); const shown=document.getElementById('woModalCompleteAll').style.display===''; closeWOModal();
   return {kept:WOs.length===n0, alerts:window.__alerts.length, msg:/DTF transfer works order is not completed here/.test(window.__alerts[0]||''), hid, shown, completed:completedWOs.length}; });
 // 3. the Embroidery tab: both on the queue, not picked yet; a done job the PM completed from the card earlier is in the history and on EMB to book in
 await p.evaluate(()=>{ completedWOs.push({ref:'S-TIB874419-Pt2', code:'TRGAPP300503SHARP', desc:'Black Poly/Cotton Bib Apron + Sharp Chef Transfer', qty:4, completed:'2026-11-17', embOnly:true, pickCode:'APP300503', dtf:true}); saveState(); smShowTab('emb'); });
 await wait(900);
 const s3=await p.evaluate(()=>{ const rows=[...document.querySelectorAll('#embBody .wh-section')][0].querySelectorAll('tbody tr'); const q=embQueue();
   const hist=embHistory(); const tb=embToBook();
   return {q:q.map(l=>l.ref+':'+(l.picked?'picked':'np')+':'+(l.doneAt?'done':'open')).sort().join(' '), rowsNp:[...rows].filter(tr=>/not picked yet/.test(tr.textContent)).length,
     hist:hist.map(r=>r.ref+':'+r.how+':'+r.done+':'+(r.bookedAt?'booked':'nb')).join(' '), histText:/completed from the card/.test(document.getElementById('embBody').textContent),
     toBook:tb.map(l=>l.ref+(l.fromCard?':card':'')).join(' ')}; });
 // 4. machine, done: the history has it today with the machine, not booked; the queue still has it (waiting to be booked)
 await p.evaluate(()=>{ embSetMachine(embKey('S-DTF1','TRGAPP300503SHARP'), 'DTF'); }); await wait(700);
 await p.evaluate(()=>{ embComplete(embKey('S-DTF1','TRGAPP300503SHARP')); }); await wait(700);
 const s4=await p.evaluate(()=>{ const h=embHistory().find(r=>r.ref==='S-DTF1'); const body=document.getElementById('embBody').textContent;
   return {done:h&&h.done, machine:h&&h.machine, dtf:h&&h.dtf, nb:h&&!h.bookedAt, today:/Today \(1\)/.test(body), inQueue:embQueue().some(l=>l.ref==='S-DTF1'&&l.doneAt)}; });
 s4.log=entries('warehouse.json').filter(e=>e.kind==='emb').length;
 // 5. the warehouse books it in: off the queue, still in the history, booked; the editor completes the order on its next look
 await p.evaluate(()=>{ embBookIn(embKey('S-DTF1','TRGAPP300503SHARP')); }); await wait(900);
 const s5=await p.evaluate(()=>{ whApplyPrintMarks(); const h=embHistory().find(r=>r.ref==='S-DTF1'); const c=completedWOs.find(x=>x.ref==='S-DTF1');
   embHistQ='S-DTF1'; embRender(); const body=document.getElementById('embBody').textContent; const n1=(body.match(/S-DTF1/g)||[]).length;
   embHistQ='nothing-like-this'; embRender(); const none=/No done job matches/.test(document.getElementById('embBody').textContent); embHistQ=''; embRender();
   return {inQueue:embQueue().some(l=>l.ref==='S-DTF1'), hist:!!h, booked:h&&!!h.bookedAt, completed:!!c, embBookedAt:c&&!!c.embBookedAt, live:WOs.some(w=>w.ref==='S-DTF1'), search:n1>=1, none, histCount:embHistory().length}; });
 console.log(JSON.stringify({s1,s2,s3,s4,s5},null,1));
 const pass = s1.dtf && s1.pick==='APP300503' && !s1.gir && !s1.dtfBtn && s1.dtfNote && s1.ap
   && s2.kept && s2.alerts===2 && s2.msg && s2.hid && s2.shown && s2.completed===0
   && s3.q==='E-GIR1:np:open S-DTF1:np:open' && s3.rowsNp===2 && s3.hist==='S-TIB874419-Pt2:pm:2026-11-17:nb' && s3.histText && s3.toBook==='S-TIB874419-Pt2:card'
   && s4.done==='2026-11-18' && s4.machine==='DTF' && s4.dtf && s4.nb && s4.today && s4.inQueue && s4.log===1
   && !s5.inQueue && s5.hist && s5.booked && s5.completed && s5.embBookedAt && !s5.live && s5.search && s5.none && s5.histCount===2
   && errs.length===0;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
