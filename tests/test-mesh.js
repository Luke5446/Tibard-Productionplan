// Which garments carry mesh.
//   OHCJM / OHCJSM        an OH chef jacket with the M           -> mesh
//   OHLCJ, OHCJS, OHCJ    no M                                   -> no mesh
//   OHL?CJS?HAMPSHIRE     the stated exception: mesh at 0.03 m   -> mesh
//   OHHTM / WAGHTM, aprons, straps   outside the rule            -> keep whatever they are given
// Checks the rule, the usage lookup, a works order completed now, the repair
// that amends lines not yet written off (strip what should not be there,
// re-rate a figure frozen from a corrected rate) while leaving a written-off
// line alone, the write-off file, and the cutting sheet import: a mesh row
// may never become a garment's own cloth, attaches as a second cloth where
// the garment is allowed mesh, and is refused where it is not.
const { chromium } = require('playwright');
const R=(ref,style,qty,code,m)=>['22/09/2026','OH',ref,'C/JKTS',style,String(qty),'T','P','X','N',code,String(m)].join('\t');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.confirm=()=>true; window.alert=()=>{}; window.now=()=>new Date('2026-09-22T10:00:00'); });
 // 1. the rule, including the OHCJSUFFOLK / OHCJSSUFFOLK traps and the Hampshire exception
 const r1=await p.evaluate(()=>['OHCJMCHESHIRE3201','OHCJSMCHESHIRE3201','OHCJMDEVON4801','OHCJSMSTRATFORD4401',
   'OHCJSCUMBRIA4201','OHCJCUMBRIA4201','OHCJSUFFOLK4401','OHCJSSUFFOLK4201','OHLCJSDERBYSHIRE1401','OHLCJYORK0801','OHLCJ40084293',
   'OHLCJHAMPSHIRE1201','OHLCJSHAMPSHIRE1601','OHHTM0160248','WAGHTM016024','OHAPP0534GD','OHTAB82']
   .map(c=>c+':'+(ohHasMesh(c)?1:0)).join(' '));
 console.log('rule       ->', r1);
 // 2. the usage lookup
 const r2=await p.evaluate(()=>['OHCJMCHESHIRE3201','OHCJSMDEVON5601','OHLCJHAMPSHIRE1201','OHLCJSHAMPSHIRE1601','OHLCJSDERBYSHIRE1401','WAGHTM016024']
   .map(c=>{ const u=fabricUsageFor(c); return c+'='+(u?u.metres+'/'+((u.extras||[]).map(x=>x.code+':'+x.metres).join('+')||'none'):'none'); }).join(' '));
 console.log('usage      ->', r2);
 // 3. no marker disagrees with the rule
 const r3=await p.evaluate(()=>ohMeshConflicts().join()||'none');
 console.log('markers    ->', r3);
 // 4. completed now: the no-M jacket takes cloth only, the M jacket and the Hampshire take their mesh
 const mk=(ref,ta)=>p.evaluate(([ref,ta])=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-22'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value=ta; saveWO(); completeWholeWO(WOs.findIndex(w=>w.ref===ref)); },[ref,ta]);
 await mk('S-PLAIN','OHLCJSDERBYSHIRE1401\t8');   // no M, no exception
 await mk('S-MESH','OHCJMCHESHIRE3201\t10');      // has the M
 await mk('S-HAMP','OHLCJSHAMPSHIRE1601\t6');     // the exception
 const r4=await p.evaluate(()=>['S-PLAIN','S-MESH','S-HAMP'].map(r=>{ const c=completedWOs.find(x=>x.ref===r);
   return r+'='+c.fabric.code+'/'+c.fabric.std+'/'+((c.fabric.extras||[]).map(x=>x.code+':'+x.std).join('+')||'none'); }).join(' '));
 console.log('completed  ->', r4);
 // 5. the repair: strip mesh a no-M jacket should never have had, re-rate one frozen at the old
 //    2.5 m Hampshire rate, and leave a written-off line exactly as it is
 const r5=await p.evaluate(()=>{ const old=()=>({code:'MESH2290901', name:'mesh', perGarment:2.5, std:15, actual:null, price:1.1});
   completedWOs.find(x=>x.ref==='S-PLAIN').fabric.extras=[old()];                 // never allowed: stripped
   completedWOs.find(x=>x.ref==='S-HAMP').fabric.extras=[old()];                  // allowed, wrong rate: re-rated
   completedWOs.push({ref:'S-GONE', code:'OHLCJSHAMPSHIRE1601', desc:'', qty:6, completed:'2026-09-20', fabric:{code:'PC14001',name:'',perGarment:1.05,std:6.3,actual:null,source:'marker',price:3.09,extras:[old()]}, fabricExportedAt:'2026-09-20', fabricExportFile:'Fabric_WriteOff_2026-09-20_0900.csv'});
   const n=fabFixMesh();
   const g=r=>{ const c=completedWOs.find(x=>x.ref===r); return r+'='+((c.fabric.extras||[]).map(x=>x.code+':'+x.std).join('+')||'none'); };
   return {n, after:[g('S-PLAIN'),g('S-HAMP'),g('S-GONE'),g('S-MESH')].join(' '), again:JSON.stringify(fabFixMesh())}; });
 console.log('repair     ->', JSON.stringify(r5));
 // 6. the write-off file: the no-M jacket has no mesh row, the other two do
 const r6=await p.evaluate(async()=>{ smShowTab('fabric'); let blob=null; URL.createObjectURL=x=>{blob=x; return 'blob:x';}; HTMLAnchorElement.prototype.click=function(){};
   fabTickAll(true); exportFabricWriteOff(); return (await blob.text()).split('\r\n').filter(Boolean).slice(1).sort().join(' | '); });
 console.log('write-off  ->', r6);
 // 7. a lone mesh sheet row: refused on a no-M jacket, attached as a second cloth on a hat
 //    and on the Hampshire, and never written onto any garment's own cloth
 const r7=await p.evaluate(t=>{ const mk2=(ref,ta)=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-22'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value=ta; saveWO(); completeWholeWO(WOs.findIndex(w=>w.ref===ref)); };
   mk2('S-NOM','OHLCJSDERBYSHIRE1401\t8'); mk2('S-HAT','WAGHTM016024\t30'); mk2('S-HAM2','OHLCJSHAMPSHIRE1601\t6');
   fabToggleSheet(); document.getElementById('fabSheetTA').value=t; fabLoadSheet('todo');
   const g=r=>{ const c=completedWOs.find(x=>x.ref===r); return r+'='+c.fabric.code+'/'+c.fabric.std+'/'+c.fabric.actual+'/'+((c.fabric.extras||[]).map(x=>x.code+':'+(x.actual!=null?x.actual:x.std)).join('+')||'none'); };
   return {rows:[g('S-NOM'),g('S-HAT'),g('S-HAM2')].join(' '), said:/could not be placed/.test(document.getElementById('fabSheetResult').textContent)}; },
   [R('S-NOM','OHLCJSDERBYSHIRE1401',8,'MESH2290901',2.5), R('S-HAT','WAGHTM016024',30,'MESHPW31424',1), R('S-HAM2','OHLCJSHAMPSHIRE1601',6,'MESH2290901',0.2)].join('\n'));
 console.log('sheet      ->', JSON.stringify(r7));
 // 8. a live works order: a mesh row touches neither the cut figure nor the written-off mark
 const r8=await p.evaluate(([t,t2])=>{ const mkLive=(ref,ta)=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-22'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value=ta; saveWO(); };
   mkLive('S-LIVL','OHLCJSDERBYSHIRE1401\t8'); mkLive('S-LIVM','OHCJMCHESHIRE3201\t10');
   const it=r=>WOs.find(w=>w.ref===r).items[0];
   fabToggleSheet(); document.getElementById('fabSheetTA').value=t; fabLoadSheet('todo');
   const todo=['S-LIVL='+(it('S-LIVL').metresActual===undefined?'untouched':it('S-LIVL').metresActual), 'S-LIVM='+(it('S-LIVM').metresActual===undefined?'untouched':it('S-LIVM').metresActual)].join(' ');
   fabToggleSheet(); document.getElementById('fabSheetTA').value=t2; fabLoadSheet('done');
   return {todo, done:it('S-LIVL').fabricExportedAt||'not marked'}; },
   [[R('S-LIVL','OHLCJSDERBYSHIRE1401',8,'MESH2290901',9), R('S-LIVM','OHCJMCHESHIRE3201',10,'MESH2290901',1.5)].join('\n'), R('S-LIVL','OHLCJSDERBYSHIRE1401',8,'MESH2290901',9)]);
 console.log('live       ->', JSON.stringify(r8));

 const pass = r1==='OHCJMCHESHIRE3201:1 OHCJSMCHESHIRE3201:1 OHCJMDEVON4801:1 OHCJSMSTRATFORD4401:1 OHCJSCUMBRIA4201:0 OHCJCUMBRIA4201:0 OHCJSUFFOLK4401:0 OHCJSSUFFOLK4201:0 OHLCJSDERBYSHIRE1401:0 OHLCJYORK0801:0 OHLCJ40084293:0 OHLCJHAMPSHIRE1201:1 OHLCJSHAMPSHIRE1601:1 OHHTM0160248:1 WAGHTM016024:1 OHAPP0534GD:1 OHTAB82:1'
   && r2==='OHCJMCHESHIRE3201=1.41/MESH2290901:0.1018 OHCJSMDEVON5601=1.26/MESH2290901:0.3533 OHLCJHAMPSHIRE1201=1.28/MESH2290901:0.03 OHLCJSHAMPSHIRE1601=1.05/MESH2290901:0.03 OHLCJSDERBYSHIRE1401=1.28/none WAGHTM016024=0.12/none'
   && r3==='none'
   && r4==='S-PLAIN=PC2001ECO/10.24/none S-MESH=PC14001/14.1/MESH2290901:1.02 S-HAMP=PC14001/6.3/MESH2290901:0.18'
   && r5.n.lines===1 && r5.n.metres===15 && r5.n.rerated===1 && r5.n.reratedMetres===14.82
   && r5.after==='S-PLAIN=none S-HAMP=MESH2290901:0.18 S-GONE=MESH2290901:15 S-MESH=MESH2290901:1.02'
   && r5.again==='{"lines":0,"metres":0,"rerated":0,"reratedMetres":0}'
   && /MESH2290901,HOME,,1.02,Cutting,S-MESH/.test(r6) && /MESH2290901,HOME,,0.18,Cutting,S-HAMP/.test(r6)
   && !r6.split(' | ').some(r=>/^MESH/.test(r) && /S-PLAIN/.test(r))
   && r7.rows==='S-NOM=PC2001ECO/10.24/null/none S-HAT=PC2024/3.6/null/MESHPW31424:1 S-HAM2=PC14001/6.3/null/MESH2290901:0.2' && r7.said
   && r8.todo==='S-LIVL=untouched S-LIVM=untouched' && r8.done==='not marked';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
