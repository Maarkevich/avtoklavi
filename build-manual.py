import json, re
from pathlib import Path

root = Path('.')
docs = json.loads((root/'full-content.json').read_text())

# Главы приложения = разделы исходных документов (границы по блокам оглавления)
CHAPTERS = {
 0: [  # котельная
  ('boiler-intro','Общие сведения и водоснабжение', 0, 74),
  ('boiler-hvo','Подача воды на ХВО', 75, 83),
  ('boiler-hvo-device','ХВО: устройство и принцип работы', 84, 151),
  ('boiler-deaerator','Деаэратор и бак ХВО', 152, 210),
  ('boiler-gru','ГРУ и газовая безопасность', 211, 251),
  ('boiler-boilers','Котлы LOOS: запуск, останов, продувки', 252, 402),
  ('boiler-steam','Магистраль пара', 403, 407),
  ('boiler-heat','Система отопления', 408, 430),
  ('boiler-gvs','ГВС и настенный котёл', 431, 454),
  ('boiler-condensate','Конденсат', 455, 458),
  ('boiler-duties','Обязанности диспетчера', 459, 472),
 ],
 1: [  # автоклавы
  ('ac-intro','Вводная часть', 0, 46),
  ('ac-basics','Основные понятия', 47, 61),
  ('ac-asu','АСУ и интерфейс SCADA', 62, 236),
  ('ac-control','Управление автоклавом', 237, 278),
  ('ac-panel','Технологическая панель оператора', 279, 369),
  ('ac-access','Классы доступа и клавиши управления', 370, 475),
  ('ac-cyclogram','Настройка циклограмм', 476, 531),
  ('ac-cleaning','Чистка автоклава и прокладка', 532, 540),
  ('ac-hardware','Оборудование и шкафы управления', 541, 697),
  ('ac-steaming','Запаривание кирпича', 698, 739),
  ('ac-condensate','Конденсатная линия', 740, 757),
  ('ac-duties','Обязанности оператора', 758, 772),
 ],
}

RE_PAGE = re.compile(r'\s*стр\.\s*\d+[\w\.]*\s*$', re.I)
RE_TOC_LINE = re.compile(r'стр\.\s*\d+', re.I)

def clean_title(t):
    return RE_PAGE.sub('', t).strip(' .')

def find_target(title, chaps):
    tl = title.lower().rstrip('.')
    best, score = None, 0
    for c in chaps:
        cl = c['title'].lower().rstrip('.')
        words = [w for w in re.split(r'\W+', tl) if len(w) > 3]
        s = sum(1 for w in words if w in cl)
        if cl and (tl in cl or cl in tl):
            s += 3
        if s > score:
            best, score = c['id'], s
    return best if score >= 1 else None

RE_HEAD = re.compile(r'^(\d+\.\s|\d+\.\d+|[А-ЯЁ][А-ЯЁ\s\-]{6,}$)')
RE_LIST = re.compile(r'^(\d+\)|\d+\.\s|[а-я]\)|[-–•]\s)')
RE_WARN = re.compile(r'(ВНИМАНИЕ|ЗАПРЕЩ|ОПАСН|КАТЕГОРИЧЕСКИ|АВАРИЙНАЯ ОСТАНОВКА)', re.I)

def block_view(b):
    if b['type'] == 'image':
        return {'k':'img','src':b['src']}
    t = (b.get('text') or '').strip()
    if RE_WARN.search(t) and len(t) < 300:
        return {'k':'warn','t':t}
    if RE_HEAD.match(t) and len(t) < 120:
        return {'k':'h','t':t}
    if RE_LIST.match(t):
        return {'k':'li','t':t}
    return {'k':'p','t':t}

books = []
for di, doc in enumerate(docs):
    chaps = []
    for cid, title, a, z in CHAPTERS[di]:
        items = []
        for b in doc['blocks'][a:z+1]:
            if b['type'] == 'image':
                items.append({'k':'img','src':b['src']})
                continue
            t = (b.get('text') or '').strip()
            if not t:
                continue
            if RE_TOC_LINE.search(t) and len(t) < 160:
                ct = clean_title(t)
                if ct and ct.upper() != 'ОГЛАВЛЕНИЕ':
                    items.append({'k':'toc','t':ct})
            else:
                items.append(block_view(b))
        chaps.append({'id':cid,'title':title,'items':items})
    # привязать пункты оглавления к главам и конкретным заголовкам внутри них
    for c in chaps:
        for it in c['items']:
            if it['k'] == 'toc':
                tgt = find_target(it['t'], chaps)
                if tgt:
                    it['to'] = tgt
                else:
                    tl = it['t'].lower().rstrip('.')
                    words = [w for w in re.split(r'\W+', tl) if len(w) > 3]
                    best = None
                    for c2 in chaps:
                        for idx, x in enumerate(c2['items']):
                            if x['k'] in ('h', 'p'):
                                xt = (x.get('t') or '').lower()
                                score = sum(1 for w in words if w in xt)
                                if score >= max(2, len(words) - 1) and (best is None or score > best[0]):
                                    best = (score, c2['id'], idx)
                    if best:
                        it['to'], it['blk'] = best[1], best[2]
    books.append({'id':'boiler' if di==0 else 'ac',
                  'title':doc['title'],
                  'short':'Котельное оборудование' if di==0 else 'Автоклавное отделение',
                  'chapters':chaps})

faults = json.loads((root/'faults.json').read_text()) if (root/'faults.json').exists() else []

manual = {'version':'4.0.0','books':books,'faults':faults}
out = 'window.MANUAL=' + json.dumps(manual, ensure_ascii=False) + ';'
(root/'manual.js').write_text(out)
imgs = sum(1 for bk in books for c in bk['chapters'] for it in c['items'] if it['k']=='img')
texts = sum(1 for bk in books for c in bk['chapters'] for it in c['items'] if it['k']!='img')
print('books:',[(b['title'],len(b['chapters'])) for b in books])
print('text items:',texts,'images:',imgs,'faults:',len(faults),'size:',len(out))
