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
