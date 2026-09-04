# Special Makes — live Sage 200 sheet

Purpose: give Production one sheet they can hit **Refresh All** on, filter, and
copy straight into the buffer app's Special Makes tab — replacing the manual
Excel works order + Google Sheet step the sales office does today.

## Files

| File | What it is |
|---|---|
| `10-special-makes-live.sql` | **The query the sheet runs.** Finished and validated — this is the one to paste. |
| `00-discovery.sql` | The schema and data investigation behind it, kept as a record of how each rule was established. |
| `08-find-analysis-code.sql` | Profiles all 20 analysis code slots — how the stock-held flag was located. |
| `09-confirm-stock-held-slot.sql` | **Settles which slot each company really uses**, with Yes/No/blank counts per slot. Run after any doubt about the flag. |
| `20-validate-against-known-specials.sql` | Runs real codes from the manual sheet through the rules. Re-run it after any rule change. |
| `30-why-is-this-code-missing.sql` | **Run this when the sheet and Sage disagree about a code** — missing when it should be there, or present when it should not. Put the code in and it names the reason. |
| `40-product-setup-exceptions.sql` | **Weekly check.** Products with a live order whose set-up will make the sheet wrong. An empty result means the product file agrees with the rules. |
| `PROFIT.md` | **Separate strand — profit per product per month.** Where it got to, what is still open, and the traps that carry over. Start there, not in the SQL. |
| `50-profit-discovery.sql` | Profit report, step 1: what Sage records about the money on a sale. Not yet run. |
| `51-grouping-coverage.sql` | Profit report, step 1b: whether sizes can be rolled up into a garment. Not yet run. |

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

### 2.4 The query is already confirmed — no discovery needed

`10-special-makes-live.sql` is finished. Every column name in it was checked
against the live database and every rule was measured or validated against real
orders. Paste it as it stands.

`00-discovery.sql` is kept as the record of how that was established — worth
reading only if a rule needs revisiting or something stops matching.

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

### 2.7 No filtering needed — and do not filter on Manufacturer

Copy columns **A to L**, all rows, **without the header**, and paste the lot.

> #### ⚠️ Never filter on column K (Manufacturer)
>
> Logo and charge lines have **no manufacturer of their own** — they are
> `LOGOAPPLICATION`, `LOGOORIGINATION` and typed free text, not products. Filter
> column K to `Tibard` / `Oliver Harvey` and every one of them disappears, taking
> the logo position and artwork approval with it. The works orders would still be
> raised; they would just have no logo detail on them, and nothing would say so.
>
> The query solves this itself rather than leaving it to a filter: a `NOTE` line
> is returned **only when its own sales order also carries a line needing a works
> order or a decision**. Notes for orders that are entirely bought-in never
> appear. So there is nothing to filter out.

Everything returned is relevant:

| Category | What the app does |
|---|---|
| `WORKS ORDER` | Into the review queue — you accept or dismiss each one |
| `REVIEW - …` | Into the same queue, tagged with the reason |
| `NOTE - …` | Attached automatically to the works orders on that sales order |
| `INTERCOMPANY - no works order` | Counted and ignored — kept only so the count stays visible |

Stock-held items and bought-in goods are dropped in the query, so they never
reach the sheet at all.

Nothing is created on paste. Works orders exist only once you accept them, and
anything dismissed is remembered so it is never offered again.

**If notes do go missing**, pasting the full sheet later fixes it — notes are
held per sales order and re-attach to works orders that already exist.

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
| D | `LineSeq` | Position on the order — drives Pt 1 / Pt 2 ordering. Named `LineSeq` because `LINENO` is a reserved T-SQL keyword and fails as a column alias |
| E | `ProductCode` | |
| F | `ProductDesc` | Tabs/line breaks stripped in SQL |
| G | `Qty` | Outstanding qty (ordered − despatched) |
| H | `PromisedDate` | Text, `yyyy-mm-dd` |
| I | `Customer` | |
| J | `StockHeld` | `YES` / `NO` / `FREE-TEXT` — blank in Sage counts as `NO` |
| K | `Manufacturer` | Free text; only our own manufacture should raise a works order |
| L | `CustomerOrderNo` | The customer's own reference |
| M | `CustomerName` | **Who the job is for**, resolved — the account on a real trading account, the reference on a placeholder one |

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

### The stock-held flag: confirmed

It is a **stock item analysis code**, and the two companies use **different
slots** — they were set up separately:

| Company | Slot |
|---|---|
| Tibard | `AnalysisCode3` |
| Oliver Harvey | `AnalysisCode7` |

