import zipfile, glob, os, re, json, html
from pathlib import Path
from lxml import etree
ROOT=Path(__file__).parent; OUT=ROOT/'data'; IMG=ROOT/'images'; OUT.mkdir(exist_ok=True); IMG.mkdir(exist_ok=True)
files=glob.glob('/var/minis/attachments/uploads/*1.docx')
# preserve source order: autoclave is the larger-text one with ASU; boiler is other
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def extract(f, prefix):
 z=zipfile.ZipFile(f); relroot=etree.fromstring(z.read('word/_rels/document.xml.rels')); rels={x.get('Id'):x.get('Target') for x in relroot}
 root=etree.fromstring(z.read('word/document.xml')); blocks=[]; current=[]; img_n=0
 def flush():
  nonlocal current
  if current: blocks.append({'type':'text','text':' '.join(x for x in current if x).strip()}); current=[]
 for p in root.xpath('.//w:body/w:p',namespaces=ns):
  texts=[''.join(t.itertext()) for t in p.xpath('.//w:t',namespaces=ns)]
  for dr in p.xpath('.//w:drawing',namespaces=ns):
   bl=dr.xpath('.//a:blip',namespaces=ns)
   if bl:
    rid=bl[0].get('{%s}embed'%ns['r']); target=rels.get(rid,''); target=target.replace('../','')
    src='word/'+target if not target.startswith('word/') else target
    if src in z.namelist():
     ext=Path(src).suffix.lower() or '.png'; name=f'{prefix}_{img_n:03d}{ext}'; img_n+=1; (IMG/name).write_bytes(z.read(src)); flush(); blocks.append({'type':'image','src':'images/'+name,'alt':'Иллюстрация из исходной инструкции'})
  t=''.join(texts).strip()
  if t: current.append(t)
  # preserve paragraph grouping, but source has each sentence often in paragraph
  if t and (len(t)>120 or re.match(r'^(рис|раздел|[0-9]+\.|[А-ЯЁ ]+$)',t,re.I)): flush()
 flush()
 return blocks,img_n
allblocks=[]
for i,f in enumerate(files):
 text=''.join(x.get('text','') for x in extract(f,'tmp')[0])
 prefix='boiler' if 'котельного оборудования' in text.lower() or 'водоподготовка' in text.lower() else 'autoclave'
 blocks,n=extract(f,prefix); allblocks.append({'title':'Инструкция по работе '+('автоклавного оборудования' if prefix=='autoclave' else 'котельного оборудования'),'source':os.path.basename(f),'blocks':blocks})
print('images',len(list(IMG.iterdir())),'docs',len(allblocks))
(OUT/'source-content.json').write_text(json.dumps(allblocks,ensure_ascii=False),encoding='utf-8')
