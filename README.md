# Tibard-Productionplan

## The cutting room log

Printing a works order pushes its fabric lines (the main cloth and any extra,
a mesh back) to a small shared file, `cutlog.json`, kept in its own GitHub
repo, `Luke5446/Tibard-Cutlog`. The **Cutting** tab reads that file:

- **To cut** (the chip counts works orders, like the tile): printed works
  orders not yet marked cut, oldest printed first
  (click the Printed or Due heading to sort by that date, again to flip),
  with the standard metres per line; the search box narrows the list. The
  tiles above count the works orders printed today (click it to show only those),
  the works orders with a line waiting, and the lines waiting. One printed
  five or more days ago is flagged. Each works order on the list shows its
  lays and cutting minutes (see "Cutting time" below); one with a code that
  has no lay plan is tagged **no lay plan**. The cutting room PC marks a line, or a
  whole works order, cut: the mark is dated that day. Each line has a metres
  box, started at the standard, and a comment box; a figure that differs from
  the standard needs the comment.
- **Cut log**: what was cut and when. Like the Embroidery tab, the lines come
  up for what is typed in the search box (a works order number, a product
  code or a fabric), with the completion date or "in WIP". **Undo** puts a
  line back on To cut.
- **Metres per day**, by fabric.

A save or a read that GitHub answers with a server error (a 500, as the
cutting room saw at 16:00 on 7 Oct 2026) is tried again after a pause, up to
four times. Each try reads the file afresh and applies the change to that,
so a save that did land despite the error is found done rather than made
twice. Only when every try fails does the cutter see the alert, and the
line stays on To cut to be marked again.

### Cutting time and the target

Luke set the cut room's figures on 7 Oct 2026. A works order takes **25
minutes** to cut for up to **50 lays**; past that, each further 50 lays (or
part) adds **15 minutes**, as the set-up is done and the fabric is laid. The
lays of a line are its quantity over the garments per lay of the default
marker on the lay plan (an apron at 4 per lay: 60 aprons are 15 lays), or
the marker on the works order data; a code with no lay plan is taken at one
garment per lay and flagged. The cut room works 8 hours Monday to Thursday
including two paid 15-minute breaks (450 minutes, 18 works orders) and 5
hours on Friday including one break (285 minutes); nothing at the weekend.

- The **Live works orders to cut** tile puts the queue in those terms: the
  minutes over every works order waiting, how many working days that is
  from today, and the day the work runs out, so the PM sees it coming.
- The **Cutting target** tile is the KPI: what was marked cut on the last
  five working days before today (a works order's lines cut on one day count
  as one run of it) against those days' capacity, 2,085 minutes for a full
  week. Under **90%** the tile goes red. Today so far is shown under it.

A line with no fabric or no metres on file is not sent to the cutting room:
it lands on the **Cutting review** tab (between Embroidery and Cutting, with a
badge) for the production manager. Open the works order and put the fabric
right (the ✎ fabric link on the line); where there is no usage on file, type
the metres for the whole line in **Metres cut** on the panel (it saves as you
leave the box) and the cutting room cuts to that figure. The line goes across
on its own. The log follows the works orders: a change to
one that is not yet cut (quantity, fabric, due date) replaces its waiting
lines a moment after the edit, and a works order already cut is left as cut
whatever is changed on it afterwards. A works order split off another after
that one was cut asks the cutting room for nothing: its cloth was cut with
the parent. A split made while the parent still waits gets its own line and
the parent's quantity follows. **Push to cutting** on the review tab
sends anything still waiting if GitHub was down at the time.

A line the cutting room adjusted on the log carries that figure into the
works order panel and, on completion, into the fabric ledger as the actual
(see FABRIC.md, "The cutting room's figure").

The fabric in work in progress is on the **KPIs** tab: cloth cut and not
completed as at any date, valued at the fabric price the planner holds, for
month end and year end. A line the cutting room marked cut counts at its cut
metres; a live works order line the log never had (printed before the log
began) is taken as cut at standard; a line waiting on the log is still on the
roll and is not WIP. The Sage fabric write-off stays on completion.

