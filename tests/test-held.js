// Cloth held at Tiajo for call-off (fabStock.held): the opening ledger from
// the 6 Nov 2026 statement seeds once in the editor (14 balances, two
// 1,000 m air freight lots off black X133ECO125 and navy X133ECO297), a
// purchase order file takes its metres off line by line, a pasted statement
// resets the balance with the difference logged, a typed movement and its
// removal, cover weeks from the last 13 weeks of completed works orders with
// the put-into-work flag under 12 weeks, the CSV log, survival across a
// reload, and the viewer seeing the table with no controls.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const sheet=[
 T(['PC2003ECO','BLACK SUSTAINABLE 65/35 POLY/COTTON (X133 - AM125)','Metre','TIA001EU','Tiajo Comercio','','1770.92','0','0','1000','0','0','2.32','0','EUR','2.05','2.05']),
 T(['PC2015ECO','NAVY SUSTAINABLE 65/35 POLY/COTTON (X133 - AM297)','Metre','TIA001EU','Tiajo Comercio','','873.78','0','0','400','0','0','2.32','0','EUR','2.05','2.05']),
 T(['CO5001ECO','WHITE 100% SUSTAINABLE COTTON (X149 - AM 5)','Metre','TIA001EU','Tiajo Comercio','','1589.56','0','0','300','0','0','3.1','0','EUR','2.9','2.9']),
].join('\n');
const page='file://'+require('path').join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(page+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-11-06T17:50:00'); window.__confirms=[]; window.confirm=m=>{ window.__confirms.push(m); return true; }; window.__prompts=[]; window.prompt=(m,d)=>{ window.__prompts.push(m); return window.__answers.shift(); }; window.__answers=[]; window.__alerts=[]; window.alert=m=>window.__alerts.push(m);
   window.__dl=[]; URL.createObjectURL=b=>{ window.__blob=b; return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){ window.__dl.push(this.download); }; });
 // the seed: 16 movements, black 13,094.2 after the air freight, navy 909; 130 m of black completed 20 days ago -> 10 m/wk -> cover 1,309 wks; navy at 100 m/wk -> 9.1 wks -> put into work
 const t1=await p.evaluate(t=>{ smShowTab('fabric'); fabTogglePaste(); document.getElementById('fabTA').value=t; fabLoadStockPaste(); window.__alerts=[];
   completedWOs.push({ref:'WO-T1', code:'X', qty:1, completed:'2026-10-17', fabric:{code:'PC2003ECO', std:130}}, {ref:'WO-T2', code:'X', qty:1, completed:'2026-10-30', fabric:{code:'PC2015ECO', std:1300, actual:1300, extras:[{code:'PC2003ECO', std:0}]}}, {ref:'WO-OLD', code:'X', qty:1, completed:'2026-07-01', fabric:{code:'PC2015ECO', std:5000}});
   const sel=document.getElementById('fabSupSel'); sel.value='TIA001EU'; sel.dispatchEvent(new Event('change'));
   const rows=heldRows('TIA001EU'), r=s=>rows.find(x=>x.sup===s), body=document.getElementById('fabBody').textContent.replace(/\s+/g,' ');
   return { moves:fabStock.held.TIA001EU.moves.length, black:r('X133ECO125').held, blackCode:r('X133ECO125').code, blackWk:Math.round(r('X133ECO125').wk*100)/100, blackCover:Math.round(r('X133ECO125').cover), blackState:r('X133ECO125').state,
     navy:r('X133ECO297').held, navyWk:r('X133ECO297').wk, navyCover:Math.round(r('X133ECO297').cover*10)/10, navyState:r('X133ECO297').state, white:r('X149ECO5').held, whiteState:r('X149ECO5').state, sage:r('X149ECO304').held, sageState:r('X149ECO304').state,
     n:rows.length, first:rows[0].sup, hdr:/Held at Tiajo Comercio for call-off/.test(body), flag:/1 to put into work/.test(body), air:(body.match(/Air freight to Clockwork/g)||[]).length, btns:['Paste statement','Movement','Log (CSV)'].map(x=>body.indexOf(x)>=0).join(','),
     num:[heldNum('14 094,20'),heldNum('2 361,00'),heldNum('1,909.00'),heldNum('556.2'),heldNum('16'),heldNum('1.234,5'),heldNum('1,909'),heldNum('12.5')].join('|') }; }, sheet);
 console.log('seed    ->', JSON.stringify(t1));
 // a purchase order of 1,100 m black and 200 m navy: both come off, with the file name on the movement
 const t2=await p.evaluate(async()=>{ fabSetOrderQty('TIA001EU','PC2003ECO','1100'); fabSetOrderQty('TIA001EU','PC2015ECO','200'); fabSetOrderQty('TIA001EU','CO5001ECO','0'); window.__answers=['Fabric order 06/11/2026']; window.__alerts=[]; exportSupplierPO('TIA001EU','Tiajo Comercio');
   const mv=fabStock.held.TIA001EU.moves.slice(-2).sort((a,b)=>a.sup<b.sup?-1:1);
   return { black:heldQty('TIA001EU','X133ECO125'), navy:heldQty('TIA001EU','X133ECO297'), mv:mv.map(m=>[m.at,m.atTime,m.sup,m.code,m.kind,m.qty,m.note,m.file].join('|')).join(';'), alert:(window.__alerts.pop()||'').split('\n').slice(0,2).join(' / ') }; });
 console.log('po      ->', JSON.stringify(t2));
 // a statement pasted: tab lines, a plain line with the European figure, and a code Sage does not know
 const t3=await p.evaluate(()=>{ heldPasteToggle(); document.getElementById('heldTA').value=['X133ECO125\tTWILL 65%PES GRS 35%CO OCS | 200 GSM | BLACK - 125\t12 500,50','X133ECO297 TWILL 65%PES GRS 35%CO OCS | 200 GSM | NAVY - 297 1 909,00','X149ECO999\tNEW CLOTH\t250,00','','junk line'].join('\n'); window.__alerts=[]; heldLoadPaste('TIA001EU');
   const b=fabStock.held.TIA001EU, last=b.moves.slice(-3);
   return { black:heldQty('TIA001EU','X133ECO125'), navy:heldQty('TIA001EU','X133ECO297'), nw:heldQty('TIA001EU','X149ECO999'), name:b.codes.X133ECO297.name, mv:last.map(m=>[m.sup,m.kind,m.qty,m.note].join('|')).join(';'), alert:(window.__alerts[0]||'').replace(/\n/g,' / '), paste:!document.getElementById('heldTA'),
     link:!!document.querySelector('#fabBody a[onclick^="heldLink"]') }; });
 console.log('paste   ->', JSON.stringify(t3));
 // a typed movement (-500 navy, air freight), its removal, linking the unknown code, and the CSV log
 const t4=await p.evaluate(async()=>{ window.__answers=['-500','Air freight to Clockwork']; heldMovePrompt('TIA001EU','X133ECO297'); const after=heldQty('TIA001EU','X133ECO297'), n=fabStock.held.TIA001EU.moves.length;
   window.__answers=['CO5999ECO']; heldLink('TIA001EU','X149ECO999');
   window.__dl=[]; heldCsv('TIA001EU'); const csv=(await window.__blob.text()).split('\r\n').filter(Boolean);
   heldDelete('TIA001EU', n-1); const back=heldQty('TIA001EU','X133ECO297');
   return { after:after, back:back, n:n, moves:fabStock.held.TIA001EU.moves.length, linked:fabStock.held.TIA001EU.codes.X149ECO999.code, file:window.__dl[0], hdr:csv[0], last:csv[csv.length-1], rows:csv.length }; });
 console.log('move    ->', JSON.stringify(t4));
 // a reload keeps the ledger; the viewer sees the table but no buttons
 await p.goto(page+'?edit'); await p.waitForTimeout(400);
 const t5=await p.evaluate(()=>{ smShowTab('fabric'); const sel=document.getElementById('fabSupSel'); sel.value='TIA001EU'; sel.dispatchEvent(new Event('change')); return { moves:fabStock.held.TIA001EU.moves.length, black:heldQty('TIA001EU','X133ECO125'), navy:heldQty('TIA001EU','X133ECO297'), held:JSON.stringify(fabStock.held) }; });
 // the viewer: no data.json over file://, so the published shape is set by hand
 await p.goto(page); await p.waitForTimeout(400);
 const t6=await p.evaluate(([t,h])=>{ fabStock={rows:fabParseStock(t), pastedAt:'2026-11-06', held:JSON.parse(h)}; smShowTab('fabric'); const sel=document.getElementById('fabSupSel'); if(sel){ sel.value='TIA001EU'; sel.dispatchEvent(new Event('change')); } const body=document.getElementById('fabBody').textContent.replace(/\s+/g,' ');
   return { tbl:/Held at Tiajo Comercio for call-off/.test(body) && /X133ECO125/.test(body), btn:/Paste statement|± Movement/.test(body), del:!!document.querySelector('#fabBody a[onclick^="heldDelete"]'), csv:/Log \(CSV\)/.test(body) }; }, [sheet, t5.held]);
 console.log('reload  ->', JSON.stringify({moves:t5.moves,black:t5.black,navy:t5.navy}), 'viewer ->', JSON.stringify(t6));
 const pass = t1.moves===16 && t1.black===13094.2 && t1.blackCode==='PC2003ECO' && t1.blackWk===10 && t1.blackCover===1309 && t1.blackState==='ok'
   && t1.navy===909 && t1.navyWk===100 && t1.navyCover===9.1 && t1.navyState==='work' && t1.white===16 && t1.whiteState==='ok' && t1.sage===null && t1.sageState==='none'
   && t1.n===16 && t1.first==='X133ECO297' && t1.hdr && t1.flag && t1.air===2 && t1.btns==='true,true,true' && t1.num==='14094.2|2361|1909|556.2|16|1234.5|1909|12.5'
   && t2.black===11994.2 && t2.navy===709 && t2.mv==='2026-11-06|17:50|X133ECO125|PC2003ECO|po|-1100|Fabric order 06/11/2026|B2B_PO_TIB_TIA001EU_2026-11-06_1750.csv;2026-11-06|17:50|X133ECO297|PC2015ECO|po|-200|Fabric order 06/11/2026|B2B_PO_TIB_TIA001EU_2026-11-06_1750.csv'
   && /2 lines, 1,300 m, €2,665 for Tiajo Comercio\. \/ 2 lines taken off the cloth held at Tiajo Comercio\./.test(t2.alert)
   && t3.black===12500.5 && t3.navy===1909 && t3.nw===250 && t3.name==='TWILL 65%PES GRS 35%CO OCS | 200 GSM | NAVY - 297' && t3.mv==='X133ECO125|balance|506.3|Statement 06 Nov 2026: 12,500.50 m;X133ECO297|balance|1200|Statement 06 Nov 2026: 1,909.00 m;X149ECO999|balance|250|Statement 06 Nov 2026: 250.00 m'
   && /^3 balances set\. \/  \/ Not matched to a Sage fabric .*X149ECO999$/.test(t3.alert) && t3.paste && t3.link
   && t4.after===1409 && t4.back===1909 && t4.moves===t4.n-1 && t4.linked==='CO5999ECO' && t4.file==='Held_fabric_TIA001EU_2026-11-06.csv' && t4.hdr==='Date,Time,SupplierCode,SageCode,Movement,Metres,HeldAfter,Note,File' && t4.last==='2026-11-06,17:50,X133ECO297,PC2015ECO,Sent elsewhere,-500,1409,Air freight to Clockwork,' && t4.rows===23
   && t5.moves===21 && t5.black===12500.5 && t5.navy===1909 && t6.tbl && !t6.btn && !t6.del && t6.csv;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
