/* =========================================================================
   70-buffer-live.sql  -  THE BUFFER SHEET, built in one query
   -------------------------------------------------------------------------
   Server TIB-SQL-002. Reads S200_LIVE (Tibard) and OliverHarveyLive in one
   pass via three-part names, like 10-special-makes-live.sql.

   Replaces the Buffer_Report workbook: its 11 queries, 18 hidden columns and
   the VLOOKUP chains between them. One row per STOCK-HELD Tibard code (the
   same set as today: Tibard's Stock Held analysis code = Yes, BULK codes
   left out), with the Oliver Harvey figures for the same code added in.

   THE ROW SET IS THE OLD SHEET AS LUKE COPIED IT, not the whole table. The
   old sheet carried two filters (its autoFilter, read 9 Oct 2026):
     Manufacturer  in  Tibard / Oliver Harvey / Urban Textiles/Tibard / MPLG
     Customer(s)   not NHSP
   which left 757 of its 1,533 rows - the garments made here, less the NHS
   Professionals range. The first refresh without them pasted 1,555 codes
   into the planner (Luke, 9 Oct 2026). Both filters are in the WHERE below;
   the first refresh with them gave 758.

   Paste the whole file into a NEW workbook's Power Query connection (see
   sage/README.md, "The buffer workbook"), Refresh All, then copy columns
   A to AB, all rows, without the header, into the planner's buffer paste box.

   COLUMNS A TO I ARE TODAY'S PASTE, in today's order, so the planner reads
   the sheet before it learns anything new - nothing has to be hidden:

     A StockCode    B Name    C InStock    D OnSOP    E OnPOP
     F Sales1M      G Sales3M H Sales6M    I Sales12M

   What each is, against the old sheet:
     C InStock  = Tibard stock in every warehouse EXCEPT Bulk + OH stock
                  (the old M: "01 No SP" + "02 OH" + "04 Consignment"; the
                  old formula also looked up an OffSite table that is not in
                  the workbook, so it always added 0)
     D OnSOP    = outstanding quantity on live sales orders, both companies
                  (line quantity less despatched, orders only, not returns)
     E OnPOP    = Sage's on-purchase-order figure for every warehouse except
                  Bulk, both companies (WarehouseItem.QuantityOnPOPOrder,
                  the figure the fabric sheet already uses)
     F Sales1M  = Sales3M / 3, as the old sheet worked it (the planner
                  stores it and shows nothing from it)
     G-I        = the existing bm_ sales views, Tibard + Oliver Harvey

   THE NEW COLUMNS, for what the planner is being asked to do next:

     J Category        product group description
     K Manufacturer    the stock record's Manufacturer field
     L SupplierAcct    preferred supplier's account number (CLO003 = Clockwork)
     M SupplierName
     N ClockworkMade   Y when the code is on the Clockwork Bulk list - the
                       eve_AllLiveSOPPOPStockBULK view the old workbook read
                       as "03 Tibard Limited Bulk". Checked 9 Oct 2026: of its
                       615 codes 369 are in the buffer, and 343 of those are
                       the ones the typed Supplier Lead Times sheet marked
                       Clockwork (344). These are shown in the planner but
                       kept OUT of the stock KPI: bought in on containers the
                       stock planner tracks, not production's to make
     O LeadDays        the preferred supplier's lead time on the stock record
     P MinLevel        the HOME warehouse's minimum level
     Q StockHome       Tibard HOME
     R StockOther      Tibard, every other warehouse except Bulk (consignment)
     S StockBulk       Tibard Bulk - NOT in C, shown so it is not invisible
     T StockOH         Oliver Harvey, every warehouse
     U OnSOPTib        D split by company
     V OnSOPOH
     W OnPOPBulk       Sage POP landing in Bulk - NOT in E
     X DateOfLastSale  yyyy-mm-dd, blank when never sold
     Y ExcludeAutoPO   the "Exclude From Auto B2B PO" search value
     Z Customers       the old sheet's "Customer(s)", read from the
                       bm_LiveStockItems_NoBulk view the old Query1 used
     AA StockHeldOH    Y when OH's own record also says stock held / website
     AB Company        TIBARD - every row is a Tibard stock record

   Numbers are plain integers or 2-dp decimals, dates are yyyy-mm-dd text, and
   tabs / line breaks are stripped from names, so the paste survives Excel.
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
ORDER BY    i.Code;
