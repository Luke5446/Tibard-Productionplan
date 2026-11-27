# Tibard-Productionplan

## The cutting room log

Printing a works order pushes its fabric lines (the main cloth and any extra,
a mesh back) to a small shared file, `cutlog.json`, kept in its own GitHub
repo, `Luke5446/Tibard-Cutlog`. The **Cutting** tab reads that file:

- **To cut** (the chip counts works orders, like the tile): printed works
  orders not yet marked cut, oldest printed first.
  A works order on this list **cannot be completed** in the planner, whole
  or one line, until the cutting room marks it cut (13 Nov 2026): the cloth
  has not been cut, so nothing can have been made. Embroidery-only and
  finishing works orders have no cutting and are not held. A works order
  deleted in the planner has its waiting lines **withdrawn**; if it is then
  raised again under the same number and printed, the withdrawn line comes
  back (WO-1757, 5 Nov 2026: printed, deleted and raised again within a
  minute, and left off the list for a week). Test: `tests/test-cutrevive.js`.
  (click the Printed or Due heading to sort by that date, again to flip;
  **Sort by fabric** groups the list by fabric, biggest run first, with the
  running metres down each group and a dashed line where they pass each
  100 m, a full roll being 100 to 120 m, so the cutter sees what cuts in a
  row off one roll; Luke, 26 Oct 2026).
  **Filter by demand** (Luke, 2 Nov 2026): the due date alone is not the
  measure of what is needed first, since a works order raised for stock
  with a two-week date is wanted tomorrow once the shelf is empty. The
  **Needed** column reads each line against the planner's figures for its
  code: the free stock before any live works order (In stock less On SOP,
  plus completed works orders awaiting Sage), the days that stock lasts at
  the sales rate, the earliest sales order the works order covers (from the
  SOPDemand paste) and the works order's own due date, and puts it in a
  band: **sold out** (no free stock before the works orders, or oversold),
  **this week** (needed within 7 days, or under 7 days of stock), **2
  weeks** (within 14 days) or later. The Needed heading sorts by band then
  date; the **Needed** chips (Sold out, This week, Within 2 weeks) keep one
  band and the ones above it, a works order counting in the band of its
  most needed line; then Sort by fabric groups just those, the most needed
  fabric first and the biggest run next, the most needed line first down
  each group. The hover on the cell says why. Nothing is written to the
  log: the bands are read afresh from the published planner data each
  time, so a cutting room PC with no stock figures sees the dates only),
  with the standard metres per line; the search box narrows the list. The
  tiles above count the works orders printed today (click it to show only those),
  the works orders with a line waiting, and the lines waiting. One printed
  five or more days ago is flagged. Each works order on the list shows its
  lays and cutting minutes (see "Cutting time" below); one with a code that
  has no lay plan is tagged **no lay plan**. The cutting room PC marks a line, or a
  whole works order, cut: the mark is dated that day unless the date box
  beside the Cut button is put back (a works order cut on Friday and only
  marked on Monday goes to Friday's KPI, not Monday's). The box opens on
  today and cannot go ahead of it, or before the day the works order was
  printed; **Cut all** takes the date on the works order's first line. Each
  line has a metres box, started at the standard, and a comment box; a
  figure that differs from the standard needs the comment. The standard
  includes the 3 cm of wastage the cutting room adds to every ply laid
  (the GT, 14 Oct 2026; see FABRIC.md, "The 3 cm per ply").
- A back-dated mark is tagged **back-dated** on the cut log, with the day it
  was marked in the hover.
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
garment per lay and flagged, until the PM sets its lay (**set lay** on the
tag, or **✎ lay** on the works order panel), which every works order of the
product then uses. The OH detachable tabs (OHTAB codes) are cut by hand
with scissors: no lay, and **35 seconds a tab** instead of the set-up. The cut room works 8 hours Monday to Thursday
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

## The buffer sheet, the sales orders behind it, and the Clockwork codes

