/* Catworking Studio: окно «Экспорт» (Шаг 7, пп. 1, 6, 7). Объект ST.expui.
   Экспортируется только выбранный экран или мастер (не весь проект). Режим берётся из профиля экрана. Каждый блок копируется отдельной кнопкой; пакет и JSON скачиваются файлом.
   Кнопки «Скопировать» заблокированы, пока есть ошибки экспорта или самопроверка нашла расхождения (ST.exp.check). */
(function(){'use strict';
var ST=window.ST,X=ST.exp,h=ST.esc,U=ST.expui={},S={prefix:'sj',extra:'',err:'',r:null,chk:null,busy:false,unlocked:false,seq:0},box=null;
try{var sv=localStorage.getItem('st-exp-prefix');if(sv&&/^[a-z][a-z0-9]{1,5}$/.test(sv))S.prefix=sv;}catch(e){}

function copyText(t){
  function fb(){var a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;left:-9999px;top:0;font-size:16px';
    (box||document.body).appendChild(a);a.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}a.remove();return ok;}
  if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).then(function(){return true;},function(){return fb();});
  return Promise.resolve(fb());}
function save(name,text,type){
  var url=URL.createObjectURL(new Blob([text],{type:type||'text/plain;charset=utf-8'})),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
function say(t){if(ST.ui&&ST.ui.toast)ST.ui.toast(t);}

/* блоки выдачи: [ключ, заголовок, пояснение, текст] */
function blocks(r){
  var b=[['pkg','Пакет для ИИ-кодера (.md)','Один файл: промпт, CSS, разметка, строки, чек-лист. Его вставляют в чат с ИИ-кодером приложения.',r.pkg]];
  if(r.mode!=='skin'){
    b.push(['css','CSS (файл '+r.fileCss+')','Только классы .'+r.prefix+'-… и var(--…), без глобальных селекторов.',r.css.text]);
    b.push(['tok',r.mode==='module'?'Значения токенов (в начало '+r.fileCss+')':'Токены (в styles.css)','Три блока: тёмная, светлая через @media, светлая принудительно.',r.tb.text||'/* новых переменных не нужно */']);
    b.push(['js','Разметка (файл '+r.fileJs+')','Функция '+r.ns+'.'+r.fn+'(d): строка HTML, esc() и T() как в приложении.',r.js]);
    b.push(['dict','Строки ru и en','Ключи '+r.prefix+'_…; английский пока равен русскому.',r.dict||'/* текстов нет */']);
    b.push(['act','Действия data-a','Заготовки для '+r.ns+'.act: объявить до boot-файла.',r.actCode||'/* кнопок с действиями нет */']);
    b.push(['files','Файлы и шрифты','Что положить в проект и добавить в sw.js → CORE.',r.files+(r.fonts.face?'\n\n'+r.fonts.face:'')]);
  }else b.push(['tok','Блоки скина (в styles.css)','Три блока :root[data-skin=…].',r.tb.text]);
  if(r.rate)b.push(['rate','Кнопки оценки (контраст)','Переопределение жёстких цветов .rate .btn.',r.rate]);
  b.push(['json','JSON узлов','Для повторного открытия экрана в студии.',r.json]);
  return b;}
function list(a,cls){return a.length?'<ul class="'+cls+'">'+a.map(function(x){return '<li>'+h(x)+'</li>';}).join('')+'</ul>':'';}
function locked(){return !S.r||S.r.errors.length>0||(S.chk&&!S.chk.ok&&!S.unlocked)||S.busy;}

function view(){
  var r=S.r,sc=ST.screen(),o='';
  o+='<p class="st-mut">Экран «'+h(sc?sc.name:'')+'»'+(r?': режим <b>'+h(X.MODE_NAME[r.mode])+'</b> по профилю «'+h(r.pr.name)+'»':'')+'. Режим меняется профилем экрана (вкладка «Профиль»).</p>';
  o+='<label class="st-lb">Модуль (префикс)<input class="st-in" id="st-exp-prefix" maxlength="6" autocapitalize="off" autocomplete="off" spellcheck="false" value="'+h(S.prefix)+'"></label>';
  if(!r||r.mode==='module')o+='<label class="st-lb">Дополнительные селекторы шторок и окон (через запятую, необязательно)<input class="st-in" id="st-exp-extra" autocapitalize="off" autocomplete="off" spellcheck="false" value="'+h(S.extra)+'"></label>';
  o+='<button class="st-b st-pri" data-x="run"'+(S.busy?' disabled':'')+'>'+(S.busy?'Проверяю…':'Собрать экспорт')+'</button>';
  if(S.err)o+='<p class="st-exp-err" role="alert">'+h(S.err)+'</p>';
  if(!r)return o;
  if(r.errors.length)o+='<div class="st-exp-st st-exp-bad" role="alert"><b>Экспорт заблокирован: '+r.errors.length+' ошиб.</b>'+list(r.errors.slice(0,12),'')+'</div>';
  if(S.chk){var c=S.chk;
    if(c.skipped)o+='<div class="st-exp-st">'+h(c.note)+'</div>';
    else if(c.ok&&!c.bad.length)o+='<div class="st-exp-st st-exp-ok">✓ Самопроверка: совпало '+c.n+' узлов в светлой и тёмной теме (допуск '+c.tol+' px)'+(r.mode==='module'?', утечки стиля нет':'')+'.</div>';
    else if(c.ok)o+='<div class="st-exp-st">⚠ '+h(c.note)+list(c.bad.slice(0,6),'')+'</div>';
    else o+='<div class="st-exp-st st-exp-bad" role="alert"><b>✗ Самопроверка нашла расхождения с холстом ('+(c.bad.length+c.leak.length)+'). Копирование заблокировано.</b>'+list(c.leak.concat(c.bad).slice(0,10),'')+
      (S.unlocked?'':'<button class="st-b" data-x="unlock">Всё равно показать код (на свой риск)</button>')+'</div>';}
  else if(S.busy)o+='<div class="st-exp-st">Самопроверка: подставляю экспорт в изолированное окно и сравниваю с холстом…</div>';
  blocks(r).forEach(function(b){var k=b[0],dis=locked()?' disabled':'';
    o+='<section class="st-exp-blk"><div class="st-exp-h"><b>'+h(b[1])+'</b><span class="st-mut">'+h(b[2])+'</span></div><div class="st-exp-btns">'
      +'<button class="st-b st-pri" data-x="copy" data-k="'+k+'"'+dis+'>Скопировать</button>'
      +(k==='pkg'?'<button class="st-b" data-x="md"'+dis+'>Скачать .md</button>':k==='json'?'<button class="st-b" data-x="jsn"'+dis+'>Скачать .json</button>':'')
      +'</div><details><summary>Показать</summary><pre class="st-exp-pre">'+h(b[3])+'</pre></details></section>';});
  var rep='';
  if(r.warns.length)rep+='<p><b>Предупреждения ('+r.warns.length+')</b></p>'+list(r.warns.slice(0,30),'');
  if(r.notes.length)rep+='<p><b>Примечания</b></p>'+list(r.notes,'');
  if(rep)o+='<section class="st-exp-blk">'+rep+'</section>';
  return o;}

function paint(){var b=box&&box.querySelector('.st-mdl-body');if(!b)return;var y=b.scrollTop;b.innerHTML=view();b.scrollTop=y;}
function run(){
  var id=ST.screen()&&ST.screen().id,seq=++S.seq;S.err='';S.r=null;S.chk=null;S.unlocked=false;
  try{localStorage.setItem('st-exp-prefix',S.prefix);}catch(e){}
  var r=X.make(ST.p,{id:id,prefix:S.prefix,extra:S.extra});
  if(r.error){S.err=r.error;paint();return;}
  S.r=r;S.busy=!r.errors.length;paint();
  if(r.errors.length)return;
  X.check(r,ST.p).then(function(c){if(seq!==S.seq)return;S.chk=c;S.busy=false;paint();});}
function close(){if(!box)return;document.removeEventListener('keydown',key,true);box.remove();box=null;S.seq++;}
function key(e){if(e.key==='Escape'&&box){e.stopPropagation();close();}}
function blockText(k){var a=blocks(S.r);for(var i=0;i<a.length;i++)if(a[i][0]===k)return a[i][3];return '';}

U.open=function(){
  if(!ST.p||!ST.screen())return;
  if(box)close();
  S.r=null;S.chk=null;S.err='';S.busy=false;S.unlocked=false;
  box=document.createElement('div');box.className='st-mdl st-exp';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
  box.innerHTML='<div class="st-mdl-box st-exp-box"><h2>Экспорт</h2><div class="st-mdl-body"></div><div class="st-mdl-btns"><button class="st-b" data-x="close">Закрыть</button></div></div>';
  box.addEventListener('click',function(e){
    if(e.target===box){close();return;}
    var t=e.target.closest('[data-x]');if(!t||t.disabled)return;var a=t.getAttribute('data-x');
    if(a==='close')close();
    else if(a==='run')run();
    else if(a==='unlock')ST.ui.confirm('Расхождения не исправлены','Студия нашла расхождения между холстом и экспортом. Код может выглядеть в приложении не так, как на холсте. Показать и разрешить копирование?','Показать',true).then(function(ok){if(ok){S.unlocked=true;paint();}});
    else if(a==='copy'){var k=t.getAttribute('data-k');copyText(blockText(k)).then(function(ok){say(ok?'Скопировано':'Не удалось скопировать: откройте «Показать» и выделите текст вручную');});}
    else if(a==='md'){save(S.r.prefix+'-'+S.r.screen.slug+'-package.md',S.r.pkg,'text/markdown;charset=utf-8');say('Файл пакета скачан (папка «Загрузки»)');}
    else if(a==='jsn'){save(S.r.prefix+'-'+S.r.screen.slug+'.json',S.r.json,'application/json');say('Файл JSON скачан (папка «Загрузки»)');}});
  box.addEventListener('input',function(e){
    if(e.target.id==='st-exp-prefix')S.prefix=e.target.value.trim().toLowerCase();
    else if(e.target.id==='st-exp-extra')S.extra=e.target.value;});
  document.addEventListener('keydown',key,true);
  document.body.appendChild(box);paint();run();};
})();
