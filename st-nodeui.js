/* Catworking Studio: панель «Слои» (экраны, добавление узлов, дерево с перетаскиванием и «глазом»). Объект ST.nodeui */
(function(){'use strict';
var ST=window.ST,N=ST.nodes,h=ST.esc,U=ST.nodeui={col:{}},D=null;
function $(s){return document.querySelector(s);}
function say(r){if(r&&r.error){ST.ui.toast(r.error);return false;}return true;}
function rows(n,depth,out,sel){
  var has=n.children&&n.children.length,open=!U.col[n.id],on=sel.indexOf(n.id)>=0;
  out.push('<div class="st-lr'+(on?' on':'')+(n.hidden?' st-hid':'')+'" data-lr="'+h(n.id)+'" style="padding-left:'+Math.min(depth,6)*12+'px">'+
    (has?'<button class="st-b st-lx" data-st="ncol:'+h(n.id)+'" aria-label="'+(open?'Свернуть':'Развернуть')+'">'+(open?'▾':'▸')+'</button>':'<span class="st-lx"></span>')+
    '<button class="st-b st-ln" data-st="nsel:'+h(n.id)+'"><span class="st-lm">'+N.TYPE_MARK[n.type]+'</span> '+h(n.name)+'</button>'+
    '<button class="st-b st-le" data-st="neye:'+h(n.id)+'" aria-pressed="'+(n.hidden?'true':'false')+'" aria-label="'+(n.hidden?'Показать':'Скрыть')+'">'+(n.hidden?'—':'👁')+'</button>'+
    (depth?'<span class="st-lg" data-lg="'+h(n.id)+'" role="button" aria-label="Перетащить слой">⋮⋮</span>':'<span class="st-lg"></span>')+'</div>');
  if(has&&open)n.children.forEach(function(c){rows(c,depth+1,out,sel);});}
U.list=function(){
  var sc=ST.screen(),out=[];
  var scr=ST.p.screens.map(function(s){return '<button class="st-b st-row'+(sc&&s.id===sc.id?' on':'')+'" data-st="scr:'+h(s.id)+'">'+h(s.name)+'</button>';}).join('')+'<button class="st-b st-row" data-st="addscr">＋ Экран</button>';
  if(!sc)return scr;
  ST.sel.forEach(function(id){N.path(sc.root,id).slice(0,-1).forEach(function(a){delete U.col[a.id];});}); /* выбранный узел всегда виден в списке */
  rows(sc.root,0,out,ST.sel);
  return scr+'<div class="st-lh">Добавить</div><div class="st-seg st-adds">'+N.TYPES.map(function(t){
    return '<button class="st-b" data-st="nadd:'+t+'">'+N.TYPE_MARK[t]+' '+N.TYPE_NAME[t]+'</button>';}).join('')+'</div>'+
    '<div class="st-lh">Слои</div><div id="st-tree">'+out.join('')+'</div>';};
function addParent(){var n=N.selNodes()[0];if(!n)return N.root().id;
  if(n.type==='frame')return n.id;var pt=N.path(N.root(),n.id);return pt.length>1?pt[pt.length-2].id:N.root().id;}
function click(e){
  var t=e.target.closest('[data-st]');if(!t)return;var a=t.getAttribute('data-st'),id=a.slice(5);
  if(a.indexOf('nadd:')===0){var r=N.add(a.slice(5),addParent());if(say(r)){}}
  else if(a.indexOf('nsel:')===0){
    var mul=ST.gest&&ST.gest.multi||e.shiftKey||e.ctrlKey||e.metaKey,i=ST.sel.indexOf(id);
    N.select(mul?(i>=0?ST.sel.filter(function(x){return x!==id;}):ST.sel.concat(id)):[id]);
    if(ST.ui.sheet==='left'&&!mul)ST.ui.sheetTo('right');}
  else if(a.indexOf('ncol:')===0){U.col[id]=!U.col[id];ST.ui.render();}
  else if(a.indexOf('neye:')===0){var f=N.get(id);if(f)say(N.patch([id],[['hidden',f.n.hidden?undefined:true]],'видимость слоя'));}}
/* перетаскивание слоя за «⋮⋮»: до / после / внутрь рамки */
function gdown(e){var g=e.target.closest('[data-lg]');if(!g||!g.getAttribute('data-lg'))return;
  e.preventDefault();D={id:g.getAttribute('data-lg'),tgt:null};try{g.setPointerCapture(e.pointerId);}catch(x){}}
function clear(){var a=document.querySelectorAll('#st-tree .st-lr-b,#st-tree .st-lr-a,#st-tree .st-lr-i'),i;
  for(i=0;i<a.length;i++)a[i].classList.remove('st-lr-b','st-lr-a','st-lr-i');}
function gmove(e){
  if(!D)return;clear();D.tgt=null;
  var els=document.elementsFromPoint(e.clientX,e.clientY),row=null,i;
  for(i=0;i<els.length;i++){var r=els[i].closest&&els[i].closest('[data-lr]');if(r){row=r;break;}}
  if(!row)return;var tid=row.getAttribute('data-lr');if(tid===D.id)return;
  var f=N.get(tid);if(!f)return;var rc=row.getBoundingClientRect(),q=(e.clientY-rc.top)/rc.height,isF=f.n.type==='frame',pos;
  if(!f.parent)pos='i';else if(isF&&q>=.28&&q<=.72)pos='i';else pos=q<.5?'b':'a';
  D.tgt={id:tid,pos:pos};row.classList.add('st-lr-'+pos);}
function gup(){
  var d=D;D=null;clear();if(!d||!d.tgt)return;
  var f=N.get(d.tgt.id);if(!f)return;
  if(d.tgt.pos==='i')say(N.move(d.id,f.n.id,f.n.children.length));
  else say(N.move(d.id,f.parent.id,f.i+(d.tgt.pos==='a'?1:0)));}
U.bind=function(){var b=$('#st-left');b.addEventListener('click',click);
  b.addEventListener('pointerdown',gdown);b.addEventListener('pointermove',gmove);b.addEventListener('pointerup',gup);b.addEventListener('pointercancel',function(){D=null;clear();});};
})();
