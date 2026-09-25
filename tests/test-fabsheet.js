// Catch-up from the cutting sheet. Works orders:
//   A-A   20 Aug  OHAPP0534GD x10 -> 6 m CO5014DEN, completed         (green on the sheet: 7 m cut)
//   S-B    1 Sep  OHCJMCHESHIRE3201 x5 -> 7.05 PC14001 + 0.51 mesh    (two sheet rows: 8 m + 1 m, to write off)
//   S-C    8 Sep  OHAPP0534GD x15 + ZZNOUSAGE x2                       (CO5014DEN 10 m; ZZNOUSAGE on PC2001ECO 3 m by style)
//   A-OLD  a line completed before the ledger existed (no fabric key)  (sheet: CO5014DEN 4 m -> record built)
//   S-SWAP OHAPP0534GD x2, sheet says CO5001ECO 1.5 m + a mesh row        (cloth kept as the works order has it, metres taken; mesh added as a further cloth)
//   S-ZERO OHAPP0534GD x2, sheet says '-'                                 (cut from waste: the line at nil, ticked, no row in the file)
//   S-LIVE OHAPP0534GD x15 still live                                   (green -> flagged; carried into the ledger on completion)
//   S-LATE OHAPP0534GD x1 completed 20 Jun, sheet row dated 10 Sep      (outside the window -> not placed)
//   S-LAY  OHAPP0534GD x10 (std 6 m), sheet says 40 m                      (a whole lay, not this job: held back, listed, never ticked)
//   W/O 9999 unknown, 12 m; S-C on a row with WASTE for another cloth; SR0005 and EMB rows for a manual write-off
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const R=(date,ref,style,qty,code,m)=>T([date,'OH',ref,'B/APRON',style,String(qty),'TIAJO','P/C','X','APOLLO',code,String(m)]);
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 // OHAPP0534GD stands in here for a code costed from All Costings alone. The
 // aprons now have a lay plan (OHAPP0534__ -> 0.5475 m) - test-layplan.js
 // covers that; here it is switched off so the arithmetic stays as written.
 await p.addInitScript(()=>{ let v; Object.defineProperty(window,'LAY_PLAN',{configurable:true,get(){ return v; },set(x){ delete x['OHAPP0534__']; v=x; }}); });
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 const stub=()=>{ window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); };
 await p.evaluate(stub);
 const mk=(ref,day,ta,complete)=>p.evaluate(([ref,day,ta,complete])=>{ window.now=()=>new Date(day+'T10:00:00');
   document.getElementById('woRef').value=ref; document.getElementById('woStart').value=day; document.getElementById('woDue').value=day; document.getElementById('woTA').value=ta; saveWO();
   if(complete) completeWholeWO(WOs.findIndex(w=>w.ref===ref)); }, [ref,day,ta,complete]);
 await mk('S-LATE','2026-06-20','OHAPP0534GD\t1',true);
 await mk('A-A','2026-08-20','OHAPP0534GD\t10',true);
 await mk('S-B','2026-09-01','OHCJMCHESHIRE3201\t5',true);
 await mk('S-C','2026-09-08','OHAPP0534GD\t15\nZZNOUSAGE\t2',true);
 await mk('A-OLD','2026-09-08','OHAPP0534GD\t3',true);
 await mk('S-SWAP','2026-09-09','OHAPP0534GD\t2',true);
 await mk('S-ZERO','2026-09-09','OHAPP0534GD\t2',true);
 await mk('S-LAY','2026-09-09','OHAPP0534GD\t10',true);
 await mk('S-LIVE','2026-09-10','OHAPP0534GD\t15',false);
 await p.evaluate(()=>{ var c=completedWOs.find(x=>x.ref==='A-OLD'); delete c.fabric; window.now=()=>new Date('2026-09-21T10:00:00'); smShowTab('fabric'); });
 // helpers on their own: refs, dates, grouping
 const t0=await p.evaluate(()=>[fabSheetRef('W/O 1131'),fabSheetRef('W/O/ 0554'),fabSheetRef('W/O 503'),fabSheetRef('S-OH115764-PT1'),fabSheetDate('10/09/2026'),fabSheetDate('10-Sep-26'),fabSheetDate('46275'),
   fabSheetFindRefs('S-OH115764-PT1',['S-OH115764-Pt1','S-OH115764-Pt2','S115764','WO-1157']).join('+'), fabSheetFindRefs('S869335',['S869335a','S869335 pt1','WO-8693']).join('+'), fabSheetFindRefs(fabSheetRef('W/O 121'),['WO-0121','WO-1210']).join('+'), fabSheetFindRefs('S-OH1160079',['S-OH116079-Pt1','S-OH116007-Pt1']).join('+'),
   fabParseSheet('7/27/2026\tOH\tW/O 505\tX\tY\t1\tT\tP\tC\tN\tPC14001\t3\n9/10/2026\tOH\tW/O 506\tX\tY\t1\tT\tP\tC\tN\tPC14001\t3').map(r=>r.date).join('+'), fabSheetDate('13/13/2026')||'none', fabSheetDate('27-07-26')||'none',
   fabSheetGroups(fabParseSheet('10/09/2026\tOH\tW/O 505\tX\tY\t1\tT\tP\tC\tN\tPC14001\t3\n11/09/2026\tOH\tW/O 505\tX\tY\t1\tT\tP\tC\tN\tPC14001\t4.5\n11/09/2026\tOH\tW/O 505\tX\tY\t1\tT\tP\tC\tN\tPC14001\tWASTE')).map(g=>g.ref+':'+g.metres+':'+g.date+':'+g.rows.join('/')+':'+g.mtxt.join()).join('|')].join(' '));
 console.log('helpers   ->', t0);
 // 1. green rows: A-A (7 m cut) and the live S-LIVE; S-LATE's row is dated 10 Sep - the June line is not it
 const r1=await p.evaluate(t=>{ fabToggleSheet(); document.getElementById('fabSheetTA').value=t; fabLoadSheet('done');
   const a=completedWOs.find(x=>x.ref==='A-A'), l=WOs.find(w=>w.ref==='S-LIVE').items[0];
   return {res:document.getElementById('fabSheetResult').textContent.replace(/\s+/g,' ').trim(), a:[fabState(a),a.fabricExportedAt,a.fabricExportFile,a.fabric.actual].join(':'), live:l.fabricExportedAt+':'+l.fabricExportFile, open:fabCompute().open.lines}; },
   [R('20/08/2026','A-A','0534',10,'CO5014DEN',7), R('10/09/2026','S-LIVE','0534',15,'CO5014DEN',9), R('10/09/2026','S-LATE','0534',1,'CO5014DEN',1)].join('\n'));
 console.log('green     ->', JSON.stringify(r1));
 // 2. the rest: S-B main + mesh, S-C by main code and by style (record built on PC2001ECO), A-OLD (record built from its usage), S-SWAP (cloth kept, mesh added), S-ZERO at nil, A-A again (already), W/O 9999 (unknown), S-C WASTE row on another cloth, SR0005 and EMB (manual)
 const r2=await p.evaluate(t=>{ document.getElementById('fabSheetTA').value=t; fabLoadSheet('todo');
   const g=r=>completedWOs.find(x=>x.ref===r), sb=g('S-B'), sc=completedWOs.filter(x=>x.ref==='S-C'), so=g('A-OLD'), sw=g('S-SWAP'), sz=g('S-ZERO');
   return {res:document.getElementById('fabSheetResult').textContent.replace(/\s+/g,' ').trim(), ticked:fabTickedLines().map(l=>l.ref+'/'+l.code).sort().join(','), n:fabCompute().ticked,
     sb:[sb.fabric.actual, sb.fabric.extras[0].actual, fabLines().find(l=>l.ref==='S-B').metres].join(':'),
     sc:sc.map(c=>c.code+':'+(c.fabric&&c.fabric.code)+':'+(c.fabric&&c.fabric.actual)+':'+(c.fabric&&c.fabric.source)).join('|'),
     so:[so.fabric.code, so.fabric.actual, so.fabric.std, so.fabric.source, fabLines().find(l=>l.ref==='A-OLD').exportable].join(':'),
     sw:[sw.fabric.code, sw.fabric.edited, sw.fabric.actual, sw.fabric.source, sw.fabric.extras.map(x=>x.code+'='+x.actual).join()].join(':'), extra:fabSheetExtra.map(g=>g.ref+':'+g.metres).join(), sz:[sz.fabric.actual, fabLines().find(l=>l.ref==='S-ZERO').exportable, fabLines().find(l=>l.ref==='S-ZERO').metres].join(':'),
     lay:(()=>{const l=fabLines().find(x=>x.ref==='S-LAY'); return [l.actual, l.std, l.exportable, l.odd, fabOddLines().map(o=>o.ref).join()].join(':');})(),
     tile:[...document.querySelectorAll('.kpi-tile')].filter(e=>/Cut figures to check/.test(e.textContent)).map(e=>e.querySelector('.v').textContent)[0],
     oddTbl:[...document.querySelectorAll('#fabBody table')].some(tb=>/Cut figure/.test(tb.textContent))}; },
   [R('10/09/2026','S-B','3201',5,'PC14001',8), R('10/09/2026','S-B','3201',5,'MESH2290901',1), R('10/09/2026','S-C','0534',15,'CO5014DEN',10), R('10/09/2026','S-C','ZZNOUSAGE',2,'PC2001ECO',3),
    R('10/09/2026','A-OLD','0534',3,'CO5014DEN',4), R('10/09/2026','S-SWAP','0534',2,'CO5001ECO',1.5), R('10/09/2026','S-SWAP','0534',2,'MESH2290901',0.5), R('20/08/2026','A-A','0534',10,'CO5014DEN',7), R('11/09/2026','W/O 9999','0534',5,'PC2003ECO',12), R('11/09/2026','S-C','0534',15,'CO5083ECO','WASTE'), R('10/09/2026','S-ZERO','0534',2,'CO5014DEN','-'), R('10/09/2026','S-LAY','0534',10,'CO5014DEN',40), R('11/09/2026','SR0005','OHSTRAP',5,'PC90242',2), R('11/09/2026','EMB','DEVON','N/A','PC14001',5)].join('\n'));
 console.log('to do     ->', JSON.stringify(r2));
 // 2b. a figure already on a line that is far from the standard: listed, not ticked, not exportable; Standard drops it, Accept keeps it
 const r2b=await p.evaluate(()=>{ const was=fabTicked.slice(); const i=completedWOs.findIndex(x=>x.ref==='S-LAY'); completedWOs[i].fabric.actual=40; fabRender();
   const l=()=>fabLines().find(x=>x.ref==='S-LAY');
   const listed=fabOddLines().map(o=>o.ref+':'+Math.round(o.varPct)).join(), ex=l().exportable, tick=(fabTickAll(true), fabTickedLines().some(x=>x.ref==='S-LAY'));
   const tile=[...document.querySelectorAll('.kpi-tile')].filter(e=>/Cut figures to check/.test(e.textContent)).map(e=>e.querySelector('.v').textContent)[0];
   const rows=[...document.querySelectorAll('#fabBody table')].filter(tb=>/Cut figure/.test(tb.textContent)).map(tb=>tb.querySelectorAll('tbody tr').length)[0];
   fabVarAccept(i); const acc=[fabOddLines().length, l().exportable, completedWOs[i].fabric.actual].join(':');
   fabVarStd(i); const std=[fabOddLines().length, l().actual, l().exportable, l().metres].join(':');
   completedWOs[i].fabric.actual=40; fabVarStdAll(); const all=[fabOddLines().length, l().actual].join(':');
   fabTicked=was; fabRender();   // leave the tick list as the paste left it
   return {listed, ex, tick, tile, rows, acc, std, all}; });
 console.log('variance   ->', JSON.stringify(r2b));
 // 3. the export takes the sheet's figures; the extras file carries the unknown row with the sheet's W/O number
 const r3=await p.evaluate(async()=>{ let blob=null; URL.createObjectURL=b=>{blob=b; return 'blob:x';}; let dl=[]; HTMLAnchorElement.prototype.click=function(){ dl.push(this.download); };
   exportFabricWriteOff(); const csv=(await blob.text()).split('\r\n').filter(Boolean); exportSheetExtras(); const csv2=(await blob.text()).split('\r\n').filter(Boolean);
   return {csv:csv.slice(1).sort(), csv2, dl, left:fabSheetExtra.length, open:fabCompute().open.lines}; });
 console.log('export    ->', JSON.stringify(r3));
 // 4. a flagged live line lands on the ledger already exported; the state survives a reload; a viewer cannot run it
 await p.evaluate(()=>{ completeWholeWO(WOs.findIndex(w=>w.ref==='S-LIVE')); });
 await p.reload(); await p.waitForTimeout(400); await p.evaluate(stub);
 const r4=await p.evaluate(()=>{ window.now=()=>new Date('2026-09-21T10:00:00'); const l=completedWOs.find(x=>x.ref==='S-LIVE'), a=completedWOs.find(x=>x.ref==='A-A'), so=completedWOs.find(x=>x.ref==='A-OLD'), sz=completedWOs.find(x=>x.ref==='S-ZERO');
   return [fabState(l), l.fabricExportFile, fabState(a), a.fabric.actual, fabState(so), so.fabric.code, so.fabricExportFile, fabState(sz)].join(':'); });
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')); await p.waitForTimeout(400);
 const r5=await p.evaluate(()=>{ window.__alerts=[]; window.alert=m=>window.__alerts.push(m); loadState(); smShowTab('fabric'); fabLoadSheet('todo'); return (window.__alerts[0]||'')+'|'+document.querySelectorAll('#fabBody .btn').length; });
 console.log('reload    ->', r4, '| viewer:', r5);

 const pass = r2b.listed==='S-LAY:567' && r2b.ex===false && r2b.tick===false && r2b.tile==='1' && r2b.rows===1
   && r2b.acc==='0:true:40' && r2b.std==='0::true:6' && r2b.all==='0:'
   && t0==='WO-1131 WO-0554 WO-0503 S-OH115764-PT1 2026-09-10 2026-09-10 2026-09-10 S-OH115764-Pt1 S869335a+S869335 pt1 WO-0121 S-OH116079-Pt1 2026-07-27+2026-09-10 none 2026-07-27 WO-0505:7.5:2026-09-11:1/2/3:WASTE'
   && /3 rows → 3 works order \/ cloth pairs.*?\. 1 line marked Exported/.test(r1.res) && /1 line still live/.test(r1.res) && /1 not in the app/.test(r1.res) && /S-LATE.*another time/.test(r1.res)
   && r1.a==='exported:2026-08-20:Sage - cutting sheet:7' && r1.live==='2026-09-10:Sage - cutting sheet' && r1.open===6
   && /14 rows → 14 works order \/ cloth pairs.*?\. 6 lines set to the sheet's metres and ticked, 28\.0 m/.test(r2.res) && /2 records built for lines completed before/.test(r2.res) && /1 row on another cloth than the works order/.test(r2.res) && /2 rows with no metres/.test(r2.res) && /another row already gives this line its metres/.test(r2.res) && /2 rows for a manual write-off/.test(r2.res) && /1 row too far from the standard to use/.test(r2.res) && /standard 6\.00 m, sheet says 40\.00 m/.test(r2.res)
   && r2.lay===':6:true:false:' && r2.tile==='—' && !r2.oddTbl
   && /1 already complete in the ledger/.test(r2.res) && /1 not in the app/.test(r2.res) && /WO-9999.*no works order with this number/.test(r2.res)
   && r2.ticked==='A-OLD/OHAPP0534GD,S-B/OHCJMCHESHIRE3201,S-C/OHAPP0534GD,S-C/ZZNOUSAGE,S-SWAP/OHAPP0534GD,S-ZERO/OHAPP0534GD' && r2.n===6 && r2.sz==='0:true:0'
   && r2.sb==='8:1:9' && r2.sc==='OHAPP0534GD:CO5014DEN:10:All Costings|ZZNOUSAGE:PC2001ECO:3:Cutting sheet' && r2.so==='CO5014DEN:4:1.8:All Costings:true' && r2.sw==='CO5014DEN::1.5:All Costings:MESH2290901=0.5' && /further cloth added to 1 line/.test(r2.res) && r2.extra==='WO-9999:12'
   && r3.csv.join('|')==='CO5014DEN,HOME,,1.5,Cutting,S-SWAP,09/09/2026,Manual Reduction|CO5014DEN,HOME,,10,Cutting,S-C,08/09/2026,Manual Reduction|CO5014DEN,HOME,,4,Cutting,A-OLD,08/09/2026,Manual Reduction|MESH2290901,HOME,,0.5,Cutting,S-SWAP,09/09/2026,Manual Reduction|MESH2290901,HOME,,1,Cutting,S-B,01/09/2026,Manual Reduction|PC14001,HOME,,8,Cutting,S-B,01/09/2026,Manual Reduction|PC2001ECO,HOME,,3,Cutting,S-C,08/09/2026,Manual Reduction'
   && r3.csv2[1]==='PC2003ECO,HOME,,12,Cutting,WO-9999,11/09/2026,Manual Reduction' && r3.dl[0]==='Fabric_WriteOff_2026-09-21_1000.csv' && r3.dl[1]==='Fabric_WriteOff_2026-09-21_1000_sheet.csv' && r3.left===0 && r3.open===2
   && r4==='exported:Sage - cutting sheet:exported:7:exported:CO5014DEN:Fabric_WriteOff_2026-09-21_1000.csv:exported' && r5==='View-only mode.|0';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
