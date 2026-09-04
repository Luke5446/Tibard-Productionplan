# Profit per product per month

Started 4 Sep 2026. Paused to resume Monday 7 Sep. **Nothing is built yet** —
the two files that exist are discovery, and neither has been run.

## What Luke asked for

> A report that shows profit per product each month. I want to check we are
> making money or, more importantly, making a loss on products.

> By sales we have had each month.

> **I want a flag for each month where we sell goods and make a loss.**

So the deliverable is not a table of margins to read through. It is a list of
**product-months that lost money**, with the numbers behind each one. A month
where a product sold and the margin came out negative gets flagged; everything
else can stay quiet.

Scope taken from "by sales we have had each month": **realised sales only** —
what was actually despatched or invoiced in that month, not what was ordered.
An order sitting on the system has made nothing and lost nothing. Credits and
returns net off against the month they land in.

## Why this is not just a SUM

Revenue is easy; it is on the order line. **Cost is the whole question.**

For goods we buy, Sage's cost is a purchase price and will be about right. For
garments we *make*, it is whatever was set up as a standard cost — and if that
has not been maintained, the report will confidently show profit on products
that lose money. That is worse than having no report, because people act on it.

**Establish that the cost on a made garment is a real number before building
anything.** If it is not, the cost has to come from the costing app instead,
which is a much bigger job and worth knowing up front.

## Where we got to

| File | Status |
|---|---|
| `50-profit-discovery.sql` | Written, **not run**. Pure catalogue read — names no table or column of its own, so it cannot fail on a wrong guess. Returns the SOP/despatch/invoice tables and every money, quantity and date column on them, for both companies. |
| `51-grouping-coverage.sql` | Written, **not run**. Measures whether sizes can be rolled up into a garment. Uses only columns already confirmed by `00-discovery.sql`. |

Run both, send the output back, and step 2 samples real values using real names.

## The grouping problem, and a likely answer

107,352 Tibard product codes, mostly size variants of one garment. One row per
code per month puts one or two units on most rows, where a single odd order
swings the margin and the pattern disappears. It needs to group at the level
you would act on — a garment, not a size.

The buffer app cannot supply it: 258 styles against 107,352 codes.

Tibard's own analysis codes probably can. From the values already returned by
`09-confirm-stock-held-slot.sql`:

| Code | Values | Looks like |
|---|---|---|
| `AnalysisCode9` | 384 — Airforce Blue … Zoom Grey | colour |
| `AnalysisCode10` | 139 — 01 … XXS | **size** |
| `AnalysisCode12` | 257 — AG Hotels … Z Hotels | customer |
| `AnalysisCode13` | 5 — 3/4 … Sleeveless | sleeve |
| `AnalysisCode14` | 3 — Adult … Pet | age |
| `AnalysisCode15` | 4 — Dog … Unisex | gender |
| `AnalysisCode16` | 527 — 1/4 Zip Knitted Sweater … Zip-Up Concealed Chef Jacket | **garment** |
| `AnalysisCode17` | 214 — 100% Acrylic … Tinplate | fabric |

**These names are inferred from their values**, exactly the way the stock-held
slot was inferred before it turned out to be *Website*. Run discovery step
**0.9** and confirm them from the stored code names before the report leans on
any of it.

**Oliver Harvey has nothing in slots 8–20** — all 8,280 products blank. So OH
cannot be grouped this way and Product Group is its fallback, coarser but
complete. `51-grouping-coverage.sql` measures whether that holds up, on
despatched lines rather than on the whole file: a field being blank on tens of
thousands of dead codes says nothing about whether it can carry the report.

## Two questions still open

Both were put to Luke and set aside until the data says what is possible:

1. **Grouping level** — garment with sizes rolled up, individual product code,
   or garment totals drillable to code.
2. **Cost basis** — materials only, materials + labour, or fully loaded with
   overhead. What Sage holds may decide this for us.

## Traps already known, that apply here too

- **`<NONE>` is a stored value, not a blank.** Any test for "is this analysis
  code set" must strip it.
- **Excel's Power Query returns only the FIRST result set** of a multi-statement
  batch. Both discovery files are deliberately single statements.
- **Do not assume the two companies match.** Every time they have looked
  identical on this project, they were not.
- Reserved words: `LineNo` is one. Check aliases before using them.
