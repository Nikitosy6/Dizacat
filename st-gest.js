/* Catworking Studio: жесты на холсте (касание, мышь, перо) и клавиши.
   Холст с touch-action:none (STUDIO_PLAN P6 п. 9): один палец — выбор/перетаскивание/прокрутка пустого места, два пальца — щипок и прокрутка.
   Во время жеста проект не меняется (живой предпросмотр через ST.canvas.liveNode), запись в историю одним шагом в конце. */
(function(){'use strict';
var ST=window.ST,G=ST.gest={multi:false},N=ST.nodes,cv=ST.canvas;
var host=null,pts={},S=null,pinch=null,hintShown=false;
function $(s){return document.querySelector(s);}
function say(m){if(ST.ui)ST.ui.toast(m);}
function bad(r){if(r&&r.error){say(r.error);return true;}return false;}
function cnt(){return Object.keys(pts).length;}
function sel(){return ST.sel||[];}
function inSel(id){return sel().indexOf(id)>=0;}
function r2(v){return Math.round(v*100)/100;}
function frameEl(fi){return host.querySelectorAll('.st-frame')[fi||0];}
function nodeEl(id,fi){var f=frameEl(fi);return f&&f.querySelector('[data-nid="'+id+'"]');}
/* ---------- привязка к краям и центрам ---------- */
function cands(pel,skip){
  var xs=[0,pel.clientWidth/2,pel.clientWidth],ys=[0,pel.clientHeight/2,pel.clientHeight];
  [].forEach.call(pel.children,function(c){
    if(!c.classList.contains('st-n')||skip[c.getAttribute('data-nid')])return;
    var l=c.offsetLeft,t=c.offsetTop,w=c.offsetWidth,h=c.offsetHeight;xs.push(l,l+w/2,l+w);ys.push(t,t+h/2,t+h);});
  return {xs:xs,ys:ys,pel:pel};}
function snap1(vals,cs,thr){var best=null;
  vals.forEach(function(v){cs.forEach(function(c){var d=c-v;if(Math.abs(d)<=thr&&(best===null||Math.abs(d)<Math.abs(best.d)))best={d:d,at:c};});});
  return best;}
function stage(pel,lx,ly){var r=pel.getBoundingClientRect(),o=$('#st-ovs').getBoundingClientRect(),z=cv.zoom;
  return {x:r.left-o.left+(pel.clientLeft+lx)*z,y:r.top-o.top+(pel.clientTop+ly)*z};}
function vline(c,at){var a=stage(c.pel,at,0),b=stage(c.pel,at,c.pel.clientHeight);return {v:1,p:a.x,a:a.y,b:b.y};}
function hline(c,at){var a=stage(c.pel,0,at),b=stage(c.pel,c.pel.clientWidth,at);return {p:a.y,a:a.x,b:b.x};}
function grid(v){return cv.grid?Math.round(v/cv.grid)*cv.grid:v;}
/* ---------- начало жеста ---------- */
function down(e){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  pts[e.pointerId]={x:e.clientX,y:e.clientY};
  try{host.setPointerCapture(e.pointerId);}catch(x){}
  if(cnt()===2){cancelCur();startPinch();return;}
  if(cnt()>2||pinch)return;
  var hd=e.target.closest&&e.target.closest('[data-h]'),el=e.target.closest&&e.target.closest('.st-n[data-nid]');
  S={x0:e.clientX,y0:e.clientY,moved:false,mod:G.multi||e.shiftKey||e.ctrlKey||e.metaKey,sl:host.scrollLeft,st:host.scrollTop,
     thr:e.pointerType==='mouse'?4:8,fi:Number((e.target.closest('.st-frame')||{dataset:{}}).dataset.fi)||0};
  if(hd&&sel().length===1&&N.get(sel()[0])){S.kind='h';S.h=hd.getAttribute('data-h');S.id=sel()[0];S.fi=Number(hd.getAttribute('data-fi'))||0;initHandle(e);}
  else if(el){S.kind='node';S.id=el.getAttribute('data-nid');}
  else S.kind='bg';
}
function cancelCur(){var had=S&&S.moved;S=null;cv.guides([]);cv.drop(null);if(had)cv.render();}
function startPinch(){
  var k=Object.keys(pts),a=pts[k[0]],b=pts[k[1]];
  pinch={d0:Math.hypot(a.x-b.x,a.y-b.y)||1,z0:cv.zoom,m:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};}
function initHandle(e){
  var el=nodeEl(S.id,S.fi),f=N.get(S.id);if(!el||!f){S=null;return;}
  var L=f.n.layout||{},r=el.getBoundingClientRect();
  S.w0=el.offsetWidth;S.h0=el.offsetHeight;S.x=Number(L.x)||0;S.y=Number(L.y)||0;S.flt=!!L.float;S.rot=(f.n.style&&f.n.style.rot)||0;
  S.cx=(r.left+r.right)/2;S.cy=(r.top+r.bottom)/2;S.a0=Math.atan2(e.clientY-S.cy,e.clientX-S.cx);
  if(S.flt&&S.c){var sk={};sk[S.id]=1;S.c=cands(el.parentElement,sk);}}
/* ---------- движение ---------- */
function move(e){
  if(!pts[e.pointerId])return;
  var pv=pts[e.pointerId];pts[e.pointerId]={x:e.clientX,y:e.clientY};
  if(pinch){
    if(cnt()<2)return;
    var k=Object.keys(pts),a=pts[k[0]],b=pts[k[1]],m={x:(a.x+b.x)/2,y:(a.y+b.y)/2},hr=host.getBoundingClientRect();
    cv.setZoom(pinch.z0*(Math.hypot(a.x-b.x,a.y-b.y)||1)/pinch.d0,pinch.m.x-hr.left,pinch.m.y-hr.top);
    host.scrollLeft+=pinch.m.x-m.x;host.scrollTop+=pinch.m.y-m.y;pinch.m=m;return;}
  if(!S||cnt()!==1)return;
  var dx=e.clientX-S.x0,dy=e.clientY-S.y0;
  if(!S.moved){if(Math.hypot(dx,dy)<S.thr)return;S.moved=true;startDrag(e);if(!S)return;}
  if(S.kind==='bg'){host.scrollLeft=S.sl-dx;host.scrollTop=S.st-dy;}
  else if(S.kind==='node'){if(S.mode==='float')moveFloat(dx,dy,e);else if(S.mode==='flow')moveFlow(e);else{host.scrollLeft=S.sl-dx;host.scrollTop=S.st-dy;}}
  else if(S.kind==='h'){if(S.h==='rot')rotate(e);else resize(dx,dy);}
}
function startDrag(e){
  if(S.kind==='node'){
    if(!inSel(S.id))N.select(S.mod?sel().concat(S.id):[S.id]); /* перерисовка: дальше элементы ищем заново по id */
    var f=N.get(S.id);
    if(!f||!f.parent){S.kind='bg';return;}
    var L=f.n.layout||{};
    if(L.float){
      var sk={};S.mv=sel().map(function(id){var g=N.get(id);return g&&g.parent&&g.n.layout&&g.n.layout.float?{id:id,x:Number(g.n.layout.x)||0,y:Number(g.n.layout.y)||0}:null;}).filter(Boolean);
      S.mv.forEach(function(m){sk[m.id]=1;var el=nodeEl(m.id,S.fi);m.w=el?el.offsetWidth:0;m.h=el?el.offsetHeight:0;});
      var pe=nodeEl(S.id,S.fi);S.prim=S.mv.filter(function(m){return m.id===S.id;})[0];
      S.c=pe&&pe.parentElement&&S.prim?cands(pe.parentElement,sk):null;S.mode='float';
    }else{S.mode='flow';[].forEach.call(host.querySelectorAll('[data-nid="'+S.id+'"]'),function(el){el.classList.add('st-dragging');});}
  }
}
function moveFloat(dx,dy){
  var z=cv.zoom,thr=6/z,p=S.prim;if(!p)return;
  var rx=p.x+dx/z,ry=p.y+dy/z,nx=grid(rx),ny=grid(ry),lines=[];
  if(S.c){
    var sx=snap1([rx,rx+p.w/2,rx+p.w],S.c.xs,thr),sy=snap1([ry,ry+p.h/2,ry+p.h],S.c.ys,thr);
    if(sx){nx=rx+sx.d;lines.push(vline(S.c,sx.at));}
    if(sy){ny=ry+sy.d;lines.push(hline(S.c,sy.at));}}
  var ex=nx-p.x,ey=ny-p.y;
  S.mv.forEach(function(m){m.nx=r2(m.x+ex);m.ny=r2(m.y+ey);cv.liveNode(m.id,[['layout.x',m.nx],['layout.y',m.ny]]);});
  cv.guides(lines);}
function moveFlow(e){
  var els=document.elementsFromPoint(e.clientX,e.clientY),pe=null,i;
  for(i=0;i<els.length;i++){var c=els[i];if(c.classList&&c.classList.contains('st-n')&&c.getAttribute('data-type')==='frame'){pe=c;break;}}
  if(!pe){S.drop=null;cv.drop(null);return;}
  var row=pe.getAttribute('data-dir')==='row',o=$('#st-ovs').getBoundingClientRect(),pr=pe.getBoundingClientRect();
  var kids=[].filter.call(pe.children,function(c){return c.classList.contains('st-n')&&!c.getAttribute('data-fl')&&!c.classList.contains('st-dragging');});
  var idx=0;kids.forEach(function(c){var r=c.getBoundingClientRect();if((row?e.clientX:e.clientY)>(row?(r.left+r.right)/2:(r.top+r.bottom)/2))idx++;});
  var pf=N.get(pe.getAttribute('data-nid'));if(!pf){S.drop=null;return;}
  var before=kids[idx],mi=pf.n.children.length;
  if(before){var bid=before.getAttribute('data-nid');for(i=0;i<pf.n.children.length;i++)if(pf.n.children[i].id===bid){mi=i;break;}}
  S.drop={pid:pf.n.id,idx:mi};
  if(!kids.length)cv.drop({box:1,x:pr.left-o.left,y:pr.top-o.top,w:pr.width,h:pr.height});
  else{var ref=idx<kids.length?kids[idx].getBoundingClientRect():kids[kids.length-1].getBoundingClientRect(),after=idx>=kids.length;
    if(row)cv.drop({x:(after?ref.right:ref.left)-o.left-1.5,y:pr.top-o.top+4,w:3,h:pr.height-8});
    else cv.drop({x:pr.left-o.left+4,y:(after?ref.bottom:ref.top)-o.top-1.5,w:pr.width-8,h:3});}}
function resize(dx,dy){
  var z=cv.zoom,h=S.h,rad=-S.rot*Math.PI/180,ddx=dx/z,ddy=dy/z,thr=6/z;
  var lx=ddx*Math.cos(rad)-ddy*Math.sin(rad),ly=ddx*Math.sin(rad)+ddy*Math.cos(rad);
  var w=S.w0,hg=S.h0,x=S.x,y=S.y,pairs=[],lines=[],sn,nx,ny;
  var E=h.indexOf('e')>=0,W=h.indexOf('w')>=0,Nn=h.indexOf('n')>=0,Ss=h.indexOf('s')>=0;
  if(E)w=S.w0+lx;if(W){w=S.w0-lx;x=S.x+lx;}if(Ss)hg=S.h0+ly;if(Nn){hg=S.h0-ly;y=S.y+ly;}
  if(E){sn=S.flt&&S.c?snap1([x+w],S.c.xs,thr):null;if(sn){w=sn.at-x;lines.push(vline(S.c,sn.at));}else w=grid(w);}
  if(W){sn=S.flt&&S.c?snap1([x],S.c.xs,thr):null;nx=sn?sn.at:(S.flt?grid(x):x);if(sn)lines.push(vline(S.c,sn.at));w=w+(x-nx);if(S.flt)x=nx;else w=grid(S.w0-lx);}
  if(Ss){sn=S.flt&&S.c?snap1([y+hg],S.c.ys,thr):null;if(sn){hg=sn.at-y;lines.push(hline(S.c,sn.at));}else hg=grid(hg);}
  if(Nn){sn=S.flt&&S.c?snap1([y],S.c.ys,thr):null;ny=sn?sn.at:(S.flt?grid(y):y);if(sn)lines.push(hline(S.c,sn.at));hg=hg+(y-ny);if(S.flt)y=ny;else hg=grid(S.h0-ly);}
  w=Math.max(1,r2(w));hg=Math.max(1,r2(hg));
  if(E||W)pairs.push(['layout.w',w]);if(Nn||Ss)pairs.push(['layout.h',hg]);
  if(S.flt&&W)pairs.push(['layout.x',r2(x)]);if(S.flt&&Nn)pairs.push(['layout.y',r2(y)]);
  S.pairs=pairs;S.label='размер';cv.liveNode(S.id,pairs);cv.guides(lines);}
function rotate(e){
  var a=Math.atan2(e.clientY-S.cy,e.clientX-S.cx),d=S.rot+(a-S.a0)*180/Math.PI;
  while(d>180)d-=360;while(d<=-180)d+=360;
  var q=Math.round(d/15)*15;if(e.shiftKey||Math.abs(d-q)<3)d=q;
  d=Math.round(d*10)/10;if(d===-180)d=180;
  S.pairs=[['style.rot',d]];S.label='поворот';cv.liveNode(S.id,S.pairs);}
/* ---------- конец жеста ---------- */
function tap(s){
  if(s.mod){var i=sel().indexOf(s.id);N.select(i>=0?sel().filter(function(x){return x!==s.id;}):sel().concat(s.id));}
  else if(!(sel().length===1&&sel()[0]===s.id))N.select([s.id]);}
function end(commit){
  var s=S;S=null;cv.guides([]);cv.drop(null);
  if(!s)return;
  if(s.kind==='bg'){if(!s.moved&&commit&&!s.mod&&sel().length)N.select([]);return;}
  if(s.kind==='node'){
    if(!s.moved){if(commit)tap(s);return;}
    if(!commit){cv.render();return;}
    if(s.mode==='float'&&s.mv)bad(N.patchEach(s.mv.map(function(m){return {id:m.id,pairs:[['layout.x',m.nx],['layout.y',m.ny]]};}),'переместить'));
    else if(s.mode==='flow'){if(s.drop)bad(N.move(s.id,s.drop.pid,s.drop.idx));else cv.render();}
    return;}
  if(s.kind==='h'){if(!s.moved||!s.pairs)return;if(!commit){cv.render();return;}bad(N.patch([s.id],s.pairs,s.label));}
}
function up(e){
  if(!pts[e.pointerId])return;delete pts[e.pointerId];
  try{host.releasePointerCapture(e.pointerId);}catch(x){}
  if(pinch){if(cnt()<2)pinch=null;return;}
  end(e.type==='pointerup');}
/* ---------- клавиши ---------- */
function typing(t){return t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable);}
function key(e){
  if(typing(e.target)||document.querySelector('.st-mdl')||!ST.p)return;
  var k=e.key,mod=e.ctrlKey||e.metaKey,ids=sel();
  if(k==='Escape'&&ids.length&&!(ST.ui&&ST.ui.sheet)){N.select([]);return;}
  if(!ids.length)return;
  if(k==='Delete'||k==='Backspace'){e.preventDefault();bad(N.remove(ids));return;}
  if(mod&&k.toLowerCase()==='d'){e.preventDefault();bad(N.dup(ids));return;}
  if(mod&&k.toLowerCase()==='g'){e.preventDefault();bad(e.shiftKey?N.ungroup(ids[0]):N.group(ids));return;}
  var dv={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];
  if(dv&&!mod){e.preventDefault();G.nudge(dv[0]*(e.shiftKey?8:1),dv[1]*(e.shiftKey?8:1));}
}
/* сдвиг «на плаву»-узлов стрелками: шаг 1 px, с Shift — 8 px */
G.nudge=function(dx,dy){
  var items=[],flow=0;
  sel().forEach(function(id){var f=N.get(id);if(!f||!f.parent)return;var L=f.n.layout||{};
    if(L.float)items.push({id:id,pairs:[['layout.x',(Number(L.x)||0)+dx],['layout.y',(Number(L.y)||0)+dy]]});else flow++;});
  if(items.length)return N.patchEach(items,'сдвиг стрелкой');
  if(flow&&!hintShown){hintShown=true;say('Узел лежит в потоке: перетащите его или включите «На плаву» в инспекторе.');}
  return {ok:true};};
G.bind=function(){
  host=$('#st-canvas');if(!host||host._g)return;host._g=1;host.style.touchAction='none';
  host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);
  host.addEventListener('pointerup',up);host.addEventListener('pointercancel',up);
  host.addEventListener('wheel',function(e){if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();
    var r=host.getBoundingClientRect();cv.setZoom(cv.zoom*(e.deltaY<0?1.1:1/1.1),e.clientX-r.left,e.clientY-r.top);},{passive:false});
  document.addEventListener('keydown',key);
};
})();
