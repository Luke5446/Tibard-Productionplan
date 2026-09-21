// The fabric on a works order line can be changed by hand, live or booked in.
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-21T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });
 await p.evaluate(()=>{ document.getElementById('woRef').value='S-E1'; document.getElementById('woStart').value='2026-09-21'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value='OHAPP0534GD\t10'; saveWO(); });
 // live: the apron is on CO5014DEN by the usage table; the PM puts it on burgundy X133
 const live=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-E1'); const before=fabricRecordFor(WOs[i].items[0]).code;
   window.prompt=()=>'pc2x13306'; setFabricCode(i,'OHAPP0534GD'); const r=fabricRecordFor(WOs[i].items[0]); openWOModal(i);
   const cell=document.querySelector('#woModalBody tr').children[5].textContent.replace(/\s+/g,' ').trim();
   return {before, code:r.code, name:r.name, std:r.std, source:r.source, cell}; });
 console.log('live    ->', JSON.stringify(live));
 // an unknown code is refused when the confirm is declined, allowed when accepted; blank goes back to the table
 const unk=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-E1'); window.prompt=()=>'ZZNOTACLOTH'; window.confirm=()=>false; setFabricCode(i,'OHAPP0534GD'); const a=WOs[i].items[0].fabricCode;
   window.confirm=()=>true; setFabricCode(i,'OHAPP0534GD'); const b=WOs[i].items[0].fabricCode; window.prompt=()=>''; setFabricCode(i,'OHAPP0534GD'); const c=WOs[i].items[0].fabricCode;
   window.prompt=()=>'PC2X13306'; setFabricCode(i,'OHAPP0534GD'); return [a,b,c,WOs[i].items[0].fabricCode].join('|'); });
 console.log('unknown ->', unk);
 // complete: the record carries the hand-set cloth; the ledger shows it with a pencil; undo puts it back on the item
 const done=await p.evaluate(()=>{ completeWholeWO(WOs.findIndex(w=>w.ref==='S-E1')); const c=completedWOs.find(x=>x.ref==='S-E1'); smShowTab('fabric'); fabOpen.mon['2026-09']=true; fabOpen.day['2026-09-21']=true; fabRender();
   const row=[...document.querySelectorAll('#fabBody .sm-tbl tbody tr')].find(tr=>/S-E1/.test(tr.textContent)); const cell=row.children[4].textContent.replace(/\s+/g,' ').trim();
   return {code:c.fabric.code, edited:c.fabric.edited, std:c.fabric.std, cell}; });
 console.log('booked  ->', JSON.stringify(done));
 // edit on the booked-in line, then the write-off uses it
 const edit=await p.evaluate(async()=>{ const idx=completedWOs.findIndex(x=>x.ref==='S-E1'); window.prompt=()=>'CO5003DEN'; fabSetFabric(idx); const c=completedWOs[idx];
   let blob=null; URL.createObjectURL=b=>{blob=b; return 'blob:x';}; HTMLAnchorElement.prototype.click=function(){}; fabTickAll(true); exportFabricWriteOff(); const csv=(await blob.text()).split('\r\n').filter(Boolean);
   window.prompt=()=>'ZZZ'; fabSetFabric(idx);   // exported now: no further edit
   return {code:c.fabric.code, name:c.fabric.name, line:csv[1], still:completedWOs[idx].fabric.code}; });
 console.log('edit    ->', JSON.stringify(edit));
 const undo=await p.evaluate(()=>{ const idx=completedWOs.findIndex(x=>x.ref==='S-E1'); undoCompleted(idx); const w=WOs.find(w=>w.ref==='S-E1'); return w.items[0].fabricCode; });
 console.log('undo    ->', undo);
 const order=await p.evaluate(()=>[...document.querySelectorAll('#fabBody .sm-bh .ttl')].map(e=>e.textContent.trim().slice(0,14)).join('|'));
 console.log('banners ->', order);
 const pass = live.before==='CO5014DEN' && live.code==='PC2X13306' && /BURGUNDY/.test(live.name) && live.std===6 && /edited$/.test(live.source) && /PC2X13306/.test(live.cell) && /fabric/.test(live.cell)
   && unk==='PC2X13306|ZZNOTACLOTH||PC2X13306'
   && done.code==='PC2X13306' && done.edited===true && done.std===6 && /PC2X13306/.test(done.cell) && /edit fabric/.test(done.cell)
   && edit.code==='CO5003DEN' && /MURRAY BLACK DENIM/.test(edit.name) && edit.line==='CO5003DEN,HOME,,6,Cutting,S-E1,21/09/2026,Manual Reduction' && edit.still==='CO5003DEN'
   && undo==='CO5003DEN' && /Booked fab.*\|.*Fabric sto.*\|.*Fabric usag/.test(order);
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
