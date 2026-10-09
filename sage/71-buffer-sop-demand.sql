/* =========================================================================
   71-buffer-sop-demand.sql  -  THE SALES ORDERS BEHIND "ON SOP"
   -------------------------------------------------------------------------
   Server TIB-SQL-002, both companies. One row per LIVE sales order line for
   a stock-held code (the same row set as 70-buffer-live.sql: stock held,
   made here, not the NHSP range - 757 codes), so the planner
   can say which orders a works order is covering: the sales order number,
   the customer and the promised date go on the works order when it is raised
   against demand, instead of one total in the On SOP column.

   Second sheet of the same workbook (see sage/README.md). Copy columns A to
   L, all rows, without the header, into the planner's SOP demand box.

   Output order is FIXED - the app parses by position:
     A LineKey        TIB- / OH- prefix + Sage's permanent line id (dedupe key)
     B Company        TIBARD or OLIVER HARVEY
     C SalesOrderNo
     D ProductCode
     E Qty            outstanding: ordered less despatched
     F PromisedDate   yyyy-mm-dd; the ORDER's promised date first, then the
                      line's, then requested - the order the sales office
                      keeps up to date (see 10-special-makes-live.sql)
     G OrderDate      yyyy-mm-dd, when the order was raised
     H CustomerName   resolved as the special makes sheet does: the account,
                      or the customer's own reference on a proforma / online
                      account
     I CustomerOrderNo  the customer's reference as typed
     J Account        the Sage account number
     K Intercompany   Y when the order is the other company's (Tibard's
                      OLIVER account, OH's TIB003): the same job seen twice
     L LineSeq        the line's position on the order
   ========================================================================= */

WITH custs AS (
    SELECT  LTRIM(RTRIM(Code)) AS Code, MAX([Customer(s)]) AS Customers
    FROM    S200_LIVE.dbo.bm_LiveStockItems_NoBulk
    GROUP BY LTRIM(RTRIM(Code))
),
/* the same row set as 70-buffer-live.sql: stock held, made here, not NHSP */
stockheld AS (
    SELECT  LTRIM(RTRIM(si.Code)) AS Code
    FROM    S200_LIVE.dbo.StockItem si
    LEFT JOIN custs cu ON cu.Code = LTRIM(RTRIM(si.Code))
    WHERE   ISNULL(si.AnalysisCode3,'') = 'Yes' AND si.Code NOT LIKE 'BULK%'
      AND   LTRIM(RTRIM(ISNULL(si.Manufacturer,''))) IN ('Tibard','Oliver Harvey','Urban Textiles/Tibard','MPLG')
      AND   LTRIM(RTRIM(ISNULL(cu.Customers,''))) <> 'NHSP'
)
SELECT
    'TIB-' + CAST(sorl.SOPOrderReturnLineID AS varchar(20))             AS LineKey,
    'TIBARD'                                                            AS Company,
    sor.DocumentNo                                                      AS SalesOrderNo,
    LTRIM(RTRIM(sorl.ItemCode))                                         AS ProductCode,
    CAST(sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0) AS int) AS Qty,
    CONVERT(varchar(10), COALESCE(sor.PromisedDeliveryDate, sorl.PromisedDeliveryDate,
                                  sor.RequestedDeliveryDate, sorl.RequestedDeliveryDate), 23) AS PromisedDate,
    CONVERT(varchar(10), sor.DocumentDate, 23)                          AS OrderDate,
    CASE WHEN cust.CustomerAccountNumber IN ('PROFORMA','PROFEURO','XONLINE')
              AND NULLIF(LTRIM(RTRIM(sor.CustomerDocumentNo)),'') IS NOT NULL
         THEN LTRIM(RTRIM(CASE WHEN LTRIM(sor.CustomerDocumentNo) LIKE 'EMB:%' THEN SUBSTRING(LTRIM(sor.CustomerDocumentNo),5,200)
                               WHEN LTRIM(sor.CustomerDocumentNo) LIKE 'DTF:%' THEN SUBSTRING(LTRIM(sor.CustomerDocumentNo),5,200)
                               ELSE LTRIM(sor.CustomerDocumentNo) END))
         ELSE LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(cust.CustomerAccountName,''), CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))
    END                                                                 AS CustomerName,
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(sor.CustomerDocumentNo,''), CHAR(9),' '), CHAR(13),' '), CHAR(10),' '))) AS CustomerOrderNo,
    ISNULL(cust.CustomerAccountNumber,'')                               AS Account,
    CASE WHEN cust.CustomerAccountNumber = 'OLIVER' THEN 'Y' ELSE 'N' END AS Intercompany,
    sorl.PrintSequenceNumber                                            AS LineSeq
FROM        S200_LIVE.dbo.SOPOrderReturn      sor
INNER JOIN  S200_LIVE.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
INNER JOIN  stockheld                         sh   ON sh.Code                  = LTRIM(RTRIM(sorl.ItemCode))
LEFT  JOIN  S200_LIVE.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE   sor.DocumentTypeID = 0 AND sor.DocumentStatusID = 0 AND sorl.LineTypeID = 0
  AND  (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0

UNION ALL

SELECT
    'OH-' + CAST(sorl.SOPOrderReturnLineID AS varchar(20)),
    'OLIVER HARVEY',
    sor.DocumentNo,
    LTRIM(RTRIM(sorl.ItemCode)),
    CAST(sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0) AS int),
    CONVERT(varchar(10), COALESCE(sor.PromisedDeliveryDate, sorl.PromisedDeliveryDate,
                                  sor.RequestedDeliveryDate, sorl.RequestedDeliveryDate), 23),
    CONVERT(varchar(10), sor.DocumentDate, 23),
    CASE WHEN cust.CustomerAccountNumber IN ('PROFORMA','PROFEURO','XONLINE')
              AND NULLIF(LTRIM(RTRIM(sor.CustomerDocumentNo)),'') IS NOT NULL
         THEN LTRIM(RTRIM(CASE WHEN LTRIM(sor.CustomerDocumentNo) LIKE 'EMB:%' THEN SUBSTRING(LTRIM(sor.CustomerDocumentNo),5,200)
                               WHEN LTRIM(sor.CustomerDocumentNo) LIKE 'DTF:%' THEN SUBSTRING(LTRIM(sor.CustomerDocumentNo),5,200)
                               ELSE LTRIM(sor.CustomerDocumentNo) END))
         ELSE LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(cust.CustomerAccountName,''), CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))
    END,
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(sor.CustomerDocumentNo,''), CHAR(9),' '), CHAR(13),' '), CHAR(10),' '))),
    ISNULL(cust.CustomerAccountNumber,''),
    CASE WHEN cust.CustomerAccountNumber = 'TIB003' THEN 'Y' ELSE 'N' END,
    sorl.PrintSequenceNumber
FROM        OliverHarveyLive.dbo.SOPOrderReturn      sor
INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
INNER JOIN  stockheld                                sh   ON sh.Code                  = LTRIM(RTRIM(sorl.ItemCode))
LEFT  JOIN  OliverHarveyLive.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE   sor.DocumentTypeID = 0 AND sor.DocumentStatusID = 0 AND sorl.LineTypeID = 0
  AND  (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0

ORDER BY ProductCode, PromisedDate, Company, SalesOrderNo, LineSeq;
