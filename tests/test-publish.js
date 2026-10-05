// Publish for team: with a GitHub token on the PC the editor's state goes
// straight into the repo's data.json through the API (sha read, put back,
// read again on a stale sha); with no token, or a refused one, the file is
// downloaded for the upload-and-commit routine, with the reason. The token
// is its own, not the cutting log's.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=T(['APP300503','BLACK BIB APRON','40','120','0','30','90','160','300']);
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 let store=null, sha=0, puts=0, refuseOnce=true, msg='', auth='';
 await p.route('https://api.github.com/repos/Luke5446/Tibard-Productionplan/**', async route=>{ const req=route.request(); auth=req.headers()['authorization']||'';
   if(req.method()==='GET'){ if(!store) return route.fulfill({status:404, contentType:'application/json', body:'{}'}); return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({sha:'sha'+sha})}); }
   if(req.method()==='PUT'){ puts++; const body=JSON.parse(req.postData()); if(refuseOnce){ refuseOnce=false; return route.fulfill({status:409, contentType:'application/json', body:'{}'}); }
     if(store && body.sha!=='sha'+sha) return route.fulfill({status:409, contentType:'application/json', body:'{}'});
     store=Buffer.from(body.content,'base64').toString('utf8'); msg=body.message; sha++; return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:{sha:'sha'+sha}})}); }
   route.fulfill({status:405, body:''}); });
 await p.route('https://api.github.com/repos/Luke5446/Tibard-Cutlog/**', r=>r.fulfill({status:404, body:'{}'}));
 await p.route('https://luke5446.github.io/**', r=>r.fulfill({status:404, body:''}));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(t=>{ window.__alerts=[]; window.alert=m=>window.__alerts.push(m); window.__dl=0;
   const orig=document.createElement.bind(document); document.createElement=function(x){ const el=orig(x); if(x==='a') el.click=()=>{ window.__dl++; }; return el; };
   try{ localStorage.removeItem('tibard_prod_token'); localStorage.setItem('tibard_cutlog_token','tok-cut'); }catch(e){}
   document.getElementById('pasteTA').value=t; loadPaste(); }, buf);
 // 1. no token: the download, and the cutting-log token is not borrowed
 const s1=await p.evaluate(()=>{ pubRefreshBtn(); const before=window.__dl; publishData(); return {btn:document.getElementById('pubSetupBtn').textContent.trim(), dl:window.__dl-before, alert:(window.__alerts[window.__alerts.length-1]||'').slice(0,21)}; });
 const s1b={puts, auth};
 // 2. a token on the PC: straight into the repo, the stale sha read past, the header says so
 await p.evaluate(()=>{ window.prompt=()=>'tok-prod'; pubSetup(); publishData(); }); await p.waitForTimeout(1200);
 const s2=await p.evaluate(()=>({btn:document.getElementById('pubSetupBtn').textContent.trim(), dl:window.__dl, ind:document.getElementById('saveInd').textContent, lu:document.getElementById('lastUpdated').textContent.slice(0,10), pbtn:document.getElementById('publishBtn').textContent.trim(), alerts:window.__alerts.length}));
 const pub=store?JSON.parse(store):null;
 const s2b={puts, auth, msg:msg.slice(0,25), rows:pub?pub.rows.length:0, wos:pub?Array.isArray(pub.WOs):false, savedAt:!!(pub&&pub.savedAt), keys:pub?Object.keys(pub).length:0};
 // 3. the token refused: the download with the reason, the button back
 await p.unroute('https://api.github.com/repos/Luke5446/Tibard-Productionplan/**'); await p.route('https://api.github.com/repos/Luke5446/Tibard-Productionplan/**', r=>r.fulfill({status:401, contentType:'application/json', body:'{}'}));
 await p.evaluate(()=>publishData()); await p.waitForTimeout(800);
 const s3=await p.evaluate(()=>({dl:window.__dl, alert:(window.__alerts[window.__alerts.length-1]||'').slice(0,70), pbtn:document.getElementById('publishBtn').textContent.trim()}));
 console.log('no token ->', JSON.stringify(s1), JSON.stringify(s1b)); console.log('token    ->', JSON.stringify(s2), JSON.stringify(s2b)); console.log('refused  ->', JSON.stringify(s3));
 const pass = s1.btn==='⚙ Set up this PC' && s1.dl===1 && s1.alert==='data.json downloaded.' && s1b.puts===0 && s1b.auth===''
   && s2.btn==='⚙ Token' && s2.dl===1 && s2.ind==='✓ Published' && s2.lu==='Published:' && s2.pbtn==='📤 Publish for team' && s2.alerts===1
   && s2b.puts===2 && s2b.auth==='Bearer tok-prod' && s2b.msg==='Production plan published' && s2b.rows===1 && s2b.wos && s2b.savedAt && s2b.keys===17
   && s3.dl===2 && /^GitHub did not take the publish \(GitHub said 401 \(token refused\)\)/.test(s3.alert) && s3.pbtn==='📤 Publish for team'
   && errs.length===0;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
