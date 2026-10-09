# Buffer v2: the new sheet and what the planner does with it

Luke's ask, 9 Oct 2026, in five parts. Where each one stands and what is
still to decide.

## 1. Make for 4 weeks or 12 weeks  (done)

A **Make for** toggle in the buffer toolbar: 4 weeks as standard, 12 weeks
when the factory is quiet. It changes **WOP REC** only: make enough for 84
days' sales instead of 28, and a container landing inside the 12 weeks
counts from the week after it lands. The status colours (critical, low, OK,
healthy) and the **% Good** KPI stay at 28 days, so the KPI series stays
comparable month to month. The choice is saved with the state, published,
and a viewer sees it as text. Each buffer snapshot records which horizon
was in force.

Not done, worth considering: when 12 weeks is on, the **Create WOs** box
could offer the extra quantity as a second works order with a later due
date, so the 4-week need is cut first and the stock-building part follows.

## 2. Sales order numbers and due dates on the works order  (done)

Today the buffer carries one number per code, On SOP, so the planner cannot
say which orders a works order is for. `sage/71-buffer-sop-demand.sql`
brings the lines: order number, outstanding quantity, promised date,
customer, both companies, for every stock-held code.

Luke's rule (9 Oct 2026): oldest promised date first, but the stock on the
shelf covers the oldest orders first; a works order is for what the stock
does not reach, and every open order for the code is listed on it anyway.
Built as:

- After every paste and every change to the works orders, each code's open
  lines are sorted by promised date; the stock (plus the pipeline) covers
  them in turn, then the live works orders carrying the code in the order
  they were raised, each up to its quantity. What is left is "not covered".
- The card shows the earliest order this works order covers and how many
  more; the panel lists every open order for the code with who covers it
  (this works order's in bold); the printed works order carries the same
  list as a **Sales orders** row at the top; the On SOP cell's hover lists
  them too.
- Intercompany lines are listed and marked; they count as demand like any
  other (both companies' orders are in the sheet, so the OH order and the
  Tibard order for the same job both appear - the mark says which is which).

Still open: should the works order's due date default to the earliest
promised date it covers? Not done; the batch's one due date stands.

## 3. Clockwork codes out of the stock KPI  (done)

The sheet says which codes are Clockwork's (column N, `ClockworkMade`): the
code is on the Clockwork Bulk list, the `eve_AllLiveSOPPOPStockBULK` view,
which Luke chose over Sage's Manufacturer field (most of these codes still
say Tibard there). Built as:

- A Clockwork code stays **on the table** (the PM still sees it, with the
  containers under On POP) but is **left out of the SKU count and % Good**,
  the four status tiles, the buffer snapshots and the KPI tab's in-stock
  series. A small tile says how many were left out.
- WOP REC for a Clockwork code is 0 and the tick box is off: nothing is made
  here for it.
- A Clockwork code that is also made here sometimes (dual-sourced) needs a
  rule: suggest **Manufacturer = Tibard/Oliver Harvey wins** and the code
  stays in the KPI.

The old workbook's typed Clockwork column and the Bulk list agree on 343
of the 344 buffer codes it marked, so nothing is lost by reading the view.

## 4. Works orders cut per day  (done)

The Cutting tab's **Metres per day** table has a **Works orders** column
(a works order cut in two lines on one day is one works order) and the **Cut
today** tile says how many works orders as well as lines.

## 5. The timer from cut to finished  (parked, Luke 9 Oct 2026)

Two marks already exist for every works order: **cut** (the cutting room,
on the log) and **completed** (the PM, in the planner). The timer is the gap
between them, and the question is what the target is and who starts it.

Suggested shape:

- **Start at the cut mark**, not a manual "into production" mark. It is
  already made on the day, by the person who did it, and it needs no new
  habit. A manual mark could be added later if work routinely waits between
  cutting and sewing and the PM wants that wait measured separately.
- **A target per product type**, in working days, kept in a small table the
  PM can edit (jackets 5 days, aprons 2, hats 3, as examples): the code's
  product category from the new sheet (column J) picks the row, with a
  per-code override where one garment is different.
- **On the plan**: each printed-and-cut works order shows days since cut
  against its target, amber at 80%, red past it; the works order cards and
  the Cutting tab both carry it; a tile counts the late ones.
- **On the KPI tab**: cut-to-complete median by month and by category, and
  the share completed inside target, from the same two marks, so the series
  exists from the first day the log had both.

Questions for the production manager before building: what the targets
are, whether they are per category or per code, and whether the clock
should pause for a works order waiting on embroidery or on trims.

## The paste, in one go  (done)

The two sheets are two queries in one workbook, `sage/Buffer Live.xlsx`.
The planner's one paste box takes either or both: a row whose first cell is
a `TIB-` or `OH-` line key is a demand line, a row with a plain stock code
is a buffer row.
