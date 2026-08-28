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

**Confirmed: Sage 200 Professional**, SQL Server `TIB-SQL-002`, databases
`S200_LIVE` (Tibard) and `OliverHarveyLive`. So the route is **Power Query → SQL Server** (section 2): genuinely
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

### Your connection details

Read off the existing buffer sheet's `eve_AllLiveSOPPOPStockConsignment`
connection (Queries & Connections → Connections → Properties → Definition):

| | |
|---|---|
| **Server** | `TIB-SQL-002` — the default instance, **not** `TIB-SQL-002\SAGE200` |
| **Databases** | `S200_LIVE` (Tibard) **and** `OliverHarveyLive` (Oliver Harvey) — both on the same server, so one query reads both |
| **Authentication** | Windows (`Integrated Security=SSPI`, no saved password) |
| Existing connection type | OLE DB Query, Command type `Table` — legacy, pre-Power Query |
| Existing source objects | `S200_Live.dbo.eve_AllLiveSOPPOPStockConsignment` and `OliverHarveyLive.dbo.eve_AllLiveSOPPOPStock` — **custom SQL views** someone has already added inside the Sage databases |

**Build this in a NEW workbook, not in the buffer sheet.** The buffer sheet is a
production dependency — a slow or broken query added to it would take Refresh All
down for the buffer app as well. Keep them separate.

### You do not need SQL Server Management Studio
Every query in `00-discovery.sql` can be run from Excel itself: paste it into the
SQL statement box in step 2.3 below and load the result to a sheet. Read the
answer, then swap in the next query.

### 2.1 Authentication — nothing needed from IT
The existing connection uses `Integrated Security=SSPI` with no saved password,
so Sage's SQL is reachable under your own Windows login. Pick **Windows → Use my
current credentials** when Excel asks. No new SQL login required.

> #### ⚠️ Raise with IT: the buffer sheet's connection string contains `User ID=sa`
>
> The full string is:
> `Provider=SQLOLEDB.1;Integrated Security=SSPI;Persist Security Info=True;User ID=sa;Initial Catalog=S200_LIVE;Data Source=TIB-SQL-002;...`
>
> `sa` is SQL Server's superuser — it can read, alter and drop anything on that
> server, the live Sage database included. Because `Integrated Security=SSPI` is
> also set, the `sa` is *probably* inert leftover and Windows auth is what
> actually connects (the unticked "Save password" supports that). But it is
> ambiguous, and it is embedded in a workbook that gets shared.
>
> Two things follow:
> 1. **Do not copy this connection string** for the new sheet. Build a fresh
>    Windows-auth connection as below.
> 2. Worth asking IT to strip the `User ID=sa` from the buffer sheet's
>    connection and confirm nothing at Tibard is genuinely connecting to Sage
>    as `sa`. Not urgent, not this project — but not something to leave unsaid.

### 2.2 Create the workbook
New blank workbook → save as `Special Makes Live.xlsx`, in the same shared folder
as the buffer sheet so Production can find it.

### 2.3 Create the connection
1. **Data** → **Get Data** → **From Database** → **From SQL Server Database**
2. Server `TIB-SQL-002`  ·  Database `S200_LIVE`
   (the query reaches `OliverHarveyLive` itself via three-part names — you only
   pick one database here)
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

Run 0.3 against **both** databases — confirm Tibard and Oliver Harvey use the
same convention before assuming one flag covers both.

Then correct the `>> CHECK <<` spots in `10-special-makes-live.sql`. **`CHECK 2`
appears twice**, once per company — they must match.

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
On the `SageData` table, filter column **J (StockHeld)** to everything
**except `YES`** — so `NO`, `NOT SET` and `FREE-TEXT` all stay visible.

Deliberately **not** filtered in SQL. If a new special make is set up in Sage with
the stock-held flag wrong, a SQL filter hides it silently and the order never gets
made. This way it's still on the sheet — visible, one filter click away — and the
app can cross-check too (see section 4).

