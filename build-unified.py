import json,re
from pathlib import Path
root=Path('.'); docs=json.loads((root/'full-content.json').read_text())
# Build one normalized searchable corpus, retaining source order and images.
all_items=[]; toc=[]
for di,d in enumerate(docs):
  current={'title':d['title'],'doc':di,'start':len(all_items),'items':[]}
  for bi,b in enumerate(d['blocks']):
    if b['type']=='image': item={'id':f'd{di+1}-b{bi}','doc':di,'block':bi,'type':'image','src':b['src'],'title':'Иллюстрация','text':'','section':current['title']}
    else:
      text=b.get('text','').strip()
      if not text: continue
      # headings come from original numbering/capitalized or TOC-like short lines.
      heading=bool(re.match(r'^(?:\d+(?:\.\d+)*[.)]?\s+|[А-ЯЁ][А-ЯЁ0-9 «»()—–,:.\/-]{7,}$)',text)) and len(text)<220
      if heading: current={'title':text,'doc':di,'start':len(all_items),'items':[]};toc.append({'id':f'd{di+1}-b{bi}','doc':di,'block':bi,'title':text})
      item={'id':f'd{di+1}-b{bi}','doc':di,'block':bi,'type':'text','src':'','title':text if heading else current['title'],'text':text,'section':current['title']}
    all_items.append(item);current['items'].append(item['id'])
  toc.append({'id':f'doc-{di+1}','doc':di,'block':0,'title':d['title']})
out={'version':'3.0.0','documents':[{'id':f'doc-{i+1}','title':d['title']} for i,d in enumerate(docs)],'toc':toc,'items':all_items}
(root/'unified-manual.js').write_text('window.UNIFIED_MANUAL='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\nwindow.UNIFIED_VERSION="3.0.0";\n')
print('items',len(all_items),'toc',len(toc),'images',sum(x['type']=='image' for x in all_items),'text',sum(len(x['text']) for x in all_items))
