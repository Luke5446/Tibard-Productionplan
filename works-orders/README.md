# Works order documents

Existing Excel works orders, and new ones out of the costing app, for special
makes.

## Adding one

1. In GitHub: **Add file → Upload files**, drop it in this folder, commit.
2. In the buffer app, open the works order — click its card in the tracker —
   and press **📎 Link file** in the panel header, then enter the file name.

Naming the file after the works order reference — `S-OH114816-Pt1.xlsx` — keeps
them findable and makes the link the app suggests correct by default.

## Why here rather than uploaded into the app

The app is a single static HTML file with no server, so a file "uploaded" to it
could only live in that one browser: not shared with anyone, and gone the moment
site data is cleared. Keeping documents in the repo means everyone sees the same
file, it survives a cleared browser, and every version is kept.

This is for the **document**. Structured works order data — fabrics, trims,
making detail, times — is not a file: it is entered in the app's works order
data editor and travels to the team inside `data.json` on the next Publish.

## What is here

| File | What it is |
|---|---|
| `S-OH116297-Pt1.xlsx` | Works order for OHAPP061268, the biscuit bib apron with leather trim and the Carmel Valley Ranch logo (JH, 21 Sep 2026). Its structured data is in the app as style OHAPP061268. |
| `lay-plan-styles-2026-09-25.json` | Works order data added or changed on 25 Sep 2026, in the works-order-editor format for the costing app: Oxford trims by colour, the Rick Stein records, the 0544 and 0597 aprons. |
| `S-OH116448-Pt1.xlsx` | Works order for OHAPP0534110/222CTS, the putty retail bib apron with cocoa contrast ties for Galloping Gourmet (JH). In the app as style OHAPP0534110/222CTS. |
| `OHAPP0534110-222CTS-2026-09-30.json` | That record in the works-order-editor format for the costing app. |
| `OHAPP0596GD-2026-09-30.json` | OHAPP0596GD with its fabric code CO5014DEN and the rating corrected to 0.72 m, for the costing app. |
| `S-OH116383-Pt1.xls` | Works order for OHAPP053403/07CT, the black retail bib apron with red contrast ties for CNM (JH). In the app as style OHAPP053403/07CT. |
| `OHAPP053403-07CT-2026-09-30.json` | That record for the costing app. |
| `CICJM0193-01-Stock.xlsx` | Stock works order for CICJM0193_ _ 01, the Tibard mandarin collar chef jacket, short sleeve with a mesh back (JH 2017, YL 2018/19). In the app as styles CICJM0193--01 and CICJM0193--03 (the black one derived from it). |
| `CICJM0193-2026-10-01.json` | Those two records for the costing app. |
| `OHEGOAPP065003-Ego.xlsx` | Works order for OHEGOAPP065003, the black Ego Mediterranean bib apron: narrow (retail) width, two hip pockets, studded self-fabric neck strap, 100% organic cotton 260 gsm (JH 2018, ECO fabric 2025), logo artwork included. In the app as style OHEGOAPP065003. |
| `OHEGOAPP065003-2026-10-06.json` | That record for the costing app. |
| `OHAPP300503PC-2026-10-06.json` | OHAPP300503PC, the black poly cotton OH bib apron with centre pocket: the Rick Stein apron (OHRSAPP300503PC) without the logo. For the costing app. |
| `OHAPP300583-Stock.xlsx` | Stock works order for OHAPP300583, the olive green OH bib apron with pocket (JH 2014, amended to 2025). The app's record was rebuilt from it with coded trims. |
| `AP3528-01-Stock.xlsx` | Stock works order for AP352801, the Tibard white 100% cotton waist apron (Yvonne 2017, amended 2019 and 2024). In the app as style AP352801. |
| `WAGCJM0193-01S-Wagamama.xlsx` | Works order for the Wagamama long sleeve mesh back chef jacket, 6" longer body, no pen pocket (JH 2017, longer version 2026). In the app as style WAGCJM0193--01, matching the Sage codes with and without the S. |
| `olive-ap3528-wagamama-2026-10-01.json` | Those three records for the costing app. |
| `brown-apron-wagamama-rating-2026-10-01.json` | OHAPP300582, the brown OH bib apron with pocket made from the olive works order (the same apron, only the cloth and thread differ), and the Wagamama jacket with All Costings brought to its works order rating of 1.35 m. |
| `OHAP300515C-RickStein-CookerySchool.xlsx` | Works order for OHAP300515C, the navy 100% organic cotton OH bib apron with the Rick Stein's Cookery School fish logo (YL 2012, amended to 2026), artwork included. In the app as style OHAP300515C with the logo as its own branding. |
| `OHAP300515C-RickStein-2000-2020-superseded.xlsx` | The earlier 2000-2020 logo version of that works order, replaced on 2 Oct 2026. |
| `OHAP300515C-2026-10-01.json`, `OHAP300515C-2026-10-02.json` | That record for the costing app, as first set up and as updated to the fish logo. |
| `navy-3005-aprons-2026-10-01.json` | The navy OHAP3005 aprons (OHAP300515, OHAP300515S, OHAP300515TN, OHAPP300515) rebuilt with coded trims from the works order text the app held. |
| `raw-records-rebuilt-2026-10-01.json` | The last thirteen raw records (OHAP3005 colourways, the contrast-tie and leather neck strap aprons, the neck strap, the utility belt) rebuilt with coded trims. |
| `CJM0193-01-Stock.xlsx` | Stock works order for CJM0193_ _ 01, the Tibard mandarin collar chef jacket, long sleeve with a mesh back (JH 2017, pen pocket 2023). In the app as styles CJM0193--01 and CJM0193--03 (the black one derived from it). |
| `BEAPP047801C-Bettys.xlsx` | Works order for BEAPP047801C, the Bettys white organic cotton bib apron with pocket, self fabric neck straps and ties (JH 2022, cloth amended 2024 and 2026), logo included. In the app as style BEAPP047801C with the logo as its own branding. |
| `CBHT016064PG-CiaoBella.xlsx` | Works order for CBHT016064PG, the storm grey revised-fit velcro skull cap with the Ciao Bella logo, no tax tab (JH 2022, new fit 2023, eco fabric 2024), logo and sketch included. Made from scratch. In the app as style CBHT016064PG. |
| `CBHT016064PG-2026-10-06.json` | That record for the costing app. |
| `GIRHT016003-Giraffe-emb-form.xlsx` | The Giraffe hats embroidery form (Boparan Group, 27/11/24): HT016003 embroidered with the Giraffe logo and booked in as GIRHT016003. In the app as the embroidery-only style GIRHT016003, whose only trim is the stock hat. |
| `GIRHT016003-2026-10-06.json` | That record for the costing app. |
| `GBKAPP064464-GBK.xlsx` | Works order for GBKAPP064464, the GBK storm grey waist apron with wide pocket and centre stitch divide, black non tangle ties, no logo (JH 2016, bulk 2018, eco fabric 2024), sketch included. In the app as style GBKAPP064464. |
| `GBKAPP064464-2026-10-07.json` | That record for the costing app. |
| `OHSTRAP-straps.xlsx` | The Oliver Harvey detachable long strap works orders for the cross-over bib apron OHAPP0535 (stud fastened, made in pairs), one sheet per colour: cocoa OHSTRAP222, olive 83, navy 15, black 03, maroon 05, slate grey 241, natural 209, khaki 153, viridian 24, black denim 03DEN, white 01, navy denim 224DEN (gold topstitch), red 07, hot pink 315PC, orange 45, putty 110, zest 420, orchid pink 298PC, plus the leather-ended cocoa OHSTRAP222/LT and the rainbow webbing OHSTRAP921 (JH 2016 to 2026). In the app as one style per code; the OHSTRAP-- template now only covers the colours with no sheet (honeybird 293, royal 47). |
| `OHSTRAP-straps-2026-10-07.json` | Those 20 records for the costing app. |
| `OHAPP062615PC-MoorHall.xlsx` | Works order for OHAPP062615PC, the navy bib apron for James Lovatt at Moor Hall Hotel: pattern APP0626 (longer than OHAPP0544 with a wider bib, neck strap 2 cm longer), concealed adjustable stud neck strap, self fabric ties, concealed pocket, no towel loop, revised deer logo in copper top right as worn (JH 2017, eco fabric 2024, organic cotton 2025, studs marker 2025), logo image included. In the app as style OHAPP062615PC. |
| `OHAPP062615PC-2026-10-07.json` | That record for the costing app. |
| `OHAPP0617110-222CTS-GallopingGourmet.xlsx` | Works order for OHAPP0617110/222CTS, the Galloping Gourmet (Venue Catering) putty retail waist apron: pattern APP0617 variant 0617RPCT, retail mitred pocket with two pen pocket stitch lines, cocoa contrast waist ties, plain black towel loop, no tax tab (JH 2017, Tiajo eco fabric 2025). The sheet gives no fabric ratings: the putty comes from the lay plan's marker AP0617080 (0.4125 m each), the cocoa ties have no figure yet. In the app as style OHAPP0617110/222CTS. |
| `OHAPP0617110-222CTS-2026-10-08.json` | That record for the costing app. |
| `BEAP300601-Bettys.xlsx` | Works order for BEAP300601, the Bettys white 100% cotton waist apron with centre pocket and non tangle ties, logo on the pocket (YL 2018, cloth 2024, centre divide removed 2024), logo and placement sketch included. In the app as style BEAP300601. |
| `BEAP300601-2026-10-06.json` | That record for the costing app. |
| `CJM0193-BEAPP047801C-2026-10-01.json` | Those three records for the costing app. |
| `APP063103PCS-Star.xlsx` | Works order for APP063103PCS, the black waist apron with wide centre-divide pocket and self fabric ties with the Carl's Jr star logo for BRG Star (JH 2025), artwork and placement sketch included. In the app as style APP063103PCS with the logo as its own branding. |
| `APP063103PCS-2026-10-01.json` | That record for the costing app, with OHAPP061268's logo wording moved to the bottom left corner in line with the knee. |
| `OHAPP061268-2026-09-28.json` | The OHAPP061268 record in the same format, with the logo and sketch images. |
| `CT0196-03-Stock.xlsx` | Stock works order for CT0196--03, the Tibard black elasticated-waist chef trousers, regular length (work order 1325, Gail 24/9/26; YL 2014, measurements JH 2018, model and variant corrected JH 9/4/26). In the app as style CT0196--03, with the blue/white (26) and black/white (28) gingham check colourways Sage sells derived from it. |
| `CTT0196-03-Stock.xlsx` | Stock works order for CTT0196--03, the same trousers in the tall length (YL 2014, set to tall leg 28/3/18). In the app as style CTT0196--03. |
| `CT0196-CTT0196-2026-10-12.json` | Those four records, with the regular and tall size charts, for the costing app. |
| `CBAPP054964PG-CiaoBella.pdf` | Works order for CBAPP054964PG, the Bella Italia storm grey waist apron with centre pocket and self fabric ties, Ciao Bella logo in pale green at the left front hem (JH 2021, logo 2022, eco fabric 2024), logo and placement sketch included. In the app as style CBAPP054964PG with the logo as its own branding. |
| `WCL222203-WaitersCloth.xlsx` | Stock works order for WCL222203, the black 100% cotton waiters cloth 56 x 56 cm for Whitbread (JH 2014). The sheet names the P and R 3110 cloth CO5003 with no rating; the app's record carries CO5003ECO at 0.25 m, as All Costings costs it. In the app as style WCL222203. |
| `WAGHTM016007-Wagamama.xlsx` | Stock works order 1156 for WAGHTM016007, the Wagamama red skull cap on the larger WAG0160M fit: mesh oval crown, longer velcro tab, Tibard tax tab, Wagamama logo in white (JH 2023, Tiajo red 111 and code PC2X13307 2026), logo, sketch and placement photo included. In the app as style WAGHTM016007, and the other five colours Sage sells (white 01, black 03, navy 15, bottle 24, grey 64) derived from it on 14 Oct 2026 with All Costings' cloth and a matching mesh and thread, to be confirmed. |
| `OHHICAPP062803DEN-Hickorys.xlsx` | Works order EMB-HIC 0816 for OHHICAPP062803DEN, the Hickory's black denim retail waist apron on APP0617 variant 0628: full width pocket divided into three, zip pocket, eyelets for the self fabric ties, D ring loops, gold topstitching, Hickory's 5 star logo in gold (JH 2017, rating 2026), sketch included; the second tab is the 2017 pattern request. In the app as style OHHICAPP062803DEN. |
| `OHAPP063015HP1S-PilotLight.xlsx` | Works order 1084 for OHAPP063015HP1S, the Pilot Light navy organic cotton bib apron on APP0630 variant PILOTLGT: one mitred hip pocket, pen pocket, self fabric ties and neck strap with leather loop, woven Pilot Light label at the left hem (JH 2019, eco fabric 2025), sketch, label and placement included. In the app as style OHAPP063015HP1S with the label as its own branding. |
| `SHROUD01-Shroud.xlsx` | Works order for SHROUD01, the Respect white shroud: one 5 thread joined seam, selvedge and cut edges left unfinished, three separate 1.60 m ties, Respect FFMA printed label in the seam, bagged with the CV-19 sticker (JH 2020), cut diagram, label and sticker included. In the app as style SHROUD01 on PC2001ECO at 3.70 m. |
| `wo-templates-2026-10-14.json` | That record and the other five Wagamama hat colours (WAGHTM016001 white, 03 black, 15 navy, 24 bottle, 64 grey) derived from the red sheet, for the costing app. |
| `wo-templates-2026-10-13.json` | Those five records for the costing app. |
| `SNSAPP052803-LondonLinen.xlsx` | Works order S851569 for SNSAPP052803, the London Linen black wide waist apron on AP0528 variant APP0528PKT: pocket right side as worn, cut-out centre front split with facing and stay tape, self fabric ties, no Tibard branding (JH 2023, marker 2024; Lara, 22/1/26 for 250), sketch included. In the app as style SNSAPP052803 on PC2003ECO at 1.10 m. |
| `SNSAPP052803-2026-10-14.json` | That record for the costing app. |
| `OHAP060501-FatDuck.xlsx` | Works order for OHAP060501, the Fat Duck white organic cotton bib apron on AP0532 variant 0605: the Mandarin Oriental bib size, concealed stud adjustable neck strap (5 cm longer, extra stud) through a cloth loop, self fabric ties, no pocket, two logos in black (JH 2016 to 2018, cloth 2025), logos and sketch included. In the app as style OHAP060501 with the logos as its own branding; All Costings' PC6001 corrected to the sheet's CO5001ECO. |
| `OHAP060501-FatDuck-photo.jpg` | Luke's photo of the finished apron with both logos (15 Oct 2026), on the record as the placement photo. |
| `OHAP060501-2026-10-15.json` | That record for the costing app. |
| `HT016064-Stock.xlsx` | Stock works order for HT016064, the Tibard storm grey velcro fasten skull cap on the revised HT0160NEW fit, Tibard tax tab, no embroidery (JH 2022, label 2023, eco fabric 2024; issued 21/5/26), sketch included. In the app as style HT016064; the sheet rates it 0.12 m, All Costings 0.20 m. |
| `HT016064-2026-10-15.json` | That record for the costing app. |
| `OHAPP0666241-AlphaCoTokyo.xlsx` | Works order for OHAPP0666241, the Oliver Harvey slate grey off-centre bib apron for Alpha Co Tokyo: pattern OHAPP0666 variant 0666 cut one way, right side uppermost, two pockets of different sizes, self fabric waist ties, stud halter adjustable neck strap through a self fabric loop with the OHAPP0544 stud marker, OH labels, no tax tab (JH for SR981, bulk 2021, Tiajo eco fabric 2025), sketch included. In the app as style OHAPP0666241 on CO5241ECO at 0.86 m, as All Costings costs it. |
| `OHAPP0666241-2026-10-15.json` | That record for the costing app. |
| `AP0776128-Gaucho.xlsx` | Works order for AP0776128, the Tibard charcoal recycled bib apron for Gaucho: pattern OHAP0776, self fabric neck tie adjusting through a 30 mm antique brass eyelet at the bib top, self fabric waist ties, no pocket, Tibard printed care label (JH 2023, made a Tibard product 2023, cutting note 2024: even number bundles, no piece outs), sketch included. The maroon contrast cloth, thread and studs on the sheet are left from its template. In the app as style AP0776128 on PCECO520128 at 0.60 m, as All Costings costs it. |
| `AP0776128-2026-10-15.json` | That record for the costing app. |
| `AP0777128-Gaucho.xlsx` | Works order for AP0777128, the Tibard charcoal recycled waist apron for Gaucho: pattern OHAP0777, the waist apron version of AP0776128, self fabric waist ties set through two 30 mm antique brass eyelets at the top of the waist and secured with two rows of stitching, no pocket, Tibard printed care label 14 cm down the right side seam (JH 2023, made a Tibard product 2023, cutting note 2024: even number bundles, no piece outs), sketch included. The maroon contrast thread and studs on the sheet are left from the bib apron template. In the app as style AP0777128 on PCECO520128 at 0.40 m, as All Costings costs it. |
| `AP0777128-2026-10-19.json` | That record for the costing app. |
| `OHHICAPP062703DEN-DS-Hickorys.xlsx` | Works order for OHHICAPP062703DEN/DS, the Hickory's black denim retail bib apron on OHAP0534 variant 0627: the bib version of the waist apron OHHICAPP062803DEN with the full width pocket divided into four, double pen pocket, zip pocket, eyelets and lower studs for the detachable cross-over straps (OHSTRAP03DEN, cut on their own routing card), D ring loops, hanger loop, gold topstitching and the Hickory's 5 star logo in gold (JH 2017, code 2019), sketch and hanger loop diagram included; the second tab's sketch is the two-pocket strap apron. In the app as style OHHICAPP062703DEN/DS with the sketch as its placement; the sheet rates it 0.75 m, All Costings 0.85 m, the lay plan's marker 0627001 0.655 m. |
| `OHHICAPP062703DEN-DS-2026-10-15.json` | That record for the costing app. |
| `WAGSB077403-Wagamama.xlsx` | Stock work order 1314 for WAGSB077403, the Wagamama staff bag in black recycled polyester: quick release buckle, Wagamama jacquard webbing strap through a tri glide, pocket with a dart, front pocket with pen pocket stitch line, Wagamama tax tab (jh 2023, bulk 14/6/23; Gail, 24/9/26 for 150), both drawings included. In the app as style WAGSB077403; the sheet rates it 0.17 m, All Costings 0.20 m. |
| `WAGSB077403-2026-10-16.json` | That record for the costing app. |
| `SHAAPP054203-ShakeShack.xlsx` | Stock works order for SHAAPP054203, the Shake Shack black 100% polyester bib apron: pattern SHAAP0542, self fabric neck strap, black non tangle tape waist ties cut 100 cm, no pocket, Tibard printed care label, no logo or embroidery (Jennifer 2013, Yvonne 2020, extra P added to the code 2021; processed by Gail). In the app as style SHAAPP054203 on POPLAZA03 at 0.45 m, the same as All Costings. |
| `SHAAPP054203-2026-10-21.json` | That record for the costing app. |
| `HTM016001-Stock.xlsx` | Stock works order for HTM016001, the Tibard white skull cap with mesh crown on the revised HT0160 fit, variant NEW0160M (JH 2022, label position 2023): Tibard tax tab on the right, white velcro, no embroidery. The Tibard twin of OHHTM016001. In the app as style HTM016001. |
| `AP300501-Stock.xlsx` | Stock works order for AP300501, the Tibard white 100% organic cotton bib apron, standard size AP3005B, with white non tangle ties and a self fabric neck strap (YL 2014, cloth 2024, Tiajo organic cotton 2026). In the app as style AP300501. |
| `ASKAP056364-ASK.xlsx` | Works order for ASKAP056364 (sheet headed AP0563), the ASK storm grey bib apron with the Italy print at the left chest, an adjustable gilt D ring neck strap and longer black non tangle ties (JH 2013, print position 2023, rating 0.65 m 2023, eco fabric 2024). In the app as style ASKAP056364 with the print as its own branding. |
| `OHCJSNORFOLK-07S-Red.xlsx` | Works order for OHCJSNORFOLK--07S, the red short sleeve Norfolk chef jacket, double breasted and button fastened, for Independent Catering (JH 2013, red 2014, logo removed 2021, Tiajo red X133 colour 111 and code PC2X13307 2026). In the app as style OHCJSNORFOLK--07S, matching the Sage sizes with and without the S. |
| `templates-2026-10-22.json` | Those four records for the costing app. |
| `BEAPPCS300501-Bettys.xlsx` | Works order for BEAPPCS300501, the Betty's Cookery School white 100% organic cotton bib apron on the smaller AP3005B pattern, variant Betty's: self fabric neck strap and waist ties, a 23 × 28 cm centre front pocket, Tibard printed care label, the standard Bettys logo embroidered to the centre bib in maroon (JH 2016, cloth 2024, Tiajo organic cotton and model corrected Jan 2026). In the app as style BEAPPCS300501, with the logo from the sheet as its own branding. |
| `OHCJSCUMBRIA-248-StormGrey.xlsx` | Works order for OHCJSCUMBRIA--248, the storm grey short sleeve Cumbria chef jacket (OH4 variant OH4SSLV) made for Rocksalt / Mark Sargeant: concealed ring press studs, pen pocket with the red tax tab, black OH Made in Great Britain neck tape, no embroidery (YL 2018–2024, grey for Miele RCR 346/368 2023, Rocksalt RCR 422 May 2025). In the app as style OHCJSCUMBRIA--248, matching the sized Sage codes OHCJSCUMBRIA38248 and so on, on the 34"–62" Cumbria short sleeve chart. |
| `CT3082-03-Stock.xlsx` | Stock works order for CT3082--03, the Tibard black chef trousers with a full elasticated waist, drawstring, zip fly, side seam pockets and a back patch pocket (NEW 3082 variant NEW3082RL, regular length; JH 2014, big sizes 2017, cord lengths 2021). In the app as style CT3082--03 for the lettered sizes XS–XXL and the 46"–60" waist codes, with the alias CT3082ECO--03 for the ECO codes Sage also carries. |
| `templates-2026-10-26.json` | Those three records for the costing app. |
| `thread-standards-2026-09-28.json` | The thread standards (chef jacket 220 m, chef trousers 150 m, bib apron 70 m, waist apron 30 m) and every baked-in record with its main thread row set to them, for the costing app. |

## Thread standards

Luke set the metres of thread costed per garment on 28 Sep 2026: **chef
jacket 220, chef trousers 150, bib apron 70, waist apron 30**. In the app the
main thread row of every record carries the standard for its garment kind
(worked out from the record's name and the product code; hats, straps and
tabs have none). A second thread row, a contrast colour, keeps its own figure.
A record imported from the costing app is brought to the standard as it comes
in and again on every load, unless it carries `threadOwn: true`. The costing
app should apply the same rule when a record is created there.
