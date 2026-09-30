# Tibard-Productionplan

## Where the editor's data is kept

In the browser, in two places at once: `localStorage` and IndexedDB, under the
key `tibard_production`. Every save writes both and a load takes the newer.
localStorage alone is capped at about 5 MB for the whole `luke5446.github.io`
origin, which the costing app shares; once the two apps' data passed that,
every save failed silently and printed or deleted works orders came back on
the next open (30 Sep 2026). IndexedDB has no such cap. If a save reaches
neither store the header shows **NOT SAVED** and the editor is told once -
publish straight away and the work is safe in `data.json`.
