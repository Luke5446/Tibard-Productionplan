// The Free stock column on the buffer table, between In stock and On SOP:
// in stock less On SOP plus the pipeline, plus what is on a live works
// order - in blue when a works order is counted (so a figure that leans on
// work not yet made is visible as such), red when short, black otherwise;
// sortable like the rest.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=[
 T(['AAA001','PLAIN, NO WORKS ORDER','40','120','0','30','90','160','300']),
 T(['BBB002','OVERSOLD','5','30','0','30','90','160','300']),
 T(['CCC003','ON A WORKS ORDER','10','8','0','30','90','160','300']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit'); await p.waitForTimeout(400);
 await p.evaluate(()=>{ window.now=()=>new Date('2026-09-30T10:00:00'); window.confirm=()=>true; window.alert=()=>{}; });
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); }, buf);
 // a stock works order for 25 of CCC003, raised the buffer way: tick, set the quantity, create
 await p.evaluate(()=>{ toggleIncl('CCC003',true); setWop('CCC003','25'); showCreateWO(); document.getElementById('createStart').value='2026-09-30'; document.getElementById('createDue').value='2026-10-07'; doCreateWOs(); });
 const r=await p.evaluate(()=>{ document.getElementById('sfilt').value=''; renderTable();
   const heads=[...document.querySelectorAll('#tBody')[0].closest('table').querySelectorAll('thead th')].map(th=>th.textContent.replace(/\s*[↕⇕]\s*$/,'').trim());
   const cell=code=>{ const tr=document.querySelector('#row-'+sid(code)); const td=tr.children[4]; const sp=td.querySelector('span'); return [sp.textContent, sp.style.color, sp.title].join('|'); };
   const out={heads:heads.slice(3,6).join(','), a:cell('AAA001'), b:cell('BBB002'), c:cell('CCC003'), fields:rows.map(r=>r.code+':'+r.freeStock).join(' ')};
   sBy('freeStock'); out.asc=[...document.querySelectorAll('#tBody tr')].map(tr=>tr.dataset.code).join(','); sBy('freeStock'); out.desc=[...document.querySelectorAll('#tBody tr')].map(tr=>tr.dataset.code).join(',');
   // the works order completes: its units move to the pipeline, the figure stays and the blue goes
   out.wo=WOs.map(w=>w.ref+':'+w.items.map(i=>i.code+'x'+i.qty).join()).join(' '); completeWholeWO(WOs.findIndex(w=>w.items.some(i=>i.code==='CCC003'))); renderTable(); out.afterDone=cell('CCC003');
   return out; });
 console.log(JSON.stringify(r,null,1));
 const pass = r.heads==='In stock,Free stock,On SOP'
   && r.a==='-80|rgb(185, 28, 28)|' && r.b==='-25|rgb(185, 28, 28)|' && r.c==='27|rgb(30, 64, 175)|includes 25 on live works orders'
   && r.fields==='AAA001:-80 BBB002:-25 CCC003:27' && r.asc==='CCC003,BBB002,AAA001' && r.desc==='AAA001,BBB002,CCC003'   // the first click sorts high to low, the second low to high
   && r.afterDone==='27|rgb(17, 24, 39)|includes 25 in the pipeline';
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
