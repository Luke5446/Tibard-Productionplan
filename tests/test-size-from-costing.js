// A costing-app product carries its size in the record (CJ0002M is size M): the import keeps it
// and the printed works order shows it, while a one-size product still prints "One size".
const { chromium } = require('playwright');
const path = require('path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; let fails=0;
 const ck=(n,ok,x)=>{ if(ok) console.log('  ok -',n); else { fails++; console.log('  FAIL -',n,x==null?'':JSON.stringify(x)); } };
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+path.join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 const base={name:'Custom chef jacket — Size Co',desc:'Custom jacket',lectra:'',variant:'',markerMain:'MK-M',markerLen:1.5,layQty:2,fabrics:[['White twill','PCGALENT01','A6',1.5,3.4]],trims:[['LABELOH5771','OH woven label','1']],mfg:['Join shoulders'],fin:['Press'],machMins:10,finMins:5,cutBatch:24,cutMins:15,sr:'SR0001',srVersion:1,customer:'Size Co',brandType:'None',brandPlace:'',logoImg:'',placeImg:''};
 await p.evaluate(j=>{ window.alert=()=>{}; smOpenImport(); smDoImport(JSON.stringify([Object.assign({code:'CJ0001M',oneSize:false,size:'M'},j), Object.assign({code:'OHAP0009',oneSize:true,size:''},j)])); }, base);
 ck('both products imported with the size kept on the sized one', await p.evaluate(()=>styleEdits['CJ0001M'].size==='M' && styleEdits['OHAP0009'].size===''));
 async function sizeOf(code){
   const [pop]=await Promise.all([p.waitForEvent('popup'), p.evaluate(c=>{ window.print=()=>{}; printWOP('S-TEST',c,5,'2026-10-01',null); },code)]);
   await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(200);
   const v=await pop.evaluate(()=>{ const th=[...document.querySelectorAll('th')].find(t=>t.textContent.trim()==='Size'); return th?th.nextElementSibling.textContent.trim():null; });
   await pop.close(); return v;
 }
 ck('CJ0001M prints Size M', (await sizeOf('CJ0001M'))==='M');
 ck('a one-size product still prints One size', (await sizeOf('OHAP0009'))==='One size');
 console.log('errors:', errs.length?errs.join(' | '):'none'); console.log(fails?('FAILED '+fails):'ALL PASSED');
 await b.close(); process.exit(fails||errs.length?1:0);
})();
