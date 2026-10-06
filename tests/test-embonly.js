// Embroidery-only works orders and the Warehouse tab. GIRHT016003 is HT016003
// with the Girlguiding logo: the works order, ticked Embroidery only, picks
// the base garment from stock, is never the cutting room's, prints the first
// page only with a banner, and lands on the Warehouse tab to be picked. The
// warehouse PC (same token as the cutting room, same repo, warehouse.json)
// marks it picked; completed items are booked in there too, and the marks a
// PC kept in its own browser before move into the shared log.
const { chromium } = require('playwright');
const T=(a)=>a.join('\t');
const buf=[T(['HT016003','BLACK VELCRO FASTEN SKULL CAP','568','203','0','60','180','360','700']), T(['APP300503','BLACK BIB APRON','40','120','0','30','90','160','300'])].join('\n');
const URL='file://'+require('path').join(__dirname,'..','index.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext(); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 const files={}, shas={}, puts={};
 const enc=s=>Buffer.from(s,'utf8').toString('base64'), dec=s=>Buffer.from(s,'base64').toString('utf8');
 await p.route('https://api.github.com/repos/Luke5446/Tibard-Cutlog/contents/**', async route=>{ const req=route.request(); const file=req.url().split('/contents/')[1].split('?')[0];
   if(req.method()==='GET'){ if(!files[file]) return route.fulfill({status:404, contentType:'application/json', body:'{"message":"Not Found"}'}); return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:enc(files[file]), sha:'sha'+(shas[file]||0)})}); }
   if(req.method()==='PUT'){ puts[file]=(puts[file]||0)+1; const body=JSON.parse(req.postData()); if(files[file] && body.sha!=='sha'+(shas[file]||0)) return route.fulfill({status:409, body:'{}'}); files[file]=dec(body.content); shas[file]=(shas[file]||0)+1; return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({content:{sha:'sha'+shas[file]}})}); }
   route.fulfill({status:405, body:''}); });
 await p.route('https://luke5446.github.io/Tibard-Cutlog/**', route=>{ const file=route.request().url().split('/Tibard-Cutlog/')[1].split('?')[0]; if(!files[file]) return route.fulfill({status:404, body:''}); route.fulfill({status:200, contentType:'application/json', body:files[file]}); });
 await p.route('https://luke5446.github.io/Tibard-Stock-Planner/**', r=>r.fulfill({status:404, body:''}));
 const entries=f=>files[f]?JSON.parse(files[f]).entries:[];
 const open=async(q, token)=>{ await p.goto(URL+q); await p.waitForTimeout(400); await p.evaluate(tok=>{ window.now=()=>new Date('2026-10-06T10:00:00'); window.confirm=()=>true; window.__alerts=[]; window.alert=m=>window.__alerts.push(m); try{ if(tok) localStorage.setItem('tibard_cutlog_token',tok); else localStorage.removeItem('tibard_cutlog_token'); }catch(e){} }, token); };

 // 1. editor: an embroidery-only works order for GIRHT016003 x18, base code worked out; a normal one alongside
 await open('?edit','tok-editor');
 const s1=await p.evaluate(t=>{ document.getElementById('pasteTA').value=t; loadPaste();
   document.getElementById('woRef').value='E-GIR1'; document.getElementById('woStart').value='2026-10-06'; document.getElementById('woDue').value='2026-10-10'; document.getElementById('woTA').value='GIRHT016003\t18';
   document.getElementById('woEmbOnly').checked=true; saveWO();
   document.getElementById('woRef').value='S-AP1'; document.getElementById('woStart').value='2026-10-06'; document.getElementById('woDue').value='2026-10-12'; document.getElementById('woTA').value='APP300503\t5'; saveWO();
   const w=WOs.find(x=>x.ref==='E-GIR1'), i=WOs.indexOf(w);
   const card=document.querySelector('.woc .woc-emb');   // read before the print: a printed card leaves the unprinted list
   let html=''; window.open=()=>({document:{open(){},write(h){html+=h;},close(){}}});
   const ok=printWOPTracked(i,'GIRHT016003',18);
   return {embOnly:w.embOnly, pick:w.pickCode, tickReset:!document.getElementById('woEmbOnly').checked, printed:w.printed, ok, pages:(html.match(/<div class="page">/g)||[]).length, banner:/EMBROIDERY ONLY.*Pick 18 x HT016003 from stock/.test(html), noMfg:!/MANUFACTURING &amp; TIMES/.test(html), card:card?card.textContent.trim():'', badgeTitle:card?card.title:'', base:[embBaseFor('GIRHT016003'), embBaseFor('ZZAPP300503'), embBaseFor('NOTHING')].join()}; }, buf);
 await p.evaluate(()=>{ markWOPrinted(WOs.findIndex(w=>w.ref==='S-AP1')); }); await p.waitForTimeout(800);
 // the cutting log has the apron, never the embroidery-only one; it is not on review either
 const s2={log:entries('cutlog.json').map(e=>e.ref+':'+e.code).join(), scope:await p.evaluate(()=>({review:cutReviewLines().length, notPushed:cutNotPushed().length, wip:cutWip('2026-10-06').total.assumed, inScope:WOs.filter(cutInScope).map(w=>w.ref).join()}))};
 // the panel says embroidery only; the Warehouse tab (editor, live data) lists it to pick
 const s3=await p.evaluate(()=>{ openWOModal(WOs.findIndex(w=>w.ref==='E-GIR1')); const meta=document.getElementById('woModalMeta').textContent.replace(/\s+/g,' '); closeWOModal(); smShowTab('wh');
   return new Promise(r=>setTimeout(()=>r({meta:/Embroidery only .* pick HT016003 from stock/.test(meta), rows:[...document.querySelectorAll('#whPickBody tr')].map(tr=>tr.textContent.replace(/\s+/g,' ').trim()), badge:document.getElementById('whTabCount').textContent, tabOn:document.getElementById('tabWh').classList.contains('on'), viewHidden:document.getElementById('whView').classList.contains('hidden')}),600)); });
 // 2. the warehouse PC: the old address opens the tab as a viewer; with the token it marks the pick; print from there is first page only
 await p.evaluate(()=>{ localStorage.setItem('tibard_production_booked', JSON.stringify({'S-OLD1|APP300503|2026-09-30|4':{booked:'2026-10-01T09:00:00.000Z'}})); });   // a mark this PC kept before
 await p.evaluate(()=>{ const i=WOs.findIndex(w=>w.ref==='S-AP1'); window.now=()=>new Date('2026-10-06T10:00:00'); completeWholeWO(i); completedWOs.push({ref:'S-OLD1', code:'APP300503', desc:'BLACK BIB APRON', qty:4, completed:'2026-09-30'}); saveState(); });
 await p.evaluate(()=>{ localStorage.setItem('tibard_production', localStorage.getItem('tibard_production')); });
 files['data.json']=await p.evaluate(()=>publishState());
 await p.route(URL.replace('file://','file://')+'/../data.json*', r=>r.fulfill({status:200, contentType:'application/json', body:files['data.json']})).catch(()=>{});
 await p.goto('about:blank');
 await p.route('**/data.json*', r=>r.fulfill({status:200, contentType:'application/json', body:files['data.json']}));
 await open('?warehouse','tok-warehouse'); await p.waitForTimeout(1500);
 const s4=await p.evaluate(()=>new Promise(r=>setTimeout(()=>r({tabOn:document.getElementById('tabWh').classList.contains('on'), viewer:document.body.classList.contains('viewer-mode'), badge:document.getElementById('modeBadge').textContent,
   pick:[...document.querySelectorAll('#whPickBody tr')].map(tr=>tr.textContent.replace(/\s+/g,' ').trim()).join(' | '), pending:[...document.querySelectorAll('#whPendingBody tr')].map(tr=>tr.children[2]?tr.children[2].textContent.trim():tr.textContent.trim()).join(), can:document.getElementById('whCan').textContent.trim()}),1200)));
 const migrated=entries('warehouse.json').filter(e=>e.kind==='book').map(e=>e.k+':'+e.bookedAt.slice(0,10)+':'+(e.movedFrom||''));
 const localGone=await p.evaluate(()=>localStorage.getItem('tibard_production_booked')===null);
 await p.evaluate(()=>{ let html=''; window.open=()=>({document:{open(){},write(h){html+=h;},close(){}}}); const pb=document.querySelector('#whPickBody button[onclick^="printWOP"]'); if(pb) pb.click(); window.__whPrint={pages:(html.match(/<div class="page">/g)||[]).length, banner:/EMBROIDERY ONLY/.test(html)}; const mb=document.querySelector('#whPickBody button[onclick^="whMarkPicked"]'); if(mb) mb.click(); }); await p.waitForTimeout(800);
 const s5=await p.evaluate(()=>({print:window.__whPrint, pick:document.querySelectorAll('#whPickBody tr').length, pickText:(document.querySelector('#whPickBody tr')||{}).textContent||'', hist:[...document.querySelectorAll('#whPickedHist tbody tr')].map(tr=>tr.textContent.replace(/\s+/g,' ').trim()).join(' | ')}));
 const picked=entries('warehouse.json').filter(e=>e.kind==='pick').map(e=>e.k+':'+e.pickCode+':'+e.qty+':'+(e.pickedAt||'').slice(0,10));
 // book the apron in from the tick list, then undo one
 await p.evaluate(()=>{ document.querySelectorAll('.wh-pend').forEach(cb=>cb.checked=true); whMarkSelected(); }); await p.waitForTimeout(800);
 const s6=await p.evaluate(()=>({pending:document.querySelectorAll('#whPendingBody tr').length, pendingText:(document.querySelector('#whPendingBody tr')||{}).textContent||'', booked:[...document.querySelectorAll('#whBookedBody tr.booked-row')].map(tr=>tr.children[2].textContent.trim()).join()}));
 await p.evaluate(()=>{ whUnbook('S-AP1|APP300503|2026-10-06|5'); }); await p.waitForTimeout(800);
 const s7={pendingBack:await p.evaluate(()=>[...document.querySelectorAll('#whPendingBody tr')].map(tr=>tr.children[2]?tr.children[2].textContent.trim():'').join()), log:entries('warehouse.json').filter(e=>e.kind==='book').map(e=>e.ref).sort().join()};
 // 3. a plain viewer: sees the tab, no buttons
 await open('','');
 const s8=await p.evaluate(()=>{ smShowTab('wh'); return new Promise(r=>setTimeout(()=>r({can:document.getElementById('whCan').textContent.trim(), buttons:document.querySelectorAll('#whPendingBody button, #whPickBody button[onclick^="whMark"], #whBookedBody button').length, printBtns:document.querySelectorAll('#whPickBody button[onclick^="printWOP"]').length, src:whLog.source}),1200)); });
 console.log('create  ->', JSON.stringify(s1)); console.log('cutting ->', JSON.stringify(s2)); console.log('editor  ->', JSON.stringify(s3));
 console.log('whouse  ->', JSON.stringify(s4), JSON.stringify(migrated), localGone); console.log('picked  ->', JSON.stringify(s5), JSON.stringify(picked)); console.log('booked  ->', JSON.stringify(s6), JSON.stringify(s7)); console.log('viewer  ->', JSON.stringify(s8));
 const pass = s1.embOnly===true && s1.pick==='HT016003' && s1.tickReset && s1.printed===true && s1.ok===true && s1.pages===1 && s1.banner && s1.noMfg && /EMB only/.test(s1.card) && /HT016003/.test(s1.badgeTitle) && s1.base==='HT016003,APP300503,NOTHING'
   && s2.log==='S-AP1:APP300503' && s2.scope.review===0 && s2.scope.notPushed===0 && s2.scope.wip===0 && s2.scope.inScope==='S-AP1'
   && s3.meta && s3.rows.length===1 && /06 Oct 2026.*E-GIR1.*HT016003.*GIRHT016003.*18/.test(s3.rows[0]) && s3.badge==='1' && s3.tabOn && !s3.viewHidden
   && s4.tabOn && s4.viewer && s4.badge==='WAREHOUSE' && /E-GIR1.*HT016003.*GIRHT016003.*18.*Print.*Picked/.test(s4.pick) && s4.pending==='S-AP1' && /can mark/.test(s4.can)
   && migrated.join()==='book|S-OLD1|APP300503|2026-09-30|4:2026-10-01:this PC' && localGone
   && s5.print.pages===1 && s5.print.banner && s5.pick===1 && /Nothing waiting to be picked/.test(s5.pickText) && /06 Oct 2026E-GIR1HT016003GIRHT01600318/.test(s5.hist) && picked.join()==='pick|E-GIR1|GIRHT016003:HT016003:18:2026-10-06'
   && s6.pending===1 && /Nothing waiting to be booked in/.test(s6.pendingText) && s6.booked==='S-AP1' && s7.pendingBack==='S-AP1' && s7.log==='S-OLD1'
   && s8.can==='view only' && s8.buttons===0 && s8.printBtns===0 && s8.src==='pages'
   && errs.length===0;
 console.log(pass?'PASS':'FAIL'); console.log('errors:', errs.length?errs.join('\n'):'none'); await b.close();
})();
