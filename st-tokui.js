/* Catworking Studio: панель «Токены» (список слева, редактор справа), образец на холсте. Объект ST.tokui */
(function(){'use strict';
var ST=window.ST,tok=ST.tok,h=ST.esc,ui=ST.tokui={sel:null,showRaw:false};
function $(s){return document.querySelector(s);}
function sw(c){return '<i class="st-sw" style="background:'+h(tok.parse(c)?c:'#888')+'"></i>';}
function warn(m){return '<span class="st-warn" title="'+h(m)+'" aria-label="'+h(m)+'">⚠</span>';}
function say(r){if(r&&r.error){ST.ui.error(r.error);return false;}return true;}
function selOk(){var s=ui.sel,p=ST.p;if(!s)return false;
  return s.k==='c'?tok.names(p).indexOf(s.n)>=0:tok.grads(p).indexOf(s.n)>=0;}

/* ---------- слева: список ---------- */
ui.badge=function(){return ST.p?tok.countWarn(ST.p):0;};
ui.list=function(){
  var p=ST.p,pr=tok.problems(p),pi=tok.pairIssues(p),bad={},low={};
  pr.forEach(function(x){bad[x.n]=(bad[x.n]?bad[x.n]+', ':'')+(x.k==='missing'?'не задан в теме «'+(x.th==='light'?'светлая':'тёмная')+'»':x.k==='bad'?'неверный цвет':'');});
  pi.forEach(function(x){low[x.fg]=1;low[x.bg]=1;});
  var s='<div class="st-lh">Цвета</div>'+tok.names(p).map(function(n){
    var on=ui.sel&&ui.sel.k==='c'&&ui.sel.n===n,m=bad[n];
    return '<button class="st-b st-row st-tk'+(on?' on':'')+(m?' st-red':'')+'" data-st="tsel:c:'+h(n)+'">'+
      '<span class="st-tkn">'+h(n)+'</span><span class="st-tks">'+sw(tok.val(p,'light',n))+sw(tok.val(p,'dark',n))+'</span>'+
      (m?warn(m):low[n]?warn('Низкий контраст в одной из стандартных пар'):'')+'</button>';}).join('')+
    '<button class="st-b st-row" data-st="tadd:c">＋ Токен</button>'+
    '<div class="st-lh">Градиенты</div>'+tok.grads(p).map(function(n){
      var g=p.tokens.grad[n],on=ui.sel&&ui.sel.k==='g'&&ui.sel.n===n;
      return '<button class="st-b st-row st-tk'+(on?' on':'')+'" data-st="tsel:g:'+h(n)+'"><span class="st-tkn">'+h(n)+'</span>'+
        '<span class="st-tks"><i class="st-sw st-swg" style="background:'+h(tok.gradCheck(p,g)?'#888':tok.css(tok.gradCss(g)))+'"></i></span></button>';}).join('')+
    '<button class="st-b st-row" data-st="tadd:g">＋ Градиент</button>';
  var raws=tok.raws(p);
  if(raws.length)s+='<div class="st-lh">Сырые цвета: '+raws.length+'</div><p class="st-mut">Цвет вписан прямо в узел. Лучше сделать его токеном.</p>'+
    raws.slice(0,30).map(function(r,i){return '<button class="st-b st-row" data-st="traw:'+i+'">'+sw(r.color)+' '+h(r.color)+' · '+h(r.node)+
      (r.suggest?'<br><span class="st-mut">есть токен «'+h(r.suggest)+'»</span>':'')+'</button>';}).join('');
  return s;
};

/* ---------- справа: редактор ---------- */
function picker(th,name,val){
  var lab=th==='light'?'☀ Светлая':'🌙 Тёмная',ok=val&&tok.parse(val);
  return '<div class="st-lb">'+lab+(ok?'':' '+warn('Значение не задано или неверное'))+
    '<div class="st-prow"><input type="color" class="st-col" aria-label="Палитра, '+lab+'" data-tc="'+th+'" value="'+tok.hex6(val)+'">'+
    '<input class="st-in st-hex" data-th="'+th+'" inputmode="text" autocapitalize="off" spellcheck="false" maxlength="40" value="'+h(val||'')+'" placeholder="#rrggbb">'+
    (window.EyeDropper?'<button class="st-b st-ic" data-st="teye:'+th+'" aria-label="Пипетка">⌖</button>':'')+'</div></div>';
}
function ratioLine(th,fg,bg){
  var f=tok.val(ST.p,th,fg),b=tok.val(ST.p,th,bg),r=tok.contrast(f,b),g=tok.grade(r),cls=g==='fail'?'st-bad':g==='large'?'st-mid':'st-good';
  if(r===null)return '<div class="st-ct st-mid">'+(th==='light'?'☀':'🌙')+' нет значения</div>';
  var txt=g==='fail'?'не читается (нужно 3:1 для крупного, 4,5:1 для обычного)':g==='large'?'только крупный текст (обычному нужно 4,5:1)':'обычный текст читается';
  return '<div class="st-ct '+cls+'">'+(th==='light'?'☀':'🌙')+' '+tok.fmtRatio(r)+' · '+txt+'</div>';
}
function opts(sel,skip){return tok.names(ST.p).map(function(n){return '<option value="'+h(n)+'"'+(n===sel?' selected':'')+'>'+h(n)+'</option>';}).join('');}
ui.pair={fg:'',bg:''};
function colorEditor(n){
  var p=ST.p,info=(p.tokens.info||{})[n]||{},u=tok.usage(p).c[n]||[];
  if(!ui.pair.fg||ui.pair.fg2!==n){ui.pair={fg:n,bg:n==='bg'?'card':'bg',fg2:n};}
  var miss=tok.problems(p).filter(function(x){return x.n===n&&x.k!=='dangling';});
  return '<h3 class="st-h">Токен «'+h(n)+'»</h3>'+
    (miss.length?'<p class="st-banner">⚠ Токен задан не в обеих темах. Заполните оба цвета: без этого дизайн нельзя считать готовым.</p>':'')+
    '<label class="st-lb">Имя (латиница, цифры, дефис)<input class="st-in" data-tf="name" maxlength="32" value="'+h(n)+'"></label>'+
    picker('light',n,tok.val(p,'light',n))+picker('dark',n,tok.val(p,'dark',n))+
    '<label class="st-lb">Имя в приложении<input class="st-in" data-tf="app" maxlength="32" placeholder="--panel" value="'+h(info.app||'')+'"></label>'+
    '<label class="st-lb">Роль<input class="st-in" data-tf="role" maxlength="120" value="'+h(info.role||'')+'"></label>'+
    '<div class="st-lh">Контраст текста</div>'+
    '<div class="st-prow"><label class="st-lb st-half">Текст<select class="st-in" data-tf="pfg">'+opts(ui.pair.fg)+'</select></label>'+
    '<label class="st-lb st-half">Фон<select class="st-in" data-tf="pbg">'+opts(ui.pair.bg)+'</select></label></div>'+
    ratioLine('light',ui.pair.fg,ui.pair.bg)+ratioLine('dark',ui.pair.fg,ui.pair.bg)+
    '<div class="st-lh">Где используется</div><p class="st-mut">'+(u.length?h(u.slice(0,8).join('; ')+(u.length>8?' и ещё '+(u.length-8):'')):'пока нигде')+'</p>'+
    '<button class="st-b st-row st-danger" data-st="tdel:c">Удалить токен</button>';
}
function stopRow(g,i){
  var s=g.stops[i],isTok=/^@[a-z]/.test(s.c)&&s.c.indexOf('@g:')!==0,cur=isTok?s.c.slice(1):'';
  var o='<option value="#"'+(isTok?'':' selected')+'>свой цвет</option>'+tok.names(ST.p).map(function(n){
    return '<option value="'+h(n)+'"'+(n===cur?' selected':'')+'>'+h(n)+'</option>';}).join('');
  return '<div class="st-stop"><div class="st-prow"><select class="st-in" data-gs="'+i+'" aria-label="Стоп '+(i+1)+'">'+o+'</select>'+
    '<input class="st-in st-pos" inputmode="numeric" data-gp="'+i+'" value="'+h(s.at)+'" aria-label="Позиция, %"></div>'+
    (isTok?'':'<input class="st-in" data-gh="'+i+'" value="'+h(s.c)+'" placeholder="#rrggbb" maxlength="40" spellcheck="false">')+'</div>';
}
function gradEditor(n){
  var p=ST.p,g=p.tokens.grad[n],u=tok.usage(p).g[n]||[];
  return '<h3 class="st-h">Градиент «'+h(n)+'»</h3>'+
    '<div class="st-gprev" style="background:'+h(tok.gradCheck(p,g)?'#888':tok.css(tok.gradCss(g)))+'"></div>'+
    '<label class="st-lb">Имя<input class="st-in" data-gf="name" maxlength="32" value="'+h(n)+'"></label>'+
    '<label class="st-lb">Угол, °<input class="st-in" data-gf="angle" inputmode="numeric" value="'+h(g.angle)+'"></label>'+
    g.stops.map(function(s,i){return stopRow(g,i);}).join('')+
    '<div class="st-prow">'+(g.stops.length<3?'<button class="st-b st-grow" data-st="tgadd">＋ Стоп</button>':'')+
    (g.stops.length>2?'<button class="st-b st-grow" data-st="tgdel">− Стоп</button>':'')+'</div>'+
    '<div class="st-lh">Где используется</div><p class="st-mut">'+(u.length?h(u.slice(0,8).join('; ')):'пока нигде')+'</p>'+
    '<button class="st-b st-row st-danger" data-st="tdel:g">Удалить градиент</button>';
}
ui.inspector=function(){
  if(!selOk()){ui.sel=null;
    var pi=tok.pairIssues(ST.p),pr=tok.problems(ST.p);
    return '<h3 class="st-h">Токены</h3><p class="st-mut">Выберите токен в списке слева. Токены задаются сразу в светлой и тёмной теме; цвет узла всегда токен («@имя»).</p>'+
      (pr.length?'<p class="st-banner">⚠ Проблем с токенами: '+pr.length+'. Они помечены в списке красным.</p>':'')+
      (pi.length?'<div class="st-lh">Стандартные пары: низкий контраст</div>'+pi.map(function(x){
        return '<div class="st-ct st-bad">'+(x.th==='light'?'☀':'🌙')+' '+h(x.fg)+' на '+h(x.bg)+': '+tok.fmtRatio(x.r)+'</div>';}).join(''):
        '<p class="st-ct st-good">Стандартные пары (tx/bg, tx/card, mu/bg, mu/card, act/ac, tx/ton) читаются в обеих темах.</p>');}
  return ui.sel.k==='c'?colorEditor(ui.sel.n):gradEditor(ui.sel.n);
};

/* ---------- образец на холсте: пока нет узлов, показывает токены вживую ---------- */
ui.sample=function(){
  var c=function(n,f){return 'var(--'+n+','+(f||'#888')+')';};
  var chip=function(n,t){return '<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:'+c(n)+';color:'+c('card')+';font-size:13px;font-weight:700">'+t+'</span>';};
  return '<div style="height:100%;box-sizing:border-box;padding:20px;display:flex;flex-direction:column;gap:14px;background:linear-gradient('+c('bg')+','+c('bg2','var(--bg,#888)')+');color:'+c('tx','#222')+';font:500 16px/1.35 system-ui,sans-serif;overflow:hidden">'+
    '<div style="font-size:28px;font-weight:800">Образец токенов</div>'+
    '<div style="padding:16px;border-radius:20px;border:2px solid '+c('ln')+';box-shadow:0 4px 0 '+c('ln')+';background:'+c('card')+'">'+
      '<div style="font-size:17px;font-weight:800">Карточка предмета</div>'+
      '<div style="font-size:13px;font-weight:700;color:'+c('mu')+';margin:2px 0 12px">Второстепенный текст · 12 тем</div>'+
      '<div style="height:10px;border-radius:99px;background:'+c('trk')+';overflow:hidden"><div style="width:60%;height:100%;background:'+c('ac')+'"></div></div>'+
      '<div style="display:flex;gap:10px;margin-top:14px">'+
        '<span style="flex:1;display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:14px;background:'+c('ac')+';color:'+c('act')+';font-weight:800;border-bottom:4px solid '+c('ed')+'">Акцент</span>'+
        '<span style="flex:1;display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:14px;background:'+c('ton')+';color:'+c('tx')+';font-weight:800">Вторичная</span></div></div>'+
    '<div style="display:flex;gap:12px;align-items:center"><span style="width:56px;height:56px;border-radius:18px;background:var(--g-tile,'+c('ac')+');display:flex;align-items:center;justify-content:center;font-size:26px">★</span>'+
      '<span style="font-size:13px;font-weight:700;color:'+c('mu')+'">Плитка: градиент «tile»</span></div>'+
    '<div style="padding:14px;border-radius:18px;color:#fff;font-weight:800;background:linear-gradient(135deg,'+c('t0')+','+c('t1')+','+c('t2')+')">Импорт через ИИ</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:8px">'+chip('ok','успех')+chip('warn','внимание')+chip('bad','ошибка')+chip('mint','мята')+chip('pink','розовый')+chip('vio','фиолет')+'</div>'+
    '<div style="margin-top:auto;font-size:12px;font-weight:700;color:'+c('mu')+'">Узлы появятся в Шаге 4</div></div>';
};

/* ---------- события ---------- */
ui.sync=function(){var b=$('#st-pth'),m={both:'☀🌙',light:'☀',dark:'🌙'};
  if(b){b.textContent=m[tok.view];b.setAttribute('aria-label','Тема проекта: '+({both:'обе рядом',light:'светлая',dark:'тёмная'}[tok.view])+' (нажмите, чтобы сменить)');}};
function nextName(base){var i=1,p=ST.p,l=tok.names(p).concat(tok.grads(p));while(l.indexOf(base+i)>=0)i++;return base+i;}
function grad(){return JSON.parse(JSON.stringify(ST.p.tokens.grad[ui.sel.n]));}
function click(e){
  var t=e.target.closest('[data-st]');if(!t)return;var a=t.getAttribute('data-st'),r;
  if(a.indexOf('tsel:')===0){var q=a.split(':');ui.sel={k:q[1],n:q.slice(2).join(':')};ST.ui.sheetTo&&ST.ui.sheet==='left'&&ST.ui.sheetTo('right');ST.ui.render();}
  else if(a==='tadd:c'){var n=nextName('color');if(say(tok.add(n,'#888888','#888888',''))){ui.sel={k:'c',n:n};ST.ui.render();}}
  else if(a==='tadd:g'){var g=nextName('grad');if(say(tok.addGrad(g))){ui.sel={k:'g',n:g};ST.ui.render();}}
  else if(a==='tdel:c'){ST.ui.confirm('Удалить токен «'+ui.sel.n+'»?','Это можно отменить кнопкой ↶.','Удалить',true).then(function(ok){
    if(ok&&say(tok.remove(ui.sel.n))){ui.sel=null;ST.ui.render();}});}
  else if(a==='tdel:g'){ST.ui.confirm('Удалить градиент «'+ui.sel.n+'»?','Это можно отменить кнопкой ↶.','Удалить',true).then(function(ok){
    if(ok&&say(tok.removeGrad(ui.sel.n))){ui.sel=null;ST.ui.render();}});}
  else if(a==='tgadd'){var g2=grad();g2.stops.push({c:g2.stops[g2.stops.length-1].c,at:100});say(tok.setGrad(ui.sel.n,g2));}
  else if(a==='tgdel'){var g3=grad();g3.stops.pop();say(tok.setGrad(ui.sel.n,g3));}
  else if(a.indexOf('teye:')===0){var th=a.slice(5);
    new window.EyeDropper().open().then(function(x){say(tok.setVal(ui.sel.n,th,x.sRGBHex));}).catch(function(){});}
  else if(a.indexOf('traw:')===0){var rw=tok.raws(ST.p)[Number(a.slice(5))];if(!rw)return;
    var nm=rw.suggest||'c-'+tok.hex6(rw.color).slice(1);
    ST.ui.confirm('Сделать токеном?',rw.suggest?'Цвет '+rw.color+' совпадает с токеном «'+rw.suggest+'». Заменить в узле «'+rw.node+'»?':
      'Будет создан токен «'+nm+'» с этим цветом в обеих темах; в узле «'+rw.node+'» цвет заменится ссылкой.','Сделать').then(function(ok){
      if(ok)say(tok.promote(rw.id,rw.path,rw.color,nm));});}
}
function change(e){
  var el=e.target,s=ui.sel;if(!s||!ST.p)return;
  if(s.k==='c'){
    var f=el.getAttribute('data-tf');
    if(el.getAttribute('data-tc')){var th=el.getAttribute('data-tc');say(tok.setVal(s.n,th,el.value));return;}
    if(el.hasAttribute('data-th')){if(!say(tok.setVal(s.n,el.getAttribute('data-th'),el.value))){ST.ui.render();}return;}
    if(f==='name'){var r=tok.rename(s.n,el.value);if(say(r)){s.n=tok.cleanName(el.value);ST.ui.render();}else ST.ui.render();}
    else if(f==='app'||f==='role'){if(!say(tok.setMeta(s.n,f,el.value)))ST.ui.render();}
    else if(f==='pfg'){ui.pair.fg=el.value;ST.ui.render();}
    else if(f==='pbg'){ui.pair.bg=el.value;ST.ui.render();}
  }else{
    var g=grad(),ok2=true;
    if(el.getAttribute('data-gf')==='name'){if(say(tok.renameGrad(s.n,el.value)))s.n=tok.cleanName(el.value);ST.ui.render();return;}
    if(el.getAttribute('data-gf')==='angle')g.angle=Number(el.value);
    else if(el.hasAttribute('data-gs')){var i=Number(el.getAttribute('data-gs'));g.stops[i].c=el.value==='#'?(ST.p.tokens.light[tok.names(ST.p)[0]]||'#888888'):'@'+el.value;}
    else if(el.hasAttribute('data-gp'))g.stops[Number(el.getAttribute('data-gp'))].at=Number(el.value);
    else if(el.hasAttribute('data-gh')){var c=tok.norm(el.value);if(!c){say({error:'Цвет не распознан.'});ST.ui.render();return;}g.stops[Number(el.getAttribute('data-gh'))].c=c;}
    else ok2=false;
    if(ok2&&!say(tok.setGrad(s.n,g)))ST.ui.render();
  }
}
function input(e){ /* палитра тянется: показываем сразу, в историю пишем по окончании (событие change) */
  var el=e.target,th=el.getAttribute&&el.getAttribute('data-tc');
  if(th&&ui.sel&&ui.sel.k==='c'&&ST.canvas.live)ST.canvas.live(th,ui.sel.n,el.value);
}
ui.bind=function(){
  [$('#st-left'),$('#st-right')].forEach(function(box){
    box.addEventListener('click',click);box.addEventListener('change',change);box.addEventListener('input',input);});
};
})();
