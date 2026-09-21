/* =========================================================================
   60-fabric-stock.sql  -  FABRIC STOCK for the buffer app's Fabric tab
   -------------------------------------------------------------------------
   Server TIB-SQL-002, database S200_LIVE (Tibard holds all the fabric).
   One row per fabric code: what is in stock at HOME, on order with the
   supplier, the minimum level set in Sage, the preferred supplier, and the
   price per metre. The app pastes this next to what its live works orders
   need and shows what is free to cut and what runs short.

   Paste the WHOLE file into the Excel connection, Refresh All, then copy
   columns A to N, all rows, without the header, into the Fabric tab.

   Output order is FIXED - the app parses by position:
     A FabricCode  B Description  C Unit  D SupplierAccount  E SupplierName
     F SupplierRef  G InStock  H Allocated  I OnOrder  J MinLevel
     K ReorderLevel  L ReorderQty  M CostPerMetre  N LeadDays

   FIRST RUN: step 0 below lists the columns of the stock tables. Sage's
   names are not always what you expect (see 00-discovery.sql). If any name
   in the main query is wrong on your version, Excel says so on refresh - fix
   it here and refresh again. Remove step 0 once the sheet works; Excel only
   reads the FIRST result set of a batch.

   WHICH ITEMS ARE FABRIC: two nets. (1) Every fabric code the works orders
   already use - the All Costings usage table and the Sage fabric price list,
   753 codes, listed at the bottom. (2) Any product group named in
   fabric_groups. Fill fabric_groups from step 0.2 so a new cloth reaches the
   sheet before its first works order.
   ========================================================================= */

/* --- 0.1  The stock tables' columns (delete once confirmed) -------------- */
SELECT  TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM    S200_LIVE.INFORMATION_SCHEMA.COLUMNS
WHERE   TABLE_NAME IN ('StockItem','WarehouseItem','Warehouse','BinItem',
                       'StockItemSupplier','PLSupplierAccount',
                       'POPOrderReturn','POPOrderReturnLine','StockItemUnit')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

