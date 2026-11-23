/* Тесты Шага 6б (импорт разметки, примеры, сверка). Нужен harness с T(name,fn) и eq(a,b,msg); см. st-test-imp.html */
(function(){
function fresh(){ST.set(ST.blank('Т'));}
function mk(key){var m=ST.impui.mock(key,'light');return {html:ST.impui.wrap(m),css:m.css,name:key,w:m.w,h:m.h,theme:'light'};}
function icons(root){var a=[];ST.nodes.walk(root,function(n){if(n.type==='icon')a.push(n.props.icon);});return a;}

T('данные примеров: 6 записей, у каждой 13 токенов',function(){eq(ST.mockups.length,6);
  ST.mockups.forEach(function(m){eq(Object.keys(m.vars).length,13,m.key+' '+m.theme);});});
T('обёртка корня: класс .s, токены и кавычки экранированы',function(){
  var w=ST.impui.wrap({vars:{bg:'#fff'},rootStyle:'padding:1px"><b>',html:'<i></i>'});
  eq(w.indexOf('<b>')<0,true,'кавычка не экранирована');eq(w.indexOf('class="s"')>0,true);eq(w.indexOf('--bg:#fff')>0,true);});
['subjects','sheet','focus'].forEach(function(k){
  T('пример «'+k+'»: экран добавляется одним шагом, проект валиден, сверка положения не хуже 97 %',function(){fresh();
    var n0=ST.p.screens.length,u0=ST.undoS.length;
    return ST.impui.importScreen(mk(k)).then(function(r){
      if(r.error)throw new Error(r.error);
      eq(ST.p.screens.length,n0+1);eq(ST.undoS.length,u0+1,'шагов истории');eq(ST.cur,r.id);eq(ST.validate(ST.p),'');
      eq(ST.p.screens[n0].profile,ST.prof.WORK_ID);eq(ST.p.screens[n0].w,390);eq(ST.p.screens[n0].h,844);
      if(r.cmp.n<20)throw new Error('мало узлов в сверке: '+r.cmp.n);
      if(r.cmp.pct<97)throw new Error('совпало '+r.cmp.pct+' %, худший узел «'+r.cmp.worst+'» '+r.cmp.max+' px');
      ST.undo();eq(ST.p.screens.length,n0,'отмена вернула проект');});});});
T('цвета макета становятся токенами; сырых в «Предметах» нет',function(){fresh();
  return ST.impui.importScreen(mk('subjects')).then(function(r){eq(r.res.report.raw.length,0);if(r.res.report.tok<30)throw new Error('токенов '+r.res.report.tok);});});
T('нижняя панель: серые квадраты заменены значками по подписям',function(){fresh();
  return ST.impui.importScreen(mk('focus')).then(function(r){var ic=icons(r.res.root);
    ['calendar','sun','timer','paw','book'].forEach(function(n){if(ic.indexOf(n)<0)throw new Error('нет значка '+n);});});});
T('опасная разметка: скрипты, внешние адреса и onerror не выполняются и не попадают в узлы',function(){fresh();window.__x=0;
  var html='<div style="width:200px;height:80px;background:#123456"><script>window.__x=1<\/script><img src="http://example.invalid/a.png" onerror="window.__x=2">Текст</div>';
  return ST.impui.importScreen({html:html,css:'@import url(http://example.invalid/x.css);',name:'опасный',theme:'light'}).then(function(r){
    if(r.error)throw new Error(r.error);eq(window.__x,0,'код выполнился');
    var s=JSON.stringify(r.res.root);eq(s.indexOf('example.invalid')<0,true);eq(s.indexOf('<script')<0,true);eq(ST.validate(ST.p),'');});});
T('пустая разметка: понятная ошибка, проект не тронут',function(){fresh();var s0=JSON.stringify(ST.p);
  return ST.impui.importScreen({html:'   ',name:'пусто',theme:'light'}).then(function(r){
    eq(!!r.error,true);eq(JSON.stringify(ST.p),s0);eq(ST.undoS.length,0);});});
T('разделение вставленной разметки: <style> уходит в css',function(){
  var s=ST.imp.split('<style>.a{color:red}</style><div class="a">x</div>');eq(s.css.indexOf('.a{color:red}')>=0,true);eq(s.html.indexOf('<style')<0,true);});
T('отчёт импорта: цвета, неточности и сверка в одном тексте',function(){fresh();
  return ST.impui.importScreen(mk('sheet')).then(function(r){var t=ST.impui.reportHtml('Шторка',r);
    eq(t.indexOf('Сверка положения')>0,true);eq(t.indexOf('градиент')>0,true);});});
})();
