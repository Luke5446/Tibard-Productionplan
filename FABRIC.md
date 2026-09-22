# Fabric usage by works order

**Status: built and live.** The export produces the exact workbook the
five-minute Sage routine already reads.

## What Luke asked for

> Track the fabric usage by the works order and special makes works orders.
> At the moment we manually add the meterage in the cutting room, I then copy
> and paste this to a write-off Excel sheet and add to a shared folder, this
> runs a routine every 5 mins and pushes the write-off to Sage. I would like it
> that the cutting room no longer have to write this data down manually and
> it's pulled from the works order when the works order is completed.

## How it works

1. **Standard usage is on file for 8,152 product codes.** It comes from the
   All Costings sheet exactly as the costing app carries it — `COSTDATA`, index
   4 the fabric, index 5 the usage, always metres — embedded in the app as
   `FABRIC_USAGE` (code → `[Sage fabric code, metres per garment]`). A brand-new
   special make gets its figure from the costing-app import instead, so it is
   covered before it ever reaches the sheet.

2. **At completion the app records what was consumed** on every completed line:
   fabric code and name, metres per garment, **standard** (usage × quantity) and
   **actual** if the cutting room typed one. A code with no usage records `null`
   — visible, never a silent zero.

3. **The cutting room's number is optional.** The works order panel has a
   *Metres cut* column, pre-filled with the standard. Leave it and the standard
   is written off; type over it and that is the actual, and the variance shows
   on the KPI tab.

4. **The write-off is a button.** *Fabric write-off (CSV)* beside the
   history export produces a CSV in the routine's own layout, confirmed
   against a row from the live sheet:

   | StockCode | Location | Bin | Qty | Reference1 | Reference2 | ActivityDate | WriteOffCat |
   |---|---|---|---|---|---|---|---|
   | fabric Sage code | `HOME` | blank | metres | `Cutting` | works order ref | dd/mm/yyyy | `Manual Reduction` |

   One line per works order per fabric — a two-SKU order on the same cloth is
   one write-off. Only completed lines not yet exported, marked when the file
   is produced, so twice a day never writes the same fabric off twice. The PM
   saves it to the shared folder as today. Location, Reference1 and the
   category are constants at the top of `exportFabricWriteOff` if they ever
   change.

   **Each export is its own file**, `Fabric_WriteOff_<date>_<hhmm>.csv`. The
   routine takes any name (proven), so a dated, timed name means two exports
   in a day cannot collide, a file still waiting in the folder cannot be
   overwritten, and every Sage movement can be paired with the exact file
   that caused it.

   **A forward-dated line is discarded silently.** Two test files dated
   08/09/2026 on 07/09/2026 were swept from the folder without posting and
   without a rejection email; the same row dated the actual day posted at
   once. The app writes the completion date - the day the works order was
   completed - so it cannot produce a forward date. If a workstation's clock
   is ever wrong, this is the symptom to recognise: file taken, nothing
   posted, no email.

   Decimals in Qty are accepted (the last hand-typed file carried a `27.6`).
   Dates are `dd/mm/yyyy` text, line endings are Windows `\r\n`, and a value
   containing a comma or quote is quoted the way Excel would. Verified byte
   for byte against a file the routine accepted: no BOM, same header, same
   endings, trailing newline.

5. **KPI tab:** *Fabric m* per month (standard, with a count of lines that had
   no usage) and *Cut vs std* where actuals were typed. ±5% or more is flagged.

## Coverage, measured against what the factory actually completes

| | Codes | Units |
|---|---|---|
| Completed Jun–Sep 2026 | 354 | 19,262 |
| …with a usage figure | 340 | 18,534 — **96%** |
| Live works orders now | 67 | 2,075 |
| …with a usage figure | 61 | 1,967 — **95%** |

The largest gaps are `TI00x109` / `BANDANA109` (118 units each) and a handful
of OH aprons and specials. Adding a code to All Costings, or importing it from
the costing app, closes each one.

## Per-size markers for the jackets

All Costings holds one usage per code and gives most sizes of a style the same
figure. For the jackets that is wrong by size: on a 64" Stratford the flat
figure is 1.15 m against a marker of 1.66 m. So the app carries a second table,
`FABRIC_MARKERS`, from the Google Sheet *OH Jackets - Lay Plan - Varients*
(both tabs): **361 codes** across 18 jacket styles, each with metres per
garment — the marker length divided by the garments in the marker, so a
two-garment marker is averaged across the two — and, for **100** of them, the
mesh inserts' marker over its garments as a second fabric.

