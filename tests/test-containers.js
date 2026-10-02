// Containers on the water, read from the stock planner's published data.json:
// the On POP cell names the first container carrying the code and the date it
// lands (blue when Sage already has the PO, grey when it does not yet), with
// every container in the hover; the runway lands them in the right week and
// the closing stock follows; the WOP recommendation bridges to a container
// rather than making what it brings; a code on no container is unchanged;
// and the stock planner being unreachable leaves the display as it was.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=[
 T(['CT3082LL03','BLACK CHEFS TROUSERS LARGE','1261','1569','1806','500','2197','5200','9000']),   // C127 PO raised in Sage: On POP 1,806
 T(['ABC002','CONTAINER NOT YET ON POP','50','0','0','10','30','60','120']),                      // on C127 too, PO not raised yet
 T(['XYZ001','NO CONTAINER','100','0','0','10','30','60','120']),
].join('\n');
const stockPlan={savedAt:'2026-10-02T10:52:24.007Z', cPOs:[
 {ref:'C128', date:'2026-11-11', items:[{code:'CT3082LL03', qty:630}]},
 {ref:'C127', date:'2026-10-19', items:[{code:'CT3082LL03', qty:1000},{code:'CT3082LL03', qty:806},{code:'ABC002', qty:40}]},   // two lines of one code sum
 {ref:'C129', date:'2027-01-06', items:[{code:'OTHER', qty:5}]},
 {ref:'bad', date:'', items:[{code:'XYZ001', qty:9}]},                                                                             // no date: ignored
]};
const URL='https://luke5446.github.io/Tibard-Stock-Planner/data.json';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const run=async(fail)=>{
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.route(URL+'*', r=> fail ? r.abort() : r.fulfill({status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body:JSON.stringify(stockPlan)}));
  await p.addInitScript(()=>{ window.now=()=>new Date('2026-10-02T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });
  await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit');
  await p.waitForFunction(()=>window.contInfo && window.contInfo.state!=='loading', null, {timeout:10000});
  await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); }, buf);
  const r=await p.evaluate(()=>{
   document.getElementById('sfilt').value=''; renderTable();
   const pop=code=>{ const td=document.querySelector('#row-'+sid(code)).children[6]; const sub=td.querySelector('div'); const sp=td.querySelector('span'); return [td.textContent.replace(/\s+/g,' ').trim(), sub?sub.style.color:'', sp&&sp.title||''].join('|'); };
   const out={state:contInfo.state, n:containers.length, info:document.getElementById('contInfo').textContent, a:pop('CT3082LL03'), b:pop('ABC002'), c:pop('XYZ001'), wopRec:rows.map(r=>r.code+':'+r.wopRec).join(' ')};
   openRWModal('CT3082LL03');
   const trs=[...document.querySelectorAll('#rwContent tbody tr')];
   out.head=document.querySelector('#rwContent thead').textContent.replace(/\s+/g,' ').trim();
   out.meta=document.querySelector('#rwContent > div').textContent.replace(/\s+/g,' ').trim();
   out.rows=trs.map(tr=>[tr.children[0].textContent, tr.children[3].textContent.trim(), tr.children[5].textContent].join('/')).join(' ; ');
   out.chip=(trs[2].children[3].querySelector('span')||{}).style ? trs[2].children[3].querySelector('span').style.backgroundColor : '';
   openRWModal('XYZ001'); out.plain=[...document.querySelectorAll('#rwContent tbody tr')].map(tr=>tr.children[3].textContent.trim()).join('');
   return out; });
  await p.close(); return {r, errs};
 };
 const ok=await run(false), bad=await run(true);
 console.log(JSON.stringify(ok,null,1)); console.log(JSON.stringify(bad,null,1));
 const pass = ok.r.state==='ok' && ok.r.n===3 && /^Containers: 3 from the stock planner \(published 02 Oct, /.test(ok.r.info)
   && ok.r.a==='1,806📦 C127 19 Oct +1|rgb(30, 64, 175)|C127: 1,806 lands 19 Oct 2026\nC128: 630 lands 11 Nov 2026'   // textContent runs the figure and the line under it together
   && ok.r.b==='—📦 C127 19 Oct|rgb(107, 114, 128)|C127: 40 lands 19 Oct 2026'
   && ok.r.c==='—||'
   && ok.r.head==='WeekDateOpeningWO completes / container landsUsedClosingDays cover'
   && /On POP: 1,806 \| 📦 C127 1,806 lands 19 Oct, C128 630 lands 11 Nov$/.test(ok.r.meta)
   && /Wk 2\/\+1806 📦 C127\/1,098/.test(ok.r.rows) && /Wk 6\/\+630 📦 C128\/928/.test(ok.r.rows) && /Wk 1\/—\/-508/.test(ok.r.rows)
   && ok.r.chip==='rgb(219, 234, 254)' && ok.r.plain==='—'.repeat(13)
   // WOP REC: 28 days' cover, a container counted from a week after it lands. CT3082LL03 is 308 oversold at 28.6 a day:
   // with the feed, C127 counts from day 24, so 24 x 28.6 + 308 = 994 bridges to it (C128 lands after the four weeks and
   // is not counted); without the feed Sage's 1,806 On POP counts now and 28 days need 800 - 1,498 < 0, so nothing
   && ok.r.wopRec==='CT3082LL03:994 ABC002:0 XYZ001:0' && bad.r.wopRec==='CT3082LL03:0 ABC002:0 XYZ001:0'
   && bad.r.state==='error' && bad.r.n===0 && bad.r.info==='Containers: stock planner not available'
   && bad.r.a==='1,806||' && bad.r.b==='—||' && !/C127/.test(bad.r.rows) && !/📦/.test(bad.r.meta)
   && ok.errs.length===0 && bad.errs.length===0;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', ok.errs.concat(bad.errs).length?ok.errs.concat(bad.errs).join('\n'):'none'); await b.close();
})();