`sage/Buffer Live.xlsx` (built by `tools/build-buffer-workbook.py` from
`sage/70-buffer-live.sql` and `sage/71-buffer-sop-demand.sql`) replaces the
Buffer_Report workbook: Refresh All, then the **Paste** sheet (both halves
as one table, `sage/74-buffer-paste.sql`) goes into the one **Paste buffer
stock data** box; the two halves pasted separately work too. The Buffer sheet's first
nine columns are the old paste; from column J the planner also reads the
category, the **Clockwork** flag (column N, the code is on the Clockwork
Bulk list), the lead time and the minimum level. The SOPDemand sheet is
every live sales order line for a stock-held code.

- **Clockwork codes** stay on the table with a **CW** tag and have no WOP
  REC (nothing for production to make). The headline counts every code
  pasted, but the % Good, the status tiles, the status filter, the buffer
  snapshots and the KPI tab are measured on the rest: their stock is the
  stock planner's, not production's. A **Hide Clockwork** tick box in the
  filter bar takes them off the table (Luke, 9 Oct 2026).
- **Who covers each sales order** is worked out after every paste and every
  change to the works orders: the stock on the shelf covers the oldest
  promised date first, then the live works orders in the order they were
  raised. Demand 15, 10 in stock, a works order for 20: the oldest order's
  10 come from stock and the works order is for the next one. Every open
  order for the code is listed all the same: on the card (the earliest due
  and how many more), on the panel, as a **Sales orders** row at the top of
  the printed works order with this one's in bold, and in the On SOP cell's
  hover. A later paste moves the dates and drops despatched lines.
- **The pop-out behind On SOP** (Luke, 19 Oct 2026): a click on the row, or
  on its On SOP figure, opens the Stock Runway pop-out with a **Sales orders
  on SOP** table above the runway: every open line for the code, oldest
  promised first, with the sales order, the customer and account, their
  order number, the outstanding quantity, the ordered and promised dates (a
  promised date that has passed in red) and who covers it - so the customer
  and the due dates are there without going back to Sage. A code on SOP
  with no SOPDemand paste says to paste the sheet.

Since 27 Nov 2026 the BULK codes are retired (stock written off into the home
codes; containers bought in on the home codes), so Sage's Bulk list view may
thin out. `70-buffer-live.sql` now also lists any code with a BULK stock item,
and the planner marks a buffer row Clockwork when the stock planner's
`data.json` tracks its code (the Clockwork code master), on load and after each
paste. The fabric purchase order file never BULK-prefixes a line now.

## Make for 4 weeks or 12 weeks

The buffer toolbar's **Make for** toggle sets how many weeks' sales WOP REC
covers: 4 as standard, 12 when the factory is quiet and stock is to be built
for the busy months (Luke, 9 Oct 2026). Only the recommendation changes; the
status colours and the % Good KPI stay at 28 days so the series stays
comparable. The choice is saved, published, and shown to viewers as text.

## Cutting KPIs

The **Cutting target** tile is the day's figure: minutes credited for what
was marked cut today against the day's capacity (450 Monday to Thursday,
285 Friday; on a Saturday or Sunday it shows Friday), red under **85%**.
**Cutting KPIs** on the Cutting tab (the third chip) has the week: the last
five working days against capacity, today so far, and a day-by-day table
with the works orders cut, the lines, the metres, the minutes against the
day's capacity, the works order numbers and the fabrics. The "Live, not on
the log" tile is gone; the fabric in WIP stays on the KPIs tab.

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
3. It is in the **Embroidery queue** at the top of the Embroidery tab from
   the moment it exists (since 18 Nov 2026; before, only once the warehouse
   had marked it picked). A line the warehouse has not marked picked says
   **not picked yet**. The embroidery manager chooses the machine (1 to 5,
   or DTF) it goes on; the tab's badge counts the works orders not yet on a
   machine. When it is embroidered they mark it **Done**. The PM cannot
   complete an embroidery-only or DTF works order from the card or the
   panel (the button is gone and the function refuses, 18 Nov 2026): doing
   so skipped the done mark and the book-in, so the job vanished from the
   Embroidery tab and the stock never moved in Sage.
