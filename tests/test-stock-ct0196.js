// The Tibard CT0196 elasticated-waist chef trousers from the stock works orders of 12/10/26:
// black regular (CT0196--03) and tall (CTT0196--03) from the sheets, the two gingham check
// colourways (26, 28) derived from the black. Checks code resolution at the lettered and the
// waist-size tokens, the printed works order (size wording, highlighted chart row, fabric and
// elastic lines) and that the fabric usage is the All Costings figure where it has one.
const { chromium } = require('playwright');
const path = require('path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; let fails=0;
 const ck=(n,ok,x)=>{ if(ok) console.log('  ok -',n); else { fails++; console.log('  FAIL -',n,x==null?'':JSON.stringify(x)); } };
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+path.join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);

 const r=await p.evaluate(()=>{
   const f=c=>{ const h=styleForCode(c); return h?[h.style.code,h.size]:null; };
   return { xs:f('CT0196XS03'), ss:f('CT0196SS03'), ll:f('CT0196LL03'), n46:f('CT01964603'), n50:f('CT01965003'),
     tall:f('CTT0196XL03'), tall48:f('CTT01964803'), blue:f('CT0196MM26'), bw:f('CT01964628'), special:f('CT0196XL03S'), white:f('CT0196MM01'),
     usage:fabricUsageFor('CT0196LL03'), tallUsage:fabricUsageFor('CTT0196XL03'), stock:smIsStockStyle('CT0196LL03') };
 });
 ck('CT0196XS03 -> CT0196--03 size XS', r.xs&&r.xs[0]==='CT0196--03'&&r.xs[1]==='XS', r.xs);
 ck('CT0196SS03 and LL03 resolve', r.ss&&r.ss[0]==='CT0196--03'&&r.ss[1]==='SS'&&r.ll&&r.ll[1]==='LL', [r.ss,r.ll]);
 ck('CT01964603 -> size 46, CT01965003 -> size 50', r.n46&&r.n46[0]==='CT0196--03'&&r.n46[1]===46&&r.n50&&r.n50[1]===50, [r.n46,r.n50]);
 ck('CTT0196XL03 -> the tall record, not the regular', r.tall&&r.tall[0]==='CTT0196--03'&&r.tall[1]==='XL', r.tall);
 ck('CTT01964803 -> tall size 48', r.tall48&&r.tall48[0]==='CTT0196--03'&&r.tall48[1]===48, r.tall48);
 ck('gingham 26 and 28 resolve to their own records', r.blue&&r.blue[0]==='CT0196--26'&&r.bw&&r.bw[0]==='CT0196--28'&&r.bw[1]===46, [r.blue,r.bw]);
 ck('a special (…03S) and the white 01 stay unmatched', r.special===null&&r.white===null, [r.special,r.white]);
 ck('CT0196LL03 is a stock style', r.stock===true, r.stock);
 ck('fabric usage: All Costings PC2003ECO 1.25 m wins over the sheet rating', r.usage&&r.usage.code==='PC2003ECO'&&r.usage.metres===1.25&&r.usage.source==='All Costings', r.usage);
 ck('tall XL: All Costings PC2003ECO 1.3 m, the same figure as the sheet', r.tallUsage&&r.tallUsage.code==='PC2003ECO'&&r.tallUsage.metres===1.3&&r.tallUsage.source==='All Costings', r.tallUsage);

 async function printOf(code, qty){
   const [pop]=await Promise.all([p.waitForEvent('popup'), p.evaluate(a=>{ window.print=()=>{}; printWOP('WO-TEST',a.code,a.qty,'2026-10-12',null); },{code,qty})]);
   await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
   const d=await pop.evaluate(()=>{
     const hit=[...document.querySelectorAll('tr.sz-hit')].map(tr=>tr.cells[0].textContent.trim());
     const sizeCell=[...document.querySelectorAll('th')].filter(th=>th.textContent.trim()==='Size').map(th=>th.nextElementSibling.textContent.trim());
     return {text:document.body.innerText, hit, size:sizeCell[0]||''};
   });
   await pop.close(); return d;
 }
 let d=await printOf('CT0196SS03',45);
 ck('SS prints as size S and highlights the S row', d.size==='S'&&d.hit.length===1&&d.hit[0]==='S', [d.size,d.hit]);
 ck('chart has the to-fit waist, thigh and regular length columns', d.text.includes('To fit waist')&&d.text.includes('Thigh')&&d.text.includes('Regular length')&&d.text.includes('79 cm'));
 ck('fabric PC2003ECO at B14 at the All Costings 1.25 m with the costing 1.3 beside it, with the black thread by its Sage code', /PC2003ECO\s+B14\s+1\.25 m \(costing 1\.3\)/.test(d.text.replace(/\n/g,' '))&&d.text.includes('CMP-THR-EP80-09700-03'), d.text.match(/PC2003ECO.{0,40}/));
 ck('elastic cut lengths, zip and tax tab printed', d.text.includes('S 27" (68.5 cm)')&&d.text.includes('6" nylon lightweight zip')&&d.text.includes('outside edge under the pocket hem'));
 ck('Lectra models for the two size ranges and the making notes', d.text.includes('0196BIG')&&d.text.includes('Fly front 21 cm')&&d.text.includes('NOT on chain stitch'));

 d=await printOf('CT01964603',6);
 ck('46" highlights the XXL (44–46") row', d.hit.length===1&&d.hit[0]==='XXL', d.hit);
 d=await printOf('CT01964803',6);
 ck('48" highlights its own row', d.hit.length===1&&d.hit[0]==='48"', d.hit);
 d=await printOf('CTT0196XL03',4);
 ck('tall XL: XL row highlighted on the tall chart, 86.5 cm length', d.hit.length===1&&d.hit[0]==='XL'&&d.text.includes('Tall length')&&(d.text.match(/86\.5 cm/g)||[]).length>=13&&!d.text.includes('Regular length'), d.hit);
 d=await printOf('CT0196MM26',3);
 ck('blue gingham: PC2026 with the white thread', d.text.includes('PC2026')&&d.text.includes('CMP-THR-PC075-32109-01')&&d.hit[0]==='M', d.hit);

 console.log('errors:', errs.length?errs.join(' | '):'none');
 console.log(fails?('FAILED '+fails):'ALL PASSED');
 await b.close(); process.exit(fails||errs.length?1:0);
})();
