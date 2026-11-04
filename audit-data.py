import json, re
from pathlib import Path
x=json.loads(Path('full-content.json').read_text())
assert len(x)==2
for d in x:
 assert len(d['blocks'])>100
 assert any(b['type']=='image' for b in d['blocks'])
print('OK docs=',len(x),'blocks=',sum(len(d['blocks']) for d in x),'images=',sum(sum(b['type']=='image' for b in d['blocks']) for d in x),'text_chars=',sum(sum(len(b.get('text','')) for b in d['blocks']) for d in x))
