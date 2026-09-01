/* ============================================================================
   SPECIAL MAKES - LIVE SALES ORDER LINES        Sage 200 Professional
   Server TIB-SQL-002. Reads both companies - S200_LIVE (Tibard) and
   OliverHarveyLive - in one pass via three-part names.

   Full rationale, the schema assumptions that proved wrong, and the validation
   results are in sage/README.md. Column names are all confirmed against the
   live database.

   NO FILTERING NEEDED. Copy columns A to K, all rows, without the header.
   Everything returned is relevant:

     WORKS ORDER                     make it
     REVIEW - ...                    needs a human decision
     NOTE - ...                      logo/charge detail for an order above
     INTERCOMPANY - no works order   kept only so the count stays visible

   Stock-held items and bought-in goods are dropped here, so they never reach
   the sheet at all.

   *** DO NOT FILTER ON MANUFACTURER (column K). *** Logo and charge lines have
   no manufacturer of their own, so filtering on it silently removes the very
   detail production need. That is why this query decides which notes matter
   rather than leaving it to a filter: a NOTE line is returned only when its
   sales order also has a line needing a works order or a decision. Notes for
   orders that are entirely bought-in never appear.

   Output order is FIXED - the app parses by position:
     A LineKey  B Company  C SalesOrderNo  D LineSeq  E ProductCode
     F ProductDesc  G Qty  H PromisedDate  I Customer  J Category  K Manufacturer
   ========================================================================= */

