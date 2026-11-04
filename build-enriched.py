import json, re
from pathlib import Path

root = Path('.')
docs = json.loads((root/'full-content.json').read_text())

# Ключевые слова тематических разделов (из data-autoclave.js / data-boiler.js)
SECTIONS = {
 'ac-basics': 'основные понятия асу scada арм контроллер датчик проходные автоклавы байонет сбу устройство система управления',
 'ac-scada': 'идентификация пароль главный экран мнемосхема статус давлением тренды журнал событий scada экран',
 'ac-control': 'закрытие крышки открытие крышки сбу байонет мостик трап хомут запуск запаривания управление автоклавом гидроцилиндр перепуск цикл',
 'ac-hmi': 'панель оператора hmi weintek мнемосхема клапаны доступ пароль класс доступа технологическая панель',
 'ac-controllers': 'контроллер segnetics smh циклограмм настройка параметры вкладка клавиша enter escape stop f1 f3',
 'ac-chemistry': 'растворение кристаллизация твердение гидросиликаты кальция кремнезем известь кварцевый физико химия',
 'ac-anti-dip': 'провалы циклограммах острого пара перепуском давления падение атм',
 'ac-scada-fail': 'отказ scada зависла программа действия персонала qf-3 qf-4 ручной ввод авария программы',
 'ac-cleaning': 'чистка автоклава прокладка резиновая уплотнительная остыть прочистка метлы скребка лопаты фильтр шило',
 'ac-hardware': 'ап 1,2-2х19 характеристики объем вагонеток сигнально блокировочное устройство диаметр корпуса длина',
 'ac-cabinets': 'шкаф управления золотник гидрораспределителя перепуски qf автомат насос вакуум шкафу',
 'ac-valves-brick': 'расположение клапанов эстакаде regada рядового кирпича цветного лицевого клапан вентиль конденсатная линия',
 'ac-duties': 'обязанности оператора дежурство праздничные обход воздушная завеса дефлектор журналы приборка обдувка продувка кондиционера перил',
 'bl-water': 'скважина вода тэц частотный преобразователь rdy q1 q2 бар гц переключение водоснабжения',
 'bl-hvo': 'хво химводоочистка фильтр умягчения натрий катионитный смолы регенерация солерастворителя перепад тонкой очистки',
 'bl-deaerator': 'деаэратор бак хво теплообменники насос реагенты 160 710 клапаны v1 v2 уровень',
 'bl-gru': 'гру газораспределительная клапан к1 пзк к2 вентиль загазованности взведение газ пульт датчики',
 'bl-boilers': 'котел loos продувка стекол запуск останов индикатора уровня lbc блокировка аварии',
 'bl-steam-heat-gvs': 'магистраль пара отопление трм212 гвс uba конденсат настенным газовым котлом',
 'bl-duties': 'обязанности диспетчера прием сдача смены обход проверка',
}
DOC_OF = {k: (1 if k.startswith('ac-') else 0) for k in SECTIONS}
TOKENS = {k: [t for t in re.split(r'\s+', v.lower()) if len(t) > 2] for k, v in SECTIONS.items()}

def score(text, toks):
    t = text.lower()
    return sum(t.count(tok) for tok in toks)

enriched = {k: [] for k in SECTIONS}
last = {'0': 'bl-water', '1': 'ac-basics'}

for di, doc in enumerate(docs):
    blocks = doc['blocks']
    for bi, b in enumerate(blocks):
        if b['type'] == 'image':
            enriched[last[str(di)]].append({'doc': di, 'block': bi, 'type': 'image', 'src': b['src']})
            continue
        text = (b.get('text') or '').strip()
        if not text:
            continue
        best, bestScore = last[str(di)], 0
        for sid in SECTIONS:
            if DOC_OF[sid] != di:
                continue
            s = score(text, TOKENS[sid])
            if s > bestScore:
                best, bestScore = sid, s
        last[str(di)] = best
        enriched[best].append({'doc': di, 'block': bi, 'type': 'text', 'text': text})

covered = sum(len(v) for v in enriched.values())
total_text = sum(1 for d in docs for b in d['blocks'] if b['type'] == 'text' and (b.get('text') or '').strip())
total_img = sum(1 for d in docs for b in d['blocks'] if b['type'] == 'image')
print('assigned blocks:', covered, '/ source text+img:', total_text + total_img)
for k, v in enriched.items():
    imgs = sum(1 for x in v if x['type'] == 'image')
    print(f'{k}: {len(v)} блоков, {imgs} изображений')

out = 'window.ENRICHED_CONTENT = ' + json.dumps(enriched, ensure_ascii=False) + ';'
(root/'data-enriched.js').write_text(out)
print('written data-enriched.js', len(out), 'bytes')
