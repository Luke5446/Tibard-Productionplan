// The five works order templates set up on 13 Oct 2026 from the sheets Luke sent:
// the Ciao Bella storm grey waist apron (CBAPP054964PG, PDF), the black waiters
// cloth (WCL222203), the Wagamama red skull cap (WAGHTM016007), the Hickory's
// black denim waist apron (OHHICAPP062803DEN) and the Pilot Light navy bib apron
// (OHAPP063015HP1S). Checks that each code resolves to its own one-size record,
// the fabric usage (All Costings where it has the code, the lay plan's marker
// where the cutting room has one), the thread standard by garment kind, which
// records carry their own branding, the images from the sheets, and the printed
// works order's fabric, trims, chart and branding band.
const { chromium } = require('playwright');
const path = require('path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; let fails=0;
 const ck=(n,ok,x)=>{ if(ok) console.log('  ok -',n); else { fails++; console.log('  FAIL -',n,x==null?'':JSON.stringify(x)); } };
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+path.join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);

 const CODES=['CBAPP054964PG','WCL222203','WAGHTM016007','OHHICAPP062803DEN','OHAPP063015HP1S'];
 const r=await p.evaluate(codes=>{
   const out={};
   codes.forEach(c=>{
     const h=styleForCode(c), s=h&&h.style, u=fabricUsageFor(c);
     const thr=s&&s.trims.filter(t=>/^Thread$/.test(t[0]))[0];
     out[c]={ code:s&&s.code, size:h&&h.size, one:!!(s&&s.oneSize), variant:s&&s.variant, customer:s&&s.customer,
       fab:s&&s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'),
       usage:u?[u.code,u.metres,u.source]:null, stock:smIsStockStyle(c), kind:garmentKind(c,s), thread:thr&&thr[2],
       codes:s&&s.trims.map(t=>t[3]).filter(Boolean).join('+'), nTrims:s&&s.trims.length, nMfg:s&&s.mfg.length, nFin:s&&s.fin.length,
       brand:s&&s.brandType, logo:s&&(s.logoImg||'').slice(0,15), place:s&&(s.placeImg||'').slice(0,15),
       chart:(STYLE_MASTER.charts[s.chart]||[]).length, cols:(STYLE_MASTER.chartCols[s.chart]||[]).join(','), printable:smPrintable(c) };
   });
   out.count=STYLE_MASTER.styles.length;
   return out;
 }, CODES);

 CODES.forEach(c=>ck(c+' resolves to its own one-size record', r[c].code===c&&r[c].size===null&&r[c].one&&r[c].printable, r[c]));
 ck('322 styles in the master', r.count===322, r.count);
 const cb=r.CBAPP054964PG, wcl=r.WCL222203, wag=r.WAGHTM016007, hic=r.OHHICAPP062803DEN, pl=r.OHAPP063015HP1S;
 ck('Ciao Bella: PC2064ECO at A3, 0.5 m, All Costings agrees', cb.fab==='PC2064ECO:A3:0.5'&&cb.usage[0]==='PC2064ECO'&&cb.usage[1]===0.5&&cb.usage[2]==='All Costings', [cb.fab,cb.usage]);
 ck('Ciao Bella: waist apron thread at 30, grey 09963 and the Tibard label tape coded, own logo and placement', cb.kind==='APW'&&cb.thread===30&&cb.codes==='CMP-THR-EP80-09963-64+CMP-LBL-NYL-25-01'&&cb.brand==='Embroidery'&&cb.logo==='data:image/jpeg'&&cb.place==='data:image/jpeg'&&cb.stock===false&&cb.chart===3, cb);
 ck('Waiters cloth: CO5003ECO 0.25 m from All Costings, a stock style with no branding, 56 cm chart', wcl.fab==='CO5003ECO:A4:0.25'&&wcl.usage[0]==='CO5003ECO'&&wcl.usage[1]===0.25&&wcl.usage[2]==='All Costings'&&wcl.stock===true&&wcl.brand===''&&!wcl.logo&&wcl.chart===2&&wcl.kind==='', wcl);
 ck('Waiters cloth: black thread coded, two making lines', wcl.codes==='CMP-THR-EP80-09700-03'&&wcl.nMfg===2&&wcl.customer==='Whitbread', wcl);
 ck('Wagamama hat: red PC2X13307 0.12 m and the red mesh 0.04 m, All Costings agrees', wag.fab==='PC2X13307:B11:0.12+MESHPW31407:B5:0.04'&&wag.usage[0]==='PC2X13307'&&wag.usage[1]===0.12, [wag.fab,wag.usage]);
 ck('Wagamama hat: hook velcro, red thread, Tibard tax tab and label tape coded; variant WAG0160M; logo and photo', wag.codes==='CMP-VEL-HOOK-16-03+CMP-THR-EP80-03860-07+TAXTABTIB01+CMP-LBL-NYL-25-01'&&wag.variant==='WAG0160M'&&wag.brand==='Embroidery'&&wag.logo==='data:image/jpeg'&&wag.place==='data:image/jpeg'&&wag.stock===false&&wag.chart===4&&wag.kind===''&&wag.thread===70&&wag.customer==='Wagamama', wag);
 ck("Hickory's: CO5003DEN 0.53 m on the record, the lay plan's marker 0628001 (0.518) is the usage", hic.fab==='CO5003DEN:B2:0.53'&&hic.usage[0]==='CO5003DEN'&&hic.usage[1]===0.518&&/marker 0628001/.test(hic.usage[2]), [hic.fab,hic.usage]);
 ck("Hickory's: gold thread at 30, OH labels, D rings, eyelets and rings coded; zip, rivets and towel loop not; placement sketch, no logo artwork", hic.kind==='APW'&&hic.thread===30&&hic.codes==='CMP-THR-EP80-02362-79+LABELOH5771+CMP-OH-LBL-WASH-01+CMP-DR25-931+CMP-30ED-28-931+CMP-30RD-28-931'&&hic.nTrims===9&&hic.brand==='Embroidery'&&!hic.logo&&hic.place==='data:image/jpeg'&&hic.stock===false&&hic.variant==='0628'&&hic.chart===2, hic);
 ck('Pilot Light: CO5015ECO 0.7 m and the leather hide with no rating; the marker AP0630100 (0.65) is the usage', pl.fab==='CO5015ECO:A5:0.7+LEATHERHIDE:C1:null'&&pl.usage[0]==='CO5015ECO'&&pl.usage[1]===0.65&&/marker AP0630100/.test(pl.usage[2]), [pl.fab,pl.usage]);
 ck('Pilot Light: bib apron thread at 70, labels and tax tab coded, sliders, studs and the woven label not; label as its own branding with the image and placement', pl.kind==='APB'&&pl.thread===70&&pl.codes==='CMP-THR-EP80-07935-15+CMP-THR-EP80-09700-03+LABELOH5771+CMP-OH-LBL-WASH-01+CMP-LBL-NYL-25-01+TAXTABOH07/01'&&pl.nTrims===10&&pl.brand==='Woven label'&&pl.logo==='data:image/jpeg'&&pl.place==='data:image/jpeg'&&pl.stock===false&&pl.variant==='PILOTLGT'&&pl.chart===8&&pl.cols==='Measurement,Value', pl);

 async function printOf(code, qty){
   const [pop]=await Promise.all([p.waitForEvent('popup'), p.evaluate(a=>{ window.print=()=>{}; printWOP('WO-TEST',a.code,a.qty,'2026-10-13',null); },{code,qty})]);
   await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
   const d=await pop.evaluate(()=>({text:document.body.innerText.replace(/\s+/g,' '), imgs:document.querySelectorAll('img[src^="data:image/jpeg"]').length}));
   await pop.close(); return d;
 }
 let d=await printOf('CBAPP054964PG',48);
 ck('Ciao Bella print: fabric line, thread code, branding band with the 8 cm logo wording, chart and both images', /PC2064ECO A3 0\.5/.test(d.text)&&d.text.includes('CMP-THR-EP80-09963-64')&&d.text.includes('CUSTOMER BRANDING')&&d.text.includes('17 cm in from the left side seam')&&d.text.includes('Finished width')&&d.text.includes('AP3006')&&d.imgs>=2, [d.text.match(/PC2064ECO.{0,30}/), d.imgs]);
 d=await printOf('WCL222203',70);
 ck('Waiters cloth print: 56 cm chart, the folder, no branding band', d.text.includes('56 cm (± 1.5)')&&d.text.includes('using the folder')&&d.text.includes('CO5003ECO')&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,300));
 d=await printOf('WAGHTM016007',10);
 ck('Wagamama hat print: both cloths, the variant, tax tab, 60 cm chart and the logo', d.text.includes('MESHPW31407')&&d.text.includes('WAG0160M')&&d.text.includes('TAXTABTIB01')&&d.text.includes('60 cm (TOL ± 1)')&&d.text.includes('2.2 cm up from the bottom edge')&&d.imgs>=2, d.imgs);
 d=await printOf('OHHICAPP062803DEN',30);
 ck("Hickory's print: variant 0628, zip, D rings, eyelets, the 5 star logo and the sketch", d.text.includes('variant 0628')&&d.text.includes('MGKBC56C/7/18')&&d.text.includes('CMP-DR25-931')&&d.text.includes('CMP-30ED-28-931')&&d.text.includes('5 star logo (20 cm)')&&d.text.includes('18.5 cm measured from the finished side seam')&&d.imgs>=1, d.imgs);
 d=await printOf('OHAPP063015HP1S',12);
 ck('Pilot Light print: variant PILOTLGT, the leather hide, the extra care label, the woven label band with its image, the 8-row chart', d.text.includes('PILOTLGT')&&d.text.includes('LEATHERHIDE')&&d.text.includes('REMOVE LEATHER TRIM BEFORE WASH')&&d.text.includes('Woven label')&&d.text.includes('Length of waist tie including box stitch')&&d.text.includes('cut the neck strap 86 cm')&&d.imgs>=2, d.imgs);

 console.log('errors:', errs.length?errs.join(' | '):'none');
 console.log(fails?('FAILED '+fails):'ALL PASSED');
 await b.close(); process.exit(fails||errs.length?1:0);
})();
