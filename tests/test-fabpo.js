// The purchase order file for one supplier, for the Sage routine that imports
// from the B2B_PO_TIB folder. Same Sage sheet and works orders as
// test-fabstock.js but 12 m of CO5014DEN in stock: with 9 m on a live works
// order it is under its 10 m minimum, so Tiajo Comercio (TIA001EU) has it
// suggested at the usual 50 m.
//   - the button is on the supplier's order panel for the editor only
//   - the file is one row per fabric with metres, on the PO_COLS layout: the
//     account, today's date and today plus the lead time (working days) as
//     dd/mm/yyyy, Standard line, code, description, metres, Sage's cost per
//     metre, the HOME warehouse; nil lines are left out
//   - it is named B2B_PO_TIB_<account>_<date>_<time>.csv, an order under the
//     free-shipping minimum asks first, every file is kept with its rows and
//     can be downloaded again, the typed metres stay, the record survives
//     a reload and a new paste, and the viewer has no button
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const sheet=[
 T(['CO5014DEN','MURRAY LT GREY DENIM','Metre','TIA001EU','Tiajo Comercio','TJ-DEN-14','12','0','0','10','12','50','6.71','0']),
 T(['PC2015ECO','NAVY SUSTAINABLE 65/35','Metre','TIA001EU','Tiajo Comercio','TJ-PC-15','400','0','0','0','0','0','2.32','0']),
 T(['PC14001','WHITE COOLTEX 1','Metre','TIAJO','Tiajo Textiles','TJ-CT-1','5','0','20','0','0','0','3.09','14']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.addInitScript(()=>{ let v; Object.defineProperty(window,'LAY_PLAN',{configurable:true,get(){ return v; },set(x){ delete x['OHAPP0534__']; v=x; }}); });
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 // Monday 21 Sep 2026, 10:07; Tiajo Comercio's lead time is the app's 10 working days -> Monday 5 Oct
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-21T10:07:00'); window.__confirms=[]; window.confirm=m=>{ window.__confirms.push(m); return true; }; window.__alerts=[]; window.alert=m=>window.__alerts.push(m);
   window.__dl=[]; URL.createObjectURL=b=>{ window.__blob=b; return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){ window.__dl.push(this.download); }; });
 const mk=(ref,ta)=>p.evaluate(([ref,ta])=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-21'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value=ta; saveWO(); }, [ref,ta]);
 await mk('S-LIVE1','OHAPP0534GD\t15');
 const t1=await p.evaluate(t=>{ smShowTab('fabric'); fabTogglePaste(); document.getElementById('fabTA').value=t; fabLoadStockPaste(); window.__alerts.pop();
   const sel=document.getElementById('fabSupSel'); sel.value='TIA001EU'; sel.dispatchEvent(new Event('change'));
   const body=document.getElementById('fabBody').textContent.replace(/\s+/g,' ');
   return { btn:!!document.querySelector('#fabBody button[onclick^="exportSupplierPO"]'), lines:fabOrderLines('TIA001EU').map(l=>l.x.code+':'+l.qty).join(','), lead:fabLeadFor(fabStock.rows['CO5014DEN']).days }; }, sheet);
 console.log('panel   ->', JSON.stringify(t1));
 // 50 m suggested is under the 4,000 m minimum: it asks, then makes the file
 const t2=await p.evaluate(async()=>{ exportSupplierPO('TIA001EU','Tiajo Comercio'); const txt=await window.__blob.text();
   return { asked:window.__confirms.length, ask:(window.__confirms[0]||'').split('\n')[0], file:window.__dl[0], csv:txt.split('\r\n').filter(Boolean), alert:(window.__alerts.pop()||'').split('\n')[0],
     rec:fabStock.poFiles.map(f=>[f.acc,f.file,f.at,f.atTime,f.lines.length,f.metres,f.value].join('|')).join(';'), kept:fabOrderLines('TIA001EU').map(l=>l.x.code+':'+l.qty).join(','),
     hist:(document.getElementById('fabBody').textContent.replace(/\s+/g,' ').match(/Purchase order files[^\n]{0,90}/)||[''])[0] }; });
 console.log('file    ->', JSON.stringify(t2));
 // a typed 120 m on the navy and 4,000 m top-up -> no question; the file carries both lines, priced
 const t3=await p.evaluate(async()=>{ window.__confirms=[]; fabSetOrderQty('TIA001EU','PC2015ECO','120'); fabOrderTopUp('TIA001EU'); exportSupplierPO('TIA001EU','Tiajo Comercio'); const txt=await window.__blob.text();
   return { asked:window.__confirms.length, rows:txt.split('\r\n').filter(Boolean).length-1, total:fabStock.poFiles[0].metres, files:fabStock.poFiles.length, minOK:fabOrderTotal('TIA001EU')>=4000 }; });
 console.log('top up  ->', JSON.stringify(t3));
 // download again gives the same file; a nil order refuses; the viewer has no button
 const t4=await p.evaluate(async()=>{ window.__dl=[]; poDownloadAgain(1); const again=await window.__blob.text();
   fabOrderReset('TIA001EU'); fabSetOrderQty('TIA001EU','CO5014DEN','0'); fabSetOrderQty('TIA001EU','PC2015ECO','0'); window.__alerts=[]; exportSupplierPO('TIA001EU','Tiajo Comercio');
   return { again:window.__dl[0], sameRows:again.split('\r\n').filter(Boolean).length, nil:(window.__alerts[0]||'').slice(0,40), files:fabStock.poFiles.length }; });
 console.log('again   ->', JSON.stringify(t4));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 const t5=await p.evaluate(t=>{ window.now=()=>new Date('2026-09-22T09:00:00'); window.alert=()=>{}; smShowTab('fabric'); const before=(fabStock.poFiles||[]).length;
   fabTogglePaste(); document.getElementById('fabTA').value=t; fabLoadStockPaste(); return {before:before, after:(fabStock.poFiles||[]).length}; }, sheet);
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')); await p.waitForTimeout(400);
 const t6=await p.evaluate(()=>{ smShowTab('fabric'); const sel=document.getElementById('fabSupSel'); if(sel){ sel.value='TIA001EU'; sel.dispatchEvent(new Event('change')); } return {btn:!!document.querySelector('#fabBody button[onclick^="exportSupplierPO"]'), hist:/Purchase order files/.test(document.getElementById('fabBody').textContent)}; });
 console.log('reload  ->', JSON.stringify(t5), 'viewer ->', JSON.stringify(t6));
 const pass = t1.btn && t1.lines==='CO5014DEN:50,PC2015ECO:0' && t1.lead===10
   && t2.asked===1 && /^50 m is under the 4,000 m free-shipping minimum for Tiajo Comercio/.test(t2.ask)
   && t2.file==='B2B_PO_TIB_TIA001EU_2026-09-21_1007.csv'
   && t2.csv[0]==='SupplierAccountNumber,DocumentDate,RequestedDeliveryDate,SupplierDocumentNo,LineType,ItemCode,ItemDescription,LineQuantity,UnitBuyingPrice,WarehouseName'
   && t2.csv[1]==='TIA001EU,21/09/2026,05/10/2026,,Standard,CO5014DEN,MURRAY LT GREY DENIM,50,6.71,HOME' && t2.csv.length===2
   && /^1 line, 50 m, £336 for Tiajo Comercio\./.test(t2.alert) && t2.rec==='TIA001EU|B2B_PO_TIB_TIA001EU_2026-09-21_1007.csv|2026-09-21|10:07|1|50|335.5'
   && t2.kept==='CO5014DEN:50,PC2015ECO:0' && /Purchase order files · 21 Sept 2026 10:07 · 1 line · 50 m · £336 · download again/.test(t2.hist)
   && t3.asked===0 && t3.rows===2 && t3.total>=4000 && t3.files===2 && t3.minOK
   && t4.again==='B2B_PO_TIB_TIA001EU_2026-09-21_1007.csv' && t4.sameRows===2 && /^Nothing to order - every line for/.test(t4.nil) && t4.files===2
   && t5.before===2 && t5.after===2 && !t6.btn;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
