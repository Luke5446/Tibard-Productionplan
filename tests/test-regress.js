const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
// Existing buffer paste format: A B M O P T U V W
const buf=[
 T(['OHAPP054415','NAVY 100% COTTON ADJ BIB APRON','136','350','0','109','328','775','1349']),
 T(['APP300503','BLACK P/COTTON BIB APRON WITH POCKET','42','254','0','250','751','1291','1479']),
].join('\n');
const sm=T(['OH-1','OLIVER HARVEY','0000114816','1','OHAPP0785191','GREEN BIB APRON','12','2026-09-11','MALDON','WORKS ORDER','Oliver Harvey']);

(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await b.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'?edit');
  await p.waitForTimeout(400);

  await p.evaluate(t=>{document.getElementById('pasteTA').value=t; loadPaste();}, buf);
  await p.waitForTimeout(200);
  const bufOk=await p.evaluate(()=>({rows:rows.length, tblRows:document.querySelectorAll('#tBody tr').length, visible:!document.getElementById('dataWrap').classList.contains('hidden')}));

  // add a special make, then switch back to buffer - buffer must be intact
  await p.click('#tabSpecial'); await p.waitForTimeout(100);
  await p.evaluate(t=>{document.getElementById('smTA').value=t; smLoadPaste(); smCreate('OH-1');}, sm);
  await p.waitForTimeout(150);
  await p.click('#tabBuffer'); await p.waitForTimeout(150);
  const back=await p.evaluate(()=>({
    dataShown:document.getElementById('dataWrap').style.display!=='none',
    smHidden:document.getElementById('smView').classList.contains('hidden'),
    tblRows:document.querySelectorAll('#tBody tr').length,
    // a special make must NOT count towards buffer On WOP
    onWOP:rows.map(r=>r.code+':'+r.onWOP).join(' '),
    woCards:document.querySelectorAll('#woCards .woc').length
  }));
  // existing stock WO creation must still work
  const stockWO=await p.evaluate(()=>{
    toggleIncl('APP300503',true);
    showCreateWO();
    document.getElementById('createStart').value='2026-09-01';
    document.getElementById('createDue').value='2026-09-18';
    doCreateWOs();
    return WOs.map(w=>w.ref+(w.sm?' [special]':' [stock]')).join(' | ');
  });

  console.log('buffer paste:     ', JSON.stringify(bufOk));
  console.log('back to buffer:   ', JSON.stringify(back));
  console.log('stock WO refs:    ', stockWO);
  console.log('errors:           ', errs.length?errs.join(' | '):'none');
  await p.screenshot({path:'tests/out/buffer.png'});
  await p.click('#tabSpecial'); await p.waitForTimeout(300);
  await p.screenshot({path:'tests/out/special.png', fullPage:true});
  await b.close();
})();
