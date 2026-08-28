/* ============================================================================
   SPECIAL MAKES - LIVE SALES ORDER LINES  (Sage 200 Professional)
   Feeds the "Special Makes" tab of the Production Buffer app.

   Returns EVERY outstanding live sales order line, with a StockHeld flag,
   so nothing is hidden. Production filter the sheet to StockHeld = "NO"
   and copy the visible rows.

   BEFORE USING: run 00-discovery.sql and correct the two marked spots
   ( >> CHECK 1 << status number,  >> CHECK 2 << stock-held flag ).

   Output column order is FIXED - the app parses by position:
     A LineID  B SalesOrderNo  C LineNo  D ProductCode  E ProductDesc
     F Qty     G PromisedDate  H Customer  I StockHeld
   ========================================================================= */

SELECT
    /* A - Unique, permanent key for this order LINE. This is what stops the
           app raising a second works order when you paste again later in the
           day. Sage never reuses this value. Do not drop this column. */
    sorl.SOPOrderReturnLineID                               AS LineID,

    /* B - The sales order number the office keyed. */
    sor.DocumentNo                                          AS SalesOrderNo,

    /* C - Line position on the order. Drives Pt 1 / Pt 2 / Pt 3 ordering. */
    sorl.LineNumber                                         AS LineNo,

    /* D/E - Code and description. Tabs and line breaks are stripped because
             the app splits pasted rows on TAB - a stray tab inside a
             description would shift every column after it. */
    LTRIM(RTRIM(sorl.ItemCode))                             AS ProductCode,
    LTRIM(RTRIM(
        REPLACE(REPLACE(REPLACE(
            ISNULL(sorl.ItemDescription,''),
            CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')
    ))                                                      AS ProductDesc,

    /* F - Quantity still to make (ordered less already despatched), so a
           part-despatched order doesn't get a works order for the full qty. */
    CAST(sorl.LineQuantity - ISNULL(sorl.QuantityDespatched,0)
         AS decimal(18,2))                                  AS Qty,

    /* G - Promised date as TEXT in yyyy-mm-dd. Deliberate: pasting a real
           Excel date into a browser gives you either a 5-digit serial number
           or a US/UK ambiguous string. Text in ISO order can't be misread.
           Falls back down the chain if the line has no promised date. */
    CONVERT(varchar(10), COALESCE(sorl.PromisedDeliveryDate,
                                  sor.PromisedDeliveryDate,
                                  sorl.RequestedDeliveryDate,
                                  sor.RequestedDeliveryDate), 23)
                                                            AS PromisedDate,

    /* H - Customer name, so production know whose job it is without lookup. */
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))        AS Customer,

    /* I - >> CHECK 2 <<  Stock-held flag.
           Swap the tested column for whichever one 00-discovery.sql showed
           actually differs between a stock item and a special make.
           FREE-TEXT means the line has no product record at all. */
    CASE
        WHEN sorl.LineTypeID = 1     THEN 'FREE-TEXT'
        WHEN si.ItemID IS NULL       THEN 'FREE-TEXT'
        WHEN pg.HoldsStock = 1       THEN 'YES'
        ELSE 'NO'
    END                                                     AS StockHeld

FROM        SOPOrderReturn      sor
INNER JOIN  SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  StockItem           si   ON si.ItemID                = sorl.ItemID
LEFT  JOIN  ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
LEFT  JOIN  SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID

WHERE
        sor.DocumentTypeID = 0            -- Sales Orders only, not returns
    AND sor.DocumentStatusID = 0          -- >> CHECK 1 << "Live" per 00-discovery.sql
    AND sorl.LineTypeID IN (0, 1)         -- product + free text; excludes charges/comments
    AND (sorl.LineQuantity - ISNULL(sorl.QuantityDespatched,0)) > 0   -- still outstanding

ORDER BY
    sor.DocumentNo,
    sorl.LineNumber;