Rules applied when the sheet was read: the default-fabric marker wins where a
code has several; rows flagged do-not-use, patterns-only or damaged-fabric-only
are left out. Markers take precedence over All Costings for the codes they
cover; everything else is unchanged. Against All Costings the markers agree
within 2% on average and disagree by up to 44% on individual sizes, which is
the point.

The marker says how much; the fabric itself still comes from All Costings (or
the style's works order data), and the mesh's Sage code is whichever of the
style's fabrics is a mesh — `MESH2290901` for Cheshire and Dorset. Mesh goes on
the write-off as its own line, standard only; the cutting room's actual is for
the main cloth.

In the completed history since June, 135 codes and 2,906 units are now on
per-size figures. To refresh the table after the sheet changes, re-run the
parse in this session's notes — it is a plain CSV export of the sheet.

## Changing the cloth on a works order

The usage table names the cloth, but a customer can ask for another colour
and the table can be wrong. On the works order panel *✎ fabric* under the
Metres cut figure puts a live line on a different Sage stock code; the
metres per garment stay, the code, name and price change, and the record
carries the change into the ledger with a pencil mark. On the Fabric tab
*edit fabric* on an open ledger line does the same to a booked-in line; an
exported line cannot be changed. The fabric is chosen from a picker over
the Sage fabric list - the pasted stock sheet, with the usage table's codes
until one is pasted - searchable by code, name or supplier, and nothing off
that list can be chosen. *Back to the usage table* puts the line back on
the table's fabric.

## Corrections to All Costings

The usage table is All Costings' fabric column, and it has some products on
the wrong colour of the same cloth. Spotted on 21 Sep 2026 when WO-1030 for
OHAPP078606 (burgundy) showed khaki; found by checking every product's
colour against its fabric's colour within the same family. Corrected in the
app's table, and to be corrected in All Costings itself so the next rebuild
does not bring them back:

| Product | All Costings said | Corrected to |
|---|---|---|
| OHAPP078606 | PC2X133153 khaki | PC2X13306 burgundy |
| OHAPP0786153 | PC2X13306 burgundy | PC2X133153 khaki |
| OHAPP078682 | PC2083ECO olive | PC2082ECO brown |
| OHAPP078615 | PC2082ECO brown | PC2015ECO navy |
| OHAPP078683 | PC2064ECO storm grey | PC2083ECO olive |
| OHAPP0786248 | PC2015ECO navy | PC2064ECO storm grey |
| OHRSAPP060107 | CO5222ECO cocoa | CO5007 red |
| OHRSAPP0601222 | CO5007 red | CO5222ECO cocoa |
| OHSTRAP222NECK | CO5007 red | CO5222ECO cocoa |
| HTM0152SS55 | PC2064ECO storm grey | PC2055 royal blue |
| HTM0152SS248 | PC2055 royal blue | PC2064ECO storm grey |
| CJM01936001 | PC2003ECO black | PC2001ECO white |

Not changed, worth a look: OHAPP0630478HP1 is on CO5368 amber, and
TB0201SS51 / the KIDSBIB 07 codes are on PC2X13307, whose colour could not
be matched from the code alone.

## Sources

- All Costings via the costing app repo, `COSTDATA` (source file marked
  updated 19/09/24 — so anything costed since is only in the costing app's
  specials, which the import route covers).
- Markers and variants: *OH Jackets - Lay Plan - Varients* (Google Sheet, both tabs), linked 7 Sep 2026. The aprons sheet holds lay quantities but no marker lengths, so it is not used.

## The Fabric tab

Everything to do with the write-off lives on its own tab, next to KPIs.

**The ledger.** Every completed line that carries fabric is listed on the day
it was completed, grouped by month and then by day, collapsed. A line has one
of three states, kept on the completed record itself so they publish with the
history and a viewer sees the same ledger:

| State | Meaning | Fields |
|---|---|---|
| Open | waiting to be written off | — |
| Exported | went into a CSV for the Sage routine | `fabricExportedAt`, `fabricExportFile` |
| Dismissed | the PM decided it is not written off from here | `fabricDismissedAt` |

Exported and Dismissed are both *complete*: neither can be ticked again, so a
line cannot go into a second file by accident. Dismiss has an Undo. Undoing an
export is behind a warning, for the one case where the file never reached the
shared folder. A line put back with Undo on the completed history and
completed again keeps its state.

**Export.** Tick the lines (per line, per day, per month, or *Tick all
open*), press *Export ticked (CSV)*. Only ticked lines go in the file; each is
marked with the date and the file name as the file is produced. A line with
no usage on file cannot be ticked — it shows in red until the code is added to
All Costings, or dismissed.

**Cut m.** The cutting room's actual can be typed on the works order panel
before completion or in the tab afterwards, until the line is exported. The
*Var* column and the *Cut vs standard* tile show how far the standard is from
what was cut — this is the comparison to watch before trusting the standards.

**Usage.** Tiles for today, this week (Monday start) and this month; metres
per day for the last 30 days; by-week and by-month tables. Usage counts open
and exported lines; dismissed metres sit in their own column. Cost is metres
times `FABRIC_PRICES` — the Sage fabric price list as held in the costing app
(727 fabrics), All Costings' own figure where Sage has none — frozen onto each
line the day it completes, so a later price change does not re-cost history.
Rebuild the table from the costing app when either source changes.

**Later.** Trims would be a second kind of line in the same ledger with the
same three states. An automatic poster on a site server would read the open
lines, post them, and stamp them exported; neither the tab nor the CSV layout
would change.

## Catching up from the cutting sheet

The cutting room's own record is **Cutting Sheet 2026.xlsx**: one row per
works order and cloth — the W/O number in column C, the Sage fabric code in
K, the metres in L — with the rows already written off in Sage highlighted
green. The ledger only began when this version went live, and the first
weeks ran ahead of it, so the two had to be squared. **Cutting sheet** on
the Fabric tab's toolbar opens a paste box: select the rows in the sheet,
columns A to L, Ctrl+C, paste, then say what they are.

- **Already written off in Sage** (the green rows). Each row is placed on
  its completed line and the line is marked *Exported* with the file shown
  as *Sage - cutting sheet*, so it can never go into a file from here. The
  sheet's metres are kept as the cut figure, so the KPIs have the history.
  A line completed before the ledger existed (no fabric on its record) gets
  a record built from the works order's own usage. A works order still live
  is flagged on its line and arrives on the ledger already exported when it
  is booked in.
- **Still to write off** (the rest). Each row is placed the same way, the
  line is set to the sheet's metres and ticked; **Export ticked (CSV)**
  then makes the file as usual. A row with no metres (`-`, or `WASTE` —
  the cutting room used waste from another run) puts the line at nil: it
  completes with the rest but no row goes to Sage for it.

How a row finds its line. `W/O 1131`, `WO-1131`, `W/O/ 1131` all mean
`WO-1131`; a manual ref finds the same characters, or the same six-figure
sales order number with a compatible part (`S-OH115764-PT1` finds
`S-OH115764-Pt1`; `S869335` finds `S869335`, `S869335a` and `S869335 pt1`;
a seven-figure number is a slipped key, tried with each figure dropped, so
`S-OH1160079` finds `S-OH116079-Pt1`). The date is read off the whole paste, day/month or
month/day as the sheet's locale has it (Google Sheets in a US locale pastes
`7/27/2026`); a date that cannot be read is no date and never rejects a
match. The cut date must sit within a
fortnight of the record's life, so a three-figure typo (`W/O 121`) cannot
land on last quarter's works order of that number. Within the works order
the row goes to the line whose record carries that cloth (main or mesh);
failing that to the line the row names by style, or to every line when they
are all on the one cloth. **The cloth on the record stays as the works
order has it** — Luke's rule: match the fabric on the works order, not the
sheet — and only the metres are taken; these rows are listed so the
difference is seen (`PC2082` on the sheet, `PC2082ECO` on the order). A
further row for a line that already has its cloth is added as a second
cloth (a mesh row for a style whose usage carries no mesh). One sheet
figure over several lines is shared by their standard metres. A works
order with lines on several cloths and no row that names one is listed as
*could not be placed* for the PM to do by hand.

