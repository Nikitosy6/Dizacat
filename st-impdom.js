/* Catworking Studio: импорт разметки, часть 2 (Шаг 6б): скрытая страница, обход элементов, сборка узлов. Дополняет ST.imp (см. st-import.js). */
(function(){'use strict';
var ST=window.ST,N=ST.nodes,I=ST.imp,U=I._u,r2=U.r2,px=U.px,colorOf=U.colorOf;
var AI={normal:'stretch',stretch:'stretch','flex-start':'start',start:'start','self-start':'start',center:'center','flex-end':'end',end:'end','self-end':'end',baseline:'start'};
var JC={normal:'start','flex-start':'start',start:'start',left:'start',center:'center','flex-end':'end',end:'end',right:'end','space-between':'between'};
var CLS={card:'Карточка',tile:'Плитка',pill:'Пилюля',chip:'Чип',row:'Строка',nav:'Нижняя панель',ring:'Кольцо таймера',sg:'Кнопка-выбор',lk:'Плитка-ссылка'};

/* ---------- скрытая страница (sandbox: скрипты не выполняются, в сеть ничего не уходит) ---------- */
function cleanHtml(s){return String(s).replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<(iframe|object|embed|link|meta|base)\b[^>]*>/gi,'')
  .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'').replace(/\s(src|href|srcset)\s*=\s*("|')\s*(?:https?:)?\/\/[^"']*\2/gi,'');}
function cleanCss(s){return String(s).replace(/<\/?style[^>]*>/gi,'').replace(/@import[^;]*;?/gi,'').replace(/url\(\s*['"]?(?:https?:)?\/\/[^)]*\)/gi,'none');}
I.split=function(raw){ /* вставленная разметка: <style> уходит в css */
  var css='';var html=String(raw).replace(/<style[^>]*>([\s\S]*?)<\/style>/gi,function(m,c){css+=c+'\n';return '';});return {html:html,css:css};};
I.sandbox=function(html,css,w,h,fontsOn){
  return new Promise(function(res){
    var f=document.createElement('iframe'),done=false;
    f.setAttribute('sandbox','allow-same-origin');f.setAttribute('aria-hidden','true');f.tabIndex=-1;
    f.style.cssText='position:fixed;left:-20000px;top:0;width:'+w+'px;height:'+h+'px;border:0;visibility:hidden;pointer-events:none';
    function fin(){if(done)return;done=true;res(f);}
    f.onload=function(){var d=f.contentDocument,win=f.contentWindow,fo=d&&d.fonts;
      var t=fo?['500','600','700','800'].map(function(x){return fo.load(x+' 15px Nunito').catch(function(){});}):[];
      Promise.all(t).then(function(){return fo?fo.ready:null;}).then(function(){win.requestAnimationFrame(fin);}).catch(fin);setTimeout(fin,5000);};
    f.srcdoc='<!doctype html><html><head><meta charset="utf-8">'+(fontsOn===false?'':'<link rel="stylesheet" href="fonts/fonts.css">')+'<style>'+cleanCss(css)+'</style></head><body style="margin:0">'+cleanHtml(html)+'</body></html>';
    document.body.appendChild(f);});};

/* ---------- чтение элемента ---------- */
function cut(t){t=String(t).replace(/\s+/g,' ').trim();return t.length>24?t.slice(0,23)+'…':t;}
function mk(type,name,L,S,P){return {id:ST.uid('n'),type:type,name:(String(name||'').trim()||N.TYPE_NAME[type]).slice(0,80),layout:L||{},style:S||{},props:P||{},children:[]};}
function nameOf(el,tag){var a=el.getAttribute('aria-label'),t=cut(el.textContent||'');
  if(tag==='button')return 'Кнопка: '+(a||t||'без подписи');
  if(a)return a;if(/^h[1-6]$/.test(tag))return 'Заголовок: '+t;
  var cl=(el.getAttribute('class')||'').split(/\s+/);for(var i=0;i<cl.length;i++)if(CLS[cl[i]])return CLS[cl[i]]+(t&&!el.children.length?': '+t:'');
  return el.children.length?'Рамка':(t?'Текст: '+t:'Фигура');}
function hasBox(cs){return !!(U.rgba(cs.backgroundColor)&&U.rgba(cs.backgroundColor)[3]>0)||cs.backgroundImage!=='none'||px(cs.borderTopWidth)>0||px(cs.borderBottomWidth)>0||px(cs.borderLeftWidth)>0||px(cs.borderRightWidth)>0||cs.boxShadow!=='none';}
function ref(v,kind,X){var s=X.shape;if(kind==='r'){if(v===s.r)return 'var:r';if(v===s.rl)return 'var:rl';}if(kind==='bw'&&v===s.bw)return 'var:bw';if(kind==='ledge'&&v===s.ledge)return 'var:ledge';return r2(v);}
function radii(cs,r){var c=['TopLeft','TopRight','BottomRight','BottomLeft'].map(function(k){var v=cs['border'+k+'Radius'].split(' ')[0],x=parseFloat(v)||0;return /%$/.test(v)?x/100*Math.min(r.width,r.height):x;});return c;}

/* вид рамки: фон, обводка, радиус, тень, прозрачность, обрезка; {S, sides, split} */
function boxStyle(cs,r,X,where,isRoot){
  var S={},out={S:S,sides:null,split:null},i;
  if(cs.backgroundImage!=='none'){var g=U.parseGrad(cs.backgroundImage);
    if(g){var tk=U.gradToken(g,X);
      if(tk){S.bg=tk;}
      else if(g.stops.length===3&&g.stops[0].c.join()===g.stops[1].c.join()&&g.stops[1].at===g.stops[2].at&&g.angle===180)
        {S.bg=colorOf('rgba('+g.stops[0].c.join(',')+')',X,where);out.split={at:g.stops[1].at,c:colorOf('rgba('+g.stops[2].c.join(',')+')',X,where)};}
      else{S.bg=colorOf('rgba('+g.stops[0].c.join(',')+')',X,where);X.rep.notes.push('градиент «'+where+'» не из профиля: заменён первым цветом');}}}
  else{var bg=colorOf(cs.backgroundColor,X,where);if(bg)S.bg=bg;}
  var w4=['Top','Right','Bottom','Left'].map(function(k){return /none|hidden/.test(cs['border'+k+'Style'])?0:px(cs['border'+k+'Width']);});
  if(w4[0]&&w4[0]===w4[1]&&w4[1]===w4[2]&&w4[2]===w4[3])S.bd={w:ref(w4[0],'bw',X),c:colorOf(cs.borderTopColor,X,where)||'@ln'};
  else if(w4[0]+w4[1]+w4[2]+w4[3]){
    if(w4[0]&&!w4[1]&&!w4[2]&&!w4[3])out.sides={side:'top',w:w4[0],c:colorOf(cs.borderTopColor,X,where)||'@ln'};
    else if(w4[2]&&!w4[0]&&!w4[1]&&!w4[3])out.sides={side:'bottom',w:w4[2],c:colorOf(cs.borderBottomColor,X,where)||'@ln'};
    else X.rep.notes.push('«'+where+'»: обводка только с некоторых сторон не передаётся');}
  var rr=isRoot?[0,0,0,0]:radii(cs,r);
  if(rr.some(function(v){return v>0;})){
    if(rr.every(function(v){return v===rr[0];}))S.r=ref(rr[0],'r',X);else S.rc=rr.map(function(v){return ref(v,'r',X);});}
  U.shadows(cs.boxShadow).forEach(function(s){var c=colorOf('rgba('+s.c.join(',')+')',X,where)||'rgba(0,0,0,.25)';
    if(!s.inset&&!s.b&&!s.sp&&!s.x&&s.y>0&&!S.ledge)S.ledge={y:ref(s.y,'ledge',X),c:c};
    else if(!s.inset&&!s.sp&&(s.b||s.x||s.y)&&!S.sh)S.sh={x:s.x,y:s.y,b:s.b,c:c};
    else X.rep.notes.push('«'+where+'»: тень «'+(s.inset?'внутренняя ':'')+s.x+' '+s.y+' '+s.b+' '+s.sp+'» (кольцо или внутренняя) не передаётся');});
  if(cs.opacity!=='1')S.op=Math.round(parseFloat(cs.opacity)*100);
  if(!isRoot&&(cs.overflowX==='hidden'||cs.overflowY==='hidden'))S.clip=true;
  return out;}

/* контекст для детей элемента */
function ctxOf(el,cs,r,n){
  var d=cs.display,flex=/flex/.test(d),grid=/grid/.test(d),btn=el.tagName==='BUTTON',dir=flex&&!/^column/.test(cs.flexDirection)?'row':'column',ai,jc;
  if(flex){ai=AI[cs.alignItems]||'start';jc=JC[cs.justifyContent]||'start';}
  else if(grid){ai=AI[cs.justifyItems]||'stretch';var a2=AI[cs.alignItems]||'stretch';jc=a2==='stretch'?'start':a2;}
  else{ai=btn?({center:'center',right:'end',end:'end'}[cs.textAlign]||'start'):'start';jc=btn?'center':'start';}
  var bl=px(cs.borderLeftWidth),bt=px(cs.borderTopWidth),pl=px(cs.paddingLeft),pr=px(cs.paddingRight),pt=px(cs.paddingTop),pb=px(cs.paddingBottom),br=px(cs.borderRightWidth),bb=px(cs.borderBottomWidth);
  return {dir:dir,ai:ai,jc:jc,flex:flex,stretch:flex?ai==='stretch':true,cw:r.width-bl-br-pl-pr,ch:r.height-bt-bb-pt-pb,rect:r,bl:bl,bt:bt,pw:r.width-bl-br,ph:r.height-bt-bb,pad:[pt,pr,pb,pl],
    gap:flex?px(dir==='row'?cs.columnGap:cs.rowGap):(grid?px(cs.rowGap):0),wrap:flex&&cs.flexWrap!=='nowrap',sp:/space-(around|evenly)/.exec(cs.justifyContent),n:n};}

/* размер по оси: 'fill' | 'hug' | число */
function sizeAxis(el,cs,r,ctx,mg,ax,abs){
  var main=(ctx.dir==='row')===(ax==='w'),size=ax==='w'?r.width:r.height,mm=ax==='w'?mg.l+mg.r:mg.t+mg.b;
  if(abs){if(Math.abs(size-(ax==='w'?ctx.pw:ctx.ph))<0.6)return 'fill';}
  else{if(ctx.flex&&main&&parseFloat(cs.flexGrow)>0)return 'fill';
    var sa=cs.alignSelf,self=(sa==='auto'||sa==='normal')?ctx.stretch:sa==='stretch';
    if(!main&&self&&Math.abs(size+mm-(ax==='w'?ctx.cw:ctx.ch))<0.6)return 'fill';}
  var prop=ax==='w'?'width':'height',old=el.style.getPropertyValue(prop),pri=el.style.getPropertyPriority(prop);
  el.style.setProperty(prop,ax==='w'?'fit-content':'auto','important');
  var rr=el.getBoundingClientRect(),s2=ax==='w'?rr.width:rr.height;
  if(old)el.style.setProperty(prop,old,pri);else el.style.removeProperty(prop);
  return Math.abs(s2-size)<0.6?'hug':r2(size);}
function limits(L,cs){[['minW','minWidth'],['maxW','maxWidth'],['minH','minHeight'],['maxH','maxHeight']].forEach(function(a){var v=cs[a[1]];if(/px$/.test(v)&&parseFloat(v)>0)L[a[0]]=r2(parseFloat(v));});}

function textNode(str,cs,tag,X,where,name){
  var S={text:U.textStyle(cs,tag,X,where)};if(cs.opacity!=='1')S.op=Math.round(parseFloat(cs.opacity)*100);
  return mk('text',name||'Текст: '+cut(str),{},S,{text:str.slice(0,2000)});}
function iconNode(el,cs,r,X,where){
  var ds=[].map.call(el.querySelectorAll('path'),function(p){return p.getAttribute('d')||'';}).join('|'),name=U.iconByPath(ds);
  if(!name){X.rep.icons.push(ds.slice(0,40));name='star';}
  var fi=/fill="currentColor"/.test(N.ICONS[name]),c=fi?(cs.fill==='currentcolor'?cs.color:cs.fill):cs.color;
  return mk('icon','Иконка: '+name,{w:r2(r.width),h:r2(r.height)},{ic:colorOf(c,X,where)||'@tx'},{icon:name});}

/* ---------- главный обход ---------- */
function conv(el,ctx,X,path,isRoot){
  var bi=false,win=el.ownerDocument.defaultView,cs=win.getComputedStyle(el),tag=el.tagName.toLowerCase();
  if(cs.display==='none'||/^(script|style|link|meta|title|head|template)$/.test(tag))return null;
  if(++X.rep.count>N.COUNT_MAX)throw new Error('слишком много элементов (больше '+N.COUNT_MAX+')');
  var r=el.getBoundingClientRect(),abs=/absolute|fixed/.test(cs.position),where=nameOf(el,tag),mg={t:px(cs.marginTop),r:px(cs.marginRight),b:px(cs.marginBottom),l:px(cs.marginLeft)};
  var kids=[].filter.call(el.children,function(c){return win.getComputedStyle(c).display!=='none';}),
    texts=[].filter.call(el.childNodes,function(c){return c.nodeType===3&&/\S/.test(c.nodeValue);}),core,bx,self;
  if(tag==='svg')core=iconNode(el,cs,r,X,where);
  else if(!kids.length&&!texts.length){
    var nx=el.nextSibling,lab=nx&&nx.nodeType===3?nx.nodeValue.trim():'';
    if(tag==='i'&&U.NAVIC[lab]&&Math.abs(r.width-22)<1&&Math.abs(r.height-22)<1){ /* серый квадрат вместо значка нижней панели → значок по подписи */
      core=mk('icon','Иконка: '+U.NAVIC[lab],{w:22,h:22},{ic:colorOf(win.getComputedStyle(el.parentElement).color,X,where)||'@mu'},{icon:U.NAVIC[lab]});}
    else{bx=boxStyle(cs,r,X,where,isRoot);core=mk('shape',where,{},bx.S,{shape:'rect'});}}
  else{
    bx=boxStyle(cs,r,X,where,isRoot);
    var c2=ctxOf(el,cs,r,kids.length),L={dir:c2.dir};
    /* обычный (не flex и не grid) блок со строчным содержимым (значок, текст): высоту даёт строка с «распоркой», студия посчитала бы меньше, поэтому высота фиксируется */
    bi=!c2.flex&&!/grid/.test(cs.display)&&kids.some(function(c){return c.tagName.toLowerCase()==='svg'||/^inline/.test(win.getComputedStyle(c).display);});
    if(c2.gap)L.gap=c2.gap;
    if(c2.pad.some(function(v){return v>0;}))L.pad=c2.pad.map(r2);
    L.ai=c2.ai;L.jc=c2.jc;if(c2.wrap)L.wrap=true;
    core=mk('frame',where,L,bx.S);
    if(!kids.length&&texts.length&&(hasBox(cs)||tag==='button')){ /* кнопка, пилюля: рамка с одним текстом внутри */
      var tn=textNode(texts.map(function(t){return t.nodeValue;}).join(' ').replace(/\s+/g,' ').trim(),cs,tag,X,where);
      tn.style.op=undefined;delete tn.style.op;core.children.push(tn);} /* внутренний текст своего элемента не имеет: в карту сверки не попадает */
    else if(!kids.length&&texts.length){core=textNode(texts.map(function(t){return t.nodeValue;}).join(' ').replace(/\s+/g,' ').trim(),cs,tag,X,where,where);
      core.style=Object.assign(core.style,{});bx=null;
      if(cs.display==='inline'&&el.parentElement){ /* строчный текст: высоту строки задаёт «распорка» родителя (его line-height), если она больше своей */
        var pcs=win.getComputedStyle(el.parentElement),plh=parseFloat(pcs.lineHeight),tt=core.style.text;
        if(isFinite(plh)&&plh>0&&tt.fs>0&&plh/tt.fs>tt.lh)tt.lh=Math.min(4,r2(plh/tt.fs*1000)/1000);}}
    else{
      [].forEach.call(el.childNodes,function(c){
        if(c.nodeType===3){var t=c.nodeValue.replace(/\s+/g,' ').trim();if(t){var q=textNode(t,cs,tag,X,where);delete q.style.op;core.children.push(q);}}
        else if(c.nodeType===1){var k=conv(c,c2,X,path.concat(c.parentNode&&[].indexOf.call(el.children,c)),false);if(k)core.children.push(k);}});
      if(c2.sp&&core.children.length){ /* space-around / space-evenly: края = доля свободного места, между детьми «between» */
        var vk=kids.filter(function(c){return !/absolute|fixed/.test(win.getComputedStyle(c).position);}),sum=0,n=vk.length;
        vk.forEach(function(c){var b=c.getBoundingClientRect();sum+=c2.dir==='row'?b.width:b.height;});
        var F=(c2.dir==='row'?c2.cw:c2.ch)-sum-c2.gap*(n-1),e=r2(F/(c2.sp[1]==='around'?2*n:n+1)),p=(L.pad||[0,0,0,0]).slice();
        if(c2.dir==='row'){p[1]+=e;p[3]+=e;}else{p[0]+=e;p[2]+=e;}L.pad=p;L.jc='between';}
      if(bx&&bx.split){var sp=mk('shape','Нижняя часть фона',{float:true,x:0,y:r2((r.height-c2.bt-px(cs.borderBottomWidth))*bx.split.at/100),w:'fill',h:'fill'},{bg:bx.split.c},{shape:'rect'});
        sp.layout.h=r2((r.height-c2.bt-px(cs.borderBottomWidth))*(100-bx.split.at)/100);core.children.unshift(sp);core.style.clip=true;}}}
  X.pm[core.id]=path;
  if(isRoot){core.layout={dir:core.layout.dir,gap:core.layout.gap,pad:core.layout.pad,ai:core.layout.ai,jc:core.layout.jc};Object.keys(core.layout).forEach(function(k){if(core.layout[k]===undefined)delete core.layout[k];});return core;}
  var L0=core.layout;
  if(core.type!=='icon'){L0.w=sizeAxis(el,cs,r,ctx,mg,'w',abs);L0.h=sizeAxis(el,cs,r,ctx,mg,'h',abs);limits(L0,cs);}
  if(bi&&core.type==='frame'&&L0.h==='hug')L0.h=r2(r.height);
  if(core.type==='text'){core.layout.h='hug';if(L0.w!=='fill')L0.w='hug';}
  if(abs){L0.float=true;L0.x=r2(r.left-ctx.rect.left-ctx.bl);L0.y=r2(r.top-ctx.rect.top-ctx.bt);return core;}
  if(bx&&bx.sides){ /* граница только сверху или снизу: отдельная полоска-разделитель в рамке-обёртке */
    var sd=bx.sides,dv=mk('shape','Разделитель',{w:'fill',h:r2(sd.w)},{bg:sd.c},{shape:'rect'});
    if(typeof L0.h==='number')L0.h=r2(L0.h-sd.w);
    var wr=mk('frame','Строка с разделителем',{dir:'column',ai:'stretch',jc:'start',w:L0.w==='fill'?'fill':'hug',h:'hug'},{});
    wr.children=sd.side==='top'?[dv,core]:[core,dv];core=wr;L0=core.layout;if(L0.w==='fill'){wr.children[sd.side==='top'?1:0].layout.w='fill';}}
  if(mg.t||mg.r||mg.b||mg.l)core=wrapMargins(core,mg,ctx,r);
  self=cs.alignSelf==='auto'?ctx.ai:(AI[cs.alignSelf]||ctx.ai);
  if(ctx.flex&&self!==ctx.ai){
    var cross=ctx.dir==='row'?'h':'w',main=ctx.dir==='row'?'w':'h',W=mk('frame','Выравнивание',{dir:ctx.dir,ai:self,jc:'start'},{});
    W.layout[cross]='fill';W.layout[main]=core.layout[main]==='fill'?'fill':'hug';
    if(core.layout[cross]==='fill'&&self!=='stretch')core.layout[cross]='hug';
    W.children=[core];return W;}
  return core;}
function wrapMargins(core,mg,ctx,r){
  var L=core.layout,neg=mg.t<0,W=mk('frame','Отступ',{dir:'column',ai:'stretch',jc:'start'},{});
  function fillOf(ax){return L[ax]==='fill'?'fill':null;}
  var outerW=r.width+mg.l+mg.r,wF=fillOf('w')||(ctx.dir==='column'&&ctx.stretch&&Math.abs(outerW-ctx.cw)<0.6?'fill':null);
  if(!neg){W.layout.pad=[mg.t,mg.r,mg.b,mg.l].map(function(v){return Math.max(0,r2(v));});W.layout.w=wF||'hug';W.layout.h=fillOf('h')||'hug';
    if(W.layout.w!=='fill'&&L.w==='fill')L.w='hug';if(W.layout.h!=='fill'&&L.h==='fill')L.h='hug';W.children=[core];return W;}
  /* отрицательный верхний отступ: рамка нужной высоты, узел «на плаву» со сдвигом вверх */
  W.layout.w=wF||r2(outerW);W.layout.h=r2(r.height+mg.t+Math.max(0,mg.b));
  if(W.layout.pad===undefined&&(mg.r>0||mg.b>0)){}
  L.float=true;L.x=Math.max(0,r2(mg.l));L.y=r2(mg.t);if(L.w!=='fill'&&typeof L.w!=='number')L.w=r2(r.width);W.children=[core];return W;}

/* ---------- вход ---------- */
function shapeOf(p){var s=(p&&p.shape)||{};function n(v,d){var x=parseFloat(v);return isFinite(x)?x:d;}return {r:n(s.r,14),rl:n(s.rl,22),bw:n(s.bw,1.5),ledge:n(s.ledge,3)};}
/* I.parse({html,css,profile,theme,w,h}) → Promise({root,map,report,w,h}); профиль и тема нужны для замены цветов токенами; map: id узла → путь элемента */
I.parse=function(o){
  var p=o.profile||(ST.prof&&ST.p?ST.prof.cur(ST.p):null),theme=o.theme||'light',w=o.w||390,h=o.h||844;
  var X={p:p,theme:theme,tk:U.tokMap(p,theme),shape:shapeOf(p),pm:{},rep:{tok:0,raw:[],icons:[],notes:[],count:0}};
  return I.sandbox(o.html,o.css||'',w,h).then(function(f){
    try{var d=f.contentDocument,el=d.body.firstElementChild;if(!el)throw new Error('в разметке нет ни одного элемента');
      var r=el.getBoundingClientRect();
      var root=conv(el,{dir:'column',stretch:true,flex:true,cw:0,ch:0,rect:r,bl:0,bt:0,pw:0,ph:0},X,[],true);
      return {root:root,map:X.pm,report:X.rep,w:Math.round(r.width),h:Math.round(r.height)};}
    finally{f.remove();}});};
})();
