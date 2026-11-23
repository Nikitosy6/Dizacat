/* Catworking Studio: стартовый набор мастеров по макетам «Предметы», «Шторка», «Фокус» (Предметы_редизайн.html). Объект ST.presets.
   Только токены, роли шрифтов и значения формы профиля (P5 п. 15): жёстких цветов и радиусов нет. Внутри мастеров экземпляров нет, повторяющиеся куски построены заново.
   Отличия от макетов: радиусы и бортики берутся из формы профиля (r, rl, ledge), поэтому у «Макеты Nunito» они на 1 px меньше макетных; полупрозрачные белые подложки заменены токенами. */
(function(){'use strict';
var ST=window.ST=window.ST||{},N=ST.nodes,P=ST.presets={};
function T(id,name,text,fs,fw,c,fill,ff){return {id:id,type:'text',name:name,layout:fill?{w:'fill'}:{},style:{text:{ff:ff||'role:body',fw:fw,fs:fs,lh:1.3,ls:0,tt:'none',ta:'left',cl:0,c:c||'@tx',tnum:false}},props:{text:text},children:[]};}
function I(id,name,icon,sz,c){return {id:id,type:'icon',name:name,layout:{w:sz||22,h:sz||22},style:{ic:c||'@tx'},props:{icon:icon},children:[]};}
function S(id,name,layout,style,ovr){var n={id:id,type:'shape',name:name,layout:layout,style:style||{},props:{shape:'rect'},children:[]};if(ovr)n.ovr=true;return n;}
function F(id,name,layout,style,kids,extra){var n={id:id,type:'frame',name:name,layout:layout,style:style||{},props:{},children:kids||[]};if(extra)Object.assign(n,extra);return n;}
var CARD={bg:'@card',bd:{c:'@ln'},r:'var:rl',ledge:{c:'@ln'}};
var BST={pressed:{style:{br:92,ledge:{y:0}}},disabled:{style:{op:45,sa:30}}};
function spacer(id){return S(id,'Распорка',{w:'fill',h:1});}
function divider(id){return S(id,'Разделитель',{w:'fill',h:2},{bg:'@ln'});}
function iconBtn(id,name,icon,sz,c){return F(id,name,{dir:'row',ai:'center',jc:'center',w:sz||44,h:sz||44},{r:'var:r'},[I(id+'-i','Иконка',icon,22,c||'@tx')],{states:{pressed:{style:{bg:'@ton'}},disabled:{style:{op:45}}}});}
function btn(id,name,label,prim,w){return F(id,name,{dir:'row',ai:'center',jc:'center',w:w||108,h:44,pad:[0,16,0,16]},{bg:prim?'@ac':'@ton',r:'var:r',ledge:{c:prim?'@ed':'@ln'}},[T(id+'-t','Подпись',label,15,800,prim?'@act':'@tx')],{states:BST});}
function tile(id,icon,sz){return F(id,'Плитка-иконка',{dir:'row',ai:'center',jc:'center',w:sz||46,h:sz||46},{bg:'@g:tile',r:'var:r',ledge:{c:'@ed'}},[I(id+'-i','Иконка',icon,22,'@act')],{ovr:true});}
function pill(id,text){return F(id,'Пилюля срока',{dir:'row',ai:'center',jc:'center',pad:[5,11,5,11]},{bg:'@ok',r:999},[T(id+'-t','Текст',text,13,800,'@act')],{ovr:true});}
function chip(id,icon,text){return F(id,'Чип',{dir:'row',ai:'center',gap:6,pad:[6,12,6,12]},{bg:'@card',bd:{c:'@ln'},r:999},[I(id+'-i','Иконка',icon,22,'@tx'),T(id+'-t','Текст',text,14,800)]);}
function row(id,title,sub,button){return F(id,'Строка '+title,{dir:'column',w:'fill'},{},[divider(id+'-d'),
  F(id+'-r','Содержимое строки',{dir:'row',ai:'center',gap:12,w:'fill',pad:[14,0,14,0]},{},[
    F(id+'-x','Текст',{dir:'column',w:'fill'},{},[T(id+'-n','Название',title,17,800),T(id+'-s','Подпись',sub,13,700,'@mu')]),button])]);}
function choice(id,icon,title,sub){return F(id,'Карточка-выбор',{dir:'column',gap:2,pad:[14,14,14,14],w:'fill'},CARD,[
  F(id+'-t','Плитка',{dir:'row',ai:'center',jc:'center',w:40,h:40},{bg:'@g:tile',r:'var:r',ledge:{c:'@ed'}},[I(id+'-i','Иконка',icon,22,'@act')]),
  T(id+'-n','Название',title,17,800),T(id+'-s','Подпись',sub,13,700,'@mu')]);}
function navItem(id,icon,label,on){return F(id,'Вкладка '+label,{dir:'column',ai:'center',gap:4,w:'fill',pad:[8,10,8,10]},{bg:on?'@ton':'@card',r:'var:r'},[I(id+'-i','Иконка',icon,22,on?'@tx':'@mu'),T(id+'-t','Подпись',label,11,700,on?'@tx':'@mu')],{ovr:true});}
function navVar(k,name,id){var o={};['plan','today','focus','cat','subjects'].forEach(function(x){var on=x===id;o['nv-'+x]={col:on?'@ton':'@card'};o['nv-'+x+'-t']={col:on?'@tx':'@mu'};o['nv-'+x+'-i']={col:on?'@tx':'@mu'};});return {k:k,name:name,ov:o};}
function pillVar(k,name,c){return {k:k,name:name,ov:{'dl':{col:c}}};}

var LIST=[
 {key:'header',name:'Шапка с чипами',w:354,h:48,root:F('hd','Шапка',{dir:'row',ai:'center',gap:12,w:'fill',h:'hug'},{},[iconBtn('hd-m','Кнопка меню','menu'),spacer('hd-g'),chip('hd-c','coin','58 429')])},
 {key:'title',name:'Заголовок экрана',w:354,h:44,root:F('tt','Заголовок',{dir:'row',ai:'center',w:'fill',h:'hug'},{},[T('tt-t','Текст','Предметы',32,800,'@tx',true,'role:display')])},
 {key:'section',name:'Подпись раздела с кнопкой',w:354,h:44,root:F('sc','Раздел',{dir:'row',ai:'center',gap:12,w:'fill',h:'hug'},{},[T('sc-t','Текст','КУРСЫ',13,700,'@mu',true),iconBtn('sc-b','Кнопка новый курс','folder-plus')])},
 {key:'banner',name:'Баннер «Импорт через ИИ»',w:354,h:92,root:F('bn','Баннер',{dir:'row',ai:'center',gap:14,pad:[16,16,16,16],w:'fill',h:'hug'},{bg:'@g:teal',r:'var:rl',ledge:{c:'@t0'}},[
   F('bn-b','Плитка',{dir:'row',ai:'center',jc:'center',w:52,h:52},{bg:'@t0',r:'var:r'},[I('bn-i','Иконка','sparkles',30,'@tile0')]),
   F('bn-x','Текст',{dir:'column',w:'fill'},{},[T('bn-n','Название','Импорт через ИИ',19,800,'@ont'),T('bn-s','Подпись','PDF, фото или конспект: предмет соберётся сам',13,600,'@ont')]),
   I('bn-c','Стрелка','chev-r',22,'@ont')],{states:BST})},
 {key:'course',name:'Карточка курса',w:354,h:80,root:F('cr','Карточка курса',{dir:'row',ai:'center',gap:12,pad:[14,16,14,16],w:'fill',h:'hug'},CARD,[
   F('cr-t','Плитка',{dir:'row',ai:'center',jc:'center',w:46,h:46},{bg:'@ton',r:999},[I('cr-i','Иконка','folder',22,'@tx')],{ovr:true}),
   F('cr-x','Текст',{dir:'column',w:'fill'},{},[T('cr-n','Название','Нмт',18,800),T('cr-s','Подпись','1 предмет',13,700,'@mu')]),
   pill('cr-p','16 дн.'),I('cr-c','Стрелка','chev-r',22,'@tx')],{states:{pressed:{style:{br:96,ledge:{y:0}}}}})},
 {key:'subject',name:'Карточка предмета',w:354,h:330,root:F('sb','Карточка предмета',{dir:'column',pad:[16,16,4,16],w:'fill',h:'hug'},CARD,[
   F('sb-h','Шапка карточки',{dir:'row',ai:'center',gap:12,w:'fill'},{},[tile('sb-tile','book'),
     F('sb-x','Название',{dir:'column',w:'fill'},{},[T('sb-n','Название предмета','На крючке',19,800),T('sb-s','Подпись','книга',13,700,'@mu')]),
     pill('sb-pill','16 дн.'),iconBtn('sb-more','Кнопка ещё','dots')]),
   F('sb-p','Прогресс',{dir:'row',ai:'center',gap:12,w:'fill',pad:[14,0,14,0]},{},[S('sb-tr','Дорожка',{w:'fill',h:8},{bg:'@trk',r:999}),T('sb-pc','Процент','0%',13,700,'@mu')]),
   row('sb-r1','Темы','0 из 32 тем, сегодня 5',btn('sb-b1','Кнопка открыть','Открыть',true,100)),
   row('sb-r2','Карточки','Пока пусто',btn('sb-b2','Кнопка создать','Создать',false)),
   F('sb-l','Нагрузка',{dir:'column',w:'fill'},{},[divider('sb-ld'),F('sb-lr','Содержимое строки',{dir:'row',ai:'center',gap:8,w:'fill',pad:[12,0,12,0]},{},[
     I('sb-li','Иконка','chart',22,'@mu'),T('sb-lt','Название','Нагрузка на 7 дней',13,700,'@mu',true),T('sb-ln','Число','12',13,700,'@mu'),I('sb-lc','Стрелка','chev-d',22,'@mu')])])]),
  variants:[{k:'soon',name:'Срок близко',ov:{'sb-pill':{col:'@warn'}}},{k:'late',name:'Срок горит',ov:{'sb-pill':{col:'@bad'}}},
    {k:'no-topics',name:'Тем пока нет',ov:{'sb-r1-n':{col:'@mu'},'sb-r1-s':{text:'Тем пока нет'}}}]},
 {key:'tile',name:'Плитка-иконка',w:46,h:46,root:tile('tl','star')},
 {key:'pill',name:'Пилюля срока',w:70,h:30,root:pill('dl','16 дн.'),variants:[pillVar('warn','Жёлтая','@warn'),pillVar('bad','Красная','@bad'),pillVar('calm','Спокойная','@ton')]},
 {key:'button',name:'Кнопка',w:108,h:44,root:btn('bt','Кнопка','Создать',false)},
 {key:'button-primary',name:'Кнопка акцентная',w:108,h:44,root:btn('bp','Кнопка акцентная','Открыть',true)},
 {key:'cta',name:'Кнопка действия (большая)',w:354,h:56,root:F('ct','Кнопка действия',{dir:'row',ai:'center',jc:'center',gap:8,w:'fill',h:56},{bg:'@ac',r:'var:rl',ledge:{c:'@ed'}},[I('ct-i','Иконка','plus',22,'@act'),T('ct-t','Подпись','Добавить предмет',17,800,'@act')],{states:BST})},
 {key:'icon-button',name:'Кнопка-иконка',w:44,h:44,root:iconBtn('ib','Кнопка иконка','menu')},
 {key:'chip',name:'Чип',w:120,h:36,root:chip('cp','coin','58 429')},
 {key:'row',name:'Строка с разделителем',w:354,h:80,root:row('rw','Темы','0 из 32 тем, сегодня 5',I('rw-c','Стрелка','chev-r',22,'@tx'))},
 {key:'progress',name:'Прогресс-полоса',w:354,h:24,root:F('pg','Прогресс',{dir:'row',ai:'center',gap:12,w:'fill',h:'hug'},{},[
   F('pg-tr','Дорожка',{dir:'row',w:'fill',h:8},{bg:'@trk',r:999,clip:true},[S('pg-f','Заполнено',{w:90,h:8},{bg:'@ac',r:999})]),T('pg-t','Процент','25%',13,700,'@mu')]),
  variants:[{k:'empty',name:'Пусто',ov:{'pg-f':{hidden:true},'pg-t':{text:'0%'}}}]},
 {key:'sheet',name:'Нижняя шторка с ручкой',w:390,h:330,root:F('sh','Шторка',{dir:'column',ai:'center',gap:14,pad:[10,18,30,18],w:'fill',h:'hug'},{bg:'@card',rc:['var:rl','var:rl',0,0]},[
   S('sh-hd','Ручка',{w:44,h:5},{bg:'@ln',r:999}),
   F('sh-h','Заголовок шторки',{dir:'row',ai:'center',gap:12,w:'fill'},{},[T('sh-t','Заголовок','Что добавляем?',24,800,'@tx',true,'role:display'),iconBtn('sh-x','Кнопка закрыть','close',44,'@mu')]),
   F('sh-c','Выбор',{dir:'row',gap:12,w:'fill'},{},[choice('sh-c1','list-check','Темы','Идёшь по списку день за днём'),choice('sh-c2','cards','Карточки','Вопрос и ответ с умными повторами')])])},
 {key:'scrim',name:'Затемнение под шторкой',w:390,h:844,root:F('sm','Затемнение',{dir:'column',w:'fill',h:'fill',float:true,x:0,y:0},{op:55},[S('sm-s','Слой',{w:'fill',h:'fill'},{bg:'@scrim'})])},
 {key:'nav',name:'Нижняя панель (только оболочка)',w:362,h:72,shell:true,root:F('nv','Нижняя панель',{dir:'row',ai:'center',w:362,h:72,float:true,x:14,y:758,pad:[0,6,0,6]},{bg:'@card',bd:{c:'@ln'},r:'var:rl'},[
   navItem('nv-plan','calendar','План',false),navItem('nv-today','sun','Сегодня',false),navItem('nv-focus','timer','Фокус',false),navItem('nv-cat','paw','Кот',false),navItem('nv-subjects','book','Предметы',true)]),
  variants:[navVar('plan','План','plan'),navVar('today','Сегодня','today'),navVar('focus','Фокус','focus'),navVar('cat','Кот','cat')]},
 {key:'ring',name:'Таймер-кольцо',w:200,h:200,root:F('rg','Кольцо',{dir:'row',ai:'center',jc:'center',w:200,h:200},{bg:'@card',bd:{w:10,c:'@ton'},r:999},[T('rg-t','Время','25:00',54,800,'@tx',false,'role:display')])},
 {key:'quick',name:'Плитка-ссылка (История, Награды)',w:80,h:76,root:F('qk','Плитка-ссылка',{dir:'column',ai:'center',gap:6,pad:[10,0,10,0],w:'fill'},{bg:'@ton',r:'var:r'},[I('qk-i','Иконка','clock',22,'@tx'),T('qk-t','Подпись','История',12,800)],{states:BST})},
 {key:'picker',name:'Выбор (25 мин, Без предмета)',w:170,h:48,root:F('pk','Выбор',{dir:'row',ai:'center',jc:'center',gap:8,w:'fill',h:48},{bg:'@card',bd:{c:'@ln'},r:'var:r'},[I('pk-i','Иконка','clock',22,'@tx'),T('pk-t','Подпись','25 мин',14,800)],{states:BST})},
 {key:'input',name:'Поле ввода',w:354,h:48,root:F('in','Поле ввода',{dir:'row',ai:'center',gap:8,w:'fill',h:48,pad:[0,14,0,14]},{bg:'@card',bd:{c:'@ln'},r:'var:r'},[I('in-i','Иконка','search',22,'@mu'),T('in-t','Подсказка','Название предмета',15,700,'@mu',true)],{states:{disabled:{style:{op:45}}}})},
 {key:'switch',name:'Переключатель',w:52,h:30,root:F('sw','Переключатель',{dir:'row',ai:'center',jc:'between',w:52,h:30,pad:[3,3,3,3]},{bg:'@ac',r:999},[
   S('sw-a','Ползунок слева',{w:24,h:24},{bg:'@ac',r:999},true),S('sw-b','Ползунок справа',{w:24,h:24},{bg:'@card',r:999},true)],{ovr:true}),
  variants:[{k:'off',name:'Выключен',ov:{'sw':{col:'@trk'},'sw-a':{col:'@card'},'sw-b':{col:'@trk'}}}]}
];

P.NEW_TOKENS={scrim:{light:'#140a00',dark:'#000000',app:'--scrim',role:'затемнение под шторкой (новая переменная)'},ont:{light:'#ffffff',dark:'#ffffff',app:'--ont',role:'текст на бирюзовом баннере (новая переменная)'}};
P.GRAD_TEAL={angle:135,stops:[{c:'@t1',at:0},{c:'@t2',at:100}]};
P.count=function(){return LIST.length;};
P.keys=function(){return LIST.map(function(x){return x.key;});};
/* добавляет в каждый профиль то, что нужно мастерам: токены scrim и ont, градиент teal (набор имён остаётся одинаковым во всех профилях) */
function ensureTokens(d){
  d.profiles.forEach(function(pr){var T=pr.tokens;T.info=T.info||{};T.grad=T.grad||{};
    Object.keys(P.NEW_TOKENS).forEach(function(k){var v=P.NEW_TOKENS[k];
      if(T.light[k]===undefined&&T.dark[k]===undefined){T.light[k]=v.light;T.dark[k]=v.dark;T.info[k]={app:v.app,role:v.role};}});
    if(!T.grad.teal)T.grad.teal=JSON.parse(JSON.stringify(P.GRAD_TEAL));});}
P.install=function(){
  var have={},added=0;ST.comp.list(ST.p).forEach(function(c){if(c.preset)have[c.preset]=1;});
  var todo=LIST.filter(function(x){return !have[x.key];});
  if(!todo.length)return {ok:true,added:0};
  var ok=ST.do('стартовый набор мастеров',function(d){var s=N.scrIn(d),pf=(s&&s.profile)||d.profiles[0].id;
    ensureTokens(d);
    todo.forEach(function(x){var m={id:ST.uid('c'),name:x.name,profile:pf,w:x.w,h:x.h,variants:JSON.parse(JSON.stringify(x.variants||[])),preset:x.key,root:JSON.parse(JSON.stringify(x.root))};
      if(x.shell)m.shell=true;d.components.push(m);added++;});});
  return ok?{ok:true,added:added}:{error:'Набор не добавлен.'};};
})();
