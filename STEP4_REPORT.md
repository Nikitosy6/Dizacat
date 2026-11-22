# STEP4_REPORT — ядро редактора, пункты 1–4

Сделано пункты 1–4 промпта Шага 4. Пункты 5–8 (состояния компонентов, проверки качества, финальный список тестов, отчёт по CATWORKING_RULES §9) не начаты.

## Проверка
- `st-test-nodes.html` запускает тесты Шагов 2–4 вместе: 66 проходят, 1 падает. Падает старый тест Шага 3 про глифы шрифтов, потому что в моей копии нет папки `fonts/`. У владельца с папкой он должен пройти.
- Живые жесты проверены в Chromium настоящими событиями мыши и касания (не входят в репозиторий): выбор, ручки размера и поворота, перетаскивание «на плаву», перестановка в потоке, сетка 8, стрелки, Delete, Ctrl+Z, мультивыбор, группировка, ползунки, глаз, перетаскивание слоя, щипок двумя пальцами. Все прошли.

## Файлы
Изменено существующих: 5 (лимит 5): `index.html`, `st-store.js`, `st-canvas.js` (переписан целиком), `st-ui.js`, `st-test-fonts.js`.
Новые: `st-nodes.js`, `st-nstyle.js`, `st-gest.js`, `st-nodeui.js`, `st-insp.js`, `studio-nodes.css`, `st-test-nodes.js`, `st-test-nodes.html`.

## Что решено
- Схема поднята до 4 (миграция 3→4 дополняет узлы недостающими `layout/style/props/children/name`). В `st-test-fonts.js` три проверки `schema===3` заменены на `ST.SCHEMA`.
- Размер узла: `layout.w/h` = `'fill'` | `'hug'` | число. «На плаву»: `layout.float` + `layout.x/y`. Скрытие: `hidden`.
- Форма профиля (`r`, `rl`, `bw`, `ledge`) пока константы «Макеты Nunito» в `ST.nodes.SHAPE`; в стиле пишется `'var:r'`. Профилей в коде нет (Шаг 1А), перенос туда потом.
- Стиль текста узла лежит в `style.text` (как договорено в Шаге 3).
- Иконки: временный набор из 8 (`ST.nodes.ICONS`), полный набор будет в Шаге 5. Картинки: заглушка до Шага 12.
- Параметр «Прозрачность» назван «Непрозрачность» (100 % = обычный вид), чтобы не путать.
- Пока экран пуст, на холсте остаётся образец токенов/шрифтов Шагов 2–3; с первым узлом показывается дерево.

## Замечено, но не тронуто
- `st-test-fonts.html` остался как был (только Шаг 3); общий запуск — `st-test-nodes.html`.
- Родитель с поворотом или масштабом: рамка выбора и привязка считаются без его поворота.
- «Фон» экрана по умолчанию `@bg`; профиль экрана (P3А) не подключён.

## Правки существующих файлов «найти → заменить»
### st-store.js
1. `ST.SCHEMA=3;` → `ST.SCHEMA=4;`
2. `  if(p.schema<3){if(ST.fonts)ST.fonts.seed(p);p.schema=3;}\n  return p;` →
`  if(p.schema<3){if(ST.fonts)ST.fonts.seed(p);p.schema=3;}\n  if(p.schema<4){if(ST.nodes)ST.nodes.normalize(p);p.schema=4;}\n  return p;`
3. `return 'экран №'+(i+1)+' повреждён';}\n  return '';` → `return 'экран №'+(i+1)+' повреждён';}\n  if(ST.nodes){var ne=ST.nodes.validate(p);if(ne)return ne;}\n  return '';`

### st-test-fonts.js
1. `eq(ST.p.schema,3);eq(ST.validate(ST.p),'');` → `eq(ST.p.schema,ST.SCHEMA);eq(ST.validate(ST.p),'');`
2. `var m=ST.migrate(a);eq(m.schema,3);` → `var m=ST.migrate(a);eq(m.schema,ST.SCHEMA);`
3. `m=ST.migrate(b);eq(m.schema,3);` → `m=ST.migrate(b);eq(m.schema,ST.SCHEMA);`

### index.html
1. `<link rel="stylesheet" href="studio-fonts.css">` → добавить следующей строкой `<link rel="stylesheet" href="studio-nodes.css">`
2. `<button class="st-b" data-st="zfit">По экрану</button>` → добавить после него `<button class="st-b" data-st="grid" id="st-gridb">Сетка: выкл</button>` и `<button class="st-b" data-st="multi" id="st-multib" aria-pressed="false">Несколько</button>`
3. После `<script src="st-store.js"></script>` добавить `st-nodes.js`, `st-nstyle.js`
4. После `<script src="st-canvas.js"></script>` добавить `st-gest.js`
5. После `<script src="st-fontui.js"></script>` добавить `st-nodeui.js`, `st-insp.js` (всё до `st-ui.js`)

### st-ui.js
1. Блок `L.innerHTML=ST.p.screens.map(function(s){ … '＋ Экран</button>';` (в ветке `ui.tab==='layers'`) → `L.innerHTML=ST.nodeui.list();`
2. `ST.fontui.inspector()+'<div class="st-lh">Проект</div>':'')+` → `ST.fontui.inspector()+'<div class="st-lh">Проект</div>':ui.tab==='layers'&&ST.insp?ST.insp.html()+'<div class="st-lh">Проект</div>':'')+`
3. `  if(ST.tokui)ST.tokui.sync();\n  ST.canvas.render();` → между строками вставить: `var gb=$('#st-gridb'),mb=$('#st-multib');if(gb)gb.textContent='Сетка: '+(ST.canvas.grid||'выкл');if(mb){mb.classList.toggle('on',!!ST.gest.multi);mb.setAttribute('aria-pressed',ST.gest.multi?'true':'false');}`
4. `    else if(a==='addscr')ST.addScreen();` → перед ним: `else if(a==='grid'){ST.canvas.cycleGrid();ui.render();}` и `else if(a==='multi'){ST.gest.multi=!ST.gest.multi;ui.render();}`
5. `if(ST.tokui)ST.tokui.bind();if(ST.fontui)ST.fontui.bind();` → дописать `ST.nodeui.bind();ST.insp.bind();ST.gest.bind();`
