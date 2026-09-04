/* ============================================================================
   WHY IS THIS CODE NOT ON THE SPECIAL MAKES SHEET?    Sage 200 Professional
   Server TIB-SQL-002. Reads both companies, same as 10-special-makes-live.sql.

   Put the product code in @Code below and run it. It returns three grids:

     1. HOW THE PRODUCT IS SET UP   - and what that alone would classify it as
     2. EVERY ORDER LINE FOR IT     - with the reason each one is or is not on
                                      the sheet, in plain English
     3. EVERY ANALYSIS CODE SLOT    - every populated slot, both companies,
                                      values shown in [brackets]

   RUNNING IT FROM EXCEL? Power Query returns ONLY THE FIRST result set of a
   multi-statement batch, so you will see grid 1 and nothing else. Either run
   the file in SQL Server Management Studio, which shows all three, or paste
   one grid at a time into Excel - each is self-contained apart from the
   DECLARE at the top, so copy that line with it.

   Read grid 2's REASON column first. If it says the line SHOULD be there, the
   sheet just needs refreshing.

   IT ALSO ANSWERS THE OPPOSITE QUESTION - a stock item appearing on the sheet
   when it should not. That is nearly always the stock-held flag not saying
   what you think it says. Grid 1's StockHeldFlag is shown in [brackets] so
   leading spaces and short forms are visible, and MatchesStockHeldRule applies
   the live query's test exactly: only [Yes] counts. [Y], [ Yes] and [] do not,
   and the item is then treated as a special make. Grid 3 shows every slot, so
   if the flag was entered in a different one you will see it there.

   A code that is genuinely missing can only be missing for one of these
   reasons, because everything else - including a code the stock file has never
   heard of - comes through as REVIEW rather than being dropped:

     STOCK HELD      the stock-held analysis code says Yes
     BOUGHT IN       a manufacturer is set, and it is not Tibard or Oliver Harvey
     not live        DocumentStatusID is not 0
     not an order    DocumentTypeID is not 0 (a return or a credit)
     nothing left    the line is fully despatched
   ========================================================================= */

DECLARE @Code varchar(60) = 'OHAPP063015HP1S';        /* <<< the code to look up */

/* ---------------------------------------------------------------------------
   1. HOW THE PRODUCT IS SET UP
   Tibard reads AnalysisCode3, Oliver Harvey reads AnalysisCode7. The two
   companies were set up separately and use different slots - that is expected,
   not a mistake to tidy.
   No rows at all here means the code is in neither stock file, which is NOT a
   reason to be missing: those come through as "REVIEW - code not in stock file".
--------------------------------------------------------------------------- */
SELECT
    'TIBARD'                                     AS Company,
    'AnalysisCode3'                              AS StockHeldSlot,
    LTRIM(RTRIM(si.Code))                        AS Code,
    /* A string compare cannot spot this: SQL Server ignores TRAILING spaces
       in = and <>, so 'ABC ' = 'ABC'. Compare the stored length instead. */
    CASE WHEN DATALENGTH(si.Code) <> DATALENGTH(LTRIM(RTRIM(si.Code)))
         THEN 'YES - stray spaces in the code' ELSE 'no' END AS Padded,
    /* In [brackets] deliberately. An empty cell cannot be told apart from a
       space, and ' Yes' does not match the rule while 'Yes ' does - SQL Server
       ignores trailing spaces in = but not leading ones. */
    '[' + ISNULL(si.AnalysisCode3,'') + ']'      AS StockHeldFlag,
    CASE WHEN ISNULL(si.AnalysisCode3,'') = 'Yes' THEN 'YES - treated as stock held, kept off the sheet'
         ELSE 'no - treated as a special make' END AS MatchesStockHeldRule,
    ISNULL(NULLIF(LTRIM(RTRIM(si.Manufacturer)),''),'(blank)') AS Manufacturer,
    ISNULL(pg.Code,'(none)')                     AS ProductGroup,
    CASE
        WHEN ISNULL(si.AnalysisCode3,'') = 'Yes' THEN 'STOCK HELD >> DROPPED - set the stock-held code to No or blank'
        WHEN pg.Code = '54'                      THEN 'NOTE - charge or logo line, only shown alongside a works order'
        WHEN si.Manufacturer LIKE '%Tibard%'
          OR si.Manufacturer LIKE '%Oliver Harvey%' THEN 'WORKS ORDER - should be on the sheet'
        WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
                                                 THEN 'REVIEW - no manufacturer set, should still be on the sheet'
        ELSE 'BOUGHT IN >> DROPPED - manufacturer is "' + LTRIM(RTRIM(si.Manufacturer)) + '", set it to Tibard or Oliver Harvey'
    END                                          AS ProductSetUpSays
