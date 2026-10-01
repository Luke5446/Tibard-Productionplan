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
| `S-OH116448-Pt1.xlsx` | Works order for OHAPP0534110/222CTS, the putty retail bib apron with cocoa contrast ties for Galloping Gourmet (JH). In the app as style OHAPP0534110/222CTS. |
| `OHAPP0534110-222CTS-2026-09-30.json` | That record in the works-order-editor format for the costing app. |
| `OHAPP0596GD-2026-09-30.json` | OHAPP0596GD with its fabric code CO5014DEN and the rating corrected to 0.72 m, for the costing app. |
| `S-OH116383-Pt1.xls` | Works order for OHAPP053403/07CT, the black retail bib apron with red contrast ties for CNM (JH). In the app as style OHAPP053403/07CT. |
| `OHAPP053403-07CT-2026-09-30.json` | That record for the costing app. |
| `CICJM0193-01-Stock.xlsx` | Stock works order for CICJM0193_ _ 01, the Tibard mandarin collar chef jacket, short sleeve with a mesh back (JH 2017, YL 2018/19). In the app as styles CICJM0193--01 and CICJM0193--03 (the black one derived from it). |
| `CICJM0193-2026-10-01.json` | Those two records for the costing app. |
| `OHAPP300583-Stock.xlsx` | Stock works order for OHAPP300583, the olive green OH bib apron with pocket (JH 2014, amended to 2025). The app's record was rebuilt from it with coded trims. |
| `AP3528-01-Stock.xlsx` | Stock works order for AP352801, the Tibard white 100% cotton waist apron (Yvonne 2017, amended 2019 and 2024). In the app as style AP352801. |
| `WAGCJM0193-01S-Wagamama.xlsx` | Works order for the Wagamama long sleeve mesh back chef jacket, 6" longer body, no pen pocket (JH 2017, longer version 2026). In the app as style WAGCJM0193--01, matching the Sage codes with and without the S. |
| `olive-ap3528-wagamama-2026-10-01.json` | Those three records for the costing app. |
| `brown-apron-wagamama-rating-2026-10-01.json` | OHAPP300582, the brown OH bib apron with pocket made from the olive works order (the same apron, only the cloth and thread differ), and the Wagamama jacket with All Costings brought to its works order rating of 1.35 m. |
| `OHAP300515C-RickStein-CookerySchool.xlsx` | Works order for OHAP300515C, the navy 100% organic cotton OH bib apron with the Rick Stein's Cookery School 2000-2020 logo (YL 2012, amended to 2026), artwork included. In the app as style OHAP300515C with the logo as its own branding. |
| `OHAP300515C-2026-10-01.json` | That record for the costing app. |
| `navy-3005-aprons-2026-10-01.json` | The navy OHAP3005 aprons (OHAP300515, OHAP300515S, OHAP300515TN, OHAPP300515) rebuilt with coded trims from the works order text the app held. |
| `raw-records-rebuilt-2026-10-01.json` | The last thirteen raw records (OHAP3005 colourways, the contrast-tie and leather neck strap aprons, the neck strap, the utility belt) rebuilt with coded trims. |
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