Excel's Ctrl+C copies **visible rows only** when a filter is applied, so selecting
the filtered range and copying gives exactly the special makes.

---

### 2.8 Later: promote the query to a SQL view (recommended follow-up)

Someone has already added `eve_AllLiveSOPPOPStockConsignment` as a view inside
`S200_Live.dbo` — your Sage partner or whoever built the buffer sheet. That is a
better pattern than SQL embedded in a workbook, and worth following once this is
proven:

- Ask them to create `eve_LiveSpecialMakeOrderLines` from
  `10-special-makes-live.sql` (same `eve_` prefix, so it's obviously a custom
  object and not Sage's own).
- The Excel connection then becomes **Command type: Table** pointing at that
  view — identical to how the buffer sheet works today.
- Changes get made once on the server instead of inside every copy of the
  workbook, and nobody needs SQL in a spreadsheet to fix a date filter.

Two cautions: it needs CREATE VIEW rights on the Sage database, and custom
objects should be **re-checked after any Sage 200 upgrade** in case an upgrade
drops them.

Start with the embedded-SQL version in 2.3–2.7 — you can build that yourself
today without waiting on anyone.

---

## 3. The paste contract

Column order is fixed — the app reads by position, same as the existing buffer
paste. Production select the filtered rows (no header) → Ctrl+C → paste.

| Col | Field | Notes |
|---|---|---|
| A | `LineKey` | **The dedupe key** — `TIB-` / `OH-` prefix + Sage's permanent line ID |
| B | `Company` | `TIBARD` or `OLIVER HARVEY` |
| C | `SalesOrderNo` | |
| D | `LineNo` | Position on the order — drives Pt 1 / Pt 2 ordering |
| E | `ProductCode` | |
| F | `ProductDesc` | Tabs/line breaks stripped in SQL |
| G | `Qty` | Outstanding qty (ordered − despatched) |
| H | `PromisedDate` | Text, `yyyy-mm-dd` |
| I | `Customer` | |
| J | `StockHeld` | `YES` / `NO` / `NOT SET` / `FREE-TEXT` |

### Why a line key, and not the sales order number

You asked for "don't duplicate any sales order already on a works order". Keying
that on the **order number** alone breaks the first time the office adds a line to
an existing order — the app would see SO12345 as already done and silently skip
the new product. Keying on Sage's `SOPOrderReturnLineID` (unique, never reused)
means: paste as often as you like, each *line* becomes exactly one works order,
and a line added at 2pm still gets picked up on the afternoon paste.

### Why the key is prefixed with the company

The two databases number their lines independently, so **Tibard line 45678 and
Oliver Harvey line 45678 both exist**. Without the prefix, an Oliver Harvey order
would be silently treated as already made because Tibard happened to use that
number first — a wrong-company skip that nobody would spot until the order was
late. `TIB-45678` / `OH-45678` makes the collision impossible.

The same goes for the works order reference itself: the two companies' sales
order numbers overlap, so it needs to read `OH-SO12345 Pt 1`, not `SO12345 Pt 1`.

### The stock-held flag: confirmed, with a caveat

It is a **stock item analysis code**, and the two companies use **different
slots** — they were set up separately:

| Company | Slot | Items carrying Yes/No |
|---|---|---|
| Tibard | `AnalysisCode3` | 2,365 |
| Oliver Harvey | `AnalysisCode7` | 2,226 |

The query handles each company separately. Do not "tidy" them to match.

**The caveat: most items have the code blank.** Only ~2,365 of roughly 107,000
Tibard stock items are labelled at all. A blank is not the same as "No", and
guessing either way is unsafe:

- treat blank as **No** → every unlabelled product floods the special makes list
- treat blank as **Yes** → genuine special makes silently vanish

So blank comes through as its own value, `NOT SET`, for review rather than
assumption. How much this matters in practice depends on how many *live order
lines* land on unlabelled products — most of those 107,000 will be historic
variants that never appear on a current order. That still needs measuring.

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