FROM       S200_LIVE.dbo.StockItem    si
LEFT JOIN  S200_LIVE.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
WHERE LTRIM(RTRIM(si.Code)) = @Code

UNION ALL

SELECT
    'OLIVER HARVEY',
    'AnalysisCode7',
    LTRIM(RTRIM(si.Code)),
    CASE WHEN DATALENGTH(si.Code) <> DATALENGTH(LTRIM(RTRIM(si.Code)))
         THEN 'YES - stray spaces in the code' ELSE 'no' END,
    '[' + ISNULL(si.AnalysisCode7,'') + ']',
    CASE WHEN ISNULL(si.AnalysisCode7,'') = 'Yes' THEN 'YES - treated as stock held, kept off the sheet'
         ELSE 'no - treated as a special make' END,
    ISNULL(NULLIF(LTRIM(RTRIM(si.Manufacturer)),''),'(blank)'),
    ISNULL(pg.Code,'(none)'),
    CASE
        WHEN ISNULL(si.AnalysisCode7,'') = 'Yes' THEN 'STOCK HELD >> DROPPED - set the stock-held code to No or blank'
        WHEN pg.Code = '54'                      THEN 'NOTE - charge or logo line, only shown alongside a works order'
        WHEN si.Manufacturer LIKE '%Tibard%'
          OR si.Manufacturer LIKE '%Oliver Harvey%' THEN 'WORKS ORDER - should be on the sheet'
        WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
                                                 THEN 'REVIEW - no manufacturer set, should still be on the sheet'
        ELSE 'BOUGHT IN >> DROPPED - manufacturer is "' + LTRIM(RTRIM(si.Manufacturer)) + '", set it to Tibard or Oliver Harvey'
    END
FROM       OliverHarveyLive.dbo.StockItem    si
LEFT JOIN  OliverHarveyLive.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
WHERE LTRIM(RTRIM(si.Code)) = @Code;


/* ---------------------------------------------------------------------------
   2. EVERY ORDER LINE FOR THE CODE, AND WHY IT IS OR IS NOT ON THE SHEET
   The same four order filters and the same category rules as the live query.
   No rows at all here means the code has no sales order line in either
   company - check the order was saved, and that it was raised in the company
   you are looking at.
--------------------------------------------------------------------------- */
WITH candidates AS (

SELECT
    'TIBARD'                                              AS Company,
    sor.DocumentNo                                        AS SalesOrderNo,
    sorl.PrintSequenceNumber                              AS LineSeq,
    LTRIM(RTRIM(sorl.ItemCode))                           AS ProductCode,
    LTRIM(RTRIM(ISNULL(sorl.ItemDescription,'')))         AS ProductDesc,
    sorl.LineQuantity                                     AS Ordered,
    ISNULL(sorl.DespatchReceiptQuantity,0)                AS Despatched,
    sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0) AS Outstanding,
    sor.DocumentTypeID                                    AS DocTypeID,
    sor.DocumentStatusID                                  AS DocStatusID,
    sorl.LineTypeID                                       AS LineTypeID,
    LTRIM(RTRIM(ISNULL(cust.CustomerAccountName,'')))     AS Customer,
    CASE
        WHEN cust.CustomerAccountNumber = 'OLIVER'   THEN 'INTERCOMPANY - no works order'
        WHEN sorl.LineTypeID = 1                     THEN 'NOTE - free text'
        WHEN pg.Code = '54'                          THEN 'NOTE - charge or logo line'
        WHEN ISNULL(si.AnalysisCode3,'') = 'Yes'     THEN 'STOCK HELD'
        WHEN sorl.ItemCode = 'FREETEXT'              THEN 'REVIEW - FREETEXT placeholder'
        WHEN si.Code IS NULL                         THEN 'REVIEW - code not in stock file'
        WHEN si.Manufacturer LIKE '%Tibard%'
          OR si.Manufacturer LIKE '%Oliver Harvey%'  THEN 'WORKS ORDER'
        WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
                                                     THEN 'REVIEW - no manufacturer set'
        ELSE                                              'BOUGHT IN'
    END                                                   AS Category
FROM        S200_LIVE.dbo.SOPOrderReturn      sor
INNER JOIN  S200_LIVE.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  S200_LIVE.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
LEFT  JOIN  S200_LIVE.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
LEFT  JOIN  S200_LIVE.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE LTRIM(RTRIM(sorl.ItemCode)) = @Code

