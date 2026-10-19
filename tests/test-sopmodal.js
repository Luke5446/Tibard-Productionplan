// The sales orders behind On SOP on the Stock Runway pop-out (Luke, 19 Oct
// 2026): a click on the row, or on its On SOP figure, opens the pop-out with
// a table of every open sales order line for the code - the sales order,
// the customer and account, their order number, the outstanding quantity,
// the ordered and promised dates (a passed promised date in red) and who
// covers it - oldest promised first; a code on SOP with no SOPDemand paste
// says to paste the sheet; a code with nothing on SOP shows no table.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
function row(code,name,stock,sop,pop){ return T([code,name,stock,sop,pop,'30','90','182','360','Chef Jackets','Tibard','','','N','14','0',stock,'0','0','0',sop,'0','0','2026-09-30','','','N','TIBARD']); }
const buf=[ row('OHAPP0597224DEN','INDIGO DENIM STUD FASTEN APRON',20,32,0), row('HT0003','HEALTHY HAT',400,0,0) ].join('\n');
const dem=[
 T(['TIB-101','TIBARD','116400','OHAPP0597224DEN','12','2026-10-28','2026-10-01','Knoops','PO 77','KNO001','N','2']),
 T(['TIB-100','TIBARD','116383','OHAPP0597224DEN','10','2026-10-14','2026-09-28','Mollies Motels','','MOL001','N','1']),
 T(['OH-7','OLIVER HARVEY','OH4455','OHAPP0597224DEN','10','2026-11-05','2026-10-05','Rick Stein','RS-9','RIC001','Y','1']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const url='file://'+require('path').join(__dirname,'..','index.html');
 await p.goto(url+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-10-19T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });
 // the buffer alone: On SOP 32, no sales order lines yet
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); }, buf);
 const s0=await p.evaluate(()=>{ openRWModal('OHAPP0597224DEN'); const el=document.getElementById('rwSop'); const t=el?el.textContent.replace(/\s+/g,' ').trim():null; document.getElementById('rwModal').classList.remove('open'); return t; });
 // the demand pasted: a click on the On SOP figure opens the pop-out with the table
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); }, dem);
 await p.click('#row-'+await p.evaluate(()=>sid('OHAPP0597224DEN'))+' td:nth-child(6) span');
 const s1=await p.evaluate(()=>{
   const open=document.getElementById('rwModal').classList.contains('open');
   const cursor=document.querySelector('#row-'+sid('OHAPP0597224DEN')+' td:nth-child(6) span').style.cursor;
   const head=document.querySelector('#rwSop div').textContent.replace(/\s+/g,' ').trim();
   const ths=[...document.querySelectorAll('#rwSop th')].map(t=>t.textContent.trim());
   const trs=[...document.querySelectorAll('#rwSop tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.replace(/\s+/g,' ').trim()));
   const late=[...document.querySelectorAll('#rwSop tbody tr')].map(tr=>tr.children[5].style.color);
   const runway=!!document.querySelector('#rwContent table:nth-of-type(1)') && /Wk 0/.test(document.getElementById('rwContent').textContent);
   document.getElementById('rwModal').classList.remove('open');
   return {open,cursor,head,ths,trs,late,runway};
 });
 // a code with nothing on SOP: no table
 const s2=await p.evaluate(()=>{ openRWModal('HT0003'); const t=!!document.getElementById('rwSop'); document.getElementById('rwModal').classList.remove('open'); return t; });
 const out={s0,s1,s2,errs};
 console.log(JSON.stringify(out,null,1));
 const pass = /On SOP 32 · paste the SOPDemand sheet/.test(s0)
   && s1.open && s1.cursor==='pointer'
   && /^📋 Sales orders on SOP · 3 lines · 32 outstanding \(SOPDemand pasted/.test(s1.head)
   && s1.ths.join('|')==='Sales order|Customer|Their order no|Outstanding|Ordered|Promised|Covered by'
   && s1.trs.length===3
   && s1.trs[0].join('|')==='116383|Mollies Motels MOL001|—|10|28 Sept 2026|14 Oct 2026|10 from stock'
   && s1.trs[1].join('|')==='116400|Knoops KNO001|PO 77|12|01 Oct 2026|28 Oct 2026|10 from stock, 2 not covered'
   && s1.trs[2].join('|')==='OH4455 (OH) IC|Rick Stein RIC001|RS-9|10|05 Oct 2026|05 Nov 2026|10 not covered'
   && s1.late[0]==='rgb(185, 28, 28)' && s1.late[1]==='rgb(17, 24, 39)'
   && s1.runway && s2===false && errs.length===0;
 console.log(pass?'PASS':'FAIL'); await b.close(); process.exit(pass?0:1);
})();
