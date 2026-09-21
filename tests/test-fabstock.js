// Fabric stock against live works orders. Sage sheet pasted for three fabrics;
// one live works order committing CO5014DEN (apron, 15 x 0.6 = 9 m) and one
// committing PC14001 + mesh (Cheshire 32" x 5: 7.05 m + 0.51 m); a completed
// but not-yet-exported apron line (6 m of CO5014DEN cut, still in Sage).
//   CO5014DEN  in Sage 20, min 10, on order 0  -> free 14, after 5   -> below min, order the reorder qty of 50
//   PC14001    in Sage 5,  no Sage min but 500 on the office sheet, on order 20 -> free 5, after 17.95 -> below min, order 490
//   POPLAZA03  in Sage 30, nothing live, no minimum -> not monitored, hidden until asked for
//   MESH2290901 not on the sheet, 0.51 committed, 500 on the office sheet -> not on sheet
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const sheet=[
 T(['CO5014DEN','MURRAY LT GREY DENIM','Metre','TIA001EU','Tiajo Comercio','TJ-DEN-14','20','0','0','10','12','50','6.71','0']),
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
 // the Tiajo order: one monitored Tiajo fabric, suggested 50; top up spreads the rest; a typed figure sticks; reset returns to the suggestion
 const t2c=await p.evaluate(()=>{ fabOpen.supplier='TIA001EU'; fabRender(); const o=[];
   o.push(fabOrderLines('TIA001EU').map(l=>l.x.code+'='+l.qty).join(','), fabOrderTotal('TIA001EU'), /Order for Tiajo Comercio/.test(document.getElementById('fabBody').textContent));
   fabOrderTopUp('TIA001EU'); o.push(fabOrderTotal('TIA001EU'));
   fabSetOrderQty('TIA001EU','CO5014DEN','4200'); o.push(fabOrderTotal('TIA001EU'), fabOrderLines('TIA001EU')[0].typed);
   fabOrderReset('TIA001EU'); o.push(fabOrderTotal('TIA001EU'));
   window.prompt=()=>'25'; fabSetMin('PC14001'); o.push(fabStockCompute().list.find(x=>x.code==='PC14001').min+':'+fabStockCompute().list.find(x=>x.code==='PC14001').state);
   fabOpen.supplier=''; fabRender(); return o.join('|'); });
 console.log('order      ', t2c);
 const t2b=await p.evaluate(()=>{ window.prompt=()=>'12'; fabSetLead('TIA001EU','Tiajo Comercio'); const a=fabLeadFor(fabStock.rows['CO5014DEN']); fabTogglePaste(); document.getElementById('fabTA').value='CO5014DEN\tX\tMetre\tTIA001EU\tTiajo Comercio\t\t20\t0\t0\t10\t12\t50\t6.71\t0'; fabLoadStockPaste(); return a.days+':'+a.src+':'+fabLeadFor(fabStock.rows['CO5014DEN']).days; });
 await p.reload(); await p.waitForTimeout(400);
 const t3=await p.evaluate(()=>{ window.now=()=>new Date('2026-09-21T10:00:00'); smShowTab('fabric'); const k=fabStockCompute(); return {n:k.n, den:k.list.find(x=>x.code==='CO5014DEN').after}; });
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')); await p.waitForTimeout(400);
 const t4=await p.evaluate(()=>{ loadState(); smShowTab('fabric'); return {btn:document.querySelectorAll('#fabBody .btn').length, rows:document.querySelectorAll('#fabBody .fab-stk tbody tr').length, short:fabStockCompute().low.map(x=>x.code).join()}; });
 // banners: the stock section collapses on its banner and stays collapsed across a reload; the order table shows In Sage and On order
 const t5=await p.evaluate(()=>{ fabOpen.supplier='TIA001EU'; fabRender(); const heads=[...document.querySelectorAll('#fabBody .fab-stk thead th')].map(t=>t.textContent).slice(0,3).join('|');
   const before=document.querySelectorAll('#fabBody .fab-stk').length; document.querySelector('#fabBody .sm-bh').click(); const after=document.querySelectorAll('#fabBody .fab-stk').length;
   return heads+' '+before+'>'+after+' '+JSON.parse(localStorage.getItem('tibard_fab_sections')).sec.stock; });
 await p.reload(); await p.waitForTimeout(400);
 const t5b=await p.evaluate(()=>{ smShowTab('fabric'); const n=document.querySelectorAll('#fabBody .fab-stk').length; fabToggleSec('stock'); fabOpen.supplier=''; fabSavePrefs(); fabRender(); return n; });
 console.log('banners   ', t5, '| after reload', t5b);
 console.log('lead edit', t2b);
 console.log('show all', t2, '| reload', JSON.stringify(t3), '| viewer', JSON.stringify(t4));
 const pass = t0.n===0 && /CO5014DEN:unknown:9.00:6/.test(t0.list) && /PC14001:unknown:7.05:0/.test(t0.list) && /MESH2290901:unknown:0.51:0/.test(t0.list) && t0.tile===1
   && /3 fabric\(s\) loaded/.test(t1.alert) && /2 under the minimum level/.test(t1.alert) && t1.pastedAt==='2026-09-21' && t1.n===3
   && t1.rows[0]==='CO5014DEN:low:20:6:14:9:0:5:10:50' && t1.rows[1]==='PC14001:low:5:0:5:7.05:20:17.95:500:490' && t1.rows[2]==='MESH2290901:unknown::0::0.51:0:-999:500:0'
   && t1.rows.some(r=>r==='POPLAZA03:ok:30:0:30:0:0:30:0:0')
   && t1.rowsShown===33 && /Tiajo Comercio ?10 working days/.test(t1.sup)
   && t5==='Fabric|In Sage|On order 2>0 false' && t5b===0 && t2===33 && t2c==='CO5014DEN=50|50|true|4000|4200|true|50|25:low' && t2b==='12:app:12' && t3.n===1 && t3.den===5 && t4.btn===0 && t4.rows===33 && t4.short==='CO5014DEN';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
