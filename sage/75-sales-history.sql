/* =========================================================================
   75-sales-history.sql  -  THE "SQL 1 GRID" FOR THE STOCK PLANNER
   -------------------------------------------------------------------------
   Server TIB-SQL-002, both companies. Every sales order line since 1 Jan
   2024, one row per line, for the stock planner's One-off orders panel
   (Tibard-Stock-Planner, importSalesHistory). The planner reads the columns
   BY NAME from the header row, so keep the names:

     OrderDate       yyyy-mm-dd
     Account         the Sage account number
     CustomerName    the account name
     StockCode       as on the order; the planner maps BULK+code to the code
     QtyOrdered
     QtyDespatched   the planner prefers this: it is what the 6-month sales
                     count
     DocType         'Order' - returns are left out here, the planner would
                     skip anything else anyway
     Company         TIBARD / OLIVER HARVEY (not read by the planner)

   Power Query, same connection as the buffer workbook (TIB-SQL-002,
   S200_LIVE), loaded to a sheet; then either save that sheet as CSV and
   Import it on the panel, or copy the grid WITH its header row into the
   paste box. Import it now and then - the panel shows the dates it covers.
   ========================================================================= */

SELECT
    CONVERT(varchar(10), sor.DocumentDate, 23)                          AS OrderDate,
    ISNULL(cust.CustomerAccountNumber,'')                               AS Account,
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))                    AS CustomerName,
    LTRIM(RTRIM(sorl.ItemCode))                                         AS StockCode,
    CAST(sorl.LineQuantity AS decimal(18,2))                            AS QtyOrdered,
    CAST(ISNULL(sorl.DespatchReceiptQuantity,0) AS decimal(18,2))       AS QtyDespatched,
    'Order'                                                             AS DocType,
    'TIBARD'                                                            AS Company
FROM        S200_LIVE.dbo.SOPOrderReturn      sor
INNER JOIN  S200_LIVE.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  S200_LIVE.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE   sor.DocumentTypeID = 0                  -- sales orders, not returns
  AND   sorl.LineTypeID    = 0                  -- product lines
  AND   sor.DocumentDate  >= '2024-01-01'

UNION ALL

SELECT
    CONVERT(varchar(10), sor.DocumentDate, 23),
    ISNULL(cust.CustomerAccountNumber,''),
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(cust.CustomerAccountName,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' '))),
    LTRIM(RTRIM(sorl.ItemCode)),
    CAST(sorl.LineQuantity AS decimal(18,2)),
    CAST(ISNULL(sorl.DespatchReceiptQuantity,0) AS decimal(18,2)),
    'Order',
    'OLIVER HARVEY'
FROM        OliverHarveyLive.dbo.SOPOrderReturn      sor
INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  OliverHarveyLive.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE   sor.DocumentTypeID = 0
  AND   sorl.LineTypeID    = 0
  AND   sor.DocumentDate  >= '2024-01-01'

ORDER BY OrderDate, Company, StockCode;
