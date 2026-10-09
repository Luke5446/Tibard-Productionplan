#!/usr/bin/env python3
"""Build sage/Buffer Live.xlsx: a workbook with the two buffer queries already
set up as Power Query connections, loaded to two tables, so Luke opens it,
answers the one-time credentials prompt (Windows), and Refresh All fills it.

    python3 tools/build-buffer-workbook.py

Reads sage/70-buffer-live.sql and sage/71-buffer-sop-demand.sql. Nothing in
the Excel file depends on the workbook this replaces: the Power Query package
(the DataMashup part), the two mashup connections, the query tables and the
tables are written from the OOXML parts a real Excel saves, copied from the
Buffer_Report workbook's structure part for part.

The DataMashup binary (MS-QDEFF): version, the package zip (Package.xml,
[Content_Types].xml, Formulas/Section1.m), the permissions XML, the metadata
block (its own version, the metadata XML, an empty content zip) and empty
permission bindings - each length-prefixed with a little-endian uint32.
"""
import base64, io, os, re, struct, sys, uuid, zipfile
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'sage', 'Buffer Live.xlsx')
# The first build pre-bound each query to a table (connections.xml, a
# queryTable and a table part on a sheet). Opened in Excel on 9 Oct 2026 both
# sheets stayed blank on Refresh All: the hand-made binding did not take. So
# the workbook now carries the queries only, and Luke loads each one once
# with Load To (Excel makes its own binding), which Refresh All then fills.
CONNECTION_ONLY = True

def sql(name):
    return open(os.path.join(ROOT, 'sage', name), encoding='utf-8').read()

QUERIES = [
    # name, sheet, table, sql file, columns
    ('Buffer', 'Buffer', 'Buffer', '70-buffer-live.sql',
     ['StockCode','Name','InStock','OnSOP','OnPOP','Sales1M','Sales3M','Sales6M','Sales12M',
      'Category','Manufacturer','SupplierAcct','SupplierName','ClockworkMade','LeadDays','MinLevel',
      'StockHome','StockOther','StockBulk','StockOH','OnSOPTib','OnSOPOH','OnPOPBulk','DateOfLastSale',
      'ExcludeAutoPO','Customers','StockHeldOH','Company']),
    ('SOPDemand', 'SOPDemand', 'SOPDemand', '71-buffer-sop-demand.sql',
     ['LineKey','Company','SalesOrderNo','ProductCode','Qty','PromisedDate','OrderDate','CustomerName',
      'CustomerOrderNo','Account','Intercompany','LineSeq']),
]

README = [
    'Buffer Live - the buffer sheet for the production planner',
    '',
    'What this is: two Power Query queries against Sage 200 on TIB-SQL-002, in place of the',
    'Buffer_Report workbook. Buffer is the buffer sheet (today\'s nine paste columns first, then',
    'the Clockwork flag, supplier, lead time, category, stock by warehouse). SOPDemand is every',
    'live sales order line for a stock-held code: the orders behind On SOP.',
    '',
    'First open (once):',
    '1. Data > Queries & Connections. The pane on the right lists Buffer and SOPDemand.',
    '2. Right-click Buffer > Load To... > Table > New worksheet > OK. Excel asks how to connect:',
    '   pick Windows > Use my current credentials. If a privacy-level box appears, choose',
    '   Organizational for TIB-SQL-002.',
    '3. Right-click SOPDemand > Load To... > Table > New worksheet > OK.',
    '4. A yellow bar saying the data connections are disabled: click Enable Content.',
    '',
    'Every time:',
    '1. Refresh All (wait for the status bar to finish - background refresh is off).',
    '2. On the Buffer sheet select all rows under the header, A to AB, Ctrl+C, and paste into',
    '   the planner\'s Paste buffer stock data box.',
    '3. On the SOPDemand sheet select all rows under the header, A to L, Ctrl+C, and paste into',
    '   the same box (either order; the planner tells the two apart by the first column).',
    '',
    'Changing a query: Data > Queries & Connections > right-click the query > Edit > the gear',
    'next to Source. The SQL is kept in the repo as sage/70-buffer-live.sql and',
    'sage/71-buffer-sop-demand.sql; paste the file as it stands.',
    '',
    'Before trusting it the first time: paste sage/72-buffer-validate.sql into the Buffer',
    'query for one refresh. It lists the codes whose In Stock / SOP / POP differ from the old',
    'workbook. Empty is the goal. sage/73-buffer-discovery.sql checks the names the query',
    'assumes (warehouse names, the customer search category).',
]

