/* Catworking Studio: холст (в Шаге 1: рамка экрана и масштаб, без узлов) */
(function(){'use strict';
var ST=window.ST,cv=ST.canvas={zoom:1};
function clamp(z){return Math.min(2,Math.max(0.2,Math.round(z*100)/100));}
cv.render=function(){
  var host=document.getElementById('st-canvas'),sc=ST.screen(),zl=document.getElementById('st-zl');
  if(!host)return;
  var sx=host.scrollLeft,sy=host.scrollTop;
  if(zl)zl.textContent=Math.round(cv.zoom*100)+'%';
  if(!sc){host.innerHTML='<div class="st-empty">Нет экранов. Добавьте экран в списке слоёв.</div>';return;}
  var z=cv.zoom,w=Number(sc.w)||390,h=Number(sc.h)||844,k=(sc.root.children||[]).length;
  host.innerHTML='<div class="st-stage" style="width:'+(w*z+48)+'px;height:'+(h*z+72)+'px">'+
    '<div class="st-flabel">'+ST.esc(sc.name)+' · '+w+'×'+h+'</div>'+
    '<div class="st-frame" style="width:'+w+'px;height:'+h+'px;transform:scale('+z+')">'+
    '<div class="st-empty">'+(k?'Узлов: '+k:'Пустой экран<br>Узлы появятся в Шаге 4')+'</div></div></div>';
  host.scrollLeft=sx;host.scrollTop=sy;
};
cv.zoomBy=function(d){cv.zoom=clamp(cv.zoom+d);cv.render();};
cv.fit=function(){
  var host=document.getElementById('st-canvas'),sc=ST.screen();
  if(!host||!sc)return;
  var w=Number(sc.w)||390,h=Number(sc.h)||844;
  cv.zoom=clamp(Math.min((host.clientWidth-48)/w,(host.clientHeight-72)/h));
  cv.render();host.scrollLeft=0;host.scrollTop=0;
};
})();
