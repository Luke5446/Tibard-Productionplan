// S-1757 (Luke, 13 Nov 2026): a works order printed, deleted and raised
// again under the same number was never put back on the cutting room's list,
// because its withdrawn line counted as settled. Now the withdrawn line is
// revived when the works order is printed again. And a works order still on
// the To cut list cannot be completed (whole or one line) until the cutting
// room marks it cut; an embroidery-only one, with no cutting, completes freely.
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
 const lines=ref=>entries().filter(e=>e.ref===ref).map(e=>e.k+':'+(e.cutAt?'cut':e.cancelledAt?'withdrawn':'waiting')+':'+(e.printedAt||'')+':'+e.qty);
 await p.goto(URL+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(t=>{ window.now=()=>new Date('2026-11-05T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); try{ localStorage.setItem('tibard_cutlog_token','tok-editor'); }catch(e){}
   document.getElementById('pasteTA').value=t; loadPaste(); }, buf);
 const mk=(ref,ta,emb)=>p.evaluate(([ref,ta,emb])=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-11-05'; document.getElementById('woDue').value='2026-11-11'; document.getElementById('woTA').value=ta; if(emb){ document.getElementById('woEmbOnly').checked=true; } saveWO(); }, [ref,ta,emb]);
 const print=ref=>p.evaluate(ref=>markWOPrinted(WOs.findIndex(w=>w.ref===ref)), ref);
 // 1. printed, deleted (withdrawn), raised again under the same number and printed: the line comes back
 await mk('S-1757','APP300503\t12'); await print('S-1757'); await p.waitForTimeout(600);
 const s1=lines('S-1757');
 await p.evaluate(()=>delWO(WOs.findIndex(w=>w.ref==='S-1757'))); await p.waitForTimeout(600);
 const s2=lines('S-1757');
 await mk('S-1757','APP300503\t12'); await p.waitForTimeout(2400);
 const s3={log:lines('S-1757'), notPushed:await p.evaluate(()=>cutNotPushed().map(w=>w.ref).join())};   // unprinted: nothing yet
 await p.evaluate(()=>{ window.now=()=>new Date('2026-11-06T10:00:00'); }); await print('S-1757'); await p.waitForTimeout(600);
 const s4={log:lines('S-1757'), n:entries().filter(e=>e.ref==='S-1757').length, revived:entries().find(e=>e.ref==='S-1757').revivedAt, notPushed:await p.evaluate(()=>cutNotPushed().map(w=>w.ref).join())};
 const s5=await p.evaluate(()=>{ smShowTab('cut'); return new Promise(r=>setTimeout(()=>r({rows:[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>tr.textContent.replace(/\s+/g,' ').trim()).join('|')}),500)); });
 // 2. still to cut: neither the whole works order nor its one line can be completed
 const s6=await p.evaluate(()=>{ window.__alerts=[]; var i=WOs.findIndex(w=>w.ref==='S-1757'); completeWholeWO(i); var a=window.__alerts.length; delWOItem(i,'APP300503'); return {alerts:window.__alerts.length, first:a, msg:window.__alerts[0]||'', live:!!WOs.find(w=>w.ref==='S-1757'), done:completedWOs.filter(c=>c.ref==='S-1757').length, held:cutStillToCut(WOs[i]).join()}; });
 // 3. an embroidery-only works order has no cutting: it completes
 await mk('E-1','APP300503\t3',true); await print('E-1'); await p.waitForTimeout(600);
 const s7=await p.evaluate(()=>{ window.__alerts=[]; completeWholeWO(WOs.findIndex(w=>w.ref==='E-1')); return {alerts:window.__alerts.length, done:completedWOs.filter(c=>c.ref==='E-1').length, log:cutLog.entries.filter(e=>e.ref==='E-1').length}; });
 // 4. the cutting room marks S-1757 cut: it completes
 await p.evaluate(()=>cutMarkWO('S-1757')); await p.waitForTimeout(800);
 const s8=await p.evaluate(()=>{ window.__alerts=[]; completeWholeWO(WOs.findIndex(w=>w.ref==='S-1757')); return {alerts:window.__alerts.length, done:completedWOs.filter(c=>c.ref==='S-1757').length, live:!!WOs.find(w=>w.ref==='S-1757')}; });
 // 5. a line cut with the log never read (no token on this PC) is not held
 const s9=await p.evaluate(()=>{ cutLog.loadedAt=null; return cutStillToCut({ref:'X', printed:true, items:[{code:'APP300503'}]}).length; });
 console.log(JSON.stringify({s1,s2,s3,s4,s5,s6,s7,s8,s9},null,1));
 const pass = s1.join()==='S-1757|APP300503|PC2003ECO:waiting:2026-11-05:12'
   && s2.join()==='S-1757|APP300503|PC2003ECO:withdrawn:2026-11-05:12'
   && s3.log.join()===s2.join() && s3.notPushed===''
   && s4.n===1 && s4.log.join()==='S-1757|APP300503|PC2003ECO:waiting:2026-11-06:12' && s4.revived==='2026-11-05' && s4.notPushed===''
   && /S-1757/.test(s5.rows)
   && s6.first===1 && s6.alerts===2 && /still on the cutting room's To cut list \(APP300503\)/.test(s6.msg) && s6.live && s6.done===0 && s6.held==='APP300503'
   && s7.alerts===0 && s7.done===1 && s7.log===0
   && s8.alerts===0 && s8.done===1 && !s8.live
   && s9===0;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