/* --- 0.2  Which product groups hold the fabric? --------------------------- */
SELECT  pg.Code, pg.Description, COUNT(*) AS Items, COUNT(k.Code) AS KnownFabricCodes
FROM    S200_LIVE.dbo.StockItem si
JOIN    S200_LIVE.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
LEFT JOIN (SELECT Code FROM (VALUES
('BA1001'), ('BACKING01'), ('CLOTHWONDERDRY55'), ('CMP-WEB-PU-25-01'), ('CMP-WEB-PU-25-03'), ('CMP-WEB-PU-25-04'),
('CMP-WEB-PU-25-06'), ('CMP-WEB-PU-25-11'), ('CMP-WEB-PU-25-131'), ('CMP-WEB-PU-25-14'), ('CMP-WEB-PU-25-15'), ('CMP-WEB-PU-25-24'),
('CMP-WEB-PU-25-286'), ('CMP-WEB-PU-25-82'), ('CMP-WEB-PU-25-83'), ('CMP-WEB-PU-25-921'), ('CO1021153'), ('CO10299'),
('CO1031'), ('CO1041'), ('CO1045'), ('CO1049'), ('CO1114214'), ('CO1126'),
('CO1203201'), ('CO1Q105261'), ('CO2001'), ('CO2001OSPREY'), ('CO2003'), ('CO2014'),
('CO2015'), ('CO2BLUEPDOT'), ('CO2COW'), ('CO2DAISEYDEGG'), ('CO2DAISEYLIME'), ('CO2SAGEMEADOW'),
('CO2TAUPEMEADOW'), ('CO2TAUPEPDOT'), ('CO3001'), ('CO3047'), ('CO3153'), ('CO4001'),
('CO4001KIM'), ('CO4001NH3'), ('CO4026'), ('CO4149'), ('CO5001'), ('CO5001ECO'),
('CO5003'), ('CO5003DEN'), ('CO5003ECO'), ('CO5004'), ('CO5005'), ('CO5007'),
('CO5008'), ('CO5011'), ('CO5014DEN'), ('CO5015'), ('CO5015DEN'), ('CO5015ECO'),
('CO5022'), ('CO5024'), ('CO5083'), ('CO5083ECO'), ('CO5105'), ('CO5153'),
('CO5153ECO'), ('CO5173'), ('CO5173ECO'), ('CO5191'), ('CO5209'), ('CO5211'),
('CO5222'), ('CO5222ECO'), ('CO5224DEN'), ('CO5241'), ('CO5241ECO'), ('CO5345'),
('CO5364'), ('CO5364ECO'), ('CO5368'), ('CO5394'), ('CO545'), ('CO550514'),
('CO5TEXAS911'), ('CO5TEXAS912'), ('CO5TEXAS913'), ('CO5TEXAS918'), ('CO6001'), ('CO6030'),
('CO6032'), ('CO6034'), ('CO6035'), ('CO7001'), ('CO7003'), ('CO7007'),
('CO7015'), ('CO7224'), ('CO7224/01'), ('CO7224STRIPE'), ('CO884533'), ('CO8880254'),
('CO980MULTISTRIPE'), ('COA54431151'), ('COA54716/82'), ('COATEDBLACK'), ('COATEDHARLEQUIN'), ('COCANVAS'),
('CODENIM1015'), ('COORGANIC01'), ('COPREM241'), ('COR4743103'), ('COR47431147'), ('COWXFBRC15'),
('CPLQ36831'), ('FUS1256'), ('FUS4420'), ('FUS9657'), ('HEATWAD'), ('LEATHERHIDE'),
('LINMONTE128'), ('LINMONTE156'), ('LINMONTE375'), ('MESH2290901'), ('MESH2290903'), ('MESHPW31401'),
('MESHPW31407'), ('MESHPW31415'), ('MESHPW31424'), ('MESHPW314286'), ('MESHRPM37603'), ('NOPW2015'),
('NY1055'), ('NYAN4T03'), ('NYRN21403'), ('PC0715'), ('PC10001'), ('PC10003'),
('PC1001'), ('PC1002'), ('PC1003'), ('PC1004'), ('PC1005'), ('PC1007'),
('PC1008'), ('PC10134'), ('PC1014'), ('PC1015'), ('PC1016'), ('PC1022'),
('PC1023'), ('PC1030'), ('PC1031'), ('PC1032'), ('PC1034'), ('PC1053'),
('PC1055'), ('PC1066'), ('PC106814'), ('PC1079'), ('PC1081'), ('PC1082'),
('PC1089'), ('PC10RPC03'), ('PC10RPC10455'), ('PC10RPC199323'), ('PC10RPC26707'), ('PC10ST8800W03'),
('PC11001'), ('PC1108'), ('PC1110631'), ('PC11122101'), ('PC1113189'), ('PC1115'),
('PC1116573'), ('PC1120547'), ('PC1123'), ('PC1132'), ('PC1135'), ('PC1161'),
('PC1165702'), ('PC11657270'), ('PC12001'), ('PC1216115'), ('PC126211'), ('PC1270'),
('PC1271'), ('PC13001'), ('PC13003'), ('PC13PERMA01'), ('PC14001'), ('PC14001FG'),
('PC14003'), ('PC141/216115'), ('PC141/995164'), ('PC15001'), ('PC16026'), ('PC1786554'),
('PC18AZURE16'), ('PC19037104'), ('PC19037240'), ('PC1906501'), ('PC1906503'), ('PC1906507'),
('PC1910514'), ('PC1911303'), ('PC1920914'), ('PC1923933'), ('PC1960331'), ('PC1962230'),
('PC1962534'), ('PC19898108'), ('PC1CPC1637147'), ('PC1CPC165708'), ('PC1D32888'), ('PC1HPW151530'),
('PC1HPW151531'), ('PC1HPW197132'), ('PC1HPW197134'), ('PC1JAK116655'), ('PC1K71701'), ('PC1KG003089'),
('PC1KG00789'), ('PC1L21716'), ('PC1L236132'), ('PC1M130155'), ('PC1M15123'), ('PC1M2416'),
('PC1M242281'), ('PC1M35504'), ('PC1RPC199303'), ('PC1S1048455'), ('PC1S41131545'), ('PC1S4116516'),
('PC1S4121988'), ('PC1S4122622'), ('PC1S4125645'), ('PC1S4127479'), ('PC1S4157207'), ('PC1S4165055'),
('PC1S4183714'), ('PC1VSL15005'), ('PC1VSL665123'), ('PC1XD13207'), ('PC1XD13455'), ('PC1XD136259'),
('PC1XD13724'), ('PC1XD19315'), ('PC1XD26114'), ('PC1XD327256'), ('PC1XD35022'), ('PC1XD35223'),
('PC1XD35315'), ('PC1XD35705'), ('PC1XD36814'), ('PC1XD36914'), ('PC2001'), ('PC2001ECO'),
('PC2001R'), ('PC2002'), ('PC20028'), ('PC2003'), ('PC2003ECO'), ('PC2003ECOECO'),
('PC2004'), ('PC2004A'), ('PC2005'), ('PC2007'), ('PC2007ECO'), ('PC2007S'),
('PC2008'), ('PC2011'), ('PC2014'), ('PC2014/104'), ('PC2015'), ('PC2015ECO'),
('PC2015S'), ('PC2016'), ('PC2017'), ('PC2018'), ('PC2019'), ('PC2020'),
('PC2021'), ('PC2022'), ('PC2023'), ('PC2024'), ('PC2025'), ('PC2026'),
('PC20267'), ('PC2027'), ('PC2028'), ('PC2030'), ('PC2031'), ('PC2032'),
('PC2034'), ('PC2038'), ('PC2044'), ('PC2045'), ('PC2047'), ('PC2051301'),
('PC2052'), ('PC2055'), ('PC2056'), ('PC2058'), ('PC2064'), ('PC2064ECO'),
('PC2065'), ('PC2068'), ('PC2072'), ('PC2079'), ('PC2080'), ('PC2082'),
('PC2082ECO'), ('PC2083'), ('PC2083ECO'), ('PC2092'), ('PC2093'), ('PC2098'),
('PC2102'), ('PC2105'), ('PC2109'), ('PC2115'), ('PC2115N'), ('PC2116718'),
('PC2118'), ('PC2120'), ('PC2121'), ('PC2124'), ('PC2129'), ('PC212MM47'),
('PC2130'), ('PC2131'), ('PC2134'), ('PC2136'), ('PC2138'), ('PC2141232'),
('PC21413219'), ('PC2141434'), ('PC2143'), ('PC2146780H'), ('PC2149'), ('PC2153'),
('PC2156'), ('PC2157'), ('PC2157SC'), ('PC21580VARI'), ('PC2162'), ('PC2191'),
('PC2194'), ('PC2208'), ('PC2213'), ('PC2217'), ('PC2221'), ('PC2225'),
('PC2226'), ('PC2241'), ('PC2245'), ('PC2246'), ('PC2247'), ('PC2249'),
('PC2252'), ('PC2253'), ('PC2257'), ('PC2264'), ('PC2277'), ('PC2284'),
('PC2286'), ('PC2293'), ('PC2297'), ('PC23022033'), ('PC23022136'), ('PC2302230'),
('PC2302231'), ('PC2302232'), ('PC2302234'), ('PC2362'), ('PC2363'), ('PC2384'),
('PC2420'), ('PC2458'), ('PC2700/831'), ('PC2700/930'), ('PC2ALPHA501'), ('PC2ALTCHK'),
('PC2BGC'), ('PC2BU'), ('PC2COW'), ('PC2CS0331'), ('PC2CUP1'), ('PC2CUP2'),
('PC2DEN'), ('PC2DU'), ('PC2EUROPA32'), ('PC2FISH89'), ('PC2FUNBUGS07'), ('PC2GDU'),
('PC2HOUNDSTOOTH'), ('PC2JACK31'), ('PC2K71630'), ('PC2K71631'), ('PC2LAT'), ('PC2ORCHID04'),
('PC2P/WALES'), ('PC2PASTA'), ('PC2PEBBLE07'), ('PC2PEBBLE16'), ('PC2PEBBLE23'), ('PC2PEBBLE45'),
('PC2PRETTYPINK04'), ('PC2ROSITA04'), ('PC2ROSITABS'), ('PC2ROYALBOX217'), ('PC2STORM14'), ('PC2SW'),
('PC2TANTARA124730'), ('PC2UNIONJACK'), ('PC2UTEX03'), ('PC2VINO'), ('PC2WAFFLE'), ('PC2X13304'),
('PC2X13306'), ('PC2X13307'), ('PC2X13308'), ('PC2X13311'), ('PC2X133124'), ('PC2X133153'),
('PC2X13316'), ('PC2X133180'), ('PC2X133180VAT'), ('PC2X133239'), ('PC2X133276'), ('PC2X133368'),
('PC2X13383'), ('PC2ZEBRA47'), ('PC2ZEBRA48'), ('PC3072'), ('PC4001'), ('PC4003ELAST'),
('PC4014'), ('PC4032'), ('PC4134'), ('PC5003'), ('PC5008'), ('PC5014'),
('PC5015'), ('PC5017'), ('PC5024'), ('PC5055'), ('PC5055RN'), ('PC5115'),
('PC5135'), ('PC5293'), ('PC5357'), ('PC5677'), ('PC6001'), ('PC6003'),
('PC6005'), ('PC6007'), ('PC6014'), ('PC6015'), ('PC6015D'), ('PC6018'),
('PC6019'), ('PC6024'), ('PC6045'), ('PC6045A'), ('PC6082'), ('PC6083'),
('PC6093'), ('PC6147'), ('PC6153'), ('PC6156'), ('PC6173'), ('PC6200'),
('PC6234'), ('PC6305'), ('PC6312'), ('PC6335'), ('PC6366'), ('PC6397'),
('PC6687'), ('PC6CENTURYRED'), ('PC6X42014'), ('PC7008'), ('PC7016'), ('PC7023'),
('PC7055'), ('PC7115'), ('PC725101'), ('PC725115D'), ('PC75505360'), ('PC8089'),
('PC8W127330'), ('PC9001'), ('PC9003'), ('PC9014'), ('PC9015'), ('PC9016'),
('PC9019'), ('PC90242'), ('PC9068'), ('PC90681'), ('PC90682'), ('PC9999K215'),
('PC999K215'), ('PC999K382'), ('PCATHENA07'), ('PCATHENA155'), ('PCBROOKLYN271'), ('PCCOOLTEX01'),
('PCECO520128'), ('PCEXCELSIOR153'), ('PCFLEXI03'), ('PCGALENT01'), ('PCHARLEQUIN'), ('PCMAJESTIC01'),
('PCPL067281'), ('PCRIPSTOP03'), ('PCROYALE14/01'), ('PCROYALE15/01'), ('PCTIBARD'), ('PCTROP068'),
('PCUTEX01'), ('PCVSL41/85123'), ('PCX781109T'), ('PCX781116T'), ('PCX781135T'), ('PCXD13682'),
('PCXD32716'), ('PO1001'), ('PO1005'), ('PO1023'), ('PO1030'), ('PO1031'),
('PO1037'), ('PO1042'), ('PO1045'), ('PO1055'), ('PO1060'), ('PO1066'),
('PO1068'), ('PO1077'), ('PO1115'), ('PO1134'), ('PO1171'), ('PO1174'),
('PO1200'), ('PO1205'), ('PO1420115'), ('PO142045'), ('PO1BINARY115'), ('PO1BITZY31'),
('PO1HP205215'), ('PO1HP205255'), ('PO1HP2345115'), ('PO1HP234716'), ('PO1HP235545'), ('PO1HP2359115'),
('PO1HP237316'), ('PO1KELLY07'), ('PO1LOD901'), ('PO1MA055701'), ('PO1MARNIE108'), ('PO1MT745166'),
('PO1PYRAMID65'), ('PO1SOPHIE107'), ('PO1SOPHIE2135'), ('PO1SPANGLE07'), ('PO1SPANGLE66'), ('PO1UP978/142'),
('PO2001'), ('PO3003'), ('PO3005'), ('PO3007'), ('PO3015'), ('PO3023'),
('PO3024'), ('PO3055'), ('PO4015'), ('PO5001'), ('PO5001PU'), ('PO5003'),
('PO5005'), ('PO5007'), ('PO5015'), ('PO5015PU'), ('PO5022PU'), ('PO5023'),
('PO5024'), ('PO5024PU'), ('PO5055'), ('PO5079'), ('PO5088'), ('PO5134'),
('PO5266'), ('PO5286PU'), ('PO5300'), ('PO5693'), ('PO5P10315'), ('PO5P27203'),
('PO7001'), ('PO7001FLO'), ('PO7005'), ('PO7014'), ('PO7015'), ('PO7017'),
('PO7024'), ('PO7055'), ('PO7128'), ('PO7128TAL'), ('POADELE89'), ('POALICE108'),
('POANITA15'), ('POBAM03'), ('POBAM224'), ('POBAM236'), ('POCANASTA15'), ('POCARLTONC102707'),
('POCCT48215'), ('POCLAUDETTE15'), ('POCYCLONE07'), ('POCYCLONE55'), ('PODAWN01'), ('PODAWN15'),
('PODIAZ15'), ('PODOMINO89'), ('PODRAX15'), ('PODRAXD100516'), ('PODRAXDA00415'), ('PODRAXDA02103'),
('PODRAXDA09715'), ('PODRAXDA197055'), ('PODRAXDA501545'), ('PODUNSTER08'), ('POESHOLT303'), ('POESHOLTA16905'),
('POESHOLTA16915'), ('POESHOLTES02966'), ('POESHOLTES09508'), ('POESHOLTES13907'), ('POESHOLTES17555'), ('POESHOLTES187134'),
('POESHOLTES24708'), ('POHAWORTHHW612165'), ('POHP205217'), ('POJANE65'), ('POKELLY07'), ('POLORNA81'),
('POMICROPECHE01'), ('POMIXTURES'), ('POPLAZA03'), ('POPOINTE03'), ('POQUILT01'), ('POQUILT20'),
('POQUILT45'), ('PORPM250P07'), ('PORPM250P08'), ('PORPM250P11'), ('PORPM250P23'), ('PORPM250P55'),
('POSPANGLE15'), ('POT08391'), ('POT379160'), ('POT40607'), ('POT48201'), ('POT48203'),
('POT48204'), ('POT48204A'), ('POT48204C'), ('POT48207'), ('POT48208'), ('POT482115'),
('POT482134'), ('POT48214'), ('POT48216'), ('POT482198'), ('POT482301'), ('POT48240'),
('POT48282'), ('POTANGO07'), ('POTANGO15'), ('POTANGO16'), ('POTANGO66'), ('POWESSEX89'),
('POWHISPERS'), ('POXSTATIC03'), ('POXSTATIC08'), ('POXSTATIC08HS'), ('POXSTATIC131'), ('POXSTATIC160'),
('POXSTATIC211'), ('POXSTATIC224'), ('POXSTATIC236'), ('PT2COOLCEL01'), ('PV1010'), ('PV10447426'),
('PV1086'), ('PV1BA004T089'), ('PV1W113590'), ('PV1W82515'), ('PV2007AR14'), ('PV2007CR14'),
('PV2145'), ('PV2146'), ('PVC600D03'), ('PW1002128'), ('PW1003'), ('PW100314'),
('PW100424'), ('PW1005'), ('PW100515'), ('PW1014'), ('PW1015'), ('PW10161'),
('PW102424'), ('PW1044209'), ('PW104782'), ('PW1094'), ('PW11600181'), ('PW1161165'),
('PW124955'), ('PW2003'), ('PW2005'), ('PW2013'), ('PW2014'), ('PW2015'),
('PW2023'), ('PW2033'), ('PW2082'), ('PW2105'), ('PW2132'), ('PW2181'),
('PW2182'), ('PW3014'), ('PW3016'), ('PW3055'), ('PW4014'), ('PW4015'),
('PW4055'), ('PWFLEETHAM80'), ('PWL03'), ('PWL128'), ('PWWESTON08405'), ('PWWESTON80555'),
('TR90X12P01'), ('WEBBING921'), ('WO1003'), ('WO1030'), ('WO12217181'), ('WO1332531'),
('WO13532128'), ('WPL003'), ('WPL015')
        ) AS known(Code)) k ON k.Code = si.Code