def mstr(s):
    """SQL text as a Power Query M string literal body."""
    s = s.replace('\r\n', '\n').replace('\r', '\n')
    s = s.replace('#', '#(#)').replace('"', '""').replace('\t', '#(tab)').replace('\n', '#(lf)')
    return s

def section_m():
    parts = ['section Section1;', '']
    for name, sheet, table, f, cols in QUERIES:
        db = 'S200_LIVE'
        parts.append('shared %s = let\n    Source = Sql.Database("TIB-SQL-002", "%s", [Query="%s", CommandTimeout=#duration(0, 0, 10, 0)])\nin\n    Source;' % (name, db, mstr(sql(f))))
        parts.append('')
    return '\n'.join(parts)

def xml_esc(s):
    return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')

def metadata_xml():
    items = ['<Item><ItemLocation><ItemType>AllFormulas</ItemType><ItemPath /></ItemLocation><StableEntries><Entry Type="Relationships" Value="sAAAAAA==" /></StableEntries></Item>']
    for name, sheet, table, f, cols in QUERIES:
        names = '[' + ','.join('"%s"' % c for c in cols) + ']'
        items.append(
            '<Item><ItemLocation><ItemType>Formula</ItemType><ItemPath>Section1/%s</ItemPath></ItemLocation><StableEntries>'
            + (('<Entry Type="IsPrivate" Value="l0" /><Entry Type="QueryID" Value="s%s" /><Entry Type="FillEnabled" Value="l0" />'
                '<Entry Type="ResultType" Value="sTable" /><Entry Type="NavigationStepName" Value="sNavigation" />'
                '<Entry Type="FillColumnNames" Value="s%s" /><Entry Type="AddedToDataModel" Value="l0" />'
                % (uuid.uuid4(), xml_esc(names))) if CONNECTION_ONLY else
               ('<Entry Type="IsPrivate" Value="l0" /><Entry Type="QueryID" Value="s%s" /><Entry Type="FillEnabled" Value="l1" />'
                '<Entry Type="FillObjectType" Value="sTable" /><Entry Type="FillToDataModelEnabled" Value="l0" /><Entry Type="BufferNextRefresh" Value="l1" />'
                '<Entry Type="ResultType" Value="sTable" /><Entry Type="NameUpdatedAfterFill" Value="l0" /><Entry Type="NavigationStepName" Value="sNavigation" />'
                '<Entry Type="FillTarget" Value="s%s" /><Entry Type="FilledCompleteResultToWorksheet" Value="l1" /><Entry Type="FillErrorCount" Value="l0" />'
                '<Entry Type="FillErrorCode" Value="sUnknown" /><Entry Type="FillColumnNames" Value="s%s" /><Entry Type="FillStatus" Value="sComplete" />'
                '<Entry Type="FillCount" Value="l0" /><Entry Type="AddedToDataModel" Value="l0" />'
                % (uuid.uuid4(), table, xml_esc(names))))
            + '</StableEntries></Item>'
            '<Item><ItemLocation><ItemType>Formula</ItemType><ItemPath>Section1/%s/Source</ItemPath></ItemLocation><StableEntries /></Item>'
            % name)
    return ('<?xml version="1.0" encoding="utf-8"?><LocalPackageMetadataFile xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Items>' + ''.join(items) + '</Items></LocalPackageMetadataFile>')

