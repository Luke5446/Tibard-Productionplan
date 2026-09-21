// A second logo / artwork image from the costing app: kept on import, tagged in the imported list,
// and printed under CUSTOMER BRANDING & LOGO beneath the first artwork.
const { chromium } = require('playwright');
const path = require('path');
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; let fails=0;
 const ck=(n,ok,x)=>{ if(ok) console.log('  ok -',n); else { fails++; console.log('  FAIL -',n,x==null?'':JSON.stringify(x)); } };
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+path.join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 const prod={code:'CJB0007M',name:'Two-logo jacket — Logo Co',desc:'Jacket with two logos',lectra:'',variant:'',markerMain:'MK',markerLen:1.5,layQty:2,fabrics:[['White twill','PCGALENT01','A6',1.5,3.4]],trims:[['LABELOH5771','OH woven label','1']],mfg:['Join shoulders'],fin:['Press'],machMins:10,finMins:5,cutBatch:24,cutMins:15,oneSize:false,size:'M',sr:'SR0009',srVersion:1,customer:'Logo Co',brandType:'EMB',brandPlace:'Left chest and back',logoImg:'',logo2Img:PNG,placeImg:''};
 await p.evaluate(j=>{ window.alert=()=>{}; smOpenImport(); smDoImport(JSON.stringify(j)); }, prod);
 ck('logo2Img kept on the imported style', await p.evaluate(()=>/^data:image/.test(styleEdits['CJB0007M'].logo2Img)));
 ck('imported list shows a 2nd artwork tag', await p.evaluate(()=>[...document.querySelectorAll('#smImportedList .sm-tag')].some(t=>t.textContent.trim()==='2nd artwork')));
 const [pop]=await Promise.all([p.waitForEvent('popup'), p.evaluate(()=>{ window.print=()=>{}; printWOP('S-TEST','CJB0007M',5,'2026-10-01',null); })]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(200);
 const r=await pop.evaluate(()=>{ const t=document.body.innerText; return {band:t.includes('CUSTOMER BRANDING & LOGO'), row:t.includes('Second logo / artwork'), img:!![...document.images].find(i=>i.alt==='second logo'), first:t.includes('Customer artwork')}; });
 await pop.close();
 ck('works order prints the branding band with the second logo row and image', r.band && r.row && r.img && r.first, r);
 console.log('errors:', errs.length?errs.join(' | '):'none'); console.log(fails?('FAILED '+fails):'ALL PASSED');
 await b.close(); process.exit(fails||errs.length?1:0);
})();
