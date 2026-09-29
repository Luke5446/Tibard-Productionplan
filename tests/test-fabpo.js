// The purchase order file for one supplier, for the Sage routine that imports
// from the B2B_PO_TIB folder. Same Sage sheet and works orders as
// test-fabstock.js but 12 m of CO5014DEN in stock: with 9 m on a live works
// order it is under its 10 m minimum, so Tiajo Comercio (TIA001EU) has it
// suggested at the usual 50 m.
//   - the button is on the supplier's order panel for the editor only
//   - the file is one row per fabric with metres, on the routine's own
//     layout (the Clockwork container 127 import): OrderType 1, the account,
//     today's date and today plus the lead time (working days) as dd/mm/yyyy,
//     the reference typed as the supplier document number, line type 1, the
//     code (also as StockItem), the Home warehouse, metres, Sage's cost per
//     metre, the analysis code names, OrderOriginator Import; nil lines out;
//     a Clockwork line would go BULK-prefixed to the Bulk warehouse
//   - Tiajo buy in euros: a paste of A to N (no currency column) takes
//     Sage's last buying price and asks first; a paste of A to Q takes the
//     euro price without asking, shows it per metre with the list price
//     beside it where they differ, and the panel and history show euros
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
const sheet16=[
 T(['CO5014DEN','MURRAY LT GREY DENIM','Metre','TIA001EU','Tiajo Comercio','TJ-DEN-14','12','0','0','10','12','50','6.71','0','EUR','7.85','8.20']),
 T(['PC2015ECO','NAVY SUSTAINABLE 65/35','Metre','TIA001EU','Tiajo Comercio','TJ-PC-15','400','0','0','0','0','0','2.32','0','EUR','2.05','2.05']),
 T(['PC14001','WHITE COOLTEX 1','Metre','TIAJO','Tiajo Textiles','TJ-CT-1','5','0','20','0','0','0','3.09','14','','','']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.addInitScript(()=>{ let v; Object.defineProperty(window,'LAY_PLAN',{configurable:true,get(){ return v; },set(x){ delete x['OHAPP0534__']; v=x; }}); });
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 // Monday 21 Sep 2026, 10:07; Tiajo Comercio's lead time is the app's 10 working days -> Monday 5 Oct
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-21T10:07:00'); window.__confirms=[]; window.confirm=m=>{ window.__confirms.push(m); return true; }; window.__prompts=[]; window.prompt=(m,d)=>{ window.__prompts.push(d); return 'Tiajo proforma 4471'; }; window.__alerts=[]; window.alert=m=>window.__alerts.push(m);
   window.__dl=[]; URL.createObjectURL=b=>{ window.__blob=b; return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){ window.__dl.push(this.download); }; });
 const mk=(ref,ta)=>p.evaluate(([ref,ta])=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-21'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value=ta; saveWO(); }, [ref,ta]);
 await mk('S-LIVE1','OHAPP0534GD\t15');
 const t1=await p.evaluate(t=>{ smShowTab('fabric'); fabTogglePaste(); document.getElementById('fabTA').value=t; fabLoadStockPaste(); window.__alerts.pop();
   const sel=document.getElementById('fabSupSel'); sel.value='TIA001EU'; sel.dispatchEvent(new Event('change'));
   const body=document.getElementById('fabBody').textContent.replace(/\s+/g,' ');
   return { btn:!!document.querySelector('#fabBody button[onclick^="exportSupplierPO"]'), lines:fabOrderLines('TIA001EU').map(l=>l.x.code+':'+l.qty).join(','), lead:fabLeadFor(fabStock.rows['CO5014DEN']).days, cur:poCurrency('TIA001EU'), note:/last buying price.*buy in EUR/.test(body) }; }, sheet);
 console.log('panel   ->', JSON.stringify(t1));
 // 50 m suggested is under the 4,000 m minimum, and the sheet has no euro price yet: it asks twice, then makes the file
 const t2=await p.evaluate(async()=>{ exportSupplierPO('TIA001EU','Tiajo Comercio'); const txt=await window.__blob.text();
   return { asked:window.__confirms.length, ask:(window.__confirms[0]||'').split('\n')[0], ask2:(window.__confirms[1]||'').split('\n')[0], file:window.__dl[0], csv:txt.split('\r\n').filter(Boolean), alert:(window.__alerts.pop()||'').split('\n')[0], promptDefault:window.__prompts[0],
     bulk:poLine('CLO003','2026-09-21','2026-10-21','Container 128','CJ0193MM01',400,4.16).join(','),
     rec:fabStock.poFiles.map(f=>[f.acc,f.file,f.at,f.atTime,f.lines.length,f.metres,f.value].join('|')).join(';'), kept:fabOrderLines('TIA001EU').map(l=>l.x.code+':'+l.qty).join(','),
     hist:(document.getElementById('fabBody').textContent.replace(/\s+/g,' ').match(/Purchase order files[^\n]{0,90}/)||[''])[0] }; });
 console.log('file    ->', JSON.stringify(t2));
 // a typed 120 m on the navy and 4,000 m top-up -> only the currency question; the file carries both lines, priced
 const t3=await p.evaluate(async()=>{ window.__confirms=[]; fabSetOrderQty('TIA001EU','PC2015ECO','120'); fabOrderTopUp('TIA001EU'); exportSupplierPO('TIA001EU','Tiajo Comercio'); const txt=await window.__blob.text();
   return { asked:window.__confirms.length, rows:txt.split('\r\n').filter(Boolean).length-1, total:fabStock.poFiles[0].metres, files:fabStock.poFiles.length, minOK:fabOrderTotal('TIA001EU')>=4000 }; });
 console.log('top up  ->', JSON.stringify(t3));
 // the sheet with columns O and P: euro prices, no question, euros on the panel and the history
 const t3b=await p.evaluate(async(s)=>{ window.__confirms=[]; window.__alerts=[]; fabTogglePaste(); document.getElementById('fabTA').value=s; fabLoadStockPaste(); window.__alerts.pop();
   const sel=document.getElementById('fabSupSel'); sel.value='TIA001EU'; sel.dispatchEvent(new Event('change'));
   const body=document.getElementById('fabBody').textContent.replace(/\s+/g,' ');
   exportSupplierPO('TIA001EU','Tiajo Comercio'); const txt=await window.__blob.text(); const rows=txt.split('\r\n').filter(Boolean);
   return { asked:window.__confirms.length, prices:rows.slice(1).map(r=>r.split(',').slice(9,14).join('|')).join(';'), note:/Prices in EUR, the supplier/.test(body), euro:/€/.test(body), perM:/€7\.85 \/ m \(list €8\.20\)/.test(body) && /€2\.05 \/ m(?! \(list)/.test(body),
     alert:(window.__alerts.pop()||'').split('\n')[0], rec:[fabStock.poFiles[0].cur,fabStock.poFiles[0].priced].join('|'), kept:fabOrderLines('TIA001EU').map(l=>l.x.code+':'+l.qty).join(',') }; }, sheet16);
 console.log('euro    ->', JSON.stringify(t3b));
 // download again gives the same file; a nil order refuses; the viewer has no button
 const t4=await p.evaluate(async()=>{ window.__dl=[]; poDownloadAgain(2); const again=await window.__blob.text();
   fabOrderReset('TIA001EU'); fabSetOrderQty('TIA001EU','CO5014DEN','0'); fabSetOrderQty('TIA001EU','PC2015ECO','0'); window.__alerts=[]; exportSupplierPO('TIA001EU','Tiajo Comercio');
   return { again:window.__dl[0], sameRows:again.split('\r\n').filter(Boolean).length, nil:(window.__alerts[0]||'').slice(0,40), files:fabStock.poFiles.length }; });
 console.log('again   ->', JSON.stringify(t4));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 const t5=await p.evaluate(t=>{ window.now=()=>new Date('2026-09-22T09:00:00'); window.alert=()=>{}; smShowTab('fabric'); const before=(fabStock.poFiles||[]).length;
   fabTogglePaste(); document.getElementById('fabTA').value=t; fabLoadStockPaste(); return {before:before, after:(fabStock.poFiles||[]).length}; }, sheet);
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')); await p.waitForTimeout(400);
 const t6=await p.evaluate(()=>{ smShowTab('fabric'); const sel=document.getElementById('fabSupSel'); if(sel){ sel.value='TIA001EU'; sel.dispatchEvent(new Event('change')); } return {btn:!!document.querySelector('#fabBody button[onclick^="exportSupplierPO"]'), hist:/Purchase order files/.test(document.getElementById('fabBody').textContent)}; });
 console.log('reload  ->', JSON.stringify(t5), 'viewer ->', JSON.stringify(t6));
 const pass = t1.btn && t1.lines==='CO5014DEN:50,PC2015ECO:0' && t1.lead===10 && t1.cur==='EUR' && t1.note
   && t2.asked===2 && /^50 m is under the 4,000 m free-shipping minimum for Tiajo Comercio/.test(t2.ask) && /^This paste has no currency column \(A to N only\)/.test(t2.ask2)
   && t2.file==='B2B_PO_TIB_TIA001EU_2026-09-21_1007.csv'
   && t2.csv[0]==='OrderType,OrderNumber,SuppAccRef,OrderDate,OrderRequestedDate,SupplierDocumentNumber,OrderWarehouse,ExchangeRate,LineType,ProductCode,ProductDescription,Warehouse,Quantity,UnitPrice,TaxCode,StockItem,TaxAmount,DiscountPercent,DiscountValue,NominalCode,CostCentre,Department,ShowOnSuppDocs,ProjectCode,ProjectItem,LineRequestedDate,AnalysisCodeName2,AnalysisCodeValue2,AnalysisCodeName3,AnalysisCodeValue3,AnalysisCodeName4,AnalysisCodeValue4,LineAnalysisCode1,LineAnalysisCode2,PartRef,OrderOriginator,OrderTakenBy,LandedCostType,LandedCostValue'
   && t2.csv[1]==='1,,TIA001EU,21/09/2026,05/10/2026,Tiajo proforma 4471,,,1,CO5014DEN,,Home,50,6.71,,CO5014DEN,,,,,,,,,,,Despatch Number,,B2B Export Status,N/A,Intercompany Despatch Line ID,,,,,Import,,,' && t2.csv.length===2
   && t2.promptDefault==='Fabric order 21/09/2026' && t2.bulk==='1,,CLO003,21/09/2026,21/10/2026,Container 128,,,1,BULKCJ0193MM01,,Bulk,400,4.16,,BULKCJ0193MM01,,,,,,,,,,,Despatch Number,,B2B Export Status,N/A,Intercompany Despatch Line ID,,,,,Import,,,'
   && /^1 line, 50 m, €336 for Tiajo Comercio\./.test(t2.alert) && t2.rec==='TIA001EU|B2B_PO_TIB_TIA001EU_2026-09-21_1007.csv|2026-09-21|10:07|1|50|335.5'
   && t2.kept==='CO5014DEN:50,PC2015ECO:0' && /Purchase order files · 21 Sept 2026 10:07 · Tiajo proforma 4471 · 1 line · 50 m · €336 · download again/.test(t2.hist)
   && t3.asked===1 && t3.rows===2 && t3.total>=4000 && t3.files===2 && t3.minOK
   && t3b.asked===0 && t3b.prices==='CO5014DEN||Home|50|7.85;PC2015ECO||Home|3970|2.05' && t3b.note && t3b.euro && t3b.perM && /^2 lines, 4,020 m, €8,531 for Tiajo Comercio\./.test(t3b.alert) && t3b.rec==='EUR|supplier' && t3b.kept==='CO5014DEN:50,PC2015ECO:3970'
   && t4.again==='B2B_PO_TIB_TIA001EU_2026-09-21_1007.csv' && t4.sameRows===2 && t4.files===3 && /^Nothing to order - every line for/.test(t4.nil)
   && t5.before===3 && t5.after===3 && !t6.btn;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
