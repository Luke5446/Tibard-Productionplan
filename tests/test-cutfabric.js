// Sort by fabric on the Cutting tab (Luke, 26 Oct 2026): the To cut list
// grouped by fabric, biggest run first, with the running metres down each
// group and a marker where they pass each 100 m (a full roll is 100 to
// 120 m), so the cutter sees what cuts in a row off one roll. The button
// flips the view; the Printed heading brings the list back. The running
// figures must never be written onto the log entries themselves.
const { chromium } = require('playwright');
const path = require('path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; let fails=0;
 const ck=(n,ok,x)=>{ if(ok) console.log('  ok -',n); else { fails++; console.log('  FAIL -',n,x==null?'':JSON.stringify(x)); } };
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.route('https://api.github.com/**', r=>r.fulfill({status:404, body:'{}'}));
 await p.route('https://luke5446.github.io/Tibard-Cutlog/**', r=>r.fulfill({status:404, body:''}));
 await p.goto('file://'+path.join(__dirname,'..','index.html')); await p.waitForTimeout(450);
 const r=await p.evaluate(()=>{
   window.now=()=>new Date('2026-10-26T10:00:00');
   const L=(ref,code,fab,std,printed,extra)=>({k:ref+'|'+code+'|'+fab, ref, code, desc:code+' desc', qty:10, fabric:fab, fabName:fab?'Cloth '+fab:'', std, printedAt:printed, due:'2026-11-10', extra:!!extra});
   cutLog.entries=[ L('W1','CJ1','PC2001','60.00','2026-10-20'), L('W2','CJ2','PC2001','50.00','2026-10-21'), L('W3','CJ3','PC2001','30.00','2026-10-19'),
     L('W4','AP1','AP9000','12.50','2026-10-22'), L('W5','CT1','','8.00','2026-10-22'), L('W1','M1','MESH1','5.00','2026-10-20',true) ];
   cutLog.entries.forEach(e=>{ e.std=+e.std; });
   cutLog.loadedAt=new Date(); cutLog.error='';
   try{ localStorage.setItem('tibard_cutlog_token','tok'); }catch(e){}
   smShowTab('cut'); cutSec='todo'; cutQ=''; cutSortKey='printed'; cutSortDesc=false; cutRender();
   const rows=()=>[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')];
   const o={};
   o.btn=(document.getElementById('cutFabBtn')||{}).textContent||''; o.btnOn=document.getElementById('cutFabBtn').classList.contains('on');
   o.plainRows=rows().length; o.plainFab=!document.querySelector('#cutBody .cut-byfab');
   document.getElementById('cutFabBtn').click();
   o.on=document.getElementById('cutFabBtn').classList.contains('on') && !!document.querySelector('#cutBody .cut-byfab');
   o.groups=rows().filter(tr=>tr.classList.contains('cut-fab')).map(tr=>tr.textContent.replace(/\s+/g,' ').trim());
   o.lines=rows().filter(tr=>!tr.classList.contains('cut-fab')).map(tr=>[tr.children[0].querySelector('strong').textContent, tr.children[6].textContent.trim(), tr.children[7].textContent.replace(/\s+/g,' ').trim(), tr.classList.contains('cut-roll')]); o.fabCol=rows().filter(tr=>!tr.classList.contains('cut-fab')).map(tr=>tr.children[5].querySelector('span').textContent.trim());
   o.marks=document.querySelectorAll('#cutBody .cut-byfab input[data-cutm]').length;
   o.head=document.querySelector('#cutBody .cut-tbl thead').textContent.replace(/\s+/g,' ').trim();
   o.clean=cutLog.entries.every(e=>!('_run' in e) && !('run' in e) && !('roll' in e));
   const gs=cutFabricGroups(cutLog.entries); o.rolls=gs.map(g=>(g.fabric||'none')+':'+g.metres+':'+g.rolls);
   document.querySelector('#cutBody .cut-tbl thead th:nth-child(2)').click();
   o.back=cutSortKey==='printed' && !document.querySelector('#cutBody .cut-byfab') && !document.getElementById('cutFabBtn').classList.contains('on');
   cutQ='AP9000'; cutRender(); document.getElementById('cutFabBtn').click(); o.searched=rows().filter(tr=>!tr.classList.contains('cut-fab')).length;
   cutQ=''; cutSortKey='printed'; cutRender(); try{ localStorage.removeItem('tibard_cutlog_token'); }catch(e){}
   return o;
 });
 ck('the button is there, off, and the plain list is by works order', /Sort by fabric/.test(r.btn) && !r.btnOn && r.plainFab && r.plainRows===6, [r.btn, r.btnOn, r.plainRows]);
 ck('click: grouped by fabric, biggest run first, no fabric last', r.on && r.groups.length===4 && /^PC2001/.test(r.groups[0]) && /^AP9000/.test(r.groups[1]) && /^MESH1/.test(r.groups[2]) && /^no fabric on file/.test(r.groups[3]), r.groups);
 ck('the group heading carries works orders, lines, metres and the rolls', /3 works orders · 3 lines · 140\.00 m · about 1\.2 to 1\.4 rolls/.test(r.groups[0]) && /1 works order · 1 line · 12\.50 m · fits on one roll/.test(r.groups[1]), r.groups);
 ck('running metres down the group, oldest printed first, and the roll marker where they pass 100 m', JSON.stringify(r.lines.slice(0,3))===JSON.stringify([['W3','30.00','30.00',false],['W1','60.00','90.00',false],['W2','50.00','140.00 roll 2',true]]), r.lines);
 ck('the fabric code is on every row (Luke, 26 Oct 2026)', r.fabCol.join()==='PC2001,PC2001,PC2001,AP9000,MESH1,no fabric on file' && /QtyFabricStd mRunning m/.test(r.head), [r.fabCol, r.head]);
 ck('the mark boxes are still on every line', r.marks===6 && /Running m/.test(r.head), [r.marks, r.head]);
 ck('nothing written onto the log entries', r.clean, r.clean);
 ck('cutFabricGroups: metres and rolls', r.rolls.join()==='PC2001:140:about 1.2 to 1.4 rolls,AP9000:12.5:fits on one roll,MESH1:5:fits on one roll,none:8:fits on one roll', r.rolls);
 ck('the Printed heading brings the list back', r.back, r.back);
 ck('the search still narrows the grouped list', r.searched===1, r.searched);
 ck('no page errors', !errs.length, errs);
 await b.close(); console.log(fails?'FAILED '+fails:'all ok'); process.exit(fails?1:0);
})();
