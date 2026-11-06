/* 80-standard-costs.sql — Sage standard cost £ per garment for the production planner's
   KPI tab (Paste standard costs), which the Operations KPIs dashboard reads to value the
   garments completed each month.

   Run in SQL 1.xlsx against TIB-SQL-002. Tibard's company (S200_LIVE) holds the standard
   cost for everything made, OH codes included, so every code with a cost is taken from
   there (the BULK codes Clockwork garments come in under too). A code OliverHarveyLive has
   with a cost and S200_LIVE has not is added from OH.

   Copy the Code and StdCost columns, paste them into the planner's KPI tab box, Save, then
   Publish for team. The planner keeps only the codes it knows (buffer rows, their BULK
   codes, works orders live and completed), so paste the whole list: ~100k rows is fine.

   A finishing-only works order is valued at the BULK code's cost + £1, so keep the BULK
   codes in. Codes with a zero standard cost are left out: the dashboard lists them as
   unpriced rather than counting them at £0.

   Confirmed 6 Nov 2026: StockItem.StandardCost is the column (106,983 rows with a cost). */
SELECT  si.Code, CAST(si.StandardCost AS DECIMAL(18,4)) AS StdCost, 'Tibard' AS Company, si.Name, pg.Code AS ProductGroup
FROM    S200_LIVE.dbo.StockItem si
LEFT JOIN S200_LIVE.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
WHERE   si.StandardCost > 0
UNION ALL
SELECT  si.Code, CAST(si.StandardCost AS DECIMAL(18,4)), 'OH', si.Name, pg.Code
FROM    OliverHarveyLive.dbo.StockItem si
LEFT JOIN OliverHarveyLive.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
WHERE   si.StandardCost > 0
  AND   NOT EXISTS (SELECT 1 FROM S200_LIVE.dbo.StockItem t
                    WHERE t.Code COLLATE DATABASE_DEFAULT = si.Code COLLATE DATABASE_DEFAULT
                      AND t.StandardCost > 0)
ORDER BY Code;