`SR` rows are samples and `EMB` rows embroidery backing — not works orders.
They are listed for a manual write-off and never go into a file from here.
Other rows the app does not know (a typo'd number, a sales order raised
outside the app) are listed with the reason; on a *still to write off*
paste the ones with metres can be downloaded as a write-off file of their
own (Reference2 is the sheet's W/O number) once checked.

`test-fabsheet.js` covers all of it. The first real run, on the published
data of 21 Sep 2026: 616 green rows placed 496 lines (405 records built);
149 later rows ticked 53 lines for 649 m, 8 of them at nil, and left 4 rows
for a file of their own and 6 for a manual write-off.

## Cut figures that do not look right

A row on the cutting sheet is sometimes the whole **lay** — the length the
cutting room put down that day, covering several works orders — rather than
the metres for the one job. Read as that job's own figure it writes off far
too much: 40 m against a single jacket, 23 m against six. So a cut figure is
held back when it is **half again as much as the standard, or half as much,
AND at least 5 m adrift**. Both tests must be met, so a mesh insert whose
0.51 m standard was written as 1 m on the sheet is 96% out and is ignored.
A figure of exactly nil is the cutting room's own "cut from waste" and is
left alone.

The cutting sheet import will not apply a figure like that: the line stays
on its standard and the row is listed in the result box. A figure already on
a line puts it in the **Cut figures to check** panel at the top of the
Fabric tab, with its own tile. Until each one is settled the line is not
ticked and cannot go into a write-off file. Two buttons per line:

- **Standard** drops the cutting room's figure and writes off the standard.
- **Accept** says the cutting room really did cut that much (`fabric.varOK`).

The panel covers lines that are still open and lines marked off against the
cutting sheet — those never went to Sage from here, so the figure can still
be put right. A line exported in one of our own files is left out on
purpose: that figure **is** what Sage was told, and changing it here would
hide the error rather than fix it. Those are corrected in Sage by hand.

## Which garments have mesh

Luke's rule, 22 Sep 2026: **an OH chef jacket carries mesh only when its code
has the M** — `OHCJM` for the long sleeve, `OHCJSM` for the short sleeve. The
M stands for mesh. Everything else in the `OHCJ` and `OHLCJ` ranges has none,
the whole ladies range (`OHLCJ`, `OHLCJS`) included.

The M sits in the variant position, straight after the `CJ` or `CJS`, so
`OHCJSUFFOLK` and `OHCJSSUFFOLK` are the Suffolk style and carry no mesh.
`ohHasMesh(code)` is the test. It only ever takes mesh **away** from a jacket,
never adds it, and it looks at chef-jacket codes alone: hats (`OHHTM...`,
`WAGHTM...`), aprons and straps keep whatever second cloth they carry.

It is enforced everywhere a second cloth can attach. `fabricUsageFor` is the
main gate, so no new works order picks up mesh it should not have. A guard
there does not reach the cutting sheet import, which needs its own, stated as
**where a mesh row is allowed to land**:

- as a **second cloth**, only on a garment the rule allows mesh;
- as the **main figure**, only when that garment's own cloth is that mesh.

Anything else is listed as a row that could not be placed. Both halves matter.
The import matches a row to a line by style, or by it being the only line on
the works order, so without the second half a mesh row overwrote the garment's
cloth figure with the mesh metres and sent that to Sage in its place — on a
completed line and on a live one alike, and in the already-written-off mode it
marked that cloth off on the strength of a mesh row. An audit of every route
found this after the first guard went in, because that one sat inside the
branch that adds a *further* cloth and so never ran when the mesh row was the
first to claim the line. `ohMeshConflicts()` warns on the
console if the marker table ever carries mesh for a jacket whose code has no M,
so a disagreement between the data and the rule is said out loud rather than
quietly suppressed.

### The mesh that is missing

The rule cuts the other way too. Of the 489 mesh-coded jacket sizes the app can
see, only **84 carry a mesh figure** — 405 write off no mesh at all, because
their marker row has mesh `null` or there is no marker row. Two whole families,
`OHCJMPOXFORD` / `OHCJSMPOXFORD` and `OHCJMSTIRLING` / `OHCJSMSTIRLING`, have no
mesh figure anywhere, and `OHCJMSTRATFORD` has none while its short-sleeve twin
has three. Where a figure does exist it is near enough constant within a family
(Cheshire 0.1018, Devon 0.2025 to 0.37, Dorset and Oxford 0.0319 to 0.0333,
Stratford 0.0815 to 0.0846), so the gaps could be filled from the family — but
that is a pattern-room decision, not one to guess at.

`fabFixMesh()` amends what is already on file. It runs on every load and when a
dismissed line is put back to open, strips a
wrong mesh extra from any **completed line still waiting to be written off**,
and leaves a written-off line exactly as it is — that figure is what Sage was
told, and rewriting it here would hide the difference rather than settle it.
It is idempotent, so it also catches work completed in another browser.

### The Hampshire corrections

Three errors, found from the routing cards and then from the rule:

- The eight long-sleeve marker keys were spelled `OHLCHAMPSHIRE` with no **J**.
  The real code is `OHLCJHAMPSHIRE`, so they never matched: the long sleeve
  fell back to All Costings at a flat 1.15 m for every size. Renamed, so it now
  uses its per-size markers, 1.22 m to 1.40 m.
- The whole family carried **2.5 m of mesh per garment**. Six jackets asked for
  15 m of `MESH2290901`.
- The `OHLCJHAMPSHIRE--01` routing card does describe mesh underarm panels at
  0.03 m, so that figure went in first. The rule overrides it: `OHLCJ` is the
  ladies range, no M, no mesh. **Worth settling with the pattern room** — the
  card and the code disagree.

## Fabric stock against live works orders

Fabric leaves the shelf at cutting but leaves Sage at completion, so Sage
overstates what can still be cut from, and a shortage only showed once the
goods were booked in. The Fabric tab now sets the Sage stock sheet against
what the app already knows:

| Column | Source |
|---|---|
| In Stock | `sage/60-fabric-stock.sql`, pasted (columns A to N) — confirmed stock at HOME, on PO, minimum and reorder levels, preferred supplier and lead time, last price |
| Live WO | the metres on every live works order not yet completed — actual where typed, standard otherwise, mesh at standard |
| Not written off | the ledger's open lines, by fabric code — completed, still in Sage |
| Free Stock | in stock less live WO less not written off: what could still be cut today |
| On PO | Sage's on-order figure; not stock, but the suggested order allows for it |

**Short** is Free Stock below nil, **below min** is Free Stock under the
minimum level, **not on sheet** is a fabric the works orders want that the
Sage sheet did not return; "on PO covers it" is added when the PO would put
it right. The order suggestion brings the fabric back to its minimum once
the PO lands, rounded up to 10 m, never below Sage's usual order quantity. Fabrics that are fine are hidden
until *Show fabrics that are fine too* is ticked. Live lines with no usage on
file are counted and shown, not silently left out of the demand.

**Lead time** is Sage's item figure where set. It is 0 on every Tiajo item
and the supplier account has no lead-time field, so the app holds a lead
time per supplier in working days (Tiajo 10 to start), editable on the tab
via *edit* under the supplier name, kept across pastes. **Minimum levels**
are 0 on every fabric in Sage today, so *below min* cannot fire until they
are set there; *short* does not depend on them.

**Monitored fabrics.** The office's supplier sheets (Cloth - Tiajo, P&R
etc.) gave 33 minimum levels across Tiajo, P&R, Utexbel, Carrington,
Clockwork and Leather Hides; they are built in as `FAB_MIN_LEVELS`. Sage's
own minimum wins where set, and *edit* under a Min figure overrides either.
Only fabrics with a minimum are shown unless *Include fabrics with no
minimum level* is ticked; the supplier chips filter to one supplier.

