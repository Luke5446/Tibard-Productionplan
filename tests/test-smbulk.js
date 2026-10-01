// A BULK code on the Special Makes sheet is a garment's container stock
// (BULKTWAP052031P, the Booker waterproof apron: 1,224 in the Bulk
// warehouse), never cut here. An older copy of the query filed it as WORKS
// ORDER Tibard and the app offered it as a job; now the app files it as an
// anchor whatever the category says, and the query itself says STOCK HELD.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const L=(key,seq,code,desc,qty,cat)=>T([key,'TIBARD','0000871647',String(seq),code,desc,String(qty),'2026-10-07','Booker Limited',cat,'Tibard','65210953','Booker Limited']);
const paste=[
 L('TIB-1',15,'BULKTWAP052031P','NAVY/WHITE STRIPE WATERPROOF BIB APRON - M189683',288,'WORKS ORDER'),
 L('TIB-2',16,'','Carton M Code',288,'NOTE - free text'),
 L('TIB-3',18,'BULKTWAPP0771224','INDIGO DENIM APRON',128,'STOCK HELD'),
 L('TIB-4',21,'CICJ0193XL03','BLACK S/S P/COTTON STUD FASTEN CHEFS JACKET SZ XL',12,'WORKS ORDER'),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-10-01T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });
 const r=await p.evaluate(t=>{ smShowTab('special'); document.getElementById('smTA').value=t; smLoadPaste();
   return {pending:smPending.map(o=>o.code).sort().join(), seen:['TIB-1','TIB-3','TIB-4'].map(k=>k+':'+((smSeen[k]||{}).what||'-')).join(' '), listed:[...document.querySelectorAll('#smList .sm-code, #smList strong')].map(e=>e.textContent).filter(t=>/BULK/.test(t)).length}; }, paste);
 console.log(JSON.stringify(r));
 const pass = r.pending==='CICJ0193XL03' && r.seen==='TIB-1:anchor TIB-3:anchor TIB-4:-' && r.listed===0;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