The query handles each company separately. Do not "tidy" them to match.

**The rule:** `Yes` means stock held. **`No` and blank both mean special make** —
specials are the bulk of the product file and most are simply never labelled, so
only an explicit `Yes` counts as stock.

That direction is deliberate. It errs towards a false positive — a stock item
nobody labelled shows up as a special make, which is visible and easy to correct
— rather than a false negative, where a special make silently never gets
manufactured. The second is the failure this whole job exists to remove.

### Classification — validated against the real manual sheet

22 product codes taken from the current manual special makes sheet were run
through the exact rules the live query uses:

| Verdict | Codes | |
|---|---|---|
| **WORKS ORDER** | 18 | correctly identified |
| **REVIEW — no manufacturer set** | 3 | `CICJM01935803`, `CICJM0193XXS01`, and `WT4004MM01` in Oliver Harvey only |
| **Excluded — flagged stock held** | 1 | `OHAPP054415`, correctly: it holds 136 in stock and is already in the buffer app |

**No special make was silently lost.** The single exclusion is genuinely a stock
item, independently confirmed — of the 22 codes, it is the only one that appears
in the buffer app's 757-code stock list.

The rules:

| Test | Result |
|---|---|
| Stock-held analysis code = `Yes` | Excluded — the buffer app covers it |
| Manufacturer contains `Tibard` / `Oliver Harvey` | **WORKS ORDER** |
| Manufacturer blank | **REVIEW**, so Sage gets corrected |
| Manufacturer is a trade brand | Excluded — bought in to order |

Analysis code slot differs per company: **Tibard `AnalysisCode3`, Oliver Harvey
`AnalysisCode7`**. Do not tidy these to match.

### What the validation revealed

**The manufacturer field does nearly all the work.** Of the 22 codes, only one
carried `Yes` and one carried `No` — every other special make has the analysis
code **blank**. So the stock-held flag mainly serves to exclude the ~757 buffer
items; the manufacturer decides everything else. That is why the bought-in test
is load-bearing: 911 live Tibard order lines are not stock held but carry a
trade brand, and without it every one would have become a works order.

**Product codes exist in both company databases.** Most `OH…` codes returned a
row in Tibard *and* Oliver Harvey with the same manufacturer. Harmless here —
each company's order lines are matched to that company's own stock file — but
worth knowing before anyone tries to deduplicate the two.

**The two companies disagree on the same code.** `WT4004MM01` is set up properly
in Tibard (`No` + `Tibard`) but blank in Oliver Harvey. Exactly the gap the
REVIEW bucket exists to catch.

### Inter-company orders: the duplicate works order risk

Oliver Harvey does not manufacture. When OH wins a special make for its own
customer — often on an `OH`-prefixed code — the goods are made by Tibard, and OH
raises a purchase order to Tibard to cover it.

That creates **two sales orders for one physical job**:

1. **OH's customer order** — the real demand. This is what should raise the
   works order.
2. **Tibard's sales order**, created from OH's PO. Same goods, already being
   made.

Both appear in this feed, and they are genuinely different order lines in
different databases, so the `LineKey` dedupe cannot connect them. Left alone,
the second one raises a duplicate works order.

**Why the current process makes this unlikely but not safe.** OH does not raise
the PO until after manufacture — it is back-to-back: goods made, booked in, PO
raised, despatched, booked into OH. So by the time the Tibard sales order exists,
the job is done.

But "unlikely" is a timing accident, not a control. The Tibard order line is live
with outstanding quantity from the moment it is raised until it is despatched.
Anything that widens that window — a despatch delayed to the next morning, a PO
raised early because someone wanted the paperwork in, a part-despatch — puts a
duplicate in front of production. It would look like a legitimate new special
make, because that is exactly what it looks like in the data.

**The control:** the inter-company customer accounts, matched on **account
number**:

| Database | Account | Name |
|---|---|---|
| `S200_LIVE` | `OLIVER` | Oliver Harvey Ltd |
| `OliverHarveyLive` | `TIB003` | Tibard Ltd |

Those lines are labelled `INTERCOMPANY - no works order` — visible on the sheet,
outside the production filter. The works order stays with the original customer
order, which carries the real demand and the real promised date.

**Never match these by name.** Tibard's customer file also contains Harvey
Nichols Regional Stores, Harvey Nichols Restaurants, Harveys Laundry, YO! Sushi
Harvey Nichols, Mrs Oliver, Mr Oliver Wyatt, Oliver Kay Produce, Oliver Najev,
The Oliver Gilbey and Oliver's Battery Countryside Group. A `LIKE '%Oliver%'`
rule would have silently excluded every one of those real customers' special
makes. Account numbers only.

