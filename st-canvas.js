/* Catworking Studio: холст (рамки экрана в светлой и/или тёмной теме проекта, масштаб; узлы появятся в Шаге 4) */
(function(){'use strict';
var ST=window.ST,cv=ST.canvas={zoom:1},GAP=32;
function clamp(z){return Math.min(2,Math.max(0.2,Math.round(z*100)/100));}
function themes(){return ST.tok?ST.tok.themes():['light'];}
cv.render=function(){
  var host=document.getElementById('st-canvas'),sc=ST.screen(),zl=document.getElementById('st-zl');
  if(!host)return;
  var sx=host.scrollLeft,sy=host.scrollTop;
  if(zl)zl.textContent=Math.round(cv.zoom*100)+'%';
  if(!sc){host.innerHTML='<div class="st-empty">Нет экранов. Добавьте экран в списке слоёв.</div>';return;}
  var z=cv.zoom,w=Number(sc.w)||390,h=Number(sc.h)||844,k=(sc.root.children||[]).length,ts=themes(),n=ts.length;
  var fontTab=!k&&ST.fontui&&ST.ui&&ST.ui.tab==='font';
  var inner=k?'<div class="st-empty">Узлов: '+k+'</div>':
    fontTab?ST.fontui.specimen():(ST.tokui?ST.tokui.sample():'<div class="st-empty">Пустой экран<br>Узлы появятся в Шаге 4</div>');
  var frames=ts.map(function(th,i){
    var left=24+i*(w*z+GAP),tv=(ST.tok?ST.tok.styleAttr(ST.p,th):'')+(ST.fonts?ST.fonts.styleAttr(ST.p):'');
    return '<div class="st-flabel" style="left:'+left+'px;max-width:'+Math.max(60,w*z)+'px">'+ST.esc(sc.name)+' · '+w+'×'+h+(ST.tok?' · '+(th==='light'?'☀ светлая':'🌙 тёмная'):'')+'</div>'+
      '<div class="st-frame" data-th="'+th+'" style="left:'+left+'px;width:'+w+'px;height:'+h+'px;transform:scale('+z+');'+ST.esc(tv)+'">'+inner+'</div>';
  }).join('');
  host.innerHTML='<div class="st-stage" style="width:'+(48+n*w*z+(n-1)*GAP)+'px;height:'+(h*z+72)+'px">'+frames+'</div>';
  host.scrollLeft=sx;host.scrollTop=sy;
};
cv.zoomBy=function(d){cv.zoom=clamp(cv.zoom+d);cv.render();};
cv.fit=function(){
  var host=document.getElementById('st-canvas'),sc=ST.screen();
  if(!host||!sc)return;
  var w=Number(sc.w)||390,h=Number(sc.h)||844,n=themes().length;
  cv.zoom=clamp(Math.min((host.clientWidth-48-(n-1)*GAP)/(w*n),(host.clientHeight-72)/h));
  cv.render();host.scrollLeft=0;host.scrollTop=0;
};
/* живой предпросмотр цвета без записи в историю: пока палитру тянут, меняем переменную прямо на рамках */
cv.live=function(th,name,val){
  var f=document.querySelectorAll('.st-frame[data-th="'+th+'"]');
  for(var i=0;i<f.length;i++)f[i].style.setProperty('--'+name,val);
};
})();