GROUP BY pg.Code, pg.Description
HAVING  COUNT(k.Code) > 0
ORDER BY KnownFabricCodes DESC;

/* ========================================================================
   THE SHEET
   ======================================================================== */
WITH known AS (
    SELECT Code FROM (VALUES
('BA1001'), ('BACKING01'), ('CLOTHWONDERDRY55'), ('CMP-WEB-PU-25-01'), ('CMP-WEB-PU-25-03'), ('CMP-WEB-PU-25-04'),
('CMP-WEB-PU-25-06'), ('CMP-WEB-PU-25-11'), ('CMP-WEB-PU-25-131'), ('CMP-WEB-PU-25-14'), ('CMP-WEB-PU-25-15'), ('CMP-WEB-PU-25-24'),
('CMP-WEB-PU-25-286'), ('CMP-WEB-PU-25-82'), ('CMP-WEB-PU-25-83'), ('CMP-WEB-PU-25-921'), ('CO1021153'), ('CO10299'),
('CO1031'), ('CO1041'), ('CO1045'), ('CO1049'), ('CO1114214'), ('CO1126'),
('CO1203201'), ('CO1Q105261'), ('CO2001'), ('CO2001OSPREY'), ('CO2003'), ('CO2014'),
('CO2015'), ('CO2BLUEPDOT'), ('CO2COW'), ('CO2DAISEYDEGG'), ('CO2DAISEYLIME'), ('CO2SAGEMEADOW'),
('CO2TAUPEMEADOW'), ('CO2TAUPEPDOT'), ('CO3001'), ('CO3047'), ('CO3153'), ('CO4001'),
('CO4001KIM'), ('CO4001NH3'), ('CO4026'), ('CO4149'), ('CO5001'), ('CO5001ECO'),
('CO5003'), ('CO5003DEN'), ('CO5003ECO'), ('CO5004'), ('CO5005'), ('CO5007'),
('CO5008'), ('CO5011'), ('CO5014DEN'), ('CO5015'), ('CO5015DEN'), ('CO5015ECO'),
('CO5022'), ('CO5024'), ('CO5083'), ('CO5083ECO'), ('CO5105'), ('CO5153'),
('CO5153ECO'), ('CO5173'), ('CO5173ECO'), ('CO5191'), ('CO5209'), ('CO5211'),
('CO5222'), ('CO5222ECO'), ('CO5224DEN'), ('CO5241'), ('CO5241ECO'), ('CO5345'),
('CO5364'), ('CO5364ECO'), ('CO5368'), ('CO5394'), ('CO545'), ('CO550514'),
('CO5TEXAS911'), ('CO5TEXAS912'), ('CO5TEXAS913'), ('CO5TEXAS918'), ('CO6001'), ('CO6030'),
('CO6032'), ('CO6034'), ('CO6035'), ('CO7001'), ('CO7003'), ('CO7007'),
('CO7015'), ('CO7224'), ('CO7224/01'), ('CO7224STRIPE'), ('CO884533'), ('CO8880254'),
('CO980MULTISTRIPE'), ('COA54431151'), ('COA54716/82'), ('COATEDBLACK'), ('COATEDHARLEQUIN'), ('COCANVAS'),
('CODENIM1015'), ('COORGANIC01'), ('COPREM241'), ('COR4743103'), ('COR47431147'), ('COWXFBRC15'),
('CPLQ36831'), ('FUS1256'), ('FUS4420'), ('FUS9657'), ('HEATWAD'), ('LEATHERHIDE'),
('LINMONTE128'), ('LINMONTE156'), ('LINMONTE375'), ('MESH2290901'), ('MESH2290903'), ('MESHPW31401'),
('MESHPW31407'), ('MESHPW31415'), ('MESHPW31424'), ('MESHPW314286'), ('MESHRPM37603'), ('NOPW2015'),
('NY1055'), ('NYAN4T03'), ('NYRN21403'), ('PC0715'), ('PC10001'), ('PC10003'),
('PC1001'), ('PC1002'), ('PC1003'), ('PC1004'), ('PC1005'), ('PC1007'),
('PC1008'), ('PC10134'), ('PC1014'), ('PC1015'), ('PC1016'), ('PC1022'),
('PC1023'), ('PC1030'), ('PC1031'), ('PC1032'), ('PC1034'), ('PC1053'),
('PC1055'), ('PC1066'), ('PC106814'), ('PC1079'), ('PC1081'), ('PC1082'),
('PC1089'), ('PC10RPC03'), ('PC10RPC10455'), ('PC10RPC199323'), ('PC10RPC26707'), ('PC10ST8800W03'),
('PC11001'), ('PC1108'), ('PC1110631'), ('PC11122101'), ('PC1113189'), ('PC1115'),
('PC1116573'), ('PC1120547'), ('PC1123'), ('PC1132'), ('PC1135'), ('PC1161'),
('PC1165702'), ('PC11657270'), ('PC12001'), ('PC1216115'), ('PC126211'), ('PC1270'),
('PC1271'), ('PC13001'), ('PC13003'), ('PC13PERMA01'), ('PC14001'), ('PC14001FG'),
('PC14003'), ('PC141/216115'), ('PC141/995164'), ('PC15001'), ('PC16026'), ('PC1786554'),
('PC18AZURE16'), ('PC19037104'), ('PC19037240'), ('PC1906501'), ('PC1906503'), ('PC1906507'),
('PC1910514'), ('PC1911303'), ('PC1920914'), ('PC1923933'), ('PC1960331'), ('PC1962230'),
('PC1962534'), ('PC19898108'), ('PC1CPC1637147'), ('PC1CPC165708'), ('PC1D32888'), ('PC1HPW151530'),
('PC1HPW151531'), ('PC1HPW197132'), ('PC1HPW197134'), ('PC1JAK116655'), ('PC1K71701'), ('PC1KG003089'),
('PC1KG00789'), ('PC1L21716'), ('PC1L236132'), ('PC1M130155'), ('PC1M15123'), ('PC1M2416'),
('PC1M242281'), ('PC1M35504'), ('PC1RPC199303'), ('PC1S1048455'), ('PC1S41131545'), ('PC1S4116516'),
('PC1S4121988'), ('PC1S4122622'), ('PC1S4125645'), ('PC1S4127479'), ('PC1S4157207'), ('PC1S4165055'),
('PC1S4183714'), ('PC1VSL15005'), ('PC1VSL665123'), ('PC1XD13207'), ('PC1XD13455'), ('PC1XD136259'),
('PC1XD13724'), ('PC1XD19315'), ('PC1XD26114'), ('PC1XD327256'), ('PC1XD35022'), ('PC1XD35223'),
('PC1XD35315'), ('PC1XD35705'), ('PC1XD36814'), ('PC1XD36914'), ('PC2001'), ('PC2001ECO'),
('PC2001R'), ('PC2002'), ('PC20028'), ('PC2003'), ('PC2003ECO'), ('PC2003ECOECO'),
('PC2004'), ('PC2004A'), ('PC2005'), ('PC2007'), ('PC2007ECO'), ('PC2007S'),
('PC2008'), ('PC2011'), ('PC2014'), ('PC2014/104'), ('PC2015'), ('PC2015ECO'),
('PC2015S'), ('PC2016'), ('PC2017'), ('PC2018'), ('PC2019'), ('PC2020'),
('PC2021'), ('PC2022'), ('PC2023'), ('PC2024'), ('PC2025'), ('PC2026'),
('PC20267'), ('PC2027'), ('PC2028'), ('PC2030'), ('PC2031'), ('PC2032'),
('PC2034'), ('PC2038'), ('PC2044'), ('PC2045'), ('PC2047'), ('PC2051301'),
('PC2052'), ('PC2055'), ('PC2056'), ('PC2058'), ('PC2064'), ('PC2064ECO'),
('PC2065'), ('PC2068'), ('PC2072'), ('PC2079'), ('PC2080'), ('PC2082'),
('PC2082ECO'), ('PC2083'), ('PC2083ECO'), ('PC2092'), ('PC2093'), ('PC2098'),
('PC2102'), ('PC2105'), ('PC2109'), ('PC2115'), ('PC2115N'), ('PC2116718'),
('PC2118'), ('PC2120'), ('PC2121'), ('PC2124'), ('PC2129'), ('PC212MM47'),
('PC2130'), ('PC2131'), ('PC2134'), ('PC2136'), ('PC2138'), ('PC2141232'),
('PC21413219'), ('PC2141434'), ('PC2143'), ('PC2146780H'), ('PC2149'), ('PC2153'),
('PC2156'), ('PC2157'), ('PC2157SC'), ('PC21580VARI'), ('PC2162'), ('PC2191'),
('PC2194'), ('PC2208'), ('PC2213'), ('PC2217'), ('PC2221'), ('PC2225'),
('PC2226'), ('PC2241'), ('PC2245'), ('PC2246'), ('PC2247'), ('PC2249'),
('PC2252'), ('PC2253'), ('PC2257'), ('PC2264'), ('PC2277'), ('PC2284'),
('PC2286'), ('PC2293'), ('PC2297'), ('PC23022033'), ('PC23022136'), ('PC2302230'),
('PC2302231'), ('PC2302232'), ('PC2302234'), ('PC2362'), ('PC2363'), ('PC2384'),
('PC2420'), ('PC2458'), ('PC2700/831'), ('PC2700/930'), ('PC2ALPHA501'), ('PC2ALTCHK'),
('PC2BGC'), ('PC2BU'), ('PC2COW'), ('PC2CS0331'), ('PC2CUP1'), ('PC2CUP2'),
('PC2DEN'), ('PC2DU'), ('PC2EUROPA32'), ('PC2FISH89'), ('PC2FUNBUGS07'), ('PC2GDU'),
('PC2HOUNDSTOOTH'), ('PC2JACK31'), ('PC2K71630'), ('PC2K71631'), ('PC2LAT'), ('PC2ORCHID04'),
('PC2P/WALES'), ('PC2PASTA'), ('PC2PEBBLE07'), ('PC2PEBBLE16'), ('PC2PEBBLE23'), ('PC2PEBBLE45'),
('PC2PRETTYPINK04'), ('PC2ROSITA04'), ('PC2ROSITABS'), ('PC2ROYALBOX217'), ('PC2STORM14'), ('PC2SW'),
('PC2TANTARA124730'), ('PC2UNIONJACK'), ('PC2UTEX03'), ('PC2VINO'), ('PC2WAFFLE'), ('PC2X13304'),
('PC2X13306'), ('PC2X13307'), ('PC2X13308'), ('PC2X13311'), ('PC2X133124'), ('PC2X133153'),
('PC2X13316'), ('PC2X133180'), ('PC2X133180VAT'), ('PC2X133239'), ('PC2X133276'), ('PC2X133368'),
('PC2X13383'), ('PC2ZEBRA47'), ('PC2ZEBRA48'), ('PC3072'), ('PC4001'), ('PC4003ELAST'),
('PC4014'), ('PC4032'), ('PC4134'), ('PC5003'), ('PC5008'), ('PC5014'),
('PC5015'), ('PC5017'), ('PC5024'), ('PC5055'), ('PC5055RN'), ('PC5115'),
('PC5135'), ('PC5293'), ('PC5357'), ('PC5677'), ('PC6001'), ('PC6003'),
('PC6005'), ('PC6007'), ('PC6014'), ('PC6015'), ('PC6015D'), ('PC6018'),
('PC6019'), ('PC6024'), ('PC6045'), ('PC6045A'), ('PC6082'), ('PC6083'),
('PC6093'), ('PC6147'), ('PC6153'), ('PC6156'), ('PC6173'), ('PC6200'),
('PC6234'), ('PC6305'), ('PC6312'), ('PC6335'), ('PC6366'), ('PC6397'),
('PC6687'), ('PC6CENTURYRED'), ('PC6X42014'), ('PC7008'), ('PC7016'), ('PC7023'),
('PC7055'), ('PC7115'), ('PC725101'), ('PC725115D'), ('PC75505360'), ('PC8089'),
('PC8W127330'), ('PC9001'), ('PC9003'), ('PC9014'), ('PC9015'), ('PC9016'),
('PC9019'), ('PC90242'), ('PC9068'), ('PC90681'), ('PC90682'), ('PC9999K215'),
('PC999K215'), ('PC999K382'), ('PCATHENA07'), ('PCATHENA155'), ('PCBROOKLYN271'), ('PCCOOLTEX01'),
('PCECO520128'), ('PCEXCELSIOR153'), ('PCFLEXI03'), ('PCGALENT01'), ('PCHARLEQUIN'), ('PCMAJESTIC01'),
('PCPL067281'), ('PCRIPSTOP03'), ('PCROYALE14/01'), ('PCROYALE15/01'), ('PCTIBARD'), ('PCTROP068'),
('PCUTEX01'), ('PCVSL41/85123'), ('PCX781109T'), ('PCX781116T'), ('PCX781135T'), ('PCXD13682'),
('PCXD32716'), ('PO1001'), ('PO1005'), ('PO1023'), ('PO1030'), ('PO1031'),
('PO1037'), ('PO1042'), ('PO1045'), ('PO1055'), ('PO1060'), ('PO1066'),
('PO1068'), ('PO1077'), ('PO1115'), ('PO1134'), ('PO1171'), ('PO1174'),
('PO1200'), ('PO1205'), ('PO1420115'), ('PO142045'), ('PO1BINARY115'), ('PO1BITZY31'),
('PO1HP205215'), ('PO1HP205255'), ('PO1HP2345115'), ('PO1HP234716'), ('PO1HP235545'), ('PO1HP2359115'),
('PO1HP237316'), ('PO1KELLY07'), ('PO1LOD901'), ('PO1MA055701'), ('PO1MARNIE108'), ('PO1MT745166'),
('PO1PYRAMID65'), ('PO1SOPHIE107'), ('PO1SOPHIE2135'), ('PO1SPANGLE07'), ('PO1SPANGLE66'), ('PO1UP978/142'),
('PO2001'), ('PO3003'), ('PO3005'), ('PO3007'), ('PO3015'), ('PO3023'),
('PO3024'), ('PO3055'), ('PO4015'), ('PO5001'), ('PO5001PU'), ('PO5003'),
('PO5005'), ('PO5007'), ('PO5015'), ('PO5015PU'), ('PO5022PU'), ('PO5023'),
('PO5024'), ('PO5024PU'), ('PO5055'), ('PO5079'), ('PO5088'), ('PO5134'),
('PO5266'), ('PO5286PU'), ('PO5300'), ('PO5693'), ('PO5P10315'), ('PO5P27203'),
('PO7001'), ('PO7001FLO'), ('PO7005'), ('PO7014'), ('PO7015'), ('PO7017'),
('PO7024'), ('PO7055'), ('PO7128'), ('PO7128TAL'), ('POADELE89'), ('POALICE108'),
('POANITA15'), ('POBAM03'), ('POBAM224'), ('POBAM236'), ('POCANASTA15'), ('POCARLTONC102707'),
('POCCT48215'), ('POCLAUDETTE15'), ('POCYCLONE07'), ('POCYCLONE55'), ('PODAWN01'), ('PODAWN15'),
('PODIAZ15'), ('PODOMINO89'), ('PODRAX15'), ('PODRAXD100516'), ('PODRAXDA00415'), ('PODRAXDA02103'),
('PODRAXDA09715'), ('PODRAXDA197055'), ('PODRAXDA501545'), ('PODUNSTER08'), ('POESHOLT303'), ('POESHOLTA16905'),
('POESHOLTA16915'), ('POESHOLTES02966'), ('POESHOLTES09508'), ('POESHOLTES13907'), ('POESHOLTES17555'), ('POESHOLTES187134'),
('POESHOLTES24708'), ('POHAWORTHHW612165'), ('POHP205217'), ('POJANE65'), ('POKELLY07'), ('POLORNA81'),
('POMICROPECHE01'), ('POMIXTURES'), ('POPLAZA03'), ('POPOINTE03'), ('POQUILT01'), ('POQUILT20'),
('POQUILT45'), ('PORPM250P07'), ('PORPM250P08'), ('PORPM250P11'), ('PORPM250P23'), ('PORPM250P55'),
('POSPANGLE15'), ('POT08391'), ('POT379160'), ('POT40607'), ('POT48201'), ('POT48203'),
('POT48204'), ('POT48204A'), ('POT48204C'), ('POT48207'), ('POT48208'), ('POT482115'),
('POT482134'), ('POT48214'), ('POT48216'), ('POT482198'), ('POT482301'), ('POT48240'),
('POT48282'), ('POTANGO07'), ('POTANGO15'), ('POTANGO16'), ('POTANGO66'), ('POWESSEX89'),
('POWHISPERS'), ('POXSTATIC03'), ('POXSTATIC08'), ('POXSTATIC08HS'), ('POXSTATIC131'), ('POXSTATIC160'),
('POXSTATIC211'), ('POXSTATIC224'), ('POXSTATIC236'), ('PT2COOLCEL01'), ('PV1010'), ('PV10447426'),
('PV1086'), ('PV1BA004T089'), ('PV1W113590'), ('PV1W82515'), ('PV2007AR14'), ('PV2007CR14'),
('PV2145'), ('PV2146'), ('PVC600D03'), ('PW1002128'), ('PW1003'), ('PW100314'),
('PW100424'), ('PW1005'), ('PW100515'), ('PW1014'), ('PW1015'), ('PW10161'),
('PW102424'), ('PW1044209'), ('PW104782'), ('PW1094'), ('PW11600181'), ('PW1161165'),
('PW124955'), ('PW2003'), ('PW2005'), ('PW2013'), ('PW2014'), ('PW2015'),
('PW2023'), ('PW2033'), ('PW2082'), ('PW2105'), ('PW2132'), ('PW2181'),
('PW2182'), ('PW3014'), ('PW3016'), ('PW3055'), ('PW4014'), ('PW4015'),
('PW4055'), ('PWFLEETHAM80'), ('PWL03'), ('PWL128'), ('PWWESTON08405'), ('PWWESTON80555'),
('TR90X12P01'), ('WEBBING921'), ('WO1003'), ('WO1030'), ('WO12217181'), ('WO1332531'),
('WO13532128'), ('WPL003'), ('WPL015')
    ) AS k(Code)
),
fabric_groups AS (
    /* product group CODES that are fabric - fill from step 0.2; the placeholder
       matches nothing */
    SELECT Code FROM (VALUES ('__FILL_FROM_STEP_0_2__')) AS g(Code)
),
items AS (
    SELECT  si.ItemID, LTRIM(RTRIM(si.Code)) AS Code, si.Name, si.ProductGroupID
    FROM    S200_LIVE.dbo.StockItem si
    JOIN    S200_LIVE.dbo.ProductGroup pg ON pg.ProductGroupID = si.ProductGroupID
    WHERE   si.Code IN (SELECT Code FROM known)
       OR   pg.Code  IN (SELECT Code FROM fabric_groups)
),
home AS (
    /* the HOME warehouse figures: confirmed stock, Sage's own allocations,
       and the levels set on the item for that warehouse */
    SELECT  wi.ItemID,
            wi.ConfirmedQtyInStock                              AS InStock,
            ISNULL(wi.QuantityAllocatedStock,0)
              + ISNULL(wi.QuantityAllocatedSOP,0)
              + ISNULL(wi.QuantityAllocatedBOM,0)               AS Allocated,
            wi.MinimumLevel, wi.ReorderLevel, wi.ReorderQty
    FROM    S200_LIVE.dbo.WarehouseItem wi
    JOIN    S200_LIVE.dbo.Warehouse     w  ON w.WarehouseID = wi.WarehouseID
    WHERE   w.Name = 'HOME'
),
supplier AS (
    /* the preferred supplier; when none is flagged, the one most recently
       bought from */
    SELECT  s.ItemID, s.SupplierAccountNumber, s.SupplierAccountName,
            s.SupplierStockCode, s.LastPrice, s.LeadTimeDays
    FROM (
        SELECT  sis.ItemID,
                pl.SupplierAccountNumber, pl.SupplierAccountName,
                sis.SupplierStockCode, sis.LastPrice, sis.LeadTimeDays,
                ROW_NUMBER() OVER (PARTITION BY sis.ItemID
                                   ORDER BY sis.IsPreferred DESC,
                                            sis.LastPurchaseDate DESC) AS rn
        FROM    S200_LIVE.dbo.StockItemSupplier sis
        JOIN    S200_LIVE.dbo.PLSupplierAccount pl ON pl.PLSupplierAccountID = sis.PLSupplierAccountID
    ) s
    WHERE   s.rn = 1
),
on_order AS (
    /* outstanding on live purchase orders: ordered less received */
    SELECT  LTRIM(RTRIM(pol.ItemCode)) AS Code,
            SUM(pol.LineQuantity - ISNULL(pol.ReceiptReturnQuantity,0)) AS OnOrder
    FROM    S200_LIVE.dbo.POPOrderReturn     po
    JOIN    S200_LIVE.dbo.POPOrderReturnLine pol ON pol.POPOrderReturnID = po.POPOrderReturnID
    WHERE   po.DocumentTypeID   = 0          -- purchase orders, not returns
      AND   po.DocumentStatusID = 0          -- live
      AND   pol.LineTypeID      = 0          -- product lines
      AND   (pol.LineQuantity - ISNULL(pol.ReceiptReturnQuantity,0)) > 0
    GROUP BY LTRIM(RTRIM(pol.ItemCode))
)
SELECT
    i.Code                                                      AS FabricCode,
    LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(i.Name,''),
        CHAR(9),' '), CHAR(13),' '), CHAR(10),' ')))            AS Description,
    ISNULL(u.Name,'')                                           AS Unit,
    ISNULL(sp.SupplierAccountNumber,'')                         AS SupplierAccount,
    ISNULL(sp.SupplierAccountName,'')                           AS SupplierName,
    ISNULL(sp.SupplierStockCode,'')                             AS SupplierRef,
    CAST(ISNULL(h.InStock,0)      AS decimal(18,2))             AS InStock,
    CAST(ISNULL(h.Allocated,0)    AS decimal(18,2))             AS Allocated,
    CAST(ISNULL(oo.OnOrder,0)     AS decimal(18,2))             AS OnOrder,
    CAST(ISNULL(h.MinimumLevel,0) AS decimal(18,2))             AS MinLevel,
    CAST(ISNULL(h.ReorderLevel,0) AS decimal(18,2))             AS ReorderLevel,
    CAST(ISNULL(h.ReorderQty,0)   AS decimal(18,2))             AS ReorderQty,
    CAST(ISNULL(sp.LastPrice,0)   AS decimal(18,4))             AS CostPerMetre,
    ISNULL(sp.LeadTimeDays,0)                                   AS LeadDays
FROM        items i
LEFT JOIN   home            h  ON h.ItemID  = i.ItemID
LEFT JOIN   supplier        sp ON sp.ItemID = i.ItemID
LEFT JOIN   on_order        oo ON oo.Code   = i.Code
LEFT JOIN   S200_LIVE.dbo.StockItem     si ON si.ItemID = i.ItemID
LEFT JOIN   S200_LIVE.dbo.StockItemUnit u  ON u.StockItemUnitID = si.StockUnitID
ORDER BY    i.Code;
