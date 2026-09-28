# Works order documents

Existing Excel works orders, and new ones out of the costing app, for special
makes.

## Adding one

1. In GitHub: **Add file → Upload files**, drop it in this folder, commit.
2. In the buffer app, open the works order — click its card in the tracker —
   and press **📎 Link file** in the panel header, then enter the file name.

Naming the file after the works order reference — `S-OH114816-Pt1.xlsx` — keeps
them findable and makes the link the app suggests correct by default.

## Why here rather than uploaded into the app

The app is a single static HTML file with no server, so a file "uploaded" to it
could only live in that one browser: not shared with anyone, and gone the moment
site data is cleared. Keeping documents in the repo means everyone sees the same
file, it survives a cleared browser, and every version is kept.

This is for the **document**. Structured works order data — fabrics, trims,
making detail, times — is not a file: it is entered in the app's works order
data editor and travels to the team inside `data.json` on the next Publish.

## What is here

| File | What it is |
|---|---|
| `S-OH116297-Pt1.xlsx` | Works order for OHAPP061268, the biscuit bib apron with leather trim and the Carmel Valley Ranch logo (JH, 21 Sep 2026). Its structured data is in the app as style OHAPP061268. |
| `lay-plan-styles-2026-09-25.json` | Works order data added or changed on 25 Sep 2026, in the works-order-editor format for the costing app: Oxford trims by colour, the Rick Stein records, the 0544 and 0597 aprons. |
| `OHAPP061268-2026-09-28.json` | The OHAPP061268 record in the same format, with the logo and sketch images. |
| `thread-standards-2026-09-28.json` | The thread standards (chef jacket 220 m, chef trousers 150 m, bib apron 70 m, waist apron 30 m) and every baked-in record with its main thread row set to them, for the costing app. |

## Thread standards

Luke set the metres of thread costed per garment on 28 Sep 2026: **chef
jacket 220, chef trousers 150, bib apron 70, waist apron 30**. In the app the
main thread row of every record carries the standard for its garment kind
(worked out from the record's name and the product code; hats, straps and
tabs have none). A second thread row, a contrast colour, keeps its own figure.
A record imported from the costing app is brought to the standard as it comes
in and again on every load, unless it carries `threadOwn: true`. The costing
app should apply the same rule when a record is created there.

