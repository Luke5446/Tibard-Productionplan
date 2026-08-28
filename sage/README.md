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

**Do you have Sage 200 Professional (on-premise or Sage-hosted), or Sage 200
Standard (cloud)?** This decides everything:

- **Professional** → you have a SQL Server database you can read. Use
  **Power Query → SQL Server** (section 2). This is the right answer: genuinely
  live, one refresh button, no add-ins, no extra licences.
- **Standard** → there is no SQL access. You'd need the Sage 200 REST API, or a
  scheduled export. Tell me which you're on and I'll write that version instead.

### Options considered, and why not

| Option | Verdict |
|---|---|
| **Power Query → SQL Server** | **Recommended.** Live to the second, refreshes on demand, native Excel, no add-in. |
| Sage 200 Excel Integrated Reporting / Business Intelligence cubes | **No.** These read OLAP cubes that are typically rebuilt overnight. An order keyed at 9am wouldn't appear until tomorrow — useless for raising same-day works orders. |
| Legacy Sage ODBC driver | **No.** Slower, and Power Query does the same job better. |
| Skip Excel — app reads Sage directly | Better end state, but needs a small server sitting between the app and SQL. The app is currently a single static `index.html` with no backend. Worth doing later; not worth blocking this on. |

---

## 2. Building the sheet (Sage 200 Professional)

### 2.1 Get a read-only SQL login
Ask your Sage partner / IT for a SQL Server login with **db_datareader only** on
the company database. Reading the Sage database is normal practice; **writing**
to it directly is not supported by Sage and would put your support at risk. A
read-only login makes that mistake impossible.

You need: server name (e.g. `SAGESERVER\SAGE200`) and the company database name.

### 2.2 Confirm the schema
Run `00-discovery.sql` in SQL Server Management Studio. Fix the two `>> CHECK <<`
spots in `10-special-makes-live.sql` from what it tells you.

The one that really matters is **CHECK 2 — where "stock held = Yes" actually
lives**. In Sage 200 that tick is usually on the *Product Group* ("this product
group holds stock"), not the product itself — but some sites tag it with an
analysis code on the stock item instead. Query 0.3 finds it: put one code you
know is stock-held next to one you know is a special make, and see which column
differs.

### 2.3 Create the connection in Excel
1. New workbook → **Data** → **Get Data** → **From Database** → **From SQL Server Database**
2. Server + Database → expand **Advanced options** → paste the whole contents of
   `10-special-makes-live.sql` into the SQL statement box
3. Credentials → **Database** → the read-only login → Connect
4. **Load To…** → **Table** → **New worksheet**. Name the sheet `SageData`.

### 2.4 Set the refresh behaviour
**Data → Queries & Connections → right-click the query → Properties:**

- ✅ Refresh data when opening the file
- ❌ **Enable background refresh** — untick this. It matters: with it on,
  Refresh All returns immediately and Production can copy the *old* rows while
  the new ones are still loading. Off means the refresh finishes before they
  can touch anything.
- ❌ Adjust column width (stops the layout jumping about on every refresh)

### 2.5 Set up the filter
On the `SageData` table, filter column **I (StockHeld)** to `NO` and `FREE-TEXT`.

Deliberately **not** filtered in SQL. If a new special make is set up in Sage
with the stock-held flag wrong, a SQL filter hides it silently and the order
never gets made. This way it's still on the sheet — visible, one filter click
away — and the app can cross-check too (see section 4).

Excel's Ctrl+C copies **visible rows only** when a filter is applied, so
selecting the filtered range and copying gives exactly the special makes.

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
