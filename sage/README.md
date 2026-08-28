# Special Makes — live Sage 200 sheet

Purpose: give Production one sheet they can hit **Refresh All** on, filter, and
copy straight into the buffer app's Special Makes tab — replacing the manual
Excel works order + Google Sheet step the sales office does today.

## Files

| File | What it is |
|---|---|
| `00-discovery.sql` | Run this first. Proves the column names and status numbers on **your** database. |
| `10-special-makes-live.sql` | The query the sheet runs. Two spots marked `>> CHECK <<` need confirming from step 0. |

---

## 1. Which route to take

**Confirmed: Sage 200 Professional**, SQL Server `TIB-SQL-002\SAGE200`, database
`S200_LIVE`. So the route is **Power Query → SQL Server** (section 2): genuinely
live, one refresh button, no add-ins, no extra licences.

### Options considered, and why not

| Option | Verdict |
|---|---|
| **Power Query → SQL Server** | **Recommended.** Live to the second, refreshes on demand, native Excel, no add-in. |
| Sage 200 Excel Integrated Reporting / Business Intelligence cubes | **No.** These read OLAP cubes that are typically rebuilt overnight. An order keyed at 9am wouldn't appear until tomorrow — useless for raising same-day works orders. |
| Legacy Sage ODBC driver | **No.** Slower, and Power Query does the same job better. |
| Skip Excel — app reads Sage directly | Better end state, but needs a small server sitting between the app and SQL. The app is currently a single static `index.html` with no backend. Worth doing later; not worth blocking this on. |

---

## 2. Building the sheet (Sage 200 Professional)

### Your connection details (read off the existing buffer sheet)

| | |
|---|---|
| **Server** | `TIB-SQL-002\SAGE200` |
| **Database** | `S200_LIVE` |
| Existing buffer source | `eve_AllLiveSOPPOPStockConsignment` (a custom SQL view — item-level, not order-line level, so we need a new query) |
| Other company DB seen | `...OliverHarvey...` — check whether special makes are raised under this company too |

**Build this in a NEW workbook, not in the buffer sheet.** The buffer sheet is a
production dependency — a slow or broken query added to it would take Refresh All
down for the buffer app as well. Keep them separate.

### You do not need SQL Server Management Studio
Every query in `00-discovery.sql` can be run from Excel itself: paste it into the
SQL statement box in step 2.3 below and load the result to a sheet. Read the
answer, then swap in the next query.

### 2.1 Authentication
Try **Windows authentication ("Use my current credentials")** first — if the
existing buffer connection uses it, yours will work too and you need nothing from
IT. Check by opening the buffer sheet's connection → **Definition** tab: an
`Integrated Security=SSPI` in the connection string means Windows auth.

If it turns out to use a SQL login, ask IT for one with **db_datareader only** on
`S200_LIVE`. Reading the Sage database is normal practice; **writing** to it
directly is not supported by Sage and would put your support contract at risk. A
read-only login makes that mistake impossible.

### 2.2 Create the workbook
New blank workbook → save as `Special Makes Live.xlsx`, in the same shared folder
as the buffer sheet so Production can find it.

### 2.3 Create the connection
1. **Data** → **Get Data** → **From Database** → **From SQL Server Database**
2. Server `TIB-SQL-002\SAGE200`, Database `S200_LIVE`
3. Expand **Advanced options** → paste your SQL into the **SQL statement** box
4. **OK** → credentials → **Windows / Use my current credentials** → **Connect**
5. **Load To…** → **Table** → **New worksheet**. Rename the sheet `SageData`.

