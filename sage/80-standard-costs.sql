/* 80-standard-costs.sql — Sage standard cost £ per garment for the production planner's
   KPI tab (Paste standard costs), which the Operations KPIs dashboard reads to value the
   garments completed each month.

   Run in SQL 1.xlsx against TIB-SQL-002. One row per stock code across both companies:
   OH codes from OliverHarveyLive, everything else (including the BULK codes Clockwork
   garments come in under) from S200_LIVE. Copy the Code and StdCost columns, paste them
   into the planner's KPI tab box, Save, then Publish for team.

   A finishing-only works order is valued at the BULK code's cost + £1, so keep the BULK
   codes in. Codes with a zero standard cost are left out: the dashboard lists them as
   unpriced rather than counting them at £0.

   StandardCost is the Sage 200 stock item standard cost. If your Sage build keeps it on
   another column, change the two lines marked <<. */
;WITH Costs AS (
    SELECT  'Tibard' AS Company, si.Code, si.Name, pg.Code AS ProductGroup,
            CAST(si.StandardCost AS DECIMAL(18,4)) AS StdCost      -- <<
    FROM    S200_LIVE.dbo.StockItem si
    LEFT JOIN S200_LIVE.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
    WHERE   si.Code NOT LIKE 'OH%'
    UNION ALL
    SELECT  'OH', si.Code, si.Name, pg.Code,
            CAST(si.StandardCost AS DECIMAL(18,4))                 -- <<
    FROM    OliverHarveyLive.dbo.StockItem si
    LEFT JOIN OliverHarveyLive.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
    WHERE   si.Code LIKE 'OH%'
)
SELECT  Code, StdCost, Company, Name, ProductGroup
FROM    Costs
WHERE   StdCost > 0
ORDER BY Company, Code;
