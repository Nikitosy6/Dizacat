/* Catworking Studio: холст (рамки экрана в светлой и/или тёмной теме проекта, узлы, масштаб, сетка, рамка выбора).
   Жесты (касание, мышь, клавиши) лежат в st-gest.js, правка узлов — в st-nodes.js. */
(function(){'use strict';
var ST=window.ST,cv=ST.canvas={zoom:1,grid:0},GAP=32;
try{var g0=Number(localStorage.getItem('st-grid'));if(g0===4||g0===8)cv.grid=g0;}catch(e){}
function clamp(z){return Math.min(4,Math.max(0.2,Math.round(z*100)/100));}
function themes(){return ST.tok?ST.tok.themes():['light'];}
function $(s){return document.querySelector(s);}
function dims(sc){return {w:Number(sc.w)||390,h:Number(sc.h)||844};}
cv.setGrid=function(g){cv.grid=g;try{localStorage.setItem('st-grid',String(g));}catch(e){}cv.layout();};
cv.cycleGrid=function(){cv.setGrid(cv.grid===0?4:cv.grid===4?8:0);return cv.grid;};
cv.render=function(){
  var host=$('#st-canvas'),sc=ST.screen(),zl=$('#st-zl');
  if(!host)return;
  if(ST.nodes)ST.nodes.pruneSel();
  var sx=host.scrollLeft,sy=host.scrollTop;
  if(zl)zl.textContent=Math.round(cv.zoom*100)+'%';
  if(!sc){host.innerHTML='<div class="st-empty">Нет экранов. Добавьте экран в списке слоёв.</div>';return;}
  var d=dims(sc),k=(sc.root.children||[]).length,ts=themes();
  var fontTab=!k&&ST.fontui&&ST.ui&&ST.ui.tab==='font';
  var inner=k&&ST.nodes?ST.nodes.html(sc.root,ST.p,{root:true}):
    fontTab?ST.fontui.specimen():(ST.tokui?ST.tokui.sample():'<div class="st-empty">Пустой экран</div>');
  var frames=ts.map(function(th,i){
    var tv=(ST.tok?ST.tok.styleAttr(ST.p,th):'')+(ST.fonts?ST.fonts.styleAttr(ST.p):'')+(ST.nodes?ST.nodes.shapeVars():'');
    return '<div class="st-flabel" data-fi="'+i+'">'+ST.esc(sc.name)+' · '+d.w+'×'+d.h+(ST.tok?' · '+(th==='light'?'☀ светлая':'🌙 тёмная'):'')+'</div>'+
      '<div class="st-frame" data-th="'+th+'" data-fi="'+i+'" style="width:'+d.w+'px;height:'+d.h+'px;'+ST.esc(tv)+'">'+inner+'</div>';
  }).join('');
  host.innerHTML='<div class="st-stage" id="st-stage">'+frames+'<div class="st-ovs" id="st-ovs"></div></div>';
  cv.layout();host.scrollLeft=sx;host.scrollTop=sy;cv.sel();
};
/* положение и масштаб рамок (без перестройки узлов: годится для щипка и колеса) */
cv.layout=function(){
  var host=$('#st-canvas'),sc=ST.screen(),st=$('#st-stage');if(!host||!sc||!st)return;
  var d=dims(sc),z=cv.zoom,n=themes().length,zl=$('#st-zl');
  if(zl)zl.textContent=Math.round(z*100)+'%';
  st.style.width=(48+n*d.w*z+(n-1)*GAP)+'px';st.style.height=(d.h*z+72)+'px';
  var fr=st.querySelectorAll('.st-frame'),lb=st.querySelectorAll('.st-flabel'),i;
  for(i=0;i<fr.length;i++){var left=24+i*(d.w*z+GAP);
    fr[i].style.left=left+'px';fr[i].style.transform='scale('+z+')';
    fr[i].classList.toggle('st-g',cv.grid>0);fr[i].style.setProperty('--g',cv.grid+'px');
    if(lb[i]){lb[i].style.left=left+'px';lb[i].style.maxWidth=Math.max(60,d.w*z)+'px';}}
};
/* масштаб с неподвижной точкой (ax, ay — координаты внутри холста; по умолчанию центр) */
cv.setZoom=function(z,ax,ay){
  var host=$('#st-canvas');if(!host)return;z=clamp(z);var old=cv.zoom;if(z===old)return;
  if(ax===undefined){ax=host.clientWidth/2;ay=host.clientHeight/2;}
  var cx=host.scrollLeft+ax,cy=host.scrollTop+ay;
  cv.zoom=z;cv.layout();
  host.scrollLeft=cx*z/old-ax;host.scrollTop=cy*z/old-ay;cv.sel();};
cv.zoomBy=function(d){cv.setZoom(cv.zoom+d);};
cv.fit=function(){
  var host=$('#st-canvas'),sc=ST.screen();
  if(!host||!sc)return;
  var d=dims(sc),n=themes().length;
  cv.zoom=clamp(Math.min((host.clientWidth-48-(n-1)*GAP)/(d.w*n),(host.clientHeight-72)/d.h));
  cv.render();host.scrollLeft=0;host.scrollTop=0;
};
/* живой предпросмотр цвета токена без записи в историю: пока палитру тянут, меняем переменную прямо на рамках */
cv.live=function(th,name,val){
  var f=document.querySelectorAll('.st-frame[data-th="'+th+'"]');
  for(var i=0;i<f.length;i++)f[i].style.setProperty('--'+name,val);
};
/* живой предпросмотр значений узла (инспектор, жесты): pairs=[[путь,значение],…], в проект ничего не пишется */
cv.liveNode=function(id,pairs){
  var f=ST.nodes&&ST.nodes.get(id),host=$('#st-canvas');if(!f||!host)return;
  var els=host.querySelectorAll('[data-nid="'+id+'"]');
  for(var i=0;i<els.length;i++){var el=els[i];
    el.style.cssText=ST.nodes.cssWith(f.n,pairs,ST.p,{dir:el.getAttribute('data-pd')||undefined,root:el.classList.contains('st-root')});}
  cv.sel();};
/* ---------- рамка выбора: рисуется поверх рамок экрана, не масштабируется (ручки не меньше 44 px) ---------- */
var HANDLES=[['n',50,0],['s',50,100],['e',100,50],['w',0,50],['nw',0,0],['ne',100,0],['sw',0,100],['se',100,100]];
cv.boxOf=function(fr,id){ /* прямоугольник узла в координатах «сцены» (px экрана): {x,y,w,h,rot} */
  var el=fr.querySelector('[data-nid="'+id+'"]'),ov=$('#st-ovs');if(!el||!ov)return null;
  var r=el.getBoundingClientRect(),o=ov.getBoundingClientRect(),z=cv.zoom,w=el.offsetWidth*z,h=el.offsetHeight*z;
  var cx=(r.left+r.right)/2-o.left,cy=(r.top+r.bottom)/2-o.top,f=ST.nodes.get(id),rot=f&&f.n.style&&f.n.style.rot||0;
  return {x:cx-w/2,y:cy-h/2,w:w,h:h,rot:rot,el:el};};
cv.sel=function(){
  var ov=$('#st-ovs'),host=$('#st-canvas');if(!ov||!host||!ST.nodes)return;
  var ids=ST.sel||[],html='',fr=host.querySelectorAll('.st-frame');
  for(var fi=0;fi<fr.length;fi++){
    for(var k=0;k<ids.length;k++){
      var b=cv.boxOf(fr[fi],ids[k]);if(!b)continue;
      var one=ids.length===1,f=ST.nodes.get(ids[k]),root=!f||!f.parent;
      html+='<div class="st-sel'+(one?'':' st-m')+'" data-fi="'+fi+'" style="left:'+b.x+'px;top:'+b.y+'px;width:'+b.w+'px;height:'+b.h+'px;'+(b.rot?'transform:rotate('+b.rot+'deg);':'')+'">';
      if(one&&!root){
        html+='<i class="st-hd st-hr" data-h="rot" data-fi="'+fi+'"></i>';
        HANDLES.forEach(function(a){html+='<i class="st-hd" data-h="'+a[0]+'" data-fi="'+fi+'" style="left:'+a[1]+'%;top:'+a[2]+'%"></i>';});}
      html+='</div>';}}
  var keep=ov.querySelectorAll('.st-gd,.st-drop'),extra='';
  for(var q=0;q<keep.length;q++)extra+=keep[q].outerHTML;
  ov.innerHTML=html+extra;
};
/* направляющие привязки и индикатор вставки (координаты сцены) */
cv.guides=function(lines){
  var ov=$('#st-ovs');if(!ov)return;var old=ov.querySelectorAll('.st-gd'),i;for(i=0;i<old.length;i++)old[i].remove();
  (lines||[]).forEach(function(l){var d=document.createElement('i');d.className='st-gd';
    d.style.cssText=l.v?'left:'+l.p+'px;top:'+l.a+'px;width:1px;height:'+(l.b-l.a)+'px':'top:'+l.p+'px;left:'+l.a+'px;height:1px;width:'+(l.b-l.a)+'px';ov.appendChild(d);});
};
cv.drop=function(r){
  var ov=$('#st-ovs');if(!ov)return;var old=ov.querySelectorAll('.st-drop'),i;for(i=0;i<old.length;i++)old[i].remove();
  if(!r)return;var d=document.createElement('i');d.className='st-drop'+(r.box?' st-dbox':'');
  d.style.cssText='left:'+r.x+'px;top:'+r.y+'px;width:'+r.w+'px;height:'+r.h+'px';ov.appendChild(d);
};
})();