### 2.4 Confirm the schema before trusting the query
Run the queries in `00-discovery.sql` through the box in 2.3, in order. The one
that really matters is **0.3 — where "stock held = Yes" actually lives**. In Sage
200 that tick is normally on the *Product Group* ("this product group holds
stock"), not the product itself, but some sites tag it with an analysis code on
the stock item instead. Put one code you know is stock-held next to one you know
is a special make and see which column differs.

Then correct the two `>> CHECK <<` spots in `10-special-makes-live.sql`.

### 2.5 Swap in the real query
**Data** → **Queries & Connections** → **Queries** tab → right-click the query →
**Edit**. In the Power Query editor, click the **gear icon** next to the `Source`
step on the right — the SQL statement box reopens. Paste the corrected
`10-special-makes-live.sql` → **OK** → **Close & Load**.

### 2.6 Set the refresh behaviour
**Data → Queries & Connections → right-click → Properties:**

- ✅ Refresh data when opening the file
- ✅ Refresh this connection on Refresh All
- ❌ **Enable background refresh** — untick this. Your buffer connection currently
  has it ticked. It matters here: with it on, Refresh All returns immediately and
  Production can copy the *old* rows while the new ones are still loading. Off
  means the refresh finishes before they can touch anything.
- ❌ Adjust column width (stops the layout jumping on every refresh)

### 2.7 Set up the filter
On the `SageData` table, filter column **I (StockHeld)** to `NO` and `FREE-TEXT`.

Deliberately **not** filtered in SQL. If a new special make is set up in Sage with
the stock-held flag wrong, a SQL filter hides it silently and the order never gets
made. This way it's still on the sheet — visible, one filter click away — and the
app can cross-check too (see section 4).

Excel's Ctrl+C copies **visible rows only** when a filter is applied, so selecting
the filtered range and copying gives exactly the special makes.

---

## 3. The paste contract

Column order is fixed — the app reads by position, same as the existing buffer
paste. Production select the filtered rows (no header) → Ctrl+C → paste.

| Col | Field | Notes |
|---|---|---|
| A | `LineID` | **Sage's permanent line ID. This is the dedupe key.** |
| B | `SalesOrderNo` | |
| C | `LineNo` | Position on the order — drives Pt 1 / Pt 2 ordering |
| D | `ProductCode` | |
| E | `ProductDesc` | Tabs/line breaks stripped in SQL |
| F | `Qty` | Outstanding qty (ordered − despatched) |
| G | `PromisedDate` | Text, `yyyy-mm-dd` |
| H | `Customer` | |
| I | `StockHeld` | `YES` / `NO` / `FREE-TEXT` |

### Why LineID, and not the sales order number

You asked for "don't duplicate any sales order already on a works order". Keying
that on the **order number** alone breaks the first time the office adds a line
to an existing order — the app would see SO12345 already done and silently skip
the new product. Keying on `LineID` (Sage's `SOPOrderReturnLineID`, unique and
never reused) means: paste as often as you like, each *line* becomes exactly one
works order, and a line added at 2pm still gets picked up on the afternoon paste.

That's why column A must not be dropped from the query.

---

## 4. Decisions still needed for the app side

Flagging these now because they change how the Special Makes tab is built:

1. **Pt numbering must continue, not restart.** Morning paste gives SO12345 Pt 1
   and Pt 2. If a third line is added and pasted that afternoon it has to become
   **Pt 3** — so numbering carries on from what's already stored against that
   order number, rather than renumbering the batch from scratch each paste.
2. **Amended lines.** If a qty or promised date changes in Sage *after* the works
   order is raised, my suggestion is the app flags it as "changed — review"
   rather than either ignoring it or raising a duplicate.
3. **Cancelled lines.** A line that disappears from the feed (order cancelled or
   fully despatched) while its works order is still open — flag for review, don't
   auto-close.
4. **Belt and braces on the flag.** The app already holds the full stock-held
   buffer list. If a pasted code isn't in that list *and* isn't flagged `NO`, it's
   almost certainly a miscoded special make — worth warning rather than trusting
   the Sage flag alone.

---

## 5. Gotchas worth knowing

- **Dates.** Kept as text `yyyy-mm-dd` on purpose. Pasting a real Excel date into
  a browser gives you a 5-digit serial number or a dd/mm vs mm/dd guess. Text in
  ISO order can't be misread.
- **Tabs in descriptions.** Stripped in SQL. One stray tab in a product
  description would shift every column after it on that row.
- **Part-despatched orders.** The query returns qty *outstanding*, not qty
  ordered, so a half-shipped order raises a works order for the remainder only.
- **Returns excluded.** `DocumentTypeID = 0` keeps sales returns out.
- **Refresh, then copy.** With background refresh off (2.4) this is safe — but
  it's still worth telling Production: Refresh All, wait for the row count to
  settle, then copy.
