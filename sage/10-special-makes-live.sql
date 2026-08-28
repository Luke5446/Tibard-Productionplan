/* ============================================================================
   SPECIAL MAKES - LIVE SALES ORDER LINES  (Sage 200 Professional)
   Feeds the "Special Makes" tab of the Production Buffer app.

   Covers BOTH companies - Tibard (S200_LIVE) and Oliver Harvey
   (OliverHarveyLive) - which sit on the same server, TIB-SQL-002, so one
   query can read both via three-part names and UNION them together.

   Returns EVERY outstanding live sales order line, with a StockHeld flag,
   so nothing is hidden. Production filter the sheet to StockHeld = "NO"
   and copy the visible rows.

   BEFORE USING: run 00-discovery.sql and correct the marked spots. Note the
   >> CHECK 2 << stock-held test appears TWICE, once per company - they must
   match. (This duplication is the main argument for promoting the query to a
   SQL view later; see README section 2.8.)

   Output column order is FIXED - the app parses by position:
     A LineKey  B Company  C SalesOrderNo  D LineNo  E ProductCode
     F ProductDesc  G Qty  H PromisedDate  I Customer  J StockHeld
   ========================================================================= */

/* ---------------------------------------------------------------- TIBARD -- */
SELECT
    /* A - Unique, permanent key for this order LINE. This is what stops the
           app raising a second works order when you paste again later in the
           day. Prefixed with the company because the two databases number
           their lines independently - Tibard line 45678 and Oliver Harvey
           line 45678 both exist, and without the prefix an Oliver Harvey
           order would be silently treated as already done. */
    'TIB-' + CAST(sorl.SOPOrderReturnLineID AS varchar(20))     AS LineKey,

    /* B - Which company the order belongs to. Also needs to appear on the
           works order reference, as the two companies' sales order numbers
           overlap (e.g. "OH-SO12345 Pt 1"). */
    'TIBARD'                                                    AS Company,

    /* C - The sales order number the office keyed. */
    sor.DocumentNo                                              AS SalesOrderNo,

    /* D - Line position on the order. Drives Pt 1 / Pt 2 ordering. */
    sorl.LineNumber                                             AS LineNo,

    /* E/F - Code and description. Tabs and line breaks are stripped because
             the app splits pasted rows on TAB - a stray tab inside a
             description would shift every column after it. */
    LTRIM(RTRIM(sorl.ItemCode))                                 AS ProductCode,
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(sorl.ItemDescription,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS ProductDesc,

    /* G - Quantity still to make (ordered less already despatched), so a
           part-despatched order doesn't get a works order for the full qty. */
    CAST(sorl.LineQuantity - ISNULL(sorl.QuantityDespatched,0)
         AS decimal(18,2))                                      AS Qty,

    /* H - Promised date as TEXT in yyyy-mm-dd. Deliberate: pasting a real
           Excel date into a browser gives you either a 5-digit serial number
           or a US/UK ambiguous string. Text in ISO order can't be misread. */
    CONVERT(varchar(10), COALESCE(sorl.PromisedDeliveryDate,
                                  sor.PromisedDeliveryDate,
                                  sorl.RequestedDeliveryDate,
                                  sor.RequestedDeliveryDate), 23) AS PromisedDate,

    /* I - Customer name, so production know whose job it is without lookup. */
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS Customer,

    /* J - >> CHECK 2 <<  Stock-held flag.
           Swap the tested column for whichever one 00-discovery.sql showed
           actually differs between a stock item and a special make.
           FREE-TEXT means the line has no product record at all.
           KEEP THIS IDENTICAL TO THE OLIVER HARVEY BLOCK BELOW. */
    CASE
        WHEN sorl.LineTypeID = 1     THEN 'FREE-TEXT'
        WHEN si.ItemID IS NULL       THEN 'FREE-TEXT'
        WHEN pg.HoldsStock = 1       THEN 'YES'
        ELSE 'NO'
    END                                                         AS StockHeld

FROM        S200_LIVE.dbo.SOPOrderReturn      sor
INNER JOIN  S200_LIVE.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  S200_LIVE.dbo.StockItem           si   ON si.ItemID                = sorl.ItemID
LEFT  JOIN  S200_LIVE.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
LEFT  JOIN  S200_LIVE.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE
        sor.DocumentTypeID = 0            -- Sales Orders only, not returns
    AND sor.DocumentStatusID = 0          -- >> CHECK 1 << "Live" per 00-discovery.sql
    AND sorl.LineTypeID IN (0, 1)         -- product + free text; excludes charges/comments
    AND (sorl.LineQuantity - ISNULL(sorl.QuantityDespatched,0)) > 0   -- still outstanding

UNION ALL

/* -------------------------------------------------------- OLIVER HARVEY -- */
/* Identical to the block above. Only the database prefix, the LineKey prefix
   and the Company label differ. Any change made above must be made here too. */
SELECT
    'OH-' + CAST(sorl.SOPOrderReturnLineID AS varchar(20))      AS LineKey,
    'OLIVER HARVEY'                                             AS Company,
    sor.DocumentNo                                              AS SalesOrderNo,
    sorl.LineNumber                                             AS LineNo,
    LTRIM(RTRIM(sorl.ItemCode))                                 AS ProductCode,
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(sorl.ItemDescription,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS ProductDesc,
    CAST(sorl.LineQuantity - ISNULL(sorl.QuantityDespatched,0)
         AS decimal(18,2))                                      AS Qty,
    CONVERT(varchar(10), COALESCE(sorl.PromisedDeliveryDate,
                                  sor.PromisedDeliveryDate,
                                  sorl.RequestedDeliveryDate,
                                  sor.RequestedDeliveryDate), 23) AS PromisedDate,
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS Customer,
    CASE                                  -- >> CHECK 2 << keep matching Tibard
        WHEN sorl.LineTypeID = 1     THEN 'FREE-TEXT'
        WHEN si.ItemID IS NULL       THEN 'FREE-TEXT'
        WHEN pg.HoldsStock = 1       THEN 'YES'
        ELSE 'NO'
    END                                                         AS StockHeld

FROM        OliverHarveyLive.dbo.SOPOrderReturn      sor
INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  OliverHarveyLive.dbo.StockItem           si   ON si.ItemID                = sorl.ItemID
LEFT  JOIN  OliverHarveyLive.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
LEFT  JOIN  OliverHarveyLive.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE
        sor.DocumentTypeID = 0
    AND sor.DocumentStatusID = 0          -- >> CHECK 1 <<
    AND sorl.LineTypeID IN (0, 1)
    AND (sorl.LineQuantity - ISNULL(sorl.QuantityDespatched,0)) > 0

ORDER BY Company, SalesOrderNo, LineNo;
