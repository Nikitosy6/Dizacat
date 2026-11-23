/* Тесты Шага 1А (профили оформления). Нужен harness с T(name,fn) и eq(a,b,msg); см. st-test-profiles.html */
(function(){
var P=function(){return ST.prof;};
function fresh(){ST.fonts.live={};ST.set(ST.blank('Т'));} /* live: итоги проверки глифов в браузере; тесты Шага 3 их выставляют, здесь нужна таблица каталога */
function node(id,name,style){return {id:id,type:'frame',name:name,layout:{dir:'column'},style:style||{},props:{},children:[]};}
function put(n){ST.do('тестовый узел',function(x){x.screens[0].root.children.push(n);});}
function pr(id){return ST.prof.get(ST.p,id);}
function sid(){return ST.screen().id;}
function ac(th){return ST.tok.vars(ST.p,th||'light')['--ac'];}
function names(p){var o={};Object.keys(p.tokens.light).concat(Object.keys(p.tokens.dark)).forEach(function(n){o[n]=1;});return Object.keys(o).sort().join();}
function sameNames(){var a=ST.p.profiles,n=names(a[0]);a.forEach(function(q){eq(names(q),n,'набор имён в «'+q.name+'»');});return n;}
function legacy(schema){
  var o={schema:schema,meta:{name:'Старый',created:1,updated:1},tokens:{light:{},dark:{},info:{},grad:{}},components:[],assets:{},fonts:{},text:{},
    screens:[{id:'s1',name:'Экран 1',w:390,h:844,root:{id:'r1',type:'frame',name:'Экран',layout:{dir:'column'},style:{},props:{},
      children:[{id:'n1',type:'frame',name:'Кнопка',layout:{},style:{bg:'@ac',color:'@act'},props:{},children:[]}]}},
      {id:'s2',name:'Экран 2',w:390,h:844,root:{id:'r2',type:'frame',name:'Экран',layout:{dir:'column'},style:{},props:{},children:[]}}]};
  ST.tok.seed(o);ST.fonts.seed(o);return o;}
function bad(mut,sub){fresh();var c=JSON.parse(JSON.stringify(ST.p));mut(c);var e=ST.validate(c);
  if(!e)throw new Error('повреждение не найдено ('+sub+')');
  if(e.indexOf(sub)<0)throw new Error('ожидали «'+sub+'» в сообщении «'+e+'»');
  var txt=JSON.stringify(c),r=ST.io.parse(txt);eq(!!r.error,true);eq(r.raw,txt,'исходный текст не затирается');}

T('проект: схема 6, рабочая копия и пять встроенных, токенов в корне файла нет, проект валиден',function(){fresh();var p=ST.p,j=JSON.parse(JSON.stringify(p));
  eq(ST.SCHEMA,7);eq(p.schema,7);eq(p.profiles.length,6);eq(p.profiles[0].id,'project-main');eq(p.profiles[0].locked,false);
  eq(p.profiles.filter(function(x){return x.locked;}).length,5);
  eq(p.profiles.map(function(x){return x.id;}).slice(1).join(),'catworking-now,mockups-nunito,clean-slate,pixel,contrast');
  eq('tokens' in j,false);eq('fonts' in j,false);eq('text' in j,false);eq('tokens' in p,true,'посредник читается');
  eq(p.screens[0].profile,'project-main');eq(ST.validate(p),'');eq(sameNames().split(',').length,22);});
T('встроенные профили: цвета читаются, роли шрифтов есть в каталоге, форма задана',function(){fresh();
  ST.p.profiles.forEach(function(x){ST.prof.setCurrent(x.id);
    eq(ST.tok.problems(ST.p).length,0,x.name+': токены');
    ST.fonts.ROLES.forEach(function(r){eq(!!ST.fonts.find(ST.p.fonts[r]),true,x.name+': роль '+r);eq(/[А-Яа-яЁё]/.test(ST.fonts.find(ST.p.fonts[r]).miss),false,x.name+': русские буквы в '+r);});
    eq(ST.nodes.shapeVars().indexOf('--r:'+x.shape.r+';')>=0,true,x.name+': форма');
    eq(Object.keys(x.text).length,5,x.name+': стили текста');});});
T('миграция 5→6: токены, шрифты и текст проекта уходят в рабочий профиль, узлы и значения не теряются',function(){
  var o=legacy(5);o.tokens.light.ac='#112233';o.tokens.light.brand='#abcdef';o.tokens.dark.brand='#123456';o.tokens.info.brand={app:'',role:'мой'};
  ['light','dark','info'].forEach(function(k){delete o.tokens[k].t2;});o.fonts.display='Rubik';o.text.title.fs=40;
  var tree=JSON.stringify(o.screens.map(function(s){return s.root;})),txt=JSON.stringify(o),r=ST.io.parse(txt);
  eq(!!r.project,true,r.error);var m=r.project;eq(m.schema,7);eq(ST.validate(m),'');
  var j=JSON.parse(JSON.stringify(m));eq('tokens' in j||'fonts' in j||'text' in j,false);
  eq(m.profiles[0].id,'project-main');eq(m.profiles[0].tokens.light.ac,'#112233');eq(m.profiles[0].tokens.light.brand,'#abcdef');eq(m.profiles[0].tokens.info.brand.role,'мой');
  eq(m.profiles[0].fonts.display,'Rubik');eq(m.profiles[0].text.title.fs,40);
  m.profiles.forEach(function(q){eq(!!q.tokens.light.brand,true,q.name+': brand');eq(q.tokens.light.t2,undefined,q.name+': t2 удалён');});
  eq(pr0(m,'mockups-nunito').tokens.light.ac,'#f59a23','значения встроенных не тронуты');
  eq(m.screens.every(function(s){return s.profile==='project-main';}),true);
  eq(JSON.stringify(m.screens.map(function(s){return s.root;})),tree,'дерево узлов не изменилось');
  ST.set(m);eq(ST.p.tokens.light.ac,'#112233');eq(ST.p.fonts.display,'Rubik');
  eq(JSON.stringify(ST.migrate(JSON.parse(JSON.stringify(m)))),JSON.stringify(m),'повторный запуск ничего не меняет');});
function pr0(m,id){return m.profiles.filter(function(q){return q.id===id;})[0];}
T('миграция из схем 1 и 3: общий путь доходит до 6, начальный набор токенов на месте',function(){
  var a=ST.io.parse(JSON.stringify({schema:1,meta:{},tokens:{light:{},dark:{}},components:[],assets:{},screens:[]}));eq(!!a.project,true,a.error);
  eq(a.project.schema,7);eq(Object.keys(a.project.profiles[0].tokens.light).length,22);
  var b=ST.io.parse(JSON.stringify(legacy(3)));eq(!!b.project,true,b.error);eq(b.project.schema,7);eq(b.project.screens.length,2);});
T('проверка: повреждения профилей находятся по-русски, исходный текст не затирается',function(){
  bad(function(c){c.profiles[1].name=c.profiles[0].name.toUpperCase();},'два профиля с названием');
  bad(function(c){c.profiles[2].id=c.profiles[1].id;},'одним id');
  bad(function(c){c.profiles[1].id='Плохой id';},'неверный id');
  bad(function(c){c.profiles[1].name='  ';},'нет названия');
  bad(function(c){c.profiles[0].tokens.light['Плохо']='#fff';c.profiles[0].tokens.dark['Плохо']='#000';},'не годится');
  bad(function(c){c.profiles[1].tokens.dark.ac=12345;},'должно быть текстом');
  eq(ST.validate((function(){fresh();var c=JSON.parse(JSON.stringify(ST.p));delete c.profiles[1].tokens.dark.ac;return c;})()),'','пустое значение в одной теме открывается (красная метка, Шаг 2)');
  bad(function(c){c.profiles[2].tokens.light.extra='#fff';c.profiles[2].tokens.dark.extra='#000';},'лишний токен');
  bad(function(c){['light','dark','info'].forEach(function(k){delete c.profiles[3].tokens[k].t1;});},'нет токена «t1»');
  bad(function(c){delete c.profiles[2].tokens.grad.tile;},'набор градиентов');
  bad(function(c){c.screens[0].profile='нет-такого';},'несуществующий профиль');
  bad(function(c){c.profiles[1].scope='чужой';},'область');
  bad(function(c){c.profiles[1].base='призрак';},'основан на профиле, которого нет');
  bad(function(c){c.profiles[1].locked='да';},'locked');
  bad(function(c){c.profiles[1].shape.r='14px;color:red';},'форм');
  bad(function(c){delete c.profiles[1].fonts.body;},'гарнитуры роли');
  bad(function(c){delete c.profiles;},'profiles');});
T('смена профиля экрана: значения меняются, дерево узлов нет; одна запись в истории, отмена и возврат',function(){fresh();
  put(node('n1','Кнопка',{bg:'@ac',color:'@act'}));
  var tree=JSON.stringify(ST.p.screens[0].root),n0=ST.undoS.length,a0=ac(),f0=ST.fonts.vars(ST.p)['--f-display'];
  eq(!!ST.prof.setCurrent('catworking-now').ok,true);eq(ST.undoS.length,n0+1);
  eq(JSON.stringify(ST.p.screens[0].root),tree,'узлы те же');eq(ac()!==a0,true,'цвет сменился');
  eq(ST.nodes.shapeVars().indexOf('--r:10px;')>=0,true,'форма профиля');eq(ST.fonts.vars(ST.p)['--f-display']!==f0,true,'шрифт роли');
  ST.undo();eq(ac(),a0);eq(ST.screen().profile,'project-main');ST.redo();eq(ST.screen().profile,'catworking-now');
  eq(!!ST.prof.setCurrent('catworking-now').ok,true);eq(ST.undoS.length,n0+1,'то же значение: истории нет');
  eq(!!ST.prof.assign(sid(),'нет').error,true);eq(!!ST.prof.assign('нет',  'pixel').error,true);});
T('дублирование: копия редактируется, исходный не меняется, один шаг отмены, имена проверяются',function(){fresh();
  var n0=ST.undoS.length,r=ST.prof.create('catworking-now','Мой стиль',sid());eq(!!r.ok,true,r.error);eq(ST.undoS.length,n0+1);
  var c=pr(r.id);eq(c.locked,false);eq(c.scope,'module','копия «app» становится стилем модуля');eq(c.base,'catworking-now');eq(ST.screen().profile,r.id);
  eq(JSON.stringify(c.tokens),JSON.stringify(pr('catworking-now').tokens));eq(ST.validate(ST.p),'');
  eq(!!ST.tok.setVal('ac','light','#010203').ok,true);eq(pr('catworking-now').tokens.light.ac!=='#010203',true);eq(pr(r.id).tokens.light.ac,'#010203');
  ST.undo();ST.undo();eq(ST.p.profiles.length,6,'копии нет');eq(ST.screen().profile,'project-main');
  ['','   ','Макеты nunito (ПРОЕКТ)','x'.repeat(61)].forEach(function(v){eq(!!ST.prof.create('project-main',v).error,true,'«'+v+'»');});
  eq(!!ST.prof.create('нет','Новый').error,true);eq(ST.p.profiles.length,6);});
T('переименование: рабочий можно, встроенный нет, дубли и пустое отклоняются, отмена работает',function(){fresh();
  eq(!!ST.prof.rename('project-main','Осень').ok,true);eq(pr('project-main').name,'Осень');ST.undo();eq(pr('project-main').name,'Макеты Nunito (проект)');
  eq(!!ST.prof.rename('pixel','Другой').error,true);eq(!!ST.prof.rename('project-main','ПИКСЕЛЬ').error,true);eq(!!ST.prof.rename('project-main','').error,true);
  eq(!!ST.prof.rename('project-main','Макеты Nunito (проект)').ok,true,'то же имя: без ошибки');});
T('удаление: используемый и встроенный нельзя, ненужный можно, base очищается, отмена возвращает',function(){fresh();
  var r=ST.prof.remove('project-main');eq(!!r.error,true);eq(r.error.indexOf('Экран 1')>=0,true,r.error);eq(!!pr('project-main'),true);
  eq(!!ST.prof.remove('pixel').error,true);
  var a=ST.prof.create('project-main','A');var b=ST.prof.create(a.id,'B');eq(pr(b.id).base,a.id);
  eq(!!ST.prof.remove(a.id).ok,true);eq(pr(a.id),null);eq(pr(b.id).base,null);eq(ST.validate(ST.p),'');
  ST.undo();eq(!!pr(a.id),true);eq(pr(b.id).base,a.id);});
T('встроенный профиль только для чтения: токены, шрифты, текст и градиенты не правятся, истории нет',function(){fresh();
  ST.prof.setCurrent('catworking-now');var n0=ST.undoS.length,s=JSON.stringify(ST.p);
  [ST.tok.setVal('ac','light','#000000'),ST.tok.add('zzz','#fff','#000'),ST.tok.rename('ac','accent'),ST.tok.remove('t2'),ST.tok.setMeta('ac','role','х'),
   ST.tok.addGrad('g2'),ST.tok.removeGrad('tile'),ST.tok.renameGrad('tile','tl'),ST.fonts.setRole('body','Rubik'),ST.fonts.setText('title',{fs:20}),ST.fonts.resetText('title')
  ].forEach(function(r,i){eq(!!r.error,true,'команда №'+i);eq(r.error.indexOf('встроенный')>=0,true,r.error);});
  eq(ST.undoS.length,n0);eq(JSON.stringify(ST.p),s);
  ST.prof.setCurrent('project-main');eq(!!ST.tok.setVal('ac','light','#000000').ok,true);eq(!!ST.fonts.setRole('body','Rubik').ok,true);});
T('токены: добавление, переименование и удаление идут во всех профилях, значения правятся в активном',function(){fresh();
  put(node('n1','К',{bg:'@ac',color:'@tx'}));var before=JSON.stringify(ST.p);
  eq(!!ST.tok.add('brand','#111111','#eeeeee','мой').ok,true);sameNames();
  ST.p.profiles.forEach(function(q){eq(q.tokens.light.brand,'#111111',q.name);eq(q.tokens.info.brand.role,'мой',q.name);});
  eq(!!ST.tok.setVal('brand','light','#222222').ok,true);eq(pr('project-main').tokens.light.brand,'#222222');eq(pr('pixel').tokens.light.brand,'#111111','чужие профили не тронуты');
  eq(!!ST.tok.rename('tile0','tile-top').ok,true);sameNames();
  ST.p.profiles.forEach(function(q){eq(q.tokens.grad.tile.stops[0].c,'@tile-top',q.name);});
  eq(!!ST.tok.rename('tx','ink').ok,true);sameNames();
  eq(ST.p.screens[0].root.children[0].style.color,'@ink','ссылка в узле');eq(pr('pixel').text.title.c,'@ink','стиль текста в другом профиле');
  eq(ST.tok.problems(ST.p).length,0);eq(ST.validate(ST.p),'');
  eq(!!ST.tok.remove('brand').ok,true);sameNames();ST.p.profiles.forEach(function(q){eq(q.tokens.light.brand,undefined,q.name);});
  ST.undo();sameNames();eq(pr('contrast').tokens.light.brand,'#111111');
  ST.undo();ST.undo();ST.undo();ST.undo();eq(JSON.stringify(ST.p),before,'всё отменяется до исходного');
  eq(!!ST.tok.addGrad('g2').ok,true);ST.p.profiles.forEach(function(q){eq(!!q.tokens.grad.g2,true,q.name);});
  eq(!!ST.tok.removeGrad('g2').ok,true);ST.p.profiles.forEach(function(q){eq(q.tokens.grad.g2,undefined,q.name);});eq(ST.validate(ST.p),'');});
T('новый экран получает профиль текущего, у экранов могут быть разные профили',function(){fresh();
  ST.prof.setCurrent('pixel');ST.addScreen();eq(ST.p.screens.length,2);eq(ST.screen().profile,'pixel');eq(ST.p.screens[0].profile,'pixel');
  ST.prof.setCurrent('contrast');eq(ST.p.screens[0].profile,'pixel');eq(ST.p.screens[1].profile,'contrast');
  ST.cur=ST.p.screens[0].id;eq(ST.p.tokens===pr('pixel').tokens,true,'посредник следует за экраном');
  ST.cur=ST.p.screens[1].id;eq(ST.p.tokens===pr('contrast').tokens,true);eq(ST.validate(ST.p),'');});
T('холст берёт профиль активного экрана',function(){fresh();ST.tok.setView('both');
  ST.prof.setCurrent('catworking-now');ST.addScreen();ST.prof.setCurrent('contrast');
  function v(n){ST.canvas.render();return getComputedStyle(document.querySelector('#st-canvas .st-frame')).getPropertyValue(n).trim().toLowerCase();}
  var first=ST.p.screens[0].id;eq(v('--ac'),pr('contrast').tokens.light.ac);eq(v('--r'),'8px');
  ST.cur=first;eq(v('--ac'),pr('catworking-now').tokens.light.ac);eq(v('--r'),'10px');eq(pr('contrast').tokens.light.ac!==pr('catworking-now').tokens.light.ac,true);});
T('компоненты: профиль есть, назначается, мешает удалению профиля',function(){fresh();
  ST.do('тестовый компонент',function(x){x.components.push({id:'c1',name:'Кнопка',profile:'project-main',root:node('cr','К')});});
  eq(ST.validate(ST.p),'');eq(!!ST.prof.assignComponent('c1','pixel').ok,true);eq(ST.p.components[0].profile,'pixel');
  eq(!!ST.prof.assignComponent('c1','нет').error,true);eq(!!ST.prof.assignComponent('нет','pixel').error,true);
  var a=ST.prof.create('project-main','Свой');eq(!!ST.prof.assignComponent('c1',a.id).ok,true);
  var r=ST.prof.remove(a.id);eq(!!r.error,true);eq(r.error.indexOf('Кнопка')>=0,true,r.error);
  ST.p.components[0].profile='нет';eq(ST.validate(ST.p).indexOf('компонент')>=0,true);});
T('файл: сохранение и открытие без изменений, ничего лишнего в корне; посредники живут после отмены',function(){fresh();
  ST.prof.setCurrent('contrast');var s=JSON.stringify(ST.p),r=ST.io.parse(s);eq(!!r.project,true,r.error);eq(JSON.stringify(r.project),s);
  eq(Object.keys(JSON.parse(s)).sort().join(),'assets,components,meta,profiles,schema,screens','в корне файла только эти разделы');
  eq(Object.keys(ST.p).indexOf('tokens'),-1);ST.undo();eq(ST.p.tokens===pr('project-main').tokens,true);ST.redo();eq(ST.p.tokens===pr('contrast').tokens,true);
  eq(ST.p.fonts===pr('contrast').fonts,true);eq(ST.p.text===pr('contrast').text,true);});
})();
