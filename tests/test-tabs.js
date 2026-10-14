// The OH detachable tabs (OHTAB codes) are cut by hand with scissors (Luke,
// 14 Oct 2026): no marker, no lay, so no plies and no 3 cm allowance in the
// standard metres; 35 seconds a tab in the cutting time instead of a works
// order's set-up. Checks the lay lookup, the standard, the cutting plan for a
// works order of tabs alone and of tabs with a laid garment, the queue and
// KPI minutes, the Cutting tab row, the panel hint and the printed works
// order's Cutting row.
const { chromium } = require('playwright');
const path = require('path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; let fails=0;
 const ck=(n,ok,x)=>{ if(ok) console.log('  ok -',n); else { fails++; console.log('  FAIL -',n,x==null?'':JSON.stringify(x)); } };
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+path.join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);

 const r=await p.evaluate(()=>{
   const lay=cutLayFor('OHTAB03'), u=fabricUsageFor('OHTAB03'), rec=fabricRecordFor({code:'OHTAB03', qty:10});
   const tabs=cutWoPlan([{code:'OHTAB03', qty:10}]), one=cutWoPlan([{code:'OHTAB11', qty:1}]);
   const mixed=cutWoPlan([{code:'OHAPP0534241', qty:60}, {code:'OHAPP0534241', qty:60, extra:true}, {code:'OHTAB03', qty:12}]);
   const est=cutQueueEstimate([{ref:'T1', code:'OHTAB03', qty:10}, {ref:'T2', code:'OHAPP0534241', qty:60}]);
   const byDay=cutMinsByDay([{ref:'T1', code:'OHTAB03', qty:10, cutAt:'2026-10-13'}, {ref:'T2', code:'OHAPP0534241', qty:60, cutAt:'2026-10-13'}]);
   const cell=fabricCellFor(0, {code:'OHTAB03', qty:10});
   let cap=''; window.open=function(){ return {document:{open(){},write:h=>{cap+=h;},close(){}}, focus(){}, print(){}, close(){}}; };
   printWOP('WO-T','OHTAB03',10,null,null);
   const m=cap.match(/LECTRA PATTERN<\/div><table>([\s\S]*?)<\/table>/); const lectra=m ? m[1].replace(/<[^>]+>/g,'|').replace(/\|+/g,'|').replace(/&mdash;/g,'-') : 'none';
   return {lay, ulay:u&&u.lay, usrc:u&&u.source, rec, tabs, one, mixed, est, byDay, cell, lectra, txt:cutPlanTxt(tabs), txt2:cutPlanTxt(mixed), hand:[cutByHand('OHTAB222/LT'), cutByHand('ohtab921'), cutByHand('OHTAB--'), cutByHand('OHSTRAP03'), cutByHand('OHAPP0534GD')]};
 });
 ck('OHTAB03: cut by hand, no lay; the usage lookup carries no lay', r.lay.hand===true&&r.lay.lay===null&&r.lay.src==='cut by hand'&&r.ulay===null&&r.usrc==='All Costings', [r.lay,r.ulay,r.usrc]);
 ck('the rule: every OHTAB code, whatever the colour or the leather, and nothing else', r.hand.join()==='true,true,true,false,false', r.hand);
 ck('standard for 10 tabs at 0.2 m is 2 m: no plies, no allowance', r.rec&&r.rec.std===2&&r.rec.perGarment===0.2&&r.rec.plies===undefined, r.rec);
 ck('cutting plan for 10 tabs: no lays, 10 by hand, 5.8 min, not flagged', r.tabs.lays===0&&r.tabs.hand===10&&r.tabs.mins===5.8&&r.tabs.unknown.length===0, r.tabs);
 ck('one tab is 0.6 min', r.one.mins===0.6&&r.one.hand===1, r.one);
 ck('60 aprons and 12 tabs on one works order: 15 lays (25 min) + 7 min = 32 min', r.mixed.lays===15&&r.mixed.hand===12&&r.mixed.mins===32&&r.mixed.unknown.length===0, r.mixed);
 ck('the queue: 5.8 + 25 = 30.8 min over 2 works orders, none unknown', r.est.wos===2&&r.est.mins===30.8&&r.est.unknown===0, r.est);
 ck('the day they were cut credits 30.8 min for 2 works orders', r.byDay['2026-10-13']&&r.byDay['2026-10-13'].mins===30.8&&r.byDay['2026-10-13'].wos===2, r.byDay);
 ck('row wording: "10 tabs cut by hand", and "15 lays + 12 tabs cut by hand" when mixed', r.txt==='10 tabs cut by hand'&&r.txt2==='15 lays + 12 tabs cut by hand', [r.txt,r.txt2]);
 ck('panel: std 2 m with "cut by hand, no wastage", no lay link, no warning', /std 2 m/.test(r.cell)&&/cut by hand, no wastage/.test(r.cell)&&!/incl\. wastage/.test(r.cell)&&!/no lay plan/.test(r.cell)&&!/&#9998; lay/.test(r.cell), r.cell);
 ck('print: the Cutting row says scissors, no wastage, 10 tabs at 35 seconds = 5.8 min', /Cutting\|Cut by hand with scissors: no marker, no lay, no wastage allowance - 10 tabs at 35 seconds = 5\.8 min\|/.test(r.lectra), r.lectra);

 console.log('errors:', errs.length?errs.join(' | '):'none');
 console.log(fails?('FAILED '+fails):'ALL PASSED');
 await b.close(); process.exit(fails||errs.length?1:0);
})();
