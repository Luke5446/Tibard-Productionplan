/* =========================================================================
   73-buffer-discovery.sql  -  THE NAMES 70 ASSUMES, read off the server
   -------------------------------------------------------------------------
   Paste in place of 70 for one refresh. Six small result sets; Power Query
   shows the first only, so run them one at a time (each block stands alone)
   or run the file in SQL Server Management Studio. Each answers one thing
   70-buffer-live.sql takes on trust:

     1  Warehouse names: 70 reads HOME by name and Bulk as '%BULK%'; the
        rest (consignment) is "StockOther". If Bulk is called something
        else, fix the LIKE in 70.
     2  Search categories: which one holds the customer names the old
        sheet's "Customer(s)" column showed. 70 matches 'Customer%'.
     3  Clockwork's supplier account(s), for reference: 70 now marks a code
        ClockworkMade from the Bulk list (eve_AllLiveSOPPOPStockBULK), not this.
     4  Stock-held codes with no supplier record at all (lead time reads 0)
        - a Clockwork code is read off the Bulk list, so nothing is missed.
     5  The old views' definitions, so a difference 72 lists can be named.
     6  Oliver Harvey stock-held codes that are not in Tibard's stock-held
        set: today's buffer never lists them (its row set is Tibard's). The
        count says whether that matters.
   ========================================================================= */

/* 1 ---------------------------------------------------------------------- */
SELECT  'warehouse' AS What, w.WarehouseID, w.Name,
        COUNT(wi.ItemID) AS Items, SUM(wi.ConfirmedQtyInStock) AS Units
FROM    S200_LIVE.dbo.Warehouse w
LEFT JOIN S200_LIVE.dbo.WarehouseItem wi ON wi.WarehouseID = w.WarehouseID
GROUP BY w.WarehouseID, w.Name
ORDER BY w.Name;

/* 2 ---------------------------------------------------------------------- */
SELECT  'search category' AS What, sc.SearchCategoryID, sc.Name,
        COUNT(DISTINCT cv.ItemID) AS ItemsTagged,
        (SELECT TOP 1 sv.Name FROM S200_LIVE.dbo.SearchValue sv WHERE sv.SearchCategoryID = sc.SearchCategoryID ORDER BY sv.Name) AS FirstValue
FROM    S200_LIVE.dbo.SearchCategory sc
LEFT JOIN S200_LIVE.dbo.StockItemSearchCatVal cv ON cv.SearchCategoryID = sc.SearchCategoryID
GROUP BY sc.SearchCategoryID, sc.Name
ORDER BY sc.Name;

/* 3 ---------------------------------------------------------------------- */
SELECT  'clockwork account' AS What, pl.SupplierAccountNumber, pl.SupplierAccountName,
        COUNT(sis.ItemID) AS ItemsSupplied,
        SUM(CASE WHEN sis.Preferred = 1 THEN 1 ELSE 0 END) AS Preferred
FROM    S200_LIVE.dbo.PLSupplierAccount pl
LEFT JOIN S200_LIVE.dbo.StockItemSupplier sis ON sis.SupplierID = pl.PLSupplierAccountID
WHERE   pl.SupplierAccountName LIKE '%Clockwork%' OR pl.SupplierAccountNumber LIKE 'CLO%'
GROUP BY pl.SupplierAccountNumber, pl.SupplierAccountName;

/* 4 ---------------------------------------------------------------------- */
SELECT  'stock held, no supplier' AS What, si.Code, si.Name, si.Manufacturer
FROM    S200_LIVE.dbo.StockItem si
WHERE   ISNULL(si.AnalysisCode3,'') = 'Yes' AND si.Code NOT LIKE 'BULK%'
  AND   NOT EXISTS (SELECT 1 FROM S200_LIVE.dbo.StockItemSupplier sis WHERE sis.ItemID = si.ItemID)
ORDER BY si.Code;

/* 5 ---------------------------------------------------------------------- */
SELECT  'view' AS What, o.name AS ViewName, m.definition
FROM    S200_LIVE.sys.sql_modules m
JOIN    S200_LIVE.sys.objects o ON o.object_id = m.object_id
WHERE   o.name IN ('eve_AllLiveSOPPOPStockNoSP','eve_AllLiveSOPPOPStock','eve_AllLiveSOPPOPStockConsignment',
                   'eve_AllLiveSOPPOPStockBULK','bm_LiveStockItems_NoBulk','bm_Tib_Sales_12_6_3_Grouped','bm_HOME_MinimumLevel')
UNION ALL
SELECT  'view', o.name, m.definition
FROM    OliverHarveyLive.sys.sql_modules m
JOIN    OliverHarveyLive.sys.objects o ON o.object_id = m.object_id
WHERE   o.name IN ('eve_AllLiveSOPPOPStock','bm_OH_Sales_Grouped');

/* 6 ---------------------------------------------------------------------- */
SELECT  'OH only, stock held' AS What, si.Code, si.Name,
        ISNULL(si.AnalysisCode3,'') AS StockHeld, ISNULL(si.AnalysisCode7,'') AS Website
FROM    OliverHarveyLive.dbo.StockItem si
WHERE  (ISNULL(si.AnalysisCode3,'') = 'Yes' OR ISNULL(si.AnalysisCode7,'') = 'Yes')
  AND   si.Code NOT LIKE 'BULK%'
  AND   NOT EXISTS (SELECT 1 FROM S200_LIVE.dbo.StockItem t
                    WHERE LTRIM(RTRIM(t.Code)) = LTRIM(RTRIM(si.Code)) AND ISNULL(t.AnalysisCode3,'') = 'Yes')
ORDER BY si.Code;
