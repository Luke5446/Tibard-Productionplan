// Special Makes: review queue, works order creation, Pt continuation,
// dismissal memory, note attachment, loose search, persistence.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');

const paste1=[
 T(['OH-32036196','OLIVER HARVEY','0000114816','1','OHAPP0785191','FOREST GREEN ADJUSTABLE BIB APRON','12','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-32036200','OLIVER HARVEY','0000114816','3','OHCJSCUMBRIA3603','CUMBRIA CHEF JACKET SZ 36','6','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']),
 T(['OH-32036228','OLIVER HARVEY','0000114816','2','LOGOAPPLICATION','Maldon Salt Logo Centre Bib in White','12','2026-09-11','MALDON SALT','NOTE - charge or logo line','']),
 T(['OH-32036230','OLIVER HARVEY','0000114816','4','','Approved artwork 26.8.26','0','2026-09-11','MALDON SALT','NOTE - free text','']),
 T(['TIB-40011','TIBARD','0000862833','1','CT01964601','CHEF TROUSERS BLACK 32R','20','2026-09-04','KLONDYKE','WORKS ORDER','Tibard']),
 T(['TIB-40012','TIBARD','0000862833','2','FREETEXT','Bespoke tabard - see notes','5','2026-09-04','KLONDYKE','REVIEW - FREETEXT placeholder','']),
 T(['TIB-40099','TIBARD','0000120999','1','OHAPP0785191','FOREST GREEN BIB APRON','12','2026-09-20','Oliver Harvey Ltd','INTERCOMPANY - no works order','Oliver Harvey']),
].join('\n');
const newLine=T(['OH-32036999','OLIVER HARVEY','0000114816','5','OHCJSMDEVON6401','DEVON CHEF JACKET SZ 64','4','2026-09-11','MALDON SALT','WORKS ORDER','Oliver Harvey']);

(async()=>{
 const b=await chromium.launch({executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 await p.goto('file:///home/user/Tibard-Productionplan/index.html?edit');
 await p.waitForTimeout(400);
 const run=async t=>{ await p.evaluate(x=>{document.getElementById('smTA').value=x; smLoadPaste();},t); await p.waitForTimeout(150); };
 const S=()=>p.evaluate(()=>({pending:smPending.length, wos:WOs.filter(w=>w.sm).length,
   refs:WOs.filter(w=>w.sm).map(w=>w.ref), dropped:smDropped.length,
   cards:document.querySelectorAll('#smPendingList input[type=checkbox]').length}));

 await p.click('#tabSpecial'); await p.waitForTimeout(150);

 await run(paste1);
 const a=await S();
 console.log('after paste: nothing auto-created ->', a.wos===0?'PASS':'FAIL', JSON.stringify(a));

 // accept two, dismiss one
 await p.evaluate(()=>{ smCreate('OH-32036196'); smCreate('OH-32036200'); smDismiss('TIB-40012'); });
 await p.waitForTimeout(150);
 const c=await S();
 const notes=await p.evaluate(()=>WOs.filter(w=>w.sm).map(w=>w.ref+'='+w.sm.notes.length).join(', '));
 console.log('accept 2 / dismiss 1:       ', JSON.stringify(c));
 console.log('notes attached:             ', notes, '(expect 2 each)');

 // re-paste everything plus a new line on the SAME order
 await run(paste1+'\n'+newLine);
 const d=await S();
 console.log('re-paste + 1 new line:      ', JSON.stringify(d));
 console.log('  dismissed not re-offered: ', d.pending===2?'PASS (TIB-40011 + new line)':'FAIL');

 await p.evaluate(()=>smCreate('OH-32036999'));
 await p.waitForTimeout(120);
 const e=await p.evaluate(()=>WOs.filter(w=>w.sm).map(w=>w.ref).join(', '));
 console.log('Pt continues after accept:  ', e);

 // loose search
 const srch=async q=>p.evaluate(x=>{document.getElementById('smSearch').value=x; smRender();
   return {pend:document.querySelectorAll('#smPendingList input[type=checkbox]').length,
           made:document.querySelectorAll('#smList .sm-tbl tbody tr').length};},q);
 console.log('search "862833":            ', JSON.stringify(await srch('862833')));
 console.log('search "cumbria jacket":    ', JSON.stringify(await srch('cumbria jacket')));
 console.log('search "maldon logo":       ', JSON.stringify(await srch('maldon logo')));
 console.log('search "klondyke":          ', JSON.stringify(await srch('klondyke')));
 await srch('');

 // undo a dismissal
 await p.evaluate(()=>smUndismiss('TIB-40012')); await p.waitForTimeout(120);
 const f=await S();
 console.log('undo dismiss:               ', JSON.stringify({pending:f.pending,dropped:f.dropped}));

 await p.reload(); await p.waitForTimeout(400);
 await p.click('#tabSpecial'); await p.waitForTimeout(200);
 const g=await p.evaluate(()=>({pending:smPending.length,wos:WOs.filter(w=>w.sm).length,
   pendCards:document.querySelectorAll('#smPendingList input[type=checkbox]').length,
   madeCards:document.querySelectorAll('#smList .sm-tbl tbody tr').length,
   statPend:document.getElementById('smStatPend').textContent}));
 console.log('after reload:               ', JSON.stringify(g));
 console.log('errors:                     ', errs.length?errs.join(' | '):'none');
 await p.screenshot({path:'/tmp/claude-0/-home-user-Tibard-Productionplan/9e51b526-bc55-5d8e-8e7d-d58edac0f137/scratchpad/special2.png', fullPage:true});
 await b.close();
})();