`TIB002` Tibard Laundry Services Ltd is **not** included — that account is no
longer used.

**Belt and braces, app side:** before creating a works order, check whether the
same product code already has an open works order from *either* company. If it
does, warn rather than create. That catches the case regardless of how the
paperwork was routed.

### Logo and charge lines are instructions, not works orders

The first live run surfaced this pattern, on one Oliver Harvey order:

```
OH-32036196  SO 0000114816  line 1  OHAPP0785191     FOREST GREEN ADJUSTABLE BIB APRON…
OH-32036228  SO 0000114816  line 2  LOGOAPPLICATION  Maldon Salt Logo Centre Bib in White
```

Line 1 is the garment to make. Line 2 is **how to finish it** — and it is a
sibling line on the same sales order, not a separate job. The same shape appears
as `LOGOORIGINATION` (embroidery origination charges) and as free-text lines
carrying logo positions and approval notes (`Chefs Skull & Knife - 6334 Logo -
Left Chest`, `LOGOORIGINATION - Approved 26.8.26`).

**These must not become their own works orders** — that would raise a job for a
logo with no garment attached.

**They must not simply be dropped either.** The logo position and spec are
exactly what production needs on the works order, and are presumably why the
manual Excel works order exists in the first place. Discarding them would move
the lookup back into Sage and undo part of the point of this.

So the design is: classify these lines as **notes**, and have the app attach
them to the works orders raised from the same sales order rather than creating
separate ones. The `Pt 1 / Pt 2` numbering then counts only the garment lines,
which is what the office means by "each product".

Identification is by **product group** rather than by hardcoding codes like
`LOGOAPPLICATION` — the product group list already carries `Additional Charges`
and `Heat Seal Transfers / Tax Tab`, so the grouping exists in Sage and will
keep working as new service codes are added. Free-text lines (`LineTypeID = 1`)
are notes by definition.

### Line classification, measured from the live feed

| What | Lines (TIB / OH) | Treatment |
|---|---|---|
| Free text (`LineTypeID = 1`) | 486 / 31 | **NOTE** |
| Group `54` Additional Charges — `LOGOAPPLICATION`, `LOGOORIGINATION`, `TEXTAPPLICATION`, `HANDLINGCHARGE` | 43 / 46 | **NOTE** |
| Groups `1` Chef Jackets, `2` Chef Trousers, `3` Aprons, `6` Shirts, `10` T-shirts/Polos, `25` Coats/Tunics, `26` Cloths/Towels | 26 / 11 | **WORKS ORDER** |
| Group `30` Accessories — every line uses the literal code `FREETEXT` | 6 / 0 | **REVIEW** |

Notes are classified by **product group 54**, not by listing the service codes,
so codes added later inherit the behaviour instead of silently becoming works
orders.

`FREETEXT` is a real stock code used as a placeholder for described items. Those
could be genuine special makes, so they go to review rather than being dropped or
auto-raised — the description says what they are.

### Resolved: the unmatched lines were all free text

The earlier open risk — hundreds of lines matching no stock record — is closed.
All 486 Tibard and 31 Oliver Harvey of them are `LineTypeID = 1`, typed
free-text lines that by definition have no product record. **Not one standard
product line fails the code join.** So `si.Code = sorl.ItemCode` is sound and
Sage's `SOPStandardItemLink` table is not needed.

### Who the job is for takes three columns, not one

Neither the account nor the customer's reference is reliably the customer:

| Account (I) | Reference (L) | Who it is for |
|---|---|---|
| `Knoops Procurement` | `EMB: PO: 33452341` | the **account** |
| `Mollies Motels Ltd` | `134164 Miles Roberts` | the **account** |
| `Oliver Harvey Proforma` | `EMB: Coventry City FC` | the **reference** |
| `XONLINE` | `OH-76438 Louise Burks` | the **reference** |

What decides it is the **account**. On a real trading account the account name
is the customer and the reference is a purchase order number or a contact. On a
**placeholder** account — proforma, online — the account says nothing and the
customer only appears in their own reference.

Column M applies that rule: placeholder accounts (`PROFORMA`, `PROFEURO`,
`XONLINE`) take the reference, everything else takes the account name. Matched
on **account number**, not name, for the same reason as the inter-company rule.
An `EMB:` or `DTF:` prefix is stripped; nothing else is, because guessing at the
rest of a free-text reference does more harm than good.

