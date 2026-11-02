// Filter by demand on the Cutting tab (Luke, 2 Nov 2026): the Needed column
// and chips read each waiting line against the planner's figures - the free
// stock for its code before any live works order, the days that stock lasts,
// the earliest sales order the works order covers and the works order's due
// date - and put it in a band: sold out, this week, within 2 weeks, later.
// The Needed heading sorts by band then date; a chip keeps one band and the
// ones above it; Sort by fabric puts the most needed fabric first. Nothing
// is written onto the log entries.
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
   window.now=()=>new Date('2026-11-02T10:00:00');   // a Monday
   // the planner's figures: code, in stock, on SOP, 6-month sales
   rows=[ mkRow('CJ1','Jacket 1',5,20,0,0,0,0,0),         // oversold: 5 on the shelf, 20 on orders
          mkRow('CJ2','Jacket 2',100,10,0,0,0,0,0),       // plenty free, no sales history
          mkRow('CJ3','Jacket 3',20,0,0,0,0,1820,0),      // 10 a day: 2 days of stock
          mkRow('CJ4','Jacket 4',50,0,0,0,0,910,0) ];     // 5 a day: 10 days of stock
   WOs=[ {ref:'W1',due:'2026-11-20',createdAt:'2026-10-20',printed:true,items:[{code:'CJ1',qty:20}]},
         {ref:'W2',due:'2026-11-25',createdAt:'2026-10-21',printed:true,items:[{code:'CJ2',qty:20}]},
         {ref:'W3',due:'2026-11-30',createdAt:'2026-10-22',printed:true,items:[{code:'CJ3',qty:20}]},
         {ref:'W4',due:'2026-12-10',createdAt:'2026-10-23',printed:true,items:[{code:'CJ4',qty:20}]},
         {ref:'W5',due:'2026-11-04',createdAt:'2026-10-24',printed:true,items:[{code:'CJ5',qty:20}]},
         {ref:'W6',due:'2026-12-20',createdAt:'2026-10-25',printed:true,sm:{so:'800123',custName:'A Hotel',promised:'2026-12-20'},items:[{code:'SPEC1',qty:5}]} ];
   sopDemand={lines:[ {k:'TIB-1',co:'TIBARD',so:'800100',code:'CJ1',qty:20,due:'2026-11-10',cust:'Cafe',seq:1},
                      {k:'TIB-2',co:'TIBARD',so:'800101',code:'CJ2',qty:10,due:'2026-11-03',cust:'Pub',seq:1} ], pastedAt:'2026-11-02T09:00:00Z'};
   recalcWOs(); recalcQtys();
   const L=(ref,code,fab,std,printed,due)=>({k:ref+'|'+code+'|'+fab, ref, code, desc:code+' desc', qty:20, fabric:fab, fabName:'Cloth '+fab, std, printedAt:printed, due});
   cutLog.entries=[ L('W1','CJ1','PC2001',40,'2026-10-20','2026-11-20'), L('W2','CJ2','PC2001',80,'2026-10-21','2026-11-25'), L('W3','CJ3','PC3000',10,'2026-10-22','2026-11-30'),
     L('W4','CJ4','PC3000',12,'2026-10-23','2026-12-10'), L('W5','CJ5','PC4000',8,'2026-10-24','2026-11-04'), L('W6','SPEC1','PC4000',6,'2026-10-25','2026-12-20') ];
   cutLog.loadedAt=new Date(); cutLog.error='';
   smShowTab('cut'); cutSec='todo'; cutQ=''; cutSortKey='printed'; cutSortDesc=false; cutDemand=''; cutNewOnly=false; cutRender();
   const trs=()=>[...document.querySelectorAll('#cutBody .cut-tbl tbody tr')];
   const refs=()=>trs().filter(tr=>!tr.classList.contains('cut-fab')).map(tr=>tr.children[0].querySelector('strong').textContent);
   const need=()=>trs().filter(tr=>!tr.classList.contains('cut-fab')).map(tr=>tr.querySelector('.cut-need').textContent.replace(/\s+/g,' ').trim());
   const chips=()=>[...document.querySelectorAll('#cutBody [data-cutdm]')].map(el=>el.textContent.trim()+(el.classList.contains('on')?'*':''));
   const o={};
   o.d=cutLog.entries.map(e=>{ const d=cutDemandFor(e,'2026-11-02'); return [e.ref, d.tier, d.by, d.bySO, d.free, d.days==null?null:Math.round(d.days)]; });
   o.head=document.querySelector('#cutBody .cut-tbl thead').textContent.replace(/\s+/g,' ').trim();
   o.byPrinted=refs(); o.need=need(); o.chips=chips();
   o.titles=trs().map(tr=>(tr.querySelector('.cut-need')||{}).title||'');
   cutSortBy('demand'); o.byNeed=refs(); o.arrow=/Needed ▲/.test(document.querySelector('#cutBody .cut-tbl thead').textContent);
   cutSortBy('demand'); o.byNeedDesc=refs(); cutSortBy('demand'); cutSortBy('printed');
   document.querySelector('#cutBody [data-cutdm="week"]').click(); o.week=refs(); o.weekChips=chips(); o.weekNote=(document.getElementById('cutDmNote')||{}).textContent||'';
   document.getElementById('cutFabBtn').click();
   o.weekFab=trs().filter(tr=>tr.classList.contains('cut-fab')).map(tr=>tr.textContent.replace(/\s+/g,' ').trim().slice(0,6)); o.weekFabRefs=refs(); o.weekFabNeed=trs().filter(tr=>!tr.classList.contains('cut-fab')).map(tr=>tr.children[3].textContent.replace(/\s+/g,' ').trim());
   document.querySelector('#cutBody [data-cutdm="sold"]').click(); o.sold=refs(); o.soldFabOn=document.getElementById('cutFabBtn').classList.contains('on');
   document.querySelector('#cutBody [data-cutdm="sold"]').click(); o.off=refs().length; o.offChips=chips();
   // all six by fabric: the most needed fabric first, then the biggest run; the most needed line first down a group
   o.allFab=trs().filter(tr=>tr.classList.contains('cut-fab')).map(tr=>tr.textContent.replace(/\s+/g,' ').trim().slice(0,6)); o.allFabRefs=refs();
   cutSortKey='printed'; cutRender(); o.empty=0; cutQ='zzz'; document.querySelector('#cutBody [data-cutdm="sold"]').click(); o.emptyTxt=(document.querySelector('#cutBody .sm-empty')||{}).textContent||'';
   o.clean=cutLog.entries.every(e=>!('tier' in e) && !('d' in e) && !('by' in e));
   cutQ=''; cutDemand=''; cutSortKey='printed'; cutRender();
   return o;
 });
 ck('the bands: W1 sold out (by the SO date), W5 and W3 this week (date, days of stock), W4 within 2 weeks, W2 and W6 later',
    JSON.stringify(r.d)===JSON.stringify([['W1',0,'2026-11-10',true,-15,null],['W2',3,'2026-11-25',false,90,null],['W3',1,'2026-11-30',false,20,2],['W4',2,'2026-12-10',false,50,10],['W5',1,'2026-11-04',false,null,null],['W6',3,'2026-12-20',false,null,null]]), r.d);
 ck('the Needed column is there after Due, with the tag and the free stock', /DueNeededProduct/.test(r.head) && /10 Nov 2026 SO sold out-15 free/.test(r.need[0]) && /25 Nov 202690 free$/.test(r.need[1]) && /30 Nov 2026 this week20 free · 2 d/.test(r.need[2]) && /10 Dec 2026 2 weeks50 free · 10 d/.test(r.need[3]) && /04 Nov 2026 this week$/.test(r.need[4]) && /20 Dec 2026$/.test(r.need[5]), [r.head, r.need]);
 ck('the hover says why', /oversold by 15 before the live works orders; needed 10 Nov 2026 for SO 800100/.test(r.titles[0]) && /a special make/.test(r.titles[5]) && /not on the planner/.test(r.titles[4]), r.titles);
 ck('the list still opens by the date printed', r.byPrinted.join()==='W1,W2,W3,W4,W5,W6', r.byPrinted);
 ck('the Needed heading sorts most needed first, and flips', r.byNeed.join()==='W1,W5,W3,W4,W2,W6' && r.arrow && r.byNeedDesc.join()==='W6,W2,W4,W3,W5,W1', [r.byNeed, r.byNeedDesc, r.arrow]);
 ck('the chips count the works orders in each band and above', r.chips.join()==='Sold out1,This week3,Within 2 weeks4', r.chips);
 ck('This week keeps the three, with the note', r.week.join()==='W1,W3,W5' && r.weekChips.join()==='Sold out1,This week3*,Within 2 weeks4' && /sold out or needed this week: 3 of 6 works orders/.test(r.weekNote), [r.week, r.weekChips, r.weekNote]);
 ck('then Sort by fabric groups only those, most needed fabric first', r.weekFab.join()==='PC2001,PC3000,PC4000' && r.weekFabRefs.join()==='W1,W3,W5' && /sold out/.test(r.weekFabNeed[0]) && /this week/.test(r.weekFabNeed[1]), [r.weekFab, r.weekFabRefs, r.weekFabNeed]);
 ck('Sold out alone, still by fabric', r.sold.join()==='W1' && r.soldFabOn, [r.sold, r.soldFabOn]);
 ck('the chip again shows everything', r.off===6 && r.offChips.join()==='Sold out1,This week3,Within 2 weeks4', [r.off, r.offChips]);
 ck('all six by fabric: PC2001 (a sold out line) first, then PC3000 and PC4000 (both this week, bigger run first); most needed line first down each group', r.allFab.join()==='PC2001,PC3000,PC4000' && r.allFabRefs.join()==='W1,W2,W3,W4,W5,W6', [r.allFab, r.allFabRefs]);
 ck('the empty message names the band', /Nothing waiting to be cut matches "zzz" is sold out\./.test(r.emptyTxt), r.emptyTxt);
 ck('nothing written onto the log entries', r.clean, r.clean);
 ck('no page errors', !errs.length, errs);
 await b.close(); console.log(fails?'FAILED '+fails:'all ok'); process.exit(fails?1:0);
})();