UNION ALL

SELECT
    'OLIVER HARVEY',
    sor.DocumentNo,
    sorl.PrintSequenceNumber,
    LTRIM(RTRIM(sorl.ItemCode)),
    LTRIM(RTRIM(ISNULL(sorl.ItemDescription,''))),
    sorl.LineQuantity,
    ISNULL(sorl.DespatchReceiptQuantity,0),
    sorl.LineQuantity - ISNULL(sorl.DespatchReceiptQuantity,0),
    sor.DocumentTypeID,
    sor.DocumentStatusID,
    sorl.LineTypeID,
    LTRIM(RTRIM(ISNULL(cust.CustomerAccountName,''))),
    CASE
        WHEN cust.CustomerAccountNumber = 'TIB003'   THEN 'INTERCOMPANY - no works order'
        WHEN sorl.LineTypeID = 1                     THEN 'NOTE - free text'
        WHEN pg.Code = '54'                          THEN 'NOTE - charge or logo line'
        WHEN ISNULL(si.AnalysisCode7,'') = 'Yes'     THEN 'STOCK HELD'
        WHEN sorl.ItemCode = 'FREETEXT'              THEN 'REVIEW - FREETEXT placeholder'
        WHEN si.Code IS NULL                         THEN 'REVIEW - code not in stock file'
        WHEN si.Manufacturer LIKE '%Tibard%'
          OR si.Manufacturer LIKE '%Oliver Harvey%'  THEN 'WORKS ORDER'
        WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
                                                     THEN 'REVIEW - no manufacturer set'
        ELSE                                              'BOUGHT IN'
    END
FROM        OliverHarveyLive.dbo.SOPOrderReturn      sor
INNER JOIN  OliverHarveyLive.dbo.SOPOrderReturnLine  sorl ON sorl.SOPOrderReturnID    = sor.SOPOrderReturnID
LEFT  JOIN  OliverHarveyLive.dbo.StockItem           si   ON si.Code                  = sorl.ItemCode
LEFT  JOIN  OliverHarveyLive.dbo.ProductGroup        pg   ON pg.ProductGroupID        = si.ProductGroupID
LEFT  JOIN  OliverHarveyLive.dbo.SLCustomerAccount   cust ON cust.SLCustomerAccountID = sor.CustomerID
WHERE LTRIM(RTRIM(sorl.ItemCode)) = @Code
)

SELECT
    Company, SalesOrderNo, LineSeq, ProductCode, ProductDesc, Customer,
    Ordered, Despatched, Outstanding,
    DocTypeID, DocStatusID, LineTypeID, Category,
    /* Checked in the same order the live query applies them, so the first
       thing that fails is the one to fix. */
    CASE
        WHEN DocTypeID   <> 0 THEN 'NOT ON THE SHEET - not a sales order (DocumentTypeID '
                                   + CAST(DocTypeID AS varchar(10)) + '). Returns and credits are excluded.'
        WHEN DocStatusID <> 0 THEN 'NOT ON THE SHEET - the order is not live (DocumentStatusID '
                                   + CAST(DocStatusID AS varchar(10)) + '; live is 0). Check it is not on hold, parked or cancelled.'
        WHEN LineTypeID NOT IN (0,1) THEN 'NOT ON THE SHEET - line type '
                                   + CAST(LineTypeID AS varchar(10)) + '; only product and free text lines are read.'
        WHEN Outstanding <= 0 THEN 'NOT ON THE SHEET - nothing outstanding, the line is fully despatched.'
        WHEN Category = 'STOCK HELD' THEN 'NOT ON THE SHEET - the stock-held analysis code says Yes. Set it to No or blank on the product.'
        WHEN Category = 'BOUGHT IN'  THEN 'NOT ON THE SHEET - treated as bought in. Set the manufacturer to Tibard or Oliver Harvey.'
        WHEN Category LIKE 'NOTE%'   THEN 'ON THE SHEET only if this sales order also carries a works order or review line.'
        ELSE 'SHOULD BE ON THE SHEET as ' + Category + ' - refresh Special Makes Live.xlsx (Data > Refresh All).'
    END AS Reason
FROM candidates
ORDER BY Company, SalesOrderNo, LineSeq;


