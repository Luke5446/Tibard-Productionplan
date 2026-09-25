#!/usr/bin/env python3
"""Build LAY_PLAN and FABRIC_MARKERS in index.html from the cutting room's two
lay-plan workbooks (Google Sheets, exported to layplan/*.xlsx).

  python3 tools/build-lay-plan.py            # rewrite the two tables in index.html
  python3 tools/build-lay-plan.py --check    # report only

One row on the jackets sheet is one MARKER for one size: its variant, marker
number, marker length, the lay quantity (garments per lay) and whether it is
the default fabric's marker. Fabric usage per garment = length / lay. Mesh
inserts and collar interlining have their own markers, in the side blocks of
the row or in a row of their own. The aprons workbook is one sheet per model,
keyed by a code PATTERN (OHAPP0597__/__DEN: the underscores are the colour).

What comes out, per code (or pattern):
  v      variant (Lectra)            fam   style family
  main   [{m,len,lay,w,use,d,n}]     default marker first, then the others
  mesh   [{m,len,lay,w,use,d,n}]     mesh inserts
  inter  [{m,len,lay,w,n}]           collar interlining
  con    [{m,len,lay,use,n}]         contrast cloth (aprons)
  blk    'OH742RF, OH742LF'          block-out front markers
FABRIC_MARKERS[code] = [usage, meshUsage|null, defaultMarker] is regenerated
from it; an entry the sheets do not know is kept as it was.
"""
import json, re, sys, zipfile, collections
from xml.etree import ElementTree as ET
ROOT=__import__('os').path.dirname(__import__('os').path.dirname(__import__('os').path.abspath(__file__)))
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def col(ref):
    m=re.match(r'([A-Z]+)',ref).group(1); n=0
    for ch in m: n=n*26+ord(ch)-64
    return n-1
