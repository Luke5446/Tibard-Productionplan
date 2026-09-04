/* ============================================================================
   PRODUCTS WHOSE SET-UP WILL MAKE THE SHEET WRONG      Both companies.
   A single statement - safe to paste into Excel on its own.

   Everything here has a LIVE ORDER LINE right now, so every row is something
   to act on today rather than a list of dead codes. Run it weekly; an empty
   result means the product file agrees with the rules.

   WHY THIS EXISTS - two real incidents, days apart:

     OHAPB0001         Manufacturer read "Aprons" - a category typed into the
                       manufacturer field by IT when the code was created. The
                       rule saw a manufacturer that is not ours, classified it
                       BOUGHT IN and dropped it. SILENT: nothing appeared
                       anywhere, and it was caught by eye.

     OHAPP063015HP1S   Stock held, but not on the website. Oliver Harvey's
                       "Stock Held" code is AnalysisCode3 and "Website" is
                       AnalysisCode7, and the rule read only Website - so a
                       stock item was offered as a special make. Also caught by
                       eye. FIXED IN THE RULE: Oliver Harvey now reads both,
                       which is why this report no longer looks for it.

   Neither was a fault in the query. Both were a product set up in a way the
   rules could not read, and in both cases the sheet looked perfectly normal.
   That is what this report is for.

   WHAT COUNTS AS STOCK HELD - measured, not assumed, from
   09-confirm-stock-held-slot.sql and confirmed against the code names in Sage:

     TIBARD         AnalysisCode3   "Stock Held"  1,561 Yes / 805 No  of 107,352
     OLIVER HARVEY  AnalysisCode3   "Stock Held"     23 Yes           of   8,280
                    AnalysisCode7   "Website"     2,170 Yes /  56 No  of   8,280

   Oliver Harvey rely on Website rather than Stock Held, because anything on the
   website is held in stock, so either one saying Yes means stock held there.

   Blank is the normal state in both companies and correctly means "not stock
   held", so a blank flag is not reported here - it would bury the real
   exceptions under thousands of rows.

   SO THIS REPORT IS NOW ABOUT THE MANUFACTURER. The stock-held classes above
   are handled by the rule itself; what a rule cannot fix is a manufacturer
   field holding something that is not a manufacturer.

   FIRST RUN WILL BE NOISY, and that is expected. Goods we genuinely buy in are
   dropped correctly, but this report cannot tell them from a mis-typed
   manufacturer. Work through the manufacturers once, add the real suppliers to
   the known_bought_in list below, and from then on a row means something is
   actually wrong.
   ========================================================================= */

WITH known_bought_in(Name) AS (
    /* Manufacturers we genuinely buy from. A bought-in line being dropped is
       CORRECT, so without this list the report would be mostly noise and
       nobody would read it.

       Working method: run the report, look at the manufacturers under
       "DROPPED SILENTLY", and for each one decide - do we make this, or buy
       it? If we buy it, add the name here exactly as Sage holds it. The report
       then converges on genuine set-up errors and an empty result means
       everything agrees.

       Match is on the WHOLE name and is case-insensitive. */
    SELECT * FROM (VALUES
        ('put a confirmed bought-in manufacturer here')
    ) v(Name)
),
flagged AS (

/* ---------------------------------------------------------------- TIBARD -- */
SELECT
    'TIBARD'                                                   AS Company,
    sor.DocumentNo                                             AS SalesOrderNo,
    LTRIM(RTRIM(sorl.ItemCode))                                AS ProductCode,
    LTRIM(RTRIM(ISNULL(sorl.ItemDescription,'')))              AS ProductDesc,
    CAST(sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0) AS decimal(18,2)) AS Outstanding,
    CONVERT(varchar(10), COALESCE(sor.PromisedDeliveryDate,
                                  sorl.PromisedDeliveryDate,
                                  sor.RequestedDeliveryDate,
                                  sorl.RequestedDeliveryDate), 23) AS PromisedDate,
    LTRIM(RTRIM(ISNULL(cust.CustomerAccountName,'')))          AS Customer,
    'AnalysisCode3'                                            AS ReadSlot,
    '[' + ISNULL(si.AnalysisCode3,'') + ']'                    AS ReadSlotValue,
    ISNULL(NULLIF(LTRIM(RTRIM(si.Manufacturer)),''),'(blank)') AS Manufacturer,
    CASE
        /* Silent. The line is dropped and nobody is told. */
        WHEN ISNULL(si.AnalysisCode3,'') <> 'Yes'
         AND NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NOT NULL
         AND si.Manufacturer NOT LIKE '%Tibard%'
         AND si.Manufacturer NOT LIKE '%Oliver Harvey%'
         AND NOT EXISTS (SELECT 1 FROM known_bought_in k
                         WHERE k.Name = LTRIM(RTRIM(si.Manufacturer)))
        THEN 'DROPPED SILENTLY - manufacturer is "' + LTRIM(RTRIM(si.Manufacturer))
             + '". If we make it, set the manufacturer to Tibard or Oliver Harvey.'

        /* Reaches the sheet as REVIEW, so it is visible - but still wrong. */
        WHEN ISNULL(si.AnalysisCode3,'') <> 'Yes'
         AND NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
        THEN 'ON THE SHEET AS REVIEW - no manufacturer set. Set it.'

        ELSE NULL
    END                                                        AS Issue
