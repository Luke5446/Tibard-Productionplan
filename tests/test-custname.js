// Real rows off the sheet: the customer is sometimes the account, sometimes
// the reference. Column M resolves it; the app must lead with that.
const { chromium } = require('playwright');
const T=a=>a.join('\t');
const row=(k,so,code,cust,cat,ref,name)=>T([k,'OLIVER HARVEY',so,'1',code,'DESC','5','2026-09-20',cust,cat,'Oliver Harvey',ref,name]);
const paste=[
 row('OH-1','0000114816','OHCJSCUMBRIA3603','Oliver Harvey Proforma','WORKS ORDER','EMB: Coventry City FC','Coventry City FC'),
 row('OH-2','0000114900','OHCJSMDEVON6401','Knoops Procurement','WORKS ORDER','EMB: PO: 33452341','Knoops Procurement'),
 row('OH-3','0000114901','OHCJSMOXFORD4403','Mollies Motels Ltd','WORKS ORDER','134164 Miles Roberts','Mollies Motels Ltd'),
 row('OH-4','0000114902','OHCJSMOXFORD4003','XONLINE','WORKS ORDER','OH-76438 Louise Burks','OH-76438 Louise Burks'),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file:///home/user/Tibard-Productionplan/index.html?edit'); await p.waitForTimeout(450);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(200);
 const cells=await p.evaluate(()=>[...document.querySelectorAll('#smPendingList .sm-tbl tbody tr')]
   .filter(tr=>tr.querySelector('input[type=checkbox]'))
   .map(tr=>tr.querySelector('td:nth-child(3)').innerText.split('\n').filter(Boolean)));
 cells.forEach(c=>console.log('  headline:', JSON.stringify(c[0]), ' detail:', JSON.stringify(c.slice(1))));

 await p.evaluate(()=>{window.confirm=()=>true; smTickAll(true); smCreateAllShown();}); await p.waitForTimeout(250);
 const [pop]=await Promise.all([p.waitForEvent('popup'),
   p.evaluate(()=>{window.print=()=>{}; smWorksOrder(WOs.find(w=>w.sm&&w.items[0].code==='OHCJSCUMBRIA3603').ref);})]);
 await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
 const t=await pop.evaluate(()=>document.body.innerText);
 await pop.close();
 console.log('printed: customer =', t.includes('Coventry City FC')?'Coventry City FC':'MISSING',
             '| account row =', t.includes('Oliver Harvey Proforma')?'kept':'MISSING');
 // searching by the resolved name finds it
 const s=await p.evaluate(()=>{document.getElementById('smSearch').value='coventry'; smRender();
   return document.querySelectorAll('#smList .sm-tbl tbody tr').length;});
 console.log('search "coventry" ->', s, 'row(s)');
 // a 12-column paste still names somebody
 const back=await p.evaluate(()=>{smPending=[];smSeen={};
   document.getElementById('smTA').value="OH-9\tOLIVER HARVEY\t0000999\t1\tXX\tD\t1\t2026-09-30\tKnoops Procurement\tWORKS ORDER\tOliver Harvey\tEMB: PO: 1";
   smLoadPaste(); return smPending[0].custName;});
 console.log('12-col paste falls back to:', JSON.stringify(back));
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await b.close();
})();
