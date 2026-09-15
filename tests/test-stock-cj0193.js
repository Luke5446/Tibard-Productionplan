// The stock styles added from the GT's works orders on 15/09/26: Tibard CJ0193 / CICJ0193 in
// white (01) and black (03) at every size token Sage uses, the 6" longer CJ0193--01S kept as a
// costing-app template that never claims a live Sage "special" code, and the two Oliver Harvey
// Blade shirt-style jackets OHCJ4007 / OHLCJ4008. Checks the code resolution, the printed works
// order (size wording, highlighted chart row, Sage codes with the placement wording kept) and
// the trim cost helper.
const { chromium } = require('playwright');
const path = require('path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; let fails=0;
 const ck=(n,ok,x)=>{ if(ok) console.log('  ok -',n); else { fails++; console.log('  FAIL -',n,x==null?'':JSON.stringify(x)); } };
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+path.join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);

 // ── resolution of live Sage codes ──
 const r=await p.evaluate(()=>{
   const f=c=>{ const h=styleForCode(c); return h?[h.style.code,h.size]:null; };
   return { mm:f('CJ0193MM01'), n52:f('CJ01935201'), xxs03:f('CJ0193XXS03'), ss:f('CICJ0193LL01'), ssxl03:f('CICJ0193XL03'),
     oh42:f('OHCJ40074293'), ohl36:f('OHLCJ40083693'),
     special:f('CJ0193MM01S'), special52:f('CJ01935201S'), unbranded:f('CJ0193LL01U'), long10:f('CJ01935401L'),
     tplInMaster:STYLE_MASTER.styles.some(s=>s.code==='CJ0193--01S'&&s.template===true),
     tplCosts:!!TRIM_COSTS['CJ0193--01S'], stock:smIsStockStyle('CJ0193MM01'), specialFamily:smIsStockStyle('CJ0193MM01S'), specialPrints:smPrintable('CJ0193MM01S'),
     count:STYLE_MASTER.styles.length };
 });
 ck('CJ0193MM01 -> CJ0193--01 size MM', r.mm&&r.mm[0]==='CJ0193--01'&&r.mm[1]==='MM', r.mm);
 ck('CJ01935201 -> CJ0193--01 size 52', r.n52&&r.n52[0]==='CJ0193--01'&&r.n52[1]===52, r.n52);
 ck('CJ0193XXS03 -> black long sleeve', r.xxs03&&r.xxs03[0]==='CJ0193--03'&&r.xxs03[1]==='XXS', r.xxs03);
 ck('CICJ0193LL01 -> short sleeve white', r.ss&&r.ss[0]==='CICJ0193--01', r.ss);
 ck('CICJ0193XL03 -> short sleeve black', r.ssxl03&&r.ssxl03[0]==='CICJ0193--03', r.ssxl03);
 ck('OHCJ40074293 -> OHCJ4007--93 size 42', r.oh42&&r.oh42[0]==='OHCJ4007--93'&&r.oh42[1]===42, r.oh42);
 ck('OHLCJ40083693 -> OHLCJ4008--93 size 36', r.ohl36&&r.ohl36[0]==='OHLCJ4008--93'&&r.ohl36[1]===36, r.ohl36);
 ck('the 6" longer template never claims a Sage special (…01S) code', r.special===null&&r.special52===null, [r.special,r.special52]);
 ck('template is in the style master, flagged, with trim costs', r.tplInMaster&&r.tplCosts);
 ck('no-branding (U) and extra-length (L) codes stay unmatched', r.unbranded===null&&r.long10===null, [r.unbranded,r.long10]);
 ck('CJ0193MM01 is a stock style; a special of the family still shows "no works order data"', r.stock&&r.specialFamily&&!r.specialPrints, r);
 ck('267 styles in the master', r.count===267, r.count);

 // ── printed works order: Tibard long sleeve, medium ──
 async function printOf(code, qty){
   const [pop]=await Promise.all([p.waitForEvent('popup'), p.evaluate(a=>{ window.print=()=>{}; printWOP('WO-TEST',a.code,a.qty,'2026-10-01',null); },{code,qty})]);
   await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
   const d=await pop.evaluate(()=>{
     const hit=[...document.querySelectorAll('tr.sz-hit')].map(tr=>tr.cells[0].textContent.trim());
     const sizeCell=[...document.querySelectorAll('th')].filter(th=>th.textContent.trim()==='Size').map(th=>th.nextElementSibling.textContent.trim());
     return {text:document.body.innerText, hit, size:sizeCell[0]||''};
   });
   await pop.close(); return d;
 }
 let d=await printOf('CJ0193MM01',10);
 ck('MM prints as size M', d.size==='M', d.size);
 ck('the M row is highlighted on the chart', d.hit.length===1&&d.hit[0]==='M', d.hit);
 ck('chart has the to-fit column and the tolerance line', d.text.includes('To fit chest')&&d.text.includes('Chest ± 2 cm'));
 ck('fabric PC2001ECO at B2, 1.5 m per unit', /PC2001ECO\s+B2\s+1\.5/.test(d.text.replace(/\n/g,' ')), d.text.match(/PC2001ECO.{0,40}/));
 ck('centre fold label carries its Sage code and the placement wording', d.text.includes('LABELTIB4565')&&d.text.includes('Tibard Woven Centrefold Label (32x80mm) — Set to centre back neck into neck seam'));
 ck('studs qty 10 and no code yet', /10 x nickel plated ring press studs/.test(d.text)&&d.text.includes('no code yet'));
 ck('Lectra pattern and variant printed', d.text.includes('0193NEWLS'));
 ck('manufacturing and finishing notes printed', d.text.includes('Make collar and edgestitch')&&d.text.includes('Mark and set male studs'));

 d=await printOf('CJ01935203',6);
 ck('a numeric 52 on the black long sleeve highlights the XXL (50–52") row', d.hit.length===1&&d.hit[0]==='XXL', d.hit);
 ck('black fabric PC2003ECO at B1 and black thread', d.text.includes('PC2003ECO')&&d.text.includes("Coats Epic 80's black"));

 d=await printOf('CICJ01935401',6);
 ck('short sleeve 54 highlights the 3XL row and prints the short sleeve length', d.hit.length===1&&d.hit[0]==='3XL'&&d.text.includes('28.8 cm'), d.hit);

 d=await printOf('OHCJ40074293',12);
 ck('OH gents 42" highlighted with a collar column', d.hit.length===1&&d.hit[0]==='42"'&&d.text.includes('Collar'), d.hit);
 ck('Blade fabric and the FUS1256 interlining both listed', d.text.includes('PC6093')&&d.text.includes('FUS1256')&&d.text.includes('0.06'));
 ck('OH label, wash label and swing tag coded; buttons and thread not', d.text.includes('LABELOH5771')&&d.text.includes('CMP-OH-LBL-WASH-01')&&d.text.includes('OHSWINGTAG')&&d.text.includes('Jones button P64/24'));
 ck('variant SCOOPJKTNEWLS printed', d.text.includes('SCOOPJKTNEWLS'));

 d=await printOf('OHLCJ40083693',4);
 ck('OH ladies 36" highlighted, ladies fastening noted', d.hit.length===1&&d.hit[0]==='36"'&&d.text.includes('right over left'), d.hit);

 // ── OH heather green waist apron with kangaroo pocket (one size, its own measurement table) ──
 d=await printOf('OHAPP0631682KP',20);
 ck('apron resolves exactly and prints one size', await p.evaluate(()=>styleForCode('OHAPP0631682KP').style.code==='OHAPP0631682KP') && d.size==='One size', d.size);
 ck('apron fabric PC90682 with 0.6 m per unit, measurement table and rivets x 4', d.text.includes('PC90682')&&d.text.includes('0.6')&&d.text.includes('Length of waist tie including box stitch')&&/Rivets[\s\S]{0,120}no code yet[\s\S]{0,10}4/.test(d.text), d.text.match(/Rivets[\s\S]{0,140}/));
 ck('apron OH label and tax tab coded, reverse-side waist tie note printed', d.text.includes('LABELOH5771')&&d.text.includes('TAXTABOH07/01')&&d.text.includes('USE REVERSE SIDE OF FABRIC AS RIGHT SIDE'));
 ck('apron fabric usage comes from the works order rating (not in All Costings)', await p.evaluate(()=>{ const u=fabricUsageFor('OHAPP0631682KP'); return u&&u.code==='PC90682'&&u.metres===0.6&&u.source==='works order data'; }), await p.evaluate(()=>JSON.stringify(fabricUsageFor('OHAPP0631682KP'))));

 // ── trim cost helper resolves a sized code to the style ──
 const tc=await p.evaluate(()=>{ showTrimCosts(); document.getElementById('tcStyle').value='CJ0193LL01'; renderTrimCosts();
   const t=document.getElementById('tcBody').innerText; closeTrimCosts();
   return {t, listed:[...document.querySelectorAll('#tcStyles option')].some(o=>o.value==='OHCJ4007--93')}; });
 ck('trim costs for CJ0193LL01 show the Tibard labels with prices', tc.t.includes('CJ0193--01')&&tc.t.includes('LABELTIB4565')&&tc.t.includes('0.02737'), tc.t.slice(0,200));
 ck('new OH style listed in the helper', tc.listed);

 console.log('errors:', errs.length?errs.join(' | '):'none');
 console.log(fails?('FAILED '+fails):'ALL PASSED');
 await b.close(); process.exit(fails||errs.length?1:0);
})();