I and L are still returned, so nothing hides behind the rule — the app leads
with M and shows the other two beneath it.

**If another placeholder account turns up**, add its account number to the list
in both halves of the query.

### When Sage has no name at all, the costed customer stands in

A handful of rows have neither a usable account name nor anything customer-like
in the reference. The works order would print its customer row empty.

There is a safe last resort, and it exists because of a rule of the business:

> Specials are for one customer only, if another customer orders it would be a
> new special code.

So the customer captured when the product was **costed** stays true for the life
of that code — a second customer never arrives on it. Where a costing app import
has supplied a customer for the style, the app falls back to it.

The order is: **column M** (resolved above) → **column I** (raw account) → **the
costed customer** → blank. Sage always wins; the costed name only fills a gap.

This would *not* be safe for a stock code, which many customers order, and it is
not applied to one.

### Promised date comes from the order header, not the line

Sage holds a promised date on the order **and** on each line. Amending an order
updates the header, and the sales office only reliably updates the header —
lines keep whatever they were raised with.

Taking the line date first meant order **114816** read `2026-08-05` while Sage's
screen said **11/09/2026**, and the sheet flagged it **Overdue** on a date nobody
had promised. A wrong overdue flag is worse than no flag: it trains people to
ignore the colour.

So the order is now: **header promised → line promised → header requested → line
requested**.

The cost of this would be a genuinely staggered delivery, where one line really
is due on a different date to the rest — that would now be flattened to the
header date. Confirmed with the sales office that this does not arise: **"We
don't stagger deliveries."** Discovery query **1.1** still counts how often line
and header disagree, and whether any line date is *later* than the header, which
is what a real staggered delivery would look like — worth re-running if that ever
changes.

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

## 5. When the sheet and Sage disagree about a code

### A code has a live order but is not on the sheet

Run **`30-why-is-this-code-missing.sql`** — put the code at the top and it
returns the reason in plain English. Do not go hunting; the query drops very
little, so the list of possible causes is short.

Nine times in ten it is the **stock-held analysis code**. A new product code
copied from an existing one inherits `Yes`, which classifies it as stock held
and drops it before it reaches the sheet. Set it to **No or blank** on the
product record — Tibard reads **AnalysisCode3**, Oliver Harvey **AnalysisCode7**.

The complete list of things that make a code disappear:

| Cause | Fix |
|---|---|
| Stock-held analysis code says `Yes` | Set it to No or blank on the product |
| Manufacturer set to anything but Tibard or Oliver Harvey | Set the manufacturer |
| `DocumentStatusID` is not 0 | The order is not live — on hold, parked or cancelled |
| `DocumentTypeID` is not 0 | It is a return or a credit, not an order |
| Nothing outstanding | The line is already fully despatched |
| The sheet was not refreshed | Data → Refresh All |

**A code the stock file has never heard of is not on this list.** Those come
through as `REVIEW - code not in stock file`, deliberately: an unknown code is
the case most likely to need a person, so it is shown rather than hidden. The
same goes for a product with no manufacturer set — `REVIEW - no manufacturer
set`. If a code is missing *entirely*, it is one of the six above.

---

### The other direction: something on the sheet that should not be there

Same file, same `@Code` — grid 1's **MatchesStockHeldRule** and grid 3 answer it.

The live query's test is exact:

```sql
WHEN ISNULL(si.AnalysisCode3,'') = 'Yes'  THEN 'STOCK HELD'   -- Tibard
WHEN ISNULL(si.AnalysisCode7,'') = 'Yes'  THEN 'STOCK HELD'   -- Oliver Harvey
```

Anything that is not that value is treated as a **special make** and put on the
sheet. SQL Server's default collation is case-insensitive and ignores *trailing*
spaces, so `YES`, `yes` and `Yes ` all match. These do **not**:

| Stored value | Why it fails |
|---|---|
| `Y` | not the word |
| ` Yes` | leading spaces are **not** ignored, unlike trailing ones |
| blank or NULL | nothing to match |
| the flag in a different analysis slot | the query reads slot 3 / slot 7 only |

Grid 1 prints the flag in `[brackets]` so a leading space or a short form is
visible — an empty cell and a cell holding a space look identical otherwise.
Grid 3 lists every populated slot in both companies, which is how you tell a
flag that says the wrong thing from a flag that is in the wrong place.

