/* ============================================================================
   VALIDATION: would the rules have caught the special makes you raise today?

   The codes below are taken from the CURRENT manual special makes sheet, so
   they are known-good examples of what should produce a works order. This runs
   them through the exact classification the live query uses, and reports what
   each one would have done.

   This is the real test. Counting order lines tells you the volume looks
   plausible; this tells you the rules agree with what the office actually does.

   Any row reading "MISSED" is a special make the sheet would have dropped -
   each one needs explaining before this goes live.
   ========================================================================= */

WITH sample(Code) AS (
    SELECT * FROM (VALUES
        ('OHAPP0785191'),('OHAP300515C'),('OHCJSMOXFORD4401S'),('OHAPP054415'),
        ('OHCJSCUMBRIA3603'),('OHCJSCUMBRIA4203'),('OHCJSCUMBRIA4803'),
        ('OHCJSCUMBRIA6403L'),('OHKNAPP0630241/222HP2'),('OHAPP0617110/222CTS'),
        ('OHCJSMDEVON6401'),('OHAP053364'),('FENAP0534173'),('CICJM01935803'),
        ('OHCJSMOXFORD5001S'),('CICJ01935801S'),('CICJ01935203S'),
        ('OHCJSMOXFORD4403'),('OHCJSMOXFORD4003'),('OHCJMOXFORD4003'),
        ('WT4004MM01'),('CICJM0193XXS01')
    ) v(Code)
)

SELECT 'TIBARD' AS Company, s.Code AS SheetCode,
       ISNULL(NULLIF(si.AnalysisCode3,''),'(blank)')  AS StockHeldFlag,
       ISNULL(NULLIF(si.Manufacturer,''),'(blank)')   AS Manufacturer,
       CASE
         WHEN si.Code IS NULL                         THEN '-- not in this company --'
         WHEN si.AnalysisCode3 = 'Yes'                THEN 'MISSED - flagged stock held'
         WHEN si.Manufacturer LIKE '%Tibard%'
           OR si.Manufacturer LIKE '%Oliver Harvey%'  THEN 'WORKS ORDER'
         WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
                                                      THEN 'REVIEW - no manufacturer set'
         ELSE                                              'MISSED - reads as bought in'
       END AS Verdict
FROM       sample s
LEFT JOIN  S200_LIVE.dbo.StockItem si ON si.Code = s.Code

UNION ALL

SELECT 'OLIVER HARVEY', s.Code,
       'StockHeld[' + ISNULL(si.AnalysisCode3,'') + '] Website[' + ISNULL(si.AnalysisCode7,'') + ']',
       ISNULL(NULLIF(si.Manufacturer,''),'(blank)'),
       CASE
         WHEN si.Code IS NULL                         THEN '-- not in this company --'
         /* Oliver Harvey is stock held on EITHER code - see the header of
            10-special-makes-live.sql. Website implies stock there. */
         WHEN si.AnalysisCode3 = 'Yes'
           OR si.AnalysisCode7 = 'Yes'                THEN 'MISSED - flagged stock held'
         WHEN si.Manufacturer LIKE '%Tibard%'
           OR si.Manufacturer LIKE '%Oliver Harvey%'  THEN 'WORKS ORDER'
         WHEN NULLIF(LTRIM(RTRIM(si.Manufacturer)),'') IS NULL
                                                      THEN 'REVIEW - no manufacturer set'
         ELSE                                              'MISSED - reads as bought in'
       END
FROM       sample s
LEFT JOIN  OliverHarveyLive.dbo.StockItem si ON si.Code = s.Code

ORDER BY SheetCode, Company;