4. It appears on the Warehouse tab under **EMB to book in**. **Book in +
   files** writes the mark and makes two CSV files for the Sage data exchange
   folder: `EMB_WriteOff_<WO>_<date>.csv` writes the base stock off HOME
   (the fabric write-off layout, reference Embroidery, Manual Reduction) and
   `EMB_BookIn_<WO>_<date>.csv` books the branded code in, in the add-stock
   layout the routine reads: `StockCode,Location,Bin,Qty,StockExported,
   Reference1`, location Home, reference "Embroidery <WO>".
   Every reference written to a Sage import file (write-off, add-stock, EMB
   book-in, stock take) is held to Sage's limit of 20 characters, spaces
   included - a longer one makes the routine reject the file. A long one
   drops its label first ("Stock Take ADJ-7" becomes "ST ADJ-7", then the
   note alone) and is cut at 20 only as a last resort; the stock take's
   Sage ref box warns when that will happen (30 Oct 2026).
5. The editor takes the book-in mark on its next load: the works order
   completes in the planner as at the day it was booked, with no fabric.
   The booking sits in the one Booked in history on the Warehouse tab,
   marked embroidery, with the home stock written off and the files.

The embroidery room's PC needs the same token as the warehouse's to mark
the machine and done.

**Done history** (18 Nov 2026) sits under the queue: every job ever marked
done, by the day it was marked, with the machine and whether the warehouse
has booked it in, searchable by works order, code, customer or machine and
folded into month folders like the warehouse's Booked in history (this
month open). The done mark on the log is kept when the line is booked in
and leaves the queue, so nothing marked done is lost. A line the PM
completed from the card before the guard is in the history too, flagged
**completed from the card**, and on the Warehouse tab under **EMB to book
in** with the same flag, so the warehouse can still make the two Sage
files for it. Test: `tests/test-embhist.js`.

### DTF transfer works orders

Since 16 Nov 2026 a special make whose code is **TRG** + a Tibard stock code
+ **SHARP** (TRGAP300503SHARP is AP300503 with the customer's DTF logo on)
is raised from the special makes tab like any other, and comes out as an
embroidery-only works order flagged **DTF**: the stock code in the middle is
the pick, nothing is cut, and it follows the same life (printed, picked, the
Embroidery queue, booked in with the two Sage files). Because it is raised
from the special makes tab, the customer, sales order and customer order
number come through to the print. The print is the first page only, with a
**DTF TRANSFER** banner and band: the DTF logo ID (always 113555), the
application ("Top left as worn") and the photo of the
logo in position on the apron. The same code typed on the Add works order
form is treated the same way. Test: `tests/test-dtf.js`.

## The Jacket plan tab

Who makes which jacket works order (Luke, 24 Nov 2026). Worked out afresh
every time the tab opens, from the live works orders and the sales orders
behind them (the SOPDemand paste), so a works order raised or a paste done
this morning is in the plan straight away:

- Every live works order line for a jacket is a job (embroidery-only and
  finishing works orders are not sewn here and are left out). A job is a
  **customer order** when the line covers a sales order (the pasted orders,
  oldest promised date first, after the shelf stock) or the works order is a
  special make; its *Needed by* is the earliest promised date it covers.
  Anything else is a **stock** works order with its due date.
- Customer orders come first, earliest promised date first; then the stock
  works orders by due date. Each job goes whole to the machinist who would
  finish it soonest; the PM can pin a job on someone (the select on the line),
  and "auto" hands it back.
- Hours: each person's minutes per day after breaks (450 Mon-Thu, 285 Fri;
  Champa 390; Christine Ormisher Mon-Thu only), holidays, a first day (the
  apron staff moving onto jackets) and a last day before Christmas, and an
  efficiency (85 for the jacket machinists, since 100% capacity is 85%
  efficiency, Luke 24 Nov 2026; 40 for the new jacket staff).
  Bank holidays and the shutdown (25 Dec to 3 Jan) are no work. Anne Marie
  is off sick and out of the plan until ticked back in.
