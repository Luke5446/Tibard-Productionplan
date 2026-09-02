const { chromium } = require('playwright');
const T=a=>a.join('\t');
const paste=T(['OH-1','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN BIB APRON','12','2026-09-11','MALDON','WORKS ORDER','Oliver Harvey']);
// costing export now carries fabric rating and cost per m
const exp={code:"OHAPP0785191",name:"Forest green bib apron",desc:"Adjustable neck strap",
 lectra:"OHAPP0785",variant:"", chart:"", chartRows:[],
 fabrics:[["FOREST GREEN POLY/COTTON","PC9070","B6",0.52,5.3651]],
 trims:[["LABELOH5771","Oliver Harvey woven label",1]],
 mfg:["Twin needle hem"],fin:["Press and fold"],machMins:8,finMins:5,cutBatch:24,cutMins:15,
 oneSize:true,sr:"SR-0150",customer:"MALDON"};
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(150);
 await p.evaluate(()=>{window.confirm=()=>true; smTickAll(true); smCreateAllShown();}); await p.waitForTimeout(200);

 const noData=await p.evaluate(()=>{
   let m=null; window.alert=x=>{m=x;};
   (function(){var w=WOs.find(w=>w.sm);printWOPTracked(WOs.indexOf(w),w.items[0].code,w.items[0].qty);})();
   return {alert:m, editorGone:!document.getElementById('styleEditModal'),
     fnGone:(typeof smOpenStyleEditor==='undefined'),
     listBtns:document.querySelectorAll('#smList .sm-tbl tbody button').length,
     warnTag:document.querySelector('#smList .sm-tag.warn')?document.querySelector('#smList .sm-tag.warn').textContent:null};
 });
 console.log('no data ->', JSON.stringify(noData));

 const imp=await p.evaluate(j=>{ smOpenImport(); smDoImport(JSON.stringify(j));
   return {fab:styleEdits['OHAPP0785191'].fabrics[0], printable:smPrintable('OHAPP0785191')}; }, exp);
 await p.waitForTimeout(200);
 console.log('after import, fabric row:', JSON.stringify(imp.fab), 'printable:', imp.printable);

 const [pop]=await Promise.all([p.waitForEvent('popup'),
   p.evaluate(()=>{window.print=()=>{}; (function(){var w=WOs.find(w=>w.sm);printWOPTracked(WOs.indexOf(w),w.items[0].code,w.items[0].qty);})();})]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
 const doc=await pop.evaluate(()=>{const t=document.body.innerText; return {
   rating:t.includes('0.52'), code:t.includes('PC9070'),
   costLeaked:/5\.3651|£\s*5\.36/.test(t), anyCost:/£/.test(t)};});
 console.log('printed:', JSON.stringify(doc));
 await pop.close();
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await p.screenshot({path:'tests/out/nowarn.png',fullPage:true});
 await b.close();
})();
