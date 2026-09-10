// Sales-order logo lines on stock-style works orders. Three orders:
//   OH 114816: a 60" Suffolk (stock style, unstocked size) with a LOGO line under it,
//              then a customer-owned style with a TEXT line under it, a handling charge,
//              and a free-text line - only the Suffolk gets its logo
//   TIB 862833: a size-60 CICJ0193 black (same family as the buffer's SS/LL) with a
//              TEXT line under it, and a free-text line typed ABOVE the first garment
//   TIB 862900: a code in no family at all with a logo line - nothing attaches
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=[
 T(['CICJ0193SS03','BLACK S/S P/COTTON STUD FASTEN CHEFS JACKET SZ SMALL','40','120','0','30','90','160','300']),
 T(['CICJ0193LL03','BLACK S/S P/COTTON STUD FASTEN CHEFS JACKET SZ LARGE','40','120','0','30','90','160','300']),
 T(['APP300503','BLACK P/COTTON BIB APRON WITH POCKET','42','254','0','250','751','1291','1479']),
].join('\n');
const L=(key,co,so,seq,code,desc,qty,cat)=>T([key,co,so,String(seq),code,desc,String(qty),'2026-09-25','MALDON SALT',cat,co==='TIBARD'?'Tibard':'Oliver Harvey','PO 100','Maldon Salt']);
const paste=(logoDesc)=>[
 L('OH-1','OLIVER HARVEY','0000114816',1,'OHCJSSUFFOLK6001','WHITE S/S SUFFOLK CHEF JACKET SZ 60"',4,'WORKS ORDER'),
 L('OH-2','OLIVER HARVEY','0000114816',2,'LOGOAPPLICATION',logoDesc,4,'NOTE - charge or logo line'),
 L('OH-3','OLIVER HARVEY','0000114816',3,'OHZZBESPOKE01','MALDON BESPOKE APRON',6,'WORKS ORDER'),
 L('OH-4','OLIVER HARVEY','0000114816',4,'TEXTAPPLICATION','Name "J SMITH" right chest, white',6,'NOTE - charge or logo line'),
 L('OH-5','OLIVER HARVEY','0000114816',5,'HANDLINGCHARGE','Handling',1,'NOTE - charge or logo line'),
 L('OH-6','OLIVER HARVEY','0000114816',6,'','Approved artwork 26.8.26',0,'NOTE - free text'),
 L('TIB-1','TIBARD','0000862833',1,'','Rush - needed for opening night',0,'NOTE - free text'),
 L('TIB-2','TIBARD','0000862833',2,'CICJ01936003','BLACK S/S P/COTTON STUD FASTEN CHEFS JACKET SZ 60',2,'WORKS ORDER'),
 L('TIB-3','TIBARD','0000862833',3,'TEXTAPPLICATION','Initials "AB" left sleeve, gold',2,'NOTE - charge or logo line'),
 L('TIB-9','TIBARD','0000862900',1,'ZZNOFAMILY4801','SOMETHING BESPOKE',3,'WORKS ORDER'),
 L('TIB-10','TIBARD','0000862900',2,'LOGOAPPLICATION','Bespoke logo',3,'NOTE - charge or logo line'),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-10T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); }, buf);
 // stock-style test on its own, against the real works order data and this buffer
 const st=await p.evaluate(()=>['OHCJSSUFFOLK6001','OHCJSSUFFOLK4001','OHAPP0534GD','CICJ01936003','CICJ0193XS03','CICJ0193SS01','APP300503','ZZNOFAMILY4801','OHZZBESPOKE01'].map(c=>c+':'+(smIsStockStyle(c)?1:0)).join(' '));
 console.log('stock styles ->', st);
 const r1=await p.evaluate(t=>{ smShowTab('special'); document.getElementById('smTA').value=t; smLoadPaste(); return document.getElementById('smResult').textContent.replace(/\s+/g,' ').trim(); }, paste('Maldon Salt logo left chest, 60mm, white'));
 console.log('paste        ->', r1);
 const notes=await p.evaluate(()=>Object.keys(smNotes).sort().map(k=>k+' => '+smNotes[k].map(n=>n.kind+'@'+n.forKey).join(',')).join(' | '));
 console.log('notes kept   ->', notes);
 // raise every line, then read the logo each works order gets
 const raised=await p.evaluate(()=>{ smTickAll(true); smCreateAllShown();
   return WOs.filter(w=>w.sm).map(w=>w.ref+' '+w.items[0].code+' -> ['+smLogoFor(w.sm,w.items[0].code).map(n=>smNoteLabel(n)+': '+n.desc).join(' / ')+']').join('\n   '); });
 console.log('raised       ->\n  ', raised);
 // where it shows: the live list, the buffer card, the panel meta, and the print under Embroidery
 const shown=await p.evaluate(()=>{ smRender();
   const live=[...document.querySelectorAll('#smList .sm-note')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
   smShowTab('buffer'); renderWOCards();
   const cards=[...document.querySelectorAll('.woc-logo')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
   const i=WOs.findIndex(w=>w.sm&&w.items[0].code==='OHCJSSUFFOLK6001'); openWOModal(i);
   const panel=(document.getElementById('woModal').textContent.match(/Logo application[^|]*/)||[''])[0].trim();
   let html=''; window.open=()=>({document:{open(){},write(h){html+=h;},close(){}}});
   const ok=printWOP(WOs[i].ref,'OHCJSSUFFOLK6001',4,WOs[i].due,WOs[i].sm);
   const emb=(html.match(/<th>Embroidery<\/th><td>(.*?)<\/td><\/tr>(.*?)<tr><th>Customer/s)||['','',''])
   let html2=''; const j=WOs.findIndex(w=>w.sm&&w.items[0].code==='CICJ01936003');
   const ok2=printWOP(WOs[j].ref,'CICJ01936003',2,WOs[j].due,WOs[j].sm);   // no works order data for a Tibard code
   return {live, cards, panel, ok, emb:emb[1].replace(/<[^>]+>/g,''), rows:emb[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(), band:/CUSTOMER BRANDING &amp; LOGO/.test(html), ok2}; });
 console.log('shown        ->', JSON.stringify(Object.assign({}, shown, {panel:shown.panel.slice(0,70)})));
 // a later paste with a changed logo reaches the live works order; the state survives a reload; a viewer sees the same
 const r2=await p.evaluate(t=>{ smShowTab('special'); document.getElementById('smTA').value=t; smLoadPaste(); const w=WOs.find(w=>w.sm&&w.items[0].code==='OHCJSSUFFOLK6001'); return smLogoFor(w.sm,w.items[0].code)[0].desc; }, paste('Maldon Salt logo CENTRE BACK, 120mm, navy'));
 const ls=await p.evaluate(()=>JSON.parse(localStorage.getItem('tibard_production')).smNotes['OH|0000114816'][0].desc);
 console.log('re-paste     ->', r2, '| in localStorage:', ls);
 await p.reload(); await p.waitForTimeout(400);
 const kept=await p.evaluate(()=>{ const w=WOs.find(w=>w.sm&&w.items[0].code==='OHCJSSUFFOLK6001'); return smLogoFor(w.sm,w.items[0].code).map(n=>n.desc).join('|'); });
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')); await p.waitForTimeout(400);
 const viewer=await p.evaluate(()=>{ loadState(); smShowTab('special'); return [...document.querySelectorAll('#smList .sm-note')].length; });
 console.log('reload/viewer->', kept, '|', viewer);

 const pass = st==='OHCJSSUFFOLK6001:1 OHCJSSUFFOLK4001:1 OHAPP0534GD:1 CICJ01936003:1 CICJ0193XS03:1 CICJ0193SS01:0 APP300503:1 ZZNOFAMILY4801:0 OHZZBESPOKE01:0'
   && /4 lines ready/.test(r1) && /6 logo\/text lines kept/.test(r1)
   && notes==='OH|0000114816 => logo@OH-1,text@OH-3,note@OH-3 | TIB|0000862833 => note@TIB-2,text@TIB-2 | TIB|0000862900 => logo@TIB-9'
   && /OHCJSSUFFOLK6001 -> \[Logo application: Maldon Salt logo left chest, 60mm, white\]/.test(raised)
   && /OHZZBESPOKE01 -> \[\]/.test(raised) && /ZZNOFAMILY4801 -> \[\]/.test(raised)
   && /CICJ01936003 -> \[Note: Rush - needed for opening night \/ Text application: Initials "AB" left sleeve, gold\]/.test(raised)
   && shown.live.length===3 && shown.cards.length===3 && /^Logo application Maldon Salt logo left chest/.test(shown.panel)
   && shown.ok && /Yes &mdash; from the sales order/.test(shown.emb) && /Logo application &times; 4 Maldon Salt logo left chest, 60mm, white/.test(shown.rows) && !shown.band && !shown.ok2
   && r2==='Maldon Salt logo CENTRE BACK, 120mm, navy' && kept===r2 && viewer===3;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
