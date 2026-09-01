const { chromium } = require('playwright');
const T=a=>a.join('\t');
const paste=[
 T(['OH-1','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN BIB APRON','12','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-2','OLIVER HARVEY','0000114816','3','OHCJSCUMBRIA3603','CUMBRIA CHEF JACKET 36','6','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-3','OLIVER HARVEY','0000114816','2','LOGOAPPLICATION','Maldon Logo Centre Bib','12','2026-09-11','MALDON SALT','NOTE - charge or logo line','']),
 T(['TIB-1','TIBARD','0000862833','1','CT01964601','CHEF TROUSERS BLACK 32R','20','2026-09-04','KLONDYKE','WORKS ORDER','Tibard']),
 T(['TIB-2','TIBARD','0000862833','2','FREETEXT','Bespoke tabard','5','2026-09-04','KLONDYKE','REVIEW - FREETEXT placeholder','']),
].join('\n');
const buf=[T(['OHAPP054415','NAVY BIB APRON','136','350','0','109','328','775','1349'])].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(t=>{document.getElementById('pasteTA').value=t; loadPaste();},buf); await p.waitForTimeout(200);

 // buffer tile: Healthy gone, Special present
 const tiles=await p.evaluate(()=>[...document.querySelectorAll('#statsBar .stat-lbl')].map(e=>e.textContent));
 console.log('buffer tiles:', tiles.join(' | '));
 console.log('  Healthy removed:', tiles.some(t=>/Healthy/.test(t))?'FAIL':'PASS');
 console.log('  Special tile:   ', tiles.some(t=>/Special works orders/.test(t))?'PASS':'FAIL');

 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(150);
 await p.evaluate(()=>{ smCreate('OH-1'); smCreate('OH-2'); smCreate('TIB-1'); smDismiss('TIB-2'); }); await p.waitForTimeout(200);
 const a=await p.evaluate(()=>({live:smLiveCount(),units:smLiveUnits(),made:smMade.length,dropped:smDropped.length,
   tblRows:document.querySelectorAll('#smList .sm-tbl tbody tr').length}));
 console.log('after raising 3:  ', JSON.stringify(a));

 // tile updates on the buffer tab
 await p.click('#tabBuffer'); await p.waitForTimeout(150);
 const tv=await p.evaluate(()=>{const t=[...document.querySelectorAll('#statsBar .stat')].find(e=>/Special works orders/.test(e.textContent));
   return t?t.querySelector('.stat-val').textContent+' / '+t.querySelector('div:last-child').textContent:'missing';});
 console.log('special tile value:', tv);
 // clicking the tile jumps to the tab
 await p.evaluate(()=>tileFilter('special')); await p.waitForTimeout(200);
 console.log('tile click opens tab:', await p.isVisible('#smView')?'PASS':'FAIL');

 // complete one -> completed history + pipeline
 const done=await p.evaluate(()=>{
   const i=WOs.findIndex(w=>w.sm && w.ref.indexOf('TIB')>=0);
   const ref=WOs[i].ref;
   window.confirm=()=>true; completeWholeWO(i);
   const c=completedWOs.find(x=>x.ref===ref);
   return {ref:ref, inHistory:!!c, desc:c?c.desc:'', sm:c?c.sm:undefined, pipeUnits:smPipelineUnits()};
 });
 await p.waitForTimeout(200);
 console.log('completed WO:     ', JSON.stringify(done));
 const after=await p.evaluate(()=>({live:smLiveCount(),tblRows:document.querySelectorAll('#smList .sm-tbl tbody tr').length,
   pipeRows:document.querySelectorAll('#smList .sm-tbl tbody tr.pipe').length,
   statPipe:document.getElementById('smStatPipe').textContent, made:smMade.length}));
 console.log('after completing: ', JSON.stringify(after));

 // history folders
 await p.evaluate(()=>smToggleHist()); await p.waitForTimeout(150);
 const hist=await p.evaluate(()=>({months:document.querySelectorAll('#smDismissedList .sm-mon').length}));
 const k=await p.evaluate(()=>{const h=document.querySelector('#smDismissedList .sm-mon-h'); h.click(); return document.querySelectorAll('#smDismissedList .sm-mon-b .sm-dism').length;});
 await p.waitForTimeout(150);
 console.log('history months:   ', JSON.stringify(hist), 'rows when opened:', k);

 await p.reload(); await p.waitForTimeout(400); await p.click('#tabSpecial'); await p.waitForTimeout(200);
 console.log('after reload:     ', JSON.stringify(await p.evaluate(()=>({made:smMade.length,dropped:smDropped.length,live:smLiveCount()}))));
 console.log('errors:           ', errs.length?errs.join(' | '):'none');
 await p.screenshot({path:'tests/out/sm3.png',fullPage:true});
 await b.close();
})();
