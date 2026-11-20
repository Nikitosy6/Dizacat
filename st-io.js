/* Catworking Studio: хранение (IndexedDB), автосохранение, версии, файлы .json */
(function(){'use strict';
var ST=window.ST,io=ST.io={cfg:{db:'catworking-studio',ls:'st-current'},warned:false,lastSnap:0};
var dbp=null,sn=0,SNAP_MAX=20,SNAP_EVERY=300000;
function open(){
  if(dbp)return dbp;
  dbp=new Promise(function(res,rej){
    if(!window.indexedDB){rej(new Error('IndexedDB недоступен'));return;}
    var r=indexedDB.open(io.cfg.db,1);
    r.onupgradeneeded=function(){r.result.createObjectStore('kv');r.result.createObjectStore('snaps',{keyPath:'id'});};
    r.onsuccess=function(){res(r.result);};
    r.onerror=function(){rej(r.error||new Error('не открылась база'));};
  });
  dbp.catch(function(){dbp=null;});
  return dbp;
}
function tx(store,mode,fn){
  return open().then(function(d){return new Promise(function(res,rej){
    var t=d.transaction(store,mode),o=t.objectStore(store),out=fn(o);
    t.oncomplete=function(){res(out&&out.result);};
    t.onerror=t.onabort=function(){rej(t.error||new Error('сбой транзакции'));};
  });});
}
io.reset=function(){dbp=null;};
io.save=function(txt){
  return tx('kv','readwrite',function(o){return o.put(txt,'current');}).catch(function(){
    localStorage.setItem(io.cfg.ls,txt);}); /* если и это не вышло, ошибка уйдёт выше */
};
io.parse=function(txt){
  var p;
  try{p=JSON.parse(txt);}catch(e){return {error:'это не файл проекта ('+e.message+')',raw:txt};}
  var err=ST.validate(p);if(err)return {error:err,raw:txt};
  try{p=ST.migrate(p);}catch(e){return {error:'не удалось обновить формат: '+e.message,raw:txt};}
  return {project:p};
};
io.load=function(){
  return tx('kv','readonly',function(o){return o.get('current');}).catch(function(){
    try{return localStorage.getItem(io.cfg.ls);}catch(e){return null;}
  }).then(function(txt){return txt?io.parse(txt):{};});
};
io.keepCorrupt=function(raw){
  return tx('kv','readwrite',function(o){return o.put({t:Date.now(),raw:raw},'corrupt');}).catch(function(){});
};
io.snap=function(txt,name){
  sn++;
  var rec={id:Date.now()*1000+(sn%1000),t:Date.now(),name:name||'',s:txt};
  return tx('snaps','readwrite',function(o){return o.put(rec);}).then(function(){
    return tx('snaps','readonly',function(o){return o.getAllKeys();});
  }).then(function(keys){
    keys.sort(function(a,b){return a-b;});
    var extra=keys.slice(0,Math.max(0,keys.length-SNAP_MAX));
    if(!extra.length)return;
    return tx('snaps','readwrite',function(o){extra.forEach(function(k){o.delete(k);});});
  });
};
io.snaps=function(){
  return tx('snaps','readonly',function(o){return o.getAll();}).then(function(a){
    return a.map(function(r){return {id:r.id,t:r.t,name:r.name};}).sort(function(x,y){return y.id-x.id;});
  });
};
io.snapGet=function(id){
  return tx('snaps','readonly',function(o){return o.get(id);}).then(function(r){return r?io.parse(r.s):{error:'версия не найдена'};});
};
io.flush=function(){
  clearTimeout(io._t);
  if(!ST.dirty||!ST.p)return Promise.resolve();
  var p=ST.p,txt=JSON.stringify(p);
  return io.save(txt).then(function(){
    if(ST.p===p){ST.dirty=false;ST.emit('saved');}
    var now=Date.now();
    if(now-io.lastSnap>SNAP_EVERY){io.lastSnap=now;return io.snap(txt,p.meta.name).catch(function(){});}
  }).catch(function(e){
    if(!io.warned){io.warned=true;
      ST.emit('error','Автосохранение не работает: '+((e&&e.message)||e)+'. Сохраняйте проект в файл .json (меню «Проект»).');}
  });
};
io.watch=function(){
  ST.on(function(k){if(k==='change'){clearTimeout(io._t);io._t=setTimeout(io.flush,2500);}});
  document.addEventListener('visibilitychange',function(){if(document.hidden)io.flush();});
  window.addEventListener('pagehide',function(){io.flush();});
  window.addEventListener('beforeunload',function(e){if(ST.dirty){io.flush();e.preventDefault();e.returnValue='';}});
};
io.download=function(p){
  var name=(p.meta&&p.meta.name||'project').replace(/[\\\/:*?"<>|]+/g,'').trim().replace(/\s+/g,'-')||'project';
  var url=URL.createObjectURL(new Blob([JSON.stringify(p,null,1)],{type:'application/json'}));
  var a=document.createElement('a');a.href=url;a.download=name+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},4000);
  return name+'.json';
};
io.open=function(){
  return new Promise(function(res){
    var i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.style.display='none';
    i.onchange=function(){
      var f=i.files&&i.files[0];i.remove();
      if(!f){res({cancel:true});return;}
      if(f.size>20*1048576){res({error:'файл больше 20 МБ'});return;}
      var r=new FileReader();
      r.onload=function(){res(io.parse(String(r.result)));};
      r.onerror=function(){res({error:'не удалось прочитать файл'});};
      r.readAsText(f);
    };
    document.body.appendChild(i);i.click();
  });
};
})();