Anyone who opens the planner sees the tab (read from GitHub Pages, up to a
minute behind). Writing needs a GitHub token on the PC that writes: the
cutting room's, and the editor's so the push happens on print. A printed
works order deleted in the planner is withdrawn from the list. The token is a
fine-grained one that can write `Tibard-Cutlog` and nothing else, kept in that
browser only (**Set up this PC** on the tab). Every save is a commit, so the
repo's history is the audit trail.

### Setting it up (once)

1. On GitHub, **New repository**: name `Tibard-Cutlog`, public (Pages needs
   it; the file holds works order references, codes and metres only), tick
   **Add a README**. Create it.
2. In that repo, **Settings → Pages**: source "Deploy from a branch", branch
   `main`, folder `/ (root)`. Save. After a minute
   `https://luke5446.github.io/Tibard-Cutlog/` answers.
3. A token: GitHub **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**. Name it "Tibard cutting log",
   expiry one year, **Repository access: Only select repositories →
   Tibard-Cutlog**, **Permissions → Repository permissions → Contents: Read
   and write**. Generate it and copy it (it is shown once).
4. In the planner, Cutting tab, **Set up this PC**: paste the token. Do this
   on the cutting room PC and on the editor's PC (the same token will do).
   The tag changes to "this PC can mark cuts".
5. Print a works order: it appears on the Cutting tab. Works orders printed
   before the token was set come across with **Push to the cutting room**
   (also **Push to cutting** on the Cutting review tab).

A works order due before 29 September 2026, when the log began, is never
pushed: it was cut before there was a list.

The file is created by the first push, so nothing needs adding to the repo by
hand. When the token expires, GitHub emails a week ahead: make a new one and
paste it on both PCs.

## Containers on the water

The stock planner publishes its container purchase orders, with the date each
one lands, at `https://luke5446.github.io/Tibard-Stock-Planner/data.json`. The
planner reads that file on every page load (editor, viewer and warehouse
alike). Under the On POP figure the first container carrying the code is named
with its landing date - blue when Sage already has the PO, grey when it does
not yet, since the PO is raised in Sage only once the goods are on the water -
with every container in the hover. The runway popup lands each container in
its week, so the closing stock there follows the real arrivals. Nothing is
saved and the WOP maths are unchanged: Sage's On POP stays the stock on order.

## Embroidery-only works orders

A customer's code can be a stock garment with their logo on: GIRHT016003 is
HT016003 embroidered for Girlguiding. Such a works order is ticked
**Embroidery only** when it is made (on the Add works order form or the
Create works orders box). The base code to pick is worked out from the code
(the longest tail of it that is a product in the buffer, else the code with
its customer prefix taken off) and can be typed over. An embroidery-only
works order is never the cutting room's: it is not pushed to the cutting log,
not on Cutting review, not in the fabric in work in progress, and its
completion carries no fabric. Its print is the first page only, with a banner
saying what to pick, for the embroidery room. The card and the panel say
**EMB only**.

The base code is the longest stock code in the buffer found inside the
branded code, so GIRHT016003 and TRGHT016003SHARP both pick HT016003. One
that cannot be found is left blank and flagged **base code not found** (a
typed code that is not in the buffer is flagged **not a stock code**): the
panel's **✎ base code** link sets it, and the warehouse cannot book the line
in until it is right.

The life of an embroidery-only works order, each step a mark on the
warehouse log:

1. Made by the PM and published. It is on the Warehouse tab as **needs
   printing**.
2. The warehouse prints it (printed on the tracker too), picks the base
   stock and marks it **Picked**.
3. It appears in the **Embroidery queue** at the top of the Embroidery tab.
   The embroidery manager chooses the machine (1 to 5, or DTF) it goes on; the tab's
   badge counts the picked works orders not yet on a machine. When it is
   embroidered they mark it **Done**.
