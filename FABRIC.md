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

## The size caveat

All Costings holds **one usage per code**, and it gives most sizes of a style
the same figure: every Cheshire long-sleeve jacket reads 1.45 m. The markers
sheet (Google Sheets, *variants and markers*) says 1.41 m at 32" rising to
1.73 m at 64" — a 23% spread. So the standard is right on average across a size
mix and wrong by up to ~15% on an individual size. That is still far better
than a hand-written number, but a per-size marker table is the next refinement
if the variance figure turns out to matter. The markers sheet has that data for
the OH jackets; it is not yet used.

## Sources

- All Costings via the costing app repo, `COSTDATA` (source file marked
  updated 19/09/24 — so anything costed since is only in the costing app's
  specials, which the import route covers).
- Markers and variants: the two Google Sheets Luke linked on 7 Sep 2026.

## First run

Complete a works order on this version, press the button, and save the file
to the shared folder. The routine takes it within five minutes; the movement shows in Sage's stock item history with Reference1
`Cutting` and the works order number as the second reference.
