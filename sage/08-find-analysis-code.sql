/* ============================================================================
   FIND THE STOCK-HELD ANALYSIS CODE
   Paste the WHOLE of this file (below the comment) into Excel's SQL statement
   box:  Data > Queries & Connections > Queries > right-click > Edit
         > gear icon next to "Source"

   Profiles all 20 analysis code slots on both companies. No guessing which
   slot, no example product codes needed.

   Reading the 40 rows that come back:
     DistinctValues = 2, ValueA/ValueB = 'No'/'Yes'  -> THAT is the slot
     DistinctValues = 0                              -> slot unused
     DistinctValues high (colours, sizes, fabrics)   -> not it

   ValueA is the alphabetically first value, ValueB the last, so a two-value
   Yes/No code shows both values outright.

   Check whether TIBARD and OLIVER HARVEY use the SAME slot number - the two
   companies were set up separately and may well not.
   ========================================================================= */

SELECT 'TIBARD' AS Company, 'AnalysisCode1' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode1,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode1,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode1,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode1,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode2' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode2,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode2,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode2,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode2,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode3' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode3,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode3,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode3,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode3,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode4' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode4,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode4,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode4,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode4,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode5' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode5,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode5,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode5,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode5,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode6' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode6,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode6,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode6,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode6,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode7' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode7,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode7,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode7,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode7,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode8' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode8,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode8,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode8,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode8,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode9' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode9,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode9,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode9,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode9,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode10' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode10,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode10,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode10,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode10,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode11' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode11,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode11,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode11,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode11,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode12' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode12,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode12,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode12,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode12,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode13' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode13,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode13,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode13,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode13,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode14' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode14,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode14,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode14,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode14,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode15' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode15,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode15,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode15,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode15,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode16' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode16,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode16,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode16,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode16,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode17' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode17,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode17,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode17,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode17,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode18' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode18,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode18,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode18,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode18,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode19' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode19,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode19,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode19,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode19,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'TIBARD' AS Company, 'AnalysisCode20' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode20,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode20,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode20,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode20,''))          AS ItemsPopulated
FROM   S200_LIVE.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode1' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode1,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode1,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode1,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode1,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode2' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode2,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode2,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode2,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode2,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode3' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode3,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode3,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode3,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode3,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode4' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode4,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode4,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode4,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode4,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode5' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode5,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode5,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode5,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode5,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode6' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode6,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode6,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode6,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode6,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode7' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode7,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode7,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode7,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode7,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode8' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode8,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode8,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode8,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode8,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode9' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode9,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode9,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode9,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode9,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode10' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode10,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode10,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode10,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode10,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode11' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode11,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode11,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode11,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode11,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode12' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode12,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode12,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode12,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode12,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode13' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode13,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode13,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode13,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode13,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode14' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode14,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode14,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode14,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode14,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode15' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode15,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode15,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode15,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode15,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode16' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode16,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode16,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode16,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode16,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode17' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode17,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode17,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode17,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode17,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode18' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode18,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode18,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode18,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode18,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode19' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode19,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode19,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode19,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode19,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem
UNION ALL
SELECT 'OLIVER HARVEY' AS Company, 'AnalysisCode20' AS CodeSlot,
       COUNT(DISTINCT NULLIF(AnalysisCode20,'')) AS DistinctValues,
       MIN(NULLIF(AnalysisCode20,''))            AS ValueA,
       MAX(NULLIF(AnalysisCode20,''))            AS ValueB,
       COUNT(NULLIF(AnalysisCode20,''))          AS ItemsPopulated
FROM   OliverHarveyLive.dbo.StockItem

ORDER BY Company, LEN(CodeSlot), CodeSlot;
