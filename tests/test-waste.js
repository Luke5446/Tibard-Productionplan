// Waste on completion (Luke, 16 Oct 2026): 200 on the works order and 10
// spoiled in the making. The PM types the 10 in the Waste box on the works
// order panel before Complete whole WO: 190 are booked in as made, the 10
// stay on the record, and the cloth for all 200 is still written off. A box
// over the quantity, or not a whole number, stops the completion; a blank
// box is no waste; the card's Complete whole WO has no box and books the
// lot; an undo puts the whole 200 back; the record survives a reload; and
// a viewer sees no box.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=T(['APP300503','BLACK BIB APRON','40','120','0','30','90','160','300']);
const URL='file://'+require('path').join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext(); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.route('https://**', r=>r.fulfill({status:404, body:'nf'}));
 const open=async(edit)=>{ await p.goto(URL+(edit?'?edit':'')); await p.waitForTimeout(400); await p.evaluate(()=>{ window.now=()=>new Date('2026-10-16T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); window.open=()=>({document:{open(){},write(){},close(){}}}); }); await p.waitForTimeout(600); };
 const out={};
 await open(true);
 out.done=await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste();
   const mk=(ref,qty)=>{ document.getElementById('woRef').value=ref; document.getElementById('woStart').value='2026-10-10'; document.getElementById('woDue').value='2026-10-20'; document.getElementById('woTA').value='APP300503\t'+qty; saveWO(); };
   mk('S-W',200); mk('S-X',20); mk('S-Y',30);
   const i=WOs.findIndex(w=>w.ref==='S-W'), std200=fabricRecordFor({code:'APP300503', qty:200}, WOs[i]).std;
   openWOModal(i);
   const box=document.getElementById('woModalWaste-0'), th=[...document.querySelectorAll('#woModal thead th')].map(x=>x.textContent.trim());
   box.value='10'; document.getElementById('woModalCompleteAll').click();
   const c=completedWOs.find(x=>x.ref==='S-W');
   renderCompleted(); const row=[...document.querySelectorAll('#completedBody tr')].find(tr=>/S-W/.test(tr.textContent));
   const led=fabLines().find(l=>l.ref==='S-W');
   return {box:!!box, th:th, gone:!WOs.some(w=>w.ref==='S-W'), rec:[c.qty, c.waste, c.fabric.std, c.fabric.std===std200], row:(row?row.textContent:'').replace(/\s+/g,' ').trim(), led:[led.qty, led.waste, led.std], alerts:window.__alerts.length}; }, buf);
 // the boxes that stop a completion, and the blank one that is no waste
 out.checks=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-X'); openWOModal(i); const box=document.getElementById('woModalWaste-0'), btn=document.getElementById('woModalCompleteAll');
   box.value='25'; btn.click(); const over=[WOs.some(w=>w.ref==='S-X'), window.__alerts[0]||''];
   box.value='2.5'; btn.click(); const frac=[WOs.some(w=>w.ref==='S-X'), window.__alerts[1]||''];
   box.value=''; btn.click(); const c=completedWOs.find(x=>x.ref==='S-X');
   return {over:over, frac:frac, blank:[!WOs.some(w=>w.ref==='S-X'), c.qty, c.waste===undefined, window.__alerts.length]}; });
 // the card's button books the lot; an undo puts the whole line back
 out.card=await p.evaluate(()=>{ closeWOModal(); completeWholeWO(WOs.findIndex(w=>w.ref==='S-Y')); const c=completedWOs.find(x=>x.ref==='S-Y');
   undoCompleted(completedWOs.findIndex(x=>x.ref==='S-W')); const w=WOs.find(x=>x.ref==='S-W');
   return {y:[c.qty, c.waste===undefined], back:w.items[0].qty, stillX:completedWOs.some(x=>x.ref==='S-X')}; });
 // the record survives a reload, and the Fabric tab shows the waste
 await open(true);
 out.reload=await p.evaluate(()=>{ const w=WOs.find(x=>x.ref==='S-W'), i=WOs.indexOf(w); openWOModal(i); document.getElementById('woModalWaste-0').value='7'; document.getElementById('woModalCompleteAll').click(); return completedWOs.filter(x=>x.ref==='S-W').map(c=>[c.qty, c.waste]); });
 await open(true);
 out.reload2=await p.evaluate(()=>{ const c=completedWOs.find(x=>x.ref==='S-W'); smShowTab('fabric'); fabOpen.showAll=true; fabOpen.mon[monthKey(c.completed)]=true; fabOpen.day[c.completed]=true; fabRender(); const txt=document.body.textContent.replace(/\s+/g,' ');
   return [c.qty, c.waste, /\+7 waste/.test(txt)]; });
 // a viewer: no box
 await open(false);
 out.viewer=await p.evaluate(()=>{ openWOModal(0); const th=[...document.querySelectorAll('#woModal thead th')].find(x=>/Waste/.test(x.textContent)); return {th:!!th, hidden:th?getComputedStyle(th).display==='none':null, box:!!document.getElementById('woModalWaste-0')}; });

 console.log(JSON.stringify(out, null, 1));
 const ok=[
  out.done.box && out.done.th.indexOf('Waste')===out.done.th.indexOf('Action')-1 && out.done.gone && out.done.rec[0]===190 && out.done.rec[1]===10 && out.done.rec[3] && /190\+10 waste/.test(out.done.row) && out.done.led.join()==='190,10,'+out.done.rec[2] && out.done.alerts===0,
  out.checks.over[0] && /25 waste is more than the 20/.test(out.checks.over[1]) && out.checks.frac[0] && /whole number/.test(out.checks.frac[1]) && out.checks.blank.join()==='true,20,true,2',
  out.card.y.join()==='30,true' && out.card.back===200 && out.card.stillX,
  out.reload.join('|')==='193,7' && out.reload2.join()==='193,7,true',
  out.viewer.th && out.viewer.hidden===true && !out.viewer.box,
  errs.length===0 ];
 console.log(ok.every(Boolean)?'ALL PASS':'FAIL '+ok.map((v,i)=>v?'':i).filter(x=>x!=='').join(','), errs);
 await b.close(); process.exit(ok.every(Boolean)?0:1);
})();
