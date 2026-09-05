const { chromium } = require('playwright');
const T=a=>a.join('\t');
// code, desc, inStock, onSOP, onPOP, 1m, 3m, 6m, 12m  -> 6m/182 = daily; (inStock-onSOP)/daily = days
const buf1=[T(['A1','healthy','200','0','0','10','30','60','120']),   // 200/0.33 = 606 days
            T(['A2','critical','1','0','0','10','30','60','120']),    // 3 days
            T(['A3','low','4','0','0','10','30','60','120']),         // 12 days
            T(['A4','ok','7','0','0','10','30','60','120'])].join('\n'); // 21 days
const buf2=[T(['A1','healthy','200','0','0','10','30','60','120']),
            T(['A2','now fine','200','0','0','10','30','60','120'])].join('\n');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(URL); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-04T09:00:00'); window.alert=()=>{}; });
 await p.evaluate(t=>{document.getElementById('pasteTA').value=t; loadPaste();},buf1); await p.waitForTimeout(150);
 const s1=await p.evaluate(()=>({snaps:bufSnaps.length, last:bufSnaps[bufSnaps.length-1],
   tile:(document.getElementById('skuCount')||{}).textContent}));
 console.log('first paste     ->', JSON.stringify(s1));
 // same day, second paste: replaced, not appended
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-04T16:00:00'); });
 await p.evaluate(t=>{document.getElementById('pasteTA').value=t; loadPaste();},buf2); await p.waitForTimeout(150);
 const s2=await p.evaluate(()=>({snaps:bufSnaps.length, last:bufSnaps[bufSnaps.length-1]}));
 console.log('same-day repaste->', JSON.stringify(s2));
 // next day: appended, sorted
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-05T09:00:00'); });
 await p.evaluate(t=>{document.getElementById('pasteTA').value=t; loadPaste();},buf1); await p.waitForTimeout(150);
 const s3=await p.evaluate(()=>({dates:bufSnaps.map(x=>x.date+':'+x.pct)}));
 console.log('next day        ->', JSON.stringify(s3));
 // survives reload and is in the published payload
 await p.reload(); await p.waitForTimeout(500);
 const s4=await p.evaluate(()=>{ const saved=JSON.parse(localStorage.getItem('tibard_production'));
   return {afterReload:bufSnaps.length, inSaved:(saved.bufSnaps||[]).length, cleared:(function(){return true;})()}; });
 console.log('after reload    ->', JSON.stringify(s4));
 const pass = s1.snaps===1 && s1.last.pct===50 && s1.last.critical===1 && s1.last.low===1 && s1.last.ok===1 && s1.last.healthy===1
   && s2.snaps===1 && s2.last.pct===100 && s3.dates.join()==='2026-09-04:100,2026-09-05:50' && s4.afterReload===2 && s4.inSaved===2;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