def datamashup():
    bom = b'\xef\xbb\xbf'
    pkg = io.BytesIO()
    with zipfile.ZipFile(pkg, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('Config/Package.xml', bom + b'<?xml version="1.0" encoding="utf-8"?><Package xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Version>2.158.928.0</Version><MinVersion>2.21.0.0</MinVersion><Culture>en-GB</Culture></Package>')
        z.writestr('[Content_Types].xml', bom + b'<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="text/xml" /><Default Extension="m" ContentType="application/x-ms-m" /></Types>')
        z.writestr('Formulas/Section1.m', section_m().encode('utf-8'))
    pkg = pkg.getvalue()
    perms = bom + b'<?xml version="1.0" encoding="utf-8"?><PermissionList xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><CanEvaluateFuturePackages>false</CanEvaluateFuturePackages><FirewallEnabled>true</FirewallEnabled></PermissionList>'
    mxml = bom + metadata_xml().encode('utf-8')
    empty = io.BytesIO()
    with zipfile.ZipFile(empty, 'w'): pass
    empty = empty.getvalue()
    meta = struct.pack('<I', 0) + struct.pack('<I', len(mxml)) + mxml + struct.pack('<I', len(empty)) + empty
    raw = struct.pack('<I', 0) + struct.pack('<I', len(pkg)) + pkg + struct.pack('<I', len(perms)) + perms + struct.pack('<I', len(meta)) + meta + struct.pack('<I', 0)
    b64 = base64.b64encode(raw).decode('ascii')
    x = '<?xml version="1.0" encoding="utf-16"?><DataMashup sqmid="%s" xmlns="http://schemas.microsoft.com/DataMashup">%s</DataMashup>' % (uuid.uuid4(), b64)
    return '﻿'.encode('utf-16-le') + x.encode('utf-16-le')

def col_letter(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26); s = chr(65 + r) + s
    return s

def sheet_xml(cols, rows=None, widths=None):
    """A sheet whose row 1 is the header (inline strings) and row 2 empty, or free text rows."""
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
           '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">']
    if rows is None:
        last = col_letter(len(cols))
        out.append('<dimension ref="A1:%s2"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>' % last)
        out.append('<cols>' + ''.join('<col min="%d" max="%d" width="%s" customWidth="1"/>' % (i+1, i+1, (widths or {}).get(c, 14)) for i, c in enumerate(cols)) + '</cols>')
        out.append('<sheetData><row r="1">' + ''.join('<c r="%s1" t="inlineStr"><is><t>%s</t></is></c>' % (col_letter(i+1), xml_esc(c)) for i, c in enumerate(cols)) + '</row><row r="2"/></sheetData>')
        out.append('<tableParts count="1"><tablePart r:id="rId1"/></tableParts></worksheet>')
    else:
        out.append('<dimension ref="A1:A%d"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="110" customWidth="1"/></cols>' % len(rows))
        out.append('<sheetData>' + ''.join('<row r="%d"><c r="A%d" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c></row>' % (i+1, i+1, xml_esc(t)) for i, t in enumerate(rows)) + '</sheetData></worksheet>')
    return '\n'.join(out)

def table_xml(tid, name, cols):
    last = col_letter(len(cols))
    tc = ''.join('<tableColumn id="%d" uniqueName="%d" name="%s" queryTableFieldId="%d"/>' % (i+1, i+1, xml_esc(c), i+1) for i, c in enumerate(cols))
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="%d" name="%s" displayName="%s" ref="A1:%s2" tableType="queryTable" totalsRowShown="0">'
            '<autoFilter ref="A1:%s2"/><tableColumns count="%d">%s</tableColumns>'
            '<tableStyleInfo name="TableStyleMedium7" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>'
            % (tid, name, name, last, last, len(cols), tc))

def querytable_xml(conn_id, name, cols):
    qf = ''.join('<queryTableField id="%d" name="%s" tableColumnId="%d"/>' % (i+1, xml_esc(c), i+1) for i, c in enumerate(cols))
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<queryTable xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" name="ExternalData_%d" connectionId="%d" autoFormatId="16" '
            'applyNumberFormats="0" applyBorderFormats="0" applyFontFormats="0" applyPatternFormats="0" applyAlignmentFormats="0" applyWidthHeightFormats="0">'
            '<queryTableRefresh nextId="%d"><queryTableFields count="%d">%s</queryTableFields></queryTableRefresh></queryTable>'
            % (conn_id, conn_id, len(cols)+1, len(cols), qf))

def connections_xml():
    cs = []
    for i, (name, sheet, table, f, cols) in enumerate(QUERIES):
        cs.append('<connection id="%d" keepAlive="1" name="Query - %s" description="Connection to the \'%s\' query in the workbook." type="5" refreshedVersion="8" background="0" saveData="1">'
                  '<dbPr connection="Provider=Microsoft.Mashup.OleDb.1;Data Source=$Workbook$;Location=%s;Extended Properties=&quot;&quot;" command="SELECT * FROM [%s]"/></connection>'
                  % (i+1, name, name, name, name))
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><connections xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + ''.join(cs) + '</connections>'