FROM        S200_LIVE.dbo.SOPOrderReturn      sor
INNER JOIN  S200_LIVE.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
INNER JOIN  S200_LIVE.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
LEFT  JOIN  S200_LIVE.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
LEFT  JOIN  S200_LIVE.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE   sor.DocumentTypeID   = 0
    AND sor.DocumentStatusID = 0
    AND sorl.LineTypeID      = 0                  -- real product lines only
    AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
    AND ISNULL(pg.Code,'') <> '54'                -- charges and logos are not products
    AND ISNULL(cust.CustomerAccountNumber,'') <> 'OLIVER'   -- inter-company

UNION ALL

/* -------------------------------------------------------- OLIVER HARVEY -- */
SELECT
    'OLIVER HARVEY',
    sor.DocumentNo,
    LTRIM(RTRIM(sorl.ItemCode)),
    LTRIM(RTRIM(ISNULL(sorl.ItemDescription,''))),
    CAST(sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0) AS decimal(18,2)),
    CONVERT(varchar(10), COALESCE(sor.PromisedDeliveryDate,
                                  sorl.PromisedDeliveryDate,
                                  sor.RequestedDeliveryDate,
                                  sorl.RequestedDeliveryDate), 23),
    LTRIM(RTRIM(ISNULL(cust.CustomerAccountName,''))),
    'AnalysisCode3 + 7',
    'StockHeld[' + ISNULL(si.AnalysisCode3,'') + '] Website[' + ISNULL(si.AnalysisCode7,'') + ']',
    ISNULL(NULLIF(LTRIM(RTRIM(si.Manufacturer)),''),'(blank)'),
    CASE
        WHEN ISNULL(si.AnalysisCode3,'') <> 'Yes'
         AND ISNULL(si.AnalysisCode7,'') <> 'Yes'
         AND NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NOT NULL
         AND si.Manufacturer NOT LIKE '%Tibard%'
         AND si.Manufacturer NOT LIKE '%Oliver Harvey%'
         AND NOT EXISTS (SELECT 1 FROM known_bought_in k
                         WHERE k.Name = LTRIM(RTRIM(si.Manufacturer)))
        THEN 'DROPPED SILENTLY - manufacturer is "' + LTRIM(RTRIM(si.Manufacturer))
             + '". If we make it, set the manufacturer to Tibard or Oliver Harvey.'

        WHEN ISNULL(si.AnalysisCode3,'') <> 'Yes'
         AND ISNULL(si.AnalysisCode7,'') <> 'Yes'
         AND NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
        THEN 'ON THE SHEET AS REVIEW - no manufacturer set. Set it.'

        ELSE NULL
    END
FROM        OliverHarveyLive.dbo.SOPOrderReturn      sor
INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
INNER JOIN  OliverHarveyLive.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
LEFT  JOIN  OliverHarveyLive.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
LEFT  JOIN  OliverHarveyLive.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE   sor.DocumentTypeID   = 0
    AND sor.DocumentStatusID = 0
    AND sorl.LineTypeID      = 0
    AND (sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0)) > 0
    AND ISNULL(pg.Code,'') <> '54'
    AND ISNULL(cust.CustomerAccountNumber,'') <> 'TIB003'
)

SELECT Company, Issue, ProductCode, ProductDesc, Customer,
       SalesOrderNo, Outstanding, PromisedDate, ReadSlot, ReadSlotValue, Manufacturer
FROM   flagged
WHERE  Issue IS NOT NULL
/* Silent failures first - those are the ones nobody would ever notice. */
ORDER BY CASE WHEN Issue LIKE 'DROPPED SILENTLY%' THEN 0 ELSE 1 END,
         PromisedDate, Company, ProductCode;