def read_xlsx(path):
    z=zipfile.ZipFile(path); ss=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',NS): ss.append(''.join(t.text or '' for t in si.iter('{%s}t'%NS['m'])))
    wb=ET.fromstring(z.read('xl/workbook.xml')); rels={r.get('Id'):r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    out={}
    for sh in wb.find('m:sheets',NS):
        tgt='xl/'+rels[sh.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')].lstrip('/')
        rows=[]
        for row in ET.fromstring(z.read(tgt)).find('m:sheetData',NS):
            cells={}
            for c in row:
                v=c.find('m:v',NS); val=v.text if v is not None else None
                if c.get('t')=='s' and val is not None: val=ss[int(val)]
                if c.find('m:is',NS) is not None: val=''.join(x.text or '' for x in c.find('m:is',NS).iter('{%s}t'%NS['m']))
                if val not in (None,''): cells[col(c.get('r'))]=val
            if cells: rows.append((int(row.get('r')),cells))
        out[sh.get('name')]=rows
    return out
def s(c,i):
    v=c.get(i)
    if v is None: return ''
    if isinstance(v,str): return v.strip()
    f=float(v); return str(int(f)) if f.is_integer() else str(f)
def metres(t):
    t=(t or '').strip().lower()
    if not t: return None
    m=re.match(r'^([\d.]+)\s*cm$',t)
    if m: return round(float(m.group(1))/100,4)
    m=re.match(r'^([\d.]+)\s*m?$',t)
    return float(m.group(1)) if m else None
def lay(t):
    t=(t or '').strip()
    try: return float(t)
    except: return None
def fam(code): return re.sub(r'\d.*$','',code)
def mk(t): return re.sub(r'\.0$','',(t or '').strip())
def use(L,q): return round(L/q,4) if (L and q) else None
def is_mesh_marker(marker,notes,q,L,width):
    """A row whose main columns hold a MESH marker rather than the garment's."""
    n=(notes or '').upper()
    if 'MESH' not in n: return False
    if 'INTERLIN' in n: return False
    return (q or 0)>=10 or bool(re.search(r'cm$',(L or '').strip().lower()))
def is_inter(marker,notes,width,q):
    n=(notes or '').upper(); w=metres(width) or 9
    return 'INTERLIN' in n or 'COLLAR' in n or w<=1.0 or 'x' in (q or '')

def build_jackets(wb, plan):
    P=wb['Products']
    for rn,c in P[1:]:
        code=s(c,0).upper()
        if not code: continue
        e=plan.setdefault(code,{'v':'','fam':fam(code),'main':[],'mesh':[],'inter':[],'con':[],'blk':'','alt':[]})
        if s(c,5): e['v']=e['v'] or s(c,5).upper()
        if s(c,12): e['blk']=e['blk'] or s(c,12)
        q=lay(s(c,7)); L=metres(s(c,10)); notes=s(c,13); marker=mk(s(c,8)); width=s(c,9); d=(s(c,11)=='Yes')
        if marker:
            if is_inter(marker,notes,width,s(c,7)) and (metres(width) or 9)<=1.0:
                e['inter'].append({'m':marker,'len':L,'lay':mk(s(c,7)),'w':width,'n':notes})
            elif is_mesh_marker(marker,notes,q,s(c,10),width):
                e['mesh'].append({'m':marker,'len':L,'lay':q,'w':width,'use':use(L,q),'d':1 if d else 0,'n':notes})
            else:
                # the Notes column labels the side mesh block on the same row
                # ("MESH INSERTS (ALL SIZES)", "MESH BACKS (46\")"): not a note on the main marker
                e['main'].append({'m':marker,'len':L,'lay':q,'w':width,'use':use(L,q),'d':1 if d else 0,'n':'' if notes.upper().startswith('MESH') else notes})
        # side block: mesh inserts, or collar interlining when it is narrow / says so
        if s(c,17):
            mq=lay(s(c,14)); mL=metres(s(c,18)); mw=s(c,15); mn=s(c,19) or notes
            if is_inter(s(c,17),mn if 'INTERLIN' in mn.upper() else '',mw,s(c,14)):
                e['inter'].append({'m':s(c,17),'len':mL,'lay':mk(s(c,14)),'w':mw,'n':mn})
            else:
                e['mesh'].append({'m':s(c,17),'len':mL,'lay':mq,'w':mw,'use':use(mL,mq),'d':1 if s(c,16)=='Yes' else 0,'n':mn})
        if s(c,23):
            q3=lay(s(c,20)); L3=metres(s(c,24))
            e['mesh'].append({'m':s(c,23),'len':L3,'lay':q3,'w':s(c,21),'use':use(L3,q3),'d':1 if s(c,22)=='Yes' else 0,'n':s(c,19)})
        if s(c,29):   # Hampshire collar interlining with its size mix
            e['inter'].append({'m':s(c,29),'len':metres(s(c,27)),'lay':mk(s(c,26)),'w':s(c,28),'n':s(c,25)})
    # Special Products: long-length and 6" longer variants, plus 'ALL' mesh rows per variant
    SP=wb['Special Products']; allmesh={}
    for rn,c in SP[1:]:
        code=s(c,0).upper()
        if code=='ALL':
            q=lay(s(c,8)); L=metres(s(c,11)); allmesh[s(c,6).upper()]={'m':s(c,9),'len':L,'lay':q,'w':s(c,10),'use':use(L,q),'d':1,'n':s(c,12)}
    for rn,c in SP[1:]:
        code=s(c,0).upper()
        if not code or code=='ALL': continue
        e=plan.setdefault(code,{'v':'','fam':fam(code),'main':[],'mesh':[],'inter':[],'con':[],'blk':'','alt':[]})
        e['v']=e['v'] or s(c,6).upper()
        q=lay(s(c,8)); L=metres(s(c,11)); notes=s(c,12)
        # a special-products marker is the default only for a code the Products sheet does
        # not carry (the long-length and 6" longer variants); for a size the Products sheet
        # knows it is an alternative - a damaged-fabric or odd-width marker - never the default
        has_default=any(m['d'] for m in e['main']); dflt=0 if (has_default or 'DAMAGED' in notes.upper()) else 1
        if s(c,9): e['main'].append({'m':s(c,9),'len':L,'lay':q,'w':s(c,10),'use':use(L,q),'d':dflt,'n':notes})
        if s(c,16):
            mq=lay(s(c,13)); mL=metres(s(c,17)); e['mesh'].append({'m':s(c,16),'len':mL,'lay':mq,'w':s(c,14),'use':use(mL,mq),'d':1 if s(c,15)=='Yes' else 0,'n':''})
        elif e['v'] in allmesh and not e['mesh']: e['mesh'].append(dict(allmesh[e['v']]))

def build_aprons(wb, plan):
    for sheet,rows in wb.items():
        if not rows or sheet.startswith('Copy'): continue
        hdr={}
        for k,v in sorted(rows[0][1].items()):   # first occurrence wins: 'Contrast Quantity' comes again for Contrast 2
            name=v.strip() if isinstance(v,str) else str(v)
            hdr.setdefault(name,k)
        H=lambda name,default=None: hdr.get(name,default)
        ci=H('CODE',0); mi=H('Model',1); vi=H('Varient',2); ki=H('Marker No.',3); li=H('Marker Length (m)',4); wi=H('Marker Width',5)
        di=H('Default Fabric'); qi=H('Quantity'); ni=H('Notes'); coi=H('Contrast'); cqi=H('Contrast Quantity'); cli=H('Contrast Length (m)',H('Contrast Length')); cni=(cli+2) if cli is not None else None
        for rn,c in rows[1:]:
            codes=[x.strip().upper() for x in re.split(r'[\n,]',s(c,ci)) if x.strip()]
            if not codes: continue
            q=lay(s(c,qi)) if qi is not None else None; L=metres(s(c,li)); d=(s(c,di)=='Yes') if di is not None else None
            for code in codes:
                e=plan.setdefault(code,{'v':'','fam':fam(code.replace('_','')),'main':[],'mesh':[],'inter':[],'con':[],'blk':'','alt':[],'model':s(c,mi)})
                e['v']=e['v'] or s(c,vi).upper()
                if s(c,ki): e['main'].append({'m':mk(s(c,ki)),'len':L,'lay':q,'w':s(c,wi),'use':use(L,q),'d':(1 if d else 0) if d is not None else 1,'n':s(c,ni) if ni is not None else ''})
                if coi is not None and s(c,coi) and not s(c,coi).startswith('*'):
                    cq=lay(s(c,cqi)) if cqi is not None else None; cL=metres(s(c,cli)) if cli is not None else None
                    if cq is None and cL is None: cq=lay(s(c,coi+1)); cL=metres(s(c,coi+2))
                    con={'m':s(c,coi),'len':cL,'lay':cq,'use':use(cL,cq),'n':s(c,cni) if cni is not None else ''}
                    if con not in e['con']: e['con'].append(con)

def finish(plan):
    """Order markers (defaults first, best usage first), fill mesh from the family, derive FABRIC_MARKERS."""
    fam_mesh=collections.defaultdict(list)
    for code,e in plan.items():
        for m in e['mesh']:
            if m.get('use') and m['d']: fam_mesh[e['fam']].append(m)
    markers={}
    for code,e in plan.items():
        e['main'].sort(key=lambda m:(0 if m['d'] else 1, m['use'] if m['use'] is not None else 99))
        e['mesh'].sort(key=lambda m:(0 if m['d'] else 1, m['use'] if m['use'] is not None else 99))
        # dedupe
        for k in ('main','mesh','inter','con'):
            seen=[]; out=[]
            for m in e[k]:
                key=(m['m'],m.get('len'),str(m.get('lay')))
                if key in seen: continue
                seen.append(key); out.append(m)
            e[k]=out
        d=[m for m in e['main'] if m['d'] and m['use']]
        mesh=[m for m in e['mesh'] if m['use']]
        meshuse=None
        if mesh: meshuse=mesh[0]['use']
        elif re.match(r'^OHL?CJS?M',code) and fam_mesh.get(e['fam']):
            fm=collections.Counter(round(m['use'],4) for m in fam_mesh[e['fam']]).most_common(1)[0][0]
            src=[m for m in fam_mesh[e['fam']] if round(m['use'],4)==fm][0]
            e['mesh'].append(dict(src,fromFamily=1)); meshuse=fm
        if d and '_' not in code: markers[code]=[d[0]['use'], meshuse, d[0]['m']]
    return markers

def main():
    check='--check' in sys.argv
    J=read_xlsx(ROOT+'/layplan/OH Jackets - Lay Plan - Varients.xlsx'); A=read_xlsx(ROOT+'/layplan/OH Aprons - Lay Plan - Varients.xlsx')
    plan={}
    build_jackets(J,plan); build_aprons(A,plan)
    # layplan/extras.json: entries the sheets do not carry yet. {"CODE": {"copy": "OTHERCODE", "note": "..."}}
    # copies another code's markers (a navy size on the white size's markers); a full entry is taken as is.
    try: extras=json.load(open(ROOT+'/layplan/extras.json'))
    except FileNotFoundError: extras={}
    for code,x in extras.items():
        code=code.upper()
        if x.get('copy'):
            src=plan.get(x['copy'].upper())
            if not src: print('extras: nothing to copy for',code,'from',x['copy']); continue
            e=json.loads(json.dumps(src)); e['note']=x.get('note',''); e['copyOf']=x['copy'].upper(); plan[code]=e
        else: plan[code]=x
    markers=finish(plan)
    html=open(ROOT+'/index.html',encoding='utf-8').read()
    i=html.index('var FABRIC_MARKERS='); j=html.index('\n',i)
    old=json.loads(re.search(r'=(\{.*\});?$', html[i:j]).group(1))
    merged=dict(old); changed=0; added=0
    for k,v in markers.items():
        if k not in merged: added+=1
        elif merged[k][0]!=v[0] or (merged[k][1] or None)!=(v[1] or None) or merged[k][2]!=v[2]: changed+=1
        merged[k]=v
    kept=len([k for k in old if k not in markers])
    print(f'lay plan: {len(plan)} codes/patterns ({sum(1 for k in plan if "_" in k)} apron patterns); FABRIC_MARKERS: {len(merged)} entries, {added} added, {changed} changed, {kept} kept from the old table')
    # report the changes
    for k,v in sorted(markers.items()):
        o=old.get(k)
        if o and (o[0]!=v[0] or (o[1] or None)!=(v[1] or None) or o[2]!=v[2]): print(f'   {k:24} {o} -> {v}')
    json.dump(plan,open(ROOT+'/layplan/lay-plan.json','w'),indent=0,sort_keys=True)
    if check: return
    lp='var LAY_PLAN='+json.dumps(plan,separators=(',',':'),sort_keys=True)+';'
    mk='var FABRIC_MARKERS='+json.dumps(merged,separators=(',',':'))+';'
    html=html[:i]+mk+html[j:]
    if 'var LAY_PLAN=' in html:
        a=html.index('var LAY_PLAN='); b=html.index('\n',a); html=html[:a]+lp+html[b:]
    else:
        a=html.index('var FABRIC_MARKERS='); b=html.index('\n',a); html=html[:b]+'\n'+lp+html[b:]
    open(ROOT+'/index.html','w',encoding='utf-8').write(html)
    print('index.html updated')
if __name__=='__main__': main()
