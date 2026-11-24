/* Catworking Studio: самопроверка экспорта (Шаг 7, п. 8). Объект ST.exp.check.
   Экспортированные CSS и разметка подставляются в изолированный iframe: базовая страница = токены профиля «Catworking сейчас» (только существующие переменные приложения)
   и упрощённые глобальные .card, .btn, .chip, .row (файлов приложения в студии нет). Затем каждый узел сравнивается с тем, что рисует холст:
   положение и размер (допуск 1 px) и вид (цвет, фон, рамка, радиус, тень, шрифт). Режим module дополнительно проверяет утечку стиля (P6 п. 20). */
(function(){'use strict';
var ST=window.ST,X=ST.exp,N=ST.nodes,TOL=1;
var PROPS=['backgroundColor','backgroundImage','borderTopColor','borderTopWidth','borderTopLeftRadius','boxShadow','opacity'];
var TEXTP=['color','fontSize','fontWeight','letterSpacing'];
var GLOBALS='html,body{margin:0;padding:0}body{font-family:ui-rounded,"Nunito",system-ui,sans-serif;font-size:16px;line-height:1.5;background:var(--bg);color:var(--fg)}'
  +'.card{background:var(--panel);border:2px solid var(--line);border-radius:14px;box-shadow:0 4px 0 var(--line);padding:14px;margin-bottom:16px}'
  +'.btn{min-height:44px;padding:0 14px;background:var(--p2);color:var(--fg);border:2px solid var(--line);border-radius:10px;box-shadow:0 4px 0 var(--line)}'
  +'.chip{display:inline-block;padding:2px 10px;border:2px solid var(--line);border-radius:999px;font-size:13px;font-weight:600}.row{display:flex;gap:8px;flex-wrap:wrap}';
function kv(x){return x[0]+':'+x[1]+';';}
function baseCss(){
  var b=ST.prof.builtin('catworking-now');if(!b)return GLOBALS;
  function only(th){return X.varsOf(b,th).filter(function(x){return X.APP_VARS.indexOf(x[0].slice(2))>=0;}).map(kv).join('');}
  return ':root{'+only('dark')+'}:root[data-theme=light]{'+only('light')+'}'+GLOBALS;}
function shapeAttr(pr){var s=pr.shape||{};return '--r:'+s.r+';--rl:'+s.rl+';--bw:'+s.bw+';--ledge:'+s.ledge+';--sh:'+s.shadow+';';}
function refAttr(pr,th){var f={fonts:pr.fonts,text:pr.text};return ST.tok.styleAttr({tokens:pr.tokens},th)+ST.fonts.styleAttr(f)+shapeAttr(pr);}
function box(el,rt){var a=el.getBoundingClientRect(),b=rt.getBoundingClientRect();return {x:a.left-b.left,y:a.top-b.top,w:a.width,h:a.height};}
function sty(el,text){var cs=el.ownerDocument.defaultView.getComputedStyle(el),o={},k=PROPS.concat(text?TEXTP:[]);k.forEach(function(p){o[p]=cs[p];});return o;}
function settle(doc,el){if(el)void el.offsetHeight;return doc.fonts&&doc.fonts.ready?doc.fonts.ready:Promise.resolve();}
function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}

/* r: результат ST.exp.make; p: проект. → Promise({ok, skipped, n, tol, bad:[текст], leak:[текст], weak, note}) */
X.check=function(r,p){
  if(r.mode==='skin')return Promise.resolve({ok:true,skipped:true,note:'Для режима skin самопроверка не применяется: скин работает только после шагов приложения S1–S3.'});
  var pr=r.pr,w=r.screen.w,hh=r.screen.h,module=r.mode==='module',ids=[],ref=document.createElement('div'),ifr=document.createElement('iframe'),res={ok:true,n:0,tol:TOL,bad:[],leak:[],weak:false,note:''};
  N.walk(r.root,function(n){ids.push(n);});
  var refBase='position:absolute;left:-10000px;top:0;width:'+w+'px;height:'+hh+'px;overflow:hidden;';
  ref.style.cssText=refBase;
  ref.innerHTML=N.html(r.root,p,{root:true}).replace(/ st-e"/g,'"');
  document.body.appendChild(ref);
  var tokStyle='<style id="chk-tok">'+(r.tb.text||'')+'</style>',host=module?'<div class="'+r.prefix+'-root" id="chk-host" style="width:'+w+'px;height:'+hh+'px">':'<div id="chk-host" style="width:'+w+'px;height:'+hh+'px">';
  var leak=module?'<div class="card" id="lk-in">x</div></div><div class="card" id="lk-out">x</div>':'</div>';
  var doc='<!doctype html><html lang="ru" data-theme="light"><head><meta charset="utf-8"><link rel="stylesheet" href="fonts/fonts.css"><style>'+baseCss()+'</style>'+tokStyle
    +'<style>'+r.fonts.face+'</style><style>'+r.css.text+'</style></head><body>'+host+X.render(r.mk)+leak+'</body></html>';
  ifr.setAttribute('sandbox','allow-same-origin');ifr.setAttribute('aria-hidden','true');ifr.style.cssText='position:absolute;left:-10000px;top:0;width:'+w+'px;height:'+hh+'px;border:0;';
  function done(){ref.remove();ifr.remove();}
  return new Promise(function(ok,no){var t=setTimeout(function(){no(new Error('проверочное окно не загрузилось за 8 секунд'));},8000);
    ifr.onload=function(){clearTimeout(t);ok();};ifr.srcdoc=doc;document.body.appendChild(ifr);})
  .then(function(){var d=ifr.contentDocument;return Promise.all([settle(d,d.body),settle(document,ref)]).then(function(){return wait(30);});})
  .then(function(){
    var d=ifr.contentDocument,hostEl=d.getElementById('chk-host'),rootEl=hostEl.firstElementChild,refRoot=ref.firstElementChild;
    res.n=ids.length;
    ['light','dark'].forEach(function(th){
      d.documentElement.setAttribute('data-theme',th);
      ref.style.cssText=refBase+refAttr(pr,th);
      void d.body.offsetHeight;void ref.offsetHeight;
      var bad=[];
      ids.forEach(function(n){
        var a=ref.querySelector('[data-nid="'+n.id.replace(/"/g,'')+'"]'),b=n===r.root?rootEl:d.querySelector('.'+r.cls[n.id]);
        if(!a||!b){bad.push('«'+(n.name||n.type)+'»: нет в '+(a?'коде экспорта':'холсте'));return;}
        var A=box(a,refRoot),B=box(b,rootEl),txt=n.type==='text'||n.type==='icon';
        ['x','y','w','h'].forEach(function(k){if(Math.abs(A[k]-B[k])>TOL)bad.push('«'+(n.name||n.type)+'» ('+th+'): '+({x:'левый край',y:'верхний край',w:'ширина',h:'высота'})[k]+' '+A[k].toFixed(1)+' на холсте и '+B[k].toFixed(1)+' в экспорте');});
        var SA=sty(a,txt),SB=sty(b,txt);
        Object.keys(SA).forEach(function(k){if(k==='borderTopColor'&&SA.borderTopWidth==='0px'&&SB.borderTopWidth==='0px')return;if(SA[k]!==SB[k])bad.push('«'+(n.name||n.type)+'» ('+th+'): '+k+' на холсте «'+SA[k]+'», в экспорте «'+SB[k]+'»');});});
      res.bad=res.bad.concat(bad.slice(0,40));
      if(module)leakTest(d,th,pr,r.prefix,res);});
    var miss=r.fonts.files.filter(function(f){return d.fonts&&!d.fonts.check('16px "'+f.name+'"');});
    if(miss.length&&res.bad.length){res.weak=true;res.note='Шрифты ('+miss.map(function(f){return f.name;}).join(', ')+') не загрузились в проверочном окне: расхождения текста могут быть из-за этого, поэтому проверка не блокирует копирование.';}
    res.ok=!res.leak.length&&(!res.bad.length||res.weak);
    done();return res;})
  .catch(function(e){done();return {ok:false,n:0,tol:TOL,bad:['Проверка не выполнилась: '+(e&&e.message||e)+'.'],leak:[],weak:false,note:''};});};

/* утечка стиля: чужой .card вне корня не меняется от блока модуля; внутри корня .card получает --panel профиля */
function leakTest(d,th,pr,prefix,res){
  var out=d.getElementById('lk-out'),inn=d.getElementById('lk-in'),st=d.getElementById('chk-tok'),cs=d.defaultView.getComputedStyle.bind(d.defaultView);
  function snap(el){var c=cs(el);return c.backgroundColor+'|'+c.borderTopColor;}
  var on=snap(out);st.disabled=true;void d.body.offsetHeight;var off=snap(out);st.disabled=false;void d.body.offsetHeight;
  if(on!==off)res.leak.push('Утечка стиля ('+th+'): чужой .card вне корня .'+prefix+'-root изменил вид от блока значений.');
  var tn=null;ST.tok.names({tokens:pr.tokens}).forEach(function(n){if(X.appVar(pr,n)==='--panel')tn=n;});
  if(tn){var pb=d.createElement('div');pb.style.backgroundColor=pr.tokens[th][tn];d.body.appendChild(pb);var want=cs(pb).backgroundColor;pb.remove();
    if(cs(inn).backgroundColor!==want)res.leak.push('Внутри корня ('+th+') .card не получил значение --panel профиля: '+cs(inn).backgroundColor+' вместо '+want+'.');}}
})();
