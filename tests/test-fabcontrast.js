// A second fabric (the contrast) changed on its own, without touching the main
// cloth. S-OH117087-Pt2 (OHAP300531/222CTDR): navy/white CO6030 with cocoa
// CO5222 waist ties; the ties go to CO5222ECO and the body stays CO6030.
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-10-20T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });
 await p.evaluate(()=>{ document.getElementById('woRef').value='S-C1'; document.getElementById('woStart').value='2026-10-20'; document.getElementById('woDue').value='2026-10-23'; document.getElementById('woTA').value='OHAP300531/222CTDR\t1'; saveWO(); });
 // live: the panel's contrast pencil edits the contrast, this line only
 const live=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-C1'), it=WOs[i].items[0], before=fabricRecordFor(it, WOs[i]);
   openWOModal(i); const link=[...document.querySelectorAll('#woModalBody a')].find(a=>/setExtraFabricCode/.test(a.getAttribute('onclick')||'')); link.click();
   const what=document.getElementById('fabPickWhat').textContent; document.getElementById('fabPickAll').checked=false; fabPickChoose('CO5222ECO');
   const r=fabricRecordFor(it, WOs[i]); openWOModal(i); const cell=document.querySelector('#woModalBody tr').children[5].textContent.replace(/\s+/g,' ').trim();
   return {before:before.code+'+'+before.extras[0].code, main:r.code, mainEdited:!!r.edited, extra:r.extras[0].code, extraEdited:r.extras[0].edited, base:r.extras[0].base, std:r.extras[0].std,
     what:/CO5222 of OHAP300531\/222CTDR/.test(what), item:JSON.stringify(it.extraFabricCodes), fabricCode:it.fabricCode, product:JSON.stringify(fabricOverrides), cell:/CO6030/.test(cell) && /CO5222ECO/.test(cell)}; });
 console.log('live    ->', JSON.stringify(live));
 // fabric demand and the cutting log follow the contrast to its new cloth
 const dem=await p.evaluate(()=>{ const d=fabLiveDemand().by; return Object.keys(d).filter(c=>/CO6030|CO5222/.test(c)).sort().map(c=>c+'='+d[c].metres).join(); });
 console.log('demand  ->', dem);
 // booked in: the record carries it; the Fabric tab edits the contrast alone and can put it back
 const done=await p.evaluate(()=>{ completeWholeWO(WOs.findIndex(w=>w.ref==='S-C1')); const idx=completedWOs.findIndex(x=>x.ref==='S-C1'), c=completedWOs[idx], o={};
   o.rec=c.fabric.code+'+'+c.fabric.extras[0].code+'/'+c.fabric.extras[0].edited;
   smShowTab('fabric'); fabOpen.mon['2026-10']=true; fabOpen.day['2026-10-20']=true; fabRender();
   const row=[...document.querySelectorAll('#fabBody .sm-tbl tbody tr')].find(tr=>/S-C1/.test(tr.textContent)); o.link=!![...row.querySelectorAll('a')].find(a=>/fabSetExtraFabric/.test(a.getAttribute('onclick')||''));
   fabSetExtraFabric(idx, 0); document.getElementById('fabPickAll').checked=false; fabPickChoose(''); o.back=c.fabric.code+'+'+c.fabric.extras[0].code+'/'+!!c.fabric.extras[0].edited;
   fabSetExtraFabric(idx, 0); document.getElementById('fabPickAll').checked=false; fabPickChoose('CO5222ECO'); o.again=c.fabric.code+'+'+c.fabric.extras[0].code+'/'+c.fabric.extras[0].base;
   return o; });
 console.log('booked  ->', JSON.stringify(done));
 // undo puts the contrast edit back on the live line
 const undo=await p.evaluate(()=>{ undoCompleted(completedWOs.findIndex(x=>x.ref==='S-C1')); const w=WOs.find(w=>w.ref==='S-C1'); return JSON.stringify(w.items[0].extraFabricCodes)+'|'+w.items[0].fabricCode; });
 console.log('undo    ->', undo);
 // ticked: every works order of the product takes the new contrast, listed as a second fabric correction and removable
 const prod=await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-C1'); delete WOs[i].items[0].extraFabricCodes; const o={};
   setExtraFabricCode(i, 'OHAP300531/222CTDR', 'CO5222'); o.boxDefault=document.getElementById('fabPickAll').checked; fabPickChoose('CO5222ECO');
   o.set=JSON.stringify(fabricOverrides); const u=fabricUsageFor('OHAP300531/222CTDR'); o.usage=u.code+'+'+u.extras[0].code;
   smShowTab('fabric'); fabRender(); o.listed=/OHAP300531\/222CTDR second fabric → CO5222ECO \(was CO5222\)/.test(document.getElementById('fabBody').textContent.replace(/\s+/g,' '));
   fabricOverrideClear('OHAP300531/222CTDR>CO5222'); const u2=fabricUsageFor('OHAP300531/222CTDR'); o.cleared=u2.code+'+'+u2.extras[0].code;
   return o; });
 console.log('product ->', JSON.stringify(prod));
 const pass = live.before==='CO6030+CO5222' && live.main==='CO6030' && !live.mainEdited && live.extra==='CO5222ECO' && live.extraEdited===true && live.base==='CO5222' && live.std===0.1
   && live.what && live.item==='{"CO5222":"CO5222ECO"}' && live.fabricCode===undefined && live.product==='{}' && live.cell
   && dem==='CO5222ECO=0.1,CO6030=1.03'
   && done.rec==='CO6030+CO5222ECO/true' && done.link && done.back==='CO6030+CO5222/false' && done.again==='CO6030+CO5222ECO/CO5222'
   && undo==='{"CO5222":"CO5222ECO"}|undefined'
   && prod.boxDefault && prod.set==='{"OHAP300531/222CTDR>CO5222":"CO5222ECO"}' && prod.usage==='CO6030+CO5222ECO' && prod.listed && prod.cleared==='CO6030+CO5222';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
