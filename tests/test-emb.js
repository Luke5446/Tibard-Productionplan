// Order 116105 (29 Sep 2026), the shape the EMB manager described: names go
// directly under each product line, one line per name; the logos every
// jacket carries go once, at the top of the order (anchored to a line the
// sheet does not show) and again at the bottom (under the last jacket by
// line order), with the batch quantity. A second block of eleven other
// garments the sheet does not show has its own three shared lines.
//   - the shared lines cover every jacket in their block, not just the last
//   - the second block's lines do not reach the jackets
//   - OHCJSMOXFORD4815L is a costing-app record (brand type None) and is a
//     stock style for logo purposes: its works order prints Embroidery Yes
//     with the six shared logos and its own names
//   - a shared logo prints as "each garment", never with the batch quantity
//     (30 on the line is thirty jackets, not thirty logos each); the PM can
//     take one off a works order and put it back, and the print follows
//   - the Embroidery tab shows nothing until searched, then the words to
//     embroider (names, text lines) as selectable text with the logos in
//     small type underneath, found by works order, sales order, code,
//     customer, a name or a word on a line; completed ones from the last 30
//     days on request; the viewer has the tab and the search box too
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const NOTE='NOTE - charge or logo line';
const L=(key,seq,code,desc,qty,cat,forLine)=>T([key,'OLIVER HARVEY','0000116105',String(seq),code,desc,String(qty),'2026-10-09','Essential Cuisine Ltd',cat,cat==='WORKS ORDER'?'Oliver Harvey':'','EMB: Essential - Solina - Rich','Essential Cuisine Ltd',forLine||'']);
const sheet=[
 L('OH-10',10,'LOGOAPPLICATION','Solina Logo - Left Chest as Worn in Orange',31,NOTE,'OH-70'),
 L('OH-11',11,'LOGOAPPLICATION','Essential Cuisine Blue Logo - Right Sleeve as Worn (1st)',31,NOTE,'OH-70'),
 L('OH-12',12,'LOGOAPPLICATION','Rich Sauces BLue Logo - Right Sleeve as Worn (2nd)',31,NOTE,'OH-70'),
 L('OH-13',13,'LOGOAPPLICATION','Zafron Foods Logo - Right Sleeve as Worn (3rd)',31,NOTE,'OH-70'),
 L('OH-15',15,'OHCJSMOXFORD3815','NAVY S/S OXFORD CHEF JACKET SZ 38"',1,'WORKS ORDER'),
 L('OH-16',16,'LOGOAPPLICATION','1 - 38" - Jess Nghiem-Sharp - Underneath Logo in White - Block New Font - Left Chest',1,NOTE,'OH-15'),
 L('OH-17',17,'OHCJSMOXFORD4215','NAVY S/S OXFORD CHEF JACKET SZ 42"',4,'WORKS ORDER'),
 L('OH-18',18,'LOGOAPPLICATION','2 - 42" - Rees Smith - Underneath Logo in White - Block New Font - Left Chest',2,NOTE,'OH-17'),
 L('OH-19',19,'LOGOAPPLICATION','2 - 42" - Gareth Byron - Underneath Logo in White - Block New Font - Left Chest',2,NOTE,'OH-17'),
 L('OH-25',25,'OHCJSMOXFORD4815L','NAVY S/S OXFORD CHEF JACKET SZ 48" - LONG',7,'WORKS ORDER'),
 L('OH-26',26,'LOGOAPPLICATION','3 - 48" - Rob Hamilton - Underneath Logo in White - Block New Font - Left Chest',3,NOTE,'OH-25'),
 L('OH-27',27,'LOGOAPPLICATION','4 - 48" - Andy Beattie - Underneath Logo in White - Block New Font - Left Chest',4,NOTE,'OH-25'),
 L('OH-39',39,'OHCJSMOXFORD5615','NAVY S/S OXFORD CHEF JACKET SZ 56"',19,'WORKS ORDER'),
 L('OH-40',40,'LOGOAPPLICATION','19 - 56" - Various - Underneath Logo in White',19,NOTE,'OH-39'),
 L('OH-42',42,'LOGOAPPLICATION','Essential Cuisine Logo - Left Chest as Worn in White',30,NOTE,'OH-39'),
 L('OH-43',43,'LOGOAPPLICATION','Solina Logo - Right Sleeve as Worn in Orange',30,NOTE,'OH-39'),
 L('OH-46',46,'LOGOAPPLICATION','1 - 38" - Jess Ngiem-Sharp',1,NOTE,'OH-45'),
 L('OH-48',48,'LOGOAPPLICATION','2 - 42" - Matthew Tracey',2,NOTE,'OH-47'),
 L('OH-60',60,'LOGOAPPLICATION','Rich Sauces Logo - Left Chest as Worn in Blue',11,NOTE,'OH-59'),
 L('OH-61',61,'LOGOAPPLICATION','Names - Underneath in the Same Blue - Block New Font Style',11,NOTE,'OH-59'),
 L('OH-62',62,'LOGOAPPLICATION','Solina Logo - Right Sleeve as Worn in Orange',11,NOTE,'OH-59'),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-29T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; window.__clip=[]; navigator.clipboard.writeText=t=>{ window.__clip.push(t); return Promise.resolve(); };
   // the navy long-length Oxford as the costing app sent it: its own record, brand type None
   styleEdits['OHCJSMOXFORD4815L']={code:'OHCJSMOXFORD4815L',name:'Chef jacket — Stock',desc:'Oxford chef jacket — short sleeve, Navy, long length',lectra:'OH5 LONG',variant:'LNGOH5SSLV',chart:'',fabrics:[['NAVY','PC2015ECO','B4',1.53,2.32]],trims:[['Thread','THREAD — COATS EPIC 80\'S NAVY 07935',220,'CMP-THR-EP80-07935-15',0.000714]],mfg:[],fin:[],machMins:32,finMins:6,cutBatch:25,cutMins:20,oneSize:true,markerMain:'OH5255',markerLen:1.53,layQty:1,customer:'Stock',brandType:'None',brandPlace:'',logoImg:''};
   smShowTab('special'); });
 const r1=await p.evaluate(t=>{ document.getElementById('smTA').value=t; smLoadPaste(); return document.getElementById('smResult').textContent.replace(/\s+/g,' ').trim(); }, sheet);
 const n=await p.evaluate(()=>(smNotes['OH|0000116105']||[]).map(x=>x.key+(x.shared?'*['+x.covers.join('-')+']':'>'+(x.forKey||'-'))).join(' '));
 const made=await p.evaluate(()=>{ ['OH-15','OH-17','OH-25','OH-39'].forEach(k=>smCreate(k)); return WOs.filter(w=>w.sm).map(w=>w.ref+':'+w.items[0].code+':'+w.sm.seq).join(' '); });
 const logos=await p.evaluate(()=>{ const f=r=>{ const w=WOs.find(x=>x.ref===r); return smLogoFor(w.sm, w.items[0].code).map(x=>(x.qty||'')+'|'+x.desc.slice(0,22)).join(' ; '); }; return {p1:f('S-OH116105-Pt1'), p3:f('S-OH116105-Pt3'), p4:f('S-OH116105-Pt4'), stock:smIsStockStyle('OHCJSMOXFORD4815L')}; });
 // the printed works order for the 48" long: Embroidery Yes, the six shared logos and its two names
 const pr=await p.evaluate(()=>{ let cap=''; window.open=function(){ return {document:{open(){},write:h=>{cap+=h;},close(){}}, focus(){}, print(){}, close(){}}; };
   const w=WOs.find(x=>x.ref==='S-OH116105-Pt3'); printWOP(w.ref, w.items[0].code, w.items[0].qty, w.due, w.sm);
   const emb=(cap.match(/<th>Embroidery<\/th><td>(?:<strong>)?([^<]*)/)||[])[1]||''; const lines=[...cap.matchAll(/<th>Logo application(?: &middot; ([^<]*))?<\/th><td[^>]*>([^<]*)/g)].map(m=>(m[1]||'')+'|'+m[2].slice(0,22));
   // the white-jacket logo is not for the navy 48": the PM takes it off this works order, the card shows it struck through, the print leaves it out; then puts it back
   smLogoToggle('S-OH116105-Pt3','OH-42'); const card=(document.querySelector('#woCards')||document.body).innerHTML;
   cap=''; printWOP(w.ref, w.items[0].code, w.items[0].qty, w.due, w.sm); const after=[...cap.matchAll(/<th>Logo application(?: &middot; ([^<]*))?<\/th><td[^>]*>([^<]*)/g)].length;
   const off=/line-through[^>]*>[^<]*<strong>Logo application · each garment<\/strong> Essential Cuisine Logo - Left Chest/.test(card) && /put back/.test(card);
   smLogoToggle('S-OH116105-Pt3','OH-42'); cap=''; printWOP(w.ref, w.items[0].code, w.items[0].qty, w.due, w.sm); const back=[...cap.matchAll(/<th>Logo application/g)].length;
   return {emb:emb, lines:lines, after:after, off:off, back:back, kept:WOs.find(x=>x.ref==='S-OH116105-Pt3').sm.logoOff.length}; });
 // the Embroidery tab: everything, then found by works order, sales order, code, customer and logo wording; copy one line and copy all
 const tab=await p.evaluate(()=>{ smShowTab('emb'); const rows=()=>[...document.querySelectorAll('#embBody .emb-tbl tbody tr')].map(tr=>tr.querySelector('strong').textContent);   // the words table, under the embroidery queue
   // the badge counts picked embroidery-only works orders not yet on a machine, not the works orders with words: none here
   const out={empty:rows().length===0 && /Search for a works order/.test(document.getElementById('embBody').textContent), badge:document.getElementById('embTabCount').style.display, shown:!document.getElementById('embView').classList.contains('hidden')};
   const q=s=>{ const i=document.getElementById('embQ'); i.value=s; i.dispatchEvent(new Event('input')); return rows().join(','); };
   const all='S-OH116105-Pt1,S-OH116105-Pt2,S-OH116105-Pt3,S-OH116105-Pt4';
   out.byRef=q('pt3'); out.bySo=q('116105')===all; out.byCode=q('OHCJSMOXFORD4815L'); out.byCust=q('essential cuisine')===all; out.byLogo=q('zafron')===all; out.byName=q('rob hamilton'); out.none=q('nothing here');
   q('4815L'); const tr=document.querySelector('#embBody .emb-tbl tbody tr');
   out.words=[...tr.querySelectorAll('.emb-txt')].map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,30)); out.logos=(tr.querySelector('.emb-logos')||{}).textContent||''; out.buttons=tr.querySelectorAll('button').length;
   // a completed works order drops off, and comes back with the tick for 30 days
   completeWholeWO(WOs.findIndex(w=>w.ref==='S-OH116105-Pt1')); out.afterDone=q('116105'); embDone=true; embRender(); out.withDone=q('116105'); embDone=false; embRender();
   return out; });
 // the viewer sees the tab too
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')); await p.waitForTimeout(400);
 const v=await p.evaluate(()=>{ smShowTab('emb'); return {tab:!!document.getElementById('tabEmb'), rows:document.querySelectorAll('#embBody tbody tr').length, inputs:document.querySelectorAll('#embBody input[type=text]').length}; });
 console.log('paste   ->', r1); console.log('notes   ->', n); console.log('made    ->', made);
 console.log('logos   ->', JSON.stringify(logos)); console.log('print   ->', JSON.stringify(pr));
 console.log('tab     ->', JSON.stringify(tab)); console.log('viewer  ->', JSON.stringify(v));
 const shared6='31|Solina Logo - Left Che ; 31|Essential Cuisine Blue ; 31|Rich Sauces BLue Logo  ; 31|Zafron Foods Logo - Ri ; 30|Essential Cuisine Logo ; 30|Solina Logo - Right Sl';
 const pass = /4 lines ready/.test(r1)
   && n==='OH-10*[14-41] OH-11*[14-41] OH-12*[14-41] OH-13*[14-41] OH-16>OH-15 OH-18>OH-17 OH-19>OH-17 OH-26>OH-25 OH-27>OH-25 OH-40>OH-39 OH-42*[14-41] OH-43*[14-41] OH-46>OH-45 OH-48>OH-47 OH-60>OH-59 OH-61>OH-59 OH-62>OH-59'
   && made==='S-OH116105-Pt1:OHCJSMOXFORD3815:15 S-OH116105-Pt2:OHCJSMOXFORD4215:17 S-OH116105-Pt3:OHCJSMOXFORD4815L:25 S-OH116105-Pt4:OHCJSMOXFORD5615:39'
   && logos.stock===true && logos.p1===shared6+' ; 1|1 - 38" - Jess Nghiem-' && logos.p3===shared6+' ; 3|3 - 48" - Rob Hamilton ; 4|4 - 48" - Andy Beattie' && logos.p4===shared6+' ; 19|19 - 56" - Various - U'
   && /^Yes/.test(pr.emb) && pr.lines.length===8 && pr.lines[0]==='each garment|Solina Logo - Left Che' && pr.lines[6]==='3 \u00d7|3 - 48&quot; - Rob Ham'
   && pr.after===7 && pr.off && pr.back===8 && pr.kept===0
   && tab.shown && tab.badge==='none' && tab.empty
   && tab.byRef==='S-OH116105-Pt3' && tab.bySo && tab.byCode==='S-OH116105-Pt3' && tab.byCust && tab.byLogo && tab.byName==='S-OH116105-Pt3' && tab.none===''
   && tab.words.join('|')==='3 × 3 - 48" - Rob Hamilton - U|4 × 4 - 48" - Andy Beattie - U' && /^Logos: Solina Logo - Left Chest as Worn in Orange · Essential Cuisine Blue/.test(tab.logos) && tab.buttons===0
   && tab.afterDone==='S-OH116105-Pt2,S-OH116105-Pt3,S-OH116105-Pt4' && tab.withDone==='S-OH116105-Pt1,S-OH116105-Pt2,S-OH116105-Pt3,S-OH116105-Pt4'
   && v.tab && v.inputs===1;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
