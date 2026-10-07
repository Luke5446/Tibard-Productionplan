// The cutting room saw "GitHub refused the save (500)" at 16:00 on 7 Oct
// 2026, with the commit in the repo all the same. A save answered 5xx is
// tried again after a pause (GH_RETRIES times), re-reading the file first:
//   - the PUT 500s but the commit landed: the re-read finds the line cut,
//     "nothing to do", no alert
//   - the PUT 500s and nothing landed: the retry saves it
//   - the read itself 500s once: tried again
//   - 5xx every time: the alert says GitHub is having trouble and nothing
//     is lost
const { chromium } = require('playwright');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const enc=s=>Buffer.from(s,'utf8').toString('base64'), dec=s=>Buffer.from(s,'base64').toString('utf8');
 const fresh=()=>JSON.stringify({entries:[{k:'WO-1|CODE|FAB', ref:'WO-1', code:'CODE', desc:'', qty:5, fabric:'FAB', std:2, printedAt:'2026-10-01'}], savedAt:''});
 let store=fresh(), sha=1, plan={get:[], put:[]}, puts=0, gets=0;
 // plan.get / plan.put: a queue of statuses to answer with before behaving normally; 'land' = answer 500 but store the content
 await p.route('https://api.github.com/**', async route=>{
   const req=route.request();
   if(req.method()==='GET'){ gets++; const s=plan.get.shift(); if(s) return route.fulfill({status:s, contentType:'application/json', body:'{"message":"boom"}'});
     return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:enc(store), sha:'sha'+sha})}); }
   if(req.method()==='PUT'){ puts++; const body=JSON.parse(req.postData()); const s=plan.put.shift();
     if(s==='land'){ store=dec(body.content); sha++; return route.fulfill({status:500, contentType:'application/json', body:'{"message":"Server Error"}'}); }
     if(s) return route.fulfill({status:s, contentType:'application/json', body:'{"message":"boom"}'});
     if(body.sha!=='sha'+sha) return route.fulfill({status:409, contentType:'application/json', body:'{"message":"sha mismatch"}'});
     store=dec(body.content); sha++; return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:{sha:'sha'+sha}, commit:{message:body.message}})}); }
   route.fulfill({status:405, body:''}); });
 await p.route('https://luke5446.github.io/**', route=>route.fulfill({status:404, body:''}));
 await p.goto(URL); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-10-07T16:00:00'); window.__alerts=[]; window.alert=m=>window.__alerts.push(m); window.GH_RETRY_MS=100; try{ localStorage.setItem('tibard_cutlog_token','tok'); }catch(e){} });
 const cutAt=()=>JSON.parse(store).entries[0].cutAt||'';
 const mark=async()=>{ await p.evaluate(()=>{ cutLog.loadedAt=null; cutLog.error=''; }); await p.evaluate(()=>new Promise(res=>cutLoad(()=>res()))); await p.evaluate(()=>{ smShowTab('cut'); cutRender(); cutMark('WO-1|CODE|FAB'); }); await p.waitForTimeout(1500); return p.evaluate(()=>({alerts:window.__alerts.splice(0), err:cutLog.error, busy:cutLog.busy, cut:cutLog.entries[0].cutAt||''})); };

 // 1. the PUT 500s but the commit landed
 plan={get:[], put:['land']}; puts=0; gets=0;
 const r1=await mark(); const s1={cut:cutAt(), puts, alerts:r1.alerts.length, err:r1.err, shown:r1.cut};
 // 2. the PUT 500s and nothing landed: the retry saves it
 store=fresh(); plan={get:[], put:[500]}; puts=0;
 const r2=await mark(); const s2={cut:cutAt(), puts, alerts:r2.alerts.length, err:r2.err, shown:r2.cut};
 // 3. the read 500s once (502 for variety), then the save goes through
 store=fresh(); plan={get:[502], put:[]}; puts=0; gets=0;
 const r3=await mark(); const s3={cut:cutAt(), puts, gets, alerts:r3.alerts.length, err:r3.err};
 // 4. 5xx every time: the alert, nothing lost, the line still waiting
 store=fresh(); plan={get:[], put:[500,503,500,500,500]}; puts=0;
 const r4=await mark(); const s4={cut:cutAt(), puts, alerts:r4.alerts, err:r4.err, busy:r4.busy, shown:r4.cut};
 console.log(JSON.stringify({s1,s2,s3,s4}));
 const ok = s1.cut==='2026-10-07' && s1.puts===1 && s1.alerts===0 && s1.err==='' && s1.shown==='2026-10-07'
   && s2.cut==='2026-10-07' && s2.puts===2 && s2.alerts===0 && s2.err==='' && s2.shown==='2026-10-07'
   && s3.cut==='2026-10-07' && s3.puts===1 && s3.gets===3 && s3.alerts===0 && s3.err===''
   && s4.cut==='' && s4.puts===4 && s4.alerts.length===1 && /refused the save \(500\) - GitHub is having trouble; the cut has not been lost/.test(s4.alerts[0]) && /Nothing was lost/.test(s4.alerts[0]) && s4.busy===false && s4.shown===''
   && errs.length===0;
 console.log(ok?'PASS':'FAIL'); if(!ok) console.log(errs.join('\n'));
 await b.close(); process.exit(ok?0:1);
})();
