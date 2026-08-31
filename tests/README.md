# Browser tests

Run against the real `index.html` in Chromium. No build step, no test runner —
`npm i playwright` then `node tests/test-sm.js`.

| File | Covers |
|---|---|
| `test-sm.js` | Special Makes: tab switching, works order creation, `Pt` numbering that **continues** across pastes, note attachment, duplicate suppression, survival across reload with no buffer data loaded |
| `test-regress.js` | That the existing buffer flow still works alongside it — buffer paste, stock `WO-####` auto-numbering, and that a special make does not count towards buffer `On WOP` |

Set `CHROME_PATH` if your Chromium is elsewhere.
