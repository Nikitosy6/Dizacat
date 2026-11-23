/* Catworking Studio: профили оформления (данные, проверки, команды). Без DOM. Объект ST.prof (STUDIO_PLAN P3А, Шаг 1А).
   Профиль: {id, name, scope('app'|'module'|'skin'), base, locked, note, tokens:{light,dark,info,grad}, fonts:{роль:гарнитура},
   stacks:{роль:CSS-стек из контракта, справочно для экспорта}, text:{ключ:стиль}, shape:{r,rl,bw,ledge,shadow}, icons}.
   tokens хранится в прежнем виде (light/dark/info/grad), чтобы токены, шрифты и узлы работали без переписывания.
   Профиль берётся у АКТИВНОГО экрана (ST.cur): ST.p.tokens / ST.p.fonts / ST.p.text читают и пишут именно его
   (невидимые для JSON свойства-посредники, ST.prof.adopt; их уберёт Шаг 1А-2, когда панели начнут спрашивать профиль сами). */
(function(){'use strict';
var ST=window.ST=window.ST||{},P=ST.prof={};
function isO(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function clone(o){return JSON.parse(JSON.stringify(o));}
function res(ok,err){return ok?{ok:true}:{error:err||'Изменение не выполнено.'};}

P.SCOPES=['app','module','skin'];
P.SCOPE_NAME={app:'общий дизайн приложения',module:'стиль модуля',skin:'скин приложения'};
P.WORK_ID='project-main';             /* рабочий профиль проекта: правится, остальные встроенные только для чтения */
P.WORK_NAME='Макеты Nunito (проект)';
P.WORK_BASE='mockups-nunito';
P.ID_RE=/^[a-z][a-z0-9-]{0,39}$/;
P.SHAPE_KEYS=['r','rl','bw','ledge','shadow'];
P.SHAPE_DEF={r:'14px',rl:'22px',bw:'1.5px',ledge:'3px',shadow:'0 3px 0 rgba(59,38,22,.22)'};
var SHAPE_RE=/^[0-9A-Za-z .,()%+\-\/#]{1,80}$/; /* значение идёт в style-атрибут: только числа, единицы, цвета и слова */

/* ---------- чтение ---------- */
P.list=function(p){return p&&Array.isArray(p.profiles)?p.profiles:[];};
P.get=function(p,id){var a=P.list(p);for(var i=0;i<a.length;i++)if(a[i]&&a[i].id===id)return a[i];return null;};
P.builtin=function(id){var a=ST.profData||[];for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null;};
function screenOf(p){var a=(p&&p.screens)||[];for(var i=0;i<a.length;i++)if(a[i]&&a[i].id===ST.cur)return a[i];return a[0]||null;}
/* профиль активного экрана (запасной вариант: первый профиль проекта) */
P.cur=function(p){var s=screenOf(p);return (s&&P.get(p,s.profile))||P.list(p)[0]||null;};
P.shape=function(p){var c=P.cur(p),o={};P.SHAPE_KEYS.forEach(function(k){o[k]=(c&&c.shape&&typeof c.shape[k]==='string')?c.shape[k]:P.SHAPE_DEF[k];});return o;};
/* кто ссылается на профиль: [{kind:'screen'|'component', name}] */
P.usage=function(p,id){var u=[];
  (p.screens||[]).forEach(function(s){if(s&&s.profile===id)u.push({kind:'screen',name:s.name||'экран'});});
  (p.components||[]).forEach(function(c){if(isO(c)&&c.profile===id)u.push({kind:'component',name:c.name||'компонент'});});
  return u;};

/* ---------- посредники ST.p.tokens / fonts / text ----------
   Не перечисляются, поэтому в JSON проекта их нет; читают и пишут поля профиля активного экрана. */
P.adopt=function(p){
  if(!isO(p)||!Array.isArray(p.profiles))return p;
  ['tokens','fonts','text'].forEach(function(k){
    Object.defineProperty(p,k,{configurable:true,enumerable:false,
      get:function(){var c=P.cur(p);return c?c[k]:undefined;},
      set:function(v){var c=P.cur(p);if(c)c[k]=v;}});});
  return p;};

/* ---------- сборка профилей ---------- */
P.fromData=function(b){
  var pr={id:b.id,name:b.name,scope:b.scope,base:b.base||null,locked:!!b.locked,note:b.note||'',
    tokens:clone(b.tokens),fonts:clone(b.fonts),stacks:clone(b.stacks||{}),text:{},shape:clone(b.shape),icons:b.icons};
  if(ST.fonts)ST.fonts.PRESETS.forEach(function(x){pr.text[x.k]=clone(x.t);});
  return pr;};
function work(){ /* рабочая копия «Макеты Nunito»: единственный профиль, который правится сразу */
  var b=P.builtin(P.WORK_BASE);if(!b)throw new Error('нет данных встроенных профилей (st-profdata.js)');
  var w=P.fromData(b);w.id=P.WORK_ID;w.name=P.WORK_NAME;w.base=P.WORK_BASE;w.locked=false;w.note='Рабочая копия профиля «Макеты Nunito»: правится, остальные встроенные только для чтения.';
  return w;}
function setAll(d,id){(d.screens||[]).forEach(function(s){if(isO(s))s.profile=id;});(d.components||[]).forEach(function(c){if(isO(c))c.profile=id;});}
/* новый проект: рабочая копия + пять встроенных */
P.seed=function(d){
  d.profiles=[work()].concat((ST.profData||[]).map(P.fromData));
  setAll(d,P.WORK_ID);return d;};

/* ---------- имена токенов одинаковы во всех профилях ---------- */
function nameSet(t){var o={};Object.keys(t.light||{}).concat(Object.keys(t.dark||{})).forEach(function(n){o[n]=1;});return o;}
/* привести набор имён (цвета и градиенты) профиля q к набору мастера m; недостающее копируется из m */
function syncTo(m,q){
  var mn=nameSet(m),qn=nameSet(q.tokens),T=q.tokens;
  Object.keys(qn).forEach(function(n){if(!mn[n]){delete T.light[n];delete T.dark[n];if(T.info)delete T.info[n];}});
  Object.keys(mn).forEach(function(n){if(!qn[n]){T.light[n]=m.light[n];T.dark[n]=m.dark[n];T.info=T.info||{};if(m.info&&m.info[n])T.info[n]=clone(m.info[n]);}});
  T.grad=isO(T.grad)?T.grad:{};var mg=isO(m.grad)?m.grad:{};
  Object.keys(T.grad).forEach(function(k){if(!mg[k])delete T.grad[k];});
  Object.keys(mg).forEach(function(k){if(!T.grad[k])T.grad[k]=clone(mg[k]);});}

/* ---------- миграция 5 → 6: прежние tokens / fonts / text переезжают в рабочий профиль ---------- */
P.migrate=function(p){
  var w=work(),T=p.tokens;
  if(isO(T)&&isO(T.light)&&isO(T.dark)){
    w.tokens={light:T.light,dark:T.dark,info:isO(T.info)?T.info:{},grad:isO(T.grad)?T.grad:{}};}
  if(isO(p.fonts)&&ST.fonts)ST.fonts.ROLES.forEach(function(r){if(typeof p.fonts[r]==='string')w.fonts[r]=p.fonts[r];});
  if(isO(p.text))Object.keys(p.text).forEach(function(k){if(isO(p.text[k]))w.text[k]=p.text[k];});
  var rest=(ST.profData||[]).map(P.fromData);
  rest.forEach(function(q){syncTo(w.tokens,q);});
  p.profiles=[w].concat(rest);
  delete p.tokens;delete p.fonts;delete p.text;
  setAll(p,P.WORK_ID);
  return P.adopt(p);};

/* ---------- проверка (STUDIO_RULES §3: повреждённое не затирается, ST.validate возвращает текст ошибки) ---------- */
function themeErr(lbl,T){
  var names=Object.keys(nameSet(T)),i,n;
  for(i=0;i<names.length;i++){n=names[i];
    if(ST.tok&&!ST.tok.NAME_RE.test(n))return lbl+': имя токена «'+n+'» не годится (латиница, цифры, дефис)';
    /* пустое значение в одной из тем не мешает открыть проект (как с Шага 2): токены показывают красную метку «missing», а на холст такой цвет не попадает */
    var bv=['light','dark'].filter(function(th){var v=T[th][n];return v!==undefined&&v!==null&&typeof v!=='string';});
    if(bv.length)return lbl+': значение токена «'+n+'» ('+(bv[0]==='light'?'светлая':'тёмная')+' тема) должно быть текстом';
    if(T.info&&T.info[n]!==undefined&&!isO(T.info[n]))return lbl+': описание токена «'+n+'» повреждено';}
  var g=T.grad||{},ks=Object.keys(g);
  for(i=0;i<ks.length;i++){var gr=g[ks[i]];
    if(ST.tok&&!ST.tok.NAME_RE.test(ks[i]))return lbl+': имя градиента «'+ks[i]+'» не годится';
    if(!isO(gr)||!Array.isArray(gr.stops)||gr.stops.length<2||gr.stops.length>3||!isFinite(gr.angle))return lbl+': градиент «'+ks[i]+'» повреждён';}
  return '';}
P.validate=function(p){
  var a=p.profiles;
  if(!Array.isArray(a)||!a.length)return 'нет раздела profiles (профили оформления)';
  var ids={},nm={},first=null,i,k;
  for(i=0;i<a.length;i++){var pr=a[i],no='профиль №'+(i+1);
    if(!isO(pr))return no+' повреждён';
    if(typeof pr.id!=='string'||!P.ID_RE.test(pr.id))return no+': неверный id';
    if(ids[pr.id])return 'два профиля с одним id «'+pr.id+'»';ids[pr.id]=1;
    var name=typeof pr.name==='string'?pr.name.trim():'';
    if(!name||name.length>60)return no+': у профиля нет названия (до 60 знаков)';
    if(nm[name.toLowerCase()])return 'в проекте два профиля с названием «'+name+'»';nm[name.toLowerCase()]=1;
    var lbl='профиль «'+name+'»';
    if(P.SCOPES.indexOf(pr.scope)<0)return lbl+': неизвестная область (scope)';
    if(pr.base!==null&&pr.base!==undefined&&typeof pr.base!=='string')return lbl+': неверное поле base';
    if(typeof pr.locked!=='boolean')return lbl+': нет признака locked';
    if(!isO(pr.tokens)||!isO(pr.tokens.light)||!isO(pr.tokens.dark))return lbl+': нет токенов (light и dark)';
    if((pr.tokens.info!==undefined&&!isO(pr.tokens.info))||(pr.tokens.grad!==undefined&&!isO(pr.tokens.grad)))return lbl+': повреждены tokens.info или tokens.grad';
    var e=themeErr(lbl,pr.tokens);if(e)return e;
    if(first){var A=nameSet(first.tokens),B=nameSet(pr.tokens);
      for(k in A)if(!B[k])return lbl+': нет токена «'+k+'», который есть в профиле «'+first.name+'» (набор имён должен быть одинаковым)';
      for(k in B)if(!A[k])return lbl+': лишний токен «'+k+'» (его нет в профиле «'+first.name+'»)';
      var GA=Object.keys(first.tokens.grad||{}).sort().join(),GB=Object.keys(pr.tokens.grad||{}).sort().join();
      if(GA!==GB)return lbl+': набор градиентов отличается от профиля «'+first.name+'»';}
    else first=pr;
    if(!isO(pr.fonts)||!isO(pr.text))return lbl+': нет разделов fonts и text';
    if(ST.fonts){ST.fonts.ROLES.forEach(function(r){if(!e&&typeof pr.fonts[r]!=='string')e=lbl+': нет гарнитуры роли «'+r+'»';});
      if(e)return e;var fe=ST.fonts.validate({fonts:pr.fonts,text:pr.text});if(fe)return lbl+': '+fe;}
    if(pr.stacks!==undefined&&!isO(pr.stacks))return lbl+': повреждено поле stacks';
    if(!isO(pr.shape))return lbl+': нет формы (shape)';
    for(k=0;k<P.SHAPE_KEYS.length;k++){var v=pr.shape[P.SHAPE_KEYS[k]];if(typeof v!=='string'||!SHAPE_RE.test(v))return lbl+': значение формы «'+P.SHAPE_KEYS[k]+'» не годится';}
    if(typeof pr.icons!=='string'||pr.icons.length>40)return lbl+': не задан набор иконок';}
  for(i=0;i<a.length;i++)if(a[i].base&&!ids[a[i].base])return 'профиль «'+a[i].name+'» основан на профиле, которого нет в проекте';
  for(i=0;i<(p.screens||[]).length;i++)if(!ids[p.screens[i].profile])return 'экран №'+(i+1)+' ссылается на несуществующий профиль';
  for(i=0;i<(p.components||[]).length;i++)if(isO(p.components[i])&&!ids[p.components[i].profile])return 'компонент №'+(i+1)+' ссылается на несуществующий профиль';
  return '';};

/* ---------- команды (всё через ST.do: отмена и возврат работают) ---------- */
P.checkName=function(p,name,exceptId){
  name=String(name==null?'':name).trim();
  if(!name)return 'Название профиля не может быть пустым.';
  if(name.length>60)return 'Название профиля: до 60 знаков.';
  var a=P.list(p);for(var i=0;i<a.length;i++)if(a[i].id!==exceptId&&a[i].name.trim().toLowerCase()===name.toLowerCase())return 'Профиль «'+name+'» уже есть. Выберите другое название.';
  return '';};
/* вернёт {error}, если активный профиль встроенный: значения токенов, шрифтов и формы в нём не правятся */
P.guard=function(){var c=ST.p&&P.cur(ST.p);
  return c&&c.locked?{error:'Профиль «'+c.name+'» встроенный: его значения не правятся. Нажмите «Профиль» → «Дублировать» и работайте с копией.'}:null;};
P.create=function(srcId,name,screenId){ /* «Дублировать»; screenId: сразу назначить копию этому экрану (одним шагом истории) */
  name=String(name==null?'':name).trim();var p=ST.p,e=P.checkName(p,name);if(e)return {error:e};
  if(!P.get(p,srcId))return {error:'Профиля, который нужно дублировать, нет в проекте.'};
  var id=ST.uid('p');
  var ok=ST.do('новый профиль «'+name+'»',function(x){var s=P.get(x,srcId),c=clone(s);
    c.id=id;c.name=name;c.base=s.id;c.locked=false;c.note='';if(c.scope==='app')c.scope='module'; /* «Catworking сейчас» не правится: копия становится стилем модуля */
    x.profiles.push(c);
    if(screenId)x.screens.forEach(function(q){if(q.id===screenId)q.profile=id;});});
  return ok?{ok:true,id:id}:{error:'Профиль не создан.'};};
P.rename=function(id,name){
  name=String(name==null?'':name).trim();var p=ST.p,pr=P.get(p,id);if(!pr)return {error:'Профиля нет в проекте.'};
  if(pr.locked)return {error:'Профиль «'+pr.name+'» встроенный: его название не меняется. Дублируйте его и переименуйте копию.'};
  var e=P.checkName(p,name,id);if(e)return {error:e};if(pr.name===name)return {ok:true};
  return res(ST.do('название профиля «'+name+'»',function(x){P.get(x,id).name=name;}));};
P.remove=function(id){
  var p=ST.p,pr=P.get(p,id);if(!pr)return {error:'Профиля нет в проекте.'};
  if(pr.locked)return {error:'Профиль «'+pr.name+'» встроенный: удалить его нельзя.'};
  var u=P.usage(p,id);
  if(u.length)return {error:'Профиль «'+pr.name+'» используется: '+u.slice(0,4).map(function(x){return x.name;}).join(', ')+(u.length>4?' и ещё '+(u.length-4):'')+'. Сначала назначьте им другой профиль.',used:u};
  return res(ST.do('удаление профиля «'+pr.name+'»',function(x){
    x.profiles=x.profiles.filter(function(q){return q.id!==id;});
    x.profiles.forEach(function(q){if(q.base===id)q.base=null;});}));};
/* назначить профиль экрану: меняются только подставляемые значения, дерево узлов не трогается */
P.assign=function(screenId,profileId){
  var p=ST.p,s=null;(p.screens||[]).forEach(function(q){if(q.id===screenId)s=q;});
  if(!s)return {error:'Экрана нет в проекте.'};
  var pr=P.get(p,profileId);if(!pr)return {error:'Такого профиля нет в проекте.'};
  if(s.profile===profileId)return {ok:true};
  return res(ST.do('профиль экрана «'+(s.name||'экран')+'»: '+pr.name,function(x){x.screens.forEach(function(q){if(q.id===screenId)q.profile=profileId;});}));};
P.assignComponent=function(compId,profileId){
  var p=ST.p,c=null;(p.components||[]).forEach(function(q){if(isO(q)&&q.id===compId)c=q;});
  if(!c)return {error:'Компонента нет в проекте.'};
  var pr=P.get(p,profileId);if(!pr)return {error:'Такого профиля нет в проекте.'};
  if(c.profile===profileId)return {ok:true};
  return res(ST.do('профиль компонента «'+(c.name||'компонент')+'»: '+pr.name,function(x){x.components.forEach(function(q){if(isO(q)&&q.id===compId)q.profile=profileId;});}));};
P.setCurrent=function(profileId){var s=ST.screen();return s?P.assign(s.id,profileId):{error:'Нет экрана.'};};

/* ---------- форма профиля на холсте: заменяет N.shapeVars из st-nstyle.js (константы), пока Шаг 1А-2 не перенесёт это туда ---------- */
if(ST.nodes){ST.nodes.shapeVars=function(){var o=P.shape(ST.p);
  return '--r:'+o.r+';--rl:'+o.rl+';--bw:'+o.bw+';--ledge:'+o.ledge+';--sh:'+o.shadow+';';};}
})();
