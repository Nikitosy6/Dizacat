/* Catworking Studio: узел → CSS и HTML для холста (чистые функции, без DOM). Дополняет ST.nodes */
(function(){'use strict';
var ST=window.ST,N=ST.nodes,h=ST.esc;
function col(v){return ST.tok?ST.tok.css(v):String(v);}
function len(v){ /* число → px; значение формы профиля → var(--r) и т. п. */
  if(typeof v==='number')return v+'px';
  return N.SHAPE_REF[v]?'var(--'+N.SHAPE_REF[v]+')':'0';}
/* Значения формы профиля для рамки холста (--r, --rl, --bw, --ledge) */
N.shapeVars=function(){var o=N.SHAPE;return '--r:'+o.r+';--rl:'+o.rl+';--bw:'+o.bw+';--ledge:'+o.ledge+';';};
/* ctx: {dir:'row'|'column' (направление родителя), root:true} → строка CSS узла */
N.css=function(n,p,ctx){
  ctx=ctx||{};
  var L=n.layout||{},S=N.styleOf(n,ctx.state!==undefined?ctx.state:N.vstate),o=['box-sizing:border-box'],dir=ctx.dir,flt=!!L.float&&!ctx.root,fx='';
  if(n.type==='frame'){
    o.push('position:relative','display:flex','flex-direction:'+(L.dir==='row'?'row':'column'));
    if(L.gap)o.push('gap:'+L.gap+'px');
    if(Array.isArray(L.pad))o.push('padding:'+L.pad.map(function(x){return (Number(x)||0)+'px';}).join(' '));
    o.push('align-items:'+({start:'flex-start',center:'center',end:'flex-end',stretch:'stretch'}[L.ai]||'flex-start'));
    o.push('justify-content:'+({start:'flex-start',center:'center',end:'flex-end',between:'space-between'}[L.jc]||'flex-start'));
    if(L.wrap)o.push('flex-wrap:wrap');}
  if(flt)o.push('position:absolute','left:'+(Number(L.x)||0)+'px','top:'+(Number(L.y)||0)+'px');
  var main=dir==='row'?'w':dir==='column'?'h':'';
  ['w','h'].forEach(function(k){
    var v=L[k],pr=k==='w'?'width':'height',im=k===main;
    if(ctx.root){o.push(pr+':100%');return;}
    if(v==='fill'){if(flt||!dir)o.push(pr+':100%');else if(im)fx='flex:1 1 0;'+(k==='w'?'min-width:0':'min-height:0');else o.push('align-self:stretch');}
    else if(typeof v==='number'){o.push(pr+':'+v+'px');if(im)fx='flex:none';}
    else{o.push(pr+':fit-content');if(im)fx='flex:none';}});
  if(fx)o.push(fx);
  [['minW','min-width'],['maxW','max-width'],['minH','min-height'],['maxH','max-height']].forEach(function(a){
    if(typeof L[a[0]]==='number')o.push(a[1]+':'+L[a[0]]+'px');});
  /* фон: токен, градиент или цвет; у корня экрана по умолчанию фон приложения */
  var bg=S.bg||(ctx.root?'@bg':'');
  if(n.type==='image')o.push('background:'+(bg?col(bg):'repeating-conic-gradient(var(--ln,#ccc) 0 25%,var(--card,#eee) 0 50%) 0 0/16px 16px'),'image-rendering:pixelated');
  else if(bg)o.push('background:'+col(bg));
  if(S.bd&&(S.bd.w===undefined||S.bd.w))o.push('border:'+len(S.bd.w===undefined?'var:bw':S.bd.w)+' solid '+col(S.bd.c||'@ln'));
  if(Array.isArray(S.rc))o.push('border-radius:'+S.rc.map(len).join(' '));
  else if(S.r!==undefined)o.push('border-radius:'+len(S.r));
  else if(n.type==='shape'&&n.props&&n.props.shape==='ellipse')o.push('border-radius:50%');
  var sh=[];
  if(S.ledge&&(S.ledge.y===undefined||S.ledge.y))sh.push('0 '+len(S.ledge.y===undefined?'var:ledge':S.ledge.y)+' 0 '+col(S.ledge.c||'@ln'));
  if(S.sh&&(S.sh.y||S.sh.x||S.sh.b))sh.push((S.sh.x||0)+'px '+(S.sh.y||0)+'px '+(S.sh.b||0)+'px '+col(S.sh.c||'rgba(0,0,0,.25)'));
  if(sh.length)o.push('box-shadow:'+sh.join(','));
  if(typeof S.rot==='number'&&S.rot){o.push('transform:rotate('+S.rot+'deg)');
    var ro=S.rotO||{};o.push('transform-origin:'+(ro.x===undefined?50:ro.x)+'% '+(ro.y===undefined?50:ro.y)+'%');}
  if(typeof S.op==='number'&&S.op!==100)o.push('opacity:'+(S.op/100));
  var f=[];
  if(typeof S.br==='number'&&S.br!==100)f.push('brightness('+S.br/100+')');
  if(typeof S.ct==='number'&&S.ct!==100)f.push('contrast('+S.ct/100+')');
  if(typeof S.sa==='number'&&S.sa!==100)f.push('saturate('+S.sa/100+')');
  if(typeof S.bl==='number'&&S.bl>0)f.push('blur('+S.bl+'px)');
  if(f.length)o.push('filter:'+f.join(' '));
  if(S.blend&&S.blend!=='normal')o.push('mix-blend-mode:'+S.blend);
  if(S.clip||ctx.root)o.push('overflow:hidden');
  if(n.type==='text'){o.push('margin:0','white-space:pre-wrap','overflow-wrap:anywhere');
    if(S.text&&ST.fonts&&!ST.fonts.checkT(S.text))o.push(ST.fonts.css(S.text,p||ST.p));}
  if(n.type==='icon')o.push('color:'+col(S.ic||'@tx'),'flex:none');
  return o.join(';')+';';};
/* HTML узла с потомками. Скрытые узлы не рисуются. */
N.html=function(n,p,ctx){
  ctx=ctx||{};if(n.hidden)return '';
  var kids='',dir=n.layout&&n.layout.dir==='row'?'row':'column',inner='',cls='st-n';
  if(n.type==='frame'){kids=(n.children||[]).map(function(c){return N.html(c,p,{dir:dir,state:ctx.state});}).join('');inner=kids;if(!kids)cls+=' st-e';}
  else if(n.type==='text')inner=h((n.props&&n.props.text)||'');
  else if(n.type==='icon')inner='<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block">'+(N.ICONS[n.props&&n.props.icon]||N.ICONS.star)+'</svg>';
  var fl=n.layout&&n.layout.float&&!ctx.root;
  return '<div class="'+cls+(ctx.root?' st-root':'')+'" data-nid="'+h(n.id)+'" data-type="'+n.type+'" data-pd="'+(ctx.dir||'')+'"'+(n.type==='frame'?' data-dir="'+dir+'"':'')+(fl?' data-fl="1"':'')+' style="'+h(N.css(n,p,ctx))+'">'+inner+'</div>';};
/* стиль для живого предпросмотра: узел с подставленными парами [[путь,значение],…], в проект ничего не пишется */
N.cssWith=function(n,pairs,p,ctx){var c=JSON.parse(JSON.stringify(n));
  pairs.forEach(function(pr){var a=N.sp(pr[0]).split('.'),o=c,i; /* показано состояние: style.* пробуется как правка этого состояния */
    for(i=0;i<a.length-1;i++){if(typeof o[a[i]]!=='object'||o[a[i]]===null)o[a[i]]=/^\d+$/.test(a[i+1])?[0,0,0,0]:{};o=o[a[i]];}
    if(pr[1]===undefined)delete o[a[a.length-1]];else o[a[a.length-1]]=pr[1];});
  return N.css(c,p,ctx);};
})();
