const { chromium } = require('playwright');
const path = '/home/user/Tibard-Productionplan/index.html';

// Realistic paste: one OH order with 2 garments + a logo note + a charge line,
// one Tibard order with 1 garment, a review line, and an intercompany line.
const T = (a)=>a.join('\t');
const paste1 = [
  T(['OH-32036196','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN ADJUSTABLE BIB APRON','12','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
  T(['OH-32036200','OLIVER HARVEY','0000114816','3','OHCJSCUMBRIA3603','CUMBRIA CHEF JACKET SZ 36','6','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
  T(['OH-32036228','OLIVER HARVEY','0000114816','2','LOGOAPPLICATION','Maldon Salt Logo Centre Bib in White','12','2026-09-11','MALDON SALT','NOTE - charge or logo line','']),
  T(['OH-32036230','OLIVER HARVEY','0000114816','4','','Approved artwork 26.8.26','0','2026-09-11','MALDON SALT','NOTE - free text','']),
  T(['TIB-40011','TIBARD','0000120445','1','CT01964601','CHEF TROUSERS BLACK 32R','20','2026-09-04','KLONDYKE','WORKS ORDER','Tibard']),
  T(['TIB-40012','TIBARD','0000120445','2','FREETEXT','Bespoke tabard - see notes','5','2026-09-04','KLONDYKE','REVIEW - FREETEXT placeholder','']),
  T(['TIB-40099','TIBARD','0000120999','1','OHAPP0785191','FOREST GREEN BIB APRON','12','2026-09-20','Oliver Harvey Ltd','INTERCOMPANY - no works order','Oliver Harvey']),
].join('\n');

// Afternoon paste: everything above again (must not duplicate) PLUS a new line
// added to the SAME Oliver Harvey order, which must become Pt 3, not Pt 1.
const paste2 = paste1 + '\n' + T(['OH-32036999','OLIVER HARVEY','0000114816','5','OHCJSMDEVON6401','DEVON CHEF JACKET SZ 64','4','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']);

(async () => {
  const b = await chromium.launch({executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const pg = await b.newPage();
  const errs=[];
  pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
  pg.on('console', m=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
  await pg.goto('file://'+path+'?edit');
  await pg.waitForTimeout(400);

  const run = async (txt) => {
    await pg.evaluate((t)=>{ document.getElementById('smTA').value=t; smLoadPaste(); }, txt);
    await pg.waitForTimeout(150);
  };

  await pg.click('#tabSpecial');
  await pg.waitForTimeout(150);
  const tabVisible = await pg.isVisible('#smView');
  const bufHidden  = await pg.evaluate(()=>document.getElementById('dataWrap').style.display==='none');

  await run(paste1);
  const a = await pg.evaluate(()=>({
    refs: WOs.filter(w=>w.sm).map(w=>w.ref),
    parts: WOs.filter(w=>w.sm).map(w=>w.sm.so+':Pt'+w.sm.part),
    notes: WOs.filter(w=>w.sm).map(w=>w.ref+'='+(w.sm.notes||[]).length),
    review: smReview.length,
    dues: WOs.filter(w=>w.sm).map(w=>w.ref+' due '+w.due),
  }));

  await run(paste2);
  const c = await pg.evaluate(()=>({
    refs: WOs.filter(w=>w.sm).map(w=>w.ref),
    total: WOs.filter(w=>w.sm).length,
    review: smReview.length,
    notesOnNew: (WOs.filter(w=>w.sm && w.sm.part===3)[0]||{sm:{notes:[]}}).sm.notes.length,
  }));

  // reload the page: state must survive with no buffer data present
  await pg.reload();
  await pg.waitForTimeout(400);
  await pg.click('#tabSpecial');
  await pg.waitForTimeout(200);
  const d = await pg.evaluate(()=>({
    total: WOs.filter(w=>w.sm).length,
    cards: document.querySelectorAll('#smList .sm-card').length,
    review: document.querySelectorAll('#smReviewList .sm-rev').length,
    liveStat: document.getElementById('smStatLive').textContent,
    unitsStat: document.getElementById('smStatUnits').textContent,
  }));

  // a third paste of the identical data must change nothing
  await run(paste2);
  const e = await pg.evaluate(()=>WOs.filter(w=>w.sm).length);

  console.log('tab switches:      ', tabVisible && bufHidden ? 'PASS' : 'FAIL');
  console.log('paste 1 refs:      ', a.refs.join(', '));
  console.log('paste 1 parts:     ', a.parts.join(', '));
  console.log('paste 1 notes/WO:  ', a.notes.join(', '));
  console.log('paste 1 due dates: ', a.dues.join(' | '));
  console.log('paste 1 review:    ', a.review);
  console.log('paste 2 refs:      ', c.refs.join(', '));
  console.log('paste 2 total WOs: ', c.total, '(expect 4 - no duplicates)');
  console.log('paste 2 review:    ', c.review, '(expect 1 - not re-added)');
  console.log('notes on new Pt3:  ', c.notesOnNew, '(expect 2)');
  console.log('after reload:      ', JSON.stringify(d));
  console.log('3rd identical paste:', e, '(expect 4)');
  console.log('errors:            ', errs.length? errs.join(' | ') : 'none');
  await b.close();
})();
