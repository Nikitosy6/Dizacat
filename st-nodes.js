/* Catworking Studio: узлы дерева (модель, поиск, команды, проверки значений). Без DOM. Объект ST.nodes.
   Узел: {id,type,name,hidden?,layout,style,props,children}. Размеры: layout.w/h = 'fill' | 'hug' | число px (нет поля = 'hug').
   «На плаву»: layout.float=true + layout.x/y (абсолютное положение внутри родителя). Цвета: «@имя» токен, «@g:имя» градиент, либо #hex.
   Состояния (Шаг 4, п. 5): n.states={pressed:{style:{…}},disabled:{style:{…}}} — только отличия вида от обычного; размер и раскладка у всех состояний общие.
   Что показывает холст: N.vstate ('normal'|'pressed'|'disabled', состояние студии, в проект не пишется). Пока выбрано не «normal», правки style.* уходят в states.<имя>.style.*. */
(function(){'use strict';
var ST=window.ST=window.ST||{},N=ST.nodes={};
function isO(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
N.TYPES=['frame','text','icon','image','shape'];
N.TYPE_NAME={frame:'Рамка',text:'Текст',icon:'Иконка',image:'Картинка',shape:'Фигура'};
N.TYPE_MARK={frame:'▭',text:'T',icon:'★',image:'▨',shape:'◯'};
N.SHAPE={r:'14px',rl:'22px',bw:'1.5px',ledge:'3px'}; /* значения формы профиля «Макеты Nunito» (studio-profiles.json); профилей в коде пока нет (Шаг 1А) */
N.SHAPE_REF={'var:r':'r','var:rl':'rl','var:bw':'bw','var:ledge':'ledge'};
N.DEPTH_MAX=40;N.COUNT_MAX=5000;
N.STATES=['normal','pressed','disabled'];N.STATE_NAME={normal:'Обычное',pressed:'Нажато',disabled:'Выключено'};
N.vstate='normal';
N.setState=function(s){if(N.STATES.indexOf(s)<0||s===N.vstate)return false;N.vstate=s;ST.emit('state');return true;};
/* путь style.* при показанном состоянии превращается в states.<имя>.style.*; остальные пути не меняются */
N.sp=function(p){var s=N.vstate;return s!=='normal'&&/^style\./.test(p)?'states.'+s+'.'+p:p;};
/* вид узла в состоянии st: обычный стиль + отличия состояния (вложенные bd, ledge, sh, rotO, text склеиваются по ключам, остальное заменяется) */
N.styleOf=function(n,st){var S=n.style||{};if(!st||st==='normal')return S;
  var o=n.states&&n.states[st]&&n.states[st].style;if(!isO(o))return S;
  var r=Object.assign({},S);Object.keys(o).forEach(function(k){var v=o[k];r[k]=isO(v)&&isO(S[k])?Object.assign({},S[k],v):v;});return r;};
N.BLEND=['normal','multiply','screen','overlay','darken','lighten','color-dodge','soft-light','hard-light','difference','luminosity'];
N.ICONS={star:'<polygon points="12 2.5 15 9 22 9.5 16.7 14.3 18.3 21.3 12 17.6 5.7 21.3 7.3 14.3 2 9.5 9 9"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="M5 13l4 4L19 7"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'}; /* временный набор; полный (40+) — Шаг 5 */
/* Таблица числовых параметров: пределы, значение по умолчанию, подпись. # = номер в массиве */
N.SPEC={
  'style.rot':{min:-180,max:180,def:0,u:'°',n:'Поворот'},
  'style.rotO.x':{min:-100,max:200,def:50,u:'%',n:'Точка вращения X'},'style.rotO.y':{min:-100,max:200,def:50,u:'%',n:'Точка вращения Y'},
  'style.op':{min:0,max:100,def:100,u:'%',n:'Непрозрачность'},
  'style.br':{min:0,max:300,def:100,u:'%',n:'Яркость'},'style.ct':{min:0,max:300,def:100,u:'%',n:'Контраст'},
  'style.sa':{min:0,max:300,def:100,u:'%',n:'Насыщенность'},'style.bl':{min:0,max:50,def:0,u:'px',n:'Размытие'},
  'style.bd.w':{min:0,max:32,def:0,u:'px',n:'Толщина обводки',ref:1},
  'style.ledge.y':{min:0,max:32,def:0,u:'px',n:'Бортик',ref:1},
  'style.sh.x':{min:-100,max:100,def:0,u:'px',n:'Тень: сдвиг X'},'style.sh.y':{min:-100,max:100,def:0,u:'px',n:'Тень: сдвиг Y'},'style.sh.b':{min:0,max:200,def:0,u:'px',n:'Тень: размытие'},
  'style.r':{min:0,max:999,def:0,u:'px',n:'Радиус',ref:1},'style.rc.#':{min:0,max:999,def:0,u:'px',n:'Радиус угла',ref:1},
  'layout.gap':{min:0,max:200,def:0,u:'px',n:'Промежуток'},'layout.pad.#':{min:0,max:200,def:0,u:'px',n:'Отступ'},
  'layout.w':{min:1,max:4000,n:'Ширина'},'layout.h':{min:1,max:4000,n:'Высота'},
  'layout.minW':{min:0,max:4000,n:'Мин. ширина'},'layout.maxW':{min:1,max:4000,n:'Макс. ширина'},
  'layout.minH':{min:0,max:4000,n:'Мин. высота'},'layout.maxH':{min:1,max:4000,n:'Макс. высота'},
  'layout.x':{min:-4000,max:4000,def:0,n:'Положение X'},'layout.y':{min:-4000,max:4000,def:0,n:'Положение Y'}
};
N.specKey=function(path){return String(path).replace(/\.\d+$/,'.#');};
N.spec=function(path){return N.SPEC[N.specKey(path)]||null;};
var COLOR_KEYS={'style.bg':1,'style.bd.c':1,'style.ledge.c':1,'style.sh.c':1,'style.ic':1};
var REFC=/^@(g:)?[a-z][a-z0-9-]*$/;
function colorOk(v,grad){
  if(typeof v!=='string'||!v)return false;
  if(REFC.test(v))return grad||v.indexOf('@g:')!==0;
  return !!(ST.tok&&ST.tok.parse(v));}
/* '' если значение допустимо, иначе человеческое сообщение */
N.checkVal=function(path,v){
  var sm=/^states\.(pressed|disabled)\.(style\..+)$/.exec(path);if(sm)path=sm[2];
  var key=N.specKey(path),sp=N.SPEC[key],num=typeof v==='number'&&isFinite(v);
  if(key==='layout.w'||key==='layout.h'){
    if(v==='fill'||v==='hug')return '';
    if(!num)return 'Размер: «растянуть», «по содержимому» или число от 1 до 4000 px.';
    return v>=1&&v<=4000?'':'Размер от 1 до 4000 px.';}
  if(sp&&sp.ref&&(v==='var:r'||v==='var:rl'||v==='var:bw'||v==='var:ledge'))return '';
  if(sp){if(!num)return 'Здесь нужно число ('+sp.n.toLowerCase()+').';
    return v>=sp.min&&v<=sp.max?'':sp.n+': от '+sp.min+' до '+sp.max+(sp.u?' '+sp.u:'')+'.';}
  if(COLOR_KEYS[key])return colorOk(v,key==='style.bg')?'':'Цвет не распознан: токен («@card»), градиент или вид #rrggbb.';
  switch(key){
    case 'layout.dir':return v==='row'||v==='column'?'':'Направление: row или column.';
    case 'layout.ai':return ['start','center','end','stretch'].indexOf(v)>=0?'':'Выравнивание не распознано.';
    case 'layout.jc':return ['start','center','end','between'].indexOf(v)>=0?'':'Распределение не распознано.';
    case 'style.blend':return N.BLEND.indexOf(v)>=0?'':'Режим наложения не распознан.';
    case 'layout.float':case 'layout.wrap':case 'style.clip':case 'hidden':return typeof v==='boolean'?'':'Здесь нужно «да» или «нет».';
    case 'name':return typeof v==='string'&&v.trim()&&v.length<=80?'':'Имя: от 1 до 80 знаков.';
    case 'props.text':return typeof v==='string'&&v.length<=2000?'':'Текст не длиннее 2000 знаков.';
    case 'props.icon':return N.ICONS[v]?'':'Такой иконки нет в наборе.';
    case 'props.shape':return v==='rect'||v==='ellipse'?'':'Фигура: rect или ellipse.';
    case 'style.text':return ST.fonts&&isO(v)?ST.fonts.checkT(v):'Стиль текста повреждён.';
    case 'style.bd':case 'style.ledge':case 'style.sh':case 'style.rotO':case 'style.rc':case 'layout.pad':return '';
  }
  return 'Параметр «'+key+'» не поддерживается.';};

/* ---------- поиск ---------- */
function walk(n,fn,par,i,d){if(fn(n,par,i,d)===false)return false;
  var c=n.children||[];for(var k=0;k<c.length;k++)if(walk(c[k],fn,n,k,d+1)===false)return false;}
N.walk=function(root,fn){walk(root,fn,null,0,0);};
N.find=function(root,id){var r=null;if(!root)return r;
  walk(root,function(n,par,i,d){if(n.id===id){r={n:n,parent:par,i:i,depth:d};return false;}},null,0,0);return r;};
N.scrIn=function(d){var a=d.screens;for(var i=0;i<a.length;i++)if(a[i].id===ST.cur)return a[i];return a[0];};
N.root=function(){var s=ST.screen();return s?s.root:null;};
N.get=function(id){return N.find(N.root(),id);};
N.count=function(root){var c=0;walk(root,function(){c++;},null,0,0);return c;};
N.height=function(n){var m=0;(n.children||[]).forEach(function(c){m=Math.max(m,N.height(c));});return 1+m;};
N.inside=function(root,anc,id){var f=N.find(root,anc);return !!f&&!!N.find(f.n,id);}; /* id внутри anc (или сам anc) */
N.path=function(root,id){var out=[];(function rec(n){if(n.id===id){out.push(n);return true;}
  for(var i=0;i<(n.children||[]).length;i++)if(rec(n.children[i])){out.unshift(n);return true;}return false;})(root);
  return out.length&&out[out.length-1].id===id?out:[];};
/* выбор (состояние студии, не часть проекта): массив id на текущем экране */
ST.sel=[];
N.pruneSel=function(){var r=N.root(),a=r?ST.sel.filter(function(id){return !!N.find(r,id);}):[];
  if(a.length!==ST.sel.length){ST.sel=a;return true;}return false;};
N.selNodes=function(){var r=N.root();return ST.sel.map(function(id){var f=N.find(r,id);return f&&f.n;}).filter(Boolean);};
ST.on(function(k){if(k==='load'){ST.sel=[];N.vstate='normal';}});


/* ---------- проверки качества (Шаг 4, п. 6; STUDIO_PLAN P5 п. 9 и P6 п. 5): только предупреждения, ничего не запрещают ----------
   N.warns(root, measure?) → [{id,name,code,msg}]; measure(id) → {w,h} в px (DOM; модуль DOM не трогает), без неё берутся числовые layout.w/h.
   Кнопкой считается узел с «кнопк…/button/btn» в имени или с состоянием «нажато»; шторкой — рамка с «шторк…/sheet/модал…/dialog» в имени. */
N.MIN_TAP=44;N.MIN_TEXT=12;
var BTN=/кнопк|button|btn/i,SHEET=/шторк|sheet|модал|modal|dialog|диалог/i;
N.isButton=function(n){return n.type!=='text'&&(BTN.test(n.name||'')||!!(n.states&&n.states.pressed));};
N.isSheet=function(n){return n.type==='frame'&&SHEET.test(n.name||'');};
function layers(n){var S=n.style||{},r=[];
  if(typeof S.op==='number'&&S.op!==100)r.push('прозрачность');
  if(['br','ct','sa'].some(function(k){return typeof S[k]==='number'&&S[k]!==100;})||(typeof S.bl==='number'&&S.bl>0))r.push('фильтры');
  if(S.blend&&S.blend!=='normal')r.push('режим наложения');
  if(typeof S.rot==='number'&&S.rot)r.push('поворот');
  return r;}
N.warns=function(root,measure){
  var out=[],seen={};if(!root)return out;
  function add(n,code,msg){var k=n.id+'|'+code;if(seen[k])return;seen[k]=1;out.push({id:n.id,name:n.name,code:code,msg:msg});}
  (function rec(n,anc,top){
    if(n.hidden)return;var L=n.layout||{},S=n.style||{};
    if(!top&&N.isButton(n)){
      var z=measure?measure(n.id):null,w=z?z.w:(typeof L.w==='number'?L.w:null),h=z?z.h:(typeof L.h==='number'?L.h:null);
      if((w!==null&&w<N.MIN_TAP)||(h!==null&&h<N.MIN_TAP))add(n,'tap','Кнопка «'+n.name+'»: '+(w===null?'?':Math.round(w))+'×'+(h===null?'?':Math.round(h))+' px, для касания нужно не меньше '+N.MIN_TAP+'×'+N.MIN_TAP+'.');}
    if(n.type==='text'){var t=S.text;
      if(t&&typeof t.fs==='number'&&t.fs<N.MIN_TEXT)add(n,'text','Текст «'+n.name+'»: '+t.fs+' px, мельче '+N.MIN_TEXT+' px читается плохо.');}
    if(N.isSheet(n)){
      anc.concat([n]).forEach(function(x){var r=layers(x);if(!r.length)return;
        add(x,'sheet',x===n?'Шторка «'+n.name+'»: '+r.join(', ')+' создаёт новый слой наложения и может сломать порядок слоёв (z-index) шторок.'
          :'«'+x.name+'» содержит шторку «'+n.name+'»: '+r.join(', ')+' создаёт новый слой наложения и может сломать её порядок слоёв.');});}
    (n.children||[]).forEach(function(c){rec(c,anc.concat([n]),false);});})(root,[],true);
  return out;};

/* ---------- создание ---------- */
function autoName(root,type){var c=0,b=N.TYPE_NAME[type];walk(root,function(n,par,i,d){if(d>0&&n.type===type)c++;},null,0,0);return b+' '+(c+1);}
N.make=function(type,d,opts){
  var n={id:ST.uid('n'),type:type,name:N.TYPE_NAME[type],layout:{},style:{},props:{},children:[]};
  if(type==='frame'){n.layout={dir:'column',gap:8,pad:[8,8,8,8],w:'fill',h:'hug'};n.style={bg:'@card',r:'var:r'};}
  else if(type==='text'){var t=d&&d.text&&d.text.caption;n.props={text:'Текст'};n.style={text:t?JSON.parse(JSON.stringify(t)):{ff:'role:body',fw:700,fs:15,lh:1.3,ls:0,tt:'none',ta:'left',cl:0,c:'@tx',tnum:false}};}
  else if(type==='icon'){n.props={icon:'star'};n.layout={w:24,h:24};n.style={ic:'@tx'};}
  else if(type==='image'){n.props={src:''};n.layout={w:120,h:120};}
  else if(type==='shape'){n.props={shape:'rect'};n.layout={w:80,h:80};n.style={bg:'@ac',r:'var:r'};}
  if(opts&&opts.layout)Object.assign(n.layout,opts.layout);
  return n;};
function clone(n){var c=JSON.parse(JSON.stringify(n));(function re(x){x.id=ST.uid('n');(x.children||[]).forEach(re);})(c);return c;}
function norm(n){if(!isO(n.layout))n.layout={};if(!isO(n.style))n.style={};if(!isO(n.props))n.props={};
  if(!Array.isArray(n.children))n.children=[];if(typeof n.name!=='string')n.name=N.TYPE_NAME[n.type]||'Узел';n.children.forEach(norm);}
N.normalize=function(p){(p.screens||[]).forEach(function(s){if(s.root)norm(s.root);});(p.components||[]).forEach(function(c){var r=c&&(c.root||c);if(isO(r)&&r.type)norm(r);});return p;};
/* проверка дерева при открытии файла: '' или сообщение */
N.validate=function(p){var msg='',cnt=0;
  function rec(n,d,where){
    if(msg)return;
    if(!isO(n)){msg=where+': узел повреждён';return;}
    if(N.TYPES.indexOf(n.type)<0){msg=where+': неизвестный тип узла «'+String(n.type).slice(0,20)+'»';return;}
    if(typeof n.id!=='string'||!n.id){msg=where+': у узла нет id';return;}
    if(d>N.DEPTH_MAX){msg=where+': вложенность больше '+N.DEPTH_MAX+' уровней';return;}
    if(++cnt>N.COUNT_MAX){msg='слишком много узлов (больше '+N.COUNT_MAX+')';return;}
    ['layout','style','props'].forEach(function(k){if(n[k]!==undefined&&!isO(n[k]))msg=where+': повреждено поле '+k;});
    if(msg)return;
    if(n.children!==undefined&&!Array.isArray(n.children)){msg=where+': повреждён список вложенных узлов';return;}
    if(n.states!==undefined){
      if(!isO(n.states)){msg=where+': повреждены состояния узла';return;}
      Object.keys(n.states).forEach(function(k){var o=n.states[k];if(msg)return;
        if((k!=='pressed'&&k!=='disabled')||!isO(o)||Object.keys(o).some(function(x){return x!=='style';})||(o.style!==undefined&&!isO(o.style))){msg=where+': повреждены состояния узла';return;}
        Object.keys(o.style||{}).forEach(function(sk){if(msg)return;var e=N.checkVal('style.'+sk,o.style[sk]);if(e)msg=where+': состояние «'+k+'», '+e;});});
      if(msg)return;}
    (n.children||[]).forEach(function(c){rec(c,d+1,where);});}
  (p.screens||[]).forEach(function(s,i){if(isO(s.root))rec(s.root,0,'экран №'+(i+1));});
  return msg;};

/* ---------- запись значения по пути ---------- */
function setIn(n,path,val){
  var chain=[n],o=n,i,k;
  for(i=0;i<path.length-1;i++){k=path[i];
    if(o[k]===undefined||o[k]===null||typeof o[k]!=='object'){if(val===undefined)return;o[k]=/^\d+$/.test(path[i+1])?[0,0,0,0]:{};}
    o=o[k];chain.push(o);}
  k=path[path.length-1];
  if(val===undefined){if(Array.isArray(o))return;delete o[k];}else o[k]=val&&typeof val==='object'?JSON.parse(JSON.stringify(val)):val; /* объект копируется: проект не должен делить его с вызывающим */
  for(i=chain.length-1;i>=(path[0]==='states'?1:2);i--){ /* пустые вложенные объекты убираем, чтобы стиль оставался чистым (сами style/layout/props остаются) */
    if(isO(chain[i])&&!Object.keys(chain[i]).length)delete chain[i-1][path[i-1]];else break;}}
function pathOf(p){return Array.isArray(p)?p:String(p).split('.');}
/* patchEach([{id,pairs:[[путь,значение|undefined],…]},…], метка): одна запись в истории; undefined = сбросить параметр */
N.patchEach=function(items,label){
  var i,j,e,failed=false;
  if(N.vstate!=='normal'){ /* показано состояние: вид (style.*) пишется в него, размер, раскладка и содержимое общие */
    for(i=0;i<items.length;i++)for(j=0;j<items[i].pairs.length;j++)if(/^(layout|props)\./.test(pathOf(items[i].pairs[j][0]).join('.')))
      return {error:'Размер, раскладка и содержимое общие для всех состояний. Переключите холст на «Обычное».'};
    items=items.map(function(it){return {id:it.id,pairs:it.pairs.map(function(pr){var q=pathOf(pr[0]).join('.');return [N.sp(q),pr[1]];})};});}
  for(i=0;i<items.length;i++)for(j=0;j<items[i].pairs.length;j++){var v=items[i].pairs[j][1];
    if(v!==undefined){e=N.checkVal(pathOf(items[i].pairs[j][0]).join('.'),v);if(e)return {error:e};}}
  var ok=ST.do(label||'параметр узла',function(d){var s=N.scrIn(d),hit=0;
    items.forEach(function(it){var f=N.find(s.root,it.id);if(!f)return;hit++;it.pairs.forEach(function(pr){setIn(f.n,pathOf(pr[0]),pr[1]);});});
    if(!hit){failed=true;throw new Error('узел не найден (возможно, он уже удалён)');}});
  return failed?{error:'Узел не найден.'}:{ok:true,changed:ok};};
N.patch=function(ids,pairs,label){
  var sp=N.spec(pathOf(pairs[0][0]).join('.'));
  return N.patchEach(ids.map(function(id){return {id:id,pairs:pairs};}),label||(sp?sp.n:'параметр узла'));};
N.select=function(ids){ST.sel=ids.slice();ST.emit('sel');};
N.set=function(ids,path,val,label){return N.patch(ids,[[path,val]],label);};
N.reset=function(ids,paths,label){return N.patch(ids,paths.map(function(p){return [p,undefined];}),label||'сброс параметра');};
N.val=function(n,path){var o=n,p=pathOf(path);for(var i=0;i<p.length;i++){if(o===undefined||o===null)return undefined;o=o[p[i]];}return o;};
N.rename=function(id,v){v=String(v==null?'':v).trim();return N.set([id],'name',v||'Без названия','имя узла');};

/* ---------- структура ---------- */
function res(ok,err){return ok?{ok:true}:{error:err||'Изменение не выполнено.'};}
function sorted(root,ids){ /* без корня и без потомков тех, кто уже в списке; в порядке дерева */
  var set={};ids.forEach(function(i){set[i]=1;});var out=[];
  walk(root,function(n,par,i,d){if(d>0&&set[n.id]){out.push(n.id);return;}},null,0,0);
  return out.filter(function(id){var pt=N.path(root,id);for(var k=0;k<pt.length-1;k++)if(set[pt[k].id])return false;return true;});}
N.add=function(type,parentId){
  if(N.TYPES.indexOf(type)<0)return {error:'Неизвестный тип узла.'};
  var id=ST.uid('n'),prev=ST.sel,err='';
  ST.sel=[id];
  var ok=ST.do('добавить: '+N.TYPE_NAME[type].toLowerCase(),function(d){var s=N.scrIn(d),f=N.find(s.root,parentId||s.root.id);
    if(!f||f.n.type!=='frame'){err='Добавлять можно только внутрь рамки.';throw new Error(err);}
    if(f.depth+1>N.DEPTH_MAX){err='Вложенность больше '+N.DEPTH_MAX+' уровней.';throw new Error(err);}
    var n=N.make(type,d);n.id=id;n.name=autoName(s.root,type);f.n.children.push(n);});
  if(!ok){ST.sel=prev;return {error:err||'Не добавилось.'};}
  return {ok:true,id:id};};
N.dup=function(ids){
  var root=N.root(),list=sorted(root,ids),made=[];
  if(!list.length)return {error:'Корневую рамку экрана копировать нельзя.'};
  var prev=ST.sel;
  var ok=ST.do('дублировать',function(d){var s=N.scrIn(d);
    list.forEach(function(id){var f=N.find(s.root,id);if(!f)return;var c=clone(f.n);c.name=f.n.name+' копия';
      if(c.layout.float){c.layout.x=(c.layout.x||0)+8;c.layout.y=(c.layout.y||0)+8;}
      f.parent.children.splice(f.i+1,0,c);made.push(c.id);});
    if(N.count(s.root)>N.COUNT_MAX)throw new Error('слишком много узлов');});
  if(ok){ST.sel=made;ST.emit('change');}else ST.sel=prev;
  return res(ok);};
N.remove=function(ids){
  var root=N.root(),list=sorted(root,ids);if(!list.length)return {error:'Корневую рамку экрана удалить нельзя.'};
  var f0=N.find(root,list[0]),par=f0&&f0.parent?f0.parent.id:'',prev=ST.sel;
  ST.sel=par?[par]:[];
  var ok=ST.do(list.length>1?'удалить узлы':'удалить узел',function(d){var s=N.scrIn(d);
    list.forEach(function(id){var f=N.find(s.root,id);if(f&&f.parent)f.parent.children.splice(f.i,1);});});
  if(!ok)ST.sel=prev;return res(ok);};
N.group=function(ids){
  var root=N.root(),list=sorted(root,ids);
  if(!list.length)return {error:'Выберите узлы для группировки (корневую рамку группировать нельзя).'};
  var fs=list.map(function(id){return N.find(root,id);}),par=fs[0].parent;
  for(var i=0;i<fs.length;i++){
    if(fs[i].parent!==par)return {error:'Выбранные узлы лежат в разных рамках. Группировать можно только соседей.'};
    if(fs[i].n.layout&&fs[i].n.layout.float)return {error:'Узел «'+fs[i].n.name+'» «на плаву». Сначала выключите «На плаву», потом группируйте.'};}
  var gid=ST.uid('n'),prev=ST.sel,pdir=(par.layout&&par.layout.dir)==='row'?'row':'column',gap=par.layout&&par.layout.gap||0;
  ST.sel=[gid];
  var ok=ST.do('сгруппировать',function(d){var s=N.scrIn(d),pf=N.find(s.root,par.id),kids=[],at=1e9;
    list.forEach(function(id){var f=N.find(s.root,id);at=Math.min(at,f.i);kids.push(f.n);});
    kids.forEach(function(k){pf.n.children.splice(pf.n.children.indexOf(k),1);});
    var g=N.make('frame',d);g.id=gid;g.name='Группа';g.layout={dir:pdir,gap:gap,w:pdir==='column'?'fill':'hug',h:'hug'};g.style={};g.children=kids;
    pf.n.children.splice(Math.min(at,pf.n.children.length),0,g);});
  if(!ok)ST.sel=prev;return res(ok);};
N.ungroup=function(id){
  var f=N.get(id);if(!f||!f.parent)return {error:'Эту рамку разгруппировать нельзя.'};
  if(f.n.type!=='frame'||!f.n.children.length)return {error:'Разгруппировать можно рамку с вложенными узлами.'};
  var ids=f.n.children.map(function(c){return c.id;}),prev=ST.sel;ST.sel=ids;
  var ok=ST.do('разгруппировать',function(d){var s=N.scrIn(d),g=N.find(s.root,id);
    Array.prototype.splice.apply(g.parent.children,[g.i,1].concat(g.n.children));});
  if(!ok)ST.sel=prev;return res(ok);};
/* перенос: в рамку parentId на позицию index (индекс считается ДО изъятия узла) */
N.move=function(id,parentId,index){
  var root=N.root(),f=N.find(root,id),t=N.find(root,parentId);
  if(!f||!f.parent)return {error:'Корневую рамку переносить нельзя.'};
  if(!t||t.n.type!=='frame')return {error:'Переносить можно только внутрь рамки.'};
  if(N.find(f.n,parentId))return {error:'Нельзя перенести рамку внутрь самой себя.'};
  if(t.depth+N.height(f.n)>N.DEPTH_MAX)return {error:'Вложенность больше '+N.DEPTH_MAX+' уровней.'};
  return res(ST.do('переместить',function(d){var s=N.scrIn(d),a=N.find(s.root,id),b=N.find(s.root,parentId),i=Math.max(0,Math.min(index,b.n.children.length));
    if(a.parent===b.n&&a.i<i)i--;
    a.parent.children.splice(a.i,1);b.n.children.splice(Math.max(0,Math.min(i,b.n.children.length)),0,a.n);}));};
N.reorder=function(id,delta){var f=N.get(id);if(!f||!f.parent)return {error:'Корневую рамку двигать нельзя.'};
  var to=f.i+delta;if(to<0||to>=f.parent.children.length)return {ok:true};
  return res(ST.do('порядок слоёв',function(d){var s=N.scrIn(d),a=N.find(s.root,id),c=a.parent.children,x=c.splice(a.i,1)[0];c.splice(a.i+delta,0,x);}));};
})();
