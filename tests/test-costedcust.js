// A special code belongs to one customer for life, so the customer recorded at
// costing is a safe last resort when Sage's fields are empty.
const { chromium } = require('playwright');
const T=a=>a.join('\t');
// customer and reference both blank in Sage
const paste=T(['OH-9','OLIVER HARVEY','0000115000','1','OHAPB0631DSTIE01','BISCUIT WAIST APRON','20','2026-09-25','','WORKS ORDER','Oliver Harvey','','']);
const exp={code:"OHAPB0631DSTIE01",name:"Biscuit waist apron",desc:"2 x hip pocket",
 lectra:"OHAPP0631",chart:"",chartRows:[],
 fabrics:[["BISCUIT COT/POLY","PC9068","B6",0.52,5.3651]],
 trims:[["LABELOH5771","OH woven label",1]],mfg:["Hem"],fin:["Press"],
 machMins:10,finMins:10,cutBatch:24,cutMins:15,oneSize:true,
 sr:"SR-0001",customer:"THWAITES THORPE PARK"};
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(150);
 const before=await p.evaluate(()=>document.querySelector('#smPendingList .sm-tbl tbody tr td:nth-child(3)').innerText.trim());
 console.log('before import (Sage blank):', JSON.stringify(before));
 await p.evaluate(j=>{smOpenImport(); document.getElementById('impTA').value=JSON.stringify(j); smDoImport();}, exp);
 await p.waitForTimeout(200);
 const after=await p.evaluate(()=>document.querySelector('#smPendingList .sm-tbl tbody tr td:nth-child(3)').innerText.trim());
 console.log('after import            :', JSON.stringify(after));
 await p.evaluate(()=>{window.confirm=()=>true; smTickAll(true); smCreateAllShown();}); await p.waitForTimeout(250);
 const [pop]=await Promise.all([p.waitForEvent('popup'),
   p.evaluate(()=>{window.print=()=>{}; (function(){var w=WOs.find(w=>w.sm);printWOPTracked(WOs.indexOf(w),w.items[0].code,w.items[0].qty);})();})]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
 const t=await pop.evaluate(()=>document.body.innerText);
 await pop.close();
 console.log('printed works order     :', t.includes('THWAITES THORPE PARK')?'THWAITES THORPE PARK':'still blank');
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await b.close();
})();
