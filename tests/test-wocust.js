// The customer must be on the printed works order for every special make,
// including when Sage left the field blank, and must not appear on a stock one.
const { chromium } = require('playwright');
const T=a=>a.join('\t');
const paste=[
 T(['OH-1','OLIVER HARVEY','0000114816','1','OHCJSCUMBRIA3603','CUMBRIA CHEF JACKET 36','6','2026-09-11','Oliver Harvey Proforma','WORKS ORDER','Oliver Harvey','S012607POH0013294 - Maldon']),
 T(['OH-2','OLIVER HARVEY','0000114816','2','LOGOAPPLICATION','Maldon logo left chest','6','2026-09-11','Oliver Harvey Proforma','NOTE - charge or logo line','','S012607POH0013294 - Maldon']),
 // customer and reference both blank in Sage
 T(['OH-3','OLIVER HARVEY','0000114900','1','OHCJSMDEVON6401','DEVON CHEF JACKET 64','2','2026-09-15','','WORKS ORDER','Oliver Harvey','']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file:///home/user/Tibard-Productionplan/index.html?edit'); await p.waitForTimeout(450);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste();},paste); await p.waitForTimeout(150);
 await p.evaluate(()=>{window.confirm=()=>true; smTickAll(true); smCreateAllShown();}); await p.waitForTimeout(250);

 const grab=async(code)=>{
   const [pop]=await Promise.all([p.waitForEvent('popup'),
     p.evaluate(c=>{window.print=()=>{}; smWorksOrder(WOs.find(w=>w.sm&&w.items[0].code===c).ref);},code)]);
   await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(250);
   const t=await pop.evaluate(()=>document.body.innerText);
   await pop.close(); return t;
 };
 const a=await grab('OHCJSCUMBRIA3603');
 console.log('with a customer:');
 console.log('  Customer row     :', /Customer\s/.test(a)?'present':'MISSING');
 console.log('  account name     :', a.includes('Oliver Harvey Proforma')?'yes':'MISSING');
 console.log('  customer order no:', a.includes('S012607POH0013294 - Maldon')?'yes':'MISSING');
 console.log('  sales order      :', a.includes('114816')?'yes':'MISSING');
 console.log('  on page 2 header :', a.split('MANUFACTURING & TIMES')[1] && a.split('MANUFACTURING & TIMES')[1].includes('Oliver Harvey Proforma')?'yes':'MISSING');

 const c=await grab('OHCJSMDEVON6401');
 console.log('blank in Sage:');
 console.log('  Customer row still there:', /Customer\n?/.test(c)&&c.includes('—')?'yes, shown as —':'MISSING');

 // a stock works order must not gain a customer row
 const stock=await p.evaluate(()=>{
   WOs.push({ref:'WO-9999',start:'',due:'2026-09-30',items:[{code:'OHCJSMCHESHIRE0101',qty:10}]});
   return WOs.length-1;});
 const [pop3]=await Promise.all([p.waitForEvent('popup'),
   p.evaluate(i=>{window.print=()=>{}; printWOPTracked(i,'OHCJSMCHESHIRE0101',10);},stock)]);
 await pop3.waitForLoadState('domcontentloaded'); await pop3.waitForTimeout(200);
 const s=await pop3.evaluate(()=>document.body.innerText);
 await pop3.close();
 console.log('stock works order:', /Customer order no/.test(s)?'WRONGLY has customer rows':'no customer rows - correct');
 console.log('errors:', errs.length?errs.join(' | '):'none');
 await b.close();
})();
