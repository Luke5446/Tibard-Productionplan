/* =========================================================================
   72-buffer-validate.sql  -  DOES THE NEW SHEET AGREE WITH THE OLD ONE?
   -------------------------------------------------------------------------
   Run once in the new workbook (paste it in place of 70 for one refresh)
   BEFORE the planner is pointed at the new sheet, and again after any rule
   change. It works the old sheet's In Stock / SOP / POP out the old way -
   from the eve_ views the Buffer_Report workbook reads - and sets them
   against 70's figures, listing only the codes where they differ.

   An EMPTY result means the new sheet is the old sheet, plus the new columns.

   Differences to expect, and what they mean:
     - InStock off by the Bulk warehouse: 70 leaves Bulk out of C (as the old
       formula did); check the warehouse name in 73-buffer-discovery.sql
       matches '%BULK%'.
     - OnSOP: the old view may count allocated rather than outstanding, or
       include returns / quotes. The planner wants outstanding on live orders,
       so 70's figure is the one to keep; note the reason here.
     - OnPOP: the old sheet's POP came from a different view ("05 SP") than
       its stock ("01 No SP"). If POP differs on many codes, 73 prints both
       views' definitions so the difference can be named.
   ========================================================================= */

WITH old AS (
    SELECT  LTRIM(RTRIM(Code)) AS Code,
            SUM(InStock) AS InStock, SUM(OnSOP) AS OnSOP, SUM(OnPOP) AS OnPOP
    FROM (
        SELECT Code, InStock, OnSOP, 0 AS OnPOP FROM S200_LIVE.dbo.eve_AllLiveSOPPOPStockNoSP          -- old sheet "01"
        UNION ALL
        SELECT Code, 0,       0,     OnPOP      FROM S200_LIVE.dbo.eve_AllLiveSOPPOPStock              -- old sheet "05"
        UNION ALL
        SELECT Code, InStock, OnSOP, OnPOP      FROM OliverHarveyLive.dbo.eve_AllLiveSOPPOPStock       -- old sheet "02"
        UNION ALL
        SELECT Code, InStock, OnSOP, OnPOP      FROM S200_LIVE.dbo.eve_AllLiveSOPPOPStockConsignment   -- old sheet "04"
    ) v
    GROUP BY LTRIM(RTRIM(Code))
),
items AS (
    SELECT  si.ItemID, LTRIM(RTRIM(si.Code)) AS Code
    FROM    S200_LIVE.dbo.StockItem si
    WHERE   ISNULL(si.AnalysisCode3,'') = 'Yes' AND si.Code NOT LIKE 'BULK%'
),
tib_wh AS (
    SELECT  wi.ItemID,
            SUM(CASE WHEN w.Name NOT LIKE '%BULK%' THEN wi.ConfirmedQtyInStock ELSE 0 END)        AS Stock,
            SUM(CASE WHEN w.Name NOT LIKE '%BULK%' THEN ISNULL(wi.QuantityOnPOPOrder,0) ELSE 0 END) AS OnPOP,
            SUM(CASE WHEN w.Name LIKE '%BULK%'     THEN wi.ConfirmedQtyInStock ELSE 0 END)        AS StockBulk
    FROM    S200_LIVE.dbo.WarehouseItem wi
    JOIN    S200_LIVE.dbo.Warehouse     w ON w.WarehouseID = wi.WarehouseID
    GROUP BY wi.ItemID
),
oh AS (
    SELECT  LTRIM(RTRIM(si.Code)) AS Code, SUM(wi.ConfirmedQtyInStock) AS Stock, SUM(ISNULL(wi.QuantityOnPOPOrder,0)) AS OnPOP
    FROM    OliverHarveyLive.dbo.StockItem si
    LEFT JOIN OliverHarveyLive.dbo.WarehouseItem wi ON wi.ItemID = si.ItemID
    GROUP BY LTRIM(RTRIM(si.Code))
),
sop AS (
    SELECT  Code, SUM(Q) AS OnSOP FROM (
        SELECT LTRIM(RTRIM(sorl.ItemCode)) AS Code, sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0) AS Q
        FROM   S200_LIVE.dbo.SOPOrderReturn sor
        JOIN   S200_LIVE.dbo.SOPOrderReturnLine sorl ON sorl.SOPOrderReturnID = sor.SOPOrderReturnID
        WHERE  sor.DocumentTypeID = 0 AND sor.DocumentStatusID = 0 AND sorl.LineTypeID = 0
          AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
        UNION ALL
        SELECT LTRIM(RTRIM(sorl.ItemCode)), sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)
        FROM   OliverHarveyLive.dbo.SOPOrderReturn sor
        JOIN   OliverHarveyLive.dbo.SOPOrderReturnLine sorl ON sorl.SOPOrderReturnID = sor.SOPOrderReturnID
        WHERE  sor.DocumentTypeID = 0 AND sor.DocumentStatusID = 0 AND sorl.LineTypeID = 0
          AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
    ) q GROUP BY Code
),
new AS (
    SELECT  i.Code,
            ISNULL(tw.Stock,0) + ISNULL(o.Stock,0)  AS InStock,
            ISNULL(s.OnSOP,0)                        AS OnSOP,
            ISNULL(tw.OnPOP,0) + ISNULL(o.OnPOP,0)   AS OnPOP,
            ISNULL(tw.StockBulk,0)                   AS StockBulk
    FROM    items i
    LEFT JOIN tib_wh tw ON tw.ItemID = i.ItemID
    LEFT JOIN oh     o  ON o.Code    = i.Code
    LEFT JOIN sop    s  ON s.Code    = i.Code
)
SELECT  n.Code,
        n.InStock AS NewInStock, ISNULL(o.InStock,0) AS OldInStock, n.InStock - ISNULL(o.InStock,0) AS StockDiff,
        n.OnSOP   AS NewOnSOP,   ISNULL(o.OnSOP,0)   AS OldOnSOP,   n.OnSOP   - ISNULL(o.OnSOP,0)   AS SOPDiff,
        n.OnPOP   AS NewOnPOP,   ISNULL(o.OnPOP,0)   AS OldOnPOP,   n.OnPOP   - ISNULL(o.OnPOP,0)   AS POPDiff,
        n.StockBulk,
        CASE WHEN o.Code IS NULL THEN 'not in the old views' ELSE '' END AS Note
FROM    new n
LEFT JOIN old o ON o.Code = n.Code
WHERE   n.InStock <> ISNULL(o.InStock,0)
   OR   n.OnSOP   <> ISNULL(o.OnSOP,0)
   OR   n.OnPOP   <> ISNULL(o.OnPOP,0)
ORDER BY ABS(n.InStock - ISNULL(o.InStock,0)) + ABS(n.OnSOP - ISNULL(o.OnSOP,0)) + ABS(n.OnPOP - ISNULL(o.OnPOP,0)) DESC, n.Code;
