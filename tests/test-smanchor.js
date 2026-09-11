// The cases the review found: a logo line whose garment the sheet does not
// show, a garment despatched between pastes, a filtered paste, a double paste,
// a free-text note on its own, the ECO / XXS / length-letter families, and a
// re-paste reaching the card without any other click.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=[
 T(['CICJ0193SS03','BLACK S/S CHEFS JACKET SZ SMALL','40','120','0','30','90','160','300']),
 T(['CICJ0193ECOXL01','WHITE ECO S/S CHEFS JACKET SZ XL','40','120','0','30','90','160','300']),
 T(['CICJM01935201','WHITE L/S CHEFS JACKET SZ 52','40','120','0','30','90','160','300']),
 T(['OHAPP0651248','NAVY APRON','40','120','0','30','90','160','300']),
].join('\n');
const L=(key,so,seq,code,desc,qty,cat)=>T([key,'OLIVER HARVEY',so,String(seq),code,desc,String(qty),'2026-09-25','MALDON SALT',cat,'Oliver Harvey','PO 1','Maldon Salt']);
const NOTE='NOTE - charge or logo line';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-11T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); smShowTab('special'); }, buf);
 const paste=t=>p.evaluate(t=>{ document.getElementById('smTA').value=t; smLoadPaste(); return document.getElementById('smResult').textContent.replace(/\s+/g,' ').trim(); }, t);
 const anchors=so=>p.evaluate(so=>(smNotes['OH|'+so]||[]).map(n=>n.key+'>'+(n.forKey||'-')+(n.orphan?'!':'')).join(','), so);

 // 1. old sheet: the stock jacket at seq 1 is missing, its logo at seq 2 is on the sheet, the special make is seq 3 with its own logo at seq 4
 const r1=await paste([L('A-2','0000200001',2,'LOGOAPPLICATION','Stock jacket logo',20,NOTE), L('A-3','0000200001',3,'OHCJSSUFFOLK6001','SUFFOLK 60',4,'WORKS ORDER'), L('A-4','0000200001',4,'LOGOAPPLICATION','Special logo',4,NOTE),
   L('A-6','0000200001',6,'TEXTAPPLICATION','Text after another missing garment',2,NOTE)].join('\n'));
 const a1=await anchors('0000200001');
 console.log('gap        ->', a1, '|', r1);
 // 2. new sheet: the stock-held line is present, so the logo goes to it (and never shows) and the stock-held line is not offered
 const r2=await paste([L('B-1','0000200002',1,'OHCJSSUFFOLK4001','SUFFOLK 40 (stocked)',10,'STOCK HELD'), L('B-2','0000200002',2,'LOGOAPPLICATION','Stock jacket logo',10,NOTE), L('B-3','0000200002',3,'OHCJSSUFFOLK6001','SUFFOLK 60',4,'WORKS ORDER'), L('B-4','0000200002',4,'LOGOAPPLICATION','Special logo',4,NOTE)].join('\n'));
 const a2=await anchors('0000200002');
 const pend=await p.evaluate(()=>smPending.map(o=>o.key).sort().join(','));
 console.log('complete   ->', a2, '| pending:', pend, '|', r2);
 // 3. despatched between pastes: raise both, then paste without garment C-1 - its logo stays with it
 await paste([L('C-1','0000200003',1,'OHCJSSUFFOLK6001','SUFFOLK 60',4,'WORKS ORDER'), L('C-2','0000200003',2,'LOGOAPPLICATION','Logo for C-1',4,NOTE), L('C-3','0000200003',3,'OHCJSUFFOLK5601','SUFFOLK LS 56',2,'WORKS ORDER'), L('C-4','0000200003',4,'TEXTAPPLICATION','Text for C-3',2,NOTE)].join('\n'));
 await p.evaluate(()=>{ smTickAll(true); smCreateAllShown(); });
 const before=await p.evaluate(()=>WOs.filter(w=>w.sm&&w.sm.so==='0000200003').map(w=>w.sm.lineKey+':'+smLogoFor(w.sm,w.items[0].code).map(n=>n.desc).join('/')).join(' | '));
 await paste([L('C-2','0000200003',2,'LOGOAPPLICATION','Logo for C-1',4,NOTE), L('C-3','0000200003',3,'OHCJSUFFOLK5601','SUFFOLK LS 56',2,'WORKS ORDER'), L('C-4','0000200003',4,'TEXTAPPLICATION','Text for C-3',2,NOTE)].join('\n'));
 const after=await p.evaluate(()=>WOs.filter(w=>w.sm&&w.sm.so==='0000200003').map(w=>w.sm.lineKey+':'+smLogoFor(w.sm,w.items[0].code).map(n=>n.desc).join('/')).join(' | '));
 console.log('despatched ->', before, ' => ', after);
 // 4. a filtered paste (garments only, not one note row) leaves the kept lines alone; a double paste does not duplicate
 await paste([L('C-3','0000200003',3,'OHCJSUFFOLK5601','SUFFOLK LS 56',2,'WORKS ORDER')].join('\n'));
 const filtered=await anchors('0000200003');
 const dbl=[L('D-1','0000200004',1,'OHCJSSUFFOLK6001','SUFFOLK 60',4,'WORKS ORDER'), L('D-2','0000200004',2,'LOGOAPPLICATION','Logo D',4,NOTE)].join('\n');
 await paste(dbl+'\n'+dbl);
 const dup=await anchors('0000200004');
 console.log('filtered   ->', filtered, '| double paste ->', dup);
 // 5. a free-text note on its own is printed as a note but is not embroidery
 await paste([L('E-1','0000200005',1,'OHCJSSUFFOLK6001','SUFFOLK 60',4,'WORKS ORDER'), L('E-2','0000200005',2,'','Rush - opening night',0,'NOTE - free text')].join('\n'));
 const pr=await p.evaluate(()=>{ smTickAll(true); smCreateAllShown(); const w=WOs.find(w=>w.sm&&w.sm.so==='0000200005');
   let html=''; window.open=()=>({document:{open(){},write(h){html+=h;},close(){}}}); printWOP(w.ref,w.items[0].code,4,w.due,w.sm);
   return {emb:(html.match(/<th>Embroidery<\/th><td>(.*?)<\/td>/)||['',''])[1], note:/<th>Note<\/th><td colspan="3"[^>]*>Rush - opening night/.test(html)}; });
 console.log('note only  ->', JSON.stringify(pr));
 // 6. families: ECO range, XXS, a length letter, an unsized apron code, an OH length variant with no template of its own
 const fam=await p.evaluate(()=>['CICJ0193ECO6001','CICJM0193XXS01','CICJ01936003S','CICJ0193XXXXL03','OHAPP0651248','OHAPP0651212','OHCJMDORSET6401L','OHCJSCUMBRIA6403L'].map(c=>c+':'+(smIsStockStyle(c)?1:0)).join(' ')
   +' | '+['OHAPP0651248','CICJ0193ECOXL01','CICJ01936003S'].map(c=>c+'='+smStyleFamily(c)).join(' '));
 console.log('families   ->', fam);
 // 7. a re-paste with a changed logo reaches the buffer-tab card with no other click
 await p.evaluate(()=>{ smShowTab('buffer'); });
 const c1=await p.evaluate(()=>[...document.querySelectorAll('.woc-logo')].map(e=>e.textContent).filter(t=>/Logo D/.test(t)).length);
 await p.evaluate(()=>{ smShowTab('special'); });
 await paste([L('D-1','0000200004',1,'OHCJSSUFFOLK6001','SUFFOLK 60',4,'WORKS ORDER'), L('D-2','0000200004',2,'LOGOAPPLICATION','Logo D CHANGED',4,NOTE)].join('\n'));
 const c2=await p.evaluate(()=>{ smShowTab('buffer'); return [...document.querySelectorAll('.woc-logo')].map(e=>e.textContent).filter(t=>/Logo D CHANGED/.test(t)).length; });
 console.log('card       ->', 'D raised? '+(await p.evaluate(()=>WOs.some(w=>w.sm&&w.sm.so==='0000200004'))), c1, '=>', c2);

 // 8. the current sheet: column N names the garment, worked out from the whole order - a note under a stock-held
 //    garment the sheet does not show is anchored to it (and never prints), the special make's own note is exact,
 //    and the sequence-gap guess is switched off
 const LN=(key,so,seq,code,desc,qty,cat,forLine)=>L(key,so,seq,code,desc,qty,cat)+'\t'+forLine;
 const r8=await paste([LN('F-2','0000200008',2,'LOGOAPPLICATION','Stock jacket logo',20,NOTE,'F-1'), LN('F-4','0000200008',4,'OHCJSSUFFOLK6001','SUFFOLK 60',4,'WORKS ORDER',''), LN('F-5','0000200008',5,'LOGOAPPLICATION','Special logo',4,NOTE,'F-4'), LN('F-7','0000200008',7,'TEXTAPPLICATION','Text after a bought-in line',2,NOTE,'F-6')].join('\n'));
 const a8=await anchors('0000200008');
 console.log('column N   ->', a8, '|', r8);

 const pass = a8==='F-2>F-1,F-5>F-4,F-7>F-6' && /1 logo\/text line kept/.test(r8) && !/not attached/.test(r8)
   && a1==='A-2>-!,A-4>A-3,A-6>-!' && /2 logo\/text lines sit under a garment the sheet does not show/.test(r1)
   && a2==='B-2>B-1,B-4>B-3' && !/B-1/.test(pend) && /B-3/.test(pend)
   && before==='C-1:Logo for C-1 | C-3:Text for C-3' && after==='C-1:Logo for C-1 | C-3:Text for C-3'
   && filtered==='C-2>C-1,C-4>C-3' && dup==='D-2>D-1'
   && pr.emb==='No' && pr.note===true
   && fam==='CICJ0193ECO6001:1 CICJM0193XXS01:1 CICJ01936003S:1 CICJ0193XXXXL03:1 OHAPP0651248:1 OHAPP0651212:0 OHCJMDORSET6401L:1 OHCJSCUMBRIA6403L:1 | OHAPP0651248=null CICJ0193ECOXL01=CICJ0193ECO--01 CICJ01936003S=CICJ0193--03'
   && c2===1;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
