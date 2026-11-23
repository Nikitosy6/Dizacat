/* Catworking Studio: сверка импорта с исходной разметкой (Шаг 6б). Объект ST.impcmp.
   Исходная разметка рисуется в скрытом iframe, узлы студии: в скрытой рамке .st-frame в самой странице (с теми же токенами, шрифтами и формой, что на холсте).
   Для каждого узла из карты импорта (id узла → путь элемента) сравниваются положение и размер; сверка по пикселям делается вне студии (st-test-imp.html). */
(function(){'use strict';
var ST=window.ST,I=ST.imp,C=ST.impcmp={TOL:1};

function elByPath(root,path){var e=root;for(var i=0;i<path.length;i++){e=e&&e.children[path[i]];if(!e)return null;}return e;}
function rel(el,root){var a=el.getBoundingClientRect(),b=root.getBoundingClientRect();return {x:a.left-b.left,y:a.top-b.top,w:a.width,h:a.height};}

/* студия рисует экран в скрытой рамке; возвращает {host, frame} */
C.render=function(screen,theme){
  var host=document.createElement('div');host.setAttribute('aria-hidden','true');
  host.style.cssText='position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none';
  var tv=(ST.tok?ST.tok.styleAttr(ST.p,theme):'')+(ST.fonts?ST.fonts.styleAttr(ST.p):'')+(ST.nodes?ST.nodes.shapeVars():'');
  host.innerHTML='<div class="st-frame" data-th="'+ST.esc(theme)+'" style="width:'+(Number(screen.w)||390)+'px;height:'+(Number(screen.h)||844)+'px;'+ST.esc(tv)+'">'+ST.nodes.html(screen.root,ST.p,{root:true})+'</div>';
  document.body.appendChild(host);return {host:host,frame:host.firstChild};};

/* o: {html, css, w, h, map, screenId, theme} → Promise({n, ok, pct, max, worst, tol, rows}) */
C.geo=function(o){
  var scr=null;(ST.p.screens||[]).forEach(function(s){if(s.id===o.screenId)scr=s;});
  if(!scr)return Promise.resolve(null);
  return I.sandbox(o.html,o.css||'',o.w||390,o.h||844).then(function(f){
    var st=C.render(scr,o.theme||'light');
    st.host.offsetHeight; /* принудительная раскладка: шрифты, нужные экрану, начинают загружаться */
    var fo=document.fonts,wait=fo?Promise.all(['500','600','700','800'].map(function(w){return fo.load(w+' 15px Nunito').catch(function(){});})).then(function(){return fo.ready;}):Promise.resolve();
    return wait.then(function(){
    try{
      var d=f.contentDocument,src=d.body.firstElementChild;
      var fr=st.frame,rows=[],ok=0,max=0,worst='';
      Object.keys(o.map||{}).forEach(function(id){
        var se=elByPath(src,o.map[id]),te=fr.querySelector('[data-nid="'+id+'"]');
        if(!se||!te){rows.push({id:id,miss:true,m:999});return;}
        var a=rel(se,src),b=rel(te,fr),inl=se.ownerDocument.defaultView.getComputedStyle(se).display==='inline',
          m=inl?Math.max(Math.abs(a.x-b.x),a.h<1.6*(parseFloat(se.ownerDocument.defaultView.getComputedStyle(se).fontSize)||15)?Math.abs(a.w-b.w):0,Math.abs((a.y+a.h/2)-(b.y+b.h/2))) /* у строчного элемента рамка = область букв, а не строка: сверяются x, середина по вертикали и (для одной строки) ширина */
              :Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.w-b.w),Math.abs(a.h-b.h));
        var nd=ST.nodes.find(scr.root,id);rows.push({id:id,name:nd&&nd.n?nd.n.name:'',m:Math.round(m*100)/100,a:a,b:b});});
      rows.forEach(function(r){if(r.m<=C.TOL)ok++;if(r.m>max){max=r.m;worst=r.name||'';}});
      var n=rows.length;
      return {n:n,ok:ok,pct:n?Math.round(ok/n*1000)/10:0,max:Math.round(max*10)/10,worst:worst,tol:C.TOL,rows:rows};
    }finally{f.remove();st.host.remove();}
    });
  });};
})();
