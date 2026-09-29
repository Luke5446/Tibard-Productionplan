/* =========================================================================
   63-supplier-prices.sql  -  WHICH PRICE IS THE SUPPLIER'S OWN, AND IN WHAT
   CURRENCY?  (one-off probe, paste INSTEAD of 60 for one refresh)
   -------------------------------------------------------------------------
   The purchase order file (B2B_PO_TIB) needs the unit price in the
   supplier's currency: Tiajo (TIA001EU) buy in euros. 60-fabric-stock.sql
   column M is StockItemSupplier.LastBuyingPrice, and nothing on the sheet
   says which currency that is held in. Three result sets answer it:

     1. every price / cost / currency column on the four tables involved
     2. the whole item-supplier record for three Tiajo cloths, next to the
        supplier account's own columns - the currency column and the euro
        price will be visible by name
     3. the currency table, so the CurrencyID can be read as EUR / GBP

   Send the three grids back and 60-fabric-stock.sql gets two more columns
   (O SupplierCurrency, P SupplierPrice) that the app already reads.
   ========================================================================= */

/* 1. the columns */
SELECT  TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM    S200_LIVE.INFORMATION_SCHEMA.COLUMNS
WHERE   TABLE_NAME IN ('StockItemSupplier','PLSupplierAccount','StockItem','SYSCurrency')
  AND  (COLUMN_NAME LIKE '%Price%' OR COLUMN_NAME LIKE '%Cost%' OR COLUMN_NAME LIKE '%Currenc%')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

/* 2. three Tiajo cloths: the item-supplier record in full, then the supplier account in full */
SELECT  pl.SupplierAccountNumber, si.Code, sis.*
FROM    S200_LIVE.dbo.StockItemSupplier sis
JOIN    S200_LIVE.dbo.PLSupplierAccount pl ON pl.PLSupplierAccountID = sis.SupplierID
JOIN    S200_LIVE.dbo.StockItem         si ON si.ItemID = sis.ItemID
WHERE   pl.SupplierAccountNumber = 'TIA001EU'
  AND   LTRIM(RTRIM(si.Code)) IN ('CO5001ECO','CO5003ECO','PC2001ECO');

SELECT  *
FROM    S200_LIVE.dbo.PLSupplierAccount
WHERE   SupplierAccountNumber = 'TIA001EU';

/* 3. the currencies (the table name is the usual one; if Sage rejects it,
      the columns list in grid 1 names the right table) */
SELECT  * FROM S200_LIVE.dbo.SYSCurrency;
