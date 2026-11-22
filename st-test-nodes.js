/* Тесты Шага 4 (узлы, слои, инспектор, жесты). Нужен harness с T(name,fn), eq(a,b,msg) и узлы на холсте (#st-canvas); см. st-test-nodes.html */
(function(){
function fresh(){ST.set(ST.blank('Т'));}
function root(){return ST.p.screens[0].root;}
function kids(){return root().children;}
function add(t,p){var r=ST.nodes.add(t,p);if(r.error)throw new Error(r.error);return r.id;}
function err(r,why){if(!r||!r.error)throw new Error('ожидали отказ: '+why);}
function ok(r){if(!r||r.error)throw new Error('отказ: '+(r&&r.error));}
function node(id){var f=ST.nodes.get(id);return f&&f.n;}

T('схема: миграция 3→4 дополняет узлы, 4→5 только поднимает номер, повторный запуск ничего не меняет',function(){
  var a={schema:3,meta:{},tokens:{light:{},dark:{},info:{},grad:{}},components:[],assets:{},fonts:{},text:{},
    screens:[{id:'s',name:'x',w:390,h:844,root:{id:'r',type:'frame',children:[{id:'a',type:'text'}]}}]};
  eq(ST.validate(a),'');var m=ST.migrate(a);eq(m.schema,5);eq(ST.SCHEMA,5);
  var c=m.screens[0].root.children[0];eq(typeof c.layout,'object');eq(typeof c.style,'object');eq(Array.isArray(c.children),true);eq(typeof c.name,'string');
  eq(JSON.stringify(ST.migrate(JSON.parse(JSON.stringify(m)))),JSON.stringify(m));});
T('проверка дерева: неизвестный тип, нет id, битый стиль, слишком глубоко',function(){fresh();
  var p=JSON.parse(JSON.stringify(ST.p));
  p.screens[0].root.children.push({id:'x',type:'bogus',children:[]});eq(ST.validate(p).indexOf('тип')>=0,true);
  p=JSON.parse(JSON.stringify(ST.p));p.screens[0].root.children.push({type:'frame'});eq(ST.validate(p).indexOf('id')>=0,true);
  p=JSON.parse(JSON.stringify(ST.p));p.screens[0].root.children.push({id:'y',type:'frame',style:[1],children:[]});eq(ST.validate(p).indexOf('style')>=0,true);
  p=JSON.parse(JSON.stringify(ST.p));var n=p.screens[0].root;for(var i=0;i<45;i++){var c={id:'d'+i,type:'frame',children:[]};n.children.push(c);n=c;}
  eq(ST.validate(p).indexOf('вложенность')>=0,true);});
T('добавление: пять типов, имена, выбор нового узла, отмена',function(){fresh();
  ST.nodes.TYPES.forEach(function(t){add(t);});eq(kids().length,5);
  eq(kids()[0].name,'Рамка 1');eq(kids()[1].name,'Текст 1');eq(ST.sel.length,1);eq(ST.sel[0],kids()[4].id);
  eq(kids()[1].props.text,'Текст');eq(typeof kids()[1].style.text.fs,'number');eq(ST.validate(ST.p),'');
  ST.undo();eq(kids().length,4);});
T('добавить можно только в рамку',function(){fresh();var t=add('text');err(ST.nodes.add('frame',t),'в текст');eq(kids().length,1);});
T('вложенность до 40 уровней, глубже — отказ',function(){fresh();var par=root().id,i;
  for(i=0;i<40;i++)par=add('frame',par);
  err(ST.nodes.add('frame',par),'41-й уровень');eq(ST.nodes.height(root()),41);});
T('6 уровней вложенности: добавление и открытие из файла',function(){fresh();var par=root().id,i;
  for(i=0;i<6;i++)par=add('frame',par);
  var s=JSON.stringify(ST.p);var r=ST.io.parse(s);eq(!!r.project,true);eq(ST.nodes.count(r.project.screens[0].root),7);});
T('изменение значений: прозрачность, поворот, фильтры; проверка пределов; отмена',function(){fresh();var id=add('shape');
  ok(ST.nodes.set([id],'style.op',55));ok(ST.nodes.set([id],'style.rot',-45));ok(ST.nodes.set([id],'style.ct',130));ok(ST.nodes.set([id],'style.bl',3));
  eq(node(id).style.op,55);eq(node(id).style.rot,-45);
  err(ST.nodes.set([id],'style.op',101),'>100');err(ST.nodes.set([id],'style.rot',181),'>180');err(ST.nodes.set([id],'style.bl',-1),'<0');
  err(ST.nodes.set([id],'style.op','много'),'строка');err(ST.nodes.set([id],'layout.w',0),'0 px');err(ST.nodes.set([id],'style.bg','красный'),'цвет');
  err(ST.nodes.set([id],'style.nope',1),'неизвестный путь');
  eq(node(id).style.op,55);ST.undo();eq(node(id).style.bl,undefined);eq(node(id).style.ct,130);});
T('сброс параметра убирает ключ и пустые вложенные объекты',function(){fresh();var id=add('frame');
  ok(ST.nodes.set([id],'style.bd.w',2));eq(node(id).style.bd.w,2);ok(ST.nodes.reset([id],['style.bd.w']));eq(node(id).style.bd,undefined);
  ok(ST.nodes.set([id],'layout.pad.1',12));eq(JSON.stringify(node(id).layout.pad),'[8,12,8,8]');ok(ST.nodes.reset([id],['layout.pad']));eq(node(id).layout.pad,undefined);});
T('цвет: токен, градиент, hex; градиент допустим только в фоне',function(){fresh();var id=add('frame');
  ok(ST.nodes.set([id],'style.bg','@g:tile'));ok(ST.nodes.set([id],'style.bg','#ABC'.toLowerCase()));ok(ST.nodes.set([id],'style.bd.c','@ln'));
  err(ST.nodes.set([id],'style.bd.c','@g:tile'),'градиент в обводке');});
T('радиус: число, значение формы (r, rl), по углам',function(){fresh();var id=add('shape');
  ok(ST.nodes.set([id],'style.r','var:rl'));ok(ST.nodes.set([id],'style.rc',[4,'var:r',0,8]));err(ST.nodes.set([id],'style.r','var:zzz'),'чужая ссылка');
  var css=ST.nodes.css(node(id),ST.p,{dir:'column'});eq(css.indexOf('border-radius:4px var(--r) 0px 8px')>=0,true);});
T('размер: растянуть, по содержимому, фикс, мин/макс; CSS по направлению родителя',function(){fresh();var id=add('frame');
  ok(ST.nodes.set([id],'layout.w','fill'));ok(ST.nodes.set([id],'layout.h',120));ok(ST.nodes.set([id],'layout.minW',50));err(ST.nodes.set([id],'layout.w','auto'),'не режим');
  var c=ST.nodes.css(node(id),ST.p,{dir:'column'});eq(c.indexOf('align-self:stretch')>=0,true);eq(c.indexOf('height:120px')>=0,true);eq(c.indexOf('flex:none')>=0,true);eq(c.indexOf('min-width:50px')>=0,true);
  var r=ST.nodes.css(node(id),ST.p,{dir:'row'});eq(r.indexOf('flex:1 1 0')>=0,true);});
T('«на плаву»: координаты и CSS',function(){fresh();var id=add('shape');
  ok(ST.nodes.patch([id],[['layout.float',true],['layout.x',10],['layout.y',20]],'на плаву'));
  var c=ST.nodes.css(node(id),ST.p,{dir:'column'});eq(c.indexOf('position:absolute;left:10px;top:20px')>=0,true);});
T('CSS: поворот, прозрачность, фильтры, бортик, обводка, режим наложения, фон-токен',function(){fresh();var id=add('frame');
  ST.nodes.patch([id],[['style.rot',30],['style.rotO.x',0],['style.rotO.y',100],['style.op',50],['style.br',120],['style.bl',2],['style.ledge.y',4],['style.ledge.c','@ed'],['style.bd.w',2],['style.bd.c','@ln'],['style.blend','multiply'],['style.bg','@card']],'тест');
  var c=ST.nodes.css(node(id),ST.p,{dir:'column'});
  ['rotate(30deg)','transform-origin:0% 100%','opacity:0.5','brightness(1.2)','blur(2px)','0 4px 0 var(--ed)','border:2px solid var(--ln)','mix-blend-mode:multiply','background:var(--card)'].forEach(function(s){if(c.indexOf(s)<0)throw new Error('нет «'+s+'» в '+c);});});
T('текст экранируется, скрытый узел не рисуется',function(){fresh();var id=add('text');ok(ST.nodes.set([id],'props.text','<b>&"x"'));
  var h=ST.nodes.html(root(),ST.p,{root:true});eq(h.indexOf('&lt;b&gt;&amp;')>=0,true);eq(h.indexOf('<b>')<0,true);
  ok(ST.nodes.set([id],'hidden',true));eq(ST.nodes.html(root(),ST.p,{root:true}).indexOf(id)<0,true);});
T('дублирование: новые id, имя «копия», у «на плаву» сдвиг; корень не копируется',function(){fresh();var f=add('frame'),t=add('text',f);
  ok(ST.nodes.dup([f]));eq(kids().length,2);var c=kids()[1];eq(c.name,'Рамка 1 копия');eq(c.id!==f,true);eq(c.children[0].id!==t,true);
  err(ST.nodes.dup([root().id]),'корень');
  var s=add('shape');ST.nodes.patch([s],[['layout.float',true],['layout.x',5],['layout.y',5]],'x');ok(ST.nodes.dup([s]));eq(kids()[kids().length-1].layout.x,13);});
T('удаление: выбор уходит на родителя, потомки уходят вместе, отмена возвращает',function(){fresh();var f=add('frame'),t=add('text',f);
  ok(ST.nodes.remove([f]));eq(kids().length,0);eq(ST.sel[0],root().id);err(ST.nodes.remove([root().id]),'корень');
  ST.undo();eq(kids().length,1);eq(kids()[0].children.length,1);});
T('группировка: соседи в рамку, порядок сохраняется; разные родители и «на плаву» — отказ; разгруппировка',function(){fresh();
  var a=add('text'),b=add('shape'),c=add('icon');ok(ST.nodes.group([a,c]));eq(kids().length,2);eq(kids()[0].type,'frame');eq(kids()[0].children.map(function(x){return x.id;}).join(),a+','+c);
  var g=kids()[0].id;var inner=add('frame',g);err(ST.nodes.group([inner,b]),'разные рамки');
  ST.nodes.patch([b],[['layout.float',true]],'x');err(ST.nodes.group([b]),'на плаву');
  ok(ST.nodes.ungroup(g));eq(kids().filter(function(x){return x.id===g;}).length,0);eq(kids().some(function(x){return x.id===a;}),true);});
T('перенос: внутрь рамки, на позицию; в себя и в потомка — отказ; корень не двигается',function(){fresh();
  var a=add('frame'),b=add('shape'),c=add('text'),d=add('frame',a);
  ok(ST.nodes.move(c,a,0));eq(node(a).children[0].id,c);
  ok(ST.nodes.move(b,root().id,0));eq(kids()[0].id,b);
  err(ST.nodes.move(a,d,0),'в потомка');err(ST.nodes.move(a,a,0),'в себя');err(ST.nodes.move(root().id,a,0),'корень');err(ST.nodes.move(b,c,0),'в текст');
  ok(ST.nodes.move(b,root().id,kids().length));eq(kids()[kids().length-1].id,b);});
T('порядок слоёв: сдвиг на 1, на краях ничего не происходит',function(){fresh();var a=add('text'),b=add('shape');
  ok(ST.nodes.reorder(b,-1));eq(kids()[0].id,b);ok(ST.nodes.reorder(b,-1));eq(kids()[0].id,b);ok(ST.nodes.reorder(b,1));eq(kids()[1].id,b);});
T('одна запись в истории на группу правок (patch), а не по одной на параметр',function(){fresh();var id=add('shape'),n0=ST.undoS.length;
  ok(ST.nodes.patch([id],[['style.op',50],['style.rot',10],['style.bl',2]],'группа'));eq(ST.undoS.length,n0+1);ST.undo();eq(node(id).style.op,undefined);});
T('история: 50 шагов, 55 правок — отменяются ровно 50',function(){fresh();var id=add('shape'),i;
  for(i=0;i<55;i++)ok(ST.nodes.set([id],'style.rot',i+1));
  eq(ST.undoS.length,50);var n=0;while(ST.undo())n++;eq(n,50);eq(node(id).style.rot,5);});
T('сломанная правка не меняет проект',function(){fresh();var id=add('shape'),s=JSON.stringify(ST.p);
  err(ST.nodes.patch(['нет-такого'],[['style.op',50]],'x'),'нет узла');eq(JSON.stringify(ST.p),s);});
T('выбор очищается при загрузке и при удалении узла',function(){fresh();var a=add('shape');eq(ST.sel.length,1);ST.set(ST.blank('Т2'));eq(ST.sel.length,0);
  fresh();var b=add('shape');ST.nodes.remove([b]);eq(ST.sel.indexOf(b),-1);});
T('открытие и повторное сохранение проекта с узлами даёт тот же файл',function(){fresh();var f=add('frame'),t=add('text',f);
  ST.nodes.patch([t],[['style.rot',12],['style.op',70]],'x');var s=JSON.stringify(ST.p),r=ST.io.parse(s);eq(!!r.project,true);eq(JSON.stringify(r.project),s);});
T('холст: узлы рисуются в обеих темах, скрытое не рисуется, цвет берётся из токена',function(){fresh();var id=add('shape');
  var host=document.getElementById('st-canvas');ST.canvas.render();eq(host.querySelectorAll('.st-frame').length,2);
  eq(host.querySelectorAll('[data-nid="'+id+'"]').length,2);
  var el=host.querySelector('.st-frame[data-th="dark"] [data-nid="'+id+'"]');eq(getComputedStyle(el).backgroundColor,'rgb(245, 160, 46)');
  ST.nodes.set([id],'hidden',true);ST.canvas.render();eq(host.querySelectorAll('[data-nid="'+id+'"]').length,0);});
T('холст: рамка выбора есть у выбранного, ручек 8 + вращение, у корня ручек нет',function(){fresh();var id=add('shape');ST.canvas.render();
  eq(document.querySelectorAll('.st-sel').length>=1,true);eq(document.querySelectorAll('.st-frame').length,2);
  eq(document.querySelectorAll('.st-sel[data-fi="0"] .st-hd').length,9);
  ST.sel=[root().id];ST.canvas.sel();eq(document.querySelectorAll('.st-sel .st-hd').length,0);});
T('холст: ручка не меньше 44×44 px (по правилам для касания)',function(){fresh();add('shape');ST.canvas.render();
  var hd=document.querySelector('.st-hd'),r=hd.getBoundingClientRect();eq(r.width>=44&&r.height>=44,true,'размер ручки '+r.width+'×'+r.height);});
/* ---------- Шаг 4, пункты 5–8: состояния, проверки качества, всё через ST.do ---------- */
function setS(s){ST.nodes.vstate=s;}
T('состояния: правка style.* при показанном «нажато» уходит в states.pressed.style, обычный вид не меняется',function(){fresh();var id=add('shape');
  ok(ST.nodes.set([id],'style.op',80));setS('pressed');ok(ST.nodes.set([id],'style.op',50));ok(ST.nodes.set([id],'style.bg','@ac'));
  eq(node(id).style.op,80);eq(node(id).states.pressed.style.op,50);eq(node(id).states.pressed.style.bg,'@ac');eq(node(id).states.disabled,undefined);
  eq(ST.nodes.styleOf(node(id),'pressed').op,50);eq(ST.nodes.styleOf(node(id),'normal').op,80);eq(ST.validate(ST.p),'');setS('normal');});
T('состояния: холст показывает выбранное состояние, у узла без отличий вид обычный',function(){fresh();var a=add('shape'),b=add('shape');
  ok(ST.nodes.patch([a],[['style.bg','@ac']],'x'));setS('pressed');ok(ST.nodes.set([a],'style.op',40));
  var ca=ST.nodes.css(node(a),ST.p,{dir:'column'}),cb=ST.nodes.css(node(b),ST.p,{dir:'column'});
  eq(ca.indexOf('opacity:0.4')>=0,true);eq(cb.indexOf('opacity')<0,true);
  setS('normal');eq(ST.nodes.css(node(a),ST.p,{dir:'column'}).indexOf('opacity')<0,true);
  eq(ST.nodes.css(node(a),ST.p,{dir:'column',state:'pressed'}).indexOf('opacity:0.4')>=0,true,'явное состояние в ctx');});
T('состояния: вложенные значения склеиваются (бортик: цвет обычный, толщина из «нажато»), массив радиусов заменяется',function(){fresh();var id=add('frame');
  ok(ST.nodes.patch([id],[['style.ledge',{y:3,c:'@ed'}],['style.rc',[1,2,3,4]]],'x'));setS('pressed');
  ok(ST.nodes.patch([id],[['style.ledge',{y:0}],['style.rc',[9,9,9,9]]],'x'));
  var e=ST.nodes.styleOf(node(id),'pressed');eq(e.ledge.y,0);eq(e.ledge.c,'@ed');eq(e.rc.join(),'9,9,9,9');
  eq(ST.nodes.css(node(id),ST.p,{dir:'column'}).indexOf('box-shadow')<0,true);setS('normal');
  eq(ST.nodes.css(node(id),ST.p,{dir:'column'}).indexOf('0 3px 0 var(--ed)')>=0,true);});
T('состояния: размер, раскладка и содержимое в состоянии не меняются (отказ с понятным сообщением)',function(){fresh();var id=add('text');setS('disabled');
  err(ST.nodes.set([id],'layout.w',100),'размер');err(ST.nodes.set([id],'props.text','x'),'текст');
  err(ST.nodes.patch([id],[['style.op',50],['layout.x',3]],'смесь'),'смесь');eq(node(id).states,undefined,'ничего не записалось');
  ok(ST.nodes.rename(id,'Новое имя'));eq(node(id).name,'Новое имя');ok(ST.nodes.set([id],'hidden',true));setS('normal');});
T('состояния: значения проверяются как обычные (предел, цвет), сброс убирает ключ и пустое states',function(){fresh();var id=add('shape');setS('pressed');
  err(ST.nodes.set([id],'style.op',101),'предел');err(ST.nodes.set([id],'style.bg','красный'),'цвет');
  ok(ST.nodes.set([id],'style.op',50));ok(ST.nodes.set([id],'style.bd.w',2));eq(node(id).states.pressed.style.bd.w,2);
  ok(ST.nodes.reset([id],['style.bd.w']));eq(node(id).states.pressed.style.bd,undefined);
  ok(ST.nodes.reset([id],['style.op']));eq(node(id).states,undefined,'пустое states убрано');
  ok(ST.nodes.set([id],'style.op',50));ok(ST.nodes.patch([id],[['states.pressed',undefined]],'убрать'));eq(node(id).states,undefined);setS('normal');});
T('состояния: одна запись в истории, отмена и возврат; номер схемы 5; файл открывается и сохраняется без изменений',function(){fresh();var id=add('shape'),n0=ST.undoS.length;setS('disabled');
  ok(ST.nodes.patch([id],[['style.op',45],['style.sa',30]],'заготовка'));eq(ST.undoS.length,n0+1);eq(node(id).states.disabled.style.sa,30);
  var s=JSON.stringify(ST.p),r=ST.io.parse(s);eq(!!r.project,true);eq(JSON.stringify(r.project),s);eq(r.project.schema,5);
  ST.undo();eq(node(id).states,undefined);ST.redo();eq(node(id).states.disabled.style.op,45);setS('normal');});
T('состояния: дубль узла берёт состояния с собой, у копии свои id',function(){fresh();var id=add('shape');setS('pressed');ok(ST.nodes.set([id],'style.op',60));setS('normal');
  ok(ST.nodes.dup([id]));var c=kids()[1];eq(c.states.pressed.style.op,60);c.states.pressed.style.op=1;eq(node(id).states.pressed.style.op,60);});
T('состояния: повреждённые состояния при открытии файла отклоняются понятным сообщением',function(){fresh();var id=add('shape');
  function bad(mut,why){var p=JSON.parse(JSON.stringify(ST.p));mut(p.screens[0].root.children[0]);var m=ST.validate(p);if(m.indexOf('состояни')<0)throw new Error(why+': '+m);}
  bad(function(n){n.states=[1];},'массив');bad(function(n){n.states={hover:{style:{}}};},'чужое состояние');
  bad(function(n){n.states={pressed:{style:{op:500}}};},'значение вне предела');bad(function(n){n.states={pressed:{style:{zzz:1}}};},'неизвестный ключ');
  bad(function(n){n.states={pressed:{layout:{w:1}}};},'раскладка в состоянии');bad(function(n){n.states={pressed:5};},'не объект');
  var p=JSON.parse(JSON.stringify(ST.p));p.screens[0].root.children[0].states={pressed:{style:{op:50,bg:'@ac'}}};eq(ST.validate(p),'');});
T('состояния: смена проекта возвращает показ на «Обычное»; setState отвергает чужое имя',function(){fresh();eq(ST.nodes.setState('pressed'),true);eq(ST.nodes.vstate,'pressed');
  eq(ST.nodes.setState('hover'),false);eq(ST.nodes.setState('pressed'),false);ST.set(ST.blank('Т'));eq(ST.nodes.vstate,'normal');});
T('холст: в состоянии узлы рисуются с его отличиями, возврат на «Обычное» возвращает вид',function(){fresh();var id=add('shape');
  setS('pressed');ok(ST.nodes.set([id],'style.op',30));var host=document.getElementById('st-canvas');ST.canvas.render();
  var el=host.querySelector('[data-nid="'+id+'"]');eq(getComputedStyle(el).opacity,'0.3');setS('normal');ST.canvas.render();
  eq(getComputedStyle(host.querySelector('[data-nid="'+id+'"]')).opacity,'1');});
T('проверки: текст мельче 12 px — предупреждение, 12 — нет; скрытый узел не проверяется; запрета нет',function(){fresh();var a=add('text'),b=add('text');
  var t=JSON.parse(JSON.stringify(node(a).style.text));t.fs=10;ok(ST.nodes.set([a],'style.text',t));
  var w=ST.nodes.warns(root());eq(w.length,1);eq(w[0].code,'text');eq(w[0].id,a);eq(w[0].msg.indexOf('10 px')>=0,true);
  t.fs=12;ok(ST.nodes.set([a],'style.text',t));eq(ST.nodes.warns(root()).length,0);
  t.fs=9;ok(ST.nodes.set([b],'style.text',t));ok(ST.nodes.set([b],'hidden',true));eq(ST.nodes.warns(root()).length,0);});
T('проверки: кнопка меньше 44×44 — предупреждение (по числам и по измерению), 44 — нет; текст-подпись «кнопки» не считается',function(){fresh();var f=add('frame');
  ok(ST.nodes.patch([f],[['name','Кнопка меню'],['layout.w',40],['layout.h',44]],'x'));var w=ST.nodes.warns(root());eq(w.length,1);eq(w[0].code,'tap');
  ok(ST.nodes.patch([f],[['layout.w',44]],'x'));eq(ST.nodes.warns(root()).length,0);
  eq(ST.nodes.warns(root(),function(){return {w:44,h:32};}).length,1,'измерение с холста');
  ok(ST.nodes.patch([f],[['layout.w','hug'],['layout.h','hug']],'x'));eq(ST.nodes.warns(root()).length,0,'без измерения размер «по содержимому» неизвестен');
  var t=add('text',f);ok(ST.nodes.rename(t,'Подпись кнопки'));eq(ST.nodes.warns(root(),function(id){return id===t?{w:10,h:10}:{w:50,h:50};}).length,0);});
T('проверки: узел с состоянием «нажато» тоже считается кнопкой',function(){fresh();var f=add('frame');ok(ST.nodes.patch([f],[['layout.w',30],['layout.h',30]],'x'));
  eq(ST.nodes.warns(root()).length,0);setS('pressed');ok(ST.nodes.set([f],'style.op',80));setS('normal');eq(ST.nodes.warns(root()).length,1);});
T('проверки: фильтры, прозрачность, наложение, поворот на шторке и над ней — предупреждение; внутри шторки — нет',function(){fresh();
  var wr=add('frame'),sh=add('frame',wr),inner=add('shape',sh);ok(ST.nodes.rename(sh,'Шторка «Что добавляем?»'));
  eq(ST.nodes.warns(root()).length,0);
  ok(ST.nodes.set([inner],'style.bl',3));eq(ST.nodes.warns(root()).length,0,'у потомка шторки можно');
  ok(ST.nodes.set([sh],'style.op',90));var w=ST.nodes.warns(root());eq(w.length,1);eq(w[0].id,sh);eq(w[0].code,'sheet');
  ok(ST.nodes.reset([sh],['style.op']));ok(ST.nodes.patch([wr],[['style.ct',120],['style.rot',5]],'x'));w=ST.nodes.warns(root());
  eq(w.length,1);eq(w[0].id,wr);eq(w[0].msg.indexOf('содержит шторку')>=0,true);eq(w[0].msg.indexOf('фильтры')>=0&&w[0].msg.indexOf('поворот')>=0,true);
  ok(ST.nodes.reset([wr],['style.ct','style.rot']));eq(ST.nodes.warns(root()).length,0);
  ok(ST.nodes.set([sh],'style.blend','multiply'));eq(ST.nodes.warns(root()).length,1);});
T('проверки: предупреждение не блокирует правку, проект сохраняется и открывается',function(){fresh();var s=add('frame');ok(ST.nodes.rename(s,'Шторка'));
  ok(ST.nodes.set([s],'style.bl',4));eq(ST.nodes.warns(root()).length,1);var j=JSON.stringify(ST.p),r=ST.io.parse(j);eq(!!r.project,true);eq(JSON.stringify(r.project),j);});
T('все команды узлов идут через ST.do: на замороженном проекте ничего не падает и ничего не пишется мимо истории',function(){
  function freeze(o){if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);Object.keys(o).forEach(function(k){freeze(o[k]);});}return o;}
  fresh();var f=add('frame'),t=add('text',f),sh=add('shape'),n0;
  function run(name,fn){freeze(ST.p);n0=ST.undoS.length;var s=JSON.stringify(ST.p);var r=fn();if(r&&r.error)throw new Error(name+': '+r.error);
    if(ST.undoS.length!==n0+1)throw new Error(name+': не одна запись в истории ('+(ST.undoS.length-n0)+')');
    if(JSON.stringify(ST.undoS[ST.undoS.length-1].s)!==JSON.stringify(s))throw new Error(name+': в истории не прежний проект');}
  run('set',function(){return ST.nodes.set([sh],'style.op',50);});
  setS('pressed');run('set в состоянии',function(){return ST.nodes.set([sh],'style.op',20);});setS('normal');
  run('patchEach',function(){return ST.nodes.patchEach([{id:sh,pairs:[['style.rot',5]]},{id:t,pairs:[['style.op',60]]}],'x');});
  run('rename',function(){return ST.nodes.rename(t,'Другое');});run('add',function(){return ST.nodes.add('icon',f);});
  run('dup',function(){return ST.nodes.dup([sh]);});run('group',function(){return ST.nodes.group([sh,f]);});
  var g=kids().filter(function(x){return x.name==='Группа';})[0].id;run('ungroup',function(){return ST.nodes.ungroup(g);});
  run('move',function(){return ST.nodes.move(sh,f,0);});run('reorder',function(){return ST.nodes.reorder(sh,1);});
  run('remove',function(){return ST.nodes.remove([sh]);});});
