# Browser tests

Run against the real `index.html` in Chromium. No build step, no test runner —
`npm i playwright` then `node tests/test-sm.js`.

| File | Covers |
|---|---|
| `test-sm.js` | Special Makes: tab switching, works order creation, `Pt` numbering that **continues** across pastes, note attachment, duplicate suppression, survival across reload with no buffer data loaded |
| `test-sm2.js` | The buffer tile, the live list with pipeline rows, completion into the shared history, and the monthly folders |
| `test-sm3.js` | The mirrored review table: tick, editable quantity, refusing to create nothing, print-template states, and special makes appearing in the shared works order panel |
| `test-sm5.js` | The single works order button, the data editor for codes with no style record, the logo section on the standard document, and linking a file in the repo folder |
| `test-sm6.js` | The production manager's real route — pressing WOP on a works order card for a code with no data, adding it there, printing, and that view-only users get a message rather than the editor |
| `test-sm7.js` | That the works order and costing trim lists are read as one: merging the two old shapes on open, adding a trim with no Sage code, the extra print columns, and the trim costs helper seeing edits |
| `test-regress.js` | That the existing buffer flow still works alongside it — buffer paste, stock `WO-####` auto-numbering, and that a special make does not count towards buffer `On WOP` |

Set `CHROME_PATH` if your Chromium is elsewhere.
