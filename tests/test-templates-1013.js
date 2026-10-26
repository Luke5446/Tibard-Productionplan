// The five works order templates set up on 13 Oct 2026 from the sheets Luke sent:
// the Ciao Bella storm grey waist apron (CBAPP054964PG, PDF), the black waiters
// cloth (WCL222203), the Wagamama red skull cap (WAGHTM016007), the Hickory's
// black denim waist apron (OHHICAPP062803DEN) and the Pilot Light navy bib apron
// (OHAPP063015HP1S). Checks that each code resolves to its own one-size record,
// the fabric usage (All Costings where it has the code, the lay plan's marker
// where the cutting room has one), the thread standard by garment kind, which
// records carry their own branding, the images from the sheets, and the printed
// works order's fabric, trims, chart and branding band. On 14 Oct the other five
// Wagamama hat colours were derived from the red sheet and the Respect shroud
// (SHROUD01) added: the colour records take All Costings' cloth with a matching
// mesh and thread, the shroud its 3.7 m rating and the Perma Core white thread.
// Later that day the London Linen wide waist apron SNSAPP052803 (order S851569).
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
 ck('345 styles in the master', r.count===345, r.count);
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
   const d=await pop.evaluate(()=>({text:document.body.innerText.replace(/\s+/g,' '), imgs:document.querySelectorAll('img[src^="data:image/jpeg"]').length,
     hit:[...document.querySelectorAll('tr.sz-hit')].map(tr=>tr.cells[0].textContent.trim()),
     size:([...document.querySelectorAll('th')].filter(th=>th.textContent.trim()==='Size').map(th=>th.nextElementSibling.textContent.trim())[0]||''),
     pngs:document.querySelectorAll('img[src^="data:image/png"]').length}));
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


 const r2=await p.evaluate(()=>{
   const hats={};
   ['WAGHTM016001','WAGHTM016003','WAGHTM016015','WAGHTM016024','WAGHTM016064'].forEach(c=>{
     const h=styleForCode(c), s=h&&h.style, u=fabricUsageFor(c), thr=s&&s.trims.filter(t=>t[0]==='Thread')[0], hook=s&&s.trims.filter(t=>t[0]==='Velcro — hook')[0];
     hats[c]=s?[s.code, s.fabrics.map(f=>f[1]+':'+f[3]).join('+'), u&&u.code+'/'+u.metres+'/'+u.source, thr[3], hook[3], s.chart, s.brandType, (s.logoImg||'').slice(0,15), smIsStockStyle(c)?'stock':'own', /to be confirmed/.test(s.note)?'tbc':'-'].join('|'):null;
   });
   const h=styleForCode('SHROUD01'), s=h&&h.style, u=fabricUsageFor('SHROUD01');
   const shroud=s?[s.code, h.size, s.oneSize?'onesize':'sized', s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&u.code+'/'+u.metres+'/'+u.source, s.trims.map(t=>t[3]).join('+'), s.trims[0][2], garmentKind('SHROUD01',s), s.mfg.length, s.fin.length, (STYLE_MASTER.charts[s.chart]||[]).length, s.brandType, smIsStockStyle('SHROUD01')?'stock':'own'].join('|'):null;
   return {hats, shroud};
 });
 ck('white hat: PC2001ECO + white PW mesh, All Costings 0.12, Perma Core white, white hook velcro, the red chart, own logo, flagged to confirm', r2.hats.WAGHTM016001==='WAGHTM016001|PC2001ECO:0.12+MESHPW31401:0.04|PC2001ECO/0.12/All Costings|CMP-THR-PC075-32109-01|CMP-VEL-HOOK-16-01|WAGHTM016007-MEAS|Embroidery|data:image/jpeg|own|tbc', r2.hats.WAGHTM016001);
 ck('black hat: PC2003ECO + Coolmax black mesh, black thread, black hook velcro', r2.hats.WAGHTM016003==='WAGHTM016003|PC2003ECO:0.12+MESH2290903:0.04|PC2003ECO/0.12/All Costings|CMP-THR-EP80-09700-03|CMP-VEL-HOOK-16-03|WAGHTM016007-MEAS|Embroidery|data:image/jpeg|own|tbc', r2.hats.WAGHTM016003);
 ck('navy hat: PC2015ECO + navy PW mesh, navy thread', r2.hats.WAGHTM016015==='WAGHTM016015|PC2015ECO:0.12+MESHPW31415:0.04|PC2015ECO/0.12/All Costings|CMP-THR-EP80-07935-15|CMP-VEL-HOOK-16-03|WAGHTM016007-MEAS|Embroidery|data:image/jpeg|own|tbc', r2.hats.WAGHTM016015);
 ck("bottle hat: All Costings' PC2024 + bottle PW mesh, bottle green thread", r2.hats.WAGHTM016024==='WAGHTM016024|PC2024:0.12+MESHPW31424:0.04|PC2024/0.12/All Costings|CMP-THR-EP80-05976-24|CMP-VEL-HOOK-16-03|WAGHTM016007-MEAS|Embroidery|data:image/jpeg|own|tbc', r2.hats.WAGHTM016024);
 ck('grey hat: PC2064ECO + silver grey PW mesh, storm grey thread', r2.hats.WAGHTM016064==='WAGHTM016064|PC2064ECO:0.12+MESHPW314286:0.04|PC2064ECO/0.12/All Costings|CMP-THR-EP80-09963-64|CMP-VEL-HOOK-16-03|WAGHTM016007-MEAS|Embroidery|data:image/jpeg|own|tbc', r2.hats.WAGHTM016064);
 ck('shroud: one size, PC2001ECO at B2 3.7 m (All Costings agrees), thread and label tape coded, no bag code, 60 m of thread with no standard, a stock style with no branding', r2.shroud==='SHROUD01||onesize|PC2001ECO:B2:3.7|PC2001ECO/3.7/All Costings|CMP-THR-PC075-32109-01+CMP-LBL-NYL-25-01+|60||2|3|2||stock', r2.shroud);
 d=await printOf('WAGHTM016024',6);
 ck('bottle hat print: PC2024 and the bottle mesh, the red chart and the logo', d.text.includes('PC2024')&&d.text.includes('MESHPW31424')&&d.text.includes('60 cm (TOL ± 1)')&&d.text.includes('2.2 cm up from the bottom edge')&&d.imgs>=2, d.imgs);
 d=await printOf('SHROUD01',10);
 ck('shroud print: the cut instruction, 3.7 m, the label wording, the fold and the sticker; no branding band', d.text.includes('cut 2 at 1.43 m width')&&/PC2001ECO B2 3\.7/.test(d.text)&&d.text.includes('Company ID 000282')&&d.text.includes('selvedge to selvedge')&&d.text.includes('UH 1.08 kg')&&d.text.includes('2.85 m x 1.85 m')&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,200));


 const r3=await p.evaluate(()=>{ const h=styleForCode('SNSAPP052803'), s=h&&h.style, u=fabricUsageFor('SNSAPP052803');
   return s?[s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.customer, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&u.code+'/'+u.metres+'/'+u.source, s.trims.map(t=>t[3]).join('+'), garmentKind('SNSAPP052803',s), s.trims[0][2], s.mfg.length, s.fin.length, (STYLE_MASTER.charts[s.chart]||[]).length, s.brandType, smIsStockStyle('SNSAPP052803')?'stock':'own'].join('|'):null; });
 ck('London Linen apron: one size, PC2003ECO at B1 1.1 m (All Costings agrees), black thread at the waist apron 30 and the label tape coded, stay tape not, no branding, a stock style', r3==='SNSAPP052803||onesize|APP0528PKT|London Linen|PC2003ECO:B1:1.1|PC2003ECO/1.1/All Costings|CMP-THR-EP80-09700-03+CMP-LBL-NYL-25-01+|APW|30|9|4|3||stock', r3);
 d=await printOf('SNSAPP052803',250);
 ck('London Linen print: the 0528 variant and marker, the split and stay tape, the 129 cm chart, no branding band', d.text.includes('APP0528PKT')&&/PC2003ECO B1 1\.1/.test(d.text)&&d.text.includes('stay tape (cut at 2.5 cm)')&&d.text.includes('129 cm (± 1.5)')&&d.text.includes('35 cm in from the finished side seam')&&d.text.includes('fold in tens')&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,200));


 const r6=await p.evaluate(()=>{ const h=styleForCode('OHAP060501'), s=h&&h.style, u=fabricUsageFor('OHAP060501');
   return s?[s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.customer, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&[u.code,u.metres,u.source,u.lay].join('/'), s.trims.map(t=>t[3]).join('+'), garmentKind('OHAP060501',s), s.trims[0][2], s.mfg.length, s.fin.length, (STYLE_MASTER.charts[s.chart]||[]).length, (STYLE_MASTER.chartCols[s.chart]||[]).join(','), s.brandType, (s.logoImg||'').slice(0,15), (s.logo2Img||'').slice(0,15), (s.placeImg||'').slice(0,15), smIsStockStyle('OHAP060501')?'stock':'own', FABRIC_USAGE.OHAP060501.join(':')].join('|'):null; });
 ck('Fat Duck apron: one size on CO5001ECO at A6 0.9 m, the marker AP0605001 at 2 per lay (0.875 m) is the usage, All Costings corrected from PC6001; thread, labels and both stud parts coded; two logos and the photo as its own branding', r6==='OHAP060501||onesize|0605|Fat Duck|CO5001ECO:A6:0.9|CO5001ECO/0.875/marker AP0605001/2|CMP-THR-PC075-32109-01+LABELOH5771+CMP-STD-SOC-032B-677+CMP-STD-DUO-032B-677+CMP-OH-LBL-WASH-01|APB|70|11|2|1|Width (skirt),Across bib,Neck strap,Length from bib to hem|Embroidery|data:image/jpeg|data:image/jpeg|data:image/jpeg|own|CO5001ECO:0.9', r6);
 d=await printOf('OHAP060501',20);
 ck('Fat Duck print: AP0532 variant 0605, the fabric row at the marker usage 0.875 with the costing 0.9 beside it and the 17.80 m total, the lay plan line with wastage, both logos and the photo, the 4-column chart, the stud note', d.text.includes('variant 0605')&&d.text.includes('AP0605001')&&/CO5001ECO A6 0\.875 m \(costing 0\.9\)\s+17\.80 m/.test(d.text)&&d.text.includes('10 plies of 1.78 m (AP0605001) - total 17.80 m to cut (3 cm wastage per ply included)'.replace(' - ',' — '))&&d.text.includes('Second logo')&&d.text.includes('Placement photo')&&d.text.includes('feathers logo to the bottom corner')&&d.text.includes('Neck strap')&&d.text.includes('OHAP0605 stud marker')&&d.imgs>=3, [d.imgs, d.text.match(/plies of 1\.75.{0,90}/)]);


 const r7=await p.evaluate(()=>{ const h=styleForCode('HT016064'), s=h&&h.style, u=fabricUsageFor('HT016064');
   return s?[s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&[u.code,u.metres,u.source].join('/'), s.trims.map(t=>t[3]).join('+'), s.trims[2][2], s.mfg.length, (STYLE_MASTER.charts[s.chart]||[]).length, s.brandType, s.logoImg?'logo':'nologo', smIsStockStyle('HT016064')?'stock':'own'].join('|'):null; });
 ck('stock storm grey hat HT016064: one size on PC2064ECO at 0.12 m (All Costings 0.2 wins), velcro, thread, Tibard tax tab and label tape coded, no branding, a stock style', r7==='HT016064||onesize|HT0160NEW|PC2064ECO:A3:0.12|PC2064ECO/0.2/All Costings|CMP-VEL-HOOK-16-03++CMP-THR-EP80-09963-64+TAXTABTIB01+CMP-LBL-NYL-25-01|70|8|2||nologo|stock', r7);
 d=await printOf('HT016064',20);
 ck('stock hat print: HT0160NEW, the tax tab, 57 cm chart, no branding band', d.text.includes('HT0160NEW')&&d.text.includes('TAXTABTIB01')&&d.text.includes('57 cm (TOL ± 1)')&&/PC2064ECO A3 0\.2 m \(costing 0\.12\)/.test(d.text)&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,200));

 // ── the three bib aprons of 15 Oct 2026 ──
 const r8=await p.evaluate(()=>{ const one=c=>{ const h=styleForCode(c), s=h&&h.style, u=fabricUsageFor(c); if(!s) return null;
     const thr=s.trims.filter(t=>/^Thread$/.test(t[0]))[0];
     return [s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&[u.code,u.metres,u.source].join('/'), s.trims.map(t=>t[3]).join('+'), thr&&thr[2], garmentKind(c,s), s.mfg.length+'/'+s.fin.length, (STYLE_MASTER.charts[s.chart]||[]).length, s.brandType, s.logoImg?'logo':'nologo', s.placeImg?'place':'noplace', smIsStockStyle(c)?'stock':'own', s.customer].join('|'); };
   return {a:one('OHAPP0666241'), b:one('AP0776128'), c:one('OHHICAPP062703DEN/DS')}; });
 ck('slate grey off-centre bib OHAPP0666241: CO5241ECO 0.86 m from All Costings, slate grey thread at 70, OH labels coded, the ring studs not, no branding, a stock style', r8.a==='OHAPP0666241||onesize|0666|CO5241ECO:A5:0.86|CO5241ECO/0.86/All Costings|CMP-THR-EP80-09975-241+LABELOH5771+CMP-OH-LBL-WASH-01+|70|APB|12/1|7||nologo|noplace|stock|Alpha Co Tokyo', r8.a);
 ck('Tibard charcoal bib AP0776128: PCECO520128 0.6 m from All Costings, the maroon contrast with no rating, grey thread at 70, label tape, studs, eyelet and ring coded, no branding, a stock style', r8.b==='AP0776128||onesize|OHAP0776|PCECO520128:B3:0.6+CO5005:A5:0|PCECO520128/0.6/All Costings|CMP-THR-EP80-09963-64+CMP-THR-EP80-03912-05+CMP-LBL-NYL-25-01+CMP-STD-PST-9B-287+CMP-STD-SOC-9B-287+CMP-30ED-28-931+CMP-30RD-28-931|70|APB|9/3|6||nologo|noplace|stock|Gaucho', r8.b);
 ck("Hickory's bib OHHICAPP062703DEN/DS: CO5003DEN 0.75 m on the record, the lay plan's marker 0627001 (0.655) is the usage, gold thread at 70, labels, tax tab, towel loop, studs, D rings, eyelets, rings and hanger tape coded, the zip and rivets not, own branding with the sketch", r8.c==="OHHICAPP062703DEN/DS||onesize|0627|CO5003DEN:B2:0.75|CO5003DEN/0.655/marker 0627001|CMP-THR-EP80-02362-79+LABELOH5771+CMP-OH-LBL-WASH-01+TAXTABOH07/01+CMP-OH-NTT-25-03+CMP-STD-PST-9B-287++CMP-DR25-931++CMP-30ED-28-931+CMP-30RD-28-931+CMP-PIP-08-03|70|APB|19/5|4|Embroidery|nologo|place|own|Hickory's", r8.c);
 d=await printOf('OHHICAPP062703DEN/DS',30);
 ck("Hickory's bib print: variant 0627, the marker line, the strap note, the 4-row chart, the branding band with the sketch", d.text.includes('variant 0627')&&d.text.includes('0627001')&&d.text.includes('OHSTRAP03DEN')&&d.text.includes('92 cm (± 1.5)')&&d.text.includes('CUSTOMER BRANDING')&&d.text.includes('5 star logo')&&d.imgs>=1, [d.imgs, d.text.slice(0,300)]);
 d=await printOf('OHAPP0666241',20);
 ck('off-centre bib print: variant 0666, the one way lay note, the stud marker, the 7-row chart, no branding band', d.text.includes('variant 0666')&&d.text.includes('one way lay')&&d.text.includes('OHAPP0544')&&d.text.includes('16 cm wide x 20 cm deep')&&/CO5241ECO A5 0\.86/.test(d.text)&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,300));
 d=await printOf('AP0776128',20);
 ck('Gaucho bib print: OHAP0776, the eyelet, the 6-row chart, no branding band', d.text.includes('OHAP0776')&&d.text.includes('CMP-30ED-28-931')&&d.text.includes('2.5 cm x 76 cm')&&/PCECO520128 B3 0\.6/.test(d.text)&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,300));


 const r8w=await p.evaluate(()=>{ const h=styleForCode('WAGSB077403'), s=h&&h.style, u=fabricUsageFor('WAGSB077403');
   return s?[s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.customer, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&[u.code,u.metres,u.source,u.lay].join('/'), s.trims.map(t=>t[3]).join('+'), s.trims[5][2], garmentKind('WAGSB077403',s), s.mfg.length, s.fin.length, (STYLE_MASTER.chartCols[s.chart]||[]).length, s.brandType, smIsStockStyle('WAGSB077403')?'stock':'own', cutLayFor('WAGSB077403').src].join('|'):null; });
 ck('Wagamama staff bag: one size on PVC600D03 at D7 0.17 m (All Costings 0.2 wins, one per ply, no lay plan), thread, label tape and the Wagamama tax tab coded, the tri glide, buckle and 1.21 m of jacquard webbing not, no branding, a stock style', r8w==='WAGSB077403||onesize|WAGSB0774|Wagamama|PVC600D03:D7:0.17|PVC600D03/0.2/All Costings/1|CMP-THR-EP80-09700-03+CMP-LBL-NYL-25-01+TAXTABWAG07/01+++|1.21||11|2|5||stock|', r8w);
 d=await printOf('WAGSB077403',150);
 ck('staff bag print: the variant, the tax tab code, Butonia parts, the webbing cut lengths, the 5-column chart, no branding band', d.text.includes('WAGSB0774')&&d.text.includes('TAXTABWAG07/01')&&d.text.includes('Butonia 970054')&&d.text.includes('cut 1 at 14 cm and 1 at 107 cm')&&d.text.includes('93 cm (± 2)')&&/PVC600D03 D7 0\.2 m \(costing 0\.17\)/.test(d.text)&&d.text.includes('multiples of 60')&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,200));

 // ── the Gaucho charcoal waist apron of 19 Oct 2026 ──
 const r9=await p.evaluate(()=>{ const h=styleForCode('AP0777128'), s=h&&h.style, u=fabricUsageFor('AP0777128'); if(!s) return null;
   const thr=s.trims.filter(t=>/^Thread$/.test(t[0]))[0];
   return [s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&[u.code,u.metres,u.source,u.lay].join('/'), s.trims.map(t=>t[3]).join('+'), thr&&thr[2], s.trims[5][2], garmentKind('AP0777128',s), s.mfg.length+'/'+s.fin.length, (STYLE_MASTER.charts[s.chart]||[]).length, s.brandType, s.logoImg?'logo':'nologo', s.placeImg?'place':'noplace', smIsStockStyle('AP0777128')?'stock':'own', s.customer, cutLayFor('AP0777128').src].join('|'); });
 ck('Tibard charcoal waist apron AP0777128: PCECO520128 0.4 m from All Costings (one per ply, no lay plan), the maroon contrast with no rating, grey thread at 30, label tape, studs, two eyelets and rings coded, no branding, a stock style', r9==='AP0777128||onesize|OHAP0777|PCECO520128:B3:0.4|PCECO520128/0.4/All Costings/1|CMP-THR-EP80-09963-64+CMP-THR-EP80-03912-05+CMP-LBL-NYL-25-01+CMP-STD-PST-9B-287+CMP-STD-SOC-9B-287+CMP-30ED-28-931+CMP-30RD-28-931|30|2|APW|4/3|4||nologo|noplace|stock|Gaucho|', r9);
 d=await printOf('AP0777128',20);
 ck('Gaucho waist print: OHAP0777, the eyelet code, the 4-row chart, the 98 cm ties, no branding band', d.text.includes('OHAP0777')&&d.text.includes('CMP-30ED-28-931')&&d.text.includes('2.5 cm x 98 cm')&&d.text.includes('Length from waist to hem')&&/PCECO520128 B3 0\.4/.test(d.text)&&d.text.includes('even number bundles')&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,300));

 // ── the Shake Shack black polyester bib apron of 21 Oct 2026 ──
 const r10=await p.evaluate(()=>{ const h=styleForCode('SHAAPP054203'), s=h&&h.style, u=fabricUsageFor('SHAAPP054203'); if(!s) return null;
   const thr=s.trims.filter(t=>/^Thread$/.test(t[0]))[0];
   return [s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&[u.code,u.metres,u.source,u.lay].join('/'), s.trims.map(t=>t[3]).join('+'), thr&&thr[2], s.trims[2][2], garmentKind('SHAAPP054203',s), s.mfg.length+'/'+s.fin.length, (STYLE_MASTER.charts[s.chart]||[]).length, s.brandType, s.logoImg?'logo':'nologo', smIsStockStyle('SHAAPP054203')?'stock':'own', s.customer, cutLayFor('SHAAPP054203').src].join('|'); });
 ck('Shake Shack bib apron SHAAPP054203: POPLAZA03 at B6 0.45 m, All Costings agrees (one per ply, no lay plan), black thread at 70, label tape coded, two uncoded tape ties, no branding, a stock style', r10==='SHAAPP054203||onesize|SHAAP0542|POPLAZA03:B6:0.45|POPLAZA03/0.45/All Costings/1|CMP-THR-EP80-09700-03+CMP-LBL-NYL-25-01+|70|2|APB|8/3|4||nologo|stock|Shake Shack|', r10);
 d=await printOf('SHAAPP054203',80);
 ck('Shake Shack bib print: SHAAP0542, the black thread code, the 4-row chart, the 100 cm ties, no branding band', d.text.includes('SHAAP0542')&&d.text.includes('CMP-THR-EP80-09700-03')&&d.text.includes('21.5 cm (± 0.5)')&&d.text.includes('cut 100 cm')&&/POPLAZA03 B6 0\.45/.test(d.text)&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,300));

 // ── the four templates of 22 Oct 2026: the white mesh skull cap, the white organic cotton bib apron, the ASK printed apron, the red Norfolk ──
 const r11=await p.evaluate(()=>{ const o={};
   ['HTM016001','AP300501','ASKAP056364'].forEach(c=>{ const h=styleForCode(c), s=h&&h.style, u=fabricUsageFor(c); if(!s){ o[c]=null; return; }
     const thr=s.trims.filter(t=>/^Thread$/.test(t[0]))[0];
     o[c]=[s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&[u.code,u.metres,u.source,u.lay].join('/'), s.trims.map(t=>t[3]).join('+'), thr&&thr[2], garmentKind(c,s), s.mfg.length+'/'+s.fin.length, (STYLE_MASTER.charts[s.chart]||[]).length, s.brandType, smIsStockStyle(c)?'stock':'own', s.customer].join('|'); });
   ['OHCJSNORFOLK3407S','OHCJSNORFOLK3607','OHCJSNORFOLK--07S','OHCJSNORFOLK4001'].forEach(c=>{ const h=styleForCode(c); o[c]=h&&[h.style.code,h.size].join('|'); });
   const n=styleForCode('OHCJSNORFOLK3807S').style, un=fabricUsageFor('OHCJSNORFOLK3807S');
   o.norfolk=[n.variant, n.chart, n.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), un&&[un.code,un.metres,un.source].join('/'), n.trims.map(t=>t[3]).join('+'), n.trims[0][2], garmentKind('OHCJSNORFOLK3807S',n), (STYLE_MASTER.charts[n.chart]||[]).length, smIsStockStyle('OHCJSNORFOLK3807S')?'stock':'own'].join('|');
   return o; });
 ck('HTM016001: PC2001ECO at B2 0.12 m and the white mesh 0.04 m, All Costings agrees; white hook velcro, Perma Core thread at 70, tax tab and label tape coded, loop not; a stock hat', r11.HTM016001==='HTM016001||onesize|NEW0160M|PC2001ECO:B2:0.12+MESH2290901:B5:0.04|PC2001ECO/0.12/All Costings/1|CMP-VEL-HOOK-16-01++CMP-THR-PC075-32109-01+TAXTABTIB01+CMP-LBL-NYL-25-01|70||8/2|2||stock|', r11.HTM016001);
 ck('AP300501: CO5001ECO at A3 0.5 m, All Costings agrees; bib apron thread at 70, label tape coded, the white tape ties not; 7-row chart; a stock apron', r11.AP300501==='AP300501||onesize|AP3005B|CO5001ECO:A3:0.5|CO5001ECO/0.5/All Costings/1|CMP-THR-PC075-32109-01+CMP-LBL-NYL-25-01+|70|APB|9/1|7||stock|', r11.AP300501);
 ck('ASKAP056364: PC2064ECO at A5 0.65 m, All Costings agrees; grey thread at 70 and the label tape coded, ties and gilt D rings not; the print is its own branding, so not a stock style', r11.ASKAP056364==='ASKAP056364||onesize|AP0563|PC2064ECO:A5:0.65|PC2064ECO/0.65/All Costings/1|CMP-THR-EP80-09963-64+++CMP-LBL-NYL-25-01|70|APB|9/1|4|Print|own|ASK', r11.ASKAP056364);
 ck('Red Norfolk: the Sage codes with and without the S resolve to OHCJSNORFOLK--07S at their size; the white 40 stays the white jacket', r11.OHCJSNORFOLK3407S==='OHCJSNORFOLK--07S|34'&&r11.OHCJSNORFOLK3607==='OHCJSNORFOLK--07S|36'&&r11['OHCJSNORFOLK--07S']===null&&r11.OHCJSNORFOLK4001==='OHCJSNORFOLK--01|40', r11);
 ck('Red Norfolk: PC2X13307 at B13 1.45 m, All Costings agrees; red thread at the jacket 220, red Jones buttons, OH labels and tax tab coded; the NORFOLK-SS chart; a stock jacket', r11.norfolk==='OH6SSLV|NORFOLK-SS|PC2X13307:B13:1.45|PC2X13307/1.45/All Costings|CMP-THR-EP80-03860-07+CMP-BTN-P3536-36-07+LABELOH5771+TAXTABOH07/01+CMP-OH-LBL-WASH-01++|220|CJ|14|stock', r11.norfolk);
 d=await printOf('HTM016001',50);
 ck('HTM016001 print: both cloths, the variant, the white hook velcro code, the 57 cm chart, no branding band', d.text.includes('MESH2290901')&&d.text.includes('NEW0160M')&&d.text.includes('CMP-VEL-HOOK-16-01')&&d.text.includes('57 cm (TOL ± 1)')&&/PC2001ECO B2 0\.12/.test(d.text)&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,300));
 d=await printOf('AP300501',120);
 ck('AP300501 print: AP3005B, the white thread code, the 7-row chart with the tie length, no branding band', d.text.includes('AP3005B')&&d.text.includes('CMP-THR-PC075-32109-01')&&d.text.includes('Length of waist tie')&&d.text.includes('94 cm (± 1.5)')&&/CO5001ECO A3 0\.5/.test(d.text)&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,300));
 d=await printOf('ASKAP056364',200);
 ck('ASK print: AP0563, the grey thread code, the D rings, the branding band with the print position, the 4-row chart', d.text.includes('AP0563')&&d.text.includes('CMP-THR-EP80-09963-64')&&d.text.includes('gilt D rings')&&d.text.includes('CUSTOMER BRANDING')&&d.text.includes('8.5 cm from the left side')&&d.text.includes('73.5 cm (± 1)')&&/PC2064ECO A5 0\.65/.test(d.text), d.text.slice(0,300));
 d=await printOf('OHCJSNORFOLK3807S',30);
 ck('Red Norfolk print: size 38, OH6SSLV, the red button code, the Norfolk chart row, no branding band', d.text.includes('OH6SSLV')&&d.text.includes('CMP-BTN-P3536-36-07')&&d.text.includes('PC2X13307')&&d.text.includes('101 cm')&&!d.text.includes('CUSTOMER BRANDING'), d.text.slice(0,300));

 // ── the three templates of 26 Oct 2026: the Bettys Cookery School apron, the storm grey short sleeve Cumbria, the CT3082 drawstring trousers ──
 const r12=await p.evaluate(()=>{ const o={};
   const f=c=>{ const h=styleForCode(c), u=fabricUsageFor(c); if(!h) return null; const s=h.style, thr=s.trims.filter(t=>/^thread$/i.test(t[0]))[0];
     return [s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&[u.code,u.metres,u.source].join('/'), s.trims.map(t=>t[3]).join('+'), thr&&thr[2], garmentKind(c,s), (STYLE_MASTER.charts[s.chart]||[]).length, s.brandType, smIsStockStyle(c)?'stock':'own', s.logoImg?s.logoImg.slice(0,14):''].join('|'); };
   ['BEAPPCS300501','OHCJSCUMBRIA38248','OHCJSCUMBRIA62248','OHCJSCUMBRIA4003','CT3082XL03','CT30824603','CT30826003','CT3082ECOXL03','CT3082MM26','CT3082XL03S'].forEach(c=>o[c]=f(c)); return o; });
 ck('BEAPPCS300501: CO5001ECO at A3 0.5 m, All Costings agrees; white thread at the bib apron 70 and the label tape coded, the self fabric ties not; 4-row chart; the Bettys logo is its own branding, so not a stock style', r12.BEAPPCS300501==='BEAPPCS300501||onesize|BETTY\'S|CO5001ECO:A3:0.5|CO5001ECO/0.5/All Costings|CMP-THR-PC075-32109-01+CMP-LBL-NYL-25-01++|70|APB|4|Embroidery|own|data:image/png', r12.BEAPPCS300501);
 ck('Storm grey Cumbria: OHCJSCUMBRIA38248 resolves at size 38; PC2064ECO at A5 1.55 m, All Costings agrees; grey thread at the jacket 220, OH label, wash label and red tax tab coded, studs and black neck tape not; the 34–62 chart; a stock jacket', r12.OHCJSCUMBRIA38248==='OHCJSCUMBRIA--248|38|sized|OH4SSLV|PC2064ECO:A5:1.55|PC2064ECO/1.55/All Costings|CMP-THR-EP80-09963-64++LABELOH5771+CMP-OH-LBL-WASH-01+++TAXTABOH07/01|220|CJ|15||stock|', r12.OHCJSCUMBRIA38248);
 ck('Storm grey Cumbria: the 62 (no All Costings row) falls back to the works order data; the black 40 stays the black jacket', r12.OHCJSCUMBRIA62248&&r12.OHCJSCUMBRIA62248.startsWith('OHCJSCUMBRIA--248|62|')&&r12.OHCJSCUMBRIA62248.includes('PC2064ECO/1.55/works order data')&&r12.OHCJSCUMBRIA4003.startsWith('OHCJSCUMBRIA--03|40|'), [r12.OHCJSCUMBRIA62248,r12.OHCJSCUMBRIA4003]);
 ck('CT3082: XL03 resolves at XL; PC2003ECO at B1 1.6 m, All Costings agrees; black thread at the trousers 150, zip, cord, label tape and Tibard tax tab coded, toggle and elastic not; 14-row chart; a stock trouser', r12.CT3082XL03==='CT3082--03|XL|sized|NEW3082RL|PC2003ECO:B1:1.6|PC2003ECO/1.6/All Costings|CMP-THR-EP80-09700-03+CMP-ZIP-CNC56C-150-03++CMP-CORD-PP6-03++CMP-LBL-NYL-25-01+TAXTABTIB01|150|CT|14||stock|', r12.CT3082XL03);
 ck('CT3082: the waist-size codes 46 and 60 and the ECO alias resolve; the gingham 26 and a special stay unmatched', r12.CT30824603.startsWith('CT3082--03|46|')&&r12.CT30826003.startsWith('CT3082--03|60|')&&r12.CT3082ECOXL03.startsWith('CT3082--03|XL|')&&r12.CT3082MM26===null&&r12.CT3082XL03S===null, [r12.CT30824603,r12.CT30826003,r12.CT3082ECOXL03,r12.CT3082MM26,r12.CT3082XL03S]);
 d=await printOf('BEAPPCS300501',50);
 ck('Bettys print: the BETTY\'S variant, the white thread code, the branding band with the maroon logo and the artwork image, the 4-row chart with the pocket note', d.text.includes("BETTY'S")&&d.text.includes('CMP-THR-PC075-32109-01')&&d.text.includes('CUSTOMER BRANDING')&&d.text.includes('maroon thread')&&d.text.includes('94 cm (± 1.5)')&&d.text.includes('33 cm (13")')&&/CO5001ECO A3 0\.5/.test(d.text)&&d.pngs===1, [d.pngs,d.text.slice(0,300)]);
 d=await printOf('OHCJSCUMBRIA42248',12);
 ck('Storm grey Cumbria print: size 42, OH4SSLV, the grey thread and red tax tab codes, the black neck tape, the 42" chart row, no branding band', d.text.includes('OH4SSLV')&&d.text.includes('CMP-THR-EP80-09963-64')&&d.text.includes('TAXTABOH07/01')&&d.text.includes('Black Oliver Harvey Made in Great Britain tape')&&d.hit.length===1&&d.hit[0].startsWith('42"')&&!d.text.includes('CUSTOMER BRANDING'), [d.hit,d.text.slice(0,300)]);
 d=await printOf('CT3082SS03',20);
 ck('CT3082 SS print: size S with the S row highlighted, NEW3082RL, the zip and cord codes, the elastic cut lengths, the drawstring buttonholes, no branding band', d.size==='S'&&d.hit.length===1&&d.hit[0]==='S'&&d.text.includes('NEW3082RL')&&d.text.includes('CMP-ZIP-CNC56C-150-03')&&d.text.includes('CMP-CORD-PP6-03')&&d.text.includes('S 24" (61 cm)')&&d.text.includes('buttonholes vertical for the drawstring')&&!d.text.includes('CUSTOMER BRANDING'), [d.size,d.hit]);
 d=await printOf('CT30825003',4);
 ck('CT3082 50" print: the 50" row highlighted, the 3XL pattern note and the hips column', d.hit.length===1&&d.hit[0]==='50"'&&d.text.includes('50" (3XL pattern)')&&d.text.includes('Hips 20 cm down from waist'), [d.hit]);

 // ── the Fenwicks grey denim waist apron FENAPP059914DEN (26 Oct 2026, evening) ──
 const r13=await p.evaluate(()=>{ const h=styleForCode('FENAPP059914DEN'), s=h.style, u=fabricUsageFor('FENAPP059914DEN');
   return [s.code, h.size, s.oneSize?'onesize':'sized', s.variant, s.fabrics.map(f=>f[1]+':'+f[2]+':'+f[3]).join('+'), u&&[u.code,u.metres,u.source].join('/'), s.trims.map(t=>t[3]).join('+'), s.trims[0][2], garmentKind('FENAPP059914DEN',s), (STYLE_MASTER.charts[s.chart]||[]).length, s.brandType, smIsStockStyle('FENAPP059914DEN')?'stock':'own', (s.logoImg||'').slice(0,14), (s.placeImg||'').slice(0,14)].join('|'); });
 ck('FENAPP059914DEN: CO5014DEN at C4 0.7 m, All Costings agrees; grey 9971 thread uncoded at the waist apron 30, label tape, eyelets and rings coded, rivets not; 2-row chart; the Fuego logo and pocket sketch are its own branding, so not a stock style', r13==='FENAPP059914DEN||onesize|0599|CO5014DEN:C4:0.7|CO5014DEN/0.7/All Costings|+CMP-LBL-NYL-25-01+CMP-30ED-28-931+CMP-30RD-28-931+|30|APW|2|Embroidery|own|data:image/png|data:image/png', r13);
 d=await printOf('FENAPP059914DEN',30);
 ck('Fenwicks print: variant 0599, the eyelet code, the branding band with the gold logo position, two PNG images, the 2-row chart, no tax tab', d.text.includes('0599')&&d.text.includes('CMP-30ED-28-931')&&d.text.includes('CUSTOMER BRANDING')&&d.text.includes('14 cm from the right side of the pocket')&&d.text.includes('74 cm (± 1)')&&d.pngs===2&&/CO5014DEN C4 0\.7/.test(d.text)&&!d.text.includes('TAXTABOH'), [d.pngs,d.text.slice(0,300)]);

 console.log('errors:', errs.length?errs.join(' | '):'none');
 console.log(fails?('FAILED '+fails):'ALL PASSED');
 await b.close(); process.exit(fails||errs.length?1:0);
})();
