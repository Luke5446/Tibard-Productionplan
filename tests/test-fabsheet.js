// Catch-up from the cutting sheet. Works orders:
//   A-A   20 Aug  OHAPP0534GD x10 -> 6 m CO5014DEN, completed         (green on the sheet: 7 m cut)
//   S-B    1 Sep  OHCJMCHESHIRE3201 x5 -> 7.05 PC14001 + 0.51 mesh    (two sheet rows: 8 m + 1 m, to write off)
//   S-C    8 Sep  OHAPP0534GD x15 + ZZNOUSAGE x2                       (CO5014DEN 10 m; ZZNOUSAGE on PC2001ECO 3 m by style)
//   A-OLD  a line completed before the ledger existed (no fabric key)  (sheet: CO5014DEN 4 m -> record built)
//   S-SWAP OHAPP0534GD x2, sheet says CO5001ECO                         (the one line under the ref -> cloth changed)
//   S-LIVE OHAPP0534GD x15 still live                                   (green -> flagged; carried into the ledger on completion)
//   S-LATE OHAPP0534GD x1 completed 20 Jun, sheet row dated 10 Sep      (outside the window -> not placed)
//   W/O 9999 unknown, 12 m; S-C on a row with WASTE for metres
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const R=(date,ref,style,qty,code,m)=>T([date,'OH',ref,'B/APRON',style,String(qty),'TIAJO','P/C','X','APOLLO',code,String(m)]);
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
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
 await mk('S-LIVE','2026-09-10','OHAPP0534GD\t15',false);
 await p.evaluate(()=>{ var c=completedWOs.find(x=>x.ref==='A-OLD'); delete c.fabric; window.now=()=>new Date('2026-09-21T10:00:00'); smShowTab('fabric'); });
 // helpers on their own: refs, dates, grouping
 const t0=await p.evaluate(()=>[fabSheetRef('W/O 1131'),fabSheetRef('W/O/ 0554'),fabSheetRef('W/O 503'),fabSheetRef('S-OH115764-PT1'),fabSheetDate('10/09/2026'),fabSheetDate('10-Sep-26'),fabSheetDate('46275'),
   fabSheetFindRefs('S-OH115764-PT1',['S-OH115764-Pt1','S-OH115764-Pt2','S115764','WO-1157']).join('+'), fabSheetFindRefs('S869335',['S869335a','S869335 pt1','WO-8693']).join('+'), fabSheetFindRefs(fabSheetRef('W/O 121'),['WO-0121','WO-1210']).join('+'),
   fabSheetGroups(fabParseSheet('10/09/2026\tOH\tW/O 505\tX\tY\t1\tT\tP\tC\tN\tPC14001\t3\n11/09/2026\tOH\tW/O 505\tX\tY\t1\tT\tP\tC\tN\tPC14001\t4.5\n11/09/2026\tOH\tW/O 505\tX\tY\t1\tT\tP\tC\tN\tPC14001\tWASTE')).map(g=>g.ref+':'+g.metres+':'+g.date+':'+g.rows.join('/')+':'+g.mtxt.join()).join('|')].join(' '));
 console.log('helpers   ->', t0);
 // 1. green rows: A-A (7 m cut) and the live S-LIVE; S-LATE's row is dated 10 Sep - the June line is not it
 const r1=await p.evaluate(t=>{ fabToggleSheet(); document.getElementById('fabSheetTA').value=t; fabLoadSheet('done');
   const a=completedWOs.find(x=>x.ref==='A-A'), l=WOs.find(w=>w.ref==='S-LIVE').items[0];
   return {res:document.getElementById('fabSheetResult').textContent.replace(/\s+/g,' ').trim(), a:[fabState(a),a.fabricExportedAt,a.fabricExportFile,a.fabric.actual].join(':'), live:l.fabricExportedAt+':'+l.fabricExportFile, open:fabCompute().open.lines}; },
   [R('20/08/2026','A-A','0534',10,'CO5014DEN',7), R('10/09/2026','S-LIVE','0534',15,'CO5014DEN',9), R('10/09/2026','S-LATE','0534',1,'CO5014DEN',1)].join('\n'));
 console.log('green     ->', JSON.stringify(r1));
 // 2. the rest: S-B main + mesh, S-C by main code and by style (record built on PC2001ECO), A-OLD (record built), S-SWAP (cloth changed), A-A again (already), W/O 9999 (unknown), S-C WASTE row on another cloth
 const r2=await p.evaluate(t=>{ document.getElementById('fabSheetTA').value=t; fabLoadSheet('todo');
   const g=r=>completedWOs.find(x=>x.ref===r), sb=g('S-B'), sc=completedWOs.filter(x=>x.ref==='S-C'), so=g('A-OLD'), sw=g('S-SWAP');
   return {res:document.getElementById('fabSheetResult').textContent.replace(/\s+/g,' ').trim(), ticked:fabTickedLines().map(l=>l.ref+'/'+l.code).sort().join(','), n:fabCompute().ticked,
     sb:[sb.fabric.actual, sb.fabric.extras[0].actual, fabLines().find(l=>l.ref==='S-B').metres].join(':'),
     sc:sc.map(c=>c.code+':'+(c.fabric&&c.fabric.code)+':'+(c.fabric&&c.fabric.actual)+':'+(c.fabric&&c.fabric.source)).join('|'),
     so:[so.fabric.code, so.fabric.actual, so.fabric.std, so.fabric.source, fabLines().find(l=>l.ref==='A-OLD').exportable].join(':'),
     sw:[sw.fabric.code, sw.fabric.edited, sw.fabric.actual, sw.fabric.source, sw.fabric.extras.map(x=>x.code+'='+x.actual).join()].join(':'), extra:fabSheetExtra.map(g=>g.ref+':'+g.metres).join()}; },
   [R('10/09/2026','S-B','3201',5,'PC14001',8), R('10/09/2026','S-B','3201',5,'MESH2290901',1), R('10/09/2026','S-C','0534',15,'CO5014DEN',10), R('10/09/2026','S-C','ZZNOUSAGE',2,'PC2001ECO',3),
    R('10/09/2026','A-OLD','0534',3,'CO5014DEN',4), R('10/09/2026','S-SWAP','0534',2,'CO5001ECO',1.5), R('10/09/2026','S-SWAP','0534',2,'MESH2290901',0.5), R('20/08/2026','A-A','0534',10,'CO5014DEN',7), R('11/09/2026','W/O 9999','0534',5,'PC2003ECO',12), R('11/09/2026','S-C','0534',15,'CO5083ECO','WASTE')].join('\n'));
 console.log('to do     ->', JSON.stringify(r2));
 // 3. the export takes the sheet's figures; the extras file carries the unknown row with the sheet's W/O number
 const r3=await p.evaluate(async()=>{ let blob=null; URL.createObjectURL=b=>{blob=b; return 'blob:x';}; let dl=[]; HTMLAnchorElement.prototype.click=function(){ dl.push(this.download); };
   exportFabricWriteOff(); const csv=(await blob.text()).split('\r\n').filter(Boolean); exportSheetExtras(); const csv2=(await blob.text()).split('\r\n').filter(Boolean);
   return {csv:csv.slice(1).sort(), csv2, dl, left:fabSheetExtra.length, open:fabCompute().open.lines}; });
 console.log('export    ->', JSON.stringify(r3));
 // 4. a flagged live line lands on the ledger already exported; the state survives a reload; a viewer cannot run it
 await p.evaluate(()=>{ completeWholeWO(WOs.findIndex(w=>w.ref==='S-LIVE')); });
 await p.reload(); await p.waitForTimeout(400); await p.evaluate(stub);
 const r4=await p.evaluate(()=>{ window.now=()=>new Date('2026-09-21T10:00:00'); const l=completedWOs.find(x=>x.ref==='S-LIVE'), a=completedWOs.find(x=>x.ref==='A-A'), so=completedWOs.find(x=>x.ref==='A-OLD');
   return [fabState(l), l.fabricExportFile, fabState(a), a.fabric.actual, fabState(so), so.fabric.code, so.fabricExportFile].join(':'); });
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')); await p.waitForTimeout(400);
 const r5=await p.evaluate(()=>{ window.__alerts=[]; window.alert=m=>window.__alerts.push(m); loadState(); smShowTab('fabric'); fabLoadSheet('todo'); return (window.__alerts[0]||'')+'|'+document.querySelectorAll('#fabBody .btn').length; });
 console.log('reload    ->', r4, '| viewer:', r5);

 const pass = t0==='WO-1131 WO-0554 WO-0503 S-OH115764-PT1 2026-09-10 2026-09-10 2026-09-10 S-OH115764-Pt1 S869335a+S869335 pt1 WO-0121 WO-0505:7.5:2026-09-11:1/2/3:WASTE'
   && /3 rows → 3 works order \/ cloth pairs\. 1 line marked Exported/.test(r1.res) && /1 line still live/.test(r1.res) && /1 not in the app/.test(r1.res) && /S-LATE.*another time/.test(r1.res)
   && r1.a==='exported:2026-08-20:Sage - cutting sheet:7' && r1.live==='2026-09-10:Sage - cutting sheet' && r1.open===4
   && /10 rows → 10 works order \/ cloth pairs\. 5 lines set to the sheet's metres and ticked, 28\.0 m/.test(r2.res) && /2 records built from the sheet/.test(r2.res) && /cloth changed on 1 line/.test(r2.res)
   && /1 matched but no metres on the sheet/.test(r2.res) && /1 already complete in the ledger/.test(r2.res) && /1 not in the app/.test(r2.res) && /WO-9999.*no works order with this number/.test(r2.res)
   && r2.ticked==='A-OLD/OHAPP0534GD,S-B/OHCJMCHESHIRE3201,S-C/OHAPP0534GD,S-C/ZZNOUSAGE,S-SWAP/OHAPP0534GD' && r2.n===5
   && r2.sb==='8:1:9' && r2.sc==='OHAPP0534GD:CO5014DEN:10:All Costings|ZZNOUSAGE:PC2001ECO:3:Cutting sheet' && r2.so==='CO5014DEN:4::Cutting sheet:true' && r2.sw==='CO5001ECO:true:1.5:All Costings · cutting sheet:MESH2290901=0.5' && /second cloth added to 1 line/.test(r2.res) && r2.extra==='WO-9999:12'
   && r3.csv.join('|')==='CO5001ECO,HOME,,1.5,Cutting,S-SWAP,09/09/2026,Manual Reduction|CO5014DEN,HOME,,10,Cutting,S-C,08/09/2026,Manual Reduction|CO5014DEN,HOME,,4,Cutting,A-OLD,08/09/2026,Manual Reduction|MESH2290901,HOME,,0.5,Cutting,S-SWAP,09/09/2026,Manual Reduction|MESH2290901,HOME,,1,Cutting,S-B,01/09/2026,Manual Reduction|PC14001,HOME,,8,Cutting,S-B,01/09/2026,Manual Reduction|PC2001ECO,HOME,,3,Cutting,S-C,08/09/2026,Manual Reduction'
   && r3.csv2[1]==='PC2003ECO,HOME,,12,Cutting,WO-9999,11/09/2026,Manual Reduction' && r3.dl[0]==='Fabric_WriteOff_2026-09-21_1000.csv' && r3.dl[1]==='Fabric_WriteOff_2026-09-21_1000_sheet.csv' && r3.left===0 && r3.open===1
   && r4==='exported:Sage - cutting sheet:exported:7:exported:CO5014DEN:Fabric_WriteOff_2026-09-21_1000.csv' && r5==='View-only mode.|0';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
