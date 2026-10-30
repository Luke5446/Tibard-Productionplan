// Sage's stock import routines reject a reference over 20 characters, spaces
// included. sageRef picks the first form that fits and cuts only as a last
// resort; stAddRef drops 'Stock Take' to 'ST' and then to the note alone.
const { chromium } = require('playwright');
const path=require('path');
const URL='file://'+path.join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(URL); await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({
   short:sageRef('WO-0001'), fits:sageRef('Stock Take ADJ-7','ST ADJ-7','ADJ-7'),
   drop:stAddRef('PO-2026-0001234'), note:stAddRef('ABCDEFGHIJKLMNOPQR'), cut:stAddRef('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
   empty:stAddRef(''), spaces:sageRef('  WO  0001  '), emb:sageRef('Embroidery E-LONGREF-123','EMB E-LONGREF-123','E-LONGREF-123'),
   warnNone:stRefWarn('ADJ-7'), warnDrop:stRefWarn('PO-2026-0001234'), warnCut:stRefWarn('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
   wo:fabricWriteOffRows([{ref:'S-A-VERY-LONG-SPECIAL-REF-99', completed:'2026-10-30', fabric:{code:'CO5241ECO', std:2}}])[0][5] }));
 const ok=r.short==='WO-0001' && r.fits==='Stock Take ADJ-7' && r.drop==='ST PO-2026-0001234' && r.note==='ABCDEFGHIJKLMNOPQR' && r.cut==='ABCDEFGHIJKLMNOPQRST'
   && r.empty==='Stock Take' && r.spaces==='WO 0001' && r.emb==='EMB E-LONGREF-123' && r.warnNone==='' && /ST PO-2026-0001234/.test(r.warnDrop) && /ABCDEFGHIJKLMNOPQRST"/.test(r.warnCut)
   && r.wo==='S-A-VERY-LONG-SPECIA' && r.wo.length===20 && !errs.length;
 console.log(JSON.stringify(r), errs); console.log(ok?'PASS':'FAIL'); await b.close(); process.exit(ok?0:1);
})();
