// Fabric stock against live works orders. Sage sheet pasted for three fabrics;
// one live works order committing CO5014DEN (apron, 15 x 0.6 = 9 m) and one
// committing PC14001 + mesh (Cheshire 32" x 5: 7.05 m + 0.51 m); a completed
// but not-yet-exported apron line (6 m of CO5014DEN cut, still in Sage).
//   CO5014DEN  in Sage 20, min 10, on order 0  -> free 14, after 5   -> below min, order the reorder qty of 50
//   PC14001    in Sage 5,  min 0,  on order 20 -> free 5,  after 17.95 -> ok
//   POPLAZA03  in Sage 30, nothing live          -> ok
//   MESH2290901 not on the sheet, 0.51 committed -> not on sheet
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const sheet=[
 T(['CO5014DEN','MURRAY LT GREY DENIM','Metre','TIAJO','Tiajo Textiles','TJ-DEN-14','20','0','0','10','12','50','6.71','14']),
 T(['PC14001','WHITE COOLTEX 1','Metre','TIAJO','Tiajo Textiles','TJ-CT-1','5','0','20','0','0','0','3.09','14']),
 T(['POPLAZA03','BLACK PLAZA','Metre','CARR','Carrington','','30','0','0','0','0','0','2.10','7']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-21T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); });
 const mk=(ref,ta)=>p.evaluate(([ref,ta])=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-21'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value=ta; saveWO(); }, [ref,ta]);
 await mk('S-CUT','OHAPP0534GD\t10'); await p.evaluate(()=>{ completeWholeWO(WOs.findIndex(w=>w.ref==='S-CUT')); });   // 6 m cut, open on the ledger
 await mk('S-LIVE1','OHAPP0534GD\t15'); await mk('S-LIVE2','OHCJMCHESHIRE3201\t5');
 // before any paste: demand known, stock unknown
 const t0=await p.evaluate(()=>{ smShowTab('fabric'); const k=fabStockCompute(); return {n:k.n, list:k.list.map(x=>x.code+':'+x.state+':'+x.committed.toFixed(2)+':'+x.cut).join(' '), tile:[...document.querySelectorAll('.kpi-tile .l')].map(e=>e.textContent).filter(t=>/Fabrics short/.test(t)).length}; });
 console.log('before paste ->', JSON.stringify(t0));
 const t1=await p.evaluate(t=>{ fabTogglePaste(); document.getElementById('fabTA').value=t; fabLoadStockPaste();
   const k=fabStockCompute(); return {alert:window.__alerts.pop(), pastedAt:k.pastedAt, n:k.n,
     rows:k.list.map(x=>[x.code,x.state,x.inSage,x.cut,x.free,Math.round(x.committed*100)/100,x.onOrder,Math.round((x.after==null?-999:x.after)*100)/100,x.min,x.order].join(':')),
     shown:[...document.querySelectorAll('#fabBody .fab-stk')][0].textContent.replace(/\s+/g,' ').slice(0,60), rowsShown:document.querySelectorAll('#fabBody .fab-stk tbody tr').length,
     sup:[...document.querySelectorAll('#fabBody .fab-stk tbody tr')].map(tr=>tr.children[1].textContent.replace(/\s+/g,' ').trim()).join('|')}; }, sheet);
 console.log('after paste  ->', JSON.stringify(t1));
 // show-all reveals the fine ones; a reload keeps the sheet; a viewer sees the same table; write-off of the cut line frees nothing (Sage will fall instead)
 const t2=await p.evaluate(()=>{ fabOpen.showAll=true; fabRender(); return document.querySelectorAll('#fabBody .fab-stk tbody tr').length; });
 await p.reload(); await p.waitForTimeout(400);
 const t3=await p.evaluate(()=>{ window.now=()=>new Date('2026-09-21T10:00:00'); smShowTab('fabric'); const k=fabStockCompute(); return {n:k.n, den:k.list.find(x=>x.code==='CO5014DEN').after}; });
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')); await p.waitForTimeout(400);
 const t4=await p.evaluate(()=>{ loadState(); smShowTab('fabric'); return {btn:document.querySelectorAll('#fabBody .btn').length, rows:document.querySelectorAll('#fabBody .fab-stk tbody tr').length, short:fabStockCompute().low.map(x=>x.code).join()}; });
 console.log('show all', t2, '| reload', JSON.stringify(t3), '| viewer', JSON.stringify(t4));
 const pass = t0.n===0 && /CO5014DEN:unknown:9.00:6/.test(t0.list) && /PC14001:unknown:7.05:0/.test(t0.list) && /MESH2290901:unknown:0.51:0/.test(t0.list) && t0.tile===1
   && /3 fabric\(s\) loaded/.test(t1.alert) && /1 under the minimum level/.test(t1.alert) && t1.pastedAt==='2026-09-21' && t1.n===3
   && t1.rows[0]==='CO5014DEN:low:20:6:14:9:0:5:10:50' && t1.rows[1]==='MESH2290901:unknown::0::0.51:0:-999:0:0'
   && t1.rows.some(r=>r==='PC14001:ok:5:0:5:7.05:20:17.95:0:0') && t1.rows.some(r=>r==='POPLAZA03:ok:30:0:30:0:0:30:0:0')
   && t1.rowsShown===2 && /Tiajo Textiles ?14 day lead/.test(t1.sup)
   && t2===4 && t3.n===3 && t3.den===5 && t4.btn===0 && t4.rows===2 && t4.short==='CO5014DEN';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
