/* Catworking Studio: окна «Примеры» и «Импорт разметки» (Шаг 6б). Объект ST.impui. Разбор разметки делает ST.imp (st-import.js, st-impdom.js), сверку ST.impcmp (st-impcmp.js).
   Всё, что приходит из разметки, проходит ST.nodes.validate до записи в проект; сам проект меняется одним шагом истории через ST.do. */
(function(){'use strict';
var ST=window.ST,N=ST.nodes,I=ST.imp,h=ST.esc,X=ST.impui={};
var TITLES={subjects:'Предметы',sheet:'Шторка',focus:'Фокус'};
var NOTE={subjects:'список курсов и колода',sheet:'шторка меню с баннером «Импорт через ИИ»',focus:'таймер, сцена и ряд ссылок'};

/* Данные Шага 6а хранят содержимое экрана без корневого блока .s: значения токенов и стиль корня лежат отдельно. Здесь корень собирается заново. */
X.wrap=function(m){
  var st=Object.keys(m.vars||{}).map(function(k){return '--'+k+':'+m.vars[k];}).join(';')+';'+(m.rootStyle||'');
  return '<div class="s" style="'+h(st)+'">'+m.html+'</div>';};
X.mock=function(key,theme){var a=window.ST&&ST.mockups||[];for(var i=0;i<a.length;i++)if(a[i].key===key&&a[i].theme===(theme||'light'))return a[i];return null;};

function say(t){if(ST.ui&&ST.ui.toast)ST.ui.toast(t);}
function curProfile(){var s=ST.screen();return (s&&ST.prof.get(ST.p,s.profile))||ST.prof.cur(ST.p);}

/* o: {html, css, name, w, h, theme, profileId}; результат Promise({id, res, cmp}) или {error} */
X.importScreen=function(o){
  var pr=(o.profileId&&ST.prof.get(ST.p,o.profileId))||ST.prof.get(ST.p,ST.prof.WORK_ID)||curProfile();
  if(!pr)return Promise.resolve({error:'В проекте нет профиля оформления.'});
  return I.parse({html:o.html,css:o.css||'',profile:pr,theme:o.theme||'light',w:o.w||390,h:o.h||844}).then(function(res){
    var bad=N.validate({screens:[{id:'x',name:'x',root:res.root}],components:[]});
    if(bad)return {error:'Разметка не прошла проверку: '+bad+'. Проект не тронут.'};
    var id=ST.uid('s'),nm=String(o.name||'Импорт').slice(0,80);
    var ok=ST.do('импорт экрана «'+nm+'»',function(d){d.screens.push({id:id,name:nm,w:res.w,h:res.h,profile:pr.id,root:res.root});});
    if(!ok)return {error:'Экран не добавился. Проект не тронут.'};
    ST.cur=id;ST.emit('change');if(ST.ui&&ST.ui.fit)ST.ui.fit();
    var cmp=ST.impcmp?ST.impcmp.geo({html:o.html,css:o.css||'',w:res.w,h:res.h,map:res.map,screenId:id}):Promise.resolve(null);
    return cmp.then(function(c){return {id:id,res:res,cmp:c};});
  }).catch(function(e){return {error:'Не удалось разобрать разметку: '+(e&&e.message||e)+'. Проект не тронут.'};});};

function rawList(r){var seen={},out=[];r.raw.forEach(function(x){var k=x.color;if(!seen[k]){seen[k]=1;out.push(x.color+' ('+x.where+')');}});return out;}
X.reportHtml=function(name,r){
  var res=r.res,rep=res.report,c=r.cmp,raw=rawList(rep),s='<p>Экран «'+h(name)+'» добавлен: узлов '+N.count(res.root)+', размер '+res.w+'×'+res.h+'.</p>';
  s+='<p>Цветов заменено токенами: '+rep.tok+'. Осталось сырыми: '+raw.length+(raw.length?' — '+h(raw.slice(0,8).join('; ')):'')+'.</p>';
  if(rep.icons.length)s+='<p>Значков не из набора: '+rep.icons.length+' (заменены звездой).</p>';
  if(rep.notes.length){var u=[];rep.notes.forEach(function(t){if(u.indexOf(t)<0)u.push(t);});s+='<p>Передано неточно:</p><ul>'+u.slice(0,8).map(function(t){return '<li>'+h(t)+'</li>';}).join('')+(u.length>8?'<li>… и ещё '+(u.length-8)+'</li>':'')+'</ul>';}
  if(c)s+='<p>Сверка положения (допуск '+c.tol+' px): совпало '+c.ok+' из '+c.n+' узлов, '+c.pct+' %. Наибольшее расхождение '+c.max+' px'+(c.worst?' (узел «'+h(c.worst)+'»)':'')+'.</p>';
  return s;};
function done(name,r){
  if(r.error)return ST.ui.error(r.error);
  return ST.ui.modal({title:'Импорт готов',html:X.reportHtml(name,r)});}

/* ---------- «Примеры»: три экрана макета; светлая и тёмная версии показываются из токенов профиля ---------- */
X.examples=function(){
  if(!(ST.mockups&&ST.mockups.length))return ST.ui.error('Данных примеров нет: не подключён файл st-mockups.js.');
  var keys=['subjects','sheet','focus'].filter(function(k){return !!X.mock(k,'light');});
  var html='<p>Три экрана макета «Предметы». Светлая и тёмная версии в макете отличаются только значениями токенов, поэтому в студии это один экран, который показывается в обеих темах. Экран добавится в текущий проект.</p>'+
    keys.map(function(k){return '<button class="st-b st-row" data-k="'+k+'">'+h(TITLES[k])+' — '+h(NOTE[k])+'</button>';}).join('')+
    '<button class="st-b st-row" data-k="all">Добавить все три</button>';
  return ST.ui.modal({title:'Примеры',html:html,buttons:[{k:'x',t:'Закрыть'}]}).then(function(k){
    if(!k||k==='x')return;
    var list=k==='all'?keys:[k],chain=Promise.resolve(),out=[];
    list.forEach(function(key){chain=chain.then(function(){var m=X.mock(key,'light');
      return X.importScreen({html:X.wrap(m),css:m.css,name:TITLES[key]+' (пример)',w:m.w,h:m.h,theme:'light'}).then(function(r){out.push([key,r]);});});});
    return chain.then(function(){
      var bad=out.filter(function(o){return o[1].error;})[0];if(bad)return ST.ui.error(bad[1].error);
      if(out.length===1)return done(TITLES[out[0][0]],out[0][1]);
      var s=out.map(function(o){var c=o[1].cmp;return '<p><b>'+h(TITLES[o[0]])+'</b>: узлов '+N.count(o[1].res.root)+(c?', положение совпало у '+c.ok+' из '+c.n+' ('+c.pct+' %)':'')+'.</p>';}).join('');
      return ST.ui.modal({title:'Примеры добавлены',html:s});});});};

/* ---------- «Импорт разметки»: вставленный HTML (с <style> или без) ---------- */
X.paste=function(){
  var html='<p>Вставьте разметку одного экрана: HTML, при желании с блоком &lt;style&gt;. Скрипты и внешние адреса отбрасываются, в сеть ничего не уходит. Цвета, совпавшие с токенами текущего профиля, станут токенами.</p>'+
    '<label class="st-lb">Название экрана<input class="st-in" id="st-imp-name" maxlength="80" value="Импорт"></label>'+
    '<label class="st-lb">Разметка<textarea class="st-in" id="st-imp-src" rows="9" spellcheck="false" style="font-size:16px;width:100%"></textarea></label>';
  var p=ST.ui.modal({title:'Импорт разметки',html:html,buttons:[{k:'no',t:'Отмена'},{k:'go',t:'Импортировать',cls:'st-pri'}]});
  var ta=document.getElementById('st-imp-src'),nm=document.getElementById('st-imp-name');
  return p.then(function(k){
    if(k!=='go')return;
    var raw=ta?ta.value:'',name=(nm&&nm.value.trim())||'Импорт';
    if(!/\S/.test(raw))return ST.ui.error('Поле разметки пустое. Вставьте HTML экрана.');
    if(raw.length>400000)return ST.ui.error('Разметка слишком большая (больше 400 000 знаков). Проект не тронут.');
    var sp=I.split(raw),m=/<body[^>]*>([\s\S]*)<\/body>/i.exec(sp.html);
    return X.importScreen({html:m?m[1]:sp.html,css:sp.css,name:name,theme:'light'}).then(function(r){return done(name,r);});});};
})();
