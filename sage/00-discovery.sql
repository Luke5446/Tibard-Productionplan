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