/* ---------------------------------------------------------------------------
   3. EVERY POPULATED ANALYSIS CODE SLOT, BOTH COMPANIES
   Use this when the stock-held flag is not where you expect it, or does not
   read as you expect. Values are in [brackets] so a leading space or a short
   form like [Y] is visible - neither matches the rule, and the item is then
   treated as a special make and put on the sheet.

   The slot the live query reads is AnalysisCode3 for Tibard and AnalysisCode7
   for Oliver Harvey. The two companies were set up separately; that difference
   is deliberate. If the Yes/No stock-held values turn up in a DIFFERENT slot
   here, that is the finding - the rule is reading the wrong field for this
   product, and the query needs changing rather than the product.

   SlotNo is in the select list on purpose: after a UNION, ORDER BY can only
   use columns that are selected.
--------------------------------------------------------------------------- */
SELECT 'TIBARD' AS Company,
       v.SlotNo,
       'AnalysisCode' + CAST(v.SlotNo AS varchar(2)) AS Slot,
       '[' + v.Val + ']'                             AS Value,
       CASE WHEN v.SlotNo = 3 THEN '<< the slot the query reads' ELSE '' END AS Note
FROM        S200_LIVE.dbo.StockItem si
CROSS APPLY (VALUES
        ( 1, ISNULL(si.AnalysisCode1,'')),
        ( 2, ISNULL(si.AnalysisCode2,'')),
        ( 3, ISNULL(si.AnalysisCode3,'')),
        ( 4, ISNULL(si.AnalysisCode4,'')),
        ( 5, ISNULL(si.AnalysisCode5,'')),
        ( 6, ISNULL(si.AnalysisCode6,'')),
        ( 7, ISNULL(si.AnalysisCode7,'')),
        ( 8, ISNULL(si.AnalysisCode8,'')),
        ( 9, ISNULL(si.AnalysisCode9,'')),
        (10, ISNULL(si.AnalysisCode10,'')),
        (11, ISNULL(si.AnalysisCode11,'')),
        (12, ISNULL(si.AnalysisCode12,'')),
        (13, ISNULL(si.AnalysisCode13,'')),
        (14, ISNULL(si.AnalysisCode14,'')),
        (15, ISNULL(si.AnalysisCode15,'')),
        (16, ISNULL(si.AnalysisCode16,'')),
        (17, ISNULL(si.AnalysisCode17,'')),
        (18, ISNULL(si.AnalysisCode18,'')),
        (19, ISNULL(si.AnalysisCode19,'')),
        (20, ISNULL(si.AnalysisCode20,''))
) v(SlotNo, Val)
WHERE LTRIM(RTRIM(si.Code)) = @Code
  AND NULLIF(v.Val,'') IS NOT NULL

UNION ALL

SELECT 'OLIVER HARVEY',
       v.SlotNo,
       'AnalysisCode' + CAST(v.SlotNo AS varchar(2)),
       '[' + v.Val + ']',
       CASE WHEN v.SlotNo = 7 THEN '<< the slot the query reads' ELSE '' END
FROM        OliverHarveyLive.dbo.StockItem si
CROSS APPLY (VALUES
        ( 1, ISNULL(si.AnalysisCode1,'')),
        ( 2, ISNULL(si.AnalysisCode2,'')),
        ( 3, ISNULL(si.AnalysisCode3,'')),
        ( 4, ISNULL(si.AnalysisCode4,'')),
        ( 5, ISNULL(si.AnalysisCode5,'')),
        ( 6, ISNULL(si.AnalysisCode6,'')),
        ( 7, ISNULL(si.AnalysisCode7,'')),
        ( 8, ISNULL(si.AnalysisCode8,'')),
        ( 9, ISNULL(si.AnalysisCode9,'')),
        (10, ISNULL(si.AnalysisCode10,'')),
        (11, ISNULL(si.AnalysisCode11,'')),
        (12, ISNULL(si.AnalysisCode12,'')),
        (13, ISNULL(si.AnalysisCode13,'')),
        (14, ISNULL(si.AnalysisCode14,'')),
        (15, ISNULL(si.AnalysisCode15,'')),
        (16, ISNULL(si.AnalysisCode16,'')),
        (17, ISNULL(si.AnalysisCode17,'')),
        (18, ISNULL(si.AnalysisCode18,'')),
        (19, ISNULL(si.AnalysisCode19,'')),
        (20, ISNULL(si.AnalysisCode20,''))
) v(SlotNo, Val)
WHERE LTRIM(RTRIM(si.Code)) = @Code
  AND NULLIF(v.Val,'') IS NOT NULL

ORDER BY Company, SlotNo;
