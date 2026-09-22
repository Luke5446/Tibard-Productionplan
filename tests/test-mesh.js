// Mesh belongs only to an OH chef jacket whose code carries the M: OHCJM
// (long sleeve) or OHCJSM (short sleeve). The ladies range (OHLCJ, OHLCJS)
// and every other OHCJ style have none. Checks the rule itself, the usage
// lookup, the cutting sheet's "further cloth", the write-off file, and the
// repair that amends a line completed under the old data but not yet
// written off - while leaving a written-off line exactly as it was.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.confirm=()=>true; window.alert=()=>{}; window.now=()=>new Date('2026-09-22T10:00:00'); });
 // 1. the rule, including the traps: OHCJSUFFOLK / OHCJSSUFFOLK are a style name, not a variant
 const r1=await p.evaluate(()=>['OHCJMCHESHIRE3201','OHCJSMCHESHIRE3201','OHCJMDEVON4801','OHCJSMSTRATFORD4401',
   'OHCJSCUMBRIA4201','OHCJCUMBRIA4201','OHCJSUFFOLK4401','OHCJSSUFFOLK4201','OHLCJHAMPSHIRE1201','OHLCJSHAMPSHIRE1601',
   'OHLCJSDERBYSHIRE1401','OHLCJYORK0801','OHLCJ40084293','OHHTM0160248','WAGHTM016024','OHAPP0534GD','OHTAB82']
   .map(c=>c+':'+(ohHasMesh(c)?1:0)).join(' '));
 console.log('rule       ->', r1);
 // 2. the usage lookup: the M jackets keep their mesh, the rest lose it
 const r2=await p.evaluate(()=>['OHCJMCHESHIRE3201','OHCJSMDEVON5601','OHLCJHAMPSHIRE1201','OHLCJSHAMPSHIRE1601','OHCJSCUMBRIA4201']
   .map(c=>{ const u=fabricUsageFor(c); return c+'='+(u?u.metres+'/'+(u.extras||[]).map(x=>x.code+':'+x.metres).join('+'):'none'); }).join(' '));
 console.log('usage      ->', r2);
 // 3. no marker anywhere breaks the rule
 const r3=await p.evaluate(()=>Object.keys(FABRIC_MARKERS).filter(k=>FABRIC_MARKERS[k][1]>0 && !ohHasMesh(k)).join()||'none');
 console.log('markers    ->', r3);
 // 4. a works order completed now: the ladies jacket writes off cloth only
 const mk=(ref,ta)=>p.evaluate(([ref,ta])=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-22'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value=ta; saveWO(); completeWholeWO(WOs.findIndex(w=>w.ref===ref)); },[ref,ta]);
 await mk('S-LADY','OHLCJSHAMPSHIRE1601\t6');
 await mk('S-MESH','OHCJMCHESHIRE3201\t10');
 const r4=await p.evaluate(()=>['S-LADY','S-MESH'].map(r=>{ const c=completedWOs.find(x=>x.ref===r);
   return r+'='+c.fabric.code+'/'+c.fabric.std+'/'+((c.fabric.extras||[]).map(x=>x.code+':'+x.std).join('+')||'no extras'); }).join(' '));
 console.log('completed  ->', r4);
 // 5. the repair: a line frozen under the old data, still open, is amended; a written-off one is not
 const r5=await p.evaluate(()=>{ const old={code:'MESH2290901', name:'mesh', perGarment:2.5, std:15, actual:null, price:1.1};
   const a=completedWOs.find(x=>x.ref==='S-LADY'); a.fabric.extras=[Object.assign({},old)];
   completedWOs.push({ref:'S-GONE', code:'OHLCJSHAMPSHIRE1601', desc:'', qty:6, completed:'2026-09-20', fabric:{code:'PC14001',name:'',perGarment:1.05,std:6.3,actual:null,source:'marker',price:3.09,extras:[Object.assign({},old)]}, fabricExportedAt:'2026-09-20', fabricExportFile:'Fabric_WriteOff_2026-09-20_0900.csv'});
   completedWOs.push({ref:'S-KEEP', code:'OHCJMCHESHIRE3201', desc:'', qty:10, completed:'2026-09-20', fabric:{code:'PC14001',name:'',perGarment:1.41,std:14.1,actual:null,source:'marker',price:3.09,extras:[{code:'MESH2290901',name:'mesh',perGarment:0.1018,std:1.02,actual:null,price:1.1}]}});
   const n=fabFixMesh();
   const g=r=>{ const c=completedWOs.find(x=>x.ref===r); return r+'='+((c.fabric.extras||[]).map(x=>x.code+':'+x.std).join('+')||'none'); };
   return {n, after:[g('S-LADY'),g('S-GONE'),g('S-KEEP')].join(' '), again:JSON.stringify(fabFixMesh())}; });
 console.log('repair     ->', JSON.stringify(r5));
 // 6. the write-off file carries no mesh for the ladies jacket, and does for the Cheshire
 const r6=await p.evaluate(async()=>{ smShowTab('fabric'); let blob=null; URL.createObjectURL=x=>{blob=x; return 'blob:x';}; HTMLAnchorElement.prototype.click=function(){};
   fabTickAll(true); exportFabricWriteOff(); const csv=(await blob.text()).split('\r\n').filter(Boolean);
   return csv.filter(r=>/^MESH|S-LADY|S-MESH/.test(r)).sort().join(' | '); });
 console.log('write-off  ->', r6);
 // 6b. a mesh row can never become a jacket's MAIN cloth when the tables know nothing about the code
 const r6b=await p.evaluate(()=>{ const R=(ref,style,qty,code,m)=>['22/09/2026','OH',ref,'C/JKTS',style,String(qty),'TIAJO','P/C','X','N',code,String(m)].join('\t');
   completedWOs.push({ref:'S-NOFAB', code:'OHCJSYORK1401', desc:'', qty:4, completed:'2026-09-22'});
   fabToggleSheet(); document.getElementById('fabSheetTA').value=R('S-NOFAB','OHCJSYORK1401',4,'MESH2290901',3); fabLoadSheet('todo');
   const c=completedWOs.find(x=>x.ref==='S-NOFAB');
   return (c.fabric?c.fabric.code+'/'+c.fabric.actual:'no record')+' | conflicts='+(ohMeshConflicts().join()||'none'); });
 console.log('no-usage   ->', r6b);
 // 7. a cutting sheet mesh row cannot put mesh back on a ladies jacket
 const r7=await p.evaluate(()=>{ const R=(ref,style,qty,code,m)=>['22/09/2026','OH',ref,'C/JKTS',style,String(qty),'TIAJO','P/C','X','N',code,String(m)].join('\t');
   document.getElementById('woRef').value='S-SHEET'; document.getElementById('woStart').value='2026-09-22'; document.getElementById('woDue').value='2026-09-30';
   document.getElementById('woTA').value='OHLCJSHAMPSHIRE1601\t6'; saveWO(); completeWholeWO(WOs.findIndex(w=>w.ref==='S-SHEET'));
   fabToggleSheet(); document.getElementById('fabSheetTA').value=[R('S-SHEET','OHLCJSHAMPSHIRE1601',6,'PC14001',6),R('S-SHEET','OHLCJSHAMPSHIRE1601',6,'MESH2290901',2)].join('\n');
   fabLoadSheet('todo'); const c=completedWOs.find(x=>x.ref==='S-SHEET');
   return c.fabric.code+'/'+c.fabric.actual+'/'+((c.fabric.extras||[]).map(x=>x.code).join('+')||'no extras'); });
 console.log('sheet      ->', r7);

 // 8. a LIVE works order: a mesh sheet row must not become the jacket's own cut figure, nor mark it written off
 const r8=await p.evaluate(()=>{ const R=(ref,style,qty,code,m)=>['22/09/2026','OH',ref,'C/JKTS',style,String(qty),'TIAJO','P/C','X','N',code,String(m)].join('\t');
   const mkLive=(ref,ta)=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-22'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value=ta; saveWO(); };
   mkLive('S-LIVL','OHLCJSHAMPSHIRE1601\t6');      // ladies, no mesh
   mkLive('S-LIVM','OHCJMCHESHIRE3201\t10');       // has the M, mesh 0.1018
   const it=r=>WOs.find(w=>w.ref===r).items[0];
   fabToggleSheet(); document.getElementById('fabSheetTA').value=[R('S-LIVL','OHLCJSHAMPSHIRE1601',6,'MESH2290901',9), R('S-LIVM','OHCJMCHESHIRE3201',10,'MESH2290901',1)].join('\n');
   fabLoadSheet('todo'); const todo=['S-LIVL='+(it('S-LIVL').metresActual===undefined?'untouched':it('S-LIVL').metresActual), 'S-LIVM='+(it('S-LIVM').metresActual===undefined?'untouched':it('S-LIVM').metresActual)].join(' ');
   fabToggleSheet(); document.getElementById('fabSheetTA').value=R('S-LIVL','OHLCJSHAMPSHIRE1601',6,'MESH2290901',9); fabLoadSheet('done');
   return {todo, done:it('S-LIVL').fabricExportedAt||'not marked', said:/could not be placed/.test(document.getElementById('fabSheetResult').textContent)}; });
 console.log('live       ->', JSON.stringify(r8));

 // 9. the blocker the audit found: a mesh row that is the ONLY row to claim a line must not
 //    overwrite the garment's own cloth figure - and on a jacket with the M it still reaches the mesh
 const r9=await p.evaluate(()=>{ const R=(ref,style,qty,code,m)=>['22/09/2026','OH',ref,'C/JKTS',style,String(qty),'T','P','X','N',code,String(m)].join('\t');
   const mk=(ref,ta)=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-09-22'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value=ta; saveWO(); completeWholeWO(WOs.findIndex(w=>w.ref===ref)); };
   mk('S-ONLY','OHLCJSHAMPSHIRE1601\t6');    // ladies: no mesh, already has a PC14001 record
   mk('S-MOK','OHCJMCHESHIRE3201\t10');      // has the M: the mesh row must still reach its mesh extra
   fabToggleSheet(); document.getElementById('fabSheetTA').value=[R('S-ONLY','OHLCJSHAMPSHIRE1601',6,'MESH2290901',2.5),R('S-MOK','OHCJMCHESHIRE3201',10,'MESH2290901',1.5)].join('\n');
   fabLoadSheet('todo');
   const g=r=>{ const c=completedWOs.find(x=>x.ref===r); return c.fabric.code+'/'+c.fabric.std+'/'+c.fabric.actual+'/'+((c.fabric.extras||[]).map(x=>x.code+':'+(x.actual!=null?x.actual:x.std)).join('+')||'none'); };
   return {only:g('S-ONLY'), mok:g('S-MOK'), tick:fabTickedLines().some(l=>l.ref==='S-ONLY'), said:/could not be placed/.test(document.getElementById('fabSheetResult').textContent)}; });
 console.log('mesh-only  ->', JSON.stringify(r9));

 const pass = r9.only==='PC14001/6.3/null/none' && r9.mok==='PC14001/14.1/null/MESH2290901:1.5' && !r9.tick && r9.said
   && r8.todo==='S-LIVL=untouched S-LIVM=untouched' && r8.done==='not marked' && r8.said
   && r1==='OHCJMCHESHIRE3201:1 OHCJSMCHESHIRE3201:1 OHCJMDEVON4801:1 OHCJSMSTRATFORD4401:1 OHCJSCUMBRIA4201:0 OHCJCUMBRIA4201:0 OHCJSUFFOLK4401:0 OHCJSSUFFOLK4201:0 OHLCJHAMPSHIRE1201:0 OHLCJSHAMPSHIRE1601:0 OHLCJSDERBYSHIRE1401:0 OHLCJYORK0801:0 OHLCJ40084293:0 OHHTM0160248:1 WAGHTM016024:1 OHAPP0534GD:1 OHTAB82:1'
   && /OHCJMCHESHIRE3201=1\.41\/MESH2290901:0\.1018/.test(r2) && /OHCJSMDEVON5601=1\.26\/MESH2290901:0\.3533/.test(r2)
   && /OHLCJHAMPSHIRE1201=1\.28\/ /.test(r2+' ') && /OHLCJSHAMPSHIRE1601=1\.05\/ /.test(r2+' ') && /OHCJSCUMBRIA4201=1\.18\/ /.test(r2+' ')
   && r3==='none'
   && r4==='S-LADY=PC14001/6.3/no extras S-MESH=PC14001/14.1/MESH2290901:1.02'
   && r5.n.lines===1 && r5.n.metres===15 && r5.after==='S-LADY=none S-GONE=MESH2290901:15 S-KEEP=MESH2290901:1.02' && r5.again==='{"lines":0,"metres":0}'
   && /MESH2290901,HOME,,1\.02,Cutting,S-MESH/.test(r6) && /PC14001,HOME,,6\.3,Cutting,S-LADY/.test(r6)
   && !r6.split(' | ').some(r=>/^MESH/.test(r) && /S-LADY/.test(r))
   && r6b==='no record | conflicts=none'
   && r7==='PC14001/6/no extras';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
