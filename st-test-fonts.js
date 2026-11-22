/* Тесты Шага 3 (шрифты и типографика). Нужен harness с T(name,fn) и eq(a,b,msg); см. st-test-fonts.html. T может вернуть Promise. */
(function(){
var F=ST.fonts;
function node(id,text){return {id:id,type:'text',name:'Текст '+id,layout:{dir:'column'},style:{text:text},props:{},children:[]};}
function put(n){ST.do('тестовый узел',function(x){x.screens[0].root.children.push(n);});}
function fresh(){ST.set(ST.blank('Т'));}
function tx(o){return Object.assign({ff:'role:body',fw:700,fs:16,lh:1.2,ls:0,tt:'none',ta:'left',cl:0,c:'@tx',tnum:false},o||{});}

T('новый проект: схема 3, 4 роли, 5 стилей текста, всё проходит проверку',function(){fresh();
  eq(ST.p.schema,ST.SCHEMA);eq(ST.validate(ST.p),'');eq(Object.keys(ST.p.fonts).join(),'display,body,mono,pixel');
  eq(Object.keys(ST.p.text).join(),'title,cardtitle,caption,counter,button');
  Object.keys(ST.p.text).forEach(function(k){eq(F.checkT(ST.p.text[k]),'',k);});
  var t=ST.p.text;eq(t.title.fs+'/'+t.title.fw,'32/800');eq(t.cardtitle.fs+'/'+t.cardtitle.fw,'17/800');
  eq(t.caption.fs+'/'+t.caption.fw,'13/700');eq(t.button.fs+'/'+t.button.fw,'15/800');});
T('каталог: 10 шрифтов, у каждого файл, лицензия и вес; Pixelify Sans не проходит по русским буквам',function(){
  eq(F.CAT.length,10);F.CAT.forEach(function(c){eq(/\.woff$/.test(c.f)&&!!c.lic&&c.w.length===2&&c.kb>0,true,c.n);});
  eq(F.level('Nunito'),'ok');eq(F.level('Roboto Slab'),'warn');eq(F.level('JetBrains Mono'),'warn');
  eq(F.level('Pixelify Sans'),'bad');eq(F.level('Press Start 2P'),'ok');
  eq(F.list().length,9);eq(F.blocked().length,1);eq(F.blocked()[0].n,'Pixelify Sans');});
T('роль нельзя назначить шрифту без русских букв или неизвестному; проект при этом не меняется',function(){fresh();var s=JSON.stringify(ST.p);
  eq(!!F.setRole('pixel','Pixelify Sans').error,true);eq(!!F.setRole('pixel','Comic Sans').error,true);eq(!!F.setRole('нет','Nunito').error,true);
  eq(JSON.stringify(ST.p),s);});
T('смена шрифта роли: переменные холста меняются, отмена возвращает',function(){fresh();
  eq(F.vars(ST.p)['--f-display'].indexOf("'Nunito'")===0,true);
  eq(!!F.setRole('display','Rubik').ok,true);eq(ST.p.fonts.display,'Rubik');eq(F.vars(ST.p)['--f-display'].indexOf("'Rubik'")===0,true);
  eq(F.styleAttr(ST.p).indexOf('--f-pixel:')>=0,true);
  ST.undo();eq(ST.p.fonts.display,'Nunito');});
T('стиль текста: границы и тип значений, ошибка не меняет проект',function(){fresh();var s=JSON.stringify(ST.p);
  [{fs:5},{fs:401},{fs:'15'},{fw:50},{fw:1001},{lh:0.2},{ls:3},{cl:1.5},{cl:13},{tt:'big'},{ta:'justify'},{c:'красный'},{ff:'Мой шрифт'},{tnum:'да'},{fs:NaN}].forEach(function(p){
    eq(!!F.setText('title',p).error,true,JSON.stringify(p));});
  eq(!!F.setText('нет',{fs:10}).error,true);eq(JSON.stringify(ST.p),s);});
T('стиль текста: изменение, возврат к значениям макетов, отмена',function(){fresh();
  eq(!!F.setText('caption',{fs:14,fw:600,tt:'upper',ls:0.05,cl:2,ff:'Rubik',c:'#123456'}).ok,true);
  var t=ST.p.text.caption;eq(t.fs+'/'+t.fw+'/'+t.tt+'/'+t.ff+'/'+t.c,'14/600/upper/Rubik/#123456');
  eq(!!F.resetText('caption').ok,true);eq(ST.p.text.caption.fs,13);eq(ST.p.text.caption.ff,'role:body');
  ST.undo();eq(ST.p.text.caption.fs,14);ST.undo();eq(ST.p.text.caption.fs,13);});
T('css(): роль даёт var(--f-…), resolve раскрывает гарнитуру, обрезка, цифры одной ширины, регистр',function(){fresh();
  var c=F.css(ST.p.text.title,ST.p);
  eq(c.indexOf('font-family:var(--f-display);font-weight:800;font-size:32px;line-height:1.1;')===0,true);eq(c.indexOf('color:var(--tx);')>0,true);
  eq(F.css(ST.p.text.title,ST.p,{resolve:true}).indexOf("font-family:'Nunito',ui-rounded")===0,true);
  eq(F.css(ST.p.text.cardtitle,ST.p).indexOf('-webkit-line-clamp:2')>0,true);eq(F.css(ST.p.text.title,ST.p).indexOf('line-clamp')<0,true);
  eq(F.css(ST.p.text.counter,ST.p).indexOf('tabular-nums')>0,true);eq(F.css(ST.p.text.title,ST.p).indexOf('tabular')<0,true);
  eq(F.css(tx({tt:'upper',ls:0.1,ta:'center'}),ST.p).indexOf('text-transform:uppercase;')>0,true);});
T('имя гарнитуры не может внести лишний CSS',function(){
  eq(F.stack("x';}body{background:red;/*"),"'xbodybackgroundred',system-ui,sans-serif");
  eq(!!F.checkT(tx({ff:"x';}body{"})),true);});
T('предупреждения: мелкий текст, вес вне диапазона, один вес, символы, вне профиля, сырой цвет',function(){fresh();
  function w(o){return F.warnT(ST.p,tx(o)).join(' | ');}
  eq(w({ff:'role:body'}),'');
  eq(w({fs:11}).indexOf('меньше 12 px')>=0,true);
  eq(w({ff:'Rubik',fw:200}).indexOf('от 300 до 900')>=0,true);
  eq(w({ff:'Pangolin',fw:800}).indexOf('один вес (400)')>=0,true);eq(w({ff:'Pangolin',fw:400}).indexOf('один вес')<0,true);
  eq(w({ff:'Roboto Slab'}).indexOf('₴₽')>=0,true);
  eq(w({ff:'Pixelify Sans'}).indexOf('нет русских букв')>=0,true);
  eq(w({ff:'Rubik'}).indexOf('вне профиля')>=0,true);eq(w({c:'#fff'}).indexOf('Сырой цвет')>=0,true);});
T('«используемые шрифты»: только то, что нужно; файлы, вес, напоминание про sw.js CORE, предупреждение про font:inherit',function(){fresh();
  var r=F.report(ST.p);eq(r.families.join(),'Nunito');eq(r.files.length,1);eq(r.files[0].file,'fonts/Nunito.woff');eq(r.kb,91.2);
  eq(r.warns.some(function(x){return x.indexOf('CORE')>=0&&x.indexOf('VERSION')>=0;}),true);
  eq(r.warns.some(function(x){return x.indexOf('font:… inherit')>=0;}),true);
  put(node('n1',tx({ff:'role:pixel'})));put(node('n2',tx({ff:'Caveat'})));
  r=F.report(ST.p);eq(r.families.sort().join(),'Caveat,Nunito,Press Start 2P');eq(r.kb,Math.round((91.2+37.5+194.5)*10)/10);
  F.setRole('mono','JetBrains Mono');r=F.report(ST.p);
  eq(r.warns.some(function(x){return x.indexOf('JetBrains Mono')>=0&&x.indexOf('₴')>=0;}),true);});
T('смена профиля шрифтов не трогает узлы: роль в узле остаётся ролью, меняется только гарнитура роли',function(){fresh();
  put(node('n1',tx({ff:'role:display'})));var before=JSON.stringify(ST.p.screens);
  F.setRole('display','Comfortaa');eq(JSON.stringify(ST.p.screens),before);
  eq(F.family(ST.p,'role:display'),'Comfortaa');eq(F.family(ST.p,'Rubik'),'Rubik');});
T('миграция 2→3: добавляет роли и стили, свои значения остаются',function(){
  var a={schema:2,meta:{},tokens:{light:{},dark:{},info:{},grad:{}},components:[],assets:{},screens:[],fonts:{display:'Rubik'}};
  eq(ST.validate(a),'');var m=ST.migrate(a);eq(m.schema,ST.SCHEMA);eq(m.fonts.display,'Rubik');eq(m.fonts.body,'Nunito');eq(Object.keys(m.text).length,5);
  var b={schema:1,meta:{},tokens:{light:{},dark:{}},components:[],assets:{},screens:[]};m=ST.migrate(b);eq(m.schema,ST.SCHEMA);eq(m.fonts.pixel,'Press Start 2P');
  eq(JSON.stringify(ST.migrate(JSON.parse(JSON.stringify(m)))),JSON.stringify(m));});
T('повреждённые fonts и text не принимаются; проект туда-обратно без потерь',function(){
  var p=ST.blank('Т');p.fonts=[];eq(ST.validate(p)!=='',true);
  p=ST.blank('Т');p.text.title.fs='большой';eq(ST.validate(p).indexOf('title')>=0,true);
  p=ST.blank('Т');p.fonts.body=123;eq(ST.validate(p)!=='',true);
  var q=ST.blank('Т2');F.setText;var r=ST.io.parse(JSON.stringify(q));eq(JSON.stringify(r.project),JSON.stringify(q));});
T('кириллица в тексте узла и в подписях не ломает CSS и разметку (экранирование)',function(){fresh();
  put(node('n1',tx()));eq(ST.validate(ST.p),'');eq(ST.esc('Ёё <b> «№»'),'Ёё &lt;b&gt; «№»');
  eq(/[А-Яа-я]/.test(F.css(ST.p.text.title,ST.p)),false);});
T('50 узлов: смена шрифта роли и пересчёт отчёта и CSS < 500 мс',function(){fresh();
  ST.do('50 узлов',function(x){for(var i=0;i<50;i++)x.screens[0].root.children.push(node('m'+i,tx({ff:i%2?'role:display':'role:body'})));});
  var t0=Date.now();F.setRole('display','Rubik');F.setRole('body','Onest');
  ST.p.screens[0].root.children.forEach(function(n){F.css(n.style.text,ST.p);F.warnT(ST.p,n.style.text);});F.report(ST.p);F.styleAttr(ST.p);
  eq(Date.now()-t0<500,true);});
/* ---- только в браузере: глифы проверяются по-настоящему, шрифты грузятся из fonts/ ---- */
T('браузер: проверка русских букв в каждом файле совпадает с таблицей (fontTools), «нет файла» не ломает список',function(){
  if(typeof document==='undefined'||!document.fonts)return;
  return ST.fontui.verify().then(function(){
    F.CAT.forEach(function(c){var live=F.live[c.n];eq(!!live,true,c.n);eq(!!live.nofile,false,c.n+': файл не загрузился');
      eq(live.miss.split('').sort().join(''),c.miss.split('').sort().join(''),c.n+': нашла «'+live.miss+'», в таблице «'+c.miss+'»');});
    eq(F.blocked().map(function(c){return c.n;}).join(),'Pixelify Sans');});});
T('браузер: файл не загрузился → таблица остаётся в силе, список не пустеет',function(){
  F.live['Nunito']={miss:'',nofile:true};eq(F.level('Nunito'),'ok');F.live['Nunito']={miss:'ЁЙ',nofile:false};eq(F.level('Nunito'),'bad');
  delete F.live['Nunito'];eq(F.level('Nunito'),'ok');});
})();
