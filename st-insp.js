/* Catworking Studio: инспектор узла (раскладка и «Вид»). Разметка и события; значения пишет ST.nodes.patch (через ST.do).
   Поля: data-nf="путь" (значение), data-ns="путь|значение" (кнопка-выбор), data-nr="путь,путь" (сбросить), data-na="действие". */
(function(){'use strict';
var ST=window.ST,N=ST.nodes,h=ST.esc,I=ST.insp={};
function $(s){return document.querySelector(s);}
function say(r){if(r&&r.error){ST.ui.toast(r.error);return false;}return true;}
function sel(){return N.selNodes();}
function st(){return N.vstate!=='normal';}
function pf(n,p){return st()&&/^style\./.test(p)?N.val({style:N.styleOf(n,N.vstate)},p):N.val(n,p);} /* в состоянии: вид с учётом его отличий */
function ov(n){return st()?((n.states&&n.states[N.vstate]&&n.states[N.vstate].style)||{}):(n.style||{});} /* чем заданы значения: для кнопок «сбросить» */
function measure(id){var el=document.querySelector('.st-frame [data-nid="'+id+'"]');return el?{w:el.offsetWidth,h:el.offsetHeight}:null;}
function def(p){var s=N.spec(p);return s&&s.def!==undefined?s.def:'';}
function shown(v,p){return typeof v==='number'?v:(typeof v==='string'&&N.SHAPE_REF[v]?N.SHAPE_REF[v]:(v===undefined?def(p):''));}
function lab(t,body,reset,hint){
  return '<div class="st-pr"><div class="st-pl"><span>'+h(t)+'</span>'+(reset?'<button class="st-b st-rs" data-nr="'+h(reset)+'" aria-label="Сбросить: '+h(t)+'">сбросить</button>':'')+'</div>'+body+(hint?'<div class="st-mut">'+h(hint)+'</div>':'')+'</div>';}
function num(p,v,ph){var sp=N.spec(p);return '<input class="st-in st-num" inputmode="decimal" autocomplete="off" data-nf="'+h(p)+'" value="'+h(v===undefined?'':v)+'"'+(ph!==undefined?' placeholder="'+h(ph)+'"':'')+(sp&&sp.u?' aria-label="'+h(sp.n)+', '+sp.u+'"':'')+'>';}
function rng(p,v){var s=N.spec(p),mx=Math.min(s.max,p==='style.br'||p==='style.ct'||p==='style.sa'?200:s.max);
  return '<div class="st-prow"><input type="range" class="st-rg" data-nf="'+p+'" min="'+s.min+'" max="'+mx+'" step="1" value="'+h(v)+'" aria-label="'+h(s.n)+'">'+
    '<input class="st-in st-pos" inputmode="decimal" data-nf="'+p+'" data-pair="1" value="'+h(v)+'" aria-label="'+h(s.n)+', '+s.u+'"></div>';}
function seg(p,val,opts){return '<div class="st-seg">'+opts.map(function(o){
  return '<button class="st-b'+(String(val)===String(o[0])?' on':'')+'" data-ns="'+h(p)+'|'+h(o[0])+'">'+h(o[1])+'</button>';}).join('')+'</div>';}
function chk(p,v,t){return '<label class="st-chk"><input type="checkbox" data-nf="'+p+'" data-t="b"'+(v?' checked':'')+'><span>'+h(t)+'</span></label>';}
function opt(list,cur){return list.map(function(o){return '<option value="'+h(o[0])+'"'+(String(o[0])===String(cur)?' selected':'')+'>'+h(o[1])+'</option>';}).join('');}
/* цвет: токен / градиент / свой цвет */
function colorF(p,v,grad,none){
  var T=ST.tok,pr=ST.p,list=[['',none||'нет']],cur='',sw='';
  if(typeof v==='string'&&v)cur=v.charAt(0)==='@'?v:'#';
  if(T){T.names(pr).forEach(function(n){list.push(['@'+n,n]);});
    if(grad)T.grads(pr).forEach(function(g){list.push(['@g:'+g,'градиент '+g]);});}
  list.push(['#','свой цвет…']);
  if(T&&cur&&cur!=='#'&&cur.indexOf('@g:')!==0){var n=cur.slice(1);sw='background:linear-gradient(90deg,'+T.val(pr,'light',n)+' 50%,'+T.val(pr,'dark',n)+' 50%)';}
  else if(cur==='#')sw='background:'+h(v);
  var out='<div class="st-prow">'+(sw?'<span class="st-sw st-swg" style="'+sw+'"></span>':'')+'<select class="st-in st-grow" data-nf="'+p+'" data-t="color" aria-label="Цвет">'+opt(list,cur)+'</select></div>';
  if(cur==='#')out+='<div class="st-prow"><input type="color" class="st-col" data-nf="'+p+'" data-t="rawc" value="'+(T?T.hex6(v):'#888888')+'" aria-label="Выбрать цвет">'+
    '<input class="st-in st-hex" data-nf="'+p+'" data-t="rawc" value="'+h(v)+'" aria-label="Цвет в виде #rrggbb">'+
    '<button class="st-b" data-nt="'+h(p.replace(/^style\./,''))+'">→ токен</button></div>';
  return out;}
function size(n,k){
  var v=pf(n,'layout.'+k),mode=typeof v==='number'?'fix':(v==='fill'?'fill':'hug'),nm=k==='w'?'Ширина':'Высота';
  return lab(nm,seg('layout.'+k,mode==='fix'?'fix':v||'hug',[['fill','Растянуть'],['hug','По содержимому'],['fix','Фикс']])+
    (mode==='fix'?num('layout.'+k,v):''),v===undefined?'':'layout.'+k);}
function pad(n){var a=pf(n,'layout.pad');
  return lab('Отступы внутри (сверху, справа, снизу, слева)','<div class="st-prow">'+[0,1,2,3].map(function(i){
    return '<div class="st-half">'+num('layout.pad.'+i,Array.isArray(a)?a[i]:0)+'</div>';}).join('')+'</div>',a?'layout.pad':'');}
function sizeBox(n){
  var fl=!!pf(n,'layout.float'),out='';
  out+=size(n,'w')+size(n,'h');
  out+=lab('Мин. и макс. размер','<div class="st-prow">'+['minW','maxW','minH','maxH'].map(function(k){
    return '<div class="st-half">'+num('layout.'+k,pf(n,'layout.'+k),{minW:'мин Ш',maxW:'макс Ш',minH:'мин В',maxH:'макс В'}[k])+'</div>';}).join('')+'</div>',
    ['minW','maxW','minH','maxH'].filter(function(k){return pf(n,'layout.'+k)!==undefined;}).map(function(k){return 'layout.'+k;}).join(','));
  out+=chk('layout.float',fl,'На плаву (поверх, по координатам: кнопка +, плашка на картинке)');
  if(fl)out+='<div class="st-prow"><div class="st-half"><label class="st-lb">X'+num('layout.x',shown(pf(n,'layout.x'),'layout.x'))+'</label></div><div class="st-half"><label class="st-lb">Y'+num('layout.y',shown(pf(n,'layout.y'),'layout.y'))+'</label></div></div>';
  return out;}
function layoutBox(n){
  var out='';
  out+=lab('Направление',seg('layout.dir',pf(n,'layout.dir')||'column',[['column','Колонка'],['row','Строка']]));
  out+=lab('Промежуток между узлами',num('layout.gap',shown(pf(n,'layout.gap'),'layout.gap')),pf(n,'layout.gap')===undefined?'':'layout.gap');
  out+=pad(n);
  out+=lab('Выравнивание поперёк',seg('layout.ai',pf(n,'layout.ai')||'start',[['start','Начало'],['center','Центр'],['end','Конец'],['stretch','Растянуть']]),pf(n,'layout.ai')===undefined?'':'layout.ai');
  out+=lab('Распределение вдоль',seg('layout.jc',pf(n,'layout.jc')||'start',[['start','Начало'],['center','Центр'],['end','Конец'],['between','Между']]),pf(n,'layout.jc')===undefined?'':'layout.jc');
  out+=chk('layout.wrap',!!pf(n,'layout.wrap'),'Переносить на новую строку')+chk('style.clip',!!pf(n,'style.clip'),'Обрезать то, что выходит за рамку');
  return out;}
function radius(n){
  var r=pf(n,'style.r'),rc=pf(n,'style.rc'),R=ov(n),out='';
  out+=lab('Радиус','<div class="st-prow"><div class="st-half">'+num('style.r',typeof r==='number'?r:(typeof r==='string'?N.SHAPE_REF[r]:''),'0')+'</div>'+
    '<button class="st-b'+(r==='var:r'?' on':'')+'" data-ns="style.r|var:r">r</button><button class="st-b'+(r==='var:rl'?' on':'')+'" data-ns="style.r|var:rl">rl</button></div>'+
    chk('style.rc.on',!!rc,'Свой радиус у каждого угла')+
    (rc?'<div class="st-prow">'+[0,1,2,3].map(function(i){return '<div class="st-half">'+num('style.rc.'+i,shown(rc[i],'style.rc.'+i))+'</div>';}).join('')+'</div>':''),
    (R.r!==undefined||R.rc)?'style.r,style.rc':'','Число в px или r / rl: значение формы профиля. Углы: слева-сверху, справа-сверху, справа-снизу, слева-снизу.');
  return out;}
function view(n){
  var o='',S=N.styleOf(n,N.vstate),R=ov(n),bd=S.bd,led=S.ledge,sh=S.sh,ro=S.rotO||{};
  o+=lab('Фон',colorF('style.bg',S.bg,true),R.bg===undefined?'':'style.bg');
  o+=lab('Обводка (толщина, цвет)','<div class="st-prow"><div class="st-half">'+num('style.bd.w',bd?(bd.w===undefined?'bw':shown(bd.w,'style.bd.w')):'','0')+'</div></div>'+
    (bd?colorF('style.bd.c',bd.c,false,'цвет линии (@ln)'):''),R.bd?'style.bd':'','Число в px или bw (толщина формы профиля).');
  o+=radius(n);
  o+=lab('Бортик-тень (нижний выступ)','<div class="st-prow"><div class="st-half">'+num('style.ledge.y',led?(led.y===undefined?'ledge':shown(led.y,'style.ledge.y')):'','0')+'</div></div>'+
    (led?colorF('style.ledge.c',led.c,false,'цвет бортика (@ln)'):''),R.ledge?'style.ledge':'','Число в px или ledge (бортик формы профиля).');
  o+=lab('Мягкая тень (X, Y, размытие, цвет)','<div class="st-prow">'+['x','y','b'].map(function(k){return '<div class="st-half">'+num('style.sh.'+k,sh?sh[k]:'',0)+'</div>';}).join('')+'</div>'+
    (sh?colorF('style.sh.c',sh.c,false,'тёмная прозрачная'):''),R.sh?'style.sh':'');
  o+=lab('Поворот, °',rng('style.rot',shown(S.rot,'style.rot')),R.rot===undefined?'':'style.rot');
  o+=lab('Точка вращения, % (X, Y)','<div class="st-prow"><div class="st-half">'+num('style.rotO.x',shown(ro.x,'style.rotO.x'))+'</div><div class="st-half">'+num('style.rotO.y',shown(ro.y,'style.rotO.y'))+'</div></div>',R.rotO?'style.rotO':'');
  o+=lab('Непрозрачность, %',rng('style.op',shown(S.op,'style.op')),R.op===undefined?'':'style.op');
  o+=lab('Яркость, %',rng('style.br',shown(S.br,'style.br')),R.br===undefined?'':'style.br');
  o+=lab('Контраст, %',rng('style.ct',shown(S.ct,'style.ct')),R.ct===undefined?'':'style.ct');
  o+=lab('Насыщенность, %',rng('style.sa',shown(S.sa,'style.sa')),R.sa===undefined?'':'style.sa');
  o+=lab('Размытие, px',rng('style.bl',shown(S.bl,'style.bl')),R.bl===undefined?'':'style.bl','Фильтры и прозрачность создают новый слой наложения: на шторках лучше не применять.');
  o+=lab('Режим наложения','<select class="st-in" data-nf="style.blend" data-t="s">'+opt(N.BLEND.map(function(b){return [b,b];}),S.blend||'normal')+'</select>',R.blend===undefined?'':'style.blend');
  return o;}
function textBox(n){
  var F=ST.fonts,t=N.styleOf(n,N.vstate).text,o='';
  if(!st())o+=lab('Текст','<textarea class="st-in st-ta" rows="3" data-nf="props.text" data-t="s" maxlength="2000">'+h((n.props||{}).text||'')+'</textarea>');
  if(F)o+=lab('Стиль из проекта','<div class="st-seg">'+F.PRESETS.map(function(x){return '<button class="st-b" data-na="tpreset:'+x.k+'">'+h(x.n)+'</button>';}).join('')+'</div>');
  if(F&&t){
    o+=lab('Размер, px · вес','<div class="st-prow"><div class="st-half"><input class="st-in" inputmode="decimal" data-nf="style.text.fs" value="'+h(t.fs)+'" aria-label="Размер"></div>'+
      '<div class="st-half"><input class="st-in" inputmode="decimal" data-nf="style.text.fw" value="'+h(t.fw)+'" aria-label="Начертание"></div></div>');
    o+=lab('Выравнивание',seg('style.text.ta',t.ta,[['left','Слева'],['center','Центр'],['right','Справа']]));
    o+=lab('Цвет текста',colorF('style.text.c',t.c,false,'—'));}
  return o;}
function typeBox(n){
  if(n.type==='text')return textBox(n);
  if(n.type==='icon')return (st()?'':lab('Иконка','<select class="st-in" data-nf="props.icon" data-t="s">'+opt(Object.keys(N.ICONS).map(function(k){return [k,k];}),(n.props||{}).icon)+'</select>'))+lab('Цвет иконки',colorF('style.ic',N.styleOf(n,N.vstate).ic,false,'—'),ov(n).ic===undefined?'':'style.ic');
  if(n.type==='shape'&&st())return '';
  if(n.type==='shape')return lab('Фигура',seg('props.shape',(n.props||{}).shape||'rect',[['rect','Прямоугольник'],['ellipse','Эллипс']]));
  if(n.type==='image')return '<p class="st-mut">Картинки и пиксель-арт подключаются позже (Шаг 12). Пока узел показывает клетчатую заглушку; размер и положение работают.</p>';
  return '';}
/* ---------- разметка ---------- */
function warnHtml(){
  var r=N.root(),w=r?N.warns(r,measure):[],on=ST.sel;
  if(!w.length)return '<p class="st-mut">Замечаний нет: кнопки не меньше '+N.MIN_TAP+'×'+N.MIN_TAP+' px, текст не мельче '+N.MIN_TEXT+' px, шторки без фильтров.</p>';
  w.sort(function(a,b){return (on.indexOf(b.id)>=0)-(on.indexOf(a.id)>=0);});
  return '<p class="st-mut">Это предупреждения, а не запреты. Нажмите строку, чтобы выбрать узел.</p>'+w.slice(0,20).map(function(x){
    return '<button class="st-b st-row" data-na="wsel:'+h(x.id)+'"><span class="st-warn" aria-hidden="true">⚠</span> '+h(x.msg)+'</button>';}).join('')+(w.length>20?'<p class="st-mut">И ещё '+(w.length-20)+'.</p>':'');}
function stateBar(){
  var s=N.vstate,n=sel()[0];if(s==='normal')return '';
  var has=n&&n.states&&n.states[s]&&Object.keys(n.states[s].style||{}).length;
  return '<div class="st-lh">Состояние: '+h(N.STATE_NAME[s])+'</div><p class="st-mut">Вид меняется только в этом состоянии, остальное берётся из обычного. Размер, раскладка и содержимое общие: меняйте их в «Обычном».</p>'+
    '<div class="st-acts"><button class="st-b" data-na="sdef">Заготовка «'+h(N.STATE_NAME[s].toLowerCase())+'»</button>'+(has?'<button class="st-b" data-na="sclr">Убрать отличия</button>':'')+'</div>';}
I.html=function(){
  var ns=sel(),sw='<div class="st-lh">Проверки качества</div><div id="st-warn">'+warnHtml()+'</div>';
  if(!ns.length)return '<p class="st-mut">Выберите узел на холсте (касанием) или в списке «Слои».</p>'+(st()?'<p class="st-mut">На холсте показано состояние «'+h(N.STATE_NAME[N.vstate])+'».</p>':'')+sw;
  var n=ns[0],multi=ns.length>1,root=!N.get(n.id).parent,same=ns.every(function(x){return x.type===n.type;}),frames=ns.every(function(x){return x.type==='frame';});
  var path=N.path(N.root(),n.id).slice(0,-1);
  var o='<div class="st-lh">'+(multi?'Выбрано узлов: '+ns.length:h(N.TYPE_NAME[n.type])+(root?' · корень экрана':''))+'</div>';
  if(!multi)o+='<label class="st-lb">Имя<input class="st-in" data-nf="name" data-t="s" maxlength="80" value="'+h(n.name)+'"></label>';
  o+='<div class="st-acts">'+(path.length?'<button class="st-b" data-na="parent">↑ Родитель</button>':'')+(root?'':'<button class="st-b" data-na="up">▲ Выше в списке</button><button class="st-b" data-na="down">▼ Ниже в списке</button>')+
     (root?'':'<button class="st-b" data-na="dup">Дублировать</button><button class="st-b" data-na="group">Группировать</button>')+
     (!multi&&n.type==='frame'&&n.children.length&&!root?'<button class="st-b" data-na="ungroup">Разгруппировать</button>':'')+
     (root?'':'<button class="st-b st-danger" data-na="del">Удалить</button>')+'</div>';
  o+=stateBar();
  if(!root&&!st())o+='<div class="st-lh">Размер и положение</div>'+sizeBox(n);
  if(frames&&!st())o+='<div class="st-lh">Раскладка</div>'+layoutBox(n);
  if(same&&!multi)o+='<div class="st-lh">'+h(N.TYPE_NAME[n.type])+'</div>'+typeBox(n);
  o+='<div class="st-lh">Вид'+(st()?' · '+h(N.STATE_NAME[N.vstate].toLowerCase()):'')+'</div>'+view(n);
  return o+sw;};
/* ---------- события ---------- */
function ids(){return ST.sel.slice();}
function parseNum(p,s){
  s=String(s).trim().replace(',','.');if(s==='')return undefined;
  var sp=N.spec(p);if(sp&&sp.ref&&N.SHAPE.hasOwnProperty(s.toLowerCase()))return 'var:'+s.toLowerCase();
  var v=Number(s);return isFinite(v)?v:NaN;}
function commit(p,v,label){var r=v===undefined?N.reset(ids(),[p]):N.set(ids(),p,v,label);if(!say(r))ST.ui.render();return r;}
function textSet(k,v){var n=sel()[0],t=Object.assign({},N.styleOf(n,N.vstate).text||{});t[k]=v;return N.set(ids(),'style.text',t,'текст узла');}
function onChange(e){
  var el=e.target,p=el.getAttribute&&el.getAttribute('data-nf');if(!p||!ST.p||el.closest('#st-rbody')===null)return;
  var t=el.getAttribute('data-t'),v;
  if(el.type==='checkbox'){
    if(p==='style.rc.on'){var n=sel()[0],cur=pf(n,'style.r'),q=typeof cur==='number'||typeof cur==='string'?cur:0;
      if(!say(el.checked?N.patch(ids(),[['style.rc',[q,q,q,q]]],'радиус по углам'):N.reset(ids(),['style.rc'])))ST.ui.render();return;}
    if(p==='layout.float'){floatToggle(el.checked);return;}
    commit(p,el.checked?true:(p==='layout.float'?false:undefined));return;}
  if(t==='color'){var val=el.value;
    if(val==='')return commit(p,undefined);
    if(val==='#'){var n0=sel()[0],c0=N.val(n0,p),hx='#888888';if(typeof c0==='string'&&c0.charAt(0)==='@'&&ST.tok)hx=ST.tok.hex6(ST.tok.val(ST.p,'light',c0.slice(1)));
      return p.indexOf('style.text.')===0?say(textSet('c',hx))||ST.ui.render():commit(p,hx);}
    return p.indexOf('style.text.')===0?(say(textSet('c',val))||ST.ui.render()):commit(p,val);}
  if(t==='rawc'){var nv=ST.tok?ST.tok.norm(el.value):'';if(!nv){ST.ui.toast('Цвет не распознан. Пример: #f59a23 или rgba(0,0,0,.3).');ST.ui.render();return;}return commit(p,nv);}
  if(t==='s'){var sv=el.value;if(p==='name')return say(N.rename(ids()[0],sv))||ST.ui.render();return commit(p,sv);}
  /* числа */
  v=parseNum(p,el.value);
  if(typeof v==='number'&&isNaN(v)){ST.ui.toast('Здесь нужно число (например, 12 или 0,5).');ST.ui.render();return;}
  if(p.indexOf('style.text.')===0){var k=p.slice(11);if(v===undefined){ST.ui.render();return;}if(!say(textSet(k,v)))ST.ui.render();return;}
  if((p==='layout.w'||p==='layout.h')&&v===undefined){ST.ui.render();return;}
  commit(p,v);}
function onInput(e){ /* ползунок тянут: показываем сразу, в историю — по окончании (change) */
  var el=e.target,p=el.getAttribute&&el.getAttribute('data-nf');if(!p||el.type!=='range')return;
  var v=Number(el.value),pair=el.parentNode.querySelector('[data-pair]');if(pair)pair.value=v;
  ids().forEach(function(id){ST.canvas.liveNode(id,[[p,v]]);});}
function floatToggle(on){
  var items=ids().map(function(id){var el=document.querySelector('.st-frame [data-nid="'+id+'"]'),x=el?el.offsetLeft:0,y=el?el.offsetTop:0;
    return {id:id,pairs:on?[['layout.float',true],['layout.x',x],['layout.y',y]]:[['layout.float',undefined],['layout.x',undefined],['layout.y',undefined]]};});
  if(!say(N.patchEach(items,on?'на плаву: включить':'на плаву: выключить')))ST.ui.render();}
function onClick(e){
  var b=e.target.closest('button');if(!b)return;
  var s=b.getAttribute('data-ns'),r=b.getAttribute('data-nr'),a=b.getAttribute('data-na'),t=b.getAttribute('data-nt');
  if(s){var i=s.indexOf('|'),p=s.slice(0,i),v=s.slice(i+1);
    if(v==='fix'){var el=document.querySelector('.st-frame [data-nid="'+ids()[0]+'"]');v=Math.max(1,Math.round(el?(p==='layout.w'?el.offsetWidth:el.offsetHeight):100));}
    if(p==='style.text.ta')return void(say(textSet('ta',v))||ST.ui.render());
    if(p==='layout.dir'&&sel().length&&sel()[0].layout&&sel()[0].layout.dir===v)return;
    commit(p,v);}
  else if(r){if(!say(N.reset(ids(),r.split(','))))ST.ui.render();}
  else if(t){if(st()){ST.ui.toast('Сделать токеном можно в обычном виде: переключите холст на «Обычное».');return;}
    var n=sel()[0],val=N.val(n,'style.'+t);if(typeof val!=='string'||!ST.tok)return;
    var raw=ST.tok.raws(ST.p).filter(function(x){return x.id===n.id&&x.color===val.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/)[0];})[0];
    var nm=(raw&&raw.suggest)||'c-'+ST.tok.hex6(val).slice(1);
    ST.ui.confirm('Сделать токеном?',raw&&raw.suggest?'Цвет совпадает с токеном «'+raw.suggest+'». Заменить ссылкой?':'Будет создан токен «'+nm+'» с этим цветом в обеих темах; в узле цвет заменится ссылкой.','Сделать').then(function(ok){
      if(ok)say(ST.tok.promote(n.id,t.split('.'),val,nm));});}
  else if(a)act(a);}
function act(a){
  var i=ids(),r;
  if(a==='parent'){var pt=N.path(N.root(),i[0]);if(pt.length>1)N.select([pt[pt.length-2].id]);}
  else if(a==='up'||a==='down'){r=N.reorder(i[0],a==='up'?-1:1);say(r);}
  else if(a.indexOf('wsel:')===0){if(N.get(a.slice(5)))N.select([a.slice(5)]);}
  else if(a==='sdef'||a==='sclr'){var n1=sel()[0];if(!n1)return;
    if(a==='sclr')say(N.patch(i,[['states.'+N.vstate,undefined]],'состояние: убрать отличия'));
    else{var S0=n1.style||{},pr=N.vstate==='pressed'?[['style.br',92]].concat(S0.ledge&&S0.ledge.y!==0?[['style.ledge',{y:0}]]:[]):[['style.op',45],['style.sa',30]];
      say(N.patch(i,pr,'состояние: заготовка «'+N.STATE_NAME[N.vstate].toLowerCase()+'»'));}}
  else if(a==='dup')say(N.dup(i));
  else if(a==='group')say(N.group(i));
  else if(a==='ungroup')say(N.ungroup(i[0]));
  else if(a==='del')say(N.remove(i));
  else if(a.indexOf('tpreset:')===0){var k=a.slice(8),pr=ST.fonts.PRESETS.filter(function(x){return x.k===k;})[0];
    if(pr)say(N.set(i,'style.text',JSON.parse(JSON.stringify((ST.p.text&&ST.p.text[k])||pr.t)),'стиль текста: '+pr.n));}}
function syncStates(){var b=document.querySelectorAll('#st-stb [data-nst]'),i;
  for(i=0;i<b.length;i++){var on=b[i].getAttribute('data-nst')===N.vstate;b[i].classList.toggle('on',on);b[i].setAttribute('aria-pressed',on?'true':'false');}}
function refreshWarn(){var w=$('#st-warn');if(w)w.innerHTML=warnHtml();} /* после отрисовки холста: размеры кнопок берутся с него */
I.bind=function(){var b=$('#st-right');b.addEventListener('click',onClick);b.addEventListener('change',onChange);b.addEventListener('input',onInput);
  var z=$('.st-zoom');
  if(z&&!$('#st-stb')){ /* переключатель состояний лежит рядом с масштабом и сеткой */
    z.insertAdjacentHTML('beforeend','<span class="st-seg" id="st-stb" role="group" aria-label="Состояние на холсте">'+N.STATES.map(function(k){
      return '<button class="st-b" data-nst="'+k+'" aria-pressed="false">'+h(N.STATE_NAME[k])+'</button>';}).join('')+'</span>');
    z.addEventListener('click',function(e){var t=e.target.closest('[data-nst]');if(t)N.setState(t.getAttribute('data-nst'));});}
  var tm=0;ST.on(function(k){if(k==='saved'||k==='toast'||k==='error')return;syncStates();clearTimeout(tm);tm=setTimeout(refreshWarn,0);});
  syncStates();};
})();
