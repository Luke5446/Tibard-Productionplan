// The Make for toggle on the buffer toolbar: WOP REC covers 4 weeks as
// standard and 12 weeks when the editor switches, the status colours and the
// in-stock % staying at 28 days either way; a container landing in week 6
// counts only under 12 weeks; the choice survives a reload and reaches the
// published state; a viewer sees it as text.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
// 6-month sales 1820 = 10 a day. AAA: 100 in stock, nothing on order.
// BBB: 100 in stock, a container of 400 landing in 35 days (counts from day 42).
const buf=[
 T(['AAA001','TEN A DAY','100','0','0','300','900','1820','3600']),
 T(['BBB002','TEN A DAY, CONTAINER WK6','100','0','400','300','900','1820','3600']),
].join('\n');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const url='file://'+require('path').join(__dirname,'..','index.html');
 await p.goto(url+'?edit'); await p.waitForTimeout(400);
 const prep=()=>p.evaluate(()=>{ window.now=()=>new Date('2026-10-09T10:00:00'); window.confirm=()=>true; window.alert=()=>{};
   containers=[{ref:'CONT-1', date:'2026-11-13', items:[{code:'BBB002', qty:400}]}]; contInfo={state:'ok', n:1}; });
 await prep();
 await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste(); }, buf);
 const read=()=>p.evaluate(()=>{ const r=c=>rows.find(x=>x.code===c); const btn=document.getElementById('bufWeeksSel');
   return { weeks:bufWeeks, a:r('AAA001').wopRec, b:r('BBB002').wopRec, aStatus:r('AAA001').status, days:Math.round(r('AAA001').daysOfStock),
            sel:btn?btn.textContent.trim():'', on:[...document.querySelectorAll('#bufWeeksSel button')].filter(x=>x.style.fontWeight==='700').map(x=>x.textContent).join('|'),
            good:document.getElementById('skuCount').textContent.replace(/\s+/g,' ') }; });
 const r4=await read();
 await p.evaluate(()=>setBufWeeks(12)); const r12=await read();
 // the snapshot taken on paste carries the horizon; a reload keeps the choice
 await p.reload(); await p.waitForTimeout(400); await prep(); await p.evaluate(()=>{ recalcQtys(); renderTable(); });
 const rr=await read();
 const pub=await p.evaluate(()=>JSON.parse(publishState()).bufWeeks);
 const snapWeeks=await p.evaluate(()=>bufSnaps.map(s=>s.weeks).join(','));
 await p.evaluate(()=>setBufWeeks(4)); const back=await read();
 // a viewer: the published choice as text, no buttons
 await p.evaluate(()=>setBufWeeks(12));
 const json=await p.evaluate(()=>publishState());
 await p.goto(url); await p.waitForTimeout(400);
 await p.evaluate(j=>{ applyState(JSON.parse(j)); }, json);
 const v=await p.evaluate(()=>({ weeks:bufWeeks, sel:document.getElementById('bufWeeksSel').innerHTML, b:rows.find(x=>x.code==='BBB002').wopRec }));
 const out={r4, r12, rr, pub, snapWeeks, back, v};
 console.log(JSON.stringify(out,null,1));
 // 4 weeks: 10/day * 28 = 280, less 100 = 180; the container lands after the four weeks and does not count,
 // and On POP that is a listed container is not stock now, so BBB is the same 180.
 // 12 weeks: 10/day * 84 = 840, less 100 = 740 for AAA; BBB: short 320 just before the container counts on day 42,
 // then 840 - 100 - 400 = 340 at the end, so 340.
 const pass = r4.weeks===4 && r4.a===180 && r4.b===180 && r4.aStatus==='low' && r4.days===10 && r4.on==='4 weeks' && /0% Good/.test(r4.good)
   && r12.weeks===12 && r12.a===740 && r12.b===340 && r12.aStatus==='low' && r12.on==='12 weeks' && /0% Good/.test(r12.good)
   && rr.weeks===12 && rr.a===740 && rr.b===340 && pub===12 && snapWeeks==='4'
   && back.weeks===4 && back.a===180
   && v.weeks===12 && v.sel==='<strong>12 weeks</strong>' && v.b===340;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