def build():
    files = {}
    n = 0 if CONNECTION_ONLY else len(QUERIES)
    sheets = ([] if CONNECTION_ONLY else [(q[1], i+1) for i, q in enumerate(QUERIES)]) + [('ReadMe', n+1)]
    ct = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>',
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
          '' if CONNECTION_ONLY else '<Override PartName="/xl/connections.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml"/>',
          '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
          '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
          '<Override PartName="/customXml/itemProps1.xml" ContentType="application/vnd.openxmlformats-officedocument.customXmlProperties+xml"/>']
    for name, sid in sheets:
        ct.append('<Override PartName="/xl/worksheets/sheet%d.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' % sid)
    for i in range(n):
        ct.append('<Override PartName="/xl/tables/table%d.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>' % (i+1))
        ct.append('<Override PartName="/xl/queryTables/queryTable%d.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.queryTable+xml"/>' % (i+1))
    ct.append('</Types>')
    files['[Content_Types].xml'] = ''.join(ct)
    files['_rels/.rels'] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>')
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    files['docProps/core.xml'] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        '<dc:title>Buffer Live</dc:title><dc:creator>Tibard production planner</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">%s</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">%s</dcterms:modified></cp:coreProperties>' % (now, now))
    files['docProps/app.xml'] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Excel</Application></Properties>')
    wb = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
          '<fileVersion appName="xl" lastEdited="7" lowestEdited="7" rupBuild="30430"/><workbookPr defaultThemeVersion="202300"/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="15600" activeTab="%d"/></bookViews><sheets>' % n]
    rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">']
    rid = 1
    for name, sid in sheets:
        wb.append('<sheet name="%s" sheetId="%d" r:id="rId%d"/>' % (name, sid, rid))
        rels.append('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/>' % (rid, sid)); rid += 1
    wb.append('</sheets><calcPr calcId="191029"/></workbook>')
    files['xl/workbook.xml'] = ''.join(wb)
    rels.append('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' % rid); rid += 1
    if not CONNECTION_ONLY:
        rels.append('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/connections" Target="connections.xml"/>' % rid); rid += 1
    rels.append('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../customXml/item1.xml"/>' % rid); rid += 1
    rels.append('</Relationships>')
    files['xl/_rels/workbook.xml.rels'] = ''.join(rels)
    files['xl/styles.xml'] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        '<tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/></styleSheet>')
    if not CONNECTION_ONLY: files['xl/connections.xml'] = connections_xml()
    for i, (name, sheet, table, f, cols) in enumerate([] if CONNECTION_ONLY else QUERIES):
        files['xl/worksheets/sheet%d.xml' % (i+1)] = sheet_xml(cols, widths={'Name': 48, 'CustomerName': 30, 'CustomerOrderNo': 24, 'Customers': 30, 'Category': 20, 'SupplierName': 24})
        files['xl/worksheets/_rels/sheet%d.xml.rels' % (i+1)] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table%d.xml"/></Relationships>' % (i+1))
        files['xl/tables/table%d.xml' % (i+1)] = table_xml(i+1, table, cols)
        files['xl/tables/_rels/table%d.xml.rels' % (i+1)] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/queryTable" Target="../queryTables/queryTable%d.xml"/></Relationships>' % (i+1))
        files['xl/queryTables/queryTable%d.xml' % (i+1)] = querytable_xml(i+1, name, cols)
    files['xl/worksheets/sheet%d.xml' % (n+1)] = sheet_xml(None, rows=README)
    files['customXml/item1.xml'] = datamashup()
    files['customXml/itemProps1.xml'] = ('<?xml version="1.0" encoding="UTF-8" standalone="no"?><ds:datastoreItem ds:itemID="{%s}" xmlns:ds="http://schemas.openxmlformats.org/officeDocument/2006/customXml">'
        '<ds:schemaRefs><ds:schemaRef ds:uri="http://schemas.microsoft.com/DataMashup"/></ds:schemaRefs></ds:datastoreItem>' % str(uuid.uuid4()).upper())
    files['customXml/_rels/item1.xml.rels'] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="itemProps1.xml"/></Relationships>')
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        for k, v in files.items():
            z.writestr(k, v if isinstance(v, bytes) else v.encode('utf-8'))
    print('wrote', OUT, os.path.getsize(OUT), 'bytes')

if __name__ == '__main__':
    build()
