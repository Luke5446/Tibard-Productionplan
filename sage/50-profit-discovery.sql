/* ============================================================================
   PROFIT PER PRODUCT PER MONTH - STEP 1, SCHEMA DISCOVERY
   Server TIB-SQL-002. Run in SSMS, or paste into Excel on its own - it is a
   single statement, so Power Query returns all of it.

   PURPOSE
   Find out what Sage records about the money on a sale, before designing
   anything around it. Same method as the special makes work: every schema
   guess made on this project so far has been wrong, and a profit report built
   on a column that means something else is worse than no report, because
   people act on it.

   NOTHING IS GUESSED HERE. This step only reads the catalogue - it names no
   table and no column of its own. Step 2 samples the real values, using the
   names this step returns.

   WHAT HAS TO BE ESTABLISHED, in order of how much it matters:

   1. IS THE COST OF SALE RECORDED PER LINE, AND WHEN?
      Revenue is easy, it is on the order line. Cost is the question. Sage can
      hold a cost on the order line and posts a cost of sale on despatch; those
      are not the same figure and can differ by a lot.

   2. WHICH TABLE HOLDS THE REALISED SALE?
      Profit should be measured on what was despatched or invoiced, not what
      was ordered. An order sitting on the system has made nothing and lost
      nothing.

   3. IS THE COST ON A GARMENT WE MAKE A REAL NUMBER?
      This decides whether the report is worth having at all. For goods we buy,
      Sage's cost is a purchase price and will be about right. For garments we
      MAKE, it is whatever was set up as a standard cost - and if that has not
      been maintained, the report will confidently show profit on products that
      lose money, which is the opposite of the point. Step 2 answers this.

   READING THE RESULT
     Section A   every SOP, despatch and invoice table, in BOTH companies.
                 Read the Company column: the two databases are expected to
                 match here, and the last thing that looked identical between
                 them - the analysis codes - was not.
     Section B   every money, quantity and date column on those tables.
                 The rows marked "<< COST" are the ones that matter.

   Send both sections back and step 2 will sample the real figures.
   ========================================================================= */

/* --- A: which tables exist, in both companies ---------------------------- */
SELECT 'A - tables'                    AS Section,
       t.TABLE_CATALOG                 AS Company,
       t.TABLE_NAME                    AS TableName,
       ''                              AS ColumnName,
       ''                              AS DataType,
       ''                              AS Note
FROM   S200_LIVE.INFORMATION_SCHEMA.TABLES t
WHERE  t.TABLE_TYPE = 'BASE TABLE'
  AND (t.TABLE_NAME LIKE 'SOP%' OR t.TABLE_NAME LIKE '%Despatch%'
       OR t.TABLE_NAME LIKE '%Invoice%')

UNION ALL

SELECT 'A - tables', t.TABLE_CATALOG, t.TABLE_NAME, '', '', ''
FROM   OliverHarveyLive.INFORMATION_SCHEMA.TABLES t
WHERE  t.TABLE_TYPE = 'BASE TABLE'
  AND (t.TABLE_NAME LIKE 'SOP%' OR t.TABLE_NAME LIKE '%Despatch%'
       OR t.TABLE_NAME LIKE '%Invoice%')

UNION ALL

/* --- B: the money, quantity and date columns on them --------------------- */
SELECT 'B - money columns',
       c.TABLE_CATALOG,
       c.TABLE_NAME,
       c.COLUMN_NAME,
       c.DATA_TYPE,
       CASE
         WHEN c.COLUMN_NAME LIKE '%Cost%'   THEN '<< COST - the column that decides everything'
         WHEN c.COLUMN_NAME LIKE '%Margin%' THEN '<< Sage may already work this out'
         ELSE ''
       END
FROM   S200_LIVE.INFORMATION_SCHEMA.COLUMNS c
WHERE (c.TABLE_NAME LIKE 'SOP%' OR c.TABLE_NAME LIKE '%Despatch%'
       OR c.TABLE_NAME LIKE '%Invoice%')
  AND (c.COLUMN_NAME LIKE '%Cost%'     OR c.COLUMN_NAME LIKE '%Price%'
       OR c.COLUMN_NAME LIKE '%Value%'    OR c.COLUMN_NAME LIKE '%Margin%'
       OR c.COLUMN_NAME LIKE '%Discount%'
       OR c.COLUMN_NAME LIKE '%Quantity%' OR c.COLUMN_NAME LIKE '%Qty%'
       OR c.COLUMN_NAME LIKE '%Date%')

UNION ALL

SELECT 'B - money columns', c.TABLE_CATALOG, c.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE,
       CASE
         WHEN c.COLUMN_NAME LIKE '%Cost%'   THEN '<< COST - the column that decides everything'
         WHEN c.COLUMN_NAME LIKE '%Margin%' THEN '<< Sage may already work this out'
         ELSE ''
       END
FROM   OliverHarveyLive.INFORMATION_SCHEMA.COLUMNS c
WHERE (c.TABLE_NAME LIKE 'SOP%' OR c.TABLE_NAME LIKE '%Despatch%'
       OR c.TABLE_NAME LIKE '%Invoice%')
  AND (c.COLUMN_NAME LIKE '%Cost%'     OR c.COLUMN_NAME LIKE '%Price%'
       OR c.COLUMN_NAME LIKE '%Value%'    OR c.COLUMN_NAME LIKE '%Margin%'
       OR c.COLUMN_NAME LIKE '%Discount%'
       OR c.COLUMN_NAME LIKE '%Quantity%' OR c.COLUMN_NAME LIKE '%Qty%'
       OR c.COLUMN_NAME LIKE '%Date%')

ORDER BY Section, Company, TableName, ColumnName;
