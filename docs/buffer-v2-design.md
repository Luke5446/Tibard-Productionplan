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

## 2. Sales order numbers and due dates on the works order  (sheet ready, planner to do)

Today the buffer carries one number per code, On SOP, so the planner cannot
say which orders a works order is for. `sage/71-buffer-sop-demand.sql`
brings the lines: order number, outstanding quantity, promised date,
customer, both companies, for every stock-held code.

Proposed behaviour once the second sheet is pasted:

- A works order raised while a code's free stock is negative takes the
  oldest-promised open lines for that code up to its quantity and records
  them on the works order: `SO 116383 · 40 · Knoops · due 21 Oct`.
- The card shows the earliest due date and how many orders; the panel and
  the printed works order list them. The works order's **due date defaults
  to the earliest promised date** (editable, as now).
- A later paste refreshes the lines (quantity despatched, date moved) the way
  the special makes sheet already refreshes a raised special make; an order
  despatched from stock before the works order completes is dropped from it.
- The buffer table's On SOP cell gets a hover listing the orders behind it.

Questions:

- **Allocation order**: oldest promised date first, or oldest order date
  first, or should a works order name every open order for the code
  whatever its quantity?
- **Intercompany lines** (Tibard's OLIVER account): 71 marks them. Count
  them as demand on the works order, or leave them to OH's own order?
- Should the cutting log line carry the sales order too, so the cutting
  room sees the customer and date (as special makes do today)?

## 3. Clockwork codes out of the stock KPI  (sheet ready, planner to do)

The sheet now says which codes are bought in from Clockwork (column N,
`ClockworkMade`: the preferred supplier is CLO003). Proposed:

- A Clockwork code stays **on the table** (the PM still sees it, with the
  containers under On POP) but is **left out of the SKU count and % Good**,
  the four status tiles, the buffer snapshots and the KPI tab's in-stock
  series. A small tile says how many were left out.
- WOP REC for a Clockwork code is 0 and the tick box is off: nothing is made
  here for it.
- A Clockwork code that is also made here sometimes (dual-sourced) needs a
  rule: suggest **Manufacturer = Tibard/Oliver Harvey wins** and the code
  stays in the KPI.

Questions:

- Is the preferred supplier reliable, or is the typed **Supplier Lead
  Times** sheet in the old workbook the better list? `73-buffer-discovery.sql`
  prints codes with no supplier at all; the old sheet's Y column can be
  compared against column N on the first refresh.
- "and are on the stock planner app": should the exclusion be the sheet's
  flag alone, or the flag AND the code being on a stock planner container?
  The planner only publishes containers on the water, so a Clockwork code
  with nothing on the water would fall back into the KPI. Suggest the flag
  alone, with the container shown when there is one.
- The stock planner could publish its product list (code, supplier, lead
  time) as well as containers, and the planner would then take the flag from
  there instead of Sage. One source rather than two; worth doing if the
  stock planner is the master for Clockwork.

## 4. Works orders cut per day  (done)

The Cutting tab's **Metres per day** table has a **Works orders** column
(a works order cut in two lines on one day is one works order) and the **Cut
today** tile says how many works orders as well as lines.

## 5. The timer from cut to finished  (to design, not built)

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

## The paste, in one go

The two sheets are two queries in one workbook. Suggest the planner's one
paste box takes either: a row whose first cell starts `TIB-` or `OH-` is a
demand line, a row with a plain stock code is a buffer row. Then Refresh
All, copy both sheets, paste twice, and nothing has to be told which is
which.
