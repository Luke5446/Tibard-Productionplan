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


/* --- 0.3  Find where "stock held = Yes" actually lives -------------------
   Only run this AFTER 0.1 - the column list below must come from 0.1's output,
   not from assumption. */
/* THIS IS THE IMPORTANT ONE. Take one product code you KNOW is a stock-held
   item you manufacture, and one you KNOW is a special make. Compare the two
   rows side by side and look for the column that differs. */
SELECT  si.Code, si.Name, si.*, pg.Code AS PG_Code, pg.Name AS PG_Name, pg.*
FROM    StockItem si
LEFT JOIN ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
WHERE   si.Code IN ('OHAPP054415',          -- known stock-held example
                    '<a known special make code>');

/* The flag is most likely ONE of:
     ProductGroup.HoldsStock        (bit)  - the Product Group "holds stock" tick
     StockItem.ItemTypeID           (int)  - 0 Stock / 1 Misc / 2 Service
     StockItem.AnalysisCode1..20    (text) - if you tag it yourself
   Once you know which, set the StockHeld expression in the main query. */


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
