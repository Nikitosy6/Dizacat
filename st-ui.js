/* Catworking Studio: интерфейс студии (панели, окна, меню проекта) */
(function(){'use strict';
var ST=window.ST,ui=ST.ui={tab:'layers',sheet:''},h=ST.esc;
function $(s){return document.querySelector(s);}
function fmt(t){var d=new Date(t);function p(x){return (x<10?'0':'')+x;}
  return p(d.getDate())+'.'+p(d.getMonth()+1)+' '+p(d.getHours())+':'+p(d.getMinutes());}

ui.toast=function(m){var t=$('#st-toast');t.textContent=m;t.className='st-toast on';
  clearTimeout(ui._tt);ui._tt=setTimeout(function(){t.className='st-toast';},2600);};
/* modal({title, html, buttons:[{k,t,cls}]}) -> Promise(ключ кнопки или null) */
ui.modal=function(o){
  return new Promise(function(res){
    var m=document.createElement('div');m.className='st-mdl';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
    var b=(o.buttons||[{k:'ok',t:'Понятно',cls:'st-pri'}]).map(function(x){
      return '<button class="st-b '+(x.cls||'')+'" data-k="'+h(x.k)+'">'+h(x.t)+'</button>';}).join('');
    m.innerHTML='<div class="st-mdl-box"><h2>'+h(o.title)+'</h2><div class="st-mdl-body">'+(o.html||'')+'</div><div class="st-mdl-btns">'+b+'</div></div>';
    function close(k){document.removeEventListener('keydown',key,true);m.remove();ui._close=null;res(k);}
    function key(e){if(e.key==='Escape'){e.stopPropagation();close(null);}}
    m.addEventListener('click',function(e){
      var t=e.target.closest('[data-k]');
      if(t){close(t.getAttribute('data-k'));}else if(e.target===m){close(null);}});
    document.addEventListener('keydown',key,true);
    document.body.appendChild(m);ui._close=close;
    var f=m.querySelector('.st-pri')||m.querySelector('button');if(f)f.focus();
  });
};
ui.error=function(t){return ui.modal({title:'Что-то пошло не так',html:'<p>'+h(t)+'</p>'});};
ui.confirm=function(title,text,ok,danger){
  return ui.modal({title:title,html:'<p>'+h(text)+'</p>',buttons:[{k:'no',t:'Отмена'},{k:'ok',t:ok||'Да',cls:danger?'st-danger':'st-pri'}]})
    .then(function(k){return k==='ok';});
};
function backup(){ /* страховка: текущий проект уходит в «Версии» перед заменой */
  return ST.p?ST.io.snap(JSON.stringify(ST.p),ST.title()).catch(function(){}):Promise.resolve();
}
ui.menu=function(){
  var items=[['new','Новый проект'],['open','Открыть файл .json'],['save','Сохранить в файл .json'],['snaps','Версии (автокопии)']];
  return ui.modal({title:ST.title(),html:items.map(function(x){
    return '<button class="st-b st-row" data-k="'+x[0]+'">'+x[1]+'</button>';}).join(''),buttons:[{k:'x',t:'Закрыть'}]})
  .then(function(k){
    if(k==='new')return ui.confirm('Новый проект','Текущий проект сохранится в «Версиях». Создать пустой?','Создать').then(function(ok){
      if(ok)return backup().then(function(){ST.set(ST.blank(),{dirty:true});ui.fit();});});
    if(k==='open')return ST.io.open().then(function(r){
      if(r.cancel)return;
      if(r.error)return ui.error('Файл не открылся: '+r.error+'. Текущий проект не тронут.');
      return backup().then(function(){ST.set(r.project,{dirty:true});ui.fit();ui.toast('Проект открыт');});});
    if(k==='save'){
      var pr=ST.tok?ST.tok.problems(ST.p):[];
      var go=pr.length?ui.confirm('Есть токены без значения','Токенов с проблемами: '+pr.length+' (не заданы в обеих темах или неверный цвет). Файл сохранится, но дизайн лучше сначала исправить. Сохранить сейчас?','Сохранить'):Promise.resolve(true);
      return go.then(function(ok){if(ok){var n=ST.io.download(ST.p);ui.toast('Файл '+n+' скачан (папка «Загрузки»)');}});}
    if(k==='snaps')return ui.snaps();
  });
};
ui.snaps=function(){
  return ST.io.snaps().then(function(a){
    if(!a.length)return ui.modal({title:'Версии',html:'<p>Автокопий пока нет. Студия делает копию примерно раз в 5 минут работы и перед заменой проекта (хранится 20 последних).</p>'});
    return ui.modal({title:'Версии',html:a.map(function(x){
      return '<button class="st-b st-row" data-k="'+x.id+'">'+fmt(x.t)+' · '+h(x.name||'проект')+'</button>';}).join(''),
      buttons:[{k:'x',t:'Закрыть'}]}).then(function(k){
        if(!k||k==='x')return;
        return ST.io.snapGet(Number(k)).then(function(r){
          if(r.error)return ui.error('Версия не открылась: '+r.error);
          return ui.confirm('Вернуть версию','Текущий проект сохранится в «Версиях», затем откроется выбранная.','Вернуть').then(function(ok){
            if(ok)return backup().then(function(){ST.set(r.project,{dirty:true});ui.fit();});});});});
  }).catch(function(e){return ui.error('Не удалось прочитать версии: '+e.message);});
};
function theme(){var t=localStorage.getItem('st-theme');if(t)document.documentElement.setAttribute('data-st-theme',t);}
function toggleTheme(){
  var d=document.documentElement,dark=d.getAttribute('data-st-theme')?d.getAttribute('data-st-theme')==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
  var t=dark?'light':'dark';d.setAttribute('data-st-theme',t);try{localStorage.setItem('st-theme',t);}catch(e){}
}
ui.fit=function(){ST.canvas.fit();};
ui.sheetTo=function(n){
  ui.sheet=ui.sheet===n?'':n;
  $('#st-left').classList.toggle('open',ui.sheet==='left');
  $('#st-right').classList.toggle('open',ui.sheet==='right');
  var b=document.querySelectorAll('.st-dock .st-b');
  b[0].classList.toggle('on',ui.sheet==='left');b[1].classList.toggle('on',ui.sheet==='right');
};
ui.render=function(){
  if(!ST.p)return;
  var sc=ST.screen();
  $('#st-pname').textContent=ST.title()+' ▾';
  $('#st-undo').disabled=!ST.undoS.length;$('#st-redo').disabled=!ST.redoS.length;
  $('#st-stat').textContent=ST.dirty?'сохраняется…':'сохранено';
  var bw=ST.tokui?ST.tokui.badge():0,fw=ST.fontui?ST.fontui.badge():0;
  $('#st-tabs').innerHTML=[['layers','Слои'],['comp','Компоненты'],['tok','Токены'],['font','Шрифты']].map(function(x){
    return '<button class="st-b'+(ui.tab===x[0]?' on':'')+'" data-st="tab:'+x[0]+'">'+x[1]+(x[0]==='tok'&&bw?' <span class="st-warn" aria-label="Предупреждений: '+bw+'">⚠'+bw+'</span>':'')+(x[0]==='font'&&fw?' <span class="st-warn" aria-label="Предупреждений: '+fw+'">⚠'+fw+'</span>':'')+'</button>';}).join('');
  var L=$('#st-lbody');
  if(ui.tab==='layers'){
    L.innerHTML=ST.p.screens.map(function(s){
      return '<button class="st-b st-row'+(sc&&s.id===sc.id?' on':'')+'" data-st="scr:'+h(s.id)+'">'+h(s.name)+'</button>';}).join('')+
      '<button class="st-b st-row" data-st="addscr">＋ Экран</button>';
  }else if(ui.tab==='tok'&&ST.tokui)L.innerHTML=ST.tokui.list();
  else if(ui.tab==='font'&&ST.fontui)L.innerHTML=ST.fontui.list();
  else L.innerHTML='<p class="st-mut">Компоненты появятся в Шаге 5.</p>';
  $('#st-rbody').innerHTML=(ui.tab==='tok'&&ST.tokui?ST.tokui.inspector()+'<div class="st-lh">Проект</div>':ui.tab==='font'&&ST.fontui?ST.fontui.inspector()+'<div class="st-lh">Проект</div>':'')+'<label class="st-lb">Название проекта<input class="st-in" data-f="pname" maxlength="80" value="'+h(ST.title())+'"></label>'+
    (sc?'<label class="st-lb">Название экрана<input class="st-in" data-f="sname" maxlength="80" value="'+h(sc.name)+'"></label>'+
    '<p class="st-mut">Размер экрана: '+h(sc.w)+'×'+h(sc.h)+'</p>':'')+
    '<p class="st-mut">Шагов в истории: '+ST.undoS.length+' из '+ST.HIST_MAX+'</p>';
  if(ST.tokui)ST.tokui.sync();
  ST.canvas.render();
};
function bind(){
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-st]');
    if(!t){if(ui.sheet&&e.target.closest('#st-main'))ui.sheetTo(ui.sheet);return;}
    var a=t.getAttribute('data-st');
    if(a==='menu')ui.menu();
    else if(a==='undo')ST.undo();
    else if(a==='redo')ST.redo();
    else if(a==='theme')toggleTheme();
    else if(a==='pth')ST.tok.cycleView();
    else if(a==='left'||a==='right')ui.sheetTo(a);
    else if(a==='zin')ST.canvas.zoomBy(0.1);
    else if(a==='zout')ST.canvas.zoomBy(-0.1);
    else if(a==='zfit')ui.fit();
    else if(a==='addscr')ST.addScreen();
    else if(a.indexOf('tab:')===0){ui.tab=a.slice(4);ui.render();}
    else if(a.indexOf('scr:')===0){ST.cur=a.slice(4);ui.render();}
  });
  $('#st-rbody').addEventListener('change',function(e){
    var f=e.target.getAttribute('data-f'),v=e.target.value.trim();
    if(f==='pname')ST.renameProject(v||'Без названия');
    else if(f==='sname'&&ST.screen())ST.renameScreen(ST.screen().id,v||'Без названия');
  });
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&!/INPUT|TEXTAREA/.test(e.target.tagName)){
      var k=e.key.toLowerCase();
      if(k==='z'){e.preventDefault();if(e.shiftKey)ST.redo();else ST.undo();}
      else if(k==='y'){e.preventDefault();ST.redo();}
    }else if(e.key==='Escape'&&ui.sheet)ui.sheetTo(ui.sheet);
  });
  window.addEventListener('resize',function(){ST.canvas.render();});
}
ui.boot=function(){
  theme();ST.io.watch();bind();if(ST.tokui)ST.tokui.bind();if(ST.fontui)ST.fontui.bind();
  ST.on(function(k,a){
    if(k==='error')ui.error(a);else if(k==='toast')ui.toast(a);else if(k!=='saved')ui.render();else $('#st-stat').textContent='сохранено';});
  ST.io.load().then(function(r){
    if(r.project)ST.set(r.project);
    else{
      ST.set(ST.blank());
      if(r.error){ST.io.keepCorrupt(r.raw);
        ui.error('Сохранённый проект повреждён: '+r.error+'. Копия повреждённых данных сохранена, начат новый проект. Старый можно открыть из файла .json или из «Версий».');}
    }
    ui.fit();
  }).catch(function(e){ST.set(ST.blank());ui.fit();
    ui.error('Хранилище браузера недоступно: '+e.message+'. Работать можно, но сохраняйте проект в файл .json.');});
};
})();
