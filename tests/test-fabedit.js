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
   setFabricCode(i,'OHAPP0534GD'); const open=document.getElementById('fabPick').classList.contains('open');
   document.getElementById('fabPickQ').value='burgundy x133'; fabPickRender(); const hits=[...document.querySelectorAll('#fabPickList .fab-pick-row')].map(r=>r.textContent.slice(0,9));
   document.querySelector('#fabPickList .fab-pick-row').click(); const r=fabricRecordFor(WOs[i].items[0]); openWOModal(i);
   window.__pick={open, hits, closed:!document.getElementById('fabPick').classList.contains('open')};
   const cell=document.querySelector('#woModalBody tr').children[5].textContent.replace(/\s+/g,' ').trim();
   return {before, code:r.code, name:r.name, std:r.std, source:r.source, cell, pick:window.__pick}; });
 console.log('live    ->', JSON.stringify(live));
 // a code off the Sage list cannot be chosen; the back button returns to the usage table
 const unk=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-E1'); setFabricCode(i,'OHAPP0534GD'); fabPickChoose('ZZNOTACLOTH'); const a=WOs[i].items[0].fabricCode; const stillOpen=document.getElementById('fabPick').classList.contains('open');
   fabPickChoose(''); const c=WOs[i].items[0].fabricCode; setFabricCode(i,'OHAPP0534GD'); fabPickChoose('PC2X13306'); return [a,stillOpen,c,WOs[i].items[0].fabricCode].join('|'); });
 console.log('unknown ->', unk);
 // complete: the record carries the hand-set cloth; the ledger shows it with a pencil; undo puts it back on the item
 const done=await p.evaluate(()=>{ completeWholeWO(WOs.findIndex(w=>w.ref==='S-E1')); const c=completedWOs.find(x=>x.ref==='S-E1'); smShowTab('fabric'); fabOpen.mon['2026-09']=true; fabOpen.day['2026-09-21']=true; fabRender();
   const row=[...document.querySelectorAll('#fabBody .sm-tbl tbody tr')].find(tr=>/S-E1/.test(tr.textContent)); const cell=row.children[4].textContent.replace(/\s+/g,' ').trim();
   return {code:c.fabric.code, edited:c.fabric.edited, std:c.fabric.std, cell}; });
 console.log('booked  ->', JSON.stringify(done));
 // edit on the booked-in line, then the write-off uses it
 const edit=await p.evaluate(async()=>{ const idx=completedWOs.findIndex(x=>x.ref==='S-E1'); fabSetFabric(idx); fabPickChoose('CO5003DEN'); const c=completedWOs[idx];
   let blob=null; URL.createObjectURL=b=>{blob=b; return 'blob:x';}; HTMLAnchorElement.prototype.click=function(){}; fabTickAll(true); exportFabricWriteOff(); const csv=(await blob.text()).split('\r\n').filter(Boolean);
   fabSetFabric(idx); const locked=!document.getElementById('fabPick').classList.contains('open');   // exported now: no picker
   return {code:c.fabric.code, name:c.fabric.name, line:csv[1], still:completedWOs[idx].fabric.code, locked}; });
 console.log('edit    ->', JSON.stringify(edit));
 // the picker's default corrects the PRODUCT: a new works order of it takes the cloth, the live demand moves, the
 // correction is listed on the stock view and can be removed; unticked, only that one line changes
 const corr=await p.evaluate(()=>{ const o={};
   o.set=fabricOverrides.OHAPP0534GD;                                     // set by the picks above (box ticked by default)
   document.getElementById('woRef').value='S-E2'; document.getElementById('woStart').value='2026-09-21'; document.getElementById('woDue').value='2026-09-30'; document.getElementById('woTA').value='OHAPP0534GD\t4'; saveWO();
   const j=WOs.findIndex(w=>w.ref==='S-E2'); const r=fabricRecordFor(WOs[j].items[0]); o.newWO=r.code+'/'+r.std+'/'+r.source;
   const dem=fabLiveDemand().by; o.demand=Object.keys(dem).filter(c=>/CO5014DEN|CO5003DEN/.test(c)).map(c=>c+'='+dem[c].metres).join();
   smShowTab('fabric'); fabRender(); const cl=document.getElementById('fabBody').textContent; o.listed=/Corrected fabrics/.test(cl) && /OHAPP0534GD → CO5003DEN/.test(cl.replace(/\s+/g,' '));
   setFabricCode(j,'OHAPP0534GD'); o.boxDefault=document.getElementById('fabPickAll').checked; o.prod=document.getElementById('fabPickProd').textContent;
   document.getElementById('fabPickAll').checked=false; fabPickChoose('PC2X13306');                  // this line only
   o.lineOnly=WOs[j].items[0].fabricCode+'/'+fabricOverrides.OHAPP0534GD;
   fabricOverrideClear('OHAPP0534GD'); o.cleared=fabricOverrides.OHAPP0534GD===undefined && fabricRecordFor(WOs[j].items[0]).code==='PC2X13306';
   fabricOverrideSet('OHAPP0534GD','CO5003DEN'); saveState(); return o; });
 console.log('correct ->', JSON.stringify(corr));
 await p.reload(); await p.waitForTimeout(400);
 const persist=await p.evaluate(()=>{ if(!rows.length) rows=[{code:'ZZSEED',desc:'',qty:0}];   // publish refuses an empty buffer
   URL.createObjectURL=b=>{ b.text().then(t=>window.__pub=t); return 'blob:x'; }; HTMLAnchorElement.prototype.click=function(){}; window.alert=()=>{}; window.confirm=()=>true; publishData();
   return new Promise(res=>setTimeout(()=>{ rows=rows.filter(r=>r.code!=='ZZSEED'); res({after:fabricOverrides.OHAPP0534GD, published:JSON.parse(window.__pub).fabricOverrides.OHAPP0534GD}); },200)); });
 console.log('persist ->', JSON.stringify(persist));
 const undo=await p.evaluate(()=>{ const idx=completedWOs.findIndex(x=>x.ref==='S-E1'); undoCompleted(idx); const w=WOs.find(w=>w.ref==='S-E1'); return w.items[0].fabricCode; });
 console.log('undo    ->', undo);
 const order=await p.evaluate(()=>{ smShowTab('fabric'); fabRender(); return [...document.querySelectorAll('#fabBody .sm-bh .ttl')].map(e=>e.textContent.trim().slice(0,14)).join('|'); });   // the reload above left the tab unshown
 console.log('banners ->', order);
 const pass = corr.set==='CO5003DEN' && corr.newWO==='CO5003DEN/2.4/All Costings · corrected' && corr.demand==='CO5003DEN=2.4' && corr.listed && corr.boxDefault && corr.prod==='OHAPP0534GD'
   && corr.lineOnly==='PC2X13306/CO5003DEN' && corr.cleared && persist.after==='CO5003DEN' && persist.published==='CO5003DEN'
   && live.before==='CO5014DEN' && live.code==='PC2X13306' && /BURGUNDY/.test(live.name) && live.std===6 && /edited$/.test(live.source) && /PC2X13306/.test(live.cell) && /fabric/.test(live.cell) && live.pick.open && live.pick.hits.join()==='PC2X13306' && live.pick.closed
   && unk==='PC2X13306|true||PC2X13306'
   && done.code==='PC2X13306' && done.edited===true && done.std===6 && /PC2X13306/.test(done.cell) && /edit fabric/.test(done.cell)
   && edit.code==='CO5003DEN' && /MURRAY BLACK DENIM/.test(edit.name) && edit.line==='CO5003DEN,HOME,,6,Cutting,S-E1,21/09/2026,Manual Reduction' && edit.still==='CO5003DEN' && edit.locked
   && undo==='CO5003DEN' && /Booked fab.*\|.*Fabric sto.*\|.*Fabric usag/.test(order);
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
