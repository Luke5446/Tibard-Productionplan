# Browser tests

Run against the real `index.html` in Chromium. No build step, no test runner —
`npm i playwright` then `node tests/test-sm.js`.

| File | Covers |
|---|---|
| `test-sm.js` | Special Makes: tab switching, works order creation, `Pt` numbering that **continues** across pastes, note attachment, duplicate suppression, survival across reload with no buffer data loaded |
| `test-sm2.js` | The buffer tile, the live list with pipeline rows, completion into the shared history, and the monthly folders |
| `test-sm3.js` | The mirrored review table: tick, editable quantity, refusing to create nothing, print-template states, and special makes appearing in the shared works order panel |
| `test-import.js` | Importing a costing app export: field mapping, trims with and without a Sage code, measurements becoming a size chart, and the full works order printing from it |
| `test-import-editor.js` | Importing a Works Order Editor export (`style-edits-…json`): a new special kept in the app's own shape with its measurement chart and headings, listed under Imported from costing and printing; an edited stock style replacing what prints for its codes without being listed as imported; survival across reload |
| `test-nowarn.js` | That a code with no works order data warns and points at the operations manager rather than offering an editor, and that an imported fabric rating prints while its cost does not |
| `test-cust.js` | The customer's own order reference: parsed from column L, shown under the account name in both tables, and an older 11-column paste still working |
| `test-wocust.js` | The customer on the printed works order: shown for every special make including when Sage left it blank, carried onto the second page's header, and absent from a stock works order |
| `test-custname.js` | The resolved customer name against real rows — account-is-customer, reference-is-customer, the printed works order, search, and a 12-column paste falling back |
| `test-costedcust.js` | That the customer a product was costed for stands in when Sage has no name at all — the one-customer-per-special rule, so it is safe |
| `test-collapse.js` | The two lists as collapsible banners — collapsing one only, remembering the choice across a reload, a button in a banner not collapsing it, and the live list carrying no action buttons |
| `test-createdat.js` | Creation date stamps: every route a works order is born through, a split inheriting its parent's date, the completed record carrying created/printed dates, a re-opened legacy record staying blank, and a special make's first-seen date following it from the queue to the works order |
| `test-snapshot.js` | The per-paste buffer snapshot: same counts as the tiles, a same-day re-paste replacing rather than appending, the next day appending in order, and the series surviving a reload and reaching the saved state |
| `test-kpi.js` | The KPI tab against a fixture worked out by hand: per-works-order on-time % and lead-time medians (a two-SKU job counted once), specials raised/dismissed, snapshot averages and days below target, the hero and its delta, the tiles, and a hover tooltip |
| `test-shared.js` | That a viewer loading data.json gets everything that was published - special makes history, imported works order data, snapshots - and that an editor absorbs published snapshots by date while keeping its own |
| `test-fabric.js` | Fabric usage: the All Costings lookup, the *Metres cut* column pre-filled with the standard, an actual typed by the cutting room surviving a reload, the completed record carrying standard and actual, the write-off CSV with its exported marker and a second run finding nothing, and the KPI fabric columns |
| `test-markers.js` | Per-size markers: a 32" and a 64" Cheshire getting their own figures plus mesh, a two-garment Cumbria marker averaged, precedence over the flat All Costings figure, an apron staying on All Costings, mesh as its own write-off line, and the KPI total including it |
| `test-fabtab.js` | The Fabric tab: prices frozen on the record, months and days collapsed by default and opening one at a time, ticking a day / everything, exporting only the ticked lines with the file name marked on each, nothing ticked exporting nothing, dismiss and undo, an actual typed in the tab, undoing an export, the state surviving a reload and a completion undo, and the viewer seeing the ledger without controls |
| `test-smrefresh.js` | A line the app already holds being refreshed by a later paste: the outstanding balance and promised date updating on a dismissed line and on a queued one, the first quantity kept as *was N*, a typed to-make figure clamped to the new balance, undo bringing back the current balance, an unchanged paste reporting nothing, and the change surviving a reload |
| `test-smlogo.js` | Sales-order logo lines on stock-style works orders: the stock-style test against the real works order data and a buffer, a logo line anchored to the garment above it and a note above the first garment attaching to it, a customer-owned style and an unknown code getting nothing, a handling charge dropped, the lines on the live list, the card, the panel and the print under *Embroidery*, a re-paste with a changed spec reaching the live job, and the state surviving a reload and reaching a viewer |
| `test-smanchor.js` | The anchoring edge cases: a logo line under a garment the sheet does not show left unattached rather than given to the special make below, the complete sheet (stock-held lines present) anchoring exactly and never offering those lines, a garment despatched between pastes keeping its logo, a filtered paste leaving kept lines alone, a double paste not duplicating, a free-text note printing as a note but not as embroidery, the ECO / XXS / length-letter families, and a re-paste reaching the card |
| `test-regress.js` | That the existing buffer flow still works alongside it — buffer paste, stock `WO-####` auto-numbering, and that a special make does not count towards buffer `On WOP` |

Set `CHROME_PATH` if your Chromium is elsewhere.
