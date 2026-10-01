// Sage renumbers an order's lines when one is deleted. Order 116252 (M/Y
// Eminence, 1 Oct 2026): three Oxford jackets and one logo line for all six,
// raised while placeholder lines sat above them (jackets on lines 8, 9 and
// 5, the logo on 6). The placeholders went, the jackets became lines 3, 4
// and 5, and the logo's shared block [1..5] then missed the two works orders
// still numbered 8 and 9. Now the block is kept by line key as well, and a
// re-paste brings a works order's line number up to date.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const L=(key,seq,code,desc,qty,cat,forLine)=>T([key,'OLIVER HARVEY','0000116252',String(seq),code,desc,String(qty),'2026-10-14','Oliver Harvey Proforma',cat,'Oliver Harvey','EMB: M/Y Eminence','M/Y Eminence',forLine||'']);
const logo='Eminence Filled In Logo - Left Chest as Worn in White';
// before: placeholder free-text lines 2, 3, 4 and 7 (qty 0 notes), jackets on 5, 8 and 9, the logo on 6
const before=[
 L('OH-A',1,'FREETEXT','DELIVERY:- Sam Holloway',1,'REVIEW - FREETEXT placeholder'),
 L('OH-B',2,'','Jackets to follow',0,'NOTE - free text'),
 L('OH-C',3,'','Sizes to be confirmed',0,'NOTE - free text'),
 L('OH-D',4,'','Artwork approved',0,'NOTE - free text'),
 L('OH-P9',5,'OHCJSMOXFORD5003L','BLACK S/S OXFORD DETACH BUTTON POLY/COTTON CHEF JACKET SZ 50" - LONG',2,'WORKS ORDER'),
 L('OH-LOGO',6,'LOGOAPPLICATION',logo,6,'NOTE - charge or logo line','OH-P9'),
 L('OH-ORIG',7,'LOGOORIGINATION','One Off Disc Origination Charge',1,'NOTE - charge or logo line','OH-P9'),
 L('OH-P7',8,'OHCJMOXFORD4803','BLACK L/S OXFORD DETACH BUTTON POLY/COTTON CHEF JACKET SZ 48"',2,'WORKS ORDER'),
 L('OH-P8',9,'OHCJMOXFORD4203','BLACK L/S OXFORD DETACH BUTTON POLY/COTTON CHEF JACKET SZ 42"',2,'WORKS ORDER'),
].join('\n');
// after: the placeholders deleted, Sage renumbered
const after=[
 L('OH-A',1,'FREETEXT','DELIVERY:- Sam Holloway',1,'REVIEW - FREETEXT placeholder'),
 L('OH-P7',3,'OHCJMOXFORD4803','BLACK L/S OXFORD DETACH BUTTON POLY/COTTON CHEF JACKET SZ 48"',2,'WORKS ORDER'),
 L('OH-P8',4,'OHCJMOXFORD4203','BLACK L/S OXFORD DETACH BUTTON POLY/COTTON CHEF JACKET SZ 42"',2,'WORKS ORDER'),
 L('OH-P9',5,'OHCJSMOXFORD5003L','BLACK S/S OXFORD DETACH BUTTON POLY/COTTON CHEF JACKET SZ 50" - LONG',2,'WORKS ORDER'),
 L('OH-LOGO',6,'LOGOAPPLICATION',logo,6,'NOTE - charge or logo line','OH-P9'),
 L('OH-ORIG',7,'LOGOORIGINATION','One Off Disc Origination Charge',1,'NOTE - charge or logo line','OH-P9'),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-10-01T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });
 const logos=()=>p.evaluate(()=>WOs.filter(w=>w.sm).map(w=>w.sm.lineKey+'@'+w.sm.seq+':'+smLogoFor(w.sm,w.items[0].code).filter(n=>n.kind==='logo').length).sort().join(' '));
 // 1. raised under the old numbering: the logo's block above it holds only the 50" jacket, so it is that jacket's own
 const r1=await p.evaluate(t=>{ smShowTab('special'); document.getElementById('smTA').value=t; smLoadPaste(); smTickAll(true); smCreateAllShown(); return WOs.filter(w=>w.sm).length; }, before);
 const l1=await logos();
 // 2. the placeholders deleted, the sheet pasted again: the block now covers all three jackets, by key, and the two works orders follow their new line numbers
 const r2=await p.evaluate(t=>{ document.getElementById('smTA').value=t; smLoadPaste(); const n=smNotes['OH|0000116252'].find(n=>n.kind==='logo'); return {shared:!!n.shared, covers:n.covers, keys:(n.coverKeys||[]).slice().sort().join(',')}; }, after);
 const l2=await logos();
 // 3. a works order whose line number is still stale (saved before this fix) finds its logo by key all the same
 const l3=await p.evaluate(()=>{ const w=WOs.find(w=>w.sm&&w.sm.lineKey==='OH-P7'); w.sm.seq=9; return smLogoFor(w.sm,w.items[0].code).filter(n=>n.kind==='logo').length; });
 // 4. notes kept before the keys were recorded still work by line number
 const l4=await p.evaluate(()=>{ const n=smNotes['OH|0000116252'].find(n=>n.kind==='logo'); delete n.coverKeys; const w9=WOs.find(w=>w.sm&&w.sm.lineKey==='OH-P7'), w5=WOs.find(w=>w.sm&&w.sm.lineKey==='OH-P9'); return [smLogoFor(w9.sm,w9.items[0].code).filter(n=>n.kind==='logo').length, smLogoFor(w5.sm,w5.items[0].code).filter(n=>n.kind==='logo').length].join('/'); });
 console.log('raised', r1, '| before ->', l1); console.log('after  ->', JSON.stringify(r2), '|', l2); console.log('stale seq ->', l3, '| old notes ->', l4);
 const pass = r1===4 && l1==='OH-A@1:0 OH-P7@8:0 OH-P8@9:0 OH-P9@5:1'
   && r2.shared && JSON.stringify(r2.covers)==='[1,5]' && r2.keys==='OH-A,OH-P7,OH-P8,OH-P9' && l2==='OH-A@1:0 OH-P7@3:1 OH-P8@4:1 OH-P9@5:1'
   && l3===1 && l4==='0/1';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
