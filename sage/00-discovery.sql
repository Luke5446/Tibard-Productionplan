/* ============================================================================
   STEP 0 - DISCOVERY
   Run these FIRST, in SQL Server Management Studio, against your Sage 200
   COMPANY database (not the master/system one).

   Purpose: confirm the exact column names and the code numbers your install
   uses, before you trust the main query. Sage's schema is stable across
   versions but the status ENUM NUMBERS are the thing worth proving rather
   than assuming.
   ========================================================================= */


/* --- 0.1  Confirm the tables and columns exist with these names ----------
   RUN THIS FIRST. Do not guess column names - Sage's are not always what you
   would expect (StockItem has no ItemTypeID, for one). Three-part naming so it
   works from Excel whichever database the connection is pointed at. */
SELECT  TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM    S200_LIVE.INFORMATION_SCHEMA.COLUMNS
WHERE   TABLE_NAME IN ('SOPOrderReturn','SOPOrderReturnLine',
                       'StockItem','ProductGroup','SLCustomerAccount')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
/* Expect to see, among others:
     SOPOrderReturn      : SOPOrderReturnID, DocumentNo, DocumentTypeID,
                           DocumentStatusID, CustomerID, DocumentDate,
                           RequestedDeliveryDate, PromisedDeliveryDate
     SOPOrderReturnLine  : SOPOrderReturnLineID, SOPOrderReturnID, LineNumber,
                           LineTypeID, ItemID, ItemCode, ItemDescription,
                           LineQuantity, QuantityDespatched
   If a name differs on your version, correct it in 10-special-makes-live.sql. */


/* --- 0.2  Prove which DocumentStatusID means "live" ---------------------- */
/* Open Sage, note one order number you can SEE is live, and one you know is
   completed. Put them in here and read the numbers back. Do not guess. */
SELECT  DocumentNo, DocumentTypeID, DocumentStatusID, DocumentDate
FROM    SOPOrderReturn
WHERE   DocumentNo IN ('<a live order no>', '<a completed order no>');

/* Sanity check on the spread of values: */
SELECT  DocumentTypeID, DocumentStatusID, COUNT(*) AS Orders,
        MIN(DocumentDate) AS Earliest, MAX(DocumentDate) AS Latest
FROM    SOPOrderReturn
GROUP BY DocumentTypeID, DocumentStatusID
ORDER BY DocumentTypeID, DocumentStatusID;
/* DocumentTypeID 0 = Sales Order, 1 = Sales Return (confirm with the above). */


/* --- 0.3  CONFIRMED SCHEMA (from 0.1, run against the live database) -----

   StockItem   : ItemID, Code, Name, Description, ProductGroupID,
                 StockItemStatusID, BOMItemTypeID, AllowSalesOrder,
                 AnalysisCode1..20, SpareText/Number/Date/Bit...
                 >> NO ItemTypeID. StockItem carries no stock/non-stock flag.

   ProductGroup: ProductGroupID, Code, Description, StockItemTypeID,
                 CostingMethodID, ThisIsTheSOPProductGroup, ...
                 >> NO Name (it is Description), NO HoldsStock.
                 >> StockItemTypeID is where stock vs non-stock lives.

   So "is this a special make?" is answered by the PRODUCT GROUP the item sits
   in, not by anything on the item itself - unless you tag it with an analysis
   code, which query 0.7 checks for.                                        */


/* --- 0.4  Line types present on your orders ----------------------------- */
SELECT  LineTypeID, COUNT(*) AS Lines
FROM    SOPOrderReturnLine
GROUP BY LineTypeID;
/* 0 = Standard (stock/product) line, 1 = Free text, 2 = Charge, 3 = Comment.
   If special makes are ever keyed as FREE TEXT rather than a product code,
   type 1 rows matter to you - the main query keeps them and flags them. */


/* --- 0.5  BOTH COMPANIES: run the stock-held check across the two databases -
   Tibard (S200_LIVE) and Oliver Harvey (OliverHarveyLive) are on the same
   server, so three-part names read both in one go. Paste this straight into
   Excel's SQL statement box.

   Fill in one code you KNOW is stock-held and one you KNOW is a special make
   for EACH company, then look for the column that differs between them.
   Do not assume both companies use the same convention - check.            */

SELECT 'TIBARD' AS Company, si.Code, si.Name,
       si.ItemTypeID, si.ProductGroupID,
       pg.Code AS PG_Code, pg.Name AS PG_Name, pg.*
