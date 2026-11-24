/* Catworking Studio: экспорт, часть 3 (Шаг 7): сборка результата, проверки, пакет для ИИ-кодера (.md). Без DOM. Дополняет ST.exp.
   Вход: проект и выбранный экран (или мастер). Режим берётся из профиля экрана (STUDIO_PLAN P5 п. 14): app, module, skin. Весь проект не выгружается. */
(function(){'use strict';
var ST=window.ST,X=ST.exp,N=ST.nodes;
function isO(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function clone(o){return JSON.parse(JSON.stringify(o));}
X.MODE_NAME={app:'общий дизайн (app)',module:'стиль модуля (module)',skin:'скин приложения (skin)'};

X.find=function(p,id){var a=(p.screens||[]).concat((p.components||[]).filter(isO)),i;for(i=0;i<a.length;i++)if(a[i]&&a[i].id===id&&isO(a[i].root))return a[i];return null;};
/* дерево без экземпляров, скрытых узлов и нижней панели */
function flat(n,p,notes,top){
  if(n.hidden)return null;
  if(n.type==='instance'){var v=ST.comp&&ST.comp.resolve(n,p);if(!v){notes.push('Экземпляр «'+(n.name||'')+'»: мастер не найден, пропущен.');return null;}n=v;}
  if(!top&&X.NAV_RE.test(n.name||'')){notes.push('«'+n.name+'» не выгружается: нижнюю панель рисует приложение (nav), контракт §8 п. 1.');return null;}
  var c=Object.assign({},n);c.children=[];
  (n.children||[]).forEach(function(k){var f=flat(k,p,notes,false);if(f)c.children.push(f);});
  return c;}
X.flat=function(p,root,notes){return flat(root,p,notes||[],true);};

/* запрещённое в выдаче (STUDIO_CONTRACT §8; STUDIO_PLAN Шаг 7, п. 3): [шаблон, что это] */
var BAD=[[/<nav\b/i,'тег <nav>'],[/data-tab\s*=/,'data-tab (якорь нижней панели)'],[/data-a="go"/,'действие go (нижняя панель)'],[/width:\s*390px/,'width:390px'],[/height:\s*844px/,'height:844px'],
  [/z-index:\s*[678]\b/,'z-index 6–8'],[/z-index:\s*(?!4\b|52\b|53\b|[678]\b)\d+/,'z-index не по правилу §7'],[/sc-camel-view-box/,'sc-camel-view-box'],[/font:[^;}]*inherit/,'шорткат font: с inherit']];
X.verify=function(list){var out=[];
  list.forEach(function(it){BAD.forEach(function(b){if(b[0].test(it.text))out.push('В «'+it.where+'» найдено запрещённое: '+b[1]+'.');});});
  list.forEach(function(it){if(it.css&&/(^|\n)\s*(:root|body|html|\*)\s*[{,]/.test(it.text))out.push('В «'+it.where+'» глобальный селектор (:root, body, html или *): правила должны идти только под классами модуля.');});
  return out;};

function problems(pr,root,errors){
  var fake={tokens:pr.tokens,screens:[{name:'экран',root:root}],components:[]},th={light:'светлой',dark:'тёмной'};
  ST.tok.problems(fake).forEach(function(x){
    if(x.k==='missing')errors.push('Токен «'+x.n+'»: нет значения в '+th[x.th]+' теме. Заполните обе темы на вкладке «Токены».');
    else if(x.k==='bad')errors.push('Токен «'+x.n+'»: цвет в '+th[x.th]+' теме не распознан.');
    else errors.push('Узел ссылается на токен «'+x.n+'», которого нет в профиле «'+pr.name+'» ('+x.where+').');});
  var seen={};
  ST.tok.names(fake).forEach(function(n){var v=X.appVar(pr,n),b=v.slice(2);
    if(X.BUSY_VARS.indexOf(b)>=0||/^fx-/.test(b))errors.push('Переменная '+v+' (токен «'+n+'») занята модулем приложения. Переименуйте токен или задайте другое «имя в приложении».');
    if(seen[v])errors.push('Токены «'+seen[v]+'» и «'+n+'» получают одну переменную '+v+'.');seen[v]=n;});
  return ST.tok.pairIssues(fake).map(function(x){return 'Контраст '+x.fg+' на '+x.bg+' ('+(x.th==='light'?'светлая':'тёмная')+') '+ST.tok.fmtRatio(x.r)+', ниже 4,5:1.';});}

X.make=function(p,opt){
  opt=opt||{};
  var src=X.find(p,opt.id||(ST.screen()&&ST.screen().id));
  if(!src)return {error:'Экран не найден. Выберите экран или мастер-компонент.'};
  var pr=ST.prof.get(p,src.profile);
  if(!pr)return {error:'У экрана нет профиля оформления. Назначьте профиль и повторите экспорт.'};
  var prefix=String(opt.prefix||'').trim().toLowerCase();
  if(!/^[a-z][a-z0-9]{1,5}$/.test(prefix))return {error:'Префикс модуля: латиница и цифры, от 2 до 6 знаков, начинается с буквы (например, sj или fx).'};
  var mode=pr.scope;
  if(mode==='module'&&(prefix==='mus'||prefix==='scn'))return {error:'Для модулей mus и scn режим «стиль модуля» не используется (контракт §11.2). Назначьте экрану профиль «Catworking сейчас».'};
  var notes=[],warns=[],errors=[],root=X.flat(p,src.root,notes);
  if(!root||!root.children.length)return {error:'Экран «'+src.name+'» пустой: добавьте узлы, потом экспортируйте.'};
  var sslug=X.slug(opt.slug||src.name,24),ns=X.mod(prefix).ns,m=X.mod(prefix),sc={id:src.id,name:src.name,slug:sslug,w:Number(src.w)||390,h:Number(src.h)||844};
  var as=X.assign(root,prefix,sslug);
  if(as.renamed.length)notes.push('Классы переименованы, потому что имя занято: '+as.renamed.join('; ')+'.');
  var c={root:root,cls:as.cls,pr:pr,screen:sc,warns:warns,prefix:prefix,sslug:sslug,ns:ns,acts:as.acts,screenName:src.name,fn:X.fnName(prefix,sslug)};
  var css=X.css(c),mk=X.markup(c),f=X.fonts(pr,root),used=X.used(css.text);
  var pairWarn=problems(pr,root,errors);
  var extra=String(opt.extra||'').split(',').map(function(s){return s.trim();}).filter(function(s){return /^[.#][A-Za-z0-9_-]+$/.test(s);});
  var tb=X.tokenBlock({mode:mode,prefix:prefix,pr:pr,used:used,skinId:X.slug(pr.id,30),extra:extra});
  var rate=(prefix==='dk'&&mode==='module')?X.rate(pr,'module',tb.roots||[],warns):(mode==='skin'?X.rate(pr,'skin',tb.roots||[],warns):'');
  /* P6 п. 19: каждая использованная переменная определена: в блоке (module, skin) или в приложении / в блоке «добавить» (app) */
  var defined={};X.varsOf(pr,'dark').forEach(function(x){defined[x[0]]=1;});
  used.forEach(function(v){if(!defined[v])errors.push('Переменная '+v+' используется в CSS, но не задана профилем «'+pr.name+'».');
    else if(mode==='app'&&X.APP_VARS.indexOf(v.slice(2))<0&&!tb.add.some(function(a){return a.v===v;}))errors.push('Переменная '+v+' не попала в блок «добавить».');});
  var js=X.js(c,mk),dict=X.dict(c,mk),acts=X.actCode(c);
  X.verify([{where:'CSS',text:css.text,css:true},{where:'разметка',text:js},{where:'токены',text:tb.text,css:mode==='module'}]).forEach(function(e){errors.push(e);});
  css.raws.forEach(function(r){warns.push('Сырой цвет в «'+r.node+'»: '+r.decl+'. Сделайте его токеном (кнопка «→ токен» в инспекторе).');});
  N.warns(root).forEach(function(w){warns.push(w.msg);});
  N.walk(root,function(n,par){var L=n.layout||{};if(par&&n.type==='frame'&&!(n.children||[]).length&&typeof L.w!=='number'&&typeof L.h!=='number')
    warns.push('Пустая рамка «'+(n.name||'Рамка')+'» без размера: на холсте она показана размером 24 px, в приложении будет 0.');});
  pairWarn.forEach(function(w){warns.push(w);});
  f.warns.concat(mk.warns).forEach(function(w){warns.push(w);});
  if(as.acts.length)notes.push('Кнопок с действиями: '+as.acts.length+'. Их тела (заготовки data-a) пишет ИИ-кодер.');
  if(mk.i18n.length)notes.push('Английский текст в строках пока равен русскому: перевод сделает ИИ-кодер по промпту из пакета.');
  var fileCss=prefix+'-'+sslug+'.css',fileJs=prefix+'-'+sslug+'-view.js';
  var r={ok:true,mode:mode,prefix:prefix,ns:ns,fn:c.fn,screen:sc,pr:pr,src:src,root:root,cls:as.cls,acts:as.acts,mk:mk,css:css,used:used,tb:tb,rate:rate,fonts:f,js:js,dict:dict,actCode:acts,
    fileCss:fileCss,fileJs:fileJs,mod:m,warns:warns,errors:errors,notes:notes.concat(tb.notes),extra:extra};
  r.files=X.filesText(r);r.json=X.json(p,r);r.pkg=X.pkg(r);
  return r;};

X.filesText=function(r){
  var m=r.mod,o=[];
  if(r.mode!=='skin'){
    o.push('Новый файл '+r.fileCss+': в index.html '+(m.css?'после '+m.css:'после CSS модуля (проверьте порядок, §3)')+'; добавить в sw.js → CORE.');
    o.push('Новый файл '+r.fileJs+': в index.html '+(m.js?'после '+m.js:'после остальных файлов модуля')+(m.boot?' и до '+m.boot:'')+'; добавить в sw.js → CORE.');}
  else o.push('Файлы CSS и JS экрана в режиме skin не выдаются: нужен только блок значений скина (styles.css) и шаги приложения S1–S3.');
  r.fonts.files.forEach(function(f){o.push('Шрифт '+f.file+' ('+f.name+', '+f.kb+' КБ, '+f.lic+'): положить в проект и добавить в sw.js → CORE.');});
  if(!r.fonts.files.length)o.push('Файлов шрифтов нет: профиль использует системный шрифт.');
  o.push('VERSION в sw.js: по желанию (стратегия «сеть в приоритете», контракт §7).');
  return o.join('\n');};

X.json=function(p,r){
  var comps={},src=r.src;
  N.walk(src.root,function(n){if(n.type==='instance'&&n.ref){var c=ST.comp.get(p,n.ref.c);if(c)comps[c.id]=clone(c);}});
  return JSON.stringify({format:'catworking-studio-screen',schema:ST.SCHEMA,profile:clone(r.pr),screen:clone(src),components:Object.keys(comps).map(function(k){return comps[k];})},null,2);};

/* ---------- пакет для ИИ-кодера ---------- */
function fence(lang,s){return '```'+lang+'\n'+String(s).replace(/```/g,'``​`')+'\n```';}
var ANCH=['Нижняя панель nav: `<button data-tab="today">` (вставка «План» ищет её регулярным выражением), `data-a="go"`, `data-tab`; в режиме «дзен» nav() возвращает пустую строку.',
  '«Сегодня»: карточки «Темы» и «Нагрузка» вставляются перед первым `<div class="card` экрана.','«Повтор»: `<div class="card"><div class="mut sm">…</div><div class="q">`, `<div class="rate">`, `<h1>`.',
  'Календарь: `data-d="…"><b class="cal-num">`, `<div class="card cal-day">`, `class="cal-time"`.','«Предметы»: `SJ.ready`, `sjV()` и `sjO()` в app.js, `VIEWS.review`, `musC()` / `MUS.moreCard`, `id` `musVol` и `musVolTxt`.'];
var NO=['Не добавлять `<nav>`, `width:390px`, `z-index` 6–8; подложка шторки 52, панель 53, прилипающая кнопка 4, остальным z-index не задавать.',
  'Не переопределять глобальные `.card`, `.btn`, `.chip`, `.row`, `h1`, `h2`, `body`, `nav`, `input` вне корня модуля; значения существующих токенов приложения не менять.',
  'Не менять `data-a`, `data-tab`, `data-id` существующих действий, имена в `act`, `id` полей ввода, структуру `L`/`T()`, схему данных `S`.',
  'Не использовать `font:` шорткат с `inherit`; не склеивать фразы из кусков; данные пользователя только через `esc()`; код не новее ES2020.',
  'Не вводить новые цепочки обёрток и новые глобальные имена, кроме объекта модуля с префиксом (свод §2).'];
var NOCOV=['`body`: фон (градиент `--bg` → `--bg2`) и отступы остаются общими.','Нижняя панель `nav`, `.drw-bg`, `.drw`, `.mdl`, `#toast` лежат вне корня модуля.',
  'Жёсткие цвета и моноширинные шрифты в CSS модулей (контракт §12.2, §12.5) и цвета внутри JS и SVG (`sprites.js`, `scene-art.js`) не перекрасятся.',
  'Глобальные `.card`, `.btn`, `.chip` не читают `--r` и `--sh`: форму внутри корня задают классы модуля.'];
var SKIN=['`app.js`: поле `S.skin` (по умолчанию `\'\'`), проверка по списку допустимых значений в `load`, импорте и действии; `render()` ставит или снимает `data-skin` на `<html>` рядом с `data-theme`.',
  'Экран «Ещё» (`moreView`): переключатель скина по образцу темы; кнопка не меньше 44 px; тексты в `L.ru` и `L.en`.','`styles.css`: три блока `:root[data-skin=…]` после основных `:root`.',
  '`sw.js` → CORE: файлы шрифтов скина. `index.html:7` (`theme-color`) по умолчанию не менять.','Не больше 5 файлов за шаг (свод §10); версию `v` схемы `S` поднимать не нужно (контракт §11.5).'];
function list(a){return a.map(function(x){return '- '+x;}).join('\n');}
X.pkg=function(r){
  var s=[],date=new Date().toISOString().slice(0,10),pn=r.pr.name,sn=r.screen.name;
  s.push('# Пакет для ИИ-кодера: экран «'+sn+'»','','Создан Catworking Studio ('+date+'). Режим: **'+X.MODE_NAME[r.mode]+'**. Профиль оформления: «'+pn+'». Модуль: `'+r.prefix+'` (`'+r.ns+'`).','');
  s.push('## 1. Промпт для чата с ИИ-кодером','','Приложите к сообщению `CATWORKING_ROUTER.md`, `CATWORKING_RULES.md` и этот файл. Текст сообщения:','');
  s.push(fence('',[
    'Работай по своду правил. Вставь дизайн «'+sn+'» в приложение по пакету ниже (режим '+r.mode+', модуль '+r.prefix+').',
    'Сначала по роутеру назови подсистему, перечисли файлы и фрагменты, которые тебе нужны, и запроси недостающие (код не пиши до получения).',
    'Затем выдай правки парами «файл + найти → заменить» или целыми новыми файлами; не больше 5 существующих файлов за шаг.',
    r.mode==='skin'?'Это скин всего приложения: выполни шаги приложения S1–S3 из раздела 3 пакета.':'Все тексты добавь в ru и en: английские значения в разделе «Строки» пока равны русским, переведи их.',
    'Тела действий из раздела «Действия» напиши по описанию кнопок; новые действия объяви в '+r.ns+'.act до загрузки boot-файла.',
    'Не нарушай раздел «Что нельзя менять». В конце дай отчёт по формату свода (раздел 9) и чек-лист приёмки из этого пакета.'].join('\n')),'');
  s.push('## 2. Что и куда','',r.files,'');
  if(r.mode==='module')s.push('Обёртка: экран и его шторки должны лежать внутри `<div class="'+r.prefix+'-root">`. Добавлять её **снаружи** HTML экрана, в том месте, где его вызывает `render()` или boot-файл, а не внутри view-функции, чтобы не ломать якоря (раздел 10).'+(r.prefix==='sj'?' Для `sj`: в `sjV` и `sjO` (`app.js`), например `\'<div class="sj-root">\'+SJ.view()+\'</div>\'`.':'')+(r.prefix==='dk'?' Для `dk`: в `dk-boot.js` вместо `VIEWS.review = DK.view` писать функцию, возвращающую `\'<div class="dk-root">\'+DK.view()+\'</div>\'`.':''),'');
  s.push('## 3. '+(r.mode==='skin'?'Блоки скина и шаги приложения':'Значения токенов'),'');
  if(r.mode==='module')s.push('Блок идёт в начало файла `'+r.fileCss+'`. Селектор содержит **все** корни модуля: '+(r.tb.roots||[]).map(function(x){return '`'+x+'`';}).join(', ')+'. Блок задаёт все переменные профиля.','',fence('css',r.tb.text),'');
  else if(r.mode==='skin')s.push('Блоки идут в `styles.css` после основных `:root`. Идентификатор скина: `'+X.slug(r.pr.id,30)+'`.','',fence('css',r.tb.text),'','Что менять в приложении (контракт §11.5):',list(SKIN),'');
  else s.push(r.tb.text?'Добавить в `styles.css` после основных `:root` (только новые переменные; значения существующих токенов не менять):':'Блок не нужен.','',r.tb.text?fence('css',r.tb.text):'',r.tb.diff.length?'Значения, которые отличаются от приложения (НЕ записывать, только к сведению):\n'+list(r.tb.diff.map(function(d){return '`'+d.v+'` ('+(d.th==='dark'?'тёмная':'светлая')+'): в экране `'+d.mine+'`, в приложении `'+d.app+'`';})):'','');
  if(r.rate)s.push(fence('css',r.rate),'');
  if(r.mode!=='skin'){
    if(r.fonts.face)s.push('## 4. Шрифты (`@font-face`) — в начало `'+r.fileCss+'`','',fence('css',r.fonts.face),'');
    s.push('## 5. CSS (файл `'+r.fileCss+'`)','',fence('css',r.css.text),'');
    s.push('## 6. Разметка (файл `'+r.fileJs+'`)','','Функция возвращает строку HTML, как остальные view-функции приложения. `esc` и `T` — глобальные функции `app.js`.','',fence('js',r.js),'');
    if(r.mk.data.length)s.push('Данные `d`, которые подставляет вызывающий код (каждая подстановка идёт через `esc()`):',list(r.mk.data.map(function(x){return '`d.'+x.name+'` — значение для `{'+x.name+'}` в тексте узла «'+x.node+'»: «'+x.text+'»';})),'');
    s.push('## 7. Строки ru и en (в файл `'+r.fileJs+'`, до его использования; ключи с префиксом `'+r.prefix+'_`)','',r.dict?fence('js',r.dict):'Текстов нет.','');
    s.push('## 8. Действия (`'+r.ns+'.act`, объявить до загрузки boot-файла)','',r.actCode?fence('js',r.actCode):'Кнопок с действиями нет.','');
    if(r.acts.length)s.push(list(r.acts.map(function(a){return '`'+a.name+'` — кнопка «'+a.node+'»: что делает, решает ИИ-кодер по смыслу экрана (спросите владельца, если неясно)';})),'');}
  s.push('## 9. Чек-лист приёмки (свод §8)','',list(['Названы файл и место каждой правки.','Нет новых цепочек обёрток, дублей утилит и глобальных имён.','Порядок загрузки не нарушен; новые файлы есть в `index.html` и `sw.js` CORE.',
    'Строки в ru и en, весь текст через `esc()`.','Тёмная и светлая темы, кнопки не меньше 44 px, `prefers-reduced-motion`.','Нет мёртвого кода и отладочного вывода; тесты обновлены.','Перечислено, что могло побочно сломаться; остальные экраны не изменились.']),'');
  s.push('## 10. Что нельзя менять','',list(NO),'','Якоря, которые нельзя ломать (контракт §6):',list(ANCH),'');
  if(r.mode==='module')s.push('## 11. Что режим module не покрывает','',list(NOCOV),'');
  var out=r.errors.length?['Ошибки (экспорт заблокирован до исправления):'].concat(r.errors):[];
  s.push('## 12. Отчёт студии','',out.length?list(out):'Ошибок нет.','',r.warns.length?'Предупреждения:\n'+list(r.warns):'Предупреждений нет.','',r.notes.length?'Примечания:\n'+list(r.notes):'');
  return s.join('\n');};
})();
