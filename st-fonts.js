/* Catworking Studio: шрифты и типографика (данные, проверки, CSS). Без DOM. Объект ST.fonts */
(function(){'use strict';
var ST=window.ST=window.ST||{},F=ST.fonts={};
function isO(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function res(ok,err){return ok?{ok:true}:{error:err||'Изменение не выполнено.'};}

/* ---------- каталог: 10 файлов из fonts/ (глифы сверены fontTools 21.11.2026). f=файл, k=вид, w=[мин,макс] вес, kb=размер, miss=чего нет в файле ---------- */
F.CAT=[
  {n:'Nunito',f:'Nunito.woff',k:'округлый, основной текст',w:[200,1000],kb:91.2,lic:'OFL 1.1',miss:'',fb:'ui-rounded,system-ui,sans-serif'},
  {n:'Rubik',f:'Rubik.woff',k:'округлый, заголовки',w:[300,900],kb:73.8,lic:'OFL 1.1',miss:'',fb:'system-ui,sans-serif'},
  {n:'Comfortaa',f:'Comfortaa.woff',k:'округлый, геометрический',w:[300,700],kb:98.7,lic:'OFL 1.1',miss:'',fb:'ui-rounded,system-ui,sans-serif'},
  {n:'Onest',f:'Onest.woff',k:'нейтральный',w:[100,900],kb:70.0,lic:'OFL 1.1',miss:'',fb:'system-ui,sans-serif'},
  {n:'Roboto Slab',f:'RobotoSlab.woff',k:'строгий, с засечками',w:[100,900],kb:99.5,lic:'Apache 2.0',miss:'₴₽',fb:'Georgia,serif'},
  {n:'Pixelify Sans',f:'PixelifySans.woff',k:'пиксельный',w:[400,700],kb:22.8,lic:'OFL 1.1',miss:'ІП₴₽',fb:'ui-monospace,Menlo,Consolas,monospace'},
  {n:'Press Start 2P',f:'PressStart2P.woff',k:'пиксельный, игровой',w:[400,400],kb:37.5,lic:'OFL 1.1',miss:'',fb:'ui-monospace,Menlo,Consolas,monospace'},
  {n:'Pangolin',f:'Pangolin.woff',k:'рукописный, для облачков',w:[400,400],kb:195.3,lic:'OFL 1.1',miss:'',fb:'cursive,sans-serif'},
  {n:'Caveat',f:'Caveat.woff',k:'рукописный, быстрый',w:[400,700],kb:194.5,lic:'OFL 1.1',miss:'',fb:'cursive,sans-serif'},
  {n:'JetBrains Mono',f:'JetBrainsMono.woff',k:'моноширинный, даты и счётчики',w:[100,800],kb:62.3,lic:'OFL 1.1',miss:'₴',fb:'ui-monospace,Menlo,Consolas,monospace'}
];
F.ROLES=['display','body','mono','pixel'];
F.ROLE_NAME={display:'Заголовки',body:'Основной текст',mono:'Числа и даты',pixel:'Надписи кота'};
F.DEF_ROLES={display:'Nunito',body:'Nunito',mono:'Nunito',pixel:'Press Start 2P'}; /* как профиль «Макеты Nunito» (studio-profiles.json) */
/* Пресеты: 32/800, 17/800, 13/700, 15/800 из макетов (P1, Шаг 3 п. 3). Счётчик и «Кнопка» оба 15/800: макеты не присланы, различие предложено мной. */
F.PRESETS=[
  {k:'title',n:'Заголовок экрана',t:{ff:'role:display',fw:800,fs:32,lh:1.1,ls:0,tt:'none',ta:'left',cl:0,c:'@tx',tnum:false}},
  {k:'cardtitle',n:'Заголовок карточки',t:{ff:'role:display',fw:800,fs:17,lh:1.2,ls:0,tt:'none',ta:'left',cl:2,c:'@tx',tnum:false}},
  {k:'caption',n:'Подпись',t:{ff:'role:body',fw:700,fs:13,lh:1.3,ls:0,tt:'none',ta:'left',cl:0,c:'@mu',tnum:false}},
  {k:'counter',n:'Счётчик',t:{ff:'role:mono',fw:800,fs:15,lh:1,ls:0,tt:'none',ta:'left',cl:0,c:'@tx',tnum:true}},
  {k:'button',n:'Кнопка',t:{ff:'role:body',fw:800,fs:15,lh:1,ls:0,tt:'none',ta:'center',cl:0,c:'@act',tnum:false}}
];
F.TT={none:'как написано',upper:'ВСЕ ЗАГЛАВНЫЕ',lower:'все строчные',cap:'Каждое Слово'};
F.TA={left:'слева',center:'по центру',right:'справа'};
F.PANGRAM='Съешь ещё этих мягких французских булок, да выпей чаю';
F.GLYPHS='ЁЙЩЪЫЭЮЯ ёйщъыэюя № ₴ ₽ 0123456789';
var CYR=/[А-ЯЁІЇЄҐа-яёіїєґ]/;
F.live={}; /* что нашла проверка в этом браузере: {имя:{miss}} (ST.fontui.verify) */

function find(n){for(var i=0;i<F.CAT.length;i++)if(F.CAT[i].n===n)return F.CAT[i];return null;}
F.find=find;
F.miss=function(n){if(F.live[n]&&!F.live[n].nofile)return F.live[n].miss;var c=find(n);return c?c.miss:'';}; /* nofile: файл не загрузился, проверка ничего не говорит, берём таблицу */
/* ok — всё есть; warn — нет только символов (валюта, №); bad — нет русских букв: в список не попадает */
F.level=function(n){var m=F.miss(n);return !m?'ok':CYR.test(m)?'bad':'warn';};
F.list=function(){return F.CAT.filter(function(c){return F.level(c.n)!=='bad';});};
F.blocked=function(){return F.CAT.filter(function(c){return F.level(c.n)==='bad';});};
F.weights=function(n){var c=find(n);if(!c)return [400];var a=[],w;if(c.w[0]===c.w[1])return [c.w[0]];
  for(w=Math.ceil(c.w[0]/100)*100;w<=c.w[1];w+=100)a.push(w);return a;};
F.stack=function(n){var c=find(n),q=String(n).replace(/[^A-Za-z0-9 \-]/g,'');return "'"+q+"',"+(c?c.fb:'system-ui,sans-serif');};
F.sysStack=function(r){return r==='display'||r==='body'?'ui-rounded,system-ui,sans-serif':'ui-monospace,Menlo,Consolas,monospace';};

/* ---------- роли и тексты проекта: ST.p.fonts {роль: гарнитура}, ST.p.text {ключ: стиль} ---------- */
F.seed=function(d){
  d.fonts=isO(d.fonts)?d.fonts:{};d.text=isO(d.text)?d.text:{};
  F.ROLES.forEach(function(r){if(typeof d.fonts[r]!=='string')d.fonts[r]=F.DEF_ROLES[r];});
  F.PRESETS.forEach(function(x){if(!isO(d.text[x.k]))d.text[x.k]=JSON.parse(JSON.stringify(x.t));});
  return d;};
F.family=function(p,ff){var m=/^role:(\w+)$/.exec(ff||'');return m?((p.fonts||{})[m[1]]||F.DEF_ROLES[m[1]]||''):ff;};
F.isRole=function(ff){return /^role:(display|body|mono|pixel)$/.test(ff||'');};
F.vars=function(p){var v={};F.ROLES.forEach(function(r){v['--f-'+r]=F.stack((p.fonts||{})[r]||F.DEF_ROLES[r]);});return v;};
F.styleAttr=function(p){var v=F.vars(p);return Object.keys(v).map(function(k){return k+':'+v[k]+';';}).join('');};

/* проверка стиля текста: '' если верно, иначе сообщение */
F.checkT=function(t){
  function num(v,a,b,m){return typeof v==='number'&&isFinite(v)&&v>=a&&v<=b?'':m;}
  if(!isO(t))return 'Стиль текста повреждён.';
  if(!(F.isRole(t.ff)||(typeof t.ff==='string'&&/^[A-Za-z0-9][A-Za-z0-9 \-]{0,39}$/.test(t.ff))))return 'Гарнитура не распознана.';
  var e=num(t.fw,100,1000,'Начертание (вес) от 100 до 1000.')||num(t.fs,6,400,'Размер от 6 до 400 px.')||num(t.lh,0.5,4,'Межстрочный от 0,5 до 4.')||
    num(t.ls,-0.5,2,'Межбуквенный от −0,5 до 2 em.')||num(t.cl,0,12,'Строк до обрезки: от 0 (без обрезки) до 12.');
  if(e)return e;
  if(t.cl%1)return 'Число строк должно быть целым.';
  if(!F.TT[t.tt])return 'Регистр не распознан.';if(!F.TA[t.ta])return 'Выравнивание не распознано.';
  if(typeof t.tnum!=='boolean')return 'Поле «цифры одной ширины» повреждено.';
  if(!(typeof t.c==='string'&&((/^@[a-z][a-z0-9-]*$/.test(t.c))||(ST.tok&&ST.tok.parse(t.c)))))return 'Цвет текста: токен («@tx») или цвет вида #rrggbb.';
  return '';};
F.validate=function(p){
  if(p.fonts!==undefined&&!isO(p.fonts))return 'повреждён раздел fonts';
  if(p.text!==undefined&&!isO(p.text))return 'повреждён раздел text';
  var k;for(k in (p.fonts||{}))if(typeof p.fonts[k]!=='string'||p.fonts[k].length>40)return 'повреждена гарнитура роли «'+k+'»';
  for(k in (p.text||{}))if(F.checkT(p.text[k]))return 'повреждён стиль текста «'+k+'»';
  return '';};

/* CSS стиля текста. По умолчанию роль даёт var(--f-роль) (холст); opt.resolve раскрывает её в список гарнитур (экспорт, Шаг 7). */
F.css=function(t,p,opt){
  var ff=F.isRole(t.ff)?(opt&&opt.resolve?F.stack(F.family(p,t.ff)):'var(--'+'f-'+t.ff.slice(5)+')'):F.stack(t.ff);
  var s='font-family:'+ff+';font-weight:'+t.fw+';font-size:'+t.fs+'px;line-height:'+t.lh+';letter-spacing:'+t.ls+'em;text-align:'+t.ta+';'+
    'text-transform:'+({none:'none',upper:'uppercase',lower:'lowercase',cap:'capitalize'}[t.tt])+';color:'+(ST.tok?ST.tok.css(t.c):t.c)+';';
  if(t.tnum)s+='font-variant-numeric:tabular-nums;';
  if(t.cl>0)s+='display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:'+t.cl+';overflow:hidden;';
  return s;};
F.name=function(k){for(var i=0;i<F.PRESETS.length;i++)if(F.PRESETS[i].k===k)return F.PRESETS[i].n;return k;};

/* предупреждения (качество, не запрет): P5 п. 9 */
F.warnT=function(p,t){
  var w=[],fam=F.family(p,t.ff),c=find(fam),lv=fam?F.level(fam):'ok',m=F.miss(fam);
  if(t.fs<12)w.push('Текст меньше 12 px читается плохо.');
  if(!c)w.push('Гарнитуры «'+fam+'» нет в списке студии: файла для неё нет.');
  else{
    if(lv==='bad')w.push('В шрифте «'+fam+'» нет русских букв ('+m+'): текст подменится запасным шрифтом.');
    else if(lv==='warn')w.push('В шрифте «'+fam+'» нет символов «'+m+'»: их нарисует запасной шрифт.');
    if(c.w[0]===c.w[1]&&t.fw!==c.w[0])w.push('У шрифта «'+fam+'» один вес ('+c.w[0]+'): жирность браузер дорисует искусственно.');
    else if(t.fw<c.w[0]||t.fw>c.w[1])w.push('Шрифт «'+fam+'» поддерживает вес от '+c.w[0]+' до '+c.w[1]+': браузер возьмёт ближайший.');
  }
  if(!F.isRole(t.ff))w.push('Гарнитура задана вне профиля: при смене профиля она не поменяется.');
  if(t.c.charAt(0)!=='@')w.push('Сырой цвет: лучше токен.');
  return w;};
F.countWarn=function(p){var n=0;
  F.ROLES.forEach(function(r){var f=(p.fonts||{})[r];if(f&&(!find(f)||F.level(f)==='bad'))n++;});
  Object.keys(p.text||{}).forEach(function(k){if(isO(p.text[k])&&!F.checkT(p.text[k]))n+=F.warnT(p,p.text[k]).length?1:0;});
  return n;};

/* ---------- какие файлы нужны приложению (для Шага 7), P5 п. 7, P6 п. 17 ---------- */
function walk(n,fn){fn(n);(n.children||[]).forEach(function(c){walk(c,fn);});}
F.usedFamilies=function(p){
  var set={},roles={};
  function add(t){if(!isO(t)||typeof t.ff!=='string')return;
    var m=/^role:(\w+)$/.exec(t.ff);if(m){roles[m[1]]=1;}else set[t.ff]=1;}
  Object.keys(p.text||{}).forEach(function(k){add(p.text[k]);});
  function scan(n){if(isO(n)&&isO(n.style))add(n.style.text);}  /* узлы: стиль текста лежит в style.text (договорённость до Шага 4) */
  (p.screens||[]).forEach(function(s){if(s.root)walk(s.root,scan);});
  (p.components||[]).forEach(function(c){var r=c&&(c.root||c);if(isO(r))walk(r,scan);});
  Object.keys(roles).forEach(function(r){var f=(p.fonts||{})[r];if(f)set[f]=1;});
  return Object.keys(set);};
F.report=function(p){
  var fam=F.usedFamilies(p),files=[],kb=0,warns=[];
  fam.forEach(function(n){var c=find(n);
    if(!c){warns.push('Гарнитуры «'+n+'» нет в студии: файл придётся добавить вручную.');return;}
    files.push({name:c.n,file:'fonts/'+c.f,kb:c.kb,lic:c.lic});kb+=c.kb;
    if(F.level(n)==='bad')warns.push('«'+n+'»: нет русских букв ('+F.miss(n)+'), использовать нельзя.');
    else if(F.level(n)==='warn')warns.push('«'+n+'»: нет символов «'+F.miss(n)+'», их нарисует запасной шрифт.');});
  if(files.length){
    warns.push('Файлы нужно положить в проект и добавить в sw.js → CORE, затем поднять VERSION: файл, которого нет в CORE, офлайн молча не загрузится.');
    warns.push('В приложении 7 мест с недействительным font:… inherit (.btn; .cal-wkt, .cal-ymt, .cal-tltxt, .cal-hchip; .imx-step, .imx-ed): гарнитура на них не применится, пока это не исправлено отдельным шагом приложения (STUDIO_CONTRACT §7).');}
  return {families:fam,files:files,kb:Math.round(kb*10)/10,warns:warns};};

/* ---------- команды (всё через ST.do: отмена и возврат работают) ---------- */
F.setRole=function(role,family){
  var g=ST.prof&&ST.prof.guard();if(g)return g; /* встроенный профиль не правится (Шаг 1А) */
  if(F.ROLES.indexOf(role)<0)return {error:'Неизвестная роль шрифта.'};
  if(!find(family))return {error:'Такого шрифта нет в списке студии.'};
  if(F.level(family)==='bad')return {error:'В шрифте «'+family+'» нет русских букв ('+F.miss(family)+'). Для интерфейса на русском он не подходит.'};
  if((ST.p.fonts||{})[role]===family)return {ok:true};
  return res(ST.do('шрифт роли «'+F.ROLE_NAME[role]+'»',function(x){x.fonts=x.fonts||{};x.fonts[role]=family;}));};
F.setText=function(key,patch){
  var g=ST.prof&&ST.prof.guard();if(g)return g;
  var cur=(ST.p.text||{})[key];if(!cur)return {error:'Такого стиля текста нет.'};
  var n=Object.assign({},cur,patch),e=F.checkT(n);if(e)return {error:e};
  if(JSON.stringify(n)===JSON.stringify(cur))return {ok:true};
  return res(ST.do('текст «'+F.name(key)+'»',function(x){x.text[key]=n;}));};
F.resetText=function(key){
  var g=ST.prof&&ST.prof.guard();if(g)return g;
  var d=null;F.PRESETS.forEach(function(x){if(x.k===key)d=x;});if(!d)return {error:'Такого стиля текста нет.'};
  return res(ST.do('сброс текста «'+d.n+'»',function(x){x.text[key]=JSON.parse(JSON.stringify(d.t));}));};
})();
