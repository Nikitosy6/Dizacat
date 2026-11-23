/* Catworking Studio: панель «Компоненты» (список мастеров с превью и поиском, правка мастера) и блоки инспектора для экземпляра. Объект ST.compui.
   Поля: data-cm="действие[:id]" (кнопки), data-cmf="поле[:id]" (значения). Данные меняет ST.comp через ST.do. */
(function(){'use strict';
var ST=window.ST,N=ST.nodes,C=ST.comp,h=ST.esc,U=ST.compui={q:''};
function $(s){return document.querySelector(s);}
function say(r){if(r&&r.error){ST.ui.toast(r.error);return false;}return true;}
function measure(id){var el=document.querySelector('.st-frame [data-nid="'+id+'"]');return el?{w:el.offsetWidth,h:el.offsetHeight}:null;}
function closeLeft(){if(ST.ui.sheet==='left')ST.ui.sheetTo('left');}
function opt(list,cur){return list.map(function(o){return '<option value="'+h(o[0])+'"'+(String(o[0])===String(cur)?' selected':'')+'>'+h(o[1])+'</option>';}).join('');}
function tokenList(){return ST.tok?ST.tok.names(ST.p).map(function(n){return ['@'+n,n];}):[];}

/* ---------- превью мастера (всегда «обычное» состояние, первая тема) ---------- */
function thumb(c){
  var K=Math.min(1,92/Math.max(c.h,1),160/Math.max(c.w,1)),th=ST.tok?ST.tok.themes()[0]:'light';
  var vars=(ST.tok?ST.tok.styleAttr(ST.p,th):'')+(ST.fonts?ST.fonts.styleAttr(ST.p):'')+N.shapeVars();
  return '<div class="st-cth" style="width:'+Math.max(8,Math.round(c.w*K))+'px;height:'+Math.max(8,Math.round(c.h*K))+'px"><div class="st-cthi" data-th="'+th+'" style="width:'+c.w+'px;height:'+c.h+'px;transform:scale('+K+');'+h(vars)+'">'+
    N.html(c.root,ST.p,{root:true,state:'normal'})+'</div></div>';}
function card(c){
  var n=C.uses(ST.p,c.id).length,pr=ST.prof.get(ST.p,c.profile);
  return '<div class="st-cd" data-cname="'+h((c.name+' '+(c.preset||'')).toLowerCase())+'">'+thumb(c)+
    '<div class="st-cb"><b>'+h(c.name)+'</b><div class="st-mut">'+n+' экз.'+((c.variants||[]).length?' · вариантов: '+c.variants.length:'')+(c.shell?' · только оболочка':'')+(pr?' · '+h(pr.name):'')+'</div>'+
    '<div class="st-acts"><button class="st-b" data-cm="place:'+h(c.id)+'">＋ На экран</button><button class="st-b" data-cm="edit:'+h(c.id)+'">Править</button>'+
    '<button class="st-b" data-cm="dupc:'+h(c.id)+'" aria-label="Дублировать мастер">⧉</button><button class="st-b st-danger" data-cm="delc:'+h(c.id)+'" aria-label="Удалить мастер">🗑</button></div></div></div>';}

/* ---------- левая панель ---------- */
function masterBar(c){
  var pr=C.problems(c.root),profs=ST.prof.list(ST.p).map(function(x){return [x.id,x.name];});
  return '<div class="st-cbar"><div class="st-lh">Правка мастера</div>'+
    '<p class="st-mut">Всё, что вы меняете здесь, сразу меняется во всех экземплярах. Узлы правятся как на экране: «Слои» и инспектор справа.</p>'+
    '<div class="st-acts"><button class="st-b st-pri" data-cm="exit">← К экрану</button></div>'+
    '<label class="st-lb">Название мастера<input class="st-in" data-cmf="cname" maxlength="80" value="'+h(c.name)+'"></label>'+
    '<div class="st-prow"><div class="st-half"><label class="st-lb">Рамка, ширина<input class="st-in st-num" inputmode="numeric" data-cmf="cw" value="'+c.w+'"></label></div>'+
      '<div class="st-half"><label class="st-lb">Рамка, высота<input class="st-in st-num" inputmode="numeric" data-cmf="ch" value="'+c.h+'"></label></div></div>'+
    '<label class="st-lb">Профиль мастера<select class="st-in" data-cmf="cprof">'+opt(profs,c.profile)+'</select></label>'+
    ((c.variants||[]).length?'<div class="st-lh">Варианты</div>'+c.variants.map(function(v){return '<div class="st-prow"><span class="st-grow">'+h(v.name)+'</span><button class="st-b" data-cm="vdel:'+h(v.k)+'" aria-label="Удалить вариант '+h(v.name)+'">×</button></div>';}).join(''):'')+
    '<div class="st-lh">Проверка мастера</div>'+(pr.length?'<p class="st-mut">Мастер должен строиться на токенах и значениях формы, иначе при смене профиля он «сломается».</p>'+pr.slice(0,8).map(function(x){
      return '<button class="st-b st-row" data-cm="psel:'+h(x.id)+'"><span class="st-warn" aria-hidden="true">⚠</span> '+h(x.msg)+'</button>';}).join('')+(pr.length>8?'<p class="st-mut">И ещё '+(pr.length-8)+'.</p>':''):'<p class="st-mut">Замечаний нет: только токены, роли шрифтов и значения формы.</p>')+'</div>';}
U.list=function(){
  var cs=C.list(ST.p),ed=C.active(ST.p),o=ed?masterBar(ed):'';
  o+='<div class="st-cc"><div class="st-lh">Компоненты ('+cs.length+')</div>'+
    '<input class="st-in st-cq" type="search" data-cm-q="1" placeholder="Поиск по названию" aria-label="Поиск компонентов" value="'+h(U.q)+'">'+
    '<div class="st-acts"><button class="st-b" data-cm="fromsel">＋ Из выделения</button><button class="st-b" data-cm="preset">Стартовый набор ('+ST.presets.count()+')</button></div>';
  cs.forEach(function(c){o+=card(c);});
  if(!cs.length)o+='<p class="st-mut">Мастеров пока нет. «Стартовый набор» добавит карточки, кнопки, шторку и нижнюю панель из макетов. Своё: выделите рамку на экране и нажмите «Из выделения».</p>';
  return o+'<p class="st-mut" id="st-cnone" hidden>Ничего не найдено.</p></div>';};
function filter(){
  var q=U.q.trim().toLowerCase(),n=0;
  document.querySelectorAll('#st-lbody [data-cname]').forEach(function(el){var on=!q||el.getAttribute('data-cname').indexOf(q)>=0;el.hidden=!on;if(on)n++;});
  var z=$('#st-cnone');if(z)z.hidden=!(q&&!n);}
U.sync=function(){filter();};

/* ---------- инспектор: экземпляр и узел мастера (добавляется перед обычным инспектором узла) ---------- */
function eff(inst,c,mid){var v=C.resolve(inst,ST.p);return v?N.find(v,C.vid(inst,mid)):null;}
function colOf(n){var S=n.style||{};var v=n.type==='text'?(S.text&&S.text.c):n.type==='icon'?S.ic:S.bg;return typeof v==='string'&&v.charAt(0)==='@'&&v.indexOf('@g:')!==0?v:'';}
function slotRow(inst,c,s){
  var n=s.n,f=eff(inst,c,n.id),e=f&&f.n,ov=(inst.ref.ov||{})[n.id]||{},has=Object.keys(ov).length,o='';
  var tl=[['','как в мастере']].concat(tokenList());
  o+='<div class="st-co"><div class="st-pl"><span>'+h(n.name)+'</span><span>'+
    (has?'<button class="st-b st-rs" data-cm="oclr:'+h(n.id)+'" aria-label="Сбросить: '+h(n.name)+'">сбросить</button>':'')+
    '<button class="st-b" data-cm="oeye:'+h(n.id)+'" aria-pressed="'+(e&&e.hidden?'true':'false')+'" aria-label="'+(e&&e.hidden?'Показать':'Скрыть')+': '+h(n.name)+'">'+(e&&e.hidden?'—':'👁')+'</button></span></div>';
  if(n.type==='text')o+='<input class="st-in" data-cmf="otext:'+h(n.id)+'" maxlength="2000" value="'+h(e&&e.props?e.props.text:'')+'" aria-label="Текст: '+h(n.name)+'">';
  if(n.type==='icon')o+='<select class="st-in" data-cmf="oicon:'+h(n.id)+'" aria-label="Иконка: '+h(n.name)+'">'+opt(Object.keys(N.ICONS).map(function(k){return [k,ST.icons?ST.icons.label(k):k];}),e&&e.props?e.props.icon:'')+'</select>';
  o+='<select class="st-in" data-cmf="ocol:'+h(n.id)+'" aria-label="Цвет: '+h(n.name)+'">'+opt(tl,ov.col||'')+'</select>';
  return o+'</div>';}
function instBlock(inst){
  var c=C.get(ST.p,inst.ref&&inst.ref.c),o='<div class="st-lh">Экземпляр мастера</div>';
  if(!c)return o+'<p class="st-mut">Мастер не найден: отсоедините экземпляр или удалите его.</p><div class="st-acts"><button class="st-b st-danger" data-cm="detach">Отсоединить</button></div>';
  var vs=[['','Основной']].concat((c.variants||[]).map(function(v){return [v.k,v.name];})),cv=inst.ref.v||'';
  o+='<p class="st-mut">Мастер: <b>'+h(c.name)+'</b>. Размер и положение свои, остальное из мастера.</p>'+
    '<div class="st-acts"><button class="st-b" data-cm="edit:'+h(c.id)+'">Править мастер</button><button class="st-b" data-cm="detach">Отсоединить</button></div>';
  if(vs.length>1)o+='<div class="st-lh">Вариант</div><div class="st-seg st-wrapseg">'+vs.map(function(v){return '<button class="st-b'+(cv===v[0]?' on':'')+'" data-cm="var:'+h(v[0])+'">'+h(v[1])+'</button>';}).join('')+'</div>';
  var sl=C.slots(c);
  o+='<div class="st-lh">Переопределения</div><p class="st-mut">Можно менять только текст, иконку, показ и цвет-токен.</p>'+(sl.length?sl.map(function(s){return slotRow(inst,c,s);}).join(''):'<p class="st-mut">В этом мастере нечего переопределять.</p>');
  o+='<div class="st-acts">'+(Object.keys(inst.ref.ov||{}).length?'<button class="st-b" data-cm="ovclr">Сбросить всё</button><button class="st-b" data-cm="vsave">Сохранить как вариант</button>':'')+'</div>';
  return o;}
function nodeBlock(n){
  if(n.type==='text'||n.type==='icon'||!C.active(ST.p))return '';
  var root=!N.get(n.id).parent;if(root)return '<div class="st-lh">Мастер</div><p class="st-mut">Это корень мастера. Его размер и положение у каждого экземпляра свои.</p>';
  return '<div class="st-lh">Мастер</div><label class="st-chk"><input type="checkbox" data-cmf="ovr"'+(n.ovr?' checked':'')+'><span>Можно менять цвет и показ в экземплярах</span></label>';}
var baseHtml=ST.insp.html;
ST.insp.html=function(){
  var o=baseHtml(),ns=N.selNodes(),n=ns.length===1?ns[0]:null,b='';
  if(n&&n.type==='instance')b=instBlock(n);else if(n)b=nodeBlock(n);
  return b+o;};

/* ---------- события ---------- */
function ask(title,label,val,okText){ /* окно с полем ввода (prompt запрещён): значение читаем из поля, пока окно открыто */
  var cur=val,p=ST.ui.modal({title:title,html:'<label class="st-lb">'+h(label)+'<input class="st-in" id="st-cmi" maxlength="80" value="'+h(val)+'"></label>',buttons:[{k:'no',t:'Отмена'},{k:'ok',t:okText||'Готово',cls:'st-pri'}]});
  var inp=document.getElementById('st-cmi');if(inp){inp.addEventListener('input',function(){cur=inp.value;});inp.select();}
  return p.then(function(k){return k==='ok'?cur:null;});}
function onClick(e){
  var t=e.target.closest('[data-cm]');if(!t)return;
  var a=t.getAttribute('data-cm'),i=a.indexOf(':'),k=i<0?a:a.slice(0,i),id=i<0?'':a.slice(i+1),sel=N.selNodes()[0];
  if(k==='fromsel'){
    var s0=N.selNodes();ask('Новый мастер','Название',s0.length===1?s0[0].name:'Мастер','Создать').then(function(nm){if(nm===null)return;
      if(say(C.fromSel(nm,measure))){ST.ui.toast('Мастер создан, на экране теперь его экземпляр');}});}
  else if(k==='preset'){var r=ST.presets.install();if(say(r))ST.ui.toast(r.added?'Добавлено мастеров: '+r.added:'Стартовый набор уже добавлен');}
  else if(k==='place'){if(say(C.place(id))){closeLeft();}}
  else if(k==='edit'){if(say(C.edit(id))){closeLeft();ST.ui.fit();}}
  else if(k==='exit'){C.exit();ST.ui.fit();}
  else if(k==='dupc')say(C.dup(id));
  else if(k==='delc'){var c=C.get(ST.p,id);if(!c)return;var u=C.uses(ST.p,id);
    if(u.length)ST.ui.modal({title:'Мастер используется',html:'<p>«'+h(c.name)+'» стоит на экранах: '+u.length+' экз. Чтобы удалить мастер, экземпляры станут обычными рамками (связь с мастером пропадёт, вид останется).</p>',buttons:[{k:'no',t:'Отмена'},{k:'ok',t:'Отсоединить и удалить',cls:'st-danger'}]})
      .then(function(x){if(x==='ok'&&say(C.detachAll(id)))say(C.remove(id));});
    else ST.ui.confirm('Удалить мастер?','«'+c.name+'» исчезнет из списка. Отменить можно кнопкой «↶».','Удалить',true).then(function(ok){if(ok)say(C.remove(id));});}
  else if(k==='psel'){if(N.get(id))N.select([id]);}
  else if(k==='vdel'){var ac=C.active(ST.p);if(ac)say(C.delVariant(ac.id,id));}
  else if(sel&&sel.type==='instance'){
    if(k==='detach')say(C.detach(ST.sel));
    else if(k==='var')say(C.setVariant(sel.id,id));
    else if(k==='ovclr')say(C.clearOv(sel.id));
    else if(k==='oclr')say(C.setOv(sel.id,id,null,'сбросить переопределение'));
    else if(k==='oeye'){var f=C.resolve(sel,ST.p),q=f&&N.find(f,C.vid(sel,id)),hid=!!(q&&q.n.hidden);say(C.setOv(sel.id,id,{hidden:!hid},'показ узла экземпляра'));}
    else if(k==='vsave')ask('Вариант мастера','Название варианта','','Сохранить').then(function(nm){if(nm!==null)say(C.variantFromInst(sel.id,nm));});}}
function onChange(e){
  var el=e.target,a=el.getAttribute&&el.getAttribute('data-cmf');if(!a||!ST.p)return;
  var i=a.indexOf(':'),k=i<0?a:a.slice(0,i),id=i<0?'':a.slice(i+1),ac=C.active(ST.p),sel=N.selNodes()[0],v=el.value;
  function fix(r){if(!say(r))ST.ui.render();}
  if(k==='cname'&&ac)fix(C.rename(ac.id,v));
  else if((k==='cw'||k==='ch')&&ac){var x=Number(String(v).replace(',','.'));fix(C.setSize(ac.id,k==='cw'?x:ac.w,k==='ch'?x:ac.h));}
  else if(k==='cprof'&&ac)fix(ST.prof.assignComponent(ac.id,v));
  else if(k==='ovr'&&sel)fix(C.setOvr(sel.id,el.checked));
  else if(sel&&sel.type==='instance'){
    if(k==='otext')fix(C.setOv(sel.id,id,{text:v},'текст экземпляра'));
    else if(k==='oicon')fix(C.setOv(sel.id,id,{icon:v},'иконка экземпляра'));
    else if(k==='ocol')fix(C.setOv(sel.id,id,{col:v||undefined},'цвет экземпляра'));}}
U.bind=function(){
  ['#st-left','#st-right'].forEach(function(s){var b=$(s);if(!b)return;b.addEventListener('click',onClick);b.addEventListener('change',onChange);});
  $('#st-left').addEventListener('input',function(e){if(e.target.hasAttribute&&e.target.hasAttribute('data-cm-q')){U.q=e.target.value;filter();}});
  ST.on(function(k){if(k!=='saved'&&k!=='toast'&&k!=='error')setTimeout(U.sync,0);});};
})();
