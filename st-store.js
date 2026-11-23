/* Catworking Studio: проект, команды, история (отмена/возврат). Только данные, без DOM. */
(function(){'use strict';
var ST=window.ST=window.ST||{};
ST.SCHEMA=7; ST.HIST_MAX=50;
ST.p=null; ST.cur=null; ST.dirty=false; ST.undoS=[]; ST.redoS=[];
var n=0,hs=[];
function isO(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
ST.uid=function(p){n++;return (p||'n')+Date.now().toString(36)+n.toString(36)+Math.random().toString(36).slice(2,5);};
ST.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
ST.on=function(f){hs.push(f);};
ST.emit=function(k,a){hs.slice().forEach(function(f){try{f(k,a);}catch(e){if(window.console)console.error(e);}});};
ST.blank=function(name){
  var d={schema:ST.SCHEMA,meta:{name:name||'Новый проект',created:Date.now(),updated:Date.now()},
    components:[],assets:{},
    screens:[{id:ST.uid('s'),name:'Экран 1',w:390,h:844,
      root:{id:ST.uid('n'),type:'frame',name:'Экран',layout:{dir:'column'},style:{},props:{},children:[]}}]};
  ST.prof.seed(d); /* профили оформления: рабочая копия «Макеты Nunito» и пять встроенных; токены, шрифты и текст лежат в профилях (Шаги 1А, 2, 3) */
  return ST.prof.adopt(d);
};
/* Шаги обновления схемы. 1→2 (Шаг 2): tokens.info и tokens.grad; пустой набор токенов заполняется начальным.
   2→3 (Шаг 3): fonts (гарнитура по ролям) и text (стили текста); недостающее добавляется, чужое не трогается.
   5→6 (Шаг 1А): profiles; прежние tokens, fonts, text уходят в профиль «Макеты Nunito (проект)», экраны и компоненты получают его id. */
ST.migrate=function(p){
  if(p.schema<2){
    p.tokens.info=isO(p.tokens.info)?p.tokens.info:{};p.tokens.grad=isO(p.tokens.grad)?p.tokens.grad:{};
    if(!Object.keys(p.tokens.light).length&&!Object.keys(p.tokens.dark).length&&ST.tok)ST.tok.seed(p);
    p.schema=2;
  }
  if(p.schema<3){if(ST.fonts)ST.fonts.seed(p);p.schema=3;}
  if(p.schema<4){if(ST.nodes)ST.nodes.normalize(p);p.schema=4;} /* 3→4 (Шаг 4): у каждого узла есть layout, style, props, children, name */
  if(p.schema<5)p.schema=5; /* 4→5 (Шаг 4, п. 5): у узла может быть states (отличия вида в состояниях «нажато» и «выключено»); поле необязательное, старые проекты не меняются */
  if(p.schema<6){ST.prof.migrate(p);p.schema=6;} /* 5→6 (Шаг 1А): профили оформления */
  if(p.schema<7)p.schema=7; /* 6→7 (Шаг 5): узлы типа instance (экземпляры мастеров) и поля мастеров в components; старые проекты не меняются */
  return p;
};
ST.validate=function(p){
  if(!isO(p))return 'в файле нет проекта';
  if(typeof p.schema!=='number')return 'нет номера версии схемы (поле schema)';
  if(p.schema>ST.SCHEMA)return 'проект создан в более новой версии студии (схема '+p.schema+')';
  if(p.schema<1)return 'неизвестная версия схемы';
  if(!isO(p.meta))return 'нет раздела meta';
  if(p.schema<6){ /* до профилей токены, шрифты и текст лежали в проекте; с версии 6 они в profiles (ST.prof.validate) */
    if(!isO(p.tokens)||!isO(p.tokens.light)||!isO(p.tokens.dark))return 'нет раздела tokens (light и dark)';
    if((p.tokens.info!==undefined&&!isO(p.tokens.info))||(p.tokens.grad!==undefined&&!isO(p.tokens.grad)))return 'повреждён раздел tokens (info или grad)';
    if(ST.fonts){var fe=ST.fonts.validate(p);if(fe)return fe;}
  }
  if(!Array.isArray(p.components)||!isO(p.assets))return 'нет раздела components или assets';
  if(!Array.isArray(p.screens))return 'нет списка экранов';
  for(var i=0;i<p.screens.length;i++){var s=p.screens[i];
    if(!isO(s)||typeof s.id!=='string'||!isO(s.root)||!Array.isArray(s.root.children))return 'экран №'+(i+1)+' повреждён';}
  if(p.schema>=6){var pe=ST.prof.validate(p);if(pe)return pe;}
  if(ST.nodes){var ne=ST.nodes.validate(p);if(ne)return ne;}
  if(ST.comp){var ce=ST.comp.validate(p);if(ce)return ce;}
  return '';
};
ST.title=function(){return (ST.p&&ST.p.meta&&ST.p.meta.name)||'Без названия';};
ST.screen=function(){
  if(!ST.p)return null;
  var a=ST.p.screens,c=ST.p.components||[],i;
  for(i=0;i<a.length;i++)if(a[i].id===ST.cur)return a[i];
  for(i=0;i<c.length;i++)if(isO(c[i])&&c[i].id===ST.cur&&isO(c[i].root))return c[i]; /* правка мастера (Шаг 5): мастер ведёт себя как экран */
  return a[0]||null;
};
ST.set=function(p,o){
  ST.p=ST.prof.adopt(p);ST.undoS=[];ST.redoS=[];ST.dirty=false;
  ST.cur=p.screens[0]?p.screens[0].id:null;
  ST.emit('load');
  if(o&&o.dirty){ST.dirty=true;ST.emit('change');}
};
/* Единственный путь изменения проекта: fn правит копию; при ошибке проект не меняется. */
ST.do=function(label,fn){
  var before=JSON.stringify(ST.p),d=ST.prof.adopt(JSON.parse(before));
  try{fn(d);}catch(e){ST.emit('error','Действие «'+label+'» не выполнено: '+e.message);return false;}
  var after=JSON.stringify(d);
  if(after===before)return false;
  d.meta.updated=Date.now();
  ST.undoS.push({label:label,s:before});
  if(ST.undoS.length>ST.HIST_MAX)ST.undoS.shift();
  ST.redoS.length=0;ST.p=d;ST.dirty=true;ST.emit('change');
  return true;
};
function step(from,to,msg){
  var h=from.pop();if(!h)return false;
  to.push({label:h.label,s:JSON.stringify(ST.p)});
  ST.p=ST.prof.adopt(JSON.parse(h.s));ST.dirty=true;ST.emit('change');ST.emit('toast',msg+h.label);
  return true;
}
ST.undo=function(){return step(ST.undoS,ST.redoS,'Отменено: ');};
ST.redo=function(){return step(ST.redoS,ST.undoS,'Возвращено: ');};
ST.renameProject=function(v){return ST.do('название проекта',function(d){d.meta.name=v;});};
ST.renameScreen=function(id,v){return ST.do('название экрана',function(d){
  d.screens.forEach(function(s){if(s.id===id)s.name=v;});(d.components||[]).forEach(function(c){if(isO(c)&&c.id===id)c.name=v;});});};
ST.addScreen=function(){
  var id=ST.uid('s'),cs=ST.screen(),pf=(cs&&cs.profile)||ST.prof.WORK_ID; /* новый экран получает профиль текущего */
  var ok=ST.do('новый экран',function(d){d.screens.push({id:id,name:'Экран '+(d.screens.length+1),w:390,h:844,profile:pf,
    root:{id:ST.uid('n'),type:'frame',name:'Экран',layout:{dir:'column'},style:{},props:{},children:[]}});});
  if(ok){ST.cur=id;ST.emit('change');}
  return ok;
};
})();
