/* ============================================================================
   WHICH SLOT REALLY HOLDS THE STOCK-HELD FLAG?          Both companies, all 20.

   Run this in SQL Server Management Studio, or paste it into Excel on its own
   (it is a single statement, so Power Query returns all of it).

   WHY THIS EXISTS
   10-special-makes-live.sql reads AnalysisCode3 for Tibard and AnalysisCode7
   for Oliver Harvey. Product OHAPP063015HP1S showed the OH flag sitting in
   AnalysisCode3, with AnalysisCode7 empty - so the rule read an empty field,
   decided the item was not stock held, and put a stock item on the special
   makes sheet. 08-find-analysis-code.sql profiled the slots originally;
   this settles which slot each company actually uses, on the whole file
   rather than one product.

   HOW TO READ IT
   The stock-held slot is the one where SaysYes + SaysNo accounts for nearly
   every product and Other is 0 or close to it. Slots full of colours, sizes,
   fabrics and fits will have a high DistinctValues and a large Other - those
   are product attributes, not the flag.

     SaysYes   items the live query would treat as STOCK HELD - kept off the sheet
     SaysNo    items it would treat as a special make
     Blank     no value at all. The rule treats blank as NOT stock held, so
               every blank in the slot being read is a stock item that reaches
               the sheet as if it were a special make.
     Other     a value that is neither Yes nor No

   THE NUMBER THAT MATTERS: SaysYes for the slot each company is currently
   read on. If that is 0, the rule has never excluded a single stock item for
   that company.
   ========================================================================= */

SELECT 'TIBARD'                                        AS Company,
       v.SlotNo,
       'AnalysisCode' + CAST(v.SlotNo AS varchar(2))   AS Slot,
       CASE WHEN v.SlotNo = 3 THEN '<< read by the live query' ELSE '' END AS ReadByTheRule,
       COUNT(*)                                        AS Products,
       SUM(CASE WHEN v.Val = 'Yes' THEN 1 ELSE 0 END)  AS SaysYes,
       SUM(CASE WHEN v.Val = 'No'  THEN 1 ELSE 0 END)  AS SaysNo,
       SUM(CASE WHEN NULLIF(v.Val,'') IS NULL THEN 1 ELSE 0 END) AS Blank,
       SUM(CASE WHEN NULLIF(v.Val,'') IS NOT NULL
                 AND v.Val NOT IN ('Yes','No') THEN 1 ELSE 0 END) AS Other,
       COUNT(DISTINCT NULLIF(v.Val,''))                AS DistinctValues,
       MIN(NULLIF(v.Val,''))                           AS ValueA,
       MAX(NULLIF(v.Val,''))                           AS ValueB
FROM        S200_LIVE.dbo.StockItem si
CROSS APPLY (VALUES
        ( 1, ISNULL(si.AnalysisCode1,'')),
        ( 2, ISNULL(si.AnalysisCode2,'')),
        ( 3, ISNULL(si.AnalysisCode3,'')),
        ( 4, ISNULL(si.AnalysisCode4,'')),
        ( 5, ISNULL(si.AnalysisCode5,'')),
        ( 6, ISNULL(si.AnalysisCode6,'')),
        ( 7, ISNULL(si.AnalysisCode7,'')),
        ( 8, ISNULL(si.AnalysisCode8,'')),
        ( 9, ISNULL(si.AnalysisCode9,'')),
        (10, ISNULL(si.AnalysisCode10,'')),
        (11, ISNULL(si.AnalysisCode11,'')),
        (12, ISNULL(si.AnalysisCode12,'')),
        (13, ISNULL(si.AnalysisCode13,'')),
        (14, ISNULL(si.AnalysisCode14,'')),
        (15, ISNULL(si.AnalysisCode15,'')),
        (16, ISNULL(si.AnalysisCode16,'')),
        (17, ISNULL(si.AnalysisCode17,'')),
        (18, ISNULL(si.AnalysisCode18,'')),
        (19, ISNULL(si.AnalysisCode19,'')),
        (20, ISNULL(si.AnalysisCode20,''))
) v(SlotNo, Val)
GROUP BY v.SlotNo

UNION ALL

SELECT 'OLIVER HARVEY',
       v.SlotNo,
       'AnalysisCode' + CAST(v.SlotNo AS varchar(2)),
       CASE WHEN v.SlotNo = 7 THEN '<< read by the live query' ELSE '' END,
       COUNT(*),
       SUM(CASE WHEN v.Val = 'Yes' THEN 1 ELSE 0 END),
       SUM(CASE WHEN v.Val = 'No'  THEN 1 ELSE 0 END),
       SUM(CASE WHEN NULLIF(v.Val,'') IS NULL THEN 1 ELSE 0 END),
       SUM(CASE WHEN NULLIF(v.Val,'') IS NOT NULL
                 AND v.Val NOT IN ('Yes','No') THEN 1 ELSE 0 END),
       COUNT(DISTINCT NULLIF(v.Val,'')),
       MIN(NULLIF(v.Val,'')),
       MAX(NULLIF(v.Val,''))
FROM        OliverHarveyLive.dbo.StockItem si
CROSS APPLY (VALUES
        ( 1, ISNULL(si.AnalysisCode1,'')),
        ( 2, ISNULL(si.AnalysisCode2,'')),
        ( 3, ISNULL(si.AnalysisCode3,'')),
        ( 4, ISNULL(si.AnalysisCode4,'')),
        ( 5, ISNULL(si.AnalysisCode5,'')),
        ( 6, ISNULL(si.AnalysisCode6,'')),
        ( 7, ISNULL(si.AnalysisCode7,'')),
        ( 8, ISNULL(si.AnalysisCode8,'')),
        ( 9, ISNULL(si.AnalysisCode9,'')),
        (10, ISNULL(si.AnalysisCode10,'')),
        (11, ISNULL(si.AnalysisCode11,'')),
        (12, ISNULL(si.AnalysisCode12,'')),
        (13, ISNULL(si.AnalysisCode13,'')),
        (14, ISNULL(si.AnalysisCode14,'')),
        (15, ISNULL(si.AnalysisCode15,'')),
        (16, ISNULL(si.AnalysisCode16,'')),
        (17, ISNULL(si.AnalysisCode17,'')),
        (18, ISNULL(si.AnalysisCode18,'')),
        (19, ISNULL(si.AnalysisCode19,'')),
        (20, ISNULL(si.AnalysisCode20,''))
) v(SlotNo, Val)
GROUP BY v.SlotNo

ORDER BY Company, SlotNo;