**The supplier order.** Choosing a supplier chip opens the order for that
supplier: every monitored fabric with a suggested quantity - enough to be
back at the minimum after the live works orders, rounded up to 10 m, never
below Sage's usual order quantity - and a box to change it. Tiajo ship free
from 4,000 m (`FAB_SUPPLIER_MIN`); *Top up* spreads the metres still needed
across the lines in proportion to annual call-off (`FAB_CALL_OFF`, from the
Tiajo tab) in 50 m steps. Typed quantities are kept in `fabStock.po` and
published, and are what the purchase order file will be built from.

The sheet is pasted, so it is as current as the last paste; a direct link is
the same query run by the site server and nothing on the tab changes. The
`60-fabric-stock.sql` header explains the first run: step 0 lists the stock
tables' columns and the product groups holding the known fabric codes, so
`fabric_groups` can be filled and any column name that differs on this Sage
version corrected.

**Sorting, Free + PO, needs ordering.** Both tables sort on a click of a
heading: high to low first, low to high on the second click, back to the
natural order (short, then below min, by live demand) on the third; the
choice is one person's, kept with the view settings. **Free + PO** sits
between Free Stock and Min in both tables: Free Stock plus what is on PO,
the figure the suggestion works from, in red when it is under the minimum.
A fabric **needs ordering** when Free + PO is under its minimum (or below
nil) — the suggested order is exactly what closes that gap. The *Needs
ordering* tile counts them with the metres suggested, and a click on the
tile or the red *Needs ordering* chip lists only those fabrics.

## First run

Complete a works order on this version, tick it on the Fabric tab, press
*Export ticked (CSV)*, and save the file to the shared folder. The routine takes it within five minutes; the movement shows in Sage's stock item history with Reference1
`Cutting` and the works order number as the second reference.