- **Can't sew** (Staff & hours): words from the style, such as `STRATFORD,
  DERBYSHIRE`. The plan never gives that person those jackets on its own;
  a pin, a drag or a share still can, and the line is flagged. Champa,
  Jacqueline and the new jacket staff start with the Stratford and the
  Derbyshire (Luke, 24 Nov 2026).
- Minutes per jacket: the costing app's machining minutes for the style
  (Oxford 32, Devon 31.9, shirt-style 4007/4008 40.7), a figure typed in
  the tab's *Minutes per jacket* table, or the stand-in 32 marked `?` on the
  line and counted on the tile. Cutting and finishing are not in these
  minutes.
- *Jacket orders with no works order yet*: jacket sales order lines that
  stock and the live works orders do not cover (Clockwork container codes
  left out), and special makes still in the queue.

- The tab runs: the tiles, *Jackets planned by week* (each cell is the
  jackets that person can make in the week from the minutes they have, so a
  line that runs over a weekend is split between the weeks; click a cell for
  that person's works orders, how many of each are made that week, and what
  started earlier or carries on; a red cell where a
  person has a line finishing after its date, amber where their week is 95%
  or more full; a running total of the minutes the orders need by each week
  against the team's minutes, red where the promises outrun the team; and a
  warning naming the works orders that will not be made before the shutdown),
  then each machinist as a closable banner, all closed to start (click the
  name; the choice is remembered on the PC), then the priority list (closed until opened), the
  orders with no works order, and the lines marked done.
- **Drag to reorder** (editor): drag a line by its grip up or down a
  person's list, or into another person's list. Every line in that list is
  then pinned to the person and worked in that order (marked with a pen),
  ahead of anything the plan adds after them; **Reset order** on the banner
  hands the list back to the plan. Kept in `jkPlan.order`, published with
  the rest.
- **Share** (editor) splits a works order line between several machinists
  so they work on it together: a quantity per person, the rest left for the
  plan to place. Each part is planned on its person, marked *shared* with
  "of N"; Done works per part; **Clear share** puts the line back whole.
  Kept in `jkPlan.split`.
- **Print list** on a person's banner (25 Nov 2026) opens a print sheet for
  that machinist once the PM is happy with it: name, last day and days off,
  then their lines in working order (works order, code, qty, minutes, start,
  finish, needed by, customer) with a tick box each. Print only; nothing saved.
  **Ticks** (26 Nov 2026): a tick box at the start of each line; when any
  are ticked the button reads *Print n ticked* and the sheet carries only
  those, so the PM can hand out a few works orders at a time while the plan
  is still moving. *Clear ticks* unticks the person. Ticks are kept on the
  PC (`localStorage` `tibard_jk_ticks`), not published, and go when the
  line leaves the plan.
- **Search** (26 Nov 2026): the box in the tab header narrows every list to
  the lines matching a works order, code, style family, customer or
  machinist; people with no match are hidden, matching ones open.
- **Only sew** (26 Nov 2026): a per-person box in Staff & hours (next to
  Can't sew). While it holds a word (OXFORD), the plan gives that person
  nothing but those styles. Karen Tuohey and Christine Burgess start on
  OXFORD while training; clear the box when they are trained. Kept in
  `s.only` on the staff row.
- **A pin with no time left** (26 Nov 2026): a line pinned to someone who
  has no minutes left before their last day used to sit unplaced and count
  as "not made before the shutdown" even with the team free. The plan now
  places it with whoever is free and marks it *no time: was <name>*; pick
  a machinist to pin it elsewhere, or auto to clear the pin.
- **Stock works orders with a sales order on the code** (26 Nov 2026): the
  planner gives stock on the shelf to the oldest orders first, so such a
  works order is "stock" rather than a customer order. It is still judged
  against the earliest live order's promised date (red if it finishes after
  it, green if not) and shows "SO nnn customer" under For. Its place in the
  queue is unchanged: customer orders first, then stock by due date.
- **Promised column** (26 Nov 2026): the newest promised date of the sales
  orders behind the line (the orders the works order covers; for a stock
  line, every live order on the code), with the count when there are
  several. Click it for the list, newest promise first: order, customer,
  quantity from this works order (or ordered), promised, ordered on. Also on
  the print sheet.
- **Nothing is auto-assigned** (26 Nov 2026, Luke: capacity was pushing
  uncut works orders to the top of the operators' lists). A line is planned
  on a person only once the PM has issued it: by picking a machinist in the
  **Ready to issue** list (above the people; can't sew and no time are
  greyed, a late finish is shown; not cut is allowed so what is coming from
  cutting can be planned), by dragging it into a person's list, or by a
  share. The week table and the tiles show only issued lines, with a note
  of how many are still to issue. *Back to ready* on a line un-issues it.
  A closed banner, **If every works order were auto-assigned**, shows the
  what-if over all live lines (issued ones kept where they are) with its
  own drill-down and a button to issue the unissued lines as shown. A line
  issued to someone with no minutes left before their last day stays with
  them flagged *no time* (the what-if moves it on). Pins, hand order,
  shares and done marks are unchanged in `jkPlan`; scheduler
  `jkSchedule(jobs, mode)` takes `'pm'` (default) or `'auto'`.
- **Piecework sewing minutes** (27 Nov 2026, Luke): the costing app's
  SEWING TIME is the PW piece price from the All Costings sheet divided by the
  wage rate (GBP 12.71/hr, so 21p a minute): Cheshire 38 GBP 5.52 = 26.1 min,
  Hampshire GBP 8.28 = 39.1 min, Stratford GBP 8.19 = 38.7 min. That sheet is
  embedded in the costing app's page (`COSTDATA`), so the tab reads it from
  `luke5446.github.io/costing/index.html` once a day, keeps the code to
  piece-price map on the PC (`localStorage` `tibard_jk_pw`) and uses it,
  with 6 min finishing, for every style with no timed costing figure. Order:
  a figure typed in Minutes per jacket, the style's timed costing (and the
  Oxford/Devon/4007 list), piecework, then the 32 min stand-in. A size the
  sheet has not priced takes the middle price of its style family. Shown as
  the *piecework* pill in Minutes per jacket; the minutes cell's tooltip
  gives the piece price behind it. Rate constant `JK_PW_RATE` matches the
  costing app's current setting.
- **Clear all issued work** (27 Nov 2026) in the tab header takes every
  line off every machinist (pins, hand order and shares) so the PM can start
  afresh from Ready to issue; done marks stay. The old plan is kept on the
  PC (`localStorage` `tibard_jk_cleared`) and **Undo clear** puts it back.
- **Needed by is the works order due date** (26 Nov 2026, Luke: WO-1998 is
  promised for the 17th but due on the 10th because the order needs
  embroidery after sewing). The earliest sales order promise is kept beside
  it: a due date later than that promise shows *due after promise*; a line
  that finishes after the promise shows *misses promise* (and *moved: after
  promise* when the PM pinned or dragged it there). The queue sorts customer
  orders first, then by the needed-by date.
- **Not cut chip** (26 Nov 2026): under the works order number when the
  cutting log has no cut line for it yet (the tab reads the log once).
- **Layout** (26 Nov 2026): the search box sits just above the people; the
  "Who makes what" heading and its instructions are gone.
- 26 Nov 2026: the efficiency % is no longer shown beside a trainee's name in
  the week table or on their banner (it stays in Staff & hours).
- **Done** on a line (editor) means made and in finishing: it leaves the plan
  and is listed under *Done - in finishing* with an **Undo**. The mark lives
  with the plan, so it is published with the next Publish and goes when the
  works order is completed or deleted.

Staff, holidays, pins, done marks and typed minutes are kept in `jkPlan` in
the saved and published state; an editor absorbs a published plan saved later than
its own (the other editor PC's). Test: `tests/test-jacketplan.js`.

## The Warehouse tab

The warehouse's own address (`?warehouse`) now opens the planner on the
**Warehouse** tab, next to Cutting; everyone sees the tab. Two lists:

- **To pick for embroidery**: every embroidery-only works order, from the
  moment it is made, with the base code to pick from stock, the embroidered
  code, the quantity and the customer. One not yet printed says **needs
  printing**: **Print** on the warehouse PC gives the one-page sheet for the
  embroidery room and marks the works order printed on the log, which the
  editor takes on its next load, so the tracker shows it printed too.
  **Picked** marks the line and moves it to the **Picked history** folder
  below (27 Nov 2026, Luke): a closed banner holding every pick, newest
  first, with a search and an Undo that puts the line back. The
  warehouse reads the published data, so a new works order reaches it on the
  next Publish.
- **EMB to book in**: embroidery-only works orders marked done in the
  embroidery room, with the home stock to write off and the branded code to
  book in; **Book in + files** (see above). **Tick boxes + Book in ticked
  + files** (27 Nov 2026): tick the lines (or tick all) and one write-off
  file and one add-stock file are made covering every ticked line, a row
  per works order with its own reference, then every line is marked booked
  (`EMB_WriteOff_<n>lines_<date>.csv`, `EMB_BookIn_<n>lines_<date>.csv`).
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

## Standard costs and finishing-only works orders

The KPI tab has a **Paste standard costs** box (6 Nov 2026): paste `code [tab]
standard cost` lines from `sage/80-standard-costs.sql` (Tibard's company holds the cost
for OH codes too), Save, then Publish for team. Sage has ~107k
costed codes, so only the ones the planner knows are kept (buffer rows, works orders
live and completed, the style master, and any BULK codes still on file): a new special
make's code is picked up by the next paste. The list goes out in `data.json` as
`stdCosts` (`costs`, `pastedAt`, `finishAdd`) and the Operations KPIs dashboard
values each month's completed garments at it, from October 2026.

A works order for a Clockwork code can be ticked **Finishing
only** (in the Create Works Orders box, offered only when a ticked code is a
Clockwork code and marking only those; and on the manual form once such a code
is typed). The works order carries `finishing: true`, so does its completed line,
and it is valued at the code's standard cost plus £1. Until 27 Nov 2026 that was
the BULK code's cost; the BULK codes were retired that day and the home code now
carries the bought-in cost, so the home code's cost is used, with a BULK cost
still on the list standing in for a code with no home code's cost. No cloth is cut for it, so it is not sent to the cutting log and
has no fabric record. A split or an undone completion keeps the flag.

## Cloth held at Tiajo for call-off

Tiajo weave to the annual call-off and hold the cloth until a purchase order
calls it off. The Fabric tab's order panel for Tiajo (pick the supplier in the
drop-down) has a **Held at Tiajo Comercio for call-off** table: their code,
our Sage code, held metres, metres per week from the last 13 weeks of
completed works orders, weeks of cover, and the flag. Told today, cloth is
ready in 8 weeks and an order goes about monthly, so under 12 weeks cover
says **Put into work**, under 24 **Next order**.

- **A purchase order file** made on the panel takes its metres off the held
  figure line by line, the moment the file is made (the alert says so).
- **Paste statement** reads Tiajo's own lines, code / description / metres,
  with their "14 094,20" figures; the difference from the held figure is
  logged as a balance movement.
- **± Movement** adds or takes off metres with a note, e.g. cloth air
  freighted to Clockwork. ✕ on a movement removes it.
- **Log (CSV)** downloads every movement with the running balance.

The opening ledger is Tiajo's statement of 6 Nov 2026 with 1,000 m of black
X133ECO125 and 1,000 m of navy X133ECO297 taken off for the Clockwork air
freight. It seeds once in the editor and goes out with publish; the book is
`fabStock.held[account]` = `{codes:{supplierCode:{code,name}}, moves:[{at, sup,
code, kind, qty, note, file}]}`, held = the sum of the movements.
Test: `tests/test-held.js` (6 Nov 2026).

## Publishing for the team

**Publish for team** writes the editor's state to `data.json` in this repo,
which the viewers and the warehouse page read. With a GitHub token on the
editor's PC it puts the file into the repo itself, through the GitHub API,
and the team sees it within a minute. With no token on the PC nothing is
published: a red **Please add a token to publish** warning appears beside
the button until one is set up (26 Oct 2026; before that it downloaded
`data.json` for the upload-and-commit routine, which looked like a publish
to anyone not expecting it). If GitHub refuses the token it still downloads
`data.json` and says why.

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

### Due dates moved from the order tracker

Since 9 Nov 2026 the sales office can move a works order's due date from the
order tracker (`Luke5446/SOPtracker`, `?edit`). Its Publish reads this repo's
latest `data.json`, changes only that works order's `due`, stamps the record
`dueSetAt` / `dueSetBy: "ordertracker"` and puts the file back. Because the
editor's own browser copy is the truth here, the editor takes such a date in
two places: when the page opens (`mergePublishedSnapshots`) and again just
before its own publish (`absorbPublishedDue`), so a planner publish from a
page opened earlier does not undo it. The editor's own due date edits are
stamped `dueSetBy: "planner"`; whichever stamp is later wins, so a date the
production manager moves after the sales office does is kept. Both reads
go through the GitHub API (the repo's own copy, current the moment the
tracker commits it) when the PC has a token, and fall back to the Pages copy
otherwise: Pages lags a commit by a few minutes, which is how WO-1558's new
date was missed on 11 Nov 2026 by an editor page loaded inside that window.
Test: `tests/test-duedate.js`.

## Waste on the works order card

Since 27 Nov 2026 the works order card carries the **Waste** box (one box for
a one-line works order, beside the completion date; one box per line above
it for a works order with several lines), so spoiled garments go in with
Complete whole WO without opening the contents popup. The box works exactly
as the popup's: the rest are booked in as made, the cloth for all of them is
still written off, a blank box is no waste. The contents popup itself no
longer scrolls sideways: its columns wrap and the popup grows downward.
Test: `tests/test-waste.js`.

## Where the editor's data is kept

In the browser, in two places at once: `localStorage` and IndexedDB, under the
key `tibard_production`. Every save writes both and a load takes the newer.
localStorage alone is capped at about 5 MB for the whole `luke5446.github.io`
origin, which the costing app shares; once the two apps' data passed that,
every save failed silently and printed or deleted works orders came back on
the next open (30 Sep 2026). IndexedDB has no such cap. If a save reaches
neither store the header shows **NOT SAVED** and the editor is told once -
publish straight away and the work is safe in `data.json`.

### One window at a time

Each open window or tab of the editor holds its own copy of the planner in
memory. A change saved in one is not seen by another until that one reloads,
and a save from the older window would put its older copy back over the
newer work (Luke, 7 Oct 2026: WO-1306 completed with its quantity changed,
published, and back as if never completed). So every page remembers when the
state it holds was saved; every save also notes its time under a small key
of its own, and before writing a page reads that note: newer than what it
holds means the page is behind. Its change is not saved, the
header says **NOT SAVED - this page is behind, reload it**, an alert explains,
and Publish refuses too. Reload the page, which picks up the latest, and do
the change again. Keep the editor in one window; a second window is fine for
looking, not for changing.

When the state outgrows the browser's localStorage (about 5 MB) the header
shows **kept in IndexedDB only**: that is fine, IndexedDB holds it and
Publish works as usual, but clearing the site's data would lose what is not
published.
