/* 61-fabric-stock-columns.sql - paste this INSTEAD of 60 for one refresh.
   Lists every column of the four tables 60-fabric-stock.sql reads for the
   supplier, levels and purchase orders, so the six names Sage rejected
   (ReorderQty, PLSupplierAccountID, LastPrice, LeadTimeDays, IsPreferred,
   LastPurchaseDate) can be replaced with the real ones. */
SELECT  TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM    S200_LIVE.INFORMATION_SCHEMA.COLUMNS
WHERE   TABLE_NAME IN ('StockItemSupplier','WarehouseItem','POPOrderReturnLine','StockItemUnit','PLSupplierAccount')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
