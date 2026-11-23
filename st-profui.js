/* Catworking Studio: выбор профиля оформления в верхней панели (Шаг 1А). Кнопка с названием профиля активного экрана;
   окно: выбрать профиль для экрана, дублировать, переименовать, удалить. Редактор значений профиля делают Шаги 1А-2 и 2–3. */
(function(){'use strict';
var ST=window.ST,P=ST.prof,h=ST.esc,pu=ST.profui={};
function $(s){return document.querySelector(s);}
function label(){
  var b=$('#st-prof');if(!b||!ST.p)return;
  var c=P.cur(ST.p),n=c?c.name:'нет профиля',lk=c&&c.locked;
  /* на узком экране название не помещается: остаётся значок (и замок у встроенного), полное название в подсказке и для чтения с экрана */
  b.innerHTML='<span aria-hidden="true">🎨</span><span class="st-pl"> '+h(n)+(lk?' 🔒':'')+' ▾</span>'+(lk?'<span class="st-pk" aria-hidden="true">🔒</span>':'');
  b.title='Профиль экрана: '+n;b.setAttribute('aria-label','Профиль экрана: '+n+(lk?' (встроенный, только чтение)':''));}
pu.mount=function(){
  var top=$('.st-top');if(!top||$('#st-prof'))return;
  var b=document.createElement('button');b.className='st-b';b.id='st-prof';b.setAttribute('data-st','prof');
  b.style.cssText='max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  if(!$('#st-prof-css')){var st=document.createElement('style');st.id='st-prof-css';
    st.textContent='#st-prof .st-pk{display:none}@media (max-width:640px){#st-prof .st-pl{display:none}#st-prof .st-pk{display:inline}}';
    document.head.appendChild(st);}
  var after=$('#st-pname');
  if(after&&after.parentNode===top)top.insertBefore(b,after.nextSibling);else top.appendChild(b);
  label();};
/* окно с полем ввода: значение читается до закрытия окна (после закрытия элемент уходит из страницы) */
function ask(title,def,okText){
  var m=ST.ui.modal({title:title,html:'<label class="st-lb">Название профиля<input class="st-in" id="st-pn" maxlength="60" value="'+h(def)+'"></label>',
    buttons:[{k:'no',t:'Отмена'},{k:'ok',t:okText,cls:'st-pri'}]});
  var inp=document.getElementById('st-pn');
  return m.then(function(k){return k==='ok'&&inp?inp.value:null;});}
function freeName(base){var n=base,i=2;while(P.checkName(ST.p,n))n=base+' ('+(i++)+')';return n;}
function fail(r){if(r&&r.error)ST.ui.error(r.error);return !(r&&r.error);}
pu.open=function(){
  var p=ST.p,cur=p&&P.cur(p),sc=ST.screen();if(!cur)return;
  var rows=P.list(p).map(function(pr){
    return '<button class="st-b st-row'+(pr.id===cur.id?' on':'')+'" data-k="set:'+h(pr.id)+'">'+(pr.locked?'🔒 ':'')+h(pr.name)+
      '<span class="st-mut"> · '+h(P.SCOPE_NAME[pr.scope]||pr.scope)+(pr.id===cur.id?' · выбран':'')+'</span></button>';}).join('');
  var info='<p class="st-mut">Профиль экрана «'+h(sc?sc.name:'')+'»: цвета, шрифты и форма берутся из него, узлы не меняются. '+
    '🔒 встроенные профили только для чтения: чтобы править, нажмите «Дублировать».</p>';
  return ST.ui.modal({title:'Профиль оформления',html:info+rows,buttons:[
    {k:'dup',t:'Дублировать'},{k:'ren',t:'Переименовать'},{k:'del',t:'Удалить',cls:'st-danger'},{k:'x',t:'Закрыть'}]}).then(function(k){
    if(!k||k==='x')return;
    if(k.indexOf('set:')===0){var r=P.setCurrent(k.slice(4));if(fail(r)&&sc)ST.ui.toast('Профиль экрана: '+P.get(ST.p,k.slice(4)).name);return;}
    if(k==='dup')return ask('Дублировать профиль «'+cur.name+'»',freeName('Копия «'+cur.name+'»'),'Создать').then(function(v){
      if(v===null)return;var r=P.create(cur.id,v,sc&&sc.id);if(fail(r))ST.ui.toast('Профиль «'+v.trim()+'» создан и назначен экрану');});
    if(k==='ren')return ask('Переименовать профиль',cur.name,'Готово').then(function(v){if(v===null)return;fail(P.rename(cur.id,v));});
    if(k==='del')return pickDelete();
  });};
/* удалить можно только свой профиль, который не используют ни экраны, ни компоненты: выбирается из списка */
function pickDelete(){
  var p=ST.p,list=P.list(p).filter(function(q){return !q.locked&&!P.usage(p,q.id).length;});
  if(!list.length)return ST.ui.modal({title:'Удалять нечего',html:'<p>Встроенные профили не удаляются, а профиль, который используют экран или компонент, удалить нельзя. '+
    'Назначьте экрану другой профиль, и прежний можно будет удалить.</p>'});
  return ST.ui.modal({title:'Какой профиль удалить?',html:'<p class="st-mut">Удалённое можно вернуть кнопкой «Отменить».</p>'+list.map(function(q){
    return '<button class="st-b st-row" data-k="d:'+h(q.id)+'">'+h(q.name)+'</button>';}).join(''),buttons:[{k:'x',t:'Отмена'}]}).then(function(k){
    if(!k||k.indexOf('d:')!==0)return;var q=P.get(ST.p,k.slice(2));if(!q)return;
    return ST.ui.confirm('Удалить профиль «'+q.name+'»?','Профиль исчезнет из списка. Вернуть его можно кнопкой «Отменить».','Удалить',true).then(function(ok){
      if(ok&&fail(P.remove(q.id)))ST.ui.toast('Профиль «'+q.name+'» удалён');});});}
pu.bind=function(){
  document.addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('[data-st]');if(!t)return;
    var a=t.getAttribute('data-st');
    if(a==='prof')pu.open();
    else if(a.indexOf('scr:')===0)setTimeout(label,0); /* экран выбран в слоях: профиль может быть другим */
  });
  ST.on(function(k){if(k==='load'||k==='change'||k==='saved')label();});
};
pu.bind();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pu.mount);else pu.mount();
})();