**Worth confirming before assuming the data is wrong.** These analysis codes are
maintained by hand and are not necessarily the same thing as whatever the Sage
product screen labels "stock held". If grid 3 shows the Yes/No values sitting in
a slot other than 3 (Tibard) or 7 (Oliver Harvey) for some products, the query
is reading the wrong field for them and the *query* needs changing, not the
product. `08-find-analysis-code.sql` profiles all 20 slots across the whole
product file if it turns out to be widespread.

---

### Both real failures were the product record, not the query

Two incidents, days apart, and neither was a fault in the SQL:

| Product | Set-up | What the sheet did |
|---|---|---|
| `OHAPB0001` | `Manufacturer` = `"Aprons"` — a category typed into the manufacturer field when IT created the code | Classified `BOUGHT IN`, **dropped silently** |
| `OHAPP063015HP1S` | Stock held, but not on the website — and Oliver Harvey was read on `Website` only | A stock item was **offered as a special make** |

Both were caught by eye. That is the thing worth fixing — not either product.
The second one was a fault in the rule and is fixed there; the first was a
product record, and only a report catches that class.

**The two companies do not hold the same thing in the same place.** Counts from
`09-confirm-stock-held-slot.sql`, names read off the Sage product screen:

| Company | Code | Name | Yes | No | of |
|---|---|---|---|---|---|
| Tibard | `AnalysisCode3` | Stock Held | 1,561 | 805 | 107,352 |
| Oliver Harvey | `AnalysisCode3` | Stock Held | 23 | — | 8,280 |
| Oliver Harvey | `AnalysisCode7` | **Website** | 2,170 | 56 | 8,280 |

Oliver Harvey barely use Stock Held. They rely on **Website**, because anything
sold on the website is by definition held in stock. So:

> **Tibard** is stock held when Stock Held says Yes.
> **Oliver Harvey** is stock held when **either** Stock Held **or** Website does.

That is why `OHAPP063015HP1S` came through as a special make — stock held, but
not on the website, and the rule read only Website. It now reads both.

**Do not "tidy" the two halves of the query to match.** The asymmetry looks like
a slot number that drifted. It isn't: they are different tests because the two
companies record the fact differently.

**The slot-to-name mapping is good evidence, not proof.** It was established by
matching the Sage product screen against the stored values — five codes lined up
in order for Tibard (`ePO Lead Time`, `Exclude From Stock Uploads`, `Stock Held`,
`Stock Location Home`, `Stock Location Consignment` against blank / `Yes` / `Yes`
/ `B181A` / blank). Oliver Harvey's names were read off its own screen but not
separately checked against stored values. Discovery step **0.9** reads the names
from the database and settles it; worth running, because if OH's `AnalysisCode7`
is not `Website` then these counts are measuring something else.

**Blank is the normal state.** 98% of Tibard products and 73% of Oliver Harvey's
have no flag at all, and blank correctly means not stock held. It also means the
sheet's correctness for any one product depends on somebody having set the field
right — which is why the exceptions report exists rather than a cleverer rule.

`40-product-setup-exceptions.sql` catches the manufacturer class, restricted to
products with a live order so every row is actionable today. It no longer looks
for a mis-read stock-held flag, because the rule itself now handles that. Its first run will be noisy:
goods we genuinely buy in are dropped correctly and the report cannot tell them
from a mis-typed manufacturer. Work through the manufacturers once, add the real
suppliers to its `known_bought_in` list, and after that a row means something is
actually wrong.

---

## 6. Gotchas worth knowing

- **Dates.** Kept as text `yyyy-mm-dd` on purpose. Pasting a real Excel date into
  a browser gives you a 5-digit serial number or a dd/mm vs mm/dd guess. Text in
  ISO order can't be misread.
- **Tabs in descriptions.** Stripped in SQL. One stray tab in a product
  description would shift every column after it on that row.
- **Part-despatched orders.** The query returns qty *outstanding*, not qty
  ordered, so a half-shipped order raises a works order for the remainder only.
- **Returns excluded.** `DocumentTypeID = 0` keeps sales returns out.
- **`<NONE>` is a real value, not an empty field.** Oliver Harvey's Stock
  Location Consignment and one other analysis code hold the literal string
  `<NONE>`. Any future rule that tests an analysis code for "is it set" must
  treat `<NONE>` as empty — `NULLIF(NULLIF(LTRIM(RTRIM(code)),''),'<NONE>')` —
  or it will read "no value" as "a value".
- **Refresh, then copy.** With background refresh off (2.4) this is safe — but
  it's still worth telling Production: Refresh All, wait for the row count to
  settle, then copy.
