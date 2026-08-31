/* ============================================================================
   SPECIAL MAKES - LIVE SALES ORDER LINES        Sage 200 Professional
   Server TIB-SQL-002. Reads both companies - S200_LIVE (Tibard) and
   OliverHarveyLive - in one pass via three-part names.

   Full rationale, the schema assumptions that proved wrong, and the validation
   results are in sage/README.md. Column names below are all confirmed against
   the live database.

   Output order is FIXED - the app parses by position:
     A LineKey  B Company  C SalesOrderNo  D LineNo  E ProductCode
     F ProductDesc  G Qty  H PromisedDate  I Customer  J Category  K Manufacturer

   Filter column J to WORKS ORDER for production. Other values:
     INTERCOMPANY - no works order   already raised from the customer order
     REVIEW - no manufacturer set    fix the manufacturer in Sage
     REVIEW - code not in stock file / free text line   check by hand
   ========================================================================= */

/* ---------------------------------------------------------------- TIBARD -- */
SELECT
    /* Permanent per-line key - stops a second works order when you paste again
       later the same day. Company-prefixed: the two databases number lines
       independently, so Tibard 45678 and Oliver Harvey 45678 both exist. */
    'TIB-' + CAST(sorl.SOPOrderReturnLineID AS varchar(20))     AS LineKey,
    'TIBARD'                                                    AS Company,
    sor.DocumentNo                                              AS SalesOrderNo,
    sorl.PrintSequenceNumber                                    AS LineNo,
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
    CONVERT(varchar(10), COALESCE(sorl.PromisedDeliveryDate,
                                  sor.PromisedDeliveryDate,
                                  sorl.RequestedDeliveryDate,
                                  sor.RequestedDeliveryDate), 23) AS PromisedDate,

    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(
        ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS Customer,

    /* Inter-company first: an OH special make is made by Tibard and covered by
       an OH purchase order, which raises a second sales order here for the same
       physical job. Matched on ACCOUNT NUMBER, never name - this customer file
       also holds Harvey Nichols, Harveys Laundry, Mrs Oliver, Oliver Kay
       Produce and Oliver's Battery Countryside Group. */
    CASE
        WHEN cust.CustomerAccountNumber = 'OLIVER'   THEN 'INTERCOMPANY - no works order'
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
        sor.DocumentTypeID   = 0                  -- sales orders, not returns
    AND sor.DocumentStatusID = 0                  -- live
    AND sorl.LineTypeID IN (0, 1)                 -- product + free text
    AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
    AND ISNULL(si.AnalysisCode3,'') <> 'Yes'      -- Tibard stock-held slot
    AND (si.Code IS NULL
         OR NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
         OR si.Manufacturer LIKE '%Tibard%'
         OR si.Manufacturer LIKE '%Oliver Harvey%')

UNION ALL

/* -------------------------------------------------------- OLIVER HARVEY -- */
/* Identical, except the database, the key prefix, the company label, and
   AnalysisCode7 in place of AnalysisCode3 - the two companies were set up
   separately and use different analysis code slots. Do not tidy them to match. */
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
        WHEN cust.CustomerAccountNumber = 'TIB003'   THEN 'INTERCOMPANY - no works order'
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
    AND ISNULL(si.AnalysisCode7,'') <> 'Yes'      -- Oliver Harvey stock-held slot
    AND (si.Code IS NULL
         OR NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
         OR si.Manufacturer LIKE '%Tibard%'
         OR si.Manufacturer LIKE '%Oliver Harvey%')

ORDER BY Company, SalesOrderNo, LineNo;
