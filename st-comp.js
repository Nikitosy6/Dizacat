/* Catworking Studio: мастер-компоненты и экземпляры (данные, команды, проверки, показ). Без DOM. Объект ST.comp (STUDIO_PLAN P3, Шаг 5).
   Мастер (project.components[]): {id, name, profile, w, h, root, variants:[{k,name,ov}], preset?, shell?}. root — рамка (frame); w и h — размер рамки при правке мастера.
   Экземпляр — узел {type:'instance', ref:{c:id мастера, v?:ключ варианта, ov:{id узла мастера:{text?,icon?,hidden?,col?}}}, layout, style, props:{}, children:[]}.
   Из экземпляра свои только размер и положение (layout.w/h/min/max/float/x/y) и стиль корня (style); всё остальное берётся из мастера.
   Переопределить в экземпляре можно только текст, иконку, показ и цвет-токен (col: текст → цвет текста, иконка → цвет иконки, остальное → фон).
   Правка мастера: ST.cur = id мастера, и холст, слои и инспектор работают с его деревом как с экраном. Внутри мастера экземпляров нет (без вложенности). */
(function(){'use strict';
var ST=window.ST=window.ST||{},N=ST.nodes,C=ST.comp={};
function isO(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function clone(o){return JSON.parse(JSON.stringify(o));}
function res(ok,err){return ok?{ok:true}:{error:err||'Изменение не выполнено.'};}
var REFC=/^@[a-z][a-z0-9-]*$/,KEY_RE=/^[a-z][a-z0-9-]{0,29}$/;
N.TYPE_NAME.instance='Экземпляр';N.TYPE_MARK.instance='◆';
C.OV_KEYS=['text','icon','hidden','col'];C.VARIANTS_MAX=20;

/* ---------- чтение ---------- */
C.list=function(p){return p&&Array.isArray(p.components)?p.components.filter(isO):[];};
C.get=function(p,id){var a=C.list(p);for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null;};
C.active=function(p){p=p||ST.p;return p?C.get(p,ST.cur):null;}; /* мастер, который правится сейчас (или null) */
/* экземпляры мастера: [{screen, id, name}] по всем экранам */
C.uses=function(p,cid){var out=[];
  (p.screens||[]).forEach(function(s){if(isO(s.root))N.walk(s.root,function(n){if(n.type==='instance'&&n.ref&&n.ref.c===cid)out.push({screen:s.name,id:n.id,name:n.name});});});
  return out;};
function eachInst(p,fn){(p.screens||[]).forEach(function(s){if(isO(s.root))N.walk(s.root,function(n,par,i){if(n.type==='instance')fn(n,par,i,s);});});}
function fresh(n,map){var c=clone(n);(function re(x){var o=x.id;x.id=ST.uid('n');if(map)map[o]=x.id;(x.children||[]).forEach(re);})(c);return c;}

/* ---------- значения переопределений ---------- */
C.checkOv=function(ov){
  if(ov===undefined)return '';if(!isO(ov))return 'переопределения повреждены';
  var ks=Object.keys(ov),i,j,o,m;
  for(i=0;i<ks.length;i++){o=ov[ks[i]];if(!isO(o))return 'переопределения повреждены';
    m=Object.keys(o);
    for(j=0;j<m.length;j++){var k=m[j],v=o[k];
      if(C.OV_KEYS.indexOf(k)<0)return 'неизвестное переопределение «'+k+'» (можно только text, icon, hidden, col)';
      if(k==='text'&&(typeof v!=='string'||v.length>2000))return 'текст в переопределении: строка до 2000 знаков';
      if(k==='icon'&&(typeof v!=='string'||!N.ICONS[v]))return 'такой иконки нет в наборе';
      if(k==='hidden'&&typeof v!=='boolean')return 'показ узла: «да» или «нет»';
      if(k==='col'&&(typeof v!=='string'||!REFC.test(v)))return 'цвет в переопределении: только токен, например «@ac»';}}
  return '';};
C.validate=function(p){
  var cs=p.components||[],ids={},i,j;
  for(i=0;i<cs.length;i++){var c=cs[i],no='мастер №'+(i+1);
    if(!isO(c))return no+' повреждён';
    if(typeof c.id!=='string'||!c.id)return no+': нет id';
    if(ids[c.id])return 'два мастера с одним id';ids[c.id]=1;
    if(typeof c.name!=='string'||!c.name.trim()||c.name.length>80)return no+': у мастера нет названия (до 80 знаков)';
    if(typeof c.w!=='number'||typeof c.h!=='number'||!(c.w>=1&&c.w<=4000&&c.h>=1&&c.h<=4000))return 'мастер «'+c.name+'»: размер рамки от 1 до 4000 px';
    if(!isO(c.root)||c.root.type!=='frame')return 'мастер «'+c.name+'»: корень должен быть рамкой';
    var bad='';N.walk(c.root,function(n){if(n.type==='instance')bad=n.name||'экземпляр';});
    if(bad)return 'мастер «'+c.name+'»: внутри мастера не может быть экземпляров («'+bad+'»)';
    if(c.variants!==undefined&&!Array.isArray(c.variants))return 'мастер «'+c.name+'»: повреждены варианты';
    var ks={};
    for(j=0;j<(c.variants||[]).length;j++){var v=c.variants[j];
      if(!isO(v)||typeof v.k!=='string'||!KEY_RE.test(v.k)||typeof v.name!=='string'||!v.name.trim()||v.name.length>40)return 'мастер «'+c.name+'»: вариант №'+(j+1)+' повреждён';
      if(ks[v.k])return 'мастер «'+c.name+'»: два варианта с ключом «'+v.k+'»';ks[v.k]=1;
      var e=C.checkOv(v.ov);if(e)return 'мастер «'+c.name+'», вариант «'+v.name+'»: '+e;}
    if((c.variants||[]).length>C.VARIANTS_MAX)return 'мастер «'+c.name+'»: вариантов больше '+C.VARIANTS_MAX;}
  var msg='';
  eachInst(p,function(n,par,i,s){if(msg)return;var r=n.ref,where='экран «'+s.name+'», экземпляр «'+n.name+'»';
    if(!isO(r)||typeof r.c!=='string'){msg=where+': нет ссылки на мастер';return;}
    var c=C.get(p,r.c);if(!c){msg=where+': мастера нет в проекте';return;}
    if(r.v!==undefined&&!(c.variants||[]).some(function(x){return x.k===r.v;})){msg=where+': такого варианта нет у мастера «'+c.name+'»';return;}
    var e=C.checkOv(r.ov);if(e)msg=where+': '+e;});
  return msg;};

/* ---------- как экземпляр выглядит: мастер + вариант + переопределения → рамка (виртуально, в проект не пишется) ---------- */
C.applyOv=function(root,ov){
  Object.keys(ov||{}).forEach(function(mid){var f=N.find(root,mid);if(!f)return;var n=f.n,o=ov[mid];
    if(o.text!==undefined&&n.type==='text'){n.props=n.props||{};n.props.text=o.text;}
    if(o.icon!==undefined&&n.type==='icon'){n.props=n.props||{};n.props.icon=o.icon;}
    if(o.hidden!==undefined){if(o.hidden)n.hidden=true;else delete n.hidden;}
    if(o.col!==undefined){n.style=n.style||{};
      if(n.type==='text')n.style.text=Object.assign({},n.style.text||{},{c:o.col});else if(n.type==='icon')n.style.ic=o.col;else n.style.bg=o.col;}});};
C.resolve=function(inst,p){
  p=p||ST.p;var r=inst&&inst.ref,c=r&&C.get(p,r.c);if(!c)return null;
  var v=clone(c.root),k=(c.variants||[]).filter(function(x){return x.k===r.v;})[0];
  if(k)C.applyOv(v,k.ov);C.applyOv(v,r.ov);
  var L=inst.layout||{},ML=v.layout||{},nl={};
  ['dir','gap','pad','ai','jc','wrap'].forEach(function(key){if(ML[key]!==undefined)nl[key]=ML[key];});
  ['w','h','minW','maxW','minH','maxH','float','x','y'].forEach(function(key){if(L[key]!==undefined)nl[key]=L[key];});
  v.layout=nl;v.style=Object.assign({},v.style||{},inst.style||{});
  if(inst.states)v.states=Object.assign({},v.states||{},inst.states);
  v.id=inst.id;v.name=inst.name;v.type='frame';delete v.hidden;delete v.ovr;
  (function re(x,top){if(!top)x.id='i:'+inst.id+':'+x.id;delete x.ovr;(x.children||[]).forEach(function(q){re(q,false);});})(v,true);
  return v;};
/* id узла внутри показанного экземпляра */
C.vid=function(inst,mid){return 'i:'+inst.id+':'+mid;};

/* показ: N.html и N.css понимают экземпляр. Внутренние узлы получают data-ov вместо data-nid, поэтому выбрать на холсте можно только сам экземпляр. */
var baseHtml=N.html,baseCss=N.css;
N.html=function(n,p,ctx){
  if(!n||n.type!=='instance')return baseHtml(n,p,ctx);
  if(n.hidden)return '';
  var v=C.resolve(n,p||ST.p);
  if(!v)return '<div class="st-n st-e" data-nid="'+ST.esc(n.id)+'" data-type="instance" data-pd="'+((ctx&&ctx.dir)||'')+'" style="box-sizing:border-box;min-width:44px;min-height:44px;outline:2px dashed #d64545;color:#d64545;font:700 12px sans-serif;padding:4px">Мастер не найден</div>';
  return baseHtml(v,p,ctx).split(' data-nid="i:').join(' data-ov="').replace(' data-type="frame"',' data-type="instance"');};
N.css=function(n,p,ctx){
  if(n&&n.type==='instance'){var v=C.resolve(n,p||ST.p);if(v)n=v;}
  return baseCss(n,p,ctx);};

/* ---------- мост к st-nodes.js и st-profiles.js (лимит правок за шаг; при случае перенести туда) ---------- */
N.scrIn=function(d){ /* экран, а при правке мастера — мастер */
  var a=d.screens,i;for(i=0;i<a.length;i++)if(a[i].id===ST.cur)return a[i];
  var c=d.components||[];for(i=0;i<c.length;i++)if(isO(c[i])&&c[i].id===ST.cur&&isO(c[i].root))return c[i];
  return a[0];};
var baseValidate=N.validate;
N.validate=function(p){ /* базовая проверка знает 5 типов и смотрит только экраны: подсовываем ей копию, где экземпляры стали рамками, а мастера лежат среди экранов */
  var q={screens:clone(p.screens||[]),components:[]},ns=q.screens.length;
  q.screens.forEach(function(s){if(isO(s.root))N.walk(s.root,function(n){if(n.type==='instance')n.type='frame';});});
  (p.components||[]).forEach(function(c){if(isO(c)&&isO(c.root)){var r=clone(c.root);N.walk(r,function(n){if(n.type==='instance')n.type='frame';});q.screens.push({root:r});}});
  var m=baseValidate(q),mm=/^экран №(\d+)(.*)$/.exec(m||'');
  if(mm&&Number(mm[1])>ns)return 'мастер №'+(Number(mm[1])-ns)+mm[2];
  return m;};
if(ST.prof){var baseCur=ST.prof.cur,baseSetCur=ST.prof.setCurrent;
  ST.prof.cur=function(p){var c=C.active(p);if(c){var pr=ST.prof.get(p,c.profile);if(pr)return pr;}return baseCur(p);}; /* при правке мастера действует профиль мастера */
  ST.prof.setCurrent=function(id){var c=C.active(ST.p);return c?ST.prof.assignComponent(c.id,id):baseSetCur(id);};}

/* ---------- проверка «только токены и роли профиля» (P5 п. 15): [{id,name,msg}] ---------- */
function styleProblems(n,S,out,label){
  function add(m){out.push({id:n.id,name:n.name,msg:'«'+n.name+'»'+(label?' ('+label+')':'')+': '+m});}
  function col(k,v){if(v!==undefined&&!(typeof v==='string'&&v.charAt(0)==='@'))add('цвет «'+String(v).slice(0,24)+'» ('+k+') записан не токеном. В мастере нужны только токены: «→ токен» в инспекторе.');}
  col('фон',S.bg);col('иконка',S.ic);if(S.bd)col('обводка',S.bd.c);if(S.ledge)col('бортик',S.ledge.c);if(S.sh)col('тень',S.sh.c);if(S.text)col('текст',S.text.c);
  function rad(v){return typeof v==='number'&&v!==0&&v<99;}
  if(rad(S.r)||(Array.isArray(S.rc)&&S.rc.some(rad)))add('жёсткий радиус в px. В мастере нужны «r» или «rl» (значения формы профиля); полная капсула (99 и больше) допустима.');
  if(S.text&&typeof S.text.ff==='string'&&S.text.ff.indexOf('role:')!==0)add('гарнитура задана названием, а не ролью (display, body, mono, pixel).');}
C.problems=function(root){var out=[];if(!root)return out;
  N.walk(root,function(n){styleProblems(n,n.style||{},out,'');
    ['pressed','disabled'].forEach(function(s){if(n.states&&n.states[s]&&isO(n.states[s].style))styleProblems(n,n.states[s].style,out,N.STATE_NAME[s].toLowerCase());});});
  return out;};

/* ---------- команды (всё через ST.do) ---------- */
function curProfile(){var s=ST.screen();return (s&&s.profile)||(ST.prof&&ST.prof.WORK_ID)||'';}
C.newInst=function(cid,name,id,layout){
  var L={};['w','h','minW','maxW','minH','maxH','float','x','y'].forEach(function(k){if(layout&&layout[k]!==undefined)L[k]=layout[k];});
  return {id:id,type:'instance',name:name,layout:L,style:{},props:{},children:[],ref:{c:cid,ov:{}}};};
function nameOk(v){v=String(v==null?'':v).trim();return v&&v.length<=80?v:'';}
/* мастер из выделенной рамки: рамка заменяется экземпляром, всё одним шагом истории. measure(id) → {w,h} с холста (необязательно) */
C.fromSel=function(name,measure){
  if(C.active(ST.p))return {error:'Мастер создаётся на экране. Вернитесь к экрану («← К экрану»).'};
  var ns=N.selNodes();if(ns.length!==1)return {error:'Выделите одну рамку: из неё получится мастер.'};
  var f=N.get(ns[0].id),n=f.n;
  if(!f.parent)return {error:'Корневую рамку экрана мастером сделать нельзя: выделите рамку внутри.'};
  if(n.type!=='frame')return {error:'Мастер делается из рамки. Оберните узел в рамку (кнопка «Группировать») и повторите.'};
  var inst='';N.walk(n,function(x){if(x.type==='instance')inst=x.name;});
  if(inst)return {error:'Внутри мастера не может быть экземпляров («'+inst+'»). Отсоедините их и повторите.'};
  var pr=C.problems(n);
  if(pr.length)return {error:'Мастер строится только на токенах и значениях формы: '+pr.slice(0,3).map(function(x){return x.msg;}).join(' ')+(pr.length>3?' И ещё '+(pr.length-3)+'.':'')};
  var nm=nameOk(name)||nameOk(n.name)||'Мастер';
  var z=measure?measure(n.id):null,L=n.layout||{},w=Math.round(z?z.w:(typeof L.w==='number'?L.w:354)),h=Math.round(z?z.h:(typeof L.h==='number'?L.h:120));
  w=Math.max(1,Math.min(4000,w||354));h=Math.max(1,Math.min(4000,h||120));
  var cid=ST.uid('c'),iid=ST.uid('n'),prev=ST.sel;ST.sel=[iid];
  var ok=ST.do('мастер «'+nm+'»',function(d){var s=N.scrIn(d),a=N.find(s.root,n.id),m=fresh(a.n);delete m.hidden;
    d.components.push({id:cid,name:nm,profile:s.profile,w:w,h:h,variants:[],root:m});
    a.parent.children.splice(a.i,1,C.newInst(cid,nm,iid,a.n.layout));});
  if(!ok)ST.sel=prev;
  return ok?{ok:true,id:cid}:{error:'Мастер не создан.'};};
/* экземпляр на экран: в выбранную рамку (или рядом с выбранным узлом, или в корень) */
C.place=function(cid,parentId){
  var c=C.get(ST.p,cid);if(!c)return {error:'Мастера нет в проекте.'};
  if(C.active(ST.p))return {error:'Экземпляры вставляются на экран, а не в мастер. Вернитесь к экрану («← К экрану»).'};
  var root=N.root(),pid=parentId;
  if(!pid){var n=N.selNodes()[0];if(!n)pid=root.id;else if(n.type==='frame')pid=n.id;else{var pt=N.path(root,n.id);pid=pt.length>1?pt[pt.length-2].id:root.id;}}
  var id=ST.uid('n'),prev=ST.sel,err='';ST.sel=[id];
  var ok=ST.do('экземпляр: '+c.name,function(d){var s=N.scrIn(d),f=N.find(s.root,pid),m=C.get(d,cid);
    if(!f||f.n.type!=='frame'){err='Вставлять можно только внутрь рамки.';throw new Error(err);}
    if(f.depth+1>N.DEPTH_MAX){err='Вложенность больше '+N.DEPTH_MAX+' уровней.';throw new Error(err);}
    var L=Object.assign({},m.root.layout||{});if(L.w===undefined)L.w='hug';if(L.h===undefined)L.h='hug';
    f.n.children.push(C.newInst(cid,m.name,id,L));});
  if(!ok){ST.sel=prev;return {error:err||'Не вставилось.'};}
  return {ok:true,id:id};};
function instIn(d,id){var s=N.scrIn(d),f=N.find(s.root,id);if(!f||f.n.type!=='instance')throw new Error('экземпляр не найден');return f.n;}
function tidy(r){Object.keys(r.ov||{}).forEach(function(k){if(!Object.keys(r.ov[k]).length)delete r.ov[k];});}
/* patch: {text|icon|hidden|col: значение | undefined (убрать)}; null вместо patch очищает весь узел */
C.setOv=function(id,mid,patch,label){
  var e='';if(patch){var t={};Object.keys(patch).forEach(function(k){if(patch[k]!==undefined)t[k]=patch[k];});e=C.checkOv(patch&&Object.keys(t).length?(function(){var o={};o[mid]=t;return o;})():undefined);}
  if(e)return {error:'Значение не подходит: '+e+'.'};
  var f=N.get(id);if(!f||f.n.type!=='instance')return {error:'Выберите экземпляр.'};
  return res(ST.do(label||'переопределение',function(d){var r=instIn(d,id).ref;r.ov=isO(r.ov)?r.ov:{};
    if(patch===null)delete r.ov[mid];
    else{r.ov[mid]=r.ov[mid]||{};Object.keys(patch).forEach(function(k){if(patch[k]===undefined)delete r.ov[mid][k];else r.ov[mid][k]=patch[k];});}
    tidy(r);}));};
C.clearOv=function(id){return res(ST.do('сбросить переопределения',function(d){instIn(d,id).ref.ov={};}));};
C.setVariant=function(id,k){
  var f=N.get(id);if(!f||f.n.type!=='instance')return {error:'Выберите экземпляр.'};
  var c=C.get(ST.p,f.n.ref.c);if(k&&!(c.variants||[]).some(function(x){return x.k===k;}))return {error:'У мастера нет такого варианта.'};
  return res(ST.do('вариант экземпляра',function(d){var r=instIn(d,id).ref;if(k)r.v=k;else delete r.v;}));};
/* отсоединить: экземпляр становится обычной рамкой с обычными узлами (новые id; корень оставляет id) */
function toFrame(d,inst){var v=C.resolve(inst,d);if(!v)throw new Error('мастер не найден');
  var rid=inst.id;(function re(x,top){if(!top)x.id=ST.uid('n');(x.children||[]).forEach(function(q){re(q,false);});})(v,true);v.id=rid;return v;}
C.detach=function(ids){
  var list=ids.filter(function(id){var f=N.get(id);return f&&f.n.type==='instance';});
  if(!list.length)return {error:'Выберите экземпляр мастера.'};
  return res(ST.do('отсоединить от мастера',function(d){var s=N.scrIn(d);
    list.forEach(function(id){var f=N.find(s.root,id);f.parent.children.splice(f.i,1,toFrame(d,f.n));});}));};
C.detachAll=function(cid){
  if(!C.uses(ST.p,cid).length)return {ok:true};
  return res(ST.do('отсоединить все экземпляры',function(d){
    (d.screens||[]).forEach(function(s){var hits=[];N.walk(s.root,function(n){if(n.type==='instance'&&n.ref&&n.ref.c===cid)hits.push(n.id);});
      hits.forEach(function(id){var f=N.find(s.root,id);f.parent.children.splice(f.i,1,toFrame(d,f.n));});});}));};
C.remove=function(cid){
  var c=C.get(ST.p,cid);if(!c)return {error:'Мастера нет в проекте.'};
  var u=C.uses(ST.p,cid);
  if(u.length)return {error:'Мастер «'+c.name+'» используется: '+u.length+' экз. ('+u.slice(0,3).map(function(x){return x.name+' на «'+x.screen+'»';}).join(', ')+(u.length>3?' и др.':'')+'). Сначала отсоедините экземпляры.',used:u};
  var was=ST.cur;if(ST.cur===cid)ST.cur=ST.p.screens[0].id;
  var ok=ST.do('удалить мастер «'+c.name+'»',function(d){d.components=d.components.filter(function(x){return !(isO(x)&&x.id===cid);});});
  if(!ok)ST.cur=was;else ST.emit('change');
  return res(ok);};
C.rename=function(cid,name){var nm=nameOk(name);if(!nm)return {error:'Название мастера: от 1 до 80 знаков.'};
  var c=C.get(ST.p,cid);if(!c)return {error:'Мастера нет в проекте.'};if(c.name===nm)return {ok:true};
  return res(ST.do('название мастера',function(d){C.get(d,cid).name=nm;}));};
C.setSize=function(cid,w,h){
  if(!(w>=1&&w<=4000&&h>=1&&h<=4000))return {error:'Размер рамки мастера: от 1 до 4000 px.'};
  return res(ST.do('размер рамки мастера',function(d){var c=C.get(d,cid);c.w=Math.round(w);c.h=Math.round(h);}));};
C.dup=function(cid){
  var c=C.get(ST.p,cid);if(!c)return {error:'Мастера нет в проекте.'};
  var id=ST.uid('c'),ok=ST.do('копия мастера «'+c.name+'»',function(d){var s=C.get(d,cid),map={},k=clone(s);
    k.root=fresh(s.root,map);k.id=id;k.name=(s.name+' копия').slice(0,80);delete k.preset;
    (k.variants||[]).forEach(function(v){var o={};Object.keys(v.ov||{}).forEach(function(m){if(map[m])o[map[m]]=v.ov[m];});v.ov=o;});
    d.components.push(k);});
  return ok?{ok:true,id:id}:{error:'Копия не создана.'};};
/* вариант = набор переопределений: настройте экземпляр и сохраните его вид под именем */
C.variantFromInst=function(id,name){
  var nm=String(name==null?'':name).trim();if(!nm||nm.length>40)return {error:'Название варианта: от 1 до 40 знаков.'};
  var f=N.get(id);if(!f||f.n.type!=='instance')return {error:'Выберите экземпляр.'};
  var c=C.get(ST.p,f.n.ref.c);if((c.variants||[]).length>=C.VARIANTS_MAX)return {error:'У мастера уже '+C.VARIANTS_MAX+' вариантов.'};
  if((c.variants||[]).some(function(v){return v.name.toLowerCase()===nm.toLowerCase();}))return {error:'Вариант «'+nm+'» уже есть.'};
  var cur=(c.variants||[]).filter(function(v){return v.k===f.n.ref.v;})[0],ov=clone(cur?cur.ov:{});
  Object.keys(f.n.ref.ov||{}).forEach(function(m){ov[m]=Object.assign(ov[m]||{},f.n.ref.ov[m]);});
  var k='v',i=1;while((c.variants||[]).some(function(v){return v.k===k+i;}))i++;k=k+i;
  return res(ST.do('вариант мастера «'+nm+'»',function(d){var m=C.get(d,c.id);m.variants=m.variants||[];m.variants.push({k:k,name:nm,ov:ov});
    var r=instIn(d,id).ref;r.v=k;r.ov={};}));};
C.delVariant=function(cid,k){
  var c=C.get(ST.p,cid);if(!c||!(c.variants||[]).some(function(v){return v.k===k;}))return {error:'Такого варианта нет.'};
  return res(ST.do('удалить вариант',function(d){var m=C.get(d,cid);m.variants=m.variants.filter(function(v){return v.k!==k;});
    eachInst(d,function(n){if(n.ref.c===cid&&n.ref.v===k)delete n.ref.v;});}));};
/* в мастере: разрешить менять цвет и показ узла (рамки, фигуры, картинки) в экземплярах; текст и иконки меняются всегда */
C.setOvr=function(nodeId,on){
  if(!C.active(ST.p))return {error:'Это делается при правке мастера.'};
  return res(ST.do('узел мастера: переопределяемый',function(d){var f=N.find(N.scrIn(d).root,nodeId);if(!f)throw new Error('узел не найден');if(on)f.n.ovr=true;else delete f.n.ovr;}));};
/* узлы мастера, которые видны в списке переопределений */
C.slots=function(c){var out=[];N.walk(c.root,function(n,par,i,d){if(n.type==='text'||n.type==='icon'||n.ovr)out.push({n:n,d:d});});return out;};

/* ---------- правка мастера ---------- */
C.back=null;
C.edit=function(cid){
  var c=C.get(ST.p,cid);if(!c)return {error:'Мастера нет в проекте.'};
  if(!C.active(ST.p)){var s=ST.screen();C.back=s?s.id:null;}
  ST.cur=cid;ST.sel=[];N.vstate='normal';ST.emit('change');return {ok:true};};
C.exit=function(){
  var back=C.back&&ST.p.screens.some(function(s){return s.id===C.back;})?C.back:(ST.p.screens[0]&&ST.p.screens[0].id);
  if(back){ST.cur=back;ST.sel=[];ST.emit('change');}return {ok:true};};
})();
