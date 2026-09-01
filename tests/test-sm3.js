const { chromium } = require('playwright');
const T=a=>a.join('\t');
// OHCJSCUMBRIA3603 has a print template; OHAPP0785191 and CT01964601 do not.
const paste=[
 T(['OH-1','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN BIB APRON','12','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-2','OLIVER HARVEY','0000114816','3','OHCJSCUMBRIA3603','CUMBRIA CHEF JACKET 36','6','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-3','OLIVER HARVEY','0000114816','2','LOGOAPPLICATION','Maldon Logo Centre Bib','12','2026-09-11','MALDON SALT','NOTE - charge or logo line','']),
 T(['TIB-1','TIBARD','0000862833','1','CT01964601','CHEF TROUSERS BLACK 32R','20','2025-01-04','KLONDYKE','WORKS ORDER','Tibard']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file:///home/user/Tibard-Productionplan/index.html?edit'); await p.waitForTimeout(400);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(200);

 const tbl=await p.evaluate(()=>({rows:document.querySelectorAll('#smPendingList .sm-tbl tbody tr').length,
   checkboxes:document.querySelectorAll('#smPendingList input[type=checkbox]').length,
   qtyInputs:document.querySelectorAll('#smPendingList input:not([type=checkbox])').length,
   printsTag:document.querySelectorAll('#smPendingList .sm-tag.ok').length,
   statuses:[...document.querySelectorAll('#smPendingList .sm-tbl tbody tr td:last-child span')].map(e=>e.textContent)}));
 console.log('review table:      ', JSON.stringify(tbl));

 // nothing created without ticking
 const none=await p.evaluate(()=>{ let a=false; window.alert=()=>{a=true}; smCreateAllShown(); return {alerted:a,wos:WOs.length}; });
 console.log('create with none ticked:', JSON.stringify(none), none.wos===0?'PASS':'FAIL');

 // edit qty then tick+create
 await p.evaluate(()=>{ smSetQty('OH-2','10'); smTick('OH-1',true); }); await p.waitForTimeout(150);
 const q=await p.evaluate(()=>({take:smFind('OH-2').take, ticked:smFind('OH-2').included}));
 console.log('qty edit auto-ticks:', JSON.stringify(q));
 const made=await p.evaluate(()=>{ window.confirm=()=>true; smCreateAllShown();
   return WOs.filter(w=>w.sm).map(w=>w.ref+' '+w.items[0].code+' x'+w.items[0].qty); });
 await p.waitForTimeout(200);
 console.log('created:           ', made.join(' | '), '(OH-2 should be x10, not x6)');

 const live=await p.evaluate(()=>[...document.querySelectorAll('#smList .sm-tbl tbody tr')].map(tr=>{
   const tag=tr.querySelector('.sm-tag'); return tr.querySelector('strong').textContent+' -> '+(tag?tag.textContent:'none'); }));
 console.log('print states:      ', live.join(' | '));

 // shared works order panel shows them
 const panel=await p.evaluate(()=>{ document.getElementById('woPB').classList.add('open'); renderWOCards();
   return [...document.querySelectorAll('#woCards .woc')].map(c=>c.textContent.replace(/\s+/g,' ').trim().slice(0,90)); });
 console.log('shared tracker:');
 panel.forEach(c=>console.log('   ', c));
 console.log('errors:            ', errs.length?errs.join(' | '):'none');
 await p.screenshot({path:'sm4.png',fullPage:true});
 await b.close();
})();
