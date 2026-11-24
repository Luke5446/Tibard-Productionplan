// The Jacket plan tab (Luke, 24 Nov 2026): every live jacket works order line
// as a job, customer orders (a line covering a sales order, or a special make)
// before stock works orders, earliest promised date first; each job whole to
// the machinist who finishes it first, within their hours less breaks,
// holidays, first and last days and efficiency; minutes from the style's
// costing, the plan's own table or the 32-minute stand-in; a pinned
// machinist kept; the staff and minutes saved and published and absorbed
// from a later publish; orders with no works order listed; a viewer with no
// controls.
const { chromium } = require('playwright');
const path = require('path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'});
 const p=await b.newPage(); const errs=[]; let fails=0;
 const ck=(n,ok,x)=>{ if(ok) console.log('  ok -',n); else { fails++; console.log('  FAIL -',n,x==null?'':JSON.stringify(x)); } };
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.route('https://api.github.com/**', r=>r.fulfill({status:404, body:'{}'}));
 await p.route('https://luke5446.github.io/**', r=>r.fulfill({status:404, body:''}));
 await p.goto('file://'+path.join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(450);
 const r=await p.evaluate(()=>{
   window.now=()=>new Date('2026-11-24T10:00:00');   // a Tuesday
   rows=[ mkRow('OHCJSMOXFORD4201','Oxford jacket 42',0,30,0,0,0,0,0), mkRow('OHCJSMDORSET3801','Dorset jacket 38',50,0,0,0,0,0,0), mkRow('AP300501','Apron',0,0,0,0,0,0,0), mkRow('CJ0193SS03','Tibard jacket S',0,8,0,0,0,0,0) ];
   rows[0].cat='Chef Jackets'; rows[1].cat='Chef Jackets'; rows[2].cat='Aprons'; rows[3].cat='Chef Jackets'; rows[3].clockwork=true;
   WOs=[ {ref:'WO-A',due:'2026-12-11',createdAt:'2026-11-10',printed:true,items:[{code:'OHCJSMOXFORD4201',qty:30}]},     // covers Claridges, promised 15 Dec
         {ref:'WO-B',due:'2026-11-20',createdAt:'2026-11-01',printed:true,items:[{code:'OHCJSMDORSET3801',qty:10}]},     // stock, overdue
         {ref:'WO-C',due:'2026-12-01',createdAt:'2026-11-18',printed:true,sm:{so:'0000117982',custName:'Rosewood London',promised:'2026-12-01'},items:[{code:'OHCJSCUMBRIA6001',qty:4}]},
         {ref:'WO-D',due:'2026-12-15',createdAt:'2026-11-13',printed:true,items:[{code:'OHCJSMDORSET3801',qty:30}]},     // stock
         {ref:'WO-E',due:'2026-11-26',createdAt:'2026-11-20',printed:true,embOnly:true,items:[{code:'OHCJSMOXFORD4201',qty:5}]},   // embroidery only: not sewn
         {ref:'WO-F',due:'2026-11-26',createdAt:'2026-11-20',printed:true,items:[{code:'AP300501',qty:100}]} ];          // an apron: not a jacket
   sopDemand={lines:[ {k:'OH-1',co:'OLIVER HARVEY',so:'117784',code:'OHCJSMOXFORD4201',qty:30,due:'2026-12-15',cust:'Claridges Hotel Limited',seq:1},
                      {k:'TIB-2',co:'TIBARD',so:'873729',code:'CJ0193SS03',qty:8,due:'2026-11-09',cust:'SSP Other Bars',seq:1},
                      {k:'OH-3',co:'OLIVER HARVEY',so:'118156',code:'OHCJSMSTRATFORD5201',qty:1,due:'2026-11-30',cust:'Ansty Hall',seq:1} ], pastedAt:'2026-11-24T09:00:00Z'};
   rows.push(mkRow('OHCJSMSTRATFORD5201','Stratford jacket 52',0,1,0,0,0,0,0)); rows[4].cat='Chef Jackets';
   recalcWOs(); recalcQtys();
   jkLoad(null);
   smShowTab('jk');
   const o={};
   const jobs=jkJobs(); o.order=jobs.map(j=>j.ref); o.cust=jobs.map(j=>j.cust); o.need=jobs.map(j=>j.need||j.due);
   o.minsSrc=jobs.map(j=>j.ref+':'+j.src+':'+j.mach);
   const sch=jkSchedule(jobs);
   o.who=jobs.map(j=>j.ref+':'+j.whoName+':'+j.start+'>'+j.finish+(j.late?':late':''));
   o.staff=sch.staff.map(s=>s.name); o.diane30=jkCap(jkPlan.staff.find(s=>s.id==='diane'),'2026-11-30'); o.champaMon=jkCap(jkPlan.staff.find(s=>s.id==='champa'),'2026-11-26'); o.champaFri=jkCap(jkPlan.staff.find(s=>s.id==='champa'),'2026-11-27');
   o.chrisFri=jkCap(jkPlan.staff.find(s=>s.id==='christineo'),'2026-11-27'); o.naynaToday=jkCap(jkPlan.staff.find(s=>s.id==='nayna'),'2026-11-24'); o.nayna=jkCap(jkPlan.staff.find(s=>s.id==='nayna'),'2026-11-25'); o.jacAfter=jkCap(jkPlan.staff.find(s=>s.id==='jacqueline'),'2026-12-07');
   o.xmas=jkWorkDays().indexOf('2026-12-28')<0 && jkWorkDays().indexOf('2026-12-24')>=0 && jkWorkDays().indexOf('2027-01-04')>=0;
   o.needs=jkNeedsWO().map(x=>x.code+' '+x.qty);
   o.tab=document.getElementById('tabJk').classList.contains('on') && !document.getElementById('jkView').classList.contains('hidden');
   o.tiles=[...document.querySelectorAll('#jkBody .kpi-tile .v')].map(e=>e.textContent);
   (function(){ var keep=jkPlan; jkLoad({staff:[{id:'a',name:'A',team:'jacket',eff:100},{id:'b',name:'B',team:'jacket',eff:100},{id:'c',name:'C',team:'jacket',eff:70}]}); o.mig=[jkPlan.staff[0].eff,jkPlan.staff[1].eff,jkPlan.staff[2].eff,jkPlan.effVer]; jkPlan=keep; })();
   jkToggle('s:joanne'); o.selects=document.querySelectorAll('#jkBody select').length; jkToggle('s:joanne');
   // pin WO-D on Champa, then it stays with her
   jkAssign('WO-D|OHCJSMDORSET3801','champa');
   const j2=jkJobs(); jkSchedule(j2); o.pinned=j2.find(j=>j.ref==='WO-D').whoName; jkToggle('s:champa'); o.pinIcon=/📌/.test(document.getElementById('jkBody').innerHTML); jkToggle('s:champa');
   // drag and drop: WO-B dragged above WO-D on Champa keeps that order and pins both; dropped into Joanne's list it moves; Reset order lets the plan choose again
   jkAssign('WO-B|OHCJSMDORSET3801','champa'); jkToggle('s:champa');
   var keysBefore=[...document.querySelectorAll('#jkBody table[data-staff="champa"] tbody tr[data-key]')].map(x=>x.getAttribute('data-key')); o.dragBefore=keysBefore;
   o.grips=document.querySelectorAll('#jkBody table[data-staff="champa"] .jk-grip').length;
   jkPlace('champa','WO-B|OHCJSMDORSET3801',0,keysBefore);
   var keysAfter=[...document.querySelectorAll('#jkBody table[data-staff="champa"] tbody tr[data-key]')].map(x=>x.getAttribute('data-key')); o.dragAfter=keysAfter;
   o.orderSaved=JSON.parse(publishState()).jkPlan.order.champa; o.handMark=/✍/.test(document.querySelector('#jkBody table[data-staff="champa"]').innerHTML); o.resetBtn=/Reset order/.test(document.getElementById('jkBody').innerHTML);
   const jj=jkJobs(); jkSchedule(jj); o.bFirst=jj.find(j=>j.ref==='WO-B').start<=jj.find(j=>j.ref==='WO-D').start && jj.find(j=>j.ref==='WO-B').whoName==='Champa Shah';
   jkPlace('joanne','WO-B|OHCJSMDORSET3801',0,[]); o.movedTo=jkPlan.assign['WO-B|OHCJSMDORSET3801']; o.leftOld=(jkPlan.order.champa||[]).indexOf('WO-B|OHCJSMDORSET3801')<0; o.joanneOrder=jkPlan.order.joanne;
   jkOrderReset('joanne'); jkOrderReset('champa'); o.resetDone=!jkPlan.order.joanne && !jkPlan.order.champa && !jkPlan.assign['WO-B|OHCJSMDORSET3801'];
   jkAssign('WO-D|OHCJSMDORSET3801','champa'); jkToggle('s:champa');
   // share: WO-D (30) split 10 Champa / 12 Joanne, 8 left to the plan; each part on its person; done on one part; clear share
   jkSplitSet('WO-D|OHCJSMDORSET3801',{champa:10,joanne:12});
   var js=jkJobs(); jkSchedule(js); var parts=js.filter(j=>j.ref==='WO-D').map(j=>j.key+':'+j.qty+':'+(j.whoName||'')); o.parts=parts;
   o.splitPub=JSON.parse(publishState()).jkPlan.split['WO-D|OHCJSMDORSET3801'];
   jkToggle('s:champa'); o.sharePill=/shared/.test(document.querySelector('#jkBody table[data-staff="champa"]').innerHTML) && /of 30/.test(document.querySelector('#jkBody table[data-staff="champa"]').innerHTML);
   jkSplitOpen='WO-D|OHCJSMDORSET3801'; jkRender(); o.shareForm=document.querySelectorAll('#jkBody tr.jk-share input[data-share]').length; o.shareNote=(document.getElementById('jkShareNote')||{}).textContent||'';
   jkSplitOpen=''; jkToggle('s:champa');
   jkDone('WO-D|OHCJSMDORSET3801#champa'); o.partDone=!jkJobs().some(j=>j.key==='WO-D|OHCJSMDORSET3801#champa') && jkJobs().some(j=>j.key==='WO-D|OHCJSMDORSET3801#joanne') && jkDoneList().some(d=>d.key==='WO-D|OHCJSMDORSET3801#champa' && d.qty===10);
   jkSplitClear('WO-D|OHCJSMDORSET3801'); o.cleared=!jkPlan.split['WO-D|OHCJSMDORSET3801'] && jkJobs().filter(j=>j.ref==='WO-D').length===1 && jkJobs().find(j=>j.ref==='WO-D').qty===30 && !jkPlan.done['WO-D|OHCJSMDORSET3801#champa'];
   jkAssign('WO-D|OHCJSMDORSET3801','champa');   // the pin back, for the checks below
   // can't sew: a Stratford line never lands on Champa, Jacqueline or the new staff by itself; pinned there it is flagged
   WOs.push({ref:'WO-S',due:'2026-12-02',createdAt:'2026-11-24',printed:true,items:[{code:'OHCJSMSTRATFORD4601',qty:60}]}); rows.push(mkRow('OHCJSMSTRATFORD4601','Stratford jacket 46',0,0,0,0,0,0,0)); rows[rows.length-1].cat='Chef Jackets';
   recalcWOs(); recalcQtys(); jkRender();
   var sj=jkJobs(); jkSchedule(sj); o.cantWho=sj.find(j=>j.ref==='WO-S').whoName; o.cantList=jkPlan.staff.filter(s=>jkCant(s,'OHCJSMSTRATFORD4601')).map(s=>s.id).join(); o.cantDerby=jkCant(jkPlan.staff.find(s=>s.id==='champa'),'OHLCJSDERBYSHIRE1401') && !jkCant(jkPlan.staff.find(s=>s.id==='champa'),'OHCJSMOXFORD4201');
   jkAssign('WO-S|OHCJSMSTRATFORD4601','champa'); var sj2=jkJobs(); jkSchedule(sj2); o.cantPinned=sj2.find(j=>j.ref==='WO-S').whoName==='Champa Shah' && sj2.find(j=>j.ref==='WO-S').cant; jkToggle('s:champa'); o.cantFlag=/can't sew/.test(document.querySelector('#jkBody table[data-staff="champa"]').innerHTML); jkToggle('s:champa');
   jkAssign('WO-S|OHCJSMSTRATFORD4601',''); WOs.pop(); rows.pop(); recalcWOs(); recalcQtys(); jkRender();
   (function(){ var keep=jkPlan; jkLoad({staff:[{id:'champa',name:'C',team:'jacket',eff:85},{id:'x',name:'X',team:'new',eff:40},{id:'diane',name:'D',team:'jacket',eff:85}],effVer:2}); o.cantMig=[jkPlan.staff[0].cant,jkPlan.staff[1].cant,jkPlan.staff[2].cant||'']; jkPlan=keep; })();
   // a week cell drills down to that person's works orders in the week; clicking again closes it
   var cj=jkJobs(); jkSchedule(cj); var cjob=cj.find(j=>j.whoName==='Champa Shah'); var cw=jkWeek(cjob.finish);
   jkDrillTo('champa',cw); var dr=document.querySelector('#jkBody tr.jk-drill'); o.drill=dr?dr.textContent.replace(/\s+/g,' ').trim():''; o.drillHasRef=!!dr && dr.innerHTML.indexOf('<strong>'+cjob.ref+'</strong>')>=0 && new RegExp('<td style="text-align:right">'+cjob.qty+'<').test(dr.innerHTML);
   // the week count is what is made that week, not the whole line in the week it finishes: a line split over two weeks adds up, and the first week holds what its minutes allow
   o.wkSplit=(function(){ var offs=jkPlan.staff.map(s=>s.off); jkPlan.staff.forEach(s=>{ if(s.id!=='champa') s.off=true; }); var all=jkJobs(); jkSchedule(all); jkPlan.staff.forEach((s,i)=>{ s.off=offs[i]; }); var cj=all; if(!all.every(j=>!j.placed || Object.keys(j.wkQty).reduce((a,w)=>a+j.wkQty[w],0)===j.qty)) return 'weeks do not add up'; var sp=cj.filter(j=>j.wkQty && Object.keys(j.wkQty).length>1); if(!sp.length) return 'no split line'; var j=sp[0]; var sum=Object.keys(j.wkQty).reduce((a,w)=>a+j.wkQty[w],0); var w1=Object.keys(j.wkQty).sort()[0]; return sum===j.qty && j.wkQty[w1]>0 && j.wkQty[w1]<j.qty && Math.abs(j.wkQty[w1]-j.qty*j.wkMins[w1]/j.mins)<1 ? 'ok' : JSON.stringify([j.ref,j.qty,j.wkQty,j.wkMins,j.mins]); })();
   jkDrillTo('champa',cw); o.drillClosed=!document.querySelector('#jkBody tr.jk-drill');
   jkDrillTo('champa','2099-01-05'); o.drillOff=!document.querySelector('#jkBody tr.jk-drill'); jkDrillTo('','');
   // a minute override on the Dorset family
   const fam=jkFamily('OHCJSMDORSET3801'); jkMinsSet(fam,'mach','45'); o.fam=fam; o.ovr=jkMinsFor('OHCJSMDORSET3801');
   jkMinsSet(fam,'mach',''); o.back=jkMinsFor('OHCJSMDORSET3801').src;
   // a holiday typed and a person taken out
   const di=jkPlan.staff.findIndex(s=>s.id==='joanne'); jkStaffSet(di,'hols','2026-11-26, 2026-11-27'); o.joanneHol=jkCap(jkPlan.staff[di],'2026-11-26');
   jkStaffSet(jkPlan.staff.findIndex(s=>s.id==='safia'),'off','1'); o.safiaOut=!jkSchedule(jkJobs()).staff.some(s=>s.id==='safia');
   o.saved=JSON.parse(localStorage.getItem('tibard_production')).jkPlan; o.pub=JSON.parse(publishState()).jkPlan.assign;
   // the order of the sections: week table, then the staff banners, then the priority list
   const secs=[...document.querySelectorAll('#jkBody .kpi-sec h3')].map(e=>e.textContent.trim()); o.secs=secs;
   // banners: a name closes and opens, remembered; the priority list starts closed and opens
   o.staffRowsOpen=document.querySelectorAll('#jkBody .jk-ban table').length;
   jkToggle('s:champa'); o.afterOpen=document.querySelectorAll('#jkBody .jk-ban table').length; o.remembered=JSON.parse(localStorage.getItem('tibard_jk_sections'))['s:champa']===true;
   jkToggle('s:champa'); o.afterClose=document.querySelectorAll('#jkBody .jk-ban table').length;
   o.prioClosed=!/Priority list[\s\S]*<table/.test(document.getElementById('jkBody').innerHTML.split('Priority list')[1].split('Jacket orders with')[0]);
   jkToggle('priority'); o.prioOpen=/<table/.test(document.getElementById('jkBody').innerHTML.split('Priority list')[1].split('Jacket orders with')[0]); jkToggle('priority');
   // done and undo: the line leaves the plan, is listed, is saved and published, and comes back
   jkDone('WO-A|OHCJSMOXFORD4201'); o.doneGone=!jkJobs().some(j=>j.ref==='WO-A'); o.doneTile=[...document.querySelectorAll('#jkBody .kpi-tile .v')][0].textContent; o.doneListed=/Done - in finishing/.test(document.getElementById('jkBody').innerHTML) && jkDoneList().length===1;
   o.donePub=!!JSON.parse(publishState()).jkPlan.done['WO-A|OHCJSMOXFORD4201'];
   jkUndo('WO-A|OHCJSMOXFORD4201'); o.undone=jkJobs().some(j=>j.ref==='WO-A') && jkDoneList().length===0;
   // a done mark for a works order that has gone is pruned
   jkPlan.done['WO-GONE|X']={at:'2026-11-24T10:00:00Z'}; jkRender(); o.pruned=!jkPlan.done['WO-GONE|X'];
   // too much promised: 2,000 jackets wanted this week by a customer shows short on the running total and not made this year
   WOs.push({ref:'WO-BIG',due:'2026-11-27',createdAt:'2026-11-24',printed:true,items:[{code:'OHCJSMOXFORD4201',qty:2000}]}); sopDemand.lines.push({k:'OH-9',co:'OLIVER HARVEY',so:'118999',code:'OHCJSMOXFORD4201',qty:2000,due:'2026-11-27',cust:'Big Hotel',seq:1});
   recalcWOs(); recalcQtys(); jkRender();
   const html=document.getElementById('jkBody').innerHTML;
   o.short=/Short by \d+ min/.test(html); o.yearEnd=[...document.querySelectorAll('#jkBody .kpi-tile')].some(t=>/Not made before year end/.test(t.textContent) && +t.querySelector('.v').textContent>0); o.yearWarn=/will not be made before the shutdown/.test(html);
   o.redCell=/background:#fecaca/.test(html);
   WOs.pop(); sopDemand.lines.pop(); recalcWOs(); recalcQtys(); jkRender();
   // a later published plan replaces this one; an older one does not
   o.absorbOld=jkAbsorb({staff:[{id:'x',name:'X'}],savedAt:'2000-01-01'}); o.absorbNew=jkAbsorb({staff:[{id:'x',name:'X',monThu:450,fri:285,eff:100}],mins:{},assign:{},savedAt:'2099-01-01'}); o.afterAbsorb=jkPlan.staff.map(s=>s.name);
   return o;
 });
 ck('tab shown', r.tab);
 ck('customer jobs first, earliest promised date first, then stock by due', r.order.join()==='WO-C,WO-A,WO-B,WO-D', r.order);
 ck('embroidery-only and apron works orders left out', r.order.indexOf('WO-E')<0 && r.order.indexOf('WO-F')<0);
 ck('needed by: promised date for a covered line, due for stock', r.need.join()==='2026-12-01,2026-12-15,2026-11-20,2026-12-15', r.need);
 ck('Oxford minutes from the costing, Dorset assumed 32', /WO-A:costing:32/.test(r.minsSrc.join()) && /WO-B:assumed:32/.test(r.minsSrc.join()), r.minsSrc);
 ck('every job placed on a machinist with dates', r.who.every(w=>/:[A-Z][a-z]+ [A-Z].*:2026-\d\d-\d\d>2026-\d\d-\d\d/.test(w)), r.who);
 ck('the overdue stock works order is late', /WO-B:.*:late/.test(r.who.join()), r.who);
 ck('Anne Marie out, eight in the plan', r.staff.length===8 && r.staff.indexOf('Anne Marie')<0, r.staff);
 ck('hours less breaks at 85%: Champa 390 -> 332 Mon-Thu, 285 -> 242 Fri; Christine O no Friday', r.champaMon===332 && r.champaFri===242 && r.chrisFri===0, [r.champaMon,r.champaFri,r.chrisFri]);
 ck('a plan saved at 100 is brought to 85 once, a typed figure kept', r.mig.join()==='85,85,70,2', r.mig);
 ck("Diane's holiday Monday, Jacqueline after her last day", r.diane30===0 && r.jacAfter===0);
 ck('new jacket staff from 25 Nov at 40%', r.naynaToday===0 && r.nayna===180);
 ck('Christmas: 24 Dec worked, 28 Dec not, 4 Jan back', r.xmas);
 ck('orders with no works order: Stratford listed, the Clockwork code not', r.needs.join()==='OHCJSMSTRATFORD5201 1', r.needs);
 ck('tiles: 74 jackets, 34 for customers', r.tiles[0]==='74' && r.tiles[1]==='34', r.tiles);
 ck('editor has a machinist select per line once a banner is open', r.selects>=1, r.selects);
 ck('a pinned works order stays with Champa', r.pinned==='Champa Shah' && r.pinIcon);
 ck('grips on every line of an open list', r.grips===2, [r.grips,r.dragBefore]);
 ck('a line dragged to the top keeps that order, pins both, is saved and marked', r.dragAfter[0]==='WO-B|OHCJSMDORSET3801' && r.dragAfter.length===2 && r.orderSaved.join()===r.dragAfter.join() && r.handMark && r.resetBtn && r.bFirst, [r.dragAfter,r.orderSaved,r.handMark,r.resetBtn,r.bFirst]);
 ck('dropped into another list it moves there', r.movedTo==='joanne' && r.leftOld && r.joanneOrder.join()==='WO-B|OHCJSMDORSET3801', [r.movedTo,r.leftOld,r.joanneOrder]);
 ck('reset order forgets the hand order and the pins', r.resetDone);
 ck('a shared works order: 10 on Champa, 12 on Joanne, 8 left to the plan, all with dates', r.parts.length===3 && r.parts.indexOf('WO-D|OHCJSMDORSET3801#champa:10:Champa Shah')>=0 && r.parts.indexOf('WO-D|OHCJSMDORSET3801#joanne:12:Joanne Leigh')>=0 && r.parts.some(x=>/^WO-D\|OHCJSMDORSET3801:8:/.test(x)), r.parts);
 ck('the share is published, shown on the line, and the form has a box per machinist', r.splitPub && r.splitPub.champa===10 && r.sharePill && r.shareForm===8 && /22 given out, 8 left/.test(r.shareNote), [r.splitPub,r.sharePill,r.shareForm,r.shareNote]);
 ck('done on one part leaves the other parts; clear share puts the line back whole', r.partDone && r.cleared, [r.partDone,r.cleared]);
 ck('a Stratford line goes to someone who sews it; Champa, Jacqueline and the new staff are off it', ['Joanne Leigh','Christine Ormisher','Diane Oakes'].indexOf(r.cantWho)>=0 && r.cantList==='champa,jacqueline,nayna,safia,christineb' && r.cantDerby, [r.cantWho,r.cantList,r.cantDerby]);
 ck('pinned on Champa anyway it is flagged', r.cantPinned && r.cantFlag);
 ck('a plan saved before gets the lists once', r.cantMig.join('|')==='STRATFORD, DERBYSHIRE|STRATFORD, DERBYSHIRE|', r.cantMig);
 ck('a line that runs over a weekend is counted in each week by the minutes made there', r.wkSplit==='ok', r.wkSplit);
ck('a week cell opens that person\'s works orders with quantities, and closes again', r.drillHasRef && /Champa Shah - w\/c/.test(r.drill) && r.drillClosed && r.drillOff, [r.drill.slice(0,120),r.drillHasRef,r.drillClosed,r.drillOff]);
 ck('a typed figure wins, cleared goes back to assumed', r.ovr.mach===45 && r.ovr.src==='plan' && r.back==='assumed', [r.fam,r.ovr,r.back]);
 ck('a typed holiday and a person taken out', r.joanneHol===0 && r.safiaOut);
 ck('saved and published with the state', r.saved && r.saved.staff.length===9 && r.pub['WO-D|OHCJSMDORSET3801']==='champa');
 ck('week table, then the staff banners, then the priority list', r.secs.indexOf('Jackets planned by week')<r.secs.indexOf('Who makes what') && r.secs.indexOf('Who makes what')<r.secs.indexOf('Priority list'), r.secs);
 ck('staff banners start closed; one opens, is remembered, and closes again', r.staffRowsOpen===0 && r.afterOpen===1 && r.remembered && r.afterClose===0, [r.staffRowsOpen,r.afterOpen,r.afterClose]);
 ck('the priority list starts closed and opens', r.prioClosed && r.prioOpen);
 ck('done takes the line out, lists it, publishes it; undo brings it back', r.doneGone && r.doneTile==='44' && r.doneListed && r.donePub && r.undone, [r.doneGone,r.doneTile,r.doneListed,r.donePub,r.undone]);
 ck('a done mark for a works order that has gone is pruned', r.pruned);
 ck('too much promised: short on the running total, not made before year end, red cells', r.short && r.yearEnd && r.yearWarn && r.redCell, [r.short,r.yearEnd,r.yearWarn,r.redCell]);
 ck('a later published plan replaces, an older one does not', r.absorbOld===false && r.absorbNew===true && r.afterAbsorb.join()==='X');
 // the viewer: the tab, the plan, no controls
 await p.goto('file://'+path.join(__dirname,'..','index.html')); await p.waitForTimeout(450);
 const v=await p.evaluate(()=>{
   window.now=()=>new Date('2026-11-24T10:00:00');
   rows=[ mkRow('OHCJSMOXFORD4201','Oxford jacket 42',0,30,0,0,0,0,0) ]; rows[0].cat='Chef Jackets';
   WOs=[ {ref:'WO-A',due:'2026-12-11',createdAt:'2026-11-10',printed:true,items:[{code:'OHCJSMOXFORD4201',qty:30}]} ]; sopDemand={lines:[],pastedAt:null};
   recalcWOs(); recalcQtys(); jkLoad(null); smShowTab('jk');
   jkToggle('s:champa'); jkToggle('s:joanne'); jkToggle('s:jacqueline'); jkToggle('s:christineo'); jkToggle('s:diane');
   return {rows:document.querySelectorAll('#jkBody table tbody tr').length, inputs:document.querySelectorAll('#jkBody input, #jkBody select, #jkBody button').length, tiles:document.querySelectorAll('#jkBody .kpi-tile').length, who:/Champa|Joanne|Jacqueline|Christine|Diane/.test(document.getElementById('jkBody').textContent)};
 });
 ck('viewer sees the plan with no controls', v.rows>=2 && v.inputs===0 && v.who, v);
 ck('no page errors', errs.length===0, errs);
 await b.close(); console.log(fails?('\n'+fails+' FAILED'):'\nall passed'); process.exit(fails?1:0);
})();
