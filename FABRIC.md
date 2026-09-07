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

## Sources

- All Costings via the costing app repo, `COSTDATA` (source file marked
  updated 19/09/24 — so anything costed since is only in the costing app's
  specials, which the import route covers).
- Markers and variants: *OH Jackets - Lay Plan - Varients* (Google Sheet, both tabs), linked 7 Sep 2026. The aprons sheet holds lay quantities but no marker lengths, so it is not used.

## First run

Complete a works order on this version, press the button, and save the file
to the shared folder. The routine takes it within five minutes; the movement shows in Sage's stock item history with Reference1
`Cutting` and the works order number as the second reference.
