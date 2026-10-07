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
//     (OHRSAPP300503PC) and the other Rick Stein records, the Oxford trims by
//     colour, the 0544 aprons' fabric codes, the 0597 denim apron, the
//     Carmel Valley Ranch biscuit apron OHAPP061268 with its logo images
//   - thread standards: garment kind from the record and code, the main
//     thread row at 220 / 150 / 70 / 30, blanks filled on print, records from
//     the costing app brought to the standard on load unless threadOwn
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
     navy:(()=>{ const s=styleForCode('OHCJSMOXFORD4215').style; return s.name+'|'+s.fabrics.map(f=>f[1]).join('+')+'|'+s.trims.filter(t=>/^(Thread|Buttons)$/.test(t[0])).map(t=>t[3]).join('|'); })(),
     oxWhite:styleForCode('OHCJSMOXFORD4201').style.trims.map(t=>t[3]).join('|'),
     oxPrint:(()=>{ cap=''; printWOP('WO-T','OHCJMOXFORD4401L',5,null,null); const m=cap.match(/band">TRIMS[\s\S]*?<\/table>/); return m?m[0].replace(/<[^>]+>/g,'|').replace(/\|+/g,'|'):'none'; })(),
     rs0601:(()=>{ const s=styleForCode('OHRSAPP060107').style; return [s.customer,s.fabrics[0][1],s.fabrics[0][3],s.brandType].join('|'); })(),
     indigo:u('OHAPP0597F224DEN'),
     cnm:(()=>{ const s=styleForCode('OHAPP053403/07CT').style; cap=''; printWOP('S-OH116383-Pt1','OHAPP053403/07CT',24,null,null);
       return [s.variant, s.fabrics.map(f=>f[1]+'/'+f[3]).join('+'), u('OHAPP053403/07CT'), /CNM Natural Chef logo, larger 20 cm/.test(cap)?'brand':'-', /<th>Width \(skirt\)<\/th>/.test(cap)?'chart':'-', smIsStockStyle('OHAPP053403/07CT')?'stock':'own'].join('|'); })(),
     cjm:(()=>{ const h=styleForCode('CICJM0193XXS01'); const s=h.style; cap=''; printWOP('S-TIB871541-Pt1','CICJM0193XXS01',7,null,null);
       return [s.code, h.size, s.variant, s.fabrics.map(f=>f[1]+'/'+f[3]).join('+'), u('CICJM0193XXS01'), styleForCode('CICJM01935803').style.code, styleForCode('CICJM01935803').style.fabrics.map(f=>f[1]).join('+'), /0193SSMESH/.test(cap)?'lectra':'-', /XXL/.test(cap)?'chart':'-', smPrintable('CICJM0193XXS01')?'printable':'-'].join('|'); })(),
     olive:(()=>{ const s=styleForCode('OHAPP300583').style; return [s.trims.length, s.trims.map(t=>t[3]).filter(Boolean).join('+'), s.mfg.length, u('OHAPP300583'), s.fabrics[0][1]].join('|'); })(),
     app3005pc:(()=>{ const s=styleForCode('OHAPP300503PC').style, rs=styleForCode('OHRSAPP300503PC').style; return [s.code, /Centre pocket/.test(s.desc)?'pocket':'nopocket', s.logoImg?'logo':'nologo', s.customer||'-', s.mfg.length===rs.mfg.length&&s.trims.length===rs.trims.length?'same make':'differs', styleForCode('OHAP300503PC').style.desc.slice(0,21)].join('|'); })(),
     beap:(()=>{ const s=styleForCode('BEAP300601').style; return [s.code, s.oneSize?'onesize':'sized', s.trims.length, s.trims.map(t=>t[3]).filter(Boolean).join('+'), s.mfg.length, s.fin.length, u('BEAP300601'), s.customer, s.brandType, s.logoImg&&s.logoImg.slice(0,15), s.placeImg?'place':'noplace', (STYLE_MASTER.charts[s.chart]||[]).length, /no centre divide/.test(s.desc)?'nodivide':'?'].join('|'); })(),
     gir:(()=>{ const s=styleForCode('GIRHT016003').style; return [s.code, s.embOnly?'embonly':'made', s.fabrics.length, s.trims.map(t=>t[3]).join('+'), s.mfg.length, s.customer, s.brandType, s.logoImg&&s.logoImg.slice(0,15)].join('|'); })(),
     cbht:(()=>{ const s=styleForCode('CBHT016064PG').style; return [s.code, s.oneSize?'onesize':'sized', s.trims.length, s.trims.map(t=>t[3]).filter(Boolean).join('+'), s.mfg.length, s.fin.length, u('CBHT016064PG'), s.customer, s.placeImg?'place':'noplace', (STYLE_MASTER.charts[s.chart]||[]).length, /No Tibard tax tab/.test(s.desc)?'notab':'?'].join('|'); })(),
     gbk:(()=>{ const s=styleForCode('GBKAPP064464').style; return [s.code, s.oneSize?'onesize':'sized', s.trims.length, s.trims.map(t=>t[3]).filter(Boolean).join('+'), s.mfg.length, s.fin.length, u('GBKAPP064464'), s.customer, s.brandType||'nobrand', s.logoImg||s.placeImg?'img':'noimg', (STYLE_MASTER.charts[s.chart]||[]).length, /centre stitch divide/.test(s.desc)?'divide':'?'].join('|'); })(),
     ego:(()=>{ const h=styleForCode('OHEGOAPP065003'), s=h.style; return [s.code, s.oneSize?'onesize':'sized', s.trims.length, s.trims.map(t=>t[3]).filter(Boolean).join('+'), s.mfg.length, s.fin.length, u('OHEGOAPP065003'), s.customer, s.brandType, /14.5 cm from the finished left side seam/.test(s.brandPlace)?'place':'noplace', s.logoImg&&s.logoImg.slice(0,15), (STYLE_MASTER.charts[s.chart]||[]).length, /2 x hip pocket/.test(s.desc)?'pockets':'nopockets'].join('|'); })(),
     ap:(()=>{ const h=styleForCode('AP352801'); cap=''; printWOP('WO-1403','AP352801',30,null,null); return [h.style.code, h.size, u('AP352801'), /Finished width/.test(cap)?'chart':'-', smPrintable('AP352801')?'printable':'-'].join('|'); })(),
     wag:(()=>{ const h=styleForCode('WAGCJM0193XS01'), h2=styleForCode('WAGCJM01935201S'); cap=''; printWOP('WO-1419','WAGCJM0193XS01',12,null,null);
       return [h.style.code, h.size, h2.style.code+'/'+h2.size, h.style.fabrics.map(f=>f[1]+'/'+f[3]).join('+'), u('WAGCJM0193XS01'), /Wagamama logo on left breast/.test(cap)?'brand':'-', /89.5 cm/.test(cap)?'chart':'-', smIsStockStyle('WAGCJM0193XS01')?'stock':'own', /Set pen pocket|Edgestitch pen pocket/.test(h.style.mfg.join(' '))?'pocket':'no pocket'].join('|'); })(),
     brown:(()=>{ const s=styleForCode('OHAPP300582').style; cap=''; printWOP('S-TIB871626-Pt1','OHAPP300582',55,null,null); return [s.fabrics[0][1], u('OHAPP300582'), s.trims.length, /BROWN 08975/.test(cap)?'thread':'-', /25cm wide by 20.5cm deep/.test(cap)?'chart':'-'].join('|'); })(),
     rs515:(()=>{ const s=styleForCode('OHAP300515C').style; cap=''; printWOP('WO-T','OHAP300515C',10,null,null); return [s.customer.split(' (')[0], s.fabrics[0][1], s.fabrics[0][3], u('OHAP300515C'), s.trims.map(t=>t[3]).filter(Boolean).length, /Cookery School logo \(the fish\)/.test(cap)?'brand':'-', /customer artwork/.test(cap)&&s.logoImg.length>20000?'artwork':'-', smIsStockStyle('OHAP300515C')?'stock':'own'].join('|'); })(),
     navy3005:(()=>{ const c=['OHAP300515','OHAP300515S','OHAP300515TN','OHAPP300515'].map(c=>{ const s=styleForCode(c).style; return s.trims.length+'/'+s.trims.map(t=>t[3]).filter(Boolean).length+'/'+(s.mfg.some(x=>/^(SALES|ORDER NUMBER|DATE ISSUED)/.test(x))?'raw':'clean'); }); return c.join('|')+'|'+u('OHAP300515')+'|'+u('OHAP300515TN'); })(),
     rebuilt:(()=>{ const raw=STYLE_MASTER.styles.filter(s=>s.mfg&&/^(SALES\/RENTAL|ORDER NUMBER)$/.test(s.mfg[0])).length; const lc=styleForCode('OHAP3005241/222CTLC').style; const st=styleForCode('OHAP300531').style; return [raw, lc.fabrics.map(f=>f[1]).join('+'), u('OHAP3005241/222CTLC'), lc.trims.filter(t=>t[3]).length, u('OHAP300501'), st.markerMain||'none', styleForCode('OHUB066203').style.trims.length].join('|'); })(),
     cjmls:(()=>{ const h=styleForCode('CJM0193SS01'); cap=''; printWOP('WO-1073','CJM0193SS01',10,null,null); return [h.style.code, h.size, h.style.variant, h.style.fabrics.map(f=>f[1]+'/'+f[3]).join('+'), u('CJM0193SS01'), styleForCode('CJM01935203').style.fabrics.map(f=>f[1]).join('+'), /0193LSMESH/.test(cap)?'lectra':'-', /Set pen pocket hem/.test(h.style.mfg.join(' '))?'pocket':'-'].join('|'); })(),
     bettys:(()=>{ const s=styleForCode('BEAPP047801C').style; cap=''; printWOP('WO-T','BEAPP047801C',20,null,null); return [s.customer.split(' (')[0], s.fabrics[0][1], u('BEAPP047801C'), /Bettys logo on the bib/.test(cap)?'brand':'-', /customer artwork/.test(cap)&&s.logoImg.length>10000?'artwork':'-', /Width at top of bib/.test(cap)?'chart':'-', smIsStockStyle('BEAPP047801C')?'stock':'own'].join('|'); })(),
     star:(()=>{ const s=styleForCode('APP063103PCS').style; cap=''; printWOP('S-TIB870807-Pt1','APP063103PCS',6,null,null); return [s.customer.split(' (')[0], s.variant, u('APP063103PCS'), /0631WPFT01/.test(cap)?'marker':'-', /star logo \(4,700 stitches\)/.test(cap)?'brand':'-', /customer artwork/.test(cap)&&s.logoImg.length>10000?'artwork':'-', /placement photo|placement/.test(cap)&&s.placeImg.length>10000?'place':'-', smIsStockStyle('APP063103PCS')?'stock':'own'].join('|'); })(),
     cvrKnee:(()=>{ const s=styleForCode('OHAPP061268').style; return /bottom left corner of the apron as worn, in line with the knee/.test(s.brandPlace)&&!/pre-make-up/.test(s.brandPlace+s.desc+s.mfg.join(' '))?'ok':'-'; })(),
     gd:(()=>{ const s=styleForCode('OHAPP0596GD').style; return [s.fabrics[0][1], s.fabrics[0][3], u('OHAPP0596GD')].join('|'); })(),
     gg:(()=>{ const s=styleForCode('OHAPP0534110/222CTS').style; cap=''; printWOP('S-OH116448-Pt1','OHAPP0534110/222CTS',12,null,null);
       return [s.variant, s.fabrics.map(f=>f[1]+'/'+f[3]).join('+'), s.trims.map(t=>t[3]).join(','), u('OHAPP0534110/222CTS'), (cap.match(/<th>Width \(skirt\)<\/th>/)?'chart':'-'), (cap.match(/Contrast marker<\/th><td[^>]*>AP0534CON/)?'con':'-'), /NO TAX TAB/.test(cap)?'notab':'-'].join('|'); })(),
     thread:(()=>{ const k=c=>{ const h=styleForCode(c); return garmentKind(c, h&&h.style)+':'+(threadStd(c, h&&h.style)||'-'); };
       const wt=c=>{ const h=styleForCode(c); const r=woTrims(h.style).filter(isThreadRow); return r.map(x=>x[2]).join('+'); };
       // records as the costing app sends them: a jacket at 200, a second-colour jacket, one that keeps its own figure, an apron with no figure
       styleEdits['ZZCJTEST3801']={code:'ZZCJTEST3801',name:'Chef jacket — Stock',trims:[['','THREAD — COATS EPIC 80\'S NAVY 07935 — cost per metre',200,'CMP-THR-EP80-07935-15',0.000714]]};
       styleEdits['ZZCJTWO4001']={code:'ZZCJTWO4001',name:'Chef jacket — Stock',trims:[['','THREAD — COATS EPIC 80\'S BLACK 09700 — cost per metre',180,'CMP-THR-EP80-09700-03',0.000714],['','THREAD — COATS EPIC 80\'S NAVY 07935 — second colour',20,'CMP-THR-EP80-07935-15',0.000714]]};
       styleEdits['ZZCJOWN4001']={code:'ZZCJOWN4001',name:'Chef jacket — Stock',threadOwn:true,trims:[['','THREAD — COATS EPIC 80\'S BLACK 09700 — cost per metre',300,'CMP-THR-EP80-09700-03',0.000714]]};
       styleEdits['ZZAPTEST03']={code:'ZZAPTEST03',name:'Black bib apron',trims:[['Thread','Coats epic 80 black','','',null]]};
       const n=threadApplyStdAll();
       return [k('OHCJSMOXFORD4201'),k('OHLCJHAMPSHIRE1601'),k('CT0001'),k('OHAPP061268'),k('OHAP352803PC'),k('OHAPP0631153DS'),k('OHSTRAP03WAIST'),k('OHHTM016001'),
         wt('OHCJSMOXFORD4201'),wt('OHAPP059703/153DEN'),wt('OHAPP061268'),wt('OHAP352803PC'),
         n, styleEdits['ZZCJTEST3801'].trims[0][2], styleEdits['ZZCJTWO4001'].trims.map(x=>x[2]).join('+'), styleEdits['ZZCJOWN4001'].trims[0][2], styleEdits['ZZAPTEST03'].trims[0][2], wt('ZZAPTEST03')].join('|'); })(),
     cvr:(()=>{ const s=styleForCode('OHAPP061268').style; cap=''; printWOP('S-OH116297-Pt1','OHAPP061268',24,null,null);
       return [s.customer, s.fabrics[0][1]+'/'+s.fabrics[0][3], s.brandType, s.trims.map(t=>t[3]).join(','), s.cutBatch, /<img src="data:image\/jpeg;base64,[^"]+" alt="customer artwork"/.test(cap)?'logo':'-', /alt="logo placement photo"/.test(cap)?'sketch':'-', /bottom left corner of the apron as worn, in line with the knee/.test(cap)?'place':'-', (cap.match(/<th>Thread<\/th><td>([^<]*)/)||[])[1]||''].join('|'); })(),
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
   && r.usage.fm==='CO5003DEN/0.635/marker 0597FM002/CO5153:0.1667' && r.usage.same==='CO5224DEN/0.72/marker 0597SAME/' && r.usage.fsame==='CO5224DEN/0.72/marker 0597FSAME/'
   && r.usage.navy==='PC2015ECO/1.31/marker OXFORD042/MESHPW31415:0.04'
   && r.usage.sage==='CO5173ECO/1/All Costings/' && r.usage.slate==='CO5241ECO/1/All Costings/'
   && r.usage.rs==='PC2003ECO/0.805/marker 300501/' && r.usage.strat==='PC14001/1.18/marker OH7006/'
   && r.styles==='OHCJSMOXFORD--15:38 OHCJSMOXFORD--15:42 OHCJSMOXFORD--15:56 OHCJSMOXFORD--01:42 OHRSAPP300503PC:null OHAPP059703/153DEN:null'
   && /^Oxford chef jacket — short sleeve, navy\|PC2015ECO\+MESHPW31415\|CMP-THR-EP80-07935-15\|OHDETACHABLEBUTTON03$/.test(r.navy)
   && r.oxWhite==='CMP-THR-PC075-32109-01|OHDETACHABLEBUTTON01|CMP-OH-PIP-TIB009B-01|TAXTABOH07/01|LABELOH5771|CMP-OH-LBL-WASH-01|CMP-LBL-NYL-25-01|PKG-OH-GPS-500X750-01|PKG-TAPE-MSK-25x50-01|OHSWINGTAG|'
   && /\|Buttons\|WHITE DETACHABLE CHEF JACKET BUTTON — 12 per jacket, £0\.636 per 12\|OHDETACHABLEBUTTON01\|1\|/.test(r.oxPrint) && !/BUTTON — WHITE DETACHABLE/.test(r.oxPrint)
   && r.rs0601==='Seafood Trading Ltd (Rick Stein)|CO5007|1|Embroidery' && r.indigo==='CO5224DEN/0.72/marker 0597FSAME/'
   && r.thread==='CJ:220|CJ:220|CT:150|APB:70|APW:30|APW:30|:-|:-|220|70+|70|30|3|220|220+20|300|70|70'
   && r.gg==='CNM|CO5364ECO/0.62+CO5222ECO/0.17|,,LABELOH5771,CMP-OH-LBL-WASH-01,,CMP-DCF-DCW40-40-931,OHBRASSBUTTON,|CO5364ECO/0.5475/marker AP0534380/CO5222ECO:0.17|chart|con|notab'
   && r.cnm==='CNM|CO5003ECO/0.5+CO5007/0.15|CO5003ECO/0.5475/marker AP0534380/CO5007:0.15|brand|chart|own'
   && r.olive==='6|CMP-THR-EP80-05742-83+LABELOH5771+TAXTABOH07/01+CMP-OH-LBL-WASH-01+CMP-OH-NTT-25-03|12|PC2083ECO/1/All Costings/|PC2083ECO'
   && r.app3005pc==='OHAPP300503PC|pocket|nologo|-|same make|BIB APRON · No pocket'
   && r.beap==='BEAP300601|onesize|3|CMP-THR-PC075-32109-01|7|2|CO5001ECO/1/All Costings/|Bettys (Betty\'s Tea Room)|Embroidery|data:image/jpeg|place|4|nodivide'
   && r.gir==='GIRHT016003|embonly|0|HT016003|3|Giraffe (Boparan Group)|Embroidery|data:image/jpeg'
   && r.cbht==='CBHT016064PG|onesize|4|CMP-VEL-HOOK-16-03+CMP-LBL-NYL-25-01|7|2|PC2064ECO/0.12/works order data/|Bella Italia / Big Table (Ciao Bella)|place|2|notab'
   && r.gbk==='GBKAPP064464|onesize|3|CMP-LBL-NYL-25-01|7|1|PC2064ECO/0.5/All Costings/|GBK|nobrand|noimg|3|divide'
   && r.ego==='OHEGOAPP065003|onesize|6|CMP-THR-EP80-09700-03+LABELOH5771+CMP-OH-LBL-WASH-01+TAXTABOH07/01+CMP-STD-CAP-050-929+CMP-STD-SOC-050-929|13|2|CO5003ECO/0.8/All Costings/|Ego Restaurants|Embroidery|place|data:image/jpeg|5|pockets'
   && r.ap==='AP352801||CO5001ECO/0.5/All Costings/|chart|printable'
   && r.wag==='WAGCJM0193--01|XS|WAGCJM0193--01/52|PC2001ECO/1.35+MESHPW31401/0.35|PC2001ECO/1.35/All Costings/MESHPW31401:0.35|brand|chart|own|no pocket'
   && r.brown==='PC2082ECO|PC2082ECO/1/All Costings/|6|thread|chart'
   && r.rs515==="Rick Stein's Cookery School|CO5015ECO|1|CO5015ECO/1/All Costings/|4|brand|artwork|own"
   && r.navy3005==='5/4/clean|5/3/clean|4/4/clean|6/5/clean|PC2015ECO/0.805/marker 300501/|PC2015ECO/1.1/works order data/'
   && r.rebuilt==='0|CO5241ECO+CO5222ECO+LEATHERHIDE|CO5241ECO/1/All Costings/CO5222ECO:0.1+LEATHERHIDE:0.021|3|PC2001ECO/0.805/marker 300501/|none|6'
   && r.cjmls==='CJM0193--01|SS|0193LSMESH|PC2001ECO/1.25+MESHPW31401/0.25|PC2001ECO/1.25/All Costings/MESHPW31401:0.25|PC2003ECO+MESH2290903|lectra|pocket'
   && r.bettys==='Bettys|CO5001ECO|CO5001ECO/0.8/All Costings/|brand|artwork|chart|own'
   && r.star==='BRG Star Ltd|0631WPFT|PC2003ECO/0.45/marker 0631WPFT01/|marker|brand|artwork|place|own'
   && r.cvrKnee==='ok'
   && r.cjm==='CICJM0193--01|XXS|0193SSMESH|PC2001ECO/1.05+MESHPW31401/0.25|PC2001ECO/1.05/All Costings/MESHPW31401:0.25|CICJM0193--03|PC2003ECO+MESH2290903|lectra|chart|printable'
   && r.gd==='CO5014DEN|0.72|CO5014DEN/0.715/marker 0596003/'
   && r.cvr==="Carmel Valley Ranch|PC9068/0.83|Embroidery|CMP-THR-EP80-08569-68,LABELOH5771,CMP-OH-LBL-WASH-01,,LEATHERHIDE,CMP-DR32-N254-287,CMP-STD-PST-9B-287,CMP-STD-SOC-9B-287,CMP-30ED-28-931,CMP-30RD-28-931,PKG-OH-GPS-500X750-01|70|logo|sketch|place|THREAD — COATS EPIC 80&#39;S BISCUIT 08569 — cost per metre"
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