WITH lines AS (

/* ---------------------------------------------------------------- TIBARD -- */
SELECT
    /* Permanent per-line key - the app's duplicate guard. Company-prefixed
       because the two databases number their lines independently, so Tibard
       45678 and Oliver Harvey 45678 both exist. */
    'TIB-' + CAST(sorl.SOPOrderReturnLineID AS varchar(20))     AS LineKey,
    'TIBARD'                                                    AS Company,
    sor.DocumentNo                                              AS SalesOrderNo,
    sorl.PrintSequenceNumber                                    AS LineSeq,
    LTRIM(RTRIM(sorl.ItemCode))                                 AS ProductCode,

    /* Tabs and line breaks stripped - the app splits pasted rows on TAB. */
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(sorl.ItemDescription,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS ProductDesc,

    /* Outstanding, not ordered - part-despatched orders make the balance. */
    CAST(sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)
         AS decimal(18,2))                                      AS Qty,

    /* Text in yyyy-mm-dd. A real Excel date pasted into a browser arrives as a
       5-digit serial or a dd/mm-vs-mm/dd guess. */
    /* ORDER-LEVEL promised date first, then the line's. Deliberately this way
       round: amending an order's promised date in Sage updates the header, and
       the sales office only reliably updates the header - lines keep whatever
       they were raised with. Preferring the line meant order 114816 read
       2026-08-05 while Sage showed 11/09/2026, and the sheet flagged it
       Overdue on a date nobody had promised. */
    CONVERT(varchar(10), COALESCE(sor.PromisedDeliveryDate,
                                  sorl.PromisedDeliveryDate,
                                  sor.RequestedDeliveryDate,
                                  sorl.RequestedDeliveryDate), 23) AS PromisedDate,

    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS Customer,

    /* Order matters. Inter-company first: an OH special make is made by Tibard
       and covered by an OH purchase order, raising a second sales order here
       for the same physical job. Matched on ACCOUNT NUMBER, never name - this
       customer file also holds Harvey Nichols, Harveys Laundry, Mrs Oliver,
       Oliver Kay Produce and Oliver's Battery Countryside Group.
       Notes next, so a logo line is never mistaken for a garment.
       Product group 54 is "Additional Charges" - LOGOAPPLICATION,
       LOGOORIGINATION, TEXTAPPLICATION, HANDLINGCHARGE. Classified by GROUP so
       service codes added later inherit the behaviour. */
    CASE
        WHEN cust.CustomerAccountNumber = 'OLIVER'   THEN 'INTERCOMPANY - no works order'
        WHEN sorl.LineTypeID = 1                     THEN 'NOTE - free text'
        WHEN pg.Code = '54'                          THEN 'NOTE - charge or logo line'
        WHEN ISNULL(si.AnalysisCode3,'') = 'Yes'     THEN 'STOCK HELD'
        WHEN sorl.ItemCode = 'FREETEXT'              THEN 'REVIEW - FREETEXT placeholder'
        WHEN si.Code IS NULL                         THEN 'REVIEW - code not in stock file'
        WHEN si.Manufacturer LIKE '%Tibard%'
          OR si.Manufacturer LIKE '%Oliver Harvey%'  THEN 'WORKS ORDER'
        WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
                                                     THEN 'REVIEW - no manufacturer set'
        ELSE                                              'BOUGHT IN'
    END                                                         AS Category,

    LTRIM(RTRIM(ISNULL(si.Manufacturer,'')))                    AS Manufacturer

FROM        S200_LIVE.dbo.SOPOrderReturn      sor
INNER JOIN  S200_LIVE.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  S200_LIVE.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
LEFT  JOIN  S200_LIVE.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
LEFT  JOIN  S200_LIVE.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE
        sor.DocumentTypeID   = 0                  -- sales orders, not returns
    AND sor.DocumentStatusID = 0                  -- live
    AND sorl.LineTypeID IN (0, 1)                 -- product + free text
    AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0

UNION ALL

/* -------------------------------------------------------- OLIVER HARVEY -- */
/* Identical, except the database, the key prefix, the company label, the
   inter-company account, and AnalysisCode7 in place of AnalysisCode3 - the two
   companies were set up separately and use different analysis code slots.
   Do not tidy them to match. */
SELECT
    'OH-' + CAST(sorl.SOPOrderReturnLineID AS varchar(20)),
    'OLIVER HARVEY',
    sor.DocumentNo,
    sorl.PrintSequenceNumber,
    LTRIM(RTRIM(sorl.ItemCode)),
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(sorl.ItemDescription,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' '))),
    CAST(sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0) AS decimal(18,2)),
    CONVERT(varchar(10), COALESCE(sor.PromisedDeliveryDate,   -- header first, see Tibard block
                                  sorl.PromisedDeliveryDate,
                                  sor.RequestedDeliveryDate,
                                  sorl.RequestedDeliveryDate), 23),
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' '))),
    CASE
        WHEN cust.CustomerAccountNumber = 'TIB003'   THEN 'INTERCOMPANY - no works order'
        WHEN sorl.LineTypeID = 1                     THEN 'NOTE - free text'
        WHEN pg.Code = '54'                          THEN 'NOTE - charge or logo line'
        WHEN ISNULL(si.AnalysisCode7,'') = 'Yes'     THEN 'STOCK HELD'
        WHEN sorl.ItemCode = 'FREETEXT'              THEN 'REVIEW - FREETEXT placeholder'
        WHEN si.Code IS NULL                         THEN 'REVIEW - code not in stock file'
        WHEN si.Manufacturer LIKE '%Tibard%'
          OR si.Manufacturer LIKE '%Oliver Harvey%'  THEN 'WORKS ORDER'
        WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
                                                     THEN 'REVIEW - no manufacturer set'
        ELSE                                              'BOUGHT IN'
    END,
    LTRIM(RTRIM(ISNULL(si.Manufacturer,'')))

FROM        OliverHarveyLive.dbo.SOPOrderReturn      sor
INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  OliverHarveyLive.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
LEFT  JOIN  OliverHarveyLive.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
LEFT  JOIN  OliverHarveyLive.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE
        sor.DocumentTypeID   = 0
    AND sor.DocumentStatusID = 0
    AND sorl.LineTypeID IN (0, 1)
    AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
)

SELECT LineKey, Company, SalesOrderNo, LineSeq, ProductCode, ProductDesc,
       Qty, PromisedDate, Customer, Category, Manufacturer
FROM   lines l
WHERE
    /* Anything needing a works order or a decision, plus the inter-company
       lines so their count stays visible in the app. */
        (l.Category = 'WORKS ORDER' OR l.Category LIKE 'REVIEW%'
         OR l.Category LIKE 'INTERCOMPANY%')

    /* ...and a note only when its own sales order carries a line needing a
       works order or a decision. This is what stops logo detail going missing
       when the sheet is filtered, and stops notes arriving for orders that are
       entirely bought-in. */
    OR (l.Category LIKE 'NOTE%'
        AND EXISTS (SELECT 1 FROM lines x
                    WHERE  x.Company      = l.Company
                      AND  x.SalesOrderNo = l.SalesOrderNo
                      AND (x.Category = 'WORKS ORDER' OR x.Category LIKE 'REVIEW%')))

ORDER BY Company, SalesOrderNo, LineSeq;
