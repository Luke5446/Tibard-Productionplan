# Browser tests

Run against the real `index.html` in Chromium. No build step, no test runner —
`npm i playwright` then `node tests/test-sm.js`.

| File | Covers |
|---|---|
| `test-sm.js` | Special Makes: tab switching, works order creation, `Pt` numbering that **continues** across pastes, note attachment, duplicate suppression, survival across reload with no buffer data loaded |
| `test-sm2.js` | The buffer tile, the live list with pipeline rows, completion into the shared history, and the monthly folders |
| `test-sm3.js` | The mirrored review table: tick, editable quantity, refusing to create nothing, print-template states, and special makes appearing in the shared works order panel |
| `test-import.js` | Importing a costing app export: field mapping, trims with and without a Sage code, measurements becoming a size chart, and the full works order printing from it |
| `test-nowarn.js` | That a code with no works order data warns and points at the operations manager rather than offering an editor, and that an imported fabric rating prints while its cost does not |
| `test-cust.js` | The customer's own order reference: parsed from column L, shown under the account name in both tables, and an older 11-column paste still working |
| `test-wocust.js` | The customer on the printed works order: shown for every special make including when Sage left it blank, carried onto the second page's header, and absent from a stock works order |
| `test-custname.js` | The resolved customer name against real rows — account-is-customer, reference-is-customer, the printed works order, search, and a 12-column paste falling back |
| `test-costedcust.js` | That the customer a product was costed for stands in when Sage has no name at all — the one-customer-per-special rule, so it is safe |
| `test-collapse.js` | The two lists as collapsible banners — collapsing one only, remembering the choice across a reload, a button in a banner not collapsing it, and the live list carrying no action buttons |
| `test-createdat.js` | Creation date stamps: every route a works order is born through, a split inheriting its parent's date, the completed record carrying created/printed dates, a re-opened legacy record staying blank, and a special make's first-seen date following it from the queue to the works order |
| `test-snapshot.js` | The per-paste buffer snapshot: same counts as the tiles, a same-day re-paste replacing rather than appending, the next day appending in order, and the series surviving a reload and reaching the saved state |
| `test-kpi.js` | The KPI tab against a fixture worked out by hand: per-works-order on-time % and lead-time medians (a two-SKU job counted once), specials raised/dismissed, snapshot averages and days below target, the hero and its delta, the tiles, and a hover tooltip |
| `test-regress.js` | That the existing buffer flow still works alongside it — buffer paste, stock `WO-####` auto-numbering, and that a special make does not count towards buffer `On WOP` |

Set `CHROME_PATH` if your Chromium is elsewhere.
