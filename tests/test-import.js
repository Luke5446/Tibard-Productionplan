// A real costing-app export, matching pcExport() in the costing repo.
const { chromium } = require('playwright');
const exp = {
 code:"OHAPB0631DSTIE01", name:"Apron — Dorchester", desc:"Bib apron, waist ties, eyelets",
 lectra:"OHAPP0631", variant:"0631DSTIE", markerMain:"0631DSTIE01", markerMesh:"",
 markerLen:1.01, layQty:2, hasMesh:false, meshLen:null, meshLay:null,
 chart:"OHAPB0631DSTIE01-MEAS", chartCols:["Measurement","Value"],
 chartRows:[["WIDTH OF SKIRT","70"],["Pocket","18.5 × 19.5"],["LENGTH FROM WAIST TO HEM","45"],
            ["LENGTH OF SIDE SEAM","45"],["WAIST TIES LENGTH X WIDTH","108 × 2.6"]],
 fabrics:[["BISCUIT COT/POLY 55/45 300GSM","PC9068","B6",0.52,5.3651]],
 trims:[["","COATS EPIC 80'S BISCUIT 08569",150],
        ["CMP-STD-PST-9B-287","LARGE BRONZE STUD MALE PART",2],
        ["LABELOH5771","Oliver Harvey 'Button' Woven Centrefold Label (32x80mm)",1],
        ["TAXTABOH07/01","Oliver Harvey Side Seam Tax Tab Red/White",1]],
 mfg:["Set eyelet re-inforcement pieces.","DOUBLE TURN SIDE SEAM, TOP AND HEM AND TOPSTITCH 12MM."],
 fin:["SET EYELETS. CENTRE 3CM IN FROM SIDE SEAM.","CHECK, TRIM, PRESS AND FOLD."],
 machMins:10, finMins:10, cutBatch:24, cutMins:15,
 oneSize:true, sr:"SR-0142", srVersion:2, customer:"DORCHESTER"
};
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);

 const r=await p.evaluate(j=>{
   smOpenImport();
   document.getElementById('impTA').value=JSON.stringify(j);
   smDoImport();
   const st=styleEdits['OHAPB0631DSTIE01'];
   return {saved:!!st, trims:st.trims.length, fabrics:st.fabrics.length,
     firstTrim:st.trims[0], codedTrim:st.trims[1],
     meas:(chartEdits['OHAPB0631DSTIE01-MEAS']||[]).length,
     printable:smPrintable('OHAPB0631DSTIE01'),
     result:document.getElementById('impResult').innerText.replace(/\s+/g,' ').slice(0,150)};
 }, exp);
 console.log('imported:', JSON.stringify({saved:r.saved,trims:r.trims,fabrics:r.fabrics,meas:r.meas,printable:r.printable}));
 console.log('  trim with no Sage code ->', JSON.stringify(r.firstTrim));
 console.log('  trim with a Sage code  ->', JSON.stringify(r.codedTrim));
 console.log('  summary:', r.result);

 const [pop]=await Promise.all([p.waitForEvent('popup'),
   p.evaluate(()=>{window.print=()=>{}; printWOP('S-TEST','OHAPB0631DSTIE01',20,'2026-09-20',null);})]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(300);
 const doc=await pop.evaluate(()=>{const t=document.body.innerText; return {
   fabric:t.includes('PC9068'), rating:t.includes('0.52'), noCost:!/5\.3651/.test(t), trimCode:t.includes('TAXTABOH07/01'), noCode:t.includes('no code yet'),
   meas:t.includes('WIDTH OF SKIRT'), mfg:t.includes('Set eyelet re-inforcement'),
   fin:t.includes('CHECK, TRIM, PRESS AND FOLD'), thread:t.includes("COATS EPIC 80'S BISCUIT")};});
 console.log('printed works order:', JSON.stringify(doc));
 await pop.screenshot({path:'tests/out/imported-wo.png',fullPage:true}); await pop.close();

 await p.reload(); await p.waitForTimeout(400);
 console.log('after reload:', JSON.stringify(await p.evaluate(()=>({styles:Object.keys(styleEdits).length,
   charts:Object.keys(chartEdits).length, printable:smPrintable('OHAPB0631DSTIE01')}))));
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await b.close();
})();
