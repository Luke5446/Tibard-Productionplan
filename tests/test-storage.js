// Where the editor's data lives. localStorage is capped for the whole
// origin, which the costing app shares, and once the two passed the cap
// every save here failed silently and printed or deleted works orders came
// back on the next open. Now:
//   - a save goes to IndexedDB as well as localStorage, and a reload takes
//     the newer of the two
//   - when localStorage refuses (quota), the save still lands in IndexedDB
//     and the reload shows it
//   - when both refuse, the header says NOT SAVED and the PM is told once
//   - a tab closed the instant after a save can leave IndexedDB one save
//     behind; that older copy never overrides what localStorage kept, even
//     when the state has works orders but no buffer sheet
//   - Clear all data empties both
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=T(['APP300503','BLACK BIB APRON','40','120','0','30','90','160','300']);
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const open=async()=>{ await p.goto(URL); await p.waitForTimeout(500); await p.evaluate(()=>{ window.now=()=>new Date('2026-09-30T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); }); };
 await open();
 // 1. a normal save reaches both stores; a reload restores it
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); document.getElementById('woRef').value='S-ST1'; document.getElementById('woStart').value='2026-09-30'; document.getElementById('woDue').value='2026-10-10'; document.getElementById('woTA').value='ZZSPECIAL01\t5'; saveWO(); }, buf);
 await p.waitForTimeout(300);
 const s1=await p.evaluate(()=>new Promise(res=>{ idbGet(j=>res({idb:j?JSON.parse(j).WOs.map(w=>w.ref).join():'none', local:JSON.parse(localStorage.getItem('tibard_production')).WOs.map(w=>w.ref).join()})); }));
 await open(); await p.waitForTimeout(300);
 const s2=await p.evaluate(()=>WOs.map(w=>w.ref+(w.printed?'*':'')).join());
 // 2. localStorage refuses: print a works order and delete nothing else; the reload must still show it printed
 await p.evaluate(()=>{ Storage.prototype.setItem=function(){ const e=new Error('QuotaExceededError'); e.name='QuotaExceededError'; throw e; }; markWOPrinted(0); });
 await p.waitForTimeout(300);
 const s3=await p.evaluate(()=>({ind:document.getElementById('saveInd').textContent.trim(), alerts:window.__alerts.length}));
 await open(); await p.waitForTimeout(400);
 const s4=await p.evaluate(()=>({wos:WOs.map(w=>w.ref+(w.printed?'*':'')).join(), stamp:document.getElementById('lastUpdated').textContent}));
 // 3. both refuse: the header says NOT SAVED and the PM is told once
 await p.evaluate(()=>{ Storage.prototype.setItem=function(){ throw new Error('QuotaExceededError'); }; window.idbSet=function(json,cb){ cb(false); }; delWO(0); saveState(); });
 await p.waitForTimeout(200);
 const s5=await p.evaluate(()=>({ind:document.getElementById('saveInd').textContent.trim(), alerts:window.__alerts.length, first:(window.__alerts[0]||'').split('\n')[0]}));
 // 4. IndexedDB one save behind (its write aborted by the tab closing): the newer localStorage copy wins, with no buffer rows loaded too
 await open(); await p.waitForTimeout(300);
 await p.evaluate(()=>new Promise(res=>{ const st=JSON.parse(localStorage.getItem('tibard_production')); const old=Object.assign({},st,{WOs:[],savedAt:'2026-09-29T09:00:00.000Z'}); idbSet(JSON.stringify(old),()=>res()); }));
 await open(); await p.waitForTimeout(400);
 const s7=await p.evaluate(()=>new Promise(res=>{ const mem=WOs.map(w=>w.ref).join(); idbGet(j=>res({mem, idbNow:JSON.parse(j).WOs.map(w=>w.ref).join()})); }));
 await p.evaluate(()=>new Promise(res=>{ const st=JSON.parse(localStorage.getItem('tibard_production')); st.rows=[]; localStorage.setItem('tibard_production',JSON.stringify(st)); const old=Object.assign({},st,{WOs:[],savedAt:'2026-09-29T09:00:00.000Z'}); idbSet(JSON.stringify(old),()=>res()); }));
 await open(); await p.waitForTimeout(400);
 const s8=await p.evaluate(()=>WOs.map(w=>w.ref).join()+'/'+rows.length);
 // 5. clear all empties both stores
 const s6=await p.evaluate(()=>new Promise(res=>{ const before=WOs.length; clearAll(); setTimeout(()=>idbGet(j=>res({before:before, idb:j?'still there':'gone', local:localStorage.getItem('tibard_production')?'still there':'gone'})),300); }));
 console.log('saved   ->', JSON.stringify(s1)); console.log('reload  ->', s2);
 console.log('quota   ->', JSON.stringify(s3)); console.log('reload2 ->', JSON.stringify(s4));
 console.log('both    ->', JSON.stringify(s5)); console.log('stale   ->', JSON.stringify(s7), s8); console.log('clear   ->', JSON.stringify(s6));
 const pass = s1.idb==='S-ST1' && s1.local==='S-ST1' && s2==='S-ST1'
   && /Saved/.test(s3.ind) && /nearly full/.test(s3.ind) && s3.alerts===0
   && s4.wos==='S-ST1*' && /Loaded|Last saved/.test(s4.stamp)
   && /NOT SAVED/.test(s5.ind) && s5.alerts===1 && /could not be saved in the browser/.test(s5.first)
   && s7.mem==='S-ST1' && s8==='S-ST1/0'
   && s6.before===1 && s6.idb==='gone' && s6.local==='gone';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