FROM   S200_LIVE.dbo.StockItem si
LEFT JOIN S200_LIVE.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
WHERE  si.Code IN ('OHAPP054415', '<a Tibard special make code>')

UNION ALL

SELECT 'OLIVER HARVEY', si.Code, si.Name,
       si.ItemTypeID, si.ProductGroupID,
       pg.Code, pg.Name, pg.*
FROM   OliverHarveyLive.dbo.StockItem si
LEFT JOIN OliverHarveyLive.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
WHERE  si.Code IN ('<an OH stock-held code>', '<an OH special make code>');

/* If this errors with "Invalid column name", the ProductGroup table on your
   version does not have that column - run 0.1 first and use the real names.
   If it errors on OliverHarveyLive specifically, your Windows login can read
   Tibard but not Oliver Harvey; ask IT to even that up. */


/* --- 0.6  THE DECIDER: list every product group with its stock item type ---
   Small output, and usually answers the whole question outright. Your group
   codes/descriptions will make it obvious which are special makes.
   Read off which StockItemTypeID number your stock-held groups carry - do not
   assume 0 = Stock.                                                        */

SELECT 'TIBARD' AS Company, pg.Code AS GroupCode, pg.Description AS GroupDesc,
       pg.StockItemTypeID, COUNT(si.ItemID) AS Items
FROM   S200_LIVE.dbo.ProductGroup pg
LEFT JOIN S200_LIVE.dbo.StockItem si ON si.ProductGroupID = pg.ProductGroupID
GROUP BY pg.Code, pg.Description, pg.StockItemTypeID

UNION ALL

SELECT 'OLIVER HARVEY', pg.Code, pg.Description,
       pg.StockItemTypeID, COUNT(si.ItemID)
FROM   OliverHarveyLive.dbo.ProductGroup pg
LEFT JOIN OliverHarveyLive.dbo.StockItem si ON si.ProductGroupID = pg.ProductGroupID
GROUP BY pg.Code, pg.Description, pg.StockItemTypeID

ORDER BY Company, GroupCode;


/* --- 0.7  FALLBACK: if 0.6 shows every group with the same type ----------
   ...then the stock/non-stock split is not the product group, and is most
   likely a custom analysis code ("Stock Held: Yes/No" is exactly what a Sage
   200 analysis code looks like). This puts a known stock item and a known
   special make side by side across all 20 codes - look for the one that
   differs. Fill in the two codes first.                                    */

SELECT si.Code, si.Name, pg.Code AS GroupCode, pg.StockItemTypeID,
       si.AnalysisCode1,  si.AnalysisCode2,  si.AnalysisCode3,  si.AnalysisCode4,
       si.AnalysisCode5,  si.AnalysisCode6,  si.AnalysisCode7,  si.AnalysisCode8,
       si.AnalysisCode9,  si.AnalysisCode10, si.AnalysisCode11, si.AnalysisCode12,
       si.AnalysisCode13, si.AnalysisCode14, si.AnalysisCode15, si.AnalysisCode16,
       si.AnalysisCode17, si.AnalysisCode18, si.AnalysisCode19, si.AnalysisCode20
FROM   S200_LIVE.dbo.StockItem si
LEFT JOIN S200_LIVE.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
WHERE  si.Code IN ('OHAPP054415', '<a known special make code>');


/* --- 0.8  FIND THE ANALYSIS CODE SLOT (no guessing required) --------------
   Product groups turned out to be garment categories (Chef Jackets, Trousers,
   Aprons...), not a stock/non-stock split - so the flag is an analysis code on
   the stock item, as expected.

   This profiles all 20 analysis code slots on both companies without needing
   to know which one is which, or to supply example product codes.

   Read the output like this:
     - DistinctValues = 2 with ValueA/ValueB reading 'No'/'Yes'  -> that's the slot
     - DistinctValues = 0                                       -> slot unused
     - DistinctValues high (colours, sizes, fabrics)             -> not it

   ValueA is the alphabetically first value and ValueB the last, so for a
   two-value Yes/No code you get both values outright - no follow-up needed.

   40 rows out. Check whether Tibard and Oliver Harvey use the SAME slot
   number; they were set up separately and may well not.                    */

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


