// DTF transfer works orders (16 Nov 2026). A special make whose code is
// TRG + the Tibard stock code + SHARP is raised from the special makes tab
// like any other, but comes out as an embroidery-only works order (picked
// from stock, nothing cut) flagged DTF, with the stock code in the middle as
// the pick and the sales order carried through. Its print is the first page
// only, with the DTF logo ID 113555, the application line and the photo.
const { chromium } = require('playwright');
const T=a=>a.join('\t');
const buf=T(['AP300503','BLACK BIB APRON','40','120','0','30','90','160','300']);
const paste=[
 T(['TIB-1','TIBARD','0000862331','1','TRGAP300503SHARP','BLACK BIB APRON SHARP DTF','6','2026-11-28','SHARP','WORKS ORDER','Tibard','PO 4471','SHARP SOLUTIONS']),
 T(['TIB-2','TIBARD','0000862332','1','CT01964601','CHEF TROUSERS BLACK 32R','20','2026-11-30','KLONDYKE','WORKS ORDER','Tibard','','KLONDYKE']),
].join('\n');
const URL='file://'+require('path').join(__dirname,'..','index.html')+'?edit';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.route('https://luke5446.github.io/**', r=>r.fulfill({status:404, body:''}));
 await p.goto(URL); await p.waitForTimeout(400);
 await p.evaluate(t=>{ window.confirm=()=>true; window.alert=()=>{}; document.getElementById('pasteTA').value=t; loadPaste(); }, buf);
 await p.click('#tabSpecial'); await p.waitForTimeout(150);
 await p.evaluate(t=>{ document.getElementById('smTA').value=t; smLoadPaste(); }, paste); await p.waitForTimeout(200);
 // raise both: one by the single button, one by Create all
 const s1=await p.evaluate(()=>{ smCreate(smPending[0].key); smPending.forEach(o=>smTick(o.key,true)); smCreateAllShown();
   const d=WOs.find(w=>w.items[0].code==='TRGAP300503SHARP'), t=WOs.find(w=>w.items[0].code==='CT01964601');
   const card=document.querySelector('.woc .woc-emb');
   openWOModal(WOs.indexOf(d)); const meta=document.getElementById('woModalMeta').textContent.replace(/\s+/g,' '); closeWOModal();
   return {n:WOs.length, dtf:d.dtf, emb:d.embOnly, pick:d.pickCode, so:d.sm.so, cust:d.sm.custName, plain:{dtf:!!t.dtf, emb:!!t.embOnly},
     card:card?card.textContent.trim():'', meta:/DTF transfer .* pick AP300503 from stock for the DTF \(logo 113555, Top left as worn\)/.test(meta),
     helper:[dtfPickFor('TRGAP300503SHARP'), dtfPickFor('trgap300503sharp'), dtfPickFor('GIRHT016003'), dtfPickFor('TRGSHARP')].join('|'),
     wh:whPickList().map(l=>l.wo.ref+':'+l.it.code).join(), cut:WOs.filter(cutInScope).length}; });
 // the print: one page, the DTF band with the ID, the application line, the photo and the sales order
 const s2=await p.evaluate(()=>{ let html=''; window.open=()=>({document:{open(){},write(h){html+=h;},close(){}}});
   const d=WOs.find(w=>w.items[0].code==='TRGAP300503SHARP'); printWOP(d.ref, 'TRGAP300503SHARP', 6, d.due, d.sm, {embOnly:true, pickCode:d.pickCode, dtf:true});
   return {pages:(html.match(/<div class="page">/g)||[]).length, banner:/DTF TRANSFER<\/th><td[^>]*>Pick 6 x AP300503 from stock for the DTF transfer \(logo 113555\)/.test(html),
     band:/<div class="band">DTF TRANSFER<\/div>/.test(html), id:/DTF logo ID<\/th><td[^>]*>113555/.test(html), place:/Top left as worn/.test(html),
     img:/<img src="data:image\/jpeg;base64,[A-Za-z0-9+\/=]+" alt="DTF logo in position/.test(html), so:/Sales order<\/th><td>862331/.test(html), cust:/SHARP SOLUTIONS/.test(html),
     noMfg:!/MANUFACTURING DETAILS/.test(html), row:/<th>DTF transfer<\/th><td[^>]*><strong>Yes/.test(html)}; });
 // completing carries the flag, no fabric
 // the PM cannot complete it from the card (18 Nov 2026): the embroidery room marks it done, the warehouse books it in; the completed record, when it comes, carries the DTF flags and no fabric
 const s3=await p.evaluate(()=>{ const d=WOs.find(w=>w.items[0].code==='TRGAP300503SHARP'); d.printed=true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); completeWholeWO(WOs.indexOf(d)); const blocked=WOs.indexOf(d)>=0 && /DTF transfer works order is not completed here/.test(window.__alerts[0]||'');
   recordCompleted(d, d.items[0]); const c=completedWOs.find(c=>c.code==='TRGAP300503SHARP'); return {blocked, dtf:c.dtf, emb:c.embOnly, pick:c.pickCode, fabric:c.fabric===undefined}; });
 console.log('create ->', JSON.stringify(s1)); console.log('print  ->', JSON.stringify(s2)); console.log('done   ->', JSON.stringify(s3));
 const pass = s1.n===2 && s1.dtf===true && s1.emb===true && s1.pick==='AP300503' && s1.so==='0000862331' && s1.cust==='SHARP SOLUTIONS' && !s1.plain.dtf && !s1.plain.emb
   && s1.card==='DTF' && s1.meta && s1.helper==='AP300503|AP300503||' && /TRGAP300503SHARP/.test(s1.wh) && s1.cut===0
   && s2.pages===1 && s2.banner && s2.band && s2.id && s2.place && s2.img && s2.so && s2.cust && s2.noMfg && s2.row
   && s3.blocked && s3.dtf===true && s3.emb===true && s3.pick==='AP300503' && s3.fabric;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