4. It appears on the Warehouse tab under **EMB to book in**. **Book in +
   files** writes the mark and makes two CSV files for the Sage data exchange
   folder: `EMB_WriteOff_<WO>_<date>.csv` writes the base stock off HOME
   (the fabric write-off layout, reference Embroidery, Manual Reduction) and
   `EMB_BookIn_<WO>_<date>.csv` books the branded code in, in the add-stock
   layout the routine reads: `StockCode,Location,Bin,Qty,StockExported,
   Reference1`, location Home, reference "Embroidery <WO>".
5. The editor takes the book-in mark on its next load: the works order
   completes in the planner as at the day it was booked, with no fabric.
   The booking sits in the one Booked in history on the Warehouse tab,
   marked embroidery, with the home stock written off and the files.

The embroidery room's PC needs the same token as the warehouse's to mark
the machine and done.

## The Warehouse tab

The warehouse's own address (`?warehouse`) now opens the planner on the
**Warehouse** tab, next to Cutting; everyone sees the tab. Two lists:

- **To pick for embroidery**: every embroidery-only works order, from the
  moment it is made, with the base code to pick from stock, the embroidered
  code, the quantity and the customer. One not yet printed says **needs
  printing**: **Print** on the warehouse PC gives the one-page sheet for the
  embroidery room and marks the works order printed on the log, which the
  editor takes on its next load, so the tracker shows it printed too.
  **Picked** marks the line, with the last 30 days underneath and Undo. The
  warehouse reads the published data, so a new works order reaches it on the
  next Publish.
- **EMB to book in**: embroidery-only works orders marked done in the
  embroidery room, with the home stock to write off and the branded code to
  book in; **Book in + files** (see above).
- **Production to book in** and **Booked in history**: as before, items
  completed by production to book into Sage, with Copy ticked, Export CSV
  and the marks.

The marks live in `warehouse.json` in the `Tibard-Cutlog` repo, read the way
the cutting log is: through GitHub Pages for anyone, and through the API on
a PC that holds the token. Marking picked or booked needs the token: a
fine-grained one that can write `Tibard-Cutlog`, set with **Set up this PC**
on either tab (one token serves both logs on that PC). The marks a warehouse
PC kept in its own browser before this move across to the log the first time
that PC opens the tab with a token.

## Publishing for the team

**Publish for team** writes the editor's state to `data.json` in this repo,
which the viewers and the warehouse page read. With a GitHub token on the
editor's PC it puts the file into the repo itself, through the GitHub API,
and the team sees it within a minute; with no token, or if GitHub refuses,
it downloads `data.json` for the upload-and-commit routine and says why.

Setting the token up, once, on the production manager's PC: on GitHub,
**Settings → Developer settings → Personal access tokens → Fine-grained
tokens → Generate new token**; name it "Tibard production planner", expiry
one year, **Repository access: Only select repositories → Tibard-Productionplan**,
**Permissions → Repository permissions → Contents: Read and write**. Copy it
(shown once), then in the planner header **Set up this PC** and paste it. The
button changes to **Token**; an empty box removes it. This is a different
token from the cutting log's, which can write only `Tibard-Cutlog` and so is
safe on the cutting room PC. A token that can write this repo can change the
page itself, so it stays on the one PC that publishes. Every publish is a
commit, so the repo's history holds every version.

## Where the editor's data is kept

In the browser, in two places at once: `localStorage` and IndexedDB, under the
key `tibard_production`. Every save writes both and a load takes the newer.
localStorage alone is capped at about 5 MB for the whole `luke5446.github.io`
origin, which the costing app shares; once the two apps' data passed that,
every save failed silently and printed or deleted works orders came back on
the next open (30 Sep 2026). IndexedDB has no such cap. If a save reaches
neither store the header shows **NOT SAVED** and the editor is told once -
publish straight away and the work is safe in `data.json`.
