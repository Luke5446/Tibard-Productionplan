// The cutting room's stock take. GitHub is stood in for by an in-memory
// store per file (cutlog.json, warehouse.json, stocktake.json). Three
// fabrics with stock on the Sage sheet; one live works order cut on the log
// (so To hand is Sage less the cut), one completed and not written off.
//   Wed 14 Oct: the cutting PC draws two, counts one short (write-off), one
//   over (add stock); an ad hoc check is asked for and counted to match.
//   The PM: a note and a tick, a recount sent back and counted again, the
//   two files out in the Sage layouts, the matched one closed, the audit
//   workbook a real .xlsx with every count and the schedule.
const { chromium } = require('playwright');
const fs=require('fs'), path=require('path');
const T=(a)=>a.join('\t');
const URL='file://'+path.join(__dirname,'..','index.html');
const sheet=[
 T(['CO5014DEN','MURRAY LT GREY DENIM','Metre','TIA001EU','Tiajo Comercio','TJ-DEN-14','1500','0','0','10','12','50','6.71','0']),
 T(['PC14001','WHITE COOLTEX 1','Metre','TIAJO','Tiajo Textiles','TJ-CT-1','80','0','20','0','0','0','3.09','14']),
 T(['POPLAZA03','BLACK PLAZA','Metre','CARR','Carrington','','30','0','0','0','0','0','2.10','7']),
 T(['ZZEMPTY','NOTHING HELD','Metre','CARR','Carrington','','0','0','0','0','0','0','2.10','7']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext(); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const store={}, shas={}; let puts=0;
 const enc=s=>Buffer.from(s,'utf8').toString('base64'), dec=s=>Buffer.from(s,'base64').toString('utf8');
 const st=()=>store['stocktake.json']?JSON.parse(store['stocktake.json']).entries:[];
 await p.route('https://api.github.com/**', async route=>{
   const req=route.request(), file=req.url().split('/contents/')[1].split('?')[0];
   if(req.method()==='GET'){ if(!store[file]) return route.fulfill({status:404, contentType:'application/json', body:'{"message":"Not Found"}'}); return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:enc(store[file]), sha:'sha'+(shas[file]||0)})}); }
   if(req.method()==='PUT'){ puts++; const body=JSON.parse(req.postData()); if(store[file] && body.sha!=='sha'+(shas[file]||0)) return route.fulfill({status:409, contentType:'application/json', body:'{"message":"sha mismatch"}'});
     store[file]=dec(body.content); shas[file]=(shas[file]||0)+1; return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:{sha:'sha'+shas[file]}, commit:{message:body.message}})}); }
   route.fulfill({status:405, body:''}); });
 await p.route('https://luke5446.github.io/Tibard-Cutlog/**', route=>{ const file=route.request().url().split('/Tibard-Cutlog/')[1].split('?')[0]; if(!store[file]) return route.fulfill({status:404, body:'not found'}); route.fulfill({status:200, contentType:'application/json', body:store[file]}); });
 const open=async(edit, token, day)=>{ await p.goto(URL+(edit?'?edit':'')); await p.waitForTimeout(400);
   await p.evaluate(([tok,d])=>{ window.now=()=>new Date(d+'T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); window.__files=[];
     const _c=URL.createObjectURL; URL.createObjectURL=b=>{ window.__files.push(b); return 'blob:stub'; }; window.__dl=[]; HTMLAnchorElement.prototype.click=function(){ window.__dl.push(this.download); };
     if(tok) localStorage.setItem('tibard_cutlog_token', tok); else localStorage.removeItem('tibard_cutlog_token'); }, [token, day]); };

 // ── the editor sets the scene: Sage sheet, a works order printed and marked cut, a completed line, then publishes ──
 await open(true,'tok-editor','2026-10-14');
 await p.evaluate(sheet=>{ document.getElementById('fabTA').value=sheet; fabLoadStockPaste();
   const mk=(ref,ta)=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-10-12'; document.getElementById('woDue').value='2026-10-20'; document.getElementById('woTA').value=ta; saveWO(); };
   mk('S-DONE','OHAPP0534GD\t10'); completeWholeWO(WOs.findIndex(w=>w.ref==='S-DONE'));   // 10 x 0.6 = 6 m of CO5014DEN, completed, not written off
   mk('S-LIVE','OHAPP0534GD\t15'); window.open=()=>({document:{open(){},write(){},close(){}}}); markWOPrinted(WOs.findIndex(w=>w.ref==='S-LIVE')); }, sheet);
 await p.waitForTimeout(700);
 await p.evaluate(()=>{ smShowTab('cut'); });
 await p.waitForTimeout(300);
 await p.evaluate(()=>{ const k=cutLog.entries.find(e=>e.ref==='S-LIVE').k; document.querySelector('[data-cutm="'+k+'"]').value='1000'; document.querySelector('[data-cutn="'+k+'"]').value='whole lay'; cutMark(k); });
 await p.waitForTimeout(600);
 // save the state as data.json for the cutting PC to read
 const pub=await p.evaluate(()=>{ saveState(); return localStorage.getItem('tibard_production_state'); });
 const s0=await p.evaluate(()=>{ const x=fabStockCompute().list.find(r=>r.code==='CO5014DEN'); return [x.inSage,x.cutLive,x.cut,x.toHand, Math.abs(x.toHand-(x.inSage-x.cutLive-x.cut))<0.006].join(':'); });
 console.log('CO5014DEN sage:cutLive:notWO:toHand ->', s0);

 // ── the cutting PC (token, not the editor): Wednesday's draw is saved, the list shows To hand ──
 await open(false,'tok-cutting','2026-10-14');
 await p.evaluate(s=>{ localStorage.setItem('tibard_production_state', s); loadState(); }, pub);
 await p.evaluate(()=>{ smShowTab('cut'); cutSec='stock'; cutRender(); });
 await p.waitForTimeout(900);
 await p.evaluate(()=>{ cutRender(); });
 const c1=await p.evaluate(()=>{ const rows=[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].filter(tr=>tr.querySelector('[data-stm]'));
   return {held:stHeld().map(r=>r.code).join(), picks:stLog.entries.filter(e=>e.kind==='pick').map(e=>e.day+':'+e.code+':'+e.abc).sort(), rows:rows.length, chip:document.querySelector('#cutBody .fab-chip.on').textContent.trim(),
     toHand:rows.map(tr=>tr.children[0].querySelector('span').textContent+'='+tr.children[2].firstChild.textContent).join('|'), same:stDraw('2026-10-15').map(p=>p.code).join()===stDraw('2026-10-15').map(p=>p.code).join(), fri:stDraw('2026-10-16').length}; });
 console.log('cutting list ->', JSON.stringify(c1));
 // count the two: the first short by 20, the second over by 5; ask for an ad hoc check of the third and count it to match
 const picks=c1.picks.map(x=>x.split(':')[1]);
 const count=async(code, m, note)=>{ await p.evaluate(([code,m,note])=>{ const k=stPending().find(x=>x.code===code).k; document.querySelector('[data-stm="'+k+'"]').value=m; document.querySelector('[data-stn="'+k+'"]').value=note; stCount(k); }, [code,m,note]); await p.waitForTimeout(600); };
 const expect=await p.evaluate(codes=>codes.map(c=>c+'='+stExpected(c).toHand), picks);
 await count(picks[0], (await p.evaluate(c=>stExpected(c).toHand, picks[0]))-20, 'two rolls short');
 await count(picks[1], (await p.evaluate(c=>stExpected(c).toHand, picks[1]))+5, '');
 const third=['CO5014DEN','PC14001','POPLAZA03'].filter(c=>!picks.includes(c))[0];
 await p.evaluate(c=>{ stQ=c.slice(0,4).toLowerCase(); cutRender(); }, third);
 const ah=await p.evaluate(()=>[...document.querySelectorAll('#cutBody button')].filter(b=>/Stock check/.test(b.textContent)).length);
 await p.evaluate(c=>stAdhoc(c), third); await p.waitForTimeout(600);
 await count(third, await p.evaluate(c=>stExpected(c).toHand, third), '');
 const c2=await p.evaluate(()=>{ stQ=''; cutRender(); return {pending:stPending().length, counts:stCounts().map(e=>e.code+':'+e.why+':'+e.counted+':'+e.diff+':'+(e.expected.toHand)).sort(), recent:document.querySelectorAll('#cutBody .kpi-sec table tbody tr').length,
   adhocDone:stLog.entries.filter(e=>e.kind==='adhoc').map(e=>!!e.doneK).join()}; });
 console.log('counted ->', JSON.stringify(c2), 'expected', expect.join(' '), 'adhoc buttons', ah);

 // ── the PM on the Cutting review tab: three to check; a note and tick on the short one, a recount on the over one ──
 await open(true,'tok-editor','2026-10-14');
 await p.evaluate(s=>{ localStorage.setItem('tibard_production_state', s); loadState(); }, pub);
 await p.evaluate(()=>{ smShowTab('cutrev'); }); await p.waitForTimeout(900); await p.evaluate(()=>cutRevRender());
 const r1=await p.evaluate(()=>{ const t=[...document.querySelectorAll('#cutRevBody table')][0]; return {onList:(document.getElementById('cutRevBody').textContent.match(/\d+ on the cutting room's list, oldest from [0-9]+ [A-Za-z]+ [0-9]{4}/)||[''])[0], badge:document.getElementById('cutRevCount').textContent, rows:t.querySelectorAll('tbody tr').length,
   adjust:[...t.querySelectorAll('tbody tr')].map(tr=>tr.children[1].querySelector('span').textContent+'='+tr.children[7].textContent.trim()).sort().join('|'), heads:[...t.querySelectorAll('th')].map(x=>x.textContent).join('|')}; });
 console.log('review ->', JSON.stringify(r1));
 const shortK=await p.evaluate(()=>stOpenCounts().find(e=>e.diff<0).k), overK=await p.evaluate(()=>stOpenCounts().find(e=>e.diff>0).k), matchK=await p.evaluate(()=>stOpenCounts().find(e=>e.diff===0).k);
 await p.evaluate(k=>stPmNote(k,'WO-ST-101'), shortK); await p.waitForTimeout(500);
 await p.evaluate(k=>stPmOk(k,true), shortK); await p.waitForTimeout(500);
 await p.evaluate(k=>{ window.prompt=()=>'check the back shelf'; stRecount(k); }, overK); await p.waitForTimeout(600);
 const r2=await p.evaluate(()=>({open:stOpenCounts().length, pending:stPending().map(x=>x.kind+':'+x.code+':'+x.note).join(), note:stLog.entries.find(e=>e.pmNote).pmNote, ok:stLog.entries.filter(e=>e.pmOk).length}));
 console.log('pm marks ->', JSON.stringify(r2));
 // the cutting PC sees the recount and counts again, this time matching
 await open(false,'tok-cutting','2026-10-15');
 await p.evaluate(s=>{ localStorage.setItem('tibard_production_state', s); loadState(); }, pub);
 await p.evaluate(()=>{ smShowTab('cut'); cutSec='stock'; cutRender(); }); await p.waitForTimeout(900); await p.evaluate(()=>cutRender());
 const c3=await p.evaluate(()=>{ const re=stPending().find(x=>x.kind==='recount'); return {list:stPending().map(x=>x.kind+':'+x.code).sort().join(), reason:[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].map(tr=>tr.children[1].textContent).filter(t=>/Recount/.test(t)).join(), thu:stLog.entries.filter(e=>e.kind==='pick'&&e.day==='2026-10-15').length}; });
 const overCode=await p.evaluate(()=>stPending().find(x=>x.kind==='recount').code);
 await count(overCode, await p.evaluate(c=>stExpected(c).toHand, overCode), 'found it, back shelf');
 const c4=await p.evaluate(()=>({recounted:stLog.entries.filter(e=>e.recountedBy).length, newCount:stCounts().filter(e=>e.why==='recount').map(e=>e.code+':'+e.diff+':'+!!e.recountOf).join()}));
 console.log('recount ->', JSON.stringify(c3), JSON.stringify(c4));

 // ── the PM exports: the short one to the write-off file; the two matched ones ticked and closed; nothing to add ──
 await open(true,'tok-editor','2026-10-15');
 await p.evaluate(s=>{ localStorage.setItem('tibard_production_state', s); loadState(); }, pub);
 await p.evaluate(()=>{ smShowTab('cutrev'); }); await p.waitForTimeout(900);
 const ks=await p.evaluate(()=>stOpenCounts().filter(e=>e.diff===0).map(e=>e.k));
 for(const k of ks){ await p.evaluate(k=>stPmOk(k,true), k); await p.waitForTimeout(500); }
 await p.evaluate(()=>stExport('WriteOff')); await p.waitForTimeout(700);
 const x1=await p.evaluate(async()=>{ const f=window.__files[0]; const txt=f?await f.text():''; return {dl:window.__dl.slice(), txt:txt, open:stOpenCounts().length, closed:stCounts().filter(e=>e.closedAt).map(e=>e.code+':'+e.closedHow+':'+(e.exportFile||'')).sort(), alert:window.__alerts.slice(-1)[0]}; });
 console.log('write-off ->', JSON.stringify(x1));
 await p.evaluate(()=>{ window.__files=[]; window.__dl=[]; stExport('AddStock'); }); await p.waitForTimeout(400);
 const x2=await p.evaluate(()=>({dl:window.__dl.length, alert:window.__alerts.slice(-1)[0]}));
 // an over count ticked goes to the add-stock file: count the third fabric over by 2.5 on the cutting PC first
 await open(false,'tok-cutting','2026-10-19');
 await p.evaluate(s=>{ localStorage.setItem('tibard_production_state', s); loadState(); }, pub);
 await p.evaluate(()=>{ smShowTab('cut'); cutSec='stock'; cutRender(); }); await p.waitForTimeout(900); await p.evaluate(()=>cutRender());
 const monPicks=await p.evaluate(()=>stPending().filter(x=>x.kind==='pick').map(x=>x.code));
 await count(monPicks[0], (await p.evaluate(c=>stExpected(c).toHand, monPicks[0]))+2.5, 'extra roll');
 await open(true,'tok-editor','2026-10-19');
 await p.evaluate(s=>{ localStorage.setItem('tibard_production_state', s); loadState(); }, pub);
 await p.evaluate(()=>{ smShowTab('cutrev'); }); await p.waitForTimeout(900);
 await p.evaluate(()=>{ const e=stOpenCounts().find(x=>x.diff>0); stPmNote(e.k,'ADJ-7'); }); await p.waitForTimeout(500);
 await p.evaluate(()=>{ const e=stOpenCounts().find(x=>x.diff>0); stPmOk(e.k,true); }); await p.waitForTimeout(500);
 await p.evaluate(()=>{ window.__files=[]; window.__dl=[]; stExport('AddStock'); }); await p.waitForTimeout(700);
 const x3=await p.evaluate(async()=>{ const f=window.__files[0]; return {dl:window.__dl.slice(), txt:f?await f.text():'', open:stOpenCounts().length, onList:(document.getElementById('cutRevBody').textContent.match(/\d+ on the cutting room's list, oldest from [0-9]+ [A-Za-z]+ [0-9]{4}/)||[''])[0]}; });
 console.log('add stock ->', JSON.stringify(x2), JSON.stringify(x3));

 // ── the audit workbook: a real zip Excel opens, both sheets, every count ──
 await p.evaluate(()=>{ window.__files=[]; window.__dl=[]; stOpen.mon={}; stOpen.sched=true; cutRevRender(); });
 const rep=await p.evaluate(async()=>{ const r=stReport(); const f=window.__files[0]; const buf=new Uint8Array(await f.arrayBuffer()); let s=''; for(let i=0;i<buf.length;i++) s+=String.fromCharCode(buf[i]); return {name:r.name, counts:r.counts, fabrics:r.fabrics, dl:window.__dl[0], type:f.type, b64:btoa(s), hist:document.querySelectorAll('#cutRevBody .sm-bh').length, sched:[...document.querySelectorAll('#cutRevBody table')].slice(-1)[0].querySelectorAll('tbody tr').length}; });
 const out=path.join(__dirname,'out'); fs.mkdirSync(out,{recursive:true}); const xp=path.join(out,'stocktake-audit.xlsx'); fs.writeFileSync(xp, Buffer.from(rep.b64,'base64'));
 const unz=require('child_process').spawnSync('python3',['-I','-c',`
import zipfile,sys,re
z=zipfile.ZipFile(sys.argv[1]); print('ok' if z.testzip() is None else 'bad'); n=z.namelist(); print(len(n))
s1=z.read('xl/worksheets/sheet1.xml').decode(); s2=z.read('xl/worksheets/sheet2.xml').decode()
print(s1.count('<row '), s2.count('<row '), 'Counted on' in s1, 'two rolls short' in s1, 'WO-ST-101' in s1, 'Written off' in s1, 'Sent for recount' in s1, 'Class' in s2)
`, xp], {encoding:'utf8'});
 console.log('report ->', JSON.stringify({name:rep.name, counts:rep.counts, fabrics:rep.fabrics, dl:rep.dl, type:rep.type, hist:rep.hist, sched:rep.sched}), unz.stdout.trim().replace(/\n/g,' | '), unz.stderr.trim());

 // ── a viewer with no token: the list shows, no boxes, nothing saved ──
 const putsBefore=puts;
 await open(false,'','2026-10-20');
 await p.evaluate(s=>{ localStorage.setItem('tibard_production_state', s); loadState(); }, pub);
 await p.evaluate(()=>{ smShowTab('cut'); cutSec='stock'; cutRender(); }); await p.waitForTimeout(900); await p.evaluate(()=>cutRender());
 const v=await p.evaluate(()=>({inputs:document.querySelectorAll('#cutBody [data-stm]').length, draw:[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')].filter(tr=>/today's draw/.test(tr.textContent)).length}));
 console.log('viewer ->', JSON.stringify(v), 'puts', puts-putsBefore);

 const unzOk=unz.stdout.trim().split('\n');
 const pass = /^1500:1000:5\.57:494\.43\d*:true$/.test(s0) && c1.held==='CO5014DEN,PC14001,POPLAZA03' && c1.picks.length===2 && c1.picks.every(x=>/^2026-10-14:/.test(x)) && c1.rows===2 && /Stock take2$/.test(c1.chip) && c1.same && c1.fri===0
   && c2.pending===0 && c2.counts.length===3 && c2.counts.some(x=>/:pick:.*:-20:/.test(x)) && c2.counts.some(x=>/:pick:.*:5:/.test(x)) && c2.counts.some(x=>new RegExp('^'+third+':adhoc:.*:0:').test(x)) && c2.recent===3 && c2.adhocDone==='true' && ah===1
   && r1.badge==='3' && r1.onList==='' && x3.onList==='2 on the cutting room\'s list, oldest from 15 Oct 2026' && r1.rows===3 && /=write off 20.0 m/.test(r1.adjust) && /=add 5.0 m/.test(r1.adjust) && /=matches/.test(r1.adjust) && /Adjust Sage by\|Cutting room\|PM comment/.test(r1.heads)
   && r2.open===2 && /^recount:.*:check the back shelf$/.test(r2.pending) && r2.note==='WO-ST-101' && r2.ok===1
   && c3.list.split(',').filter(x=>/^pick:/.test(x)).length===2 && /Recount/.test(c3.reason) && c3.thu===2 && c4.recounted===1 && c4.newCount===overCode+':0:true'
   && x1.dl.length===1 && /^StockTake_WriteOff_2026-10-15_\d{4}\.csv$/.test(x1.dl[0]) && x1.txt==='StockCode,Location,Bin,Qty,Reference1,Reference2,ActivityDate,WriteOffCat\r\n'+picks[0]+',HOME,,20,Stock Take,WO-ST-101,15/10/2026,Manual Reduction\r\n'
   && x1.open===0 && x1.closed.length===3 && x1.closed.filter(x=>/:matched:$/.test(x)).length===2 && x1.closed.some(x=>new RegExp('^'+picks[0]+':writeoff:StockTake_WriteOff').test(x))
   && x2.dl===0 && /Tick the counts/.test(x2.alert) && x3.dl.length===1 && /^StockTake_AddStock_2026-10-19_\d{4}\.csv$/.test(x3.dl[0]) && x3.txt==='StockCode,Location,Bin,Qty,StockExported,Reference1\r\n'+monPicks[0]+',Home,,2.5,,Stock Take ADJ-7\r\n' && x3.open===0
   && rep.counts===5 && rep.fabrics===3 && rep.dl==='StockTake_Audit_2026-10-19.xlsx' && /spreadsheetml/.test(rep.type) && rep.sched===3 && unzOk[0]==='ok' && unzOk[1]==='6' && unzOk[2]==='6 4 True True True True True True'
   && v.inputs===0 && v.draw===1 && puts-putsBefore===0;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
