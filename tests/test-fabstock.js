// Fabric stock against live works orders. Sage sheet pasted for three fabrics;
// one live works order committing CO5014DEN (apron, 15 x 0.6 = 9 m) and one
// committing PC14001 + mesh (Cheshire 32" x 5: 7.05 m + 0.55 m); a completed
// but not-yet-exported apron line (6 m of CO5014DEN cut, still in Sage).
//   CO5014DEN  in stock 20, min 10, on PO 0 -> free 20-6-9 = 5 -> below min, order the usual qty of 50
//   PC14001    in stock 5, no Sage min but 500 on the office sheet, on PO 20 -> free -2.05 -> short, the PO covers it, order 490 on top
//   POPLAZA03  in Sage 30, nothing live, no minimum -> not monitored, hidden until asked for
//   MESH2290901 not on the sheet, 0.55 committed, 500 on the office sheet -> not on sheet
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
 // OHAPP0534GD stands in here for a code costed from All Costings alone. The
 // aprons now have a lay plan (OHAPP0534__ -> 0.5475 m) - test-layplan.js
 // covers that; here it is switched off so the arithmetic stays as written.
 await p.addInitScript(()=>{ let v; Object.defineProperty(window,'LAY_PLAN',{configurable:true,get(){ return v; },set(x){ delete x['OHAPP0534__']; v=x; }}); });
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
 // the supplier is a drop-down, All suppliers by default; a search box finds one fabric; the Live WO
 // figure drills down to the works orders behind it, each with a way to change its cloth
 const t1b=await p.evaluate(()=>{ const sel=document.getElementById('fabSupSel'); const o={def:sel.value, opts:[...sel.options].map(x=>x.textContent.replace(/ \(.*\)$/,'')).join('|')};
   sel.value='TIA001EU'; sel.dispatchEvent(new Event('change')); o.order=/Order for Tiajo Comercio/.test(document.getElementById('fabBody').textContent); o.kept=document.getElementById('fabSupSel').value;
   document.getElementById('fabSupSel').value=''; document.getElementById('fabSupSel').dispatchEvent(new Event('change'));
   const q=document.getElementById('fabStockQ'); q.value='pc14001'; q.focus(); q.dispatchEvent(new Event('input')); o.found=[...document.querySelectorAll('#fabBody .fab-stk tbody tr')].map(tr=>tr.querySelector('span').textContent).join(); o.focus=document.activeElement.id;
   document.getElementById('fabStockQ').value=''; document.getElementById('fabStockQ').dispatchEvent(new Event('input'));
   fabDrill('PC14001'); const d=document.querySelector('#fabBody .fab-stk tr.fab-drill'); o.drill=d?d.textContent.replace(/\s+/g,' ').trim():'none'; o.link=!!(d&&d.querySelector('a[onclick^="setFabricCode"]')); o.woLink=!!(d&&d.querySelector('a[onclick^="openWOModal"]'));
   fabDrill('PC14001'); o.closed=!document.querySelector('#fabBody .fab-stk tr.fab-drill'); return o; });
 console.log('stock view   ->', JSON.stringify(t1b));
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
 // sortable columns, the Free + PO column, and the needs-ordering chip and tile
 const t2d=await p.evaluate(()=>{ fabOpen.supplier=''; fabOpen.showAll=true; fabRender();
   const heads=[...document.querySelectorAll('#fabBody .fab-stk thead th')].map(t=>t.textContent.replace(/[↕▼▲]/g,''));
   const stock=()=>[...document.querySelectorAll('#fabBody .fab-stk tbody tr')].map(tr=>tr.children[2].textContent.trim()).filter(v=>v!=='—').slice(0,3).join();
   [...document.querySelectorAll('#fabBody .fab-stk thead th')].find(t=>/^In Stock/.test(t.textContent)).click(); const desc=stock();
   document.querySelector('#fabBody .fab-stk thead th.on').click(); const asc=stock();
   document.querySelector('#fabBody .fab-stk thead th.on').click();
   window.prompt=()=>'0'; fabSetMin('PC14001');   // no minimum, and a big order takes it below nil even with the PO - still flagged
   document.getElementById('woRef').value='S-BIG'; document.getElementById('woStart').value='2026-09-21'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value='OHCJMCHESHIRE3201\t15'; saveWO(); smShowTab('fabric');
   const need=fabStockCompute().need.map(x=>x.code+':'+(x.monitored?'m':'-')).sort().join();
   const chip=[...document.querySelectorAll('#fabBody .fab-chip')].find(b=>/Needs ordering/.test(b.textContent)).textContent.replace(/\s+/g,' ').trim();
   fabOpen.need=true; fabRender(); const rows=[...document.querySelectorAll('#fabBody .fab-stk tbody tr')].map(tr=>tr.querySelector('span').textContent).sort().join();
   const afterCol=[...document.querySelectorAll('#fabBody .fab-stk tbody tr')].map(tr=>tr.querySelector('span').textContent+'='+tr.children[7].textContent.trim()).sort().join();
   const tile=[...document.querySelectorAll('.kpi-tile')].find(t=>/Needs ordering/.test(t.textContent)).querySelector('.v').textContent;
   WOs.splice(WOs.findIndex(w=>w.ref==='S-BIG'),1); recalcWOs(); recalcQtys(); saveState(); window.prompt=()=>'25'; fabSetMin('PC14001'); fabOpen.need=false; fabOpen.showAll=false; fabOpen.supplier='TIA001EU'; fabRender();
   const oheads=[...document.querySelectorAll('#fabBody .fab-stk thead th')].map(t=>t.textContent.replace(/[↕▼▲]/g,'')).slice(5,8).join('|');
   fabOpen.supplier=''; fabSavePrefs(); fabRender();
   return {heads:heads.join('|'), desc, asc, sortLeft:!!fabOpen.sort.stock, need, chip, rows, afterCol, tile, oheads}; });
 console.log('sort/need  ', JSON.stringify(t2d));
 const t2b=await p.evaluate(()=>{ window.prompt=()=>'12'; fabSetLead('TIA001EU','Tiajo Comercio'); const a=fabLeadFor(fabStock.rows['CO5014DEN']); fabTogglePaste(); document.getElementById('fabTA').value='CO5014DEN\tX\tMetre\tTIA001EU\tTiajo Comercio\t\t20\t0\t0\t10\t12\t50\t6.71\t0'; fabLoadStockPaste(); return a.days+':'+a.src+':'+fabLeadFor(fabStock.rows['CO5014DEN']).days; });
 await p.reload(); await p.waitForTimeout(400);
 const t3=await p.evaluate(()=>{ window.now=()=>new Date('2026-09-21T10:00:00'); smShowTab('fabric'); const k=fabStockCompute(); return {n:k.n, den:k.list.find(x=>x.code==='CO5014DEN').after}; });
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')); await p.waitForTimeout(400);
 const t4=await p.evaluate(()=>{ loadState(); smShowTab('fabric'); return {btn:document.querySelectorAll('#fabBody .btn').length, rows:document.querySelectorAll('#fabBody .fab-stk tbody tr').length, short:fabStockCompute().low.map(x=>x.code).join()}; });
 // banners: the stock section collapses on its banner and stays collapsed across a reload; the order table shows In Sage and On order
 const t5=await p.evaluate(()=>{ fabOpen.supplier='TIA001EU'; fabRender(); const heads=[...document.querySelectorAll('#fabBody .fab-stk thead th')].map(t=>t.textContent.replace(/[↕▼▲]/g,'')).slice(0,3).join('|');
   const before=document.querySelectorAll('#fabBody .fab-stk').length; [...document.querySelectorAll('#fabBody .sm-bh')].find(b=>/Fabric stock/.test(b.textContent)).click(); const after=document.querySelectorAll('#fabBody .fab-stk').length;
   return heads+' '+before+'>'+after+' '+JSON.parse(localStorage.getItem('tibard_fab_sections')).sec.stock; });
 await p.reload(); await p.waitForTimeout(400);
 const t5b=await p.evaluate(()=>{ smShowTab('fabric'); const n=document.querySelectorAll('#fabBody .fab-stk').length; fabToggleSec('stock'); fabOpen.supplier=''; fabSavePrefs(); fabRender(); return n; });
 console.log('banners   ', t5, '| after reload', t5b);
 console.log('lead edit', t2b);
 console.log('show all', t2, '| reload', JSON.stringify(t3), '| viewer', JSON.stringify(t4));
 const pass = t1b.def==='' && /^All suppliers\|/.test(t1b.opts) && /Tiajo Comercio/.test(t1b.opts) && t1b.order && t1b.kept==='TIA001EU' && t1b.found==='PC14001' && t1b.focus==='fabStockQ'
   && /1 line on 1 live works order take PC14001/.test(t1b.drill) && /S-LIVE2/.test(t1b.drill) && /OHCJMCHESHIRE3201/.test(t1b.drill) && /7\.05/.test(t1b.drill) && t1b.link && t1b.woLink && t1b.closed
   && t0.n===0 && /CO5014DEN:unknown:9.00:6/.test(t0.list) && /PC14001:unknown:7.05:0/.test(t0.list) && /MESH2290901:unknown:0.55:0/.test(t0.list) && t0.tile===1
   && /3 fabric\(s\) loaded/.test(t1.alert) && /1 short against live works orders, 1 under the minimum level/.test(t1.alert) && t1.pastedAt==='2026-09-21' && t1.n===3
   && t1.rows[0]==='PC14001:short:5:0:-2.05:7.05:20:17.95:500:490' && t1.rows[1]==='CO5014DEN:low:20:6:5:9:0:5:10:50' && t1.rows[2]==='MESH2290901:unknown::0::0.55:0:-999:500:0'
   && t1.rows.some(r=>r==='POPLAZA03:ok:30:0:30:0:0:30:0:0')
   && t1.rowsShown===33 && /Tiajo Comercio ?10 working days/.test(t1.sup)
   && t5==='Fabric|In Stock|On PO 2>0 false' && t5b===0 && t2===33 && t2c==='CO5014DEN=50|50|true|4000|4200|true|50|25:short' && t2b==='12:app:12' && t2d.heads==='Fabric|Supplier|In Stock|Live WO|Not written off|Free Stock|On PO|Free + PO|Min|State' && t2d.desc==='20.0,5.0' && t2d.asc==='5.0,20.0' && !t2d.sortLeft && t2d.need==='CO5014DEN:m,PC14001:-' && t2d.chip==='⚑ Needs ordering 2' && t2d.rows==='CO5014DEN,PC14001' && t2d.afterCol==='CO5014DEN=5.0,PC14001=-3.2' && t2d.tile==='2' && t2d.oheads==='Free Stock|Free + PO|Min' && t3.n===1 && t3.den===5 && t4.btn===0 && t4.rows===33 && t4.short==='CO5014DEN';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
