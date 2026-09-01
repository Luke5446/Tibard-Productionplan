const { chromium } = require('playwright');
const T=a=>a.join('\t');
const paste=[
 T(['OH-1','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN BIB APRON','12','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-2','OLIVER HARVEY','0000114816','3','OHCJSCUMBRIA3603','CUMBRIA CHEF JACKET 36','6','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-3','OLIVER HARVEY','0000114816','2','LOGOAPPLICATION','Maldon Salt Logo - Left Chest As Worn','12','2026-09-11','MALDON SALT','NOTE - charge or logo line','']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext({acceptDownloads:true});
 const p=await ctx.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file:///home/user/Tibard-Productionplan/index.html?edit'); await p.waitForTimeout(400);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(150);
 await p.evaluate(()=>{ window.confirm=()=>true; smTickAll(true); smCreateAllShown(); }); await p.waitForTimeout(200);

 const btns=await p.evaluate(()=>[...document.querySelectorAll('#smList .sm-tbl tbody tr')].map(tr=>{
   const b=tr.querySelector('button'); return tr.querySelector('strong').textContent+' -> '+(b?b.textContent.trim():'none'); }));
 console.log('print buttons:', btns.join(' | '));

 // generated sheet for the code with no style master entry
 const [pop]=await Promise.all([ p.waitForEvent('popup'),
   p.evaluate(()=>{ window.print=()=>{}; smPrintDoc(WOs.find(w=>w.sm&&w.items[0].code==='OHAPP0785191').ref); }) ]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(300);
 const doc=await pop.evaluate(()=>({title:document.title,
   bands:[...document.querySelectorAll('.band')].map(e=>e.textContent),
   hasLogo:document.body.innerText.includes('Maldon Salt Logo - Left Chest As Worn'),
   hasCust:document.body.innerText.includes('MALDON SALT'),
   hasSO:document.body.innerText.includes('114816'),
   warn:!!document.querySelector('.warn')}));
 console.log('generated sheet:', JSON.stringify(doc));
 await pop.screenshot({path:'wodoc.png',fullPage:true});
 await pop.close();

 const printed=await p.evaluate(()=>WOs.filter(w=>w.sm).map(w=>w.ref+(w.printed?' PRINTED':' unprinted')));
 console.log('print marks:  ', printed.join(' | '));

 // attach a file and read it back through IndexedDB
 const att=await p.evaluate(async()=>{
   const ref=WOs.find(w=>w.sm).ref;
   const f=new File([new Blob(['works order spec'])],'S-OH114816-Pt1.xlsx',{type:'application/vnd.ms-excel'});
   await new Promise(res=>smDB(db=>{const t=db.transaction('docs','readwrite');
     t.objectStore('docs').put({ref:ref,name:f.name,type:f.type,size:f.size,at:'2026-09-01',blob:f});
     t.oncomplete=()=>{smDocs[ref]={name:f.name,size:f.size,at:'2026-09-01'}; saveState(); smRender(); res();};}));
   return {ref:ref, cellHasClip:document.querySelector('#smList .sm-tbl tbody').innerHTML.includes('128206')
     || document.querySelector('#smList .sm-tbl tbody').innerHTML.includes('📎')};
 });
 await p.waitForTimeout(200);
 const shown=await p.evaluate(()=>document.querySelector('#smList .sm-tbl tbody').innerText.includes('.xlsx'));
 console.log('attachment shown in row:', shown?'PASS':'FAIL');
 await p.reload(); await p.waitForTimeout(400); await p.click('#tabSpecial'); await p.waitForTimeout(250);
 const persist=await p.evaluate(()=>({docs:Object.keys(smDocs).length,
   shown:document.querySelector('#smList .sm-tbl tbody').innerText.includes('.xlsx')}));
 console.log('after reload:  ', JSON.stringify(persist));
 console.log('errors:        ', errs.length?errs.join(' | '):'none');
 await p.screenshot({path:'sm5.png',fullPage:true});
 await b.close();
})();
