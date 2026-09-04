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

     OHAPP063015HP1S   Stock-held flag set in AnalysisCode3 instead of
                       AnalysisCode7. The rule read slot 7, found it blank,
                       and blank means not-stock-held - so a stock item was
                       offered as a special make. Also caught by eye.

   Neither was a fault in the query. Both were a product set up in a way the
   rules could not read, and in both cases the sheet looked perfectly normal.
   That is what this report is for.

   WHICH SLOT EACH COMPANY USES - measured, not assumed. From
   09-confirm-stock-held-slot.sql:

     TIBARD         AnalysisCode3   1,561 Yes / 805 No     of 107,352 products
     OLIVER HARVEY  AnalysisCode7   2,170 Yes /  56 No     of   8,280 products

   Blank is the normal state in both companies, and blank correctly means
   "not stock held". So a blank flag is NOT reported here on its own - it would
   bury the real exceptions. It is reported only when ANOTHER slot carries a
   Yes, which is what a mis-keyed flag looks like.

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

        /* Slot 8 carries Yes on 140 Tibard products. What that code is has not
           been confirmed, so this is raised as a question, not a fault. */
        WHEN ISNULL(si.AnalysisCode3,'') = ''
         AND ISNULL(si.AnalysisCode8,'') = 'Yes'
        THEN 'CHECK - stock-held slot is blank but AnalysisCode8 says Yes. If '
             + 'that is the stock-held flag, this is being offered as a special '
             + 'make when it is stock.'
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
    'AnalysisCode7',
    '[' + ISNULL(si.AnalysisCode7,'') + ']',
    ISNULL(NULLIF(LTRIM(RTRIM(si.Manufacturer)),''),'(blank)'),
    CASE
        WHEN ISNULL(si.AnalysisCode7,'') <> 'Yes'
         AND NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NOT NULL
         AND si.Manufacturer NOT LIKE '%Tibard%'
         AND si.Manufacturer NOT LIKE '%Oliver Harvey%'
         AND NOT EXISTS (SELECT 1 FROM known_bought_in k
                         WHERE k.Name = LTRIM(RTRIM(si.Manufacturer)))
        THEN 'DROPPED SILENTLY - manufacturer is "' + LTRIM(RTRIM(si.Manufacturer))
             + '". If we make it, set the manufacturer to Tibard or Oliver Harvey.'

        WHEN ISNULL(si.AnalysisCode7,'') <> 'Yes'
         AND NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
        THEN 'ON THE SHEET AS REVIEW - no manufacturer set. Set it.'

        /* THE OHAPP063015HP1S CASE. Slot 3 is blank on 8,257 of 8,280 OH
           products and holds nothing but Yes on the other 23 - which is what a
           mis-keyed flag looks like, not a code in real use. */
        WHEN ISNULL(si.AnalysisCode7,'') = ''
         AND ISNULL(si.AnalysisCode3,'') = 'Yes'
        THEN 'STOCK ITEM OFFERED AS A SPECIAL - stock-held flag was set in '
             + 'AnalysisCode3. Move it to AnalysisCode7, which is the one this '
             + 'company is read on.'
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
ORDER BY CASE WHEN Issue LIKE 'DROPPED SILENTLY%' THEN 0
              WHEN Issue LIKE 'STOCK ITEM%'       THEN 1
              WHEN Issue LIKE 'CHECK%'            THEN 2
              ELSE 3 END,
         PromisedDate, Company, ProductCode;