/* --- 0.9  THE FEED PREVIEW: does the manufacturer filter lose special makes?
   Also confirms the whole join chain works on real data, and reveals which
   DocumentStatusID means "live" (>> CHECK 1 <<) at the same time.

   Uses the CONFIRMED column names:
     PrintSequenceNumber      (there is no LineNumber)
     DespatchReceiptQuantity  (there is no QuantityDespatched)
     si.Code = sorl.ItemCode  (the line carries no ItemID)

   What to look for: the rows where Flag = 'SPECIAL MAKE'. If most of those sit
   under Maker = '(blank)', then filtering to 'OURS' would drop the bulk of the
   special makes and must NOT be applied.                                    */

WITH lines AS (
    SELECT 'TIBARD' AS Company, sor.DocumentStatusID,
           CASE WHEN si.Code IS NULL            THEN 'no stock record'
                WHEN si.AnalysisCode3 = 'Yes'   THEN 'stock held'
                ELSE 'SPECIAL MAKE' END AS Flag,
           CASE WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL THEN '(blank)'
                WHEN si.Manufacturer LIKE '%Tibard%'
                  OR si.Manufacturer LIKE '%Oliver Harvey%'           THEN 'OURS'
                ELSE 'bought in' END AS Maker
    FROM        S200_LIVE.dbo.SOPOrderReturn     sor
    INNER JOIN  S200_LIVE.dbo.SOPOrderReturnLine sorl ON sorl.SOPOrderReturnID = sor.SOPOrderReturnID
    LEFT  JOIN  S200_LIVE.dbo.StockItem          si   ON si.Code = sorl.ItemCode
    WHERE  sor.DocumentTypeID = 0
      AND  sorl.LineTypeID IN (0,1)
      AND  (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0

    UNION ALL

    SELECT 'OLIVER HARVEY', sor.DocumentStatusID,
           CASE WHEN si.Code IS NULL            THEN 'no stock record'
                WHEN si.AnalysisCode7 = 'Yes'   THEN 'stock held'
                ELSE 'SPECIAL MAKE' END,
           CASE WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL THEN '(blank)'
                WHEN si.Manufacturer LIKE '%Tibard%'
                  OR si.Manufacturer LIKE '%Oliver Harvey%'           THEN 'OURS'
                ELSE 'bought in' END
    FROM        OliverHarveyLive.dbo.SOPOrderReturn     sor
    INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturnLine sorl ON sorl.SOPOrderReturnID = sor.SOPOrderReturnID
    LEFT  JOIN  OliverHarveyLive.dbo.StockItem          si   ON si.Code = sorl.ItemCode
    WHERE  sor.DocumentTypeID = 0
      AND  sorl.LineTypeID IN (0,1)
      AND  (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
)
SELECT Company, DocumentStatusID, Flag, Maker, COUNT(*) AS OrderLines
FROM   lines
GROUP BY Company, DocumentStatusID, Flag, Maker
ORDER BY Company, DocumentStatusID, Flag, Maker;


/* --- 1.0  WHAT PRODUCT GROUPS ARE ACTUALLY COMING THROUGH THE FEED? -------
   The first live run showed LOGOAPPLICATION and LOGOORIGINATION lines sitting
   alongside the garment lines on the same sales order - finishing instructions
   rather than separate jobs.

   This lists the product groups present in the feed so they can be split into
   "garment - make it" and "note - attach to the works order for this order".
   Grouping beats hardcoding codes: new service codes added later inherit the
   classification instead of silently becoming works orders.                */

WITH feed AS (
    SELECT 'TIBARD' AS Company,
           ISNULL(pg.Code,'(none)')                              AS GroupCode,
           ISNULL(pg.Description,'(free text / not in stock file)') AS GroupDesc,
           sorl.LineTypeID, sorl.ItemCode
    FROM        S200_LIVE.dbo.SOPOrderReturn      sor
    INNER JOIN  S200_LIVE.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
    LEFT  JOIN  S200_LIVE.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
    LEFT  JOIN  S200_LIVE.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
    LEFT  JOIN  S200_LIVE.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
    WHERE  sor.DocumentTypeID = 0 AND sor.DocumentStatusID = 0
      AND  sorl.LineTypeID IN (0,1)
      AND  (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
      AND  ISNULL(si.AnalysisCode3,'') <> 'Yes'
      AND  ISNULL(cust.CustomerAccountNumber,'') <> 'OLIVER'
      AND  (si.Code IS NULL OR NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
            OR si.Manufacturer LIKE '%Tibard%' OR si.Manufacturer LIKE '%Oliver Harvey%')

    UNION ALL

    SELECT 'OLIVER HARVEY',
           ISNULL(pg.Code,'(none)'),
           ISNULL(pg.Description,'(free text / not in stock file)'),
           sorl.LineTypeID, sorl.ItemCode
    FROM        OliverHarveyLive.dbo.SOPOrderReturn      sor
    INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
    LEFT  JOIN  OliverHarveyLive.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
    LEFT  JOIN  OliverHarveyLive.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
    LEFT  JOIN  OliverHarveyLive.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
    WHERE  sor.DocumentTypeID = 0 AND sor.DocumentStatusID = 0
      AND  sorl.LineTypeID IN (0,1)
      AND  (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
      AND  ISNULL(si.AnalysisCode7,'') <> 'Yes'
      AND  ISNULL(cust.CustomerAccountNumber,'') <> 'TIB003'
      AND  (si.Code IS NULL OR NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
            OR si.Manufacturer LIKE '%Tibard%' OR si.Manufacturer LIKE '%Oliver Harvey%')
)
SELECT Company, GroupCode, GroupDesc, LineTypeID, COUNT(*) AS Lines,
       MIN(ItemCode) AS ExampleA, MAX(ItemCode) AS ExampleB
FROM   feed
GROUP BY Company, GroupCode, GroupDesc, LineTypeID
ORDER BY Company, COUNT(*) DESC;


/* --- 1.1  HOW OFTEN DO LINE AND ORDER PROMISED DATES DISAGREE? ------------
   Order 114816 showed 2026-08-05 on the line while Sage's header said
   11/09/2026, so the sheet called it Overdue on a date nobody had promised.
   The query now takes the header date; this shows how widespread the
   disagreement is, and whether any line date is genuinely later (a staggered
   delivery, which taking the header would flatten).                       */

SELECT Company, Disagreement, COUNT(*) AS Lines,
       MIN(SalesOrderNo) AS ExampleOrder,
       MIN(LineDate) AS ExampleLineDate, MIN(HeaderDate) AS ExampleHeaderDate
FROM (
    SELECT 'TIBARD' AS Company, sor.DocumentNo AS SalesOrderNo,
           CONVERT(varchar(10), sorl.PromisedDeliveryDate, 23) AS LineDate,
           CONVERT(varchar(10), sor.PromisedDeliveryDate, 23)  AS HeaderDate,
           CASE WHEN sorl.PromisedDeliveryDate IS NULL THEN 'line date missing'
                WHEN sor.PromisedDeliveryDate IS NULL  THEN 'header date missing'
                WHEN sorl.PromisedDeliveryDate = sor.PromisedDeliveryDate THEN 'same'
                WHEN sorl.PromisedDeliveryDate < sor.PromisedDeliveryDate THEN 'line EARLIER than header'
                ELSE 'line LATER than header' END AS Disagreement
    FROM       S200_LIVE.dbo.SOPOrderReturn     sor
    INNER JOIN S200_LIVE.dbo.SOPOrderReturnLine sorl ON sorl.SOPOrderReturnID = sor.SOPOrderReturnID
    WHERE sor.DocumentTypeID=0 AND sor.DocumentStatusID=0 AND sorl.LineTypeID IN (0,1)
      AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0

    UNION ALL

    SELECT 'OLIVER HARVEY', sor.DocumentNo,
           CONVERT(varchar(10), sorl.PromisedDeliveryDate, 23),
           CONVERT(varchar(10), sor.PromisedDeliveryDate, 23),
           CASE WHEN sorl.PromisedDeliveryDate IS NULL THEN 'line date missing'
                WHEN sor.PromisedDeliveryDate IS NULL  THEN 'header date missing'
                WHEN sorl.PromisedDeliveryDate = sor.PromisedDeliveryDate THEN 'same'
                WHEN sorl.PromisedDeliveryDate < sor.PromisedDeliveryDate THEN 'line EARLIER than header'
                ELSE 'line LATER than header' END
    FROM       OliverHarveyLive.dbo.SOPOrderReturn     sor
    INNER JOIN OliverHarveyLive.dbo.SOPOrderReturnLine sorl ON sorl.SOPOrderReturnID = sor.SOPOrderReturnID
    WHERE sor.DocumentTypeID=0 AND sor.DocumentStatusID=0 AND sorl.LineTypeID IN (0,1)
      AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
) x
GROUP BY Company, Disagreement
ORDER BY Company, Lines DESC;
