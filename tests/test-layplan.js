// The cutting room's lay plans (LAY_PLAN, built from the two "Lay Plan -
// Varients" sheets) on the works order print and in the usage lookup, plus
// the works order data Luke asked for alongside them:
//   - a code is found exactly, an apron by its pattern (OHAPP0534__ covers
//     every colour, __ running to two or three characters)
//   - the default marker's length / lay is the usage; mesh and contrast
//     markers ride along as extras
//   - the print shows variant, default marker(s), the lay plan for the
//     quantity (two-up plies plus a single for the remainder), mesh,
//     interlining and blockout fronts - Stratford's with the face-up wording
//   - a works order with its own marker keeps it and only gains the extras,
//     and that marker (length / lay) is its usage - the 0597FM variant the
//     sheet lists without a product code is only known this way
//   - navy short-sleeve Oxford (OHCJSMOXFORD--15), the Rick Stein apron
//     (OHRSAPP300503PC), the 0544 aprons' fabric codes, the 0597 denim apron
const { chromium } = require('playwright');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto(URL); await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{
   const u=c=>{ const x=fabricUsageFor(c); return x ? x.code+'/'+x.metres+'/'+x.source+'/'+(x.extras||[]).map(e=>e.code+':'+e.metres).join('+') : 'none'; };
   const st=c=>{ const h=styleForCode(c); return h ? h.style.code+':'+h.size : 'none'; };
   let cap='';
   window.open=function(){ return {document:{open(){},write:h=>{cap+=h;},close(){}}, focus(){}, print(){}, close(){}}; };
   const lectra=(c,q)=>{ cap=''; printWOP('WO-T',c,q,null,null); const m=cap.match(/LECTRA PATTERN<\/div><table>([\s\S]*?)<\/table>/); return m ? m[1].replace(/<[^>]+>/g,'|').replace(/\|+/g,'|').replace(/&mdash;|\u2014/g,'-') : 'none'; };
   const brand=c=>{ cap=''; printWOP('WO-T',c,5,null,null); const m=cap.match(/band">CUSTOMER BRANDING[\s\S]*?<\/table>/); return m ? m[0].replace(/<[^>]+>/g,'|').replace(/\|+/g,'|') : 'none'; };
   return {
     find:[layPlanFor('OHCJMSTRATFORD4001')?'exact':'-', layPlanFor('OHAPP0534241')===LAY_PLAN['OHAPP0534__']?'pattern':'-', layPlanFor('OHAPP059703/153DEN')===LAY_PLAN['OHAPP0597__/__DEN']?'3char':'-', layPlanFor('OHAPP9999')?'-':'none'],
     usage:{apron:u('OHAPP0534241'), denim:u('OHAPP059703/153DEN'), fm:u('OHAPP0597F03/153DEN'), same:u('OHAPP0597224DEN'), fsame:u('OHAPP0597F224DEN'), navy:u('OHCJSMOXFORD4215'), sage:u('OHAPP0544173'), slate:u('OHAPP0544241'), rs:u('OHRSAPP300503PC'), strat:u('OHCJMSTRATFORD4001')},
     styles:['OHCJSMOXFORD3815','OHCJSMOXFORD4215','OHCJSMOXFORD5615','OHCJSMOXFORD4201','OHRSAPP300503PC','OHAPP059703/153DEN'].map(st).join(' '),
     navy:(()=>{ const s=styleForCode('OHCJSMOXFORD4215').style; return s.name+'|'+s.fabrics.map(f=>f[1]).join('+')+'|'+s.trims.filter(t=>/^(Thread|Buttons)$/.test(t[0])).map(t=>t[1]).join('|'); })(),
     f0544:['OHAPP054401C','OHAPP054403','OHAPP054415','OHAPP0544173','OHAPP0544241','OHAPP054483'].map(c=>{ const f=styleForCode(c).style.fabrics[0]; return f[1]+':'+f[3]; }).join(' '),
     denim:(()=>{ const s=styleForCode('OHAPP059703/153DEN').style; return [s.variant,s.markerMain,s.markerLen,s.layQty,s.markerCon,s.conLen,s.conLay,s.fabrics[0][3],s.fabrics[1][3]].join('/'); })(),
     stratford:lectra('OHCJMSTRATFORD4001',10),
     hampshire:lectra('OHLCJHAMPSHIRE1601',11),
     denimPrint:lectra('OHAPP059703/153DEN',10),
     rsBrand:brand('OHRSAPP300503PC'),
     navyPrint:lectra('OHCJSMOXFORD4215',3)
   };
 });
 console.log(JSON.stringify(r,null,1));
 const pass = r.find.join()==='exact,pattern,3char,none'
   && r.usage.apron==='CO5241ECO/0.5475/lay plan AP0534001/'
   && r.usage.denim==='CO5003DEN/0.6425/marker 0597001/CO5153:0.1667'
   && r.usage.fm==='CO5003DEN/0.635/marker 0597FM002/CO5153:0.1667' && r.usage.same==='CO5224DEN/0.72/marker 0597SAME/' && r.usage.fsame==='/0.72/marker 0597FSAME/'
   && r.usage.navy==='PC2015ECO/1.31/marker OXFORD042/MESHPW31415:0.0333'
   && r.usage.sage==='CO5173ECO/1/All Costings/' && r.usage.slate==='CO5241ECO/1/All Costings/'
   && r.usage.rs==='PC2003ECO/1/All Costings/' && r.usage.strat==='PC14001/1.18/marker OH7006/'
   && r.styles==='OHCJSMOXFORD--15:38 OHCJSMOXFORD--15:42 OHCJSMOXFORD--15:56 OHCJSMOXFORD--01:42 OHRSAPP300503PC:null OHAPP059703/153DEN:null'
   && /^Oxford chef jacket — short sleeve, navy\|PC2015ECO\+MESHPW31415\|Navy Epic 80's from Coats \(07935\)\|Black squashed detachable/.test(r.navy)
   && r.f0544==='CO5001ECO:1 CO5003ECO:1 CO5015ECO:1 CO5173ECO:1 CO5241ECO:1 CO5083ECO:1'
   && r.denim==='0597/0597001/2.57/4/0597A/1/6/0.6425/0.1667'
   && /Variant \(cutting room\)\|OH7LSLV\|/.test(r.stratford) && /Marker number \(default\)\|OH7006\| - 2\.36 m, 2 per lay \(1\.18 m per garment\)/.test(r.stratford)
   && /Lay plan \(qty 10\)\|5 plies of 2\.36 m \(OH7006\) - total 11\.80 m/.test(r.stratford)
   && /Blockout fronts\|OH740RF, OH740LF\| - \|Blocks - Face Up, left block is bigger than the right/.test(r.stratford)
   && /Lay plan \(qty 11\)\|5 plies of 2\.38 m \(OH8065\) \+ 1 ply of 1\.31 m \(OH8055\) - total 13\.21 m/.test(r.hampshire)
   && /Marker number \(mesh\)\|OH8100A - 0\.45 m, 16\.5 per lay \(0\.027 m per garment\)/.test(r.hampshire)
   && /Interlining marker\|OH8A - 0\.47 m, lay \(6\/2\),\(8\/2\)/.test(r.hampshire) && /Blockout fronts\|OH8RFRT16, OH8LFRT16\|/.test(r.hampshire) && !/left block is bigger/.test(r.hampshire)
   && /Variant \(cutting room\)\|0597\|Marker number\|0597001\|Marker length\|2\.57 m\|Lay qty\|4 garments per lay\|Lay plan \(qty 10\)\|3 plies of 2\.57 m - total 7\.71 m\|Contrast marker\|0597A - 1 m, 6 per lay \(0\.167 m per garment\)\|$/.test(r.denimPrint)
   && (r.denimPrint.match(/Contrast marker/g)||[]).length===1 && !/Marker number \(default\)/.test(r.denimPrint)
   && /Type\|Embroidery\|Placement \/ spec\|Rick Stein logo — top right-hand corner of the bib as worn, embroidered in white/.test(r.rsBrand)
   && /Marker number \(default\)\|OXFORD042\| - 1\.31 m, 1 per lay \(1\.31 m per garment\) · 158cm\|/.test(r.navyPrint) && /Marker number \(mesh\)\|OXFORD100A - 0\.5 m, 15 per lay/.test(r.navyPrint) && /Other marker\|OXFORD103 - 1\.5 m.*NARROW MARKERS/.test(r.navyPrint) && /Lay plan note\|Navy Oxford/.test(r.navyPrint);
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
