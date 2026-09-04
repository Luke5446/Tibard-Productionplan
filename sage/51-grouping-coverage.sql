/* ============================================================================
   PROFIT PER PRODUCT - STEP 1b, CAN WE GROUP SIZES TOGETHER?
   Single statement. Uses ONLY columns already confirmed against the live
   database by 00-discovery.sql - nothing here is guessed.

   THE PROBLEM
   107,352 Tibard product codes, mostly size variants of the same garment. One
   row per code per month would put one or two units on most rows, where a
   single odd order swings the margin and the real pattern disappears. Profit
   is only actionable at the level you would act on - a garment, not a size.

   WHERE A GARMENT-LEVEL GROUPING COULD COME FROM
   Not the buffer app: its style list holds 258 styles, so it would cover well
   under 1% of the file.

   But 09-confirm-stock-held-slot.sql already showed Tibard's analysis codes
   carry exactly what is needed. Reading its ValueA/ValueB columns back:

     AnalysisCode9    384 values   Airforce Blue .. Zoom Grey            colour
     AnalysisCode10   139 values   01 .. XXS                             SIZE
     AnalysisCode12   257 values   AG Hotels .. Z Hotels                 customer
     AnalysisCode13     5 values   3/4 .. Sleeveless                     sleeve
     AnalysisCode14     3 values   Adult .. Pet                          age
     AnalysisCode15     4 values   Dog .. Unisex                         gender
     AnalysisCode16   527 values   1/4 Zip Knitted Sweater ..
                                   Zip-Up Concealed Chef Jacket          GARMENT
     AnalysisCode17   214 values   100% Acrylic .. Tinplate              fabric

   So AnalysisCode16 looks like the garment and AnalysisCode10 the size, which
   is the grouping we want. Those names are INFERRED from their values, exactly
   the way the stock-held slot was inferred before it turned out to be Website -
   so discovery step 0.9 should confirm them from the code names before any
   report relies on it.

   Oliver Harvey has NOTHING in slots 8 to 20 - all 8,280 products blank. So OH
   cannot be grouped this way at all, and Product Group is the fallback. That is
   what this query measures.

   THE REAL QUESTION IS COVERAGE ON WHAT SELLS, not on the whole file. Most of
   those 107,352 codes are historic and never ordered again; a field being blank
   on 93,000 dead codes does not matter. This counts only lines that were
   actually despatched in the last 24 months.

   HOW TO READ IT
   Look at PctOfLines for each grouping. Above roughly 90% on despatched lines
   means it can carry the report, with the remainder shown as "(ungrouped)".
   Much below that and Product Group is the safer basis, coarser but complete.
   ========================================================================= */

WITH sold AS (
    SELECT 'TIBARD'                          AS Company,
           LTRIM(RTRIM(sorl.ItemCode))       AS ProductCode,
           NULLIF(LTRIM(RTRIM(ISNULL(si.AnalysisCode16,''))),'') AS Garment,
           NULLIF(LTRIM(RTRIM(ISNULL(si.AnalysisCode10,''))),'') AS Size_,
           NULLIF(LTRIM(RTRIM(ISNULL(si.AnalysisCode9 ,''))),'') AS Colour,
           NULLIF(LTRIM(RTRIM(ISNULL(pg.Code,''))),'')           AS ProductGroup
    FROM        S200_LIVE.dbo.SOPOrderReturnLine sorl
    INNER JOIN  S200_LIVE.dbo.SOPOrderReturn     sor ON sor.SOPOrderReturnID = sorl.SOPOrderReturnID
    LEFT  JOIN  S200_LIVE.dbo.StockItem          si  ON si.Code              = sorl.ItemCode
    LEFT  JOIN  S200_LIVE.dbo.ProductGroup       pg  ON pg.ProductGroupID    = si.ProductGroupID
    WHERE  sorl.LineTypeID = 0
      AND  ISNULL(sorl.DespatchReceiptQuantity,0) > 0
      AND  sor.DocumentDate >= DATEADD(month,-24,GETDATE())

    UNION ALL

    SELECT 'OLIVER HARVEY',
           LTRIM(RTRIM(sorl.ItemCode)),
           NULLIF(LTRIM(RTRIM(ISNULL(si.AnalysisCode16,''))),''),
           NULLIF(LTRIM(RTRIM(ISNULL(si.AnalysisCode10,''))),''),
           NULLIF(LTRIM(RTRIM(ISNULL(si.AnalysisCode9 ,''))),''),
           NULLIF(LTRIM(RTRIM(ISNULL(pg.Code,''))),'')
    FROM        OliverHarveyLive.dbo.SOPOrderReturnLine sorl
    INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturn     sor ON sor.SOPOrderReturnID = sorl.SOPOrderReturnID
    LEFT  JOIN  OliverHarveyLive.dbo.StockItem          si  ON si.Code              = sorl.ItemCode
    LEFT  JOIN  OliverHarveyLive.dbo.ProductGroup       pg  ON pg.ProductGroupID    = si.ProductGroupID
    WHERE  sorl.LineTypeID = 0
      AND  ISNULL(sorl.DespatchReceiptQuantity,0) > 0
      AND  sor.DocumentDate >= DATEADD(month,-24,GETDATE())
)
SELECT Company,
       Grouping_,
       Lines_,
       DespatchedLines,
       CAST(100.0 * DespatchedLines / NULLIF(Lines_,0) AS decimal(5,1)) AS PctOfLines,
       DistinctCodes,
       DistinctValues
FROM (
    SELECT Company,
           'AnalysisCode16  garment'  AS Grouping_,
           COUNT(*)                              AS Lines_,
           SUM(CASE WHEN Garment      IS NOT NULL THEN 1 ELSE 0 END) AS DespatchedLines,
           COUNT(DISTINCT ProductCode)           AS DistinctCodes,
           COUNT(DISTINCT Garment)               AS DistinctValues
    FROM sold GROUP BY Company
    UNION ALL
    SELECT Company, 'AnalysisCode10  size', COUNT(*),
           SUM(CASE WHEN Size_        IS NOT NULL THEN 1 ELSE 0 END),
           COUNT(DISTINCT ProductCode), COUNT(DISTINCT Size_)
    FROM sold GROUP BY Company
    UNION ALL
    SELECT Company, 'AnalysisCode9   colour', COUNT(*),
           SUM(CASE WHEN Colour       IS NOT NULL THEN 1 ELSE 0 END),
           COUNT(DISTINCT ProductCode), COUNT(DISTINCT Colour)
    FROM sold GROUP BY Company
    UNION ALL
    SELECT Company, 'ProductGroup    fallback', COUNT(*),
           SUM(CASE WHEN ProductGroup IS NOT NULL THEN 1 ELSE 0 END),
           COUNT(DISTINCT ProductCode), COUNT(DISTINCT ProductGroup)
    FROM sold GROUP BY Company
) x
ORDER BY Company, Grouping_;
