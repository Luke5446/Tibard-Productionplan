/* =========================================================================
   63-supplier-prices.sql  -  WHICH PRICE IS THE SUPPLIER'S OWN, AND IN WHAT
   CURRENCY?  (one-off probe: ONE grid, so it works in the Excel connection)
   -------------------------------------------------------------------------
   HOW TO RUN: open the Fabric Stock query in Power Query, click the gear
   next to Source, and paste the WHOLE of this file - the text, not the file
   name - into the SQL statement box in place of the stock query. Refresh,
   copy the grid, send it back, then put the stock query back.
   (Power Query only shows the FIRST result of a statement, so this probe is
   written as one grid: column "what", column "name", column "value".)

   The purchase order file (B2B_PO_TIB) needs the unit price in the
   supplier's currency: Tiajo (TIA001EU) buy in euros. 60-fabric-stock.sql
   column M is StockItemSupplier.LastBuyingPrice, and nothing on the sheet
   says which currency that is held in. The grid answers it:

     columns   every price / cost / currency column on the tables involved
     tiajo     the whole item-supplier record for three Tiajo cloths, as one
               line of attribute="value" - the euro price is in there by name
     account   the whole TIA001EU supplier account record - its currency
               column is in there by name
     currency  Sage's currency table, so the CurrencyID reads as EUR / GBP

   Then 60-fabric-stock.sql gets two more columns (O SupplierCurrency,
   P SupplierPrice) that the app already reads.
   ========================================================================= */
SELECT  'columns' AS what,
        TABLE_NAME + '.' + COLUMN_NAME AS name,
        DATA_TYPE AS value
FROM    S200_LIVE.INFORMATION_SCHEMA.COLUMNS
WHERE   TABLE_NAME IN ('StockItemSupplier','PLSupplierAccount','StockItem','SYSCurrency')
  AND  (COLUMN_NAME LIKE '%Price%' OR COLUMN_NAME LIKE '%Cost%' OR COLUMN_NAME LIKE '%Currenc%')

UNION ALL

SELECT  'tiajo',
        LTRIM(RTRIM(si.Code)),
        CAST((SELECT sis.* FOR XML RAW) AS nvarchar(max))
FROM    S200_LIVE.dbo.StockItemSupplier sis
JOIN    S200_LIVE.dbo.PLSupplierAccount pl ON pl.PLSupplierAccountID = sis.SupplierID
JOIN    S200_LIVE.dbo.StockItem         si ON si.ItemID = sis.ItemID
WHERE   pl.SupplierAccountNumber = 'TIA001EU'
  AND   LTRIM(RTRIM(si.Code)) IN ('CO5001ECO','CO5003ECO','PC2001ECO')

UNION ALL

SELECT  'account',
        pl.SupplierAccountNumber,
        CAST((SELECT pl.* FOR XML RAW) AS nvarchar(max))
FROM    S200_LIVE.dbo.PLSupplierAccount pl
WHERE   pl.SupplierAccountNumber = 'TIA001EU'

UNION ALL

SELECT  'currency',
        CAST(c.SYSCurrencyID AS nvarchar(20)),
        CAST((SELECT c.* FOR XML RAW) AS nvarchar(max))
FROM    S200_LIVE.dbo.SYSCurrency c;
