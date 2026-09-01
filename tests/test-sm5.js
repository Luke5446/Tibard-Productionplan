const { chromium } = require('playwright');
const T=a=>a.join('\t');
const paste=[
 T(['OH-1','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN BIB APRON','12','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-2','OLIVER HARVEY','0000114816','3','OHCJSCUMBRIA3603','CUMBRIA CHEF JACKET 36','6','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-3','OLIVER HARVEY','0000114816','2','LOGOAPPLICATION','Maldon Salt Logo - Left Chest As Worn','12','2026-09-11','MALDON SALT','NOTE - charge or logo line','']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file:///home/user/Tibard-Productionplan/index.html?edit'); await p.waitForTimeout(400);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(150);
 await p.evaluate(()=>{ window.confirm=()=>true; smTickAll(true); smCreateAllShown(); }); await p.waitForTimeout(200);

 const btns=await p.evaluate(()=>[...document.querySelectorAll('#smList .sm-tbl tbody tr')].map(tr=>
   tr.querySelector('strong').textContent+' -> '+(tr.querySelector('button')?tr.querySelector('button').textContent.trim():'none')));
 console.log('one button per row:', btns.join(' | '));

 // known style prints straight away, and now carries the logo section
 const [pop]=await Promise.all([p.waitForEvent('popup'),
   p.evaluate(()=>{window.print=()=>{}; smWorksOrder(WOs.find(w=>w.items[0].code==='OHCJSCUMBRIA3603').ref);})]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
 const std=await pop.evaluate(()=>({bands:[...document.querySelectorAll('.band')].map(e=>e.textContent).slice(0,6),
   logo:document.body.innerText.includes('Maldon Salt Logo - Left Chest As Worn'),
   emb:document.body.innerText.includes('Yes — see below')}));
 console.log('standard WOP:', JSON.stringify(std));
 await pop.close();

 // unknown style opens the editor instead of a lesser document
 await p.evaluate(()=>smWorksOrder(WOs.find(w=>w.items[0].code==='OHAPP0785191').ref)); await p.waitForTimeout(200);
 const ed=await p.evaluate(()=>({open:document.getElementById('styleEditModal').classList.contains('open'),
   title:document.getElementById('seTitle').textContent, code:document.getElementById('seCode').value,
   name:document.getElementById('seName').value}));
 console.log('editor opens:', JSON.stringify(ed));

 // fill it in, save & print
 const [pop2]=await Promise.all([p.waitForEvent('popup'), p.evaluate(()=>{
   window.print=()=>{};
   document.getElementById('seName').value='Forest green bib apron';
   document.getElementById('seDesc').value='Adjustable neck strap, centre pocket';
   document.getElementById('seFabrics').value='Forest green poly-cotton | PC14099 | A7';
   document.getElementById('seTrims').value='Thread | Forest green\nEyelets | Antique brass | 2';
   document.getElementById('seMfg').value='Twin needle hem\nBar-tack pocket corners';
   smSaveStyle(true);
 })]);
 await pop2.waitForLoadState('domcontentloaded'); await pop2.waitForTimeout(250);
 const made=await pop2.evaluate(()=>({t:document.title, fab:document.body.innerText.includes('PC14099'),
   trim:document.body.innerText.includes('Antique brass'), logo:document.body.innerText.includes('Maldon Salt Logo')}));
 console.log('after filling in:', JSON.stringify(made));
 await pop2.close();

 const now=await p.evaluate(()=>({printsNow:smPrintable('OHAPP0785191'),
   edits:Object.keys(styleEdits), btn:[...document.querySelectorAll('#smList .sm-tbl tbody tr')]
     .map(tr=>tr.querySelector('button')?tr.querySelector('button').textContent.trim():'').join(' | ')}));
 console.log('style saved:', JSON.stringify(now));

 // link a repo file
 await p.evaluate(()=>{ window.prompt=()=>'S-OH114816-Pt1.xlsx'; smLinkDoc(WOs.find(w=>w.sm).ref); }); await p.waitForTimeout(150);
 const lnk=await p.evaluate(()=>{const a=document.querySelector('#smList a[href^="works-orders/"]');
   return a?a.getAttribute('href'):'none';});
 console.log('linked file href:', lnk);

 await p.reload(); await p.waitForTimeout(400); await p.click('#tabSpecial'); await p.waitForTimeout(200);
 console.log('after reload:', JSON.stringify(await p.evaluate(()=>({edits:Object.keys(styleEdits).length,
   prints:smPrintable('OHAPP0785191'), docs:Object.keys(smDocs).length}))));
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await p.screenshot({path:'sm6.png',fullPage:true});
 await b.close();
})();
