/* ============================================================================
   SPECIAL MAKES - LIVE SALES ORDER LINES        Sage 200 Professional
   Feeds the "Special Makes" tab of the Production Buffer app.

   Server TIB-SQL-002. Covers BOTH companies - Tibard (S200_LIVE) and Oliver
   Harvey (OliverHarveyLive) - which sit on the same server, so one query and
   one connection reads both via three-part names.

   Every column name below was confirmed against the live database. The
   assumptions that did NOT survive contact with it, kept here so nobody
   reintroduces them:
     - SOPOrderReturnLine has no LineNumber          -> PrintSequenceNumber
     - SOPOrderReturnLine has no QuantityDespatched  -> DespatchReceiptQuantity
     - SOPOrderReturnLine has no ItemID at all, so there is no key to
       StockItem; matched on si.Code = sorl.ItemCode
     - StockItem has no ItemTypeID, ProductGroup has no Name or HoldsStock
     - Product groups are garment categories, not a stock/non-stock split

   CLASSIFICATION - validated against 22 real codes from the manual sheet,
   18 of which came back as works orders, 3 for review, and 1 correctly
   excluded as genuinely stock held:

     stock-held analysis code = 'Yes'   -> excluded, the buffer app covers it
     manufacturer is ours               -> WORKS ORDER
     manufacturer blank                 -> REVIEW, so Sage gets corrected
     manufacturer is a trade brand      -> excluded, bought in to order

   The analysis code lives in a DIFFERENT SLOT per company - they were set up
   separately. Tibard AnalysisCode3, Oliver Harvey AnalysisCode7. Do not tidy
   these to match.

   Output column order is FIXED - the app parses by position:
     A LineKey  B Company  C SalesOrderNo  D LineNo  E ProductCode
     F ProductDesc  G Qty  H PromisedDate  I Customer  J Category
     K Manufacturer
   ========================================================================= */

/* ---------------------------------------------------------------- TIBARD -- */
SELECT
    /* Permanent per-line key - this is what stops a second works order when
       you paste again later the same day. Prefixed with the company because
       the two databases number their lines independently, so Tibard line
       45678 and Oliver Harvey line 45678 both exist. */
    'TIB-' + CAST(sorl.SOPOrderReturnLineID AS varchar(20))     AS LineKey,
    'TIBARD'                                                    AS Company,
    sor.DocumentNo                                              AS SalesOrderNo,
    sorl.PrintSequenceNumber                                    AS LineNo,
    LTRIM(RTRIM(sorl.ItemCode))                                 AS ProductCode,

    /* Tabs and line breaks stripped - the app splits pasted rows on TAB, so a
       stray tab in a description would shift every column after it. */
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(sorl.ItemDescription,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS ProductDesc,

    /* Outstanding, not ordered - a part-despatched order raises a works order
       for the remainder only. */
    CAST(sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)
         AS decimal(18,2))                                      AS Qty,

    /* Text in yyyy-mm-dd on purpose. A real Excel date pasted into a browser
       arrives as a 5-digit serial number or a dd/mm-vs-mm/dd guess. */
    CONVERT(varchar(10), COALESCE(sorl.PromisedDeliveryDate,
                                  sor.PromisedDeliveryDate,
                                  sorl.RequestedDeliveryDate,
                                  sor.RequestedDeliveryDate), 23) AS PromisedDate,

    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS Customer,

    CASE
        WHEN si.Code IS NULL AND sorl.LineTypeID = 1 THEN 'REVIEW - free text line'
        WHEN si.Code IS NULL                         THEN 'REVIEW - code not in stock file'
        WHEN si.Manufacturer LIKE '%Tibard%'
          OR si.Manufacturer LIKE '%Oliver Harvey%'  THEN 'WORKS ORDER'
        ELSE                                              'REVIEW - no manufacturer set'
    END                                                         AS Category,

    LTRIM(RTRIM(ISNULL(si.Manufacturer,'')))                    AS Manufacturer

FROM        S200_LIVE.dbo.SOPOrderReturn      sor
INNER JOIN  S200_LIVE.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  S200_LIVE.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
LEFT  JOIN  S200_LIVE.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE
        sor.DocumentTypeID   = 0                      -- sales orders, not returns
    AND sor.DocumentStatusID = 0                      -- live
    AND sorl.LineTypeID IN (0, 1)                     -- product + free text; no charges/comments
    AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
    AND ISNULL(si.AnalysisCode3,'') <> 'Yes'          -- not stock held (buffer app covers those)
    AND (si.Code IS NULL                              -- keep unmatched for review
         OR NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL   -- keep blank for review
         OR si.Manufacturer LIKE '%Tibard%'
         OR si.Manufacturer LIKE '%Oliver Harvey%')   -- ours

UNION ALL

/* -------------------------------------------------------- OLIVER HARVEY -- */
/* Identical, except the database, the key prefix, the company label, and
   AnalysisCode7 in place of AnalysisCode3. */
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
    CONVERT(varchar(10), COALESCE(sorl.PromisedDeliveryDate,
                                  sor.PromisedDeliveryDate,
                                  sorl.RequestedDeliveryDate,
                                  sor.RequestedDeliveryDate), 23),
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' '))),
    CASE
        WHEN si.Code IS NULL AND sorl.LineTypeID = 1 THEN 'REVIEW - free text line'
        WHEN si.Code IS NULL                         THEN 'REVIEW - code not in stock file'
        WHEN si.Manufacturer LIKE '%Tibard%'
          OR si.Manufacturer LIKE '%Oliver Harvey%'  THEN 'WORKS ORDER'
        ELSE                                              'REVIEW - no manufacturer set'
    END,
    LTRIM(RTRIM(ISNULL(si.Manufacturer,'')))

FROM        OliverHarveyLive.dbo.SOPOrderReturn      sor
INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  OliverHarveyLive.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
LEFT  JOIN  OliverHarveyLive.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE
        sor.DocumentTypeID   = 0
    AND sor.DocumentStatusID = 0
    AND sorl.LineTypeID IN (0, 1)
    AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
    AND ISNULL(si.AnalysisCode7,'') <> 'Yes'
    AND (si.Code IS NULL
         OR NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
         OR si.Manufacturer LIKE '%Tibard%'
         OR si.Manufacturer LIKE '%Oliver Harvey%')

ORDER BY Company, SalesOrderNo, LineNo;
