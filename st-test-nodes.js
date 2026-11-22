/* Тесты Шага 4 (узлы, слои, инспектор, жесты). Нужен harness с T(name,fn), eq(a,b,msg) и узлы на холсте (#st-canvas); см. st-test-nodes.html */
(function(){
function fresh(){ST.set(ST.blank('Т'));}
function root(){return ST.p.screens[0].root;}
function kids(){return root().children;}
function add(t,p){var r=ST.nodes.add(t,p);if(r.error)throw new Error(r.error);return r.id;}
function err(r,why){if(!r||!r.error)throw new Error('ожидали отказ: '+why);}
function ok(r){if(!r||r.error)throw new Error('отказ: '+(r&&r.error));}
function node(id){var f=ST.nodes.get(id);return f&&f.n;}

T('схема 4: миграция 3→4 дополняет узлы, повторный запуск ничего не меняет',function(){
  var a={schema:3,meta:{},tokens:{light:{},dark:{},info:{},grad:{}},components:[],assets:{},fonts:{},text:{},
    screens:[{id:'s',name:'x',w:390,h:844,root:{id:'r',type:'frame',children:[{id:'a',type:'text'}]}}]};
  eq(ST.validate(a),'');var m=ST.migrate(a);eq(m.schema,4);eq(ST.SCHEMA,4);
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
})();
