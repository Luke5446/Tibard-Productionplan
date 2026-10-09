// The new buffer sheet and the sales orders behind On SOP (Luke, 9 Oct 2026):
// a 28-column Buffer paste read by the same first nine columns, with column N
// marking a Clockwork code - shown in the table with a CW tag, no WOP REC,
// left out of the SKU count and % Good; the SOPDemand lines pasted into the
// same box; who covers each order worked out stock first, oldest promised
// date first, then the works orders in the order raised (demand 15, 10 in
// stock, a works order for 20: the oldest order's 10 come from stock, the
// works order is for the next one, and every order is listed); on the card,
// the panel, the print and the On SOP hover; surviving a reload; a later
// paste moving a date.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
// 28 columns: A code B name C stock D sop E pop F-I sales J cat K mfr L acct M supplier N clockwork O lead P min ... AB company
function row(code,name,stock,sop,pop,cw){ return T([code,name,stock,sop,pop,'30','90','182','360','Chef Jackets','Tibard',cw?'CLO003':'','',cw?'Y':'N','14','0',stock,'0','0','0',sop,'0','0','2026-09-30','','','N','TIBARD']); }
const buf=[
 row('OHCJSMCHESHIRE0101','WHITE JACKET',10,15,0,false),       // 10 in stock, 15 on order
 row('AP0002','CLOCKWORK APRON',0,500,0,true),     // oversold, but Clockwork's
 row('HT0003','HEALTHY HAT',400,0,0,false),
].join('\n');
// A key B company C order D code E qty F promised G ordered H customer I their ref J account K intercompany L line
const dem=[
 T(['TIB-101','TIBARD','116400','OHCJSMCHESHIRE0101','5','2026-10-28','2026-10-01','Knoops','PO 77','KNO001','N','2']),
 T(['TIB-100','TIBARD','116383','OHCJSMCHESHIRE0101','10','2026-10-21','2026-09-28','Mollies Motels','','MOL001','N','1']),
 T(['OH-7','OLIVER HARVEY','OH4455','OHCJSMCHESHIRE0101','8','2026-11-05','2026-10-05','Rick Stein','','RIC001','N','1']),
 T(['TIB-200','TIBARD','116390','AP0002','500','2026-10-30','2026-09-29','Big Table','','BIG001','N','1']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const url='file://'+require('path').join(__dirname,'..','index.html');
 await p.goto(url+'?edit'); await p.waitForTimeout(400);
 const prep=()=>p.evaluate(()=>{ window.now=()=>new Date('2026-10-09T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; window.open=()=>({document:{open(){},write(h){ window._printed=h; },close(){}},focus(){},print(){},close(){}}); });
 await prep();
 // both sheets in the one box, demand first
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); }, dem+'\n'+buf);
 const s1=await p.evaluate(()=>{ const r=c=>rows.find(x=>x.code===c);
   return { n:rows.length, demand:sopDemand.lines.length, cw:r('AP0002').clockwork, cwRec:r('AP0002').wopRec, cjRec:r('OHCJSMCHESHIRE0101').wopRec, cwStatus:r('AP0002').status,
     sku:document.getElementById('skuCount').textContent.replace(/\s+/g,' ').trim(),
     tag:!!document.querySelector('#row-'+sid('AP0002')+' .sm-tag'), tagCJ:!!document.querySelector('#row-'+sid('OHCJSMCHESHIRE0101')+' .sm-tag'),
     crit:[...document.querySelectorAll('#statsBar .stat')].map(t=>t.textContent.replace(/\s+/g,' ')).find(t=>/Critical/.test(t)),
     sopTitle:document.querySelector('#row-'+sid('OHCJSMCHESHIRE0101')+' td:nth-child(6) span').title.split('\n'),
     // the status filter never lists a Clockwork code; the tick box takes it off the table; Clear filters puts it back
     shown:[...document.querySelectorAll('#tBody tr')].map(tr=>tr.dataset.code).join(','),
     critList:(function(){ document.getElementById('sfilt').value='critical'; renderTable(); var c=[...document.querySelectorAll('#tBody tr')].map(tr=>tr.dataset.code).join(','); document.getElementById('sfilt').value=''; return c; })(),
     hidden:(function(){ document.getElementById('hideCW').checked=true; renderTable(); var c=[...document.querySelectorAll('#tBody tr')].map(tr=>tr.dataset.code).join(','); clearFilt(); return c+'|'+document.getElementById('hideCW').checked+'|'+document.querySelectorAll('#tBody tr').length; })(),
     snap:bufSnaps[bufSnaps.length-1] }; });
 // a works order for 20 of OHCJSMCHESHIRE0101: the oldest order's 10 come from the 10 in stock, this one is for the 5 and the 8
 await p.evaluate(()=>{ toggleIncl('OHCJSMCHESHIRE0101',true); setWop('OHCJSMCHESHIRE0101','20'); showCreateWO(); document.getElementById('createStart').value='2026-10-09'; document.getElementById('createDue').value='2026-10-20'; doCreateWOs(); });
 const s2=await p.evaluate(()=>{ const wo=WOs.find(w=>w.items[0].code==='OHCJSMCHESHIRE0101'); const it=wo.items[0];
   openWOModal(WOs.indexOf(wo));
   const out={ ref:wo.ref, covers:it.sop.covers.map(c=>c.so+':'+c.qty).join(','), all:it.sop.all.map(a=>a.so+'='+a.by.map(b=>b.who+':'+b.qty).join('+')).join(' '),
     card:(document.querySelector('.woc div[title]')||{}).textContent, modal:[...document.querySelectorAll('#woModalMeta li')].map(li=>li.style.fontWeight+'|'+li.textContent) };
   closeWOModal(); printWOPTracked(WOs.indexOf(wo),'OHCJSMCHESHIRE0101',20,true); out.print=(window._printed||'').match(/<th>Sales orders<\/th><td[^>]*>([\s\S]*?)<\/td>/); out.print=out.print?out.print[1]:null; return out; });
 // a second works order for 10: nothing is left for it to cover, and it says so
 await p.evaluate(()=>{ toggleIncl('OHCJSMCHESHIRE0101',true); setWop('OHCJSMCHESHIRE0101','10'); showCreateWO(); document.getElementById('createStart').value='2026-10-09'; document.getElementById('createDue').value='2026-10-27'; doCreateWOs(); });
 const s3=await p.evaluate(()=>WOs.filter(w=>w.items[0].code==='OHCJSMCHESHIRE0101').map(w=>w.ref+'='+w.items[0].sop.covers.map(c=>c.so+':'+c.qty).join(',')).join(' '));
 // reload: the demand and the allocation are still there; publish carries the lines
 await p.reload(); await p.waitForTimeout(400); await prep();
 const s4=await p.evaluate(()=>({ demand:sopDemand.lines.length, covers:WOs.filter(w=>w.items[0].code==='OHCJSMCHESHIRE0101').map(w=>w.ref+'='+w.items[0].sop.covers.map(c=>c.so+':'+c.qty).join(',')).join(' '), pub:JSON.parse(publishState()).sopDemand.lines.length, cw:rows.find(r=>r.code==='AP0002').clockwork }));
 // the next paste: the Mollies order despatched (gone), Knoops moved to 4 Nov - the first works order now covers Knoops (from stock, none left) ... stock 10 covers Knoops 5 and 5 of Rick Stein
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); }, [
   T(['TIB-101','TIBARD','116400','OHCJSMCHESHIRE0101','5','2026-11-04','2026-10-01','Knoops','PO 77','KNO001','N','2']),
   T(['OH-7','OLIVER HARVEY','OH4455','OHCJSMCHESHIRE0101','8','2026-11-05','2026-10-05','Rick Stein','','RIC001','N','1']),
 ].join('\n'));
 const s5=await p.evaluate(()=>({ demand:sopDemand.lines.length, rows:rows.length, all:rows.find(r=>r.code==='OHCJSMCHESHIRE0101').sopLines.map(a=>a.so+'='+a.by.map(b=>b.who+':'+b.qty).join('+')).join(' '),
   covers:WOs.filter(w=>w.items[0].code==='OHCJSMCHESHIRE0101').map(w=>w.ref+'='+w.items[0].sop.covers.map(c=>c.so+':'+c.qty).join(',')).join(' ') }));
 // the old nine-column sheet still pastes, and clears the Clockwork flag
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); }, T(['AP0002','CLOCKWORK APRON','0','500','0','30','90','182','360']));
 const s6=await p.evaluate(()=>({ n:rows.length, cw:!!rows[0].clockwork, sku:document.getElementById('skuCount').textContent.replace(/\s+/g,' ').trim(), demand:sopDemand.lines.length }));
 const out={s1,s2,s3,s4,s5,s6};
 console.log(JSON.stringify(out,null,1));
 const pass = s1.n===3 && s1.demand===4 && s1.cw===true && s1.cwRec===0 && s1.cjRec>0 && s1.cwStatus==='critical'
   && s1.sku==='3 SKUs | 50% Good · on 2 scored, 1 Clockwork not counted' && s1.tag && !s1.tagCJ
   && s1.shown==='AP0002,OHCJSMCHESHIRE0101,HT0003' && s1.critList==='OHCJSMCHESHIRE0101' && s1.hidden==='OHCJSMCHESHIRE0101,HT0003|false|3' && /days\)10 on a WOP/.test(s1.crit)
   && s1.sopTitle.length===3 && /^SO 116383 · 10 · Mollies Motels · due 21 Oct 2026 → 10 from stock$/.test(s1.sopTitle[0]) && /^SO 116400 · 5 · Knoops · due 28 Oct 2026 → 5 not covered$/.test(s1.sopTitle[1]) && /^SO OH4455 \(OH\) · 8 · Rick Stein · due 05 Nov 2026 → 8 not covered$/.test(s1.sopTitle[2])
   && s1.snap.skus===2 && s1.snap.clockwork===1 && s1.snap.pct===50
   && s2.covers==='116400:5,OH4455:8' && s2.all==='116383=stock:10 116400='+s2.ref+':5 OH4455='+s2.ref+':8'
   && s2.card==='📋 SO 116400 due 28 Oct 2026 · +1 more'
   && s2.modal.length===3 && s2.modal[0]==='|SO 116383 · 10 · Mollies Motels · due 21 Oct 2026 → 10 from stock' && s2.modal[1]==='700|SO 116400 · 5 · Knoops · due 28 Oct 2026 → 5 on this works order' && s2.modal[2]==='700|SO OH4455 (OH) · 8 · Rick Stein · due 05 Nov 2026 → 8 on this works order'
   && s2.print && /<strong>SO 116400 · 5 · Knoops · due 28 Oct 2026 → 5 on this works order<\/strong>/.test(s2.print) && /<span style="color:#555">SO 116383 · 10 · Mollies Motels/.test(s2.print)
   && s3==='WO-0001=116400:5,OH4455:8 WO-0002='
   && s4.demand===4 && s4.covers===s3 && s4.pub===4 && s4.cw===true
   && s5.demand===2 && s5.rows===3 && s5.all==='116400=stock:5 OH4455=stock:5+WO-0001:3' && s5.covers==='WO-0001=OH4455:3 WO-0002='
   && s6.n===1 && s6.cw===false && s6.sku==='1 SKUs | 0% Good' && s6.demand===2;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
