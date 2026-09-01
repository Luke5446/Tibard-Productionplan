const { chromium } = require('playwright');
const T=a=>a.join('\t');
// 12 columns now; last is the customer's own order reference
const paste=[
 T(['OH-1','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN BIB APRON','100','2026-09-11','Oliver Harvey Proforma','WORKS ORDER','Oliver Harvey','S012607POH0013294 - Maldon']),
 T(['OH-2','OLIVER HARVEY','0000114816','2','LOGOAPPLICATION','Maldon logo left chest','100','2026-09-11','Oliver Harvey Proforma','NOTE - charge or logo line','','S012607POH0013294 - Maldon']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(200);
 const q=await p.evaluate(()=>({parsed:smPending[0].custOrder,
   cell:document.querySelector('#smPendingList .sm-tbl tbody tr td:nth-child(3)').innerText.replace(/\n/g,' | ')}));
 console.log('review queue:', JSON.stringify(q));
 await p.evaluate(()=>{window.confirm=()=>true; smTickAll(true); smCreateAllShown();}); await p.waitForTimeout(200);
 const l=await p.evaluate(()=>({onWO:WOs.find(w=>w.sm).sm.custOrder,
   cell:document.querySelector('#smList .sm-tbl tbody tr td:nth-child(3)').innerText.replace(/\n/g,' | ')}));
 console.log('live table:  ', JSON.stringify(l));
 // and it survives a reload, plus back-compat with an 11-column paste
 const old=await p.evaluate(()=>{ smPending=[]; smSeen={};
   document.getElementById('smTA').value="OH-9\tTIBARD\t0000999\t1\tXX1\tOld eleven column paste\t5\t2026-09-30\tKLONDYKE\tWORKS ORDER\tTibard";
   smLoadPaste(); return {n:smPending.length, custOrder:smPending[0].custOrder}; });
 console.log('11-col paste still works:', JSON.stringify(old));
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await b.close();
})();