T('история: 50 шагов при правках в состояниях тоже; 55 правок отменяются ровно 50',function(){fresh();var id=add('shape'),i;setS('pressed');
  for(i=0;i<55;i++)ok(ST.nodes.set([id],'style.rot',i+1));eq(ST.undoS.length,50);var n=0;while(ST.undo())n++;eq(n,50);eq(node(id).states.pressed.style.rot,5);setS('normal');});
T('объект, переданный в правку, не делится с проектом (позднее изменение объекта проект не трогает)',function(){fresh();var a=add('text'),t=JSON.parse(JSON.stringify(node(a).style.text));t.fs=10;ok(ST.nodes.set([a],'style.text',t));t.fs=9;eq(node(a).style.text.fs,10);});
T('поворот+прозрачность+фильтр сохраняются и открываются (с состоянием в том же узле)',function(){fresh();var id=add('frame');
  ok(ST.nodes.patch([id],[['style.rot',12],['style.op',70],['style.ct',130]],'x'));setS('pressed');ok(ST.nodes.patch([id],[['style.rot',0],['style.bl',2]],'x'));setS('normal');
  var j=JSON.stringify(ST.p),r=ST.io.parse(j);eq(!!r.project,true);var n=ST.nodes.find(r.project.screens[0].root,id).n;
  eq(n.style.rot,12);eq(n.style.ct,130);eq(n.states.pressed.style.bl,2);eq(JSON.stringify(r.project),j);});
})();
