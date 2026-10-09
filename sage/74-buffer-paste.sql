/* =========================================================================
   74-buffer-paste.sql  -  BOTH SHEETS AS ONE, for a single copy and paste
   -------------------------------------------------------------------------
   Luke, 9 Oct 2026: one tab, so the PM copies one page. This is 70 and 71
   in one result: the buffer rows first (28 columns, as 70 lays them out),
   then every live sales order line underneath in columns A to L (as 71 lays
   them out) with M to AB blank. The planner tells the two apart by the first
   cell - a TIB- / OH- line key is a sales order line - so the whole table,
   A to AB without the header, goes into the one paste box.

   Everything is text here (a UNION needs one type per column); the planner
   reads numbers out of text anyway. Buffer and SOPDemand (70 and 71) stay in
   the workbook for reading with proper numbers; this is the one to copy.

   The row set and every figure are exactly 70's and 71's: the CTEs below are
   70's, and the demand half is 71's SELECT joined to the same items.
   ========================================================================= */

WITH
/* ---------------------------------------------------------- the row set -- */
/* the old Query1's view: one row per code, with the "Customer(s)" value */
custs AS (
    SELECT  LTRIM(RTRIM(Code)) AS Code, MAX([Customer(s)]) AS Customers
    FROM    S200_LIVE.dbo.bm_LiveStockItems_NoBulk
    GROUP BY LTRIM(RTRIM(Code))
),
items AS (
    SELECT  si.ItemID, LTRIM(RTRIM(si.Code)) AS Code, si.Name, si.ProductGroupID,
            si.Manufacturer, cu.Customers
    FROM    S200_LIVE.dbo.StockItem si
    LEFT JOIN custs cu ON cu.Code = LTRIM(RTRIM(si.Code))
    WHERE   ISNULL(si.AnalysisCode3,'') = 'Yes'       -- Tibard's "Stock Held"
      AND   si.Code NOT LIKE 'BULK%'                  -- container stock of a garment, never made here
      /* the old sheet's two filters: made here, and not the NHSP range */
      AND   LTRIM(RTRIM(ISNULL(si.Manufacturer,''))) IN ('Tibard','Oliver Harvey','Urban Textiles/Tibard','MPLG')
      AND   LTRIM(RTRIM(ISNULL(cu.Customers,''))) <> 'NHSP'
),
/* --------------------------------------------------- Tibard warehouses -- */
tib_wh AS (
    SELECT  wi.ItemID,
            SUM(CASE WHEN w.Name = 'HOME'           THEN wi.ConfirmedQtyInStock ELSE 0 END) AS StockHome,
            SUM(CASE WHEN w.Name LIKE '%BULK%'      THEN wi.ConfirmedQtyInStock ELSE 0 END) AS StockBulk,
            SUM(CASE WHEN w.Name <> 'HOME'
                      AND w.Name NOT LIKE '%BULK%'  THEN wi.ConfirmedQtyInStock ELSE 0 END) AS StockOther,
            SUM(CASE WHEN w.Name NOT LIKE '%BULK%'  THEN ISNULL(wi.QuantityOnPOPOrder,0) ELSE 0 END) AS OnPOP,
            SUM(CASE WHEN w.Name LIKE '%BULK%'      THEN ISNULL(wi.QuantityOnPOPOrder,0) ELSE 0 END) AS OnPOPBulk,
            MAX(CASE WHEN w.Name = 'HOME'           THEN wi.MinimumLevel END)                 AS MinLevel
    FROM    S200_LIVE.dbo.WarehouseItem wi
    JOIN    S200_LIVE.dbo.Warehouse     w ON w.WarehouseID = wi.WarehouseID
    GROUP BY wi.ItemID
),
/* -------------------------------------------- Oliver Harvey, same code -- */
oh AS (
    SELECT  LTRIM(RTRIM(si.Code)) AS Code,
            SUM(wi.ConfirmedQtyInStock)               AS StockOH,
            SUM(ISNULL(wi.QuantityOnPOPOrder,0))      AS OnPOPOH,
            MAX(CASE WHEN ISNULL(si.AnalysisCode3,'') = 'Yes'
                       OR ISNULL(si.AnalysisCode7,'') = 'Yes' THEN 'Y' ELSE 'N' END) AS StockHeldOH
    FROM    OliverHarveyLive.dbo.StockItem     si
    LEFT JOIN OliverHarveyLive.dbo.WarehouseItem wi ON wi.ItemID = si.ItemID
    GROUP BY LTRIM(RTRIM(si.Code))
),
/* --------------------------------- outstanding on live sales orders -- */
sop_tib AS (
    SELECT  LTRIM(RTRIM(sorl.ItemCode)) AS Code,
            SUM(sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) AS OnSOP
    FROM    S200_LIVE.dbo.SOPOrderReturn     sor
    JOIN    S200_LIVE.dbo.SOPOrderReturnLine sorl ON sorl.SOPOrderReturnID = sor.SOPOrderReturnID
    WHERE   sor.DocumentTypeID = 0 AND sor.DocumentStatusID = 0 AND sorl.LineTypeID = 0
      AND  (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
    GROUP BY LTRIM(RTRIM(sorl.ItemCode))
),
sop_oh AS (
    SELECT  LTRIM(RTRIM(sorl.ItemCode)) AS Code,
            SUM(sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) AS OnSOP
    FROM    OliverHarveyLive.dbo.SOPOrderReturn     sor
    JOIN    OliverHarveyLive.dbo.SOPOrderReturnLine sorl ON sorl.SOPOrderReturnID = sor.SOPOrderReturnID
    WHERE   sor.DocumentTypeID = 0 AND sor.DocumentStatusID = 0 AND sorl.LineTypeID = 0
      AND  (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
    GROUP BY LTRIM(RTRIM(sorl.ItemCode))
),
/* ------------------------------------------- sales, the existing views -- */
sales AS (
    SELECT  Code, SUM(S3) AS S3, SUM(S6) AS S6, SUM(S12) AS S12
    FROM (
        SELECT LTRIM(RTRIM(ItemCode)) AS Code, ISNULL([3MSales],0) AS S3, ISNULL([6MSales],0) AS S6, ISNULL([12MSales],0) AS S12
        FROM   S200_LIVE.dbo.bm_Tib_Sales_12_6_3_Grouped
        UNION ALL
        SELECT LTRIM(RTRIM(ItemCode)), ISNULL([3MSales],0), ISNULL([6MSales],0), ISNULL([12MSales],0)
        FROM   OliverHarveyLive.dbo.bm_OH_Sales_Grouped
    ) s
    GROUP BY Code
),
/* ------------------------------------------------ preferred supplier -- */
supplier AS (
    SELECT  s.ItemID, s.SupplierAccountNumber, s.SupplierAccountName, s.LeadTime
    FROM (
        SELECT  sis.ItemID, pl.SupplierAccountNumber, pl.SupplierAccountName, sis.LeadTime,
                ROW_NUMBER() OVER (PARTITION BY sis.ItemID
                                   ORDER BY sis.Preferred DESC, sis.DateLastOrder DESC) AS rn
        FROM    S200_LIVE.dbo.StockItemSupplier sis
        JOIN    S200_LIVE.dbo.PLSupplierAccount pl ON pl.PLSupplierAccountID = sis.SupplierID
    ) s
    WHERE   s.rn = 1
),
/* ------------------------------------------------- search categories -- */
/* "Exclude From Auto B2B PO" is category 58146085 (the old Query5). */
excl AS (
    SELECT  cv.ItemID, MAX(sv.Name) AS ExcludeAutoPO
    FROM    S200_LIVE.dbo.StockItemSearchCatVal cv
    JOIN    S200_LIVE.dbo.SearchValue sv ON sv.SearchValueID = cv.SearchValueID
    WHERE   cv.SearchCategoryID = 58146085
    GROUP BY cv.ItemID
),
/* ------------------------------------------------ the Clockwork list -- */
cwlist AS (   -- not "bulk": BULK is a reserved word in T-SQL and the query failed on it (9 Oct 2026)
    SELECT DISTINCT LTRIM(RTRIM(Code)) AS Code
    FROM   S200_LIVE.dbo.eve_AllLiveSOPPOPStockBULK
),
/* ------------------------------------------------- date of last sale -- */
dols AS (
    SELECT LTRIM(RTRIM(Code)) AS Code, MAX(DateOfLastSale) AS DateOfLastSale
    FROM   S200_LIVE.dbo.bm_HOME_MinimumLevel
    GROUP BY LTRIM(RTRIM(Code))
)
,
/* ------------------------------------------------------- the buffer rows -- */
buffer AS (
SELECT
    i.Code                                                              AS StockCode,       -- A
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(i.Name,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))                    AS Name,            -- B
    CAST(ISNULL(tw.StockHome,0) + ISNULL(tw.StockOther,0)
         + ISNULL(o.StockOH,0)                   AS int)                AS InStock,         -- C
    CAST(ISNULL(st.OnSOP,0) + ISNULL(so.OnSOP,0) AS int)                AS OnSOP,           -- D
    CAST(ISNULL(tw.OnPOP,0) + ISNULL(o.OnPOPOH,0) AS int)               AS OnPOP,           -- E
    CAST(ROUND(ISNULL(sa.S3,0) / 3.0, 0)         AS int)                AS Sales1M,         -- F
    CAST(ISNULL(sa.S3,0)                         AS int)                AS Sales3M,         -- G
    CAST(ISNULL(sa.S6,0)                         AS int)                AS Sales6M,         -- H
    CAST(ISNULL(sa.S12,0)                        AS int)                AS Sales12M,        -- I
    LTRIM(RTRIM(ISNULL(pg.Description,'')))                             AS Category,        -- J
    LTRIM(RTRIM(ISNULL(i.Manufacturer,'')))                             AS Manufacturer,    -- K
    ISNULL(sp.SupplierAccountNumber,'')                                 AS SupplierAcct,    -- L
    LTRIM(RTRIM(ISNULL(sp.SupplierAccountName,'')))                     AS SupplierName,    -- M
    CASE WHEN bk.Code IS NOT NULL THEN 'Y' ELSE 'N' END                AS ClockworkMade,   -- N
    CAST(ISNULL(sp.LeadTime,0)                   AS int)                AS LeadDays,        -- O
    CAST(ISNULL(tw.MinLevel,0)                   AS int)                AS MinLevel,        -- P
    CAST(ISNULL(tw.StockHome,0)                  AS int)                AS StockHome,       -- Q
    CAST(ISNULL(tw.StockOther,0)                 AS int)                AS StockOther,      -- R
    CAST(ISNULL(tw.StockBulk,0)                  AS int)                AS StockBulk,       -- S
    CAST(ISNULL(o.StockOH,0)                     AS int)                AS StockOH,         -- T
    CAST(ISNULL(st.OnSOP,0)                      AS int)                AS OnSOPTib,        -- U
    CAST(ISNULL(so.OnSOP,0)                      AS int)                AS OnSOPOH,         -- V
    CAST(ISNULL(tw.OnPOPBulk,0)                  AS int)                AS OnPOPBulk,       -- W
    ISNULL(CONVERT(varchar(10), d.DateOfLastSale, 23), '')              AS DateOfLastSale,  -- X
    LTRIM(RTRIM(ISNULL(ex.ExcludeAutoPO,'')))                           AS ExcludeAutoPO,   -- Y
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(i.Customers,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))                    AS Customers,       -- Z
    ISNULL(o.StockHeldOH,'N')                                           AS StockHeldOH,     -- AA
    'TIBARD'                                                            AS Company          -- AB
FROM        items i
LEFT JOIN   S200_LIVE.dbo.ProductGroup pg ON pg.ProductGroupID = i.ProductGroupID
LEFT JOIN   tib_wh   tw ON tw.ItemID = i.ItemID
LEFT JOIN   oh       o  ON o.Code    = i.Code
LEFT JOIN   sop_tib  st ON st.Code   = i.Code
LEFT JOIN   sop_oh   so ON so.Code   = i.Code
LEFT JOIN   sales    sa ON sa.Code   = i.Code
LEFT JOIN   supplier sp ON sp.ItemID = i.ItemID
LEFT JOIN   excl     ex ON ex.ItemID = i.ItemID
LEFT JOIN   cwlist   bk ON bk.Code   = i.Code
LEFT JOIN   dols     d  ON d.Code    = i.Code
),
/* ---------------------------------------------- the sales order lines -- */
demand AS (
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
INNER JOIN  items                             sh   ON sh.Code                  = LTRIM(RTRIM(sorl.ItemCode))
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
INNER JOIN  items                                    sh   ON sh.Code                  = LTRIM(RTRIM(sorl.ItemCode))
LEFT  JOIN  OliverHarveyLive.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE   sor.DocumentTypeID = 0 AND sor.DocumentStatusID = 0 AND sorl.LineTypeID = 0
  AND  (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
)

SELECT  A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, AA, AB
FROM (
    SELECT  0 AS SortA, StockCode AS SortB, '' AS SortC,
            StockCode AS A, Name AS B,
            CAST(InStock AS nvarchar(20)) AS C, CAST(OnSOP AS nvarchar(20)) AS D, CAST(OnPOP AS nvarchar(20)) AS E,
            CAST(Sales1M AS nvarchar(20)) AS F, CAST(Sales3M AS nvarchar(20)) AS G, CAST(Sales6M AS nvarchar(20)) AS H, CAST(Sales12M AS nvarchar(20)) AS I,
            Category AS J, Manufacturer AS K, SupplierAcct AS L, SupplierName AS M, ClockworkMade AS N,
            CAST(LeadDays AS nvarchar(20)) AS O, CAST(MinLevel AS nvarchar(20)) AS P,
            CAST(StockHome AS nvarchar(20)) AS Q, CAST(StockOther AS nvarchar(20)) AS R, CAST(StockBulk AS nvarchar(20)) AS S, CAST(StockOH AS nvarchar(20)) AS T,
            CAST(OnSOPTib AS nvarchar(20)) AS U, CAST(OnSOPOH AS nvarchar(20)) AS V, CAST(OnPOPBulk AS nvarchar(20)) AS W,
            DateOfLastSale AS X, ExcludeAutoPO AS Y, Customers AS Z, StockHeldOH AS AA, Company AS AB
    FROM    buffer
    UNION ALL
    SELECT  1, ProductCode, ISNULL(PromisedDate,'') + Company + SalesOrderNo + RIGHT('00000' + CAST(LineSeq AS varchar(10)), 5),
            LineKey, Company, SalesOrderNo, ProductCode, CAST(Qty AS nvarchar(20)), ISNULL(PromisedDate,''), ISNULL(OrderDate,''),
            CustomerName, CustomerOrderNo, Account, Intercompany, CAST(LineSeq AS nvarchar(20)),
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    FROM    demand
) u
ORDER BY SortA, SortB, SortC;
