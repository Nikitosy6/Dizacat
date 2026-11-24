/* Тесты Шага 7 (экспорт: CSS, разметка, токены, пакет, самопроверка). Нужен harness с T(name,fn) и eq(a,b,msg); см. st-test-exp.html */
(function(){
var X=ST.exp,N=ST.nodes;
function fresh(){ST.set(ST.blank('Т'));}
function mk(key){var m=ST.impui.mock(key,'light');return {html:ST.impui.wrap(m),css:m.css,name:key,w:m.w,h:m.h,theme:'light'};}
function imp(key){fresh();return ST.impui.importScreen(mk(key)).then(function(r){if(r.error)throw new Error(r.error);return r.id;});}
function ok(v,m){if(!v)throw new Error(m||'условие не выполнено');}
function make(id,o){var r=X.make(ST.p,Object.assign({id:id,prefix:'sj'},o||{}));if(r.error)throw new Error(r.error);return r;}
function count(s,sub){return s.split(sub).length-1;}
function custom(){fresh();var id;
  ST.do('t',function(d){var s=d.screens[0],b=N.make('frame',d),t=N.make('text',d);id=s.id;t.props.text='Старт {n}';t.name='Подпись';
    b.name='Кнопка Старт';b.layout={dir:'row',w:390,h:48,ai:'center',jc:'center'};b.style={bg:'@ac',r:'var:r',ledge:{y:3,c:'@ed'}};b.states={pressed:{style:{bg:'@ed',ledge:{y:0}}},disabled:{style:{op:50}}};b.children=[t];s.root.children=[b];});
  return id;}
function runJs(r){ /* выполняет выданный код как настоящий скрипт (не eval) с T и esc, как в приложении */
  var dict={};r.mk.i18n.forEach(function(x){dict[x.key]=x.ru;});
  var oldT=window.T,oldE=window.esc;
  window.esc=ST.esc;window.T=function(k,o){return String(dict[k]).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,function(m,n){return o&&o[n]!==undefined?o[n]:m;});};
  window[r.ns]={L:{ru:{},en:{}},act:{}};
  try{var s=document.createElement('script');s.textContent=r.js;document.head.appendChild(s);s.remove();return window[r.ns][r.fn]({});}
  finally{window.T=oldT;window.esc=oldE;delete window[r.ns];}}

T('имена: транслит, слаг, camel, занятые классы',function(){
  eq(X.slug('Кнопка: Новый курс'),'knopka-novyy-kurs');eq(X.slug('   '),'x');eq(X.slug('Ёж Щука'),'ezh-schuka');eq(X.camel('Новый курс'),'novyyKurs');
  eq(X.taken('sj','cls','sj-card'),true);eq(X.taken('sj','cls','sj-tile'),true);eq(X.taken('fx','cls','fx-pill'),true);eq(X.taken('sj','cls','sj-subjects-card'),false);});
T('ошибки ввода: префикс, пустой экран, mus в режиме module',function(){fresh();
  eq(!!X.make(ST.p,{prefix:'1a'}).error,true);eq(!!X.make(ST.p,{prefix:'s'}).error,true);eq(!!X.make(ST.p,{prefix:'Кот'}).error,true);
  var e=X.make(ST.p,{prefix:'sj'});eq(/пустой/.test(e.error),true,'пустой экран: '+e.error);
  return imp('sheet').then(function(id){eq(/mus/.test(X.make(ST.p,{id:id,prefix:'mus'}).error||''),true);});});
['subjects','sheet','focus'].forEach(function(k){
  T('пример «'+k+'»: экспорт без ошибок, самопроверка в обеих темах и без утечки стиля',function(){
    return imp(k).then(function(id){var r=make(id);eq(r.mode,'module');eq(r.errors.join('; '),'');
      return X.check(r,ST.p).then(function(c){if(!c.ok)throw new Error('расхождений '+c.bad.length+': '+c.bad.slice(0,3).join(' | ')+' '+c.leak.join(' | '));
        ok(c.n>=30,'узлов в сверке '+c.n);eq(c.bad.length,0);eq(c.leak.length,0);});});});});
T('токены module: три блока одного состава, все корни, все переменные',function(){
  return imp('sheet').then(function(id){var r=make(id),t=r.tb.text;
    eq(r.tb.roots.join(),'.sj-root,.sj-sh-bg,.sj-sh');
    eq(count(t,'--bg:'),3);eq(count(t,'--panel:'),3,'card → panel');eq(count(t,'--card:'),0,'имя студии не должно попасть');
    ['--tile0:','--t0:','--vio:','--r:','--rl:','--bw:','--ledge:','--sh:','--ff-body:','--ff-pixel:'].forEach(function(v){eq(count(t,v),3,v);});
    ok(t.indexOf('@media(prefers-color-scheme:light){')>0&&t.indexOf(':root:not([data-theme=dark]) .sj-root')>0&&t.indexOf(':root[data-theme=light] .sj-sh')>0,'структура светлой темы');
    r.used.forEach(function(v){ok(t.indexOf(v+':')>=0,'переменная '+v+' не задана');});});});
T('CSS: только классы модуля, без глобальных селекторов, hex и запрещённого',function(){
  return imp('subjects').then(function(id){var r=make(id),css=r.css.text;
    eq(/(^|\n)(:root|body|html|\*)\s*[{,]/.test(css),false);eq(/#[0-9a-fA-F]{3,8}\b/.test(css),false,'сырой hex');eq(/z-index|width:390px|height:844px|<nav|font:[^;]*inherit/.test(css),false);
    ok(count(css,'var(--panel)')>0,'токен card должен стать --panel');ok(count(css,'var(--card)')===0);
    css.split('\n').forEach(function(l){if(/^\.[^ ]+\{$/.test(l)||/^\.[^ ]+,$/.test(l))ok(l.indexOf('.sj-subjects')===0,'селектор '+l);});
    eq(r.js.indexOf('<nav')<0&&r.js.indexOf('data-tab')<0,true);eq(r.js.indexOf('Нижняя панель')<0,true);
    ok(r.notes.some(function(n){return /Нижняя панель/.test(n);}),'нет пометки про нижнюю панель');});});
T('разметка: код из пакета даёт тот же HTML, что проверила студия; esc и T на месте',function(){
  return imp('subjects').then(function(id){var r=make(id);
    eq(runJs(r),X.render(r.mk),'JS и HTML самопроверки расходятся');
    ok(r.js.indexOf('esc(T(')>0,'тексты через esc(T())');ok(r.js.indexOf('viewBox="0 0 24 24"')>0&&r.js.indexOf('sc-camel')<0);
    eq(r.js.indexOf('SJ.'+r.fn+' = function (d)')>=0,true);});});
T('ключи T: уникальны, есть в словарях ru и en, параметры {n} передаются',function(){
  return imp('subjects').then(function(id){var r=make(id),ks={};
    r.mk.i18n.forEach(function(x){eq(!!ks[x.key],false,'повтор '+x.key);ks[x.key]=1;ok(/^sj_subjects_/.test(x.key),x.key);ok(r.dict.indexOf(x.key+':')>0);});
    eq(count(r.dict,'Object.assign(SJ.L.ru'),1);eq(count(r.dict,'Object.assign(SJ.L.en'),1);
    eq(r.mk.i18n.length>10,true);eq(X.taken('sj','keys','sj_subjects_x'),false);
    eq(X.params('Через {n} дн., {name}').join(),'n,name');});});
T('действия: кнопки получают data-a, имена уникальны и не заняты, заготовка объявлена',function(){
  return imp('focus').then(function(id){var r=make(id),seen={};ok(r.acts.length>=2,'действий '+r.acts.length);
    r.acts.forEach(function(a){eq(!!seen[a.name],false);seen[a.name]=1;eq(X.taken('sj','acts',a.name),false);ok(r.js.indexOf('data-a="'+a.name+'"')>0);ok(r.actCode.indexOf(a.name+'(d)')>0);});
    eq(r.js.indexOf('<button type="button"')>0,true);ok(r.css.text.indexOf('appearance:none')>0,'сброс стиля кнопки');});});
T('состояния и ширина экрана: :active, :disabled, width:100% вместо 390 px',function(){
  var id=custom(),r=make(id),css=r.css.text;
  ok(css.indexOf(':active{')>0,'нет :active');ok(css.indexOf(':disabled')>0&&css.indexOf('[aria-disabled=true]')>0,'нет :disabled');
  ok(/:active\{[^}]*box-shadow:none/.test(css),'нажатое состояние должно снять бортик');ok(css.indexOf('width:390px')<0&&/width:100%/.test(css));
  ok(r.warns.some(function(w){return /ширина 390/.test(w);}),'нет предупреждения о ширине');
  eq(r.mk.i18n[0].params.join(),'n');ok(r.js.indexOf("{ n: d.n }")>0,'параметр n');ok(r.mk.data[0].name==='n');
  return X.check(r,ST.p).then(function(c){if(!c.ok)throw new Error(c.bad.slice(0,3).join(' | '));});});
T('запрещённое в выдаче: проверка ловит nav, 390 px, z-index 6–8, глобальные селекторы',function(){
  var v=function(t,css){return X.verify([{where:'т',text:t,css:!!css}]).length;};
  eq(v('<nav class="a">'),1);eq(v('x data-tab="today"'),1);eq(v('.a{width:390px}'),1);eq(v('.a{z-index:7}'),1);eq(v('.a{z-index:53}'),0);eq(v('.a{z-index:4}'),0);eq(v('.a{z-index:60}'),1);
  eq(v('.a{font:600 15px inherit}'),1);eq(v('sc-camel-view-box'),1);eq(v('body{margin:0}',true),1);eq(v(':root{--a:1}',true),1);eq(v('.sj-a{color:red}',true),0);});
T('занятое имя класса: переименовывается и попадает в примечание',function(){
  fresh();var id;ST.do('t',function(d){var s=d.screens[0];id=s.id;s.name='Card';var f=N.make('frame',d);f.name='Tile';s.root.children=[f];});
  var r=make(id,{slug:'card'});ok(r.cls[r.root.id]==='sj-card-2','корень '+r.cls[r.root.id]);
  eq(r.notes.some(function(n){return /sj-card → sj-card-2/.test(n);}),true);});
T('ошибки токенов блокируют экспорт: пустое значение, занятая переменная, дубль',function(){
  return imp('sheet').then(function(id){
    ST.do('t',function(d){d.profiles[0].tokens.dark.bg='';});
    var r=make(id);ok(r.errors.some(function(e){return /bg/.test(e)&&/тёмной/.test(e);}),'нет ошибки про токен: '+r.errors.join('|'));
    ST.undo();
    ST.do('t',function(d){d.profiles.forEach(function(p){p.tokens.info.bg.app='--cc';});});
    r=make(id);ok(r.errors.some(function(e){return /--cc/.test(e)&&/занята/.test(e);}),'занятая переменная');
    ST.undo();
    ST.do('t',function(d){d.profiles.forEach(function(p){p.tokens.info.bg.app='--panel';});});
    r=make(id);ok(r.errors.some(function(e){return /одну переменную/.test(e);}),'дубль переменной');});});
T('режим app: профиль «Catworking сейчас», в :root только новые переменные, самопроверка проходит',function(){
  return imp('subjects').then(function(id){
    eq(ST.prof.assign(id,'catworking-now').ok,true);var r=make(id);eq(r.mode,'app');eq(r.errors.join('; '),'');
    ok(r.tb.add.length>3,'новых переменных '+r.tb.add.length);eq(r.tb.text.indexOf('--panel:'),-1,'существующие переменные не пишутся');
    ok(/--tile0:/.test(r.tb.text)&&/--ff-body:/.test(r.tb.text));eq(count(r.tb.text,':root{'),1+0,'блок :root');
    eq(r.tb.diff.length,0,'профиль совпадает с приложением');eq(r.fonts.files.length,0,'системный шрифт: файлов нет');
    eq(r.pkg.indexOf('styles.css')>0,true);
    return X.check(r,ST.p).then(function(c){if(!c.ok)throw new Error(c.bad.slice(0,3).join(' | '));eq(c.leak.length,0);});});});
T('режим app: значения, отличающиеся от приложения, идут отдельным списком и не пишутся в :root',function(){
  return imp('sheet').then(function(id){ST.prof.assign(id,'catworking-now');
    ST.do('t',function(d){d.profiles[1].tokens.dark.acc='#ff0000';d.profiles[1].tokens.dark.ac='#ff0000';d.profiles.forEach(function(p){if(p.id==='project-main')p.tokens.dark.ac='#123456';});});
    ST.do('t',function(d){d.screens.forEach(function(s){if(s.id===id)s.profile='project-main';});d.profiles.forEach(function(p){if(p.id==='project-main')p.scope='app';});});
    var r=make(id);eq(r.mode,'app');ok(r.tb.diff.some(function(x){return x.v==='--acc'&&x.mine==='#123456';}),'нет отличия --acc');eq(r.tb.text.indexOf('--acc:'),-1);
    ok(/Значения, которые отличаются от приложения/.test(r.pkg),'нет списка в пакете');});});
T('самопроверка ловит расхождение холста и экспорта и утечку стиля',function(){
  return imp('sheet').then(function(id){var r=make(id),bad=make(id);
    bad.css.text=bad.css.text.replace(/font-size:(\d+)px/,'font-size:31px');
    return X.check(bad,ST.p).then(function(c){eq(c.ok,false,'изменённый размер шрифта не пойман');ok(c.bad.length>0);
      var lk=make(id);lk.tb.text=lk.tb.text.replace('.sj-root','.sj-root,.card');
      return X.check(lk,ST.p).then(function(c2){eq(c2.ok,false,'утечка не поймана');ok(c2.leak.length>0,'нет сообщения об утечке');
        var nv=make(id);nv.tb.text=nv.tb.text.replace(/--tile0:[^;]+;/g,'');return X.check(nv,ST.p).then(function(c3){eq(c3.ok,false,'пропажа переменной в блоке не поймана');});});});});});
T('режим skin: только блоки скина и пакет, самопроверка пропущена',function(){
  return imp('focus').then(function(id){
    ST.do('t',function(d){var c=JSON.parse(JSON.stringify(d.profiles[0]));c.id='skin-t';c.name='Скин тест';c.scope='skin';c.locked=false;d.profiles.push(c);d.screens.forEach(function(s){if(s.id===id)s.profile='skin-t';});});
    eq(ST.validate(ST.p),'');var r=make(id);eq(r.mode,'skin');eq(r.tb.text.indexOf(':root[data-skin=skin-t]{')>=0,true);eq(count(r.tb.text,'--panel:'),3);
    ok(r.pkg.indexOf('S.skin')>0&&r.pkg.indexOf('render()')>0,'шаги приложения');eq(r.pkg.indexOf('## 5. CSS'),-1,'CSS экрана в skin не выдаётся');
    return X.check(r,ST.p).then(function(c){eq(c.skipped,true);eq(c.ok,true);});});});
T('шрифты: профиль «Макеты Nunito» даёт файлы и @font-face, пакет перечисляет sw.js CORE',function(){
  return imp('subjects').then(function(id){var r=make(id);ok(r.fonts.files.length>=1,'файлов шрифтов нет');
    ok(r.fonts.files.some(function(f){return f.file==='fonts/Nunito.woff';}));ok(r.fonts.face.indexOf("@font-face{font-family:'Nunito'")>=0);
    ok(r.files.indexOf('sw.js → CORE')>0&&r.files.indexOf('sj-course.css')>0&&r.files.indexOf('sj-boot.js')>0,'файлы и порядок загрузки');});});
T('пакет для ИИ-кодера: промпт, разделы, якоря, запреты, без вложенных ``` ',function(){
  return imp('subjects').then(function(id){var r=make(id),p=r.pkg;
    ['## 1. Промпт','Работай по своду правил','## 2. Что и куда','## 5. CSS','## 6. Разметка','## 7. Строки','## 8. Действия','## 9. Чек-лист','## 10. Что нельзя менять','## 11. Что режим module','## 12. Отчёт студии'].forEach(function(s){ok(p.indexOf(s)>=0,'нет «'+s+'»');});
    ok(p.indexOf('data-tab')>0&&p.indexOf('sjV')>0,'якоря');ok(p.indexOf('<div class="sj-root">')>0,'обёртка корня');
    eq(count(p,'```')%2,0,'нечётное число ограждений');ok(p.length>5000);
    eq(JSON.parse(r.json).format,'catworking-studio-screen');eq(JSON.parse(r.json).profile.id,r.pr.id);});});
T('окно «Экспорт»: кнопки копирования включаются после проверки; при расхождении заблокированы',function(){
  return imp('sheet').then(function(id){
    function wait(f,ms){var t0=Date.now();return new Promise(function(res,rej){(function tick(){if(f())return res();if(Date.now()-t0>(ms||6000))return rej(new Error('не дождался'));setTimeout(tick,50);})();});}
    function btns(){return Array.prototype.slice.call(document.querySelectorAll('.st-exp [data-x=copy]'));}
    ST.expui.open();
    return wait(function(){return btns().length>0&&!document.querySelector('.st-exp [data-x=run][disabled]');}).then(function(){
      ok(btns().length>=6,'блоков '+btns().length);eq(btns().every(function(b){return !b.disabled;}),true,'кнопки должны быть включены');
      ok(document.querySelector('.st-exp-ok'),'нет зелёной отметки самопроверки');
      document.querySelector('.st-exp [data-x=close]').click();eq(!!document.querySelector('.st-exp'),false);
      var real=X.check;X.check=function(){return Promise.resolve({ok:false,n:3,tol:1,bad:['«Рамка»: ширина 10 на холсте и 20 в экспорте'],leak:[],weak:false,note:''});};
      ST.expui.open();
      return wait(function(){return document.querySelector('.st-exp [data-x=unlock]');}).then(function(){X.check=real;
        eq(btns().every(function(b){return b.disabled;}),true,'при расхождении копирование должно быть заблокировано');
        document.querySelector('.st-exp [data-x=close]').click();});});});});
T('окно «Экспорт»: пустой экран и неверный префикс — понятная ошибка, не падение',function(){
  fresh();ST.expui.open();var e=document.querySelector('.st-exp-err');ok(e&&/пустой/.test(e.textContent),'нет сообщения о пустом экране');
  var inp=document.getElementById('st-exp-prefix');inp.value='1x';inp.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.st-exp [data-x=run]').click();
  ok(/Префикс/.test(document.querySelector('.st-exp-err').textContent));document.querySelector('.st-exp [data-x=close]').click();});
T('проект после экспорта не изменился: ни история, ни данные',function(){
  return imp('subjects').then(function(id){var s0=JSON.stringify(ST.p),u0=ST.undoS.length;make(id);return X.check(make(id),ST.p).then(function(){eq(JSON.stringify(ST.p),s0);eq(ST.undoS.length,u0);eq(ST.validate(ST.p),'');
    eq(document.querySelectorAll('iframe').length,0,'проверочное окно должно удаляться');});});});
})();
