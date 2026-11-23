/* Catworking Studio: токены (данные, цвет, контраст, ссылки на токены). Без DOM. Объект ST.tok */
(function(){'use strict';
var ST=window.ST=window.ST||{},tok=ST.tok={};
/* Начальный набор: профиль «Макеты Nunito» (studio-profiles.json), только цвета (r и sh не цвета, они позже). n=имя, a=имя в приложении, r=роль, l/d=светлая/тёмная */
tok.DEFAULT=[
  {n:"bg",a:"--bg",r:"фон экрана",l:"#fff1de",d:"#1c1410"},
  {n:"card",a:"--panel",r:"карточка, панель, шторка",l:"#fffaf2",d:"#2a1e16"},
  {n:"tx",a:"--fg",r:"основной текст",l:"#3b2616",d:"#fbebd6"},
  {n:"mu",a:"--mut",r:"второстепенный текст",l:"#86654c",d:"#c4a98e"},
  {n:"ln",a:"--line",r:"рамки, бортик, разделители",l:"#f0dcc2",d:"#3d2c20"},
  {n:"ac",a:"--acc",r:"акцент",l:"#f59a23",d:"#f5a02e"},
  {n:"act",a:"--accfg",r:"текст на акценте",l:"#3b1f08",d:"#2b1606"},
  {n:"ton",a:"--p2",r:"вторичная поверхность (кнопка .btn, активная вкладка)",l:"#fde3bf",d:"#46321f"},
  {n:"ed",a:"--accd",r:"нижний бортик и рамка акцентной кнопки",l:"#d9812a",d:"#b86f1a"},
  {n:"trk",a:"--trk",r:"дорожка прогресса (новая переменная)",l:"#f3e1c8",d:"#3a2a1e"},
  {n:"tile0",a:"--tile0",r:"плитка иконки, верх градиента (новая)",l:"#ffb347",d:"#ffb347"},
  {n:"tile1",a:"--tile1",r:"плитка иконки, низ градиента (новая)",l:"#f28a10",d:"#f28a10"},
  {n:"t0",a:"--t0",r:"бирюзовый ряд баннера «Импорт», тёмный (новая)",l:"#0f4f4a",d:"#083f3b"},
  {n:"t1",a:"--t1",r:"бирюзовый ряд, средний (новая)",l:"#146a64",d:"#0e5a55"},
  {n:"t2",a:"--t2",r:"бирюзовый ряд, светлый (новая)",l:"#1c8077",d:"#167068"},
  {n:"bg2",a:"--bg2",r:"низ градиента фона body",l:"#fbe6c8",d:"#150f0b"},
  {n:"mint",a:"--mint",r:"мятный: вторичный акцент, баннеры, столбики",l:"#1c8077",d:"#3fc9b5"},
  {n:"pink",a:"--pink",r:"розовый",l:"#e0577f",d:"#f58aae"},
  {n:"ok",a:"--ok",r:"успех",l:"#2e9e5b",d:"#4cc27f"},
  {n:"warn",a:"--warn",r:"предупреждение",l:"#b87800",d:"#ffc247"},
  {n:"bad",a:"--bad",r:"ошибка",l:"#d64545",d:"#f2706b"},
  {n:"vio",a:"--vio",r:"фиолетовый баннера курса (sj-course.css:6; в приложении возможно не задан)",l:"#7a55d8",d:"#b79bff"}
];
tok.STD_PAIRS=[['tx','bg'],['tx','card'],['mu','bg'],['mu','card'],['act','ac'],['tx','ton']]; /* пары из контракта §11.6 */
tok.NAME_RE=/^[a-z][a-z0-9-]{0,31}$/;
var REF=/@(g:)?([a-z][a-z0-9-]*)/g;
var RAW=/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
function isO(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}

/* ---------- вид проекта: светлая / тёмная / обе рядом (настройка студии, не часть проекта) ---------- */
tok.getView=function(){var v='both';try{v=localStorage.getItem('st-ptheme')||v;}catch(e){}return (v==='light'||v==='dark'||v==='both')?v:'both';};
tok.view=tok.getView();
tok.setView=function(v){tok.view=v;try{localStorage.setItem('st-ptheme',v);}catch(e){}if(ST.emit)ST.emit('view');};
tok.cycleView=function(){tok.setView({both:'light',light:'dark',dark:'both'}[tok.view]||'both');};
tok.themes=function(){return tok.view==='both'?['light','dark']:[tok.view];};

/* ---------- цвет ---------- */
tok.parse=function(s){
  if(typeof s!=='string')return null;s=s.trim().toLowerCase();
  var m=/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s),h;
  if(m){h=m[1];if(h.length<=4)h=h.replace(/./g,function(c){return c+c;});
    return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16),h.length===8?parseInt(h.substr(6,2),16)/255:1];}
  m=/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,\/]\s*([0-9.]+%?)\s*)?\)$/.exec(s);
  if(m){var r=+m[1],g=+m[2],b=+m[3],a=1;if(r>255||g>255||b>255)return null;
    if(m[4]!==undefined){a=m[4].slice(-1)==='%'?parseFloat(m[4])/100:parseFloat(m[4]);if(!(a>=0&&a<=1))return null;}
    return [r,g,b,a];}
  return null;
};
function x2(n){n=Math.round(n);return (n<16?'0':'')+n.toString(16);}
tok.norm=function(s){var c=tok.parse(s);if(!c)return '';s=String(s).trim().toLowerCase();
  if(s.charAt(0)!=='#')return s.replace(/\s+/g,' ');
  return '#'+x2(c[0])+x2(c[1])+x2(c[2])+(c[3]<1?x2(c[3]*255):'');};
tok.hex6=function(s){var c=tok.parse(s);return c?'#'+x2(c[0])+x2(c[1])+x2(c[2]):'#888888';};
function lin(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}
function lum(c){return 0.2126*lin(c[0])+0.7152*lin(c[1])+0.0722*lin(c[2]);}
function over(f,b){var a=f[3];return [f[0]*a+b[0]*(1-a),f[1]*a+b[1]*(1-a),f[2]*a+b[2]*(1-a),1];}
tok.contrast=function(fg,bg){ /* WCAG 2.x; прозрачность кладётся на фон (фон на белый) */
  var f=tok.parse(fg),b=tok.parse(bg);if(!f||!b)return null;
  if(b[3]<1)b=over(b,[255,255,255,1]);if(f[3]<1)f=over(f,b);
  var l1=lum(f),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);};
tok.fmtRatio=function(r){return r===null?'—':(Math.floor(r*100)/100).toFixed(2).replace('.',',')+':1';}; /* вниз, чтобы 4,499 не выглядело как 4,50 */
tok.grade=function(r){return r===null?'':r>=7?'AAA':r>=4.5?'AA':r>=3?'large':'fail';};

/* ---------- чтение ---------- */
tok.names=function(p){var o={},a=[];Object.keys(p.tokens.light).concat(Object.keys(p.tokens.dark)).forEach(function(n){if(!o[n]){o[n]=1;a.push(n);}});return a;};
tok.grads=function(p){return Object.keys(p.tokens.grad||{});};
tok.val=function(p,th,n){var v=p.tokens[th]&&p.tokens[th][n];return typeof v==='string'?v:'';};
tok.seed=function(d){var t=d.tokens;t.info=isO(t.info)?t.info:{};t.grad=isO(t.grad)?t.grad:{};
  tok.DEFAULT.forEach(function(x){t.light[x.n]=x.l;t.dark[x.n]=x.d;t.info[x.n]={app:x.a,role:x.r};});
  t.grad.tile={angle:180,stops:[{c:'@tile0',at:0},{c:'@tile1',at:100}]}; /* плитка иконки: был жёсткий #FFB347→#F28A10 (P1 п. 6) */
  return d;};

/* ---------- ссылки на токены в стиле узлов: «@имя» цвет, «@g:имя» градиент ---------- */
tok.refs=function(str){var out=[];if(typeof str!=='string')return out;str.replace(REF,function(m,g,n){out.push({g:!!g,n:n});return m;});return out;};
tok.css=function(str){return String(str).replace(REF,function(m,g,n){return g?'var(--g-'+n+')':'var(--'+n+')';});};
function walk(n,fn){fn(n);(n.children||[]).forEach(function(c){walk(c,fn);});}
function eachNode(p,fn){
  (p.screens||[]).forEach(function(s){if(s.root)walk(s.root,function(n){fn(n,s.name||'экран');});});
  (p.components||[]).forEach(function(c){var r=c&&(c.root||c);if(isO(r)&&r.type)walk(r,function(n){fn(n,c.name||'компонент');});});}
function eachStr(o,fn,path){path=path||[];if(!isO(o)&&!Array.isArray(o))return;
  Object.keys(o).forEach(function(k){var v=o[k],pp=path.concat(k);
    if(typeof v==='string')fn(v,function(nv){o[k]=nv;},pp);else if(v&&typeof v==='object')eachStr(v,fn,pp);});}
tok.usage=function(p){var u={c:{},g:{}};
  function add(r,l){var b=r.g?u.g:u.c;(b[r.n]=b[r.n]||[]);if(b[r.n].indexOf(l)<0)b[r.n].push(l);}
  eachNode(p,function(n,where){eachStr(n.style,function(v){tok.refs(v).forEach(function(r){add(r,where+' › '+(n.name||n.type));});});});
  var g=p.tokens.grad||{};
  Object.keys(g).forEach(function(k){((g[k]&&g[k].stops)||[]).forEach(function(s){tok.refs(s.c).forEach(function(r){add(r,'градиент «'+k+'»');});});});
  return u;};
tok.raws=function(p){ /* «сырые» цвета в узлах и подсказка, какой токен совпадает по значению */
  var out=[],idx={};
  tok.names(p).forEach(function(n){['light','dark'].forEach(function(th){var v=tok.norm(tok.val(p,th,n));if(v&&!idx[v])idx[v]=n;});});
  eachNode(p,function(n,where){eachStr(n.style,function(v,set,path){var m=v.match(RAW);
    if(m)m.forEach(function(c){out.push({id:n.id,node:n.name||n.type,where:where,path:path,color:c,suggest:idx[tok.norm(c)]||''});});});});
  return out;};

/* ---------- проверки ---------- */
tok.problems=function(p){var out=[],T=p.tokens,names=tok.names(p),have={};
  names.forEach(function(n){have[n]=1;['light','dark'].forEach(function(th){var v=T[th][n];
    if(v===undefined||v===null||v==='')out.push({k:'missing',n:n,th:th});
    else if(!tok.parse(v))out.push({k:'bad',n:n,th:th});});});
  var u=tok.usage(p);
  Object.keys(u.c).forEach(function(n){if(!have[n])out.push({k:'dangling',n:n,where:u.c[n][0]});});
  Object.keys(u.g).forEach(function(n){if(!(T.grad||{})[n])out.push({k:'dangling',n:'g:'+n,where:u.g[n][0]});});
  return out;};
tok.pairIssues=function(p,pairs){var out=[];
  (pairs||tok.STD_PAIRS).forEach(function(pr){['light','dark'].forEach(function(th){
    var f=tok.val(p,th,pr[0]),b=tok.val(p,th,pr[1]);if(!f||!b)return;
    var r=tok.contrast(f,b);if(r!==null&&r<4.5)out.push({fg:pr[0],bg:pr[1],th:th,r:r});});});
  return out;};
tok.countWarn=function(p){return tok.problems(p).length+tok.pairIssues(p).length;};

/* ---------- имена и значения ---------- */
tok.cleanName=function(s){return String(s==null?'':s).trim().toLowerCase();};
tok.checkName=function(p,name,except,isGrad){
  if(!name)return 'Имя токена не может быть пустым.';
  if(!tok.NAME_RE.test(name))return 'Имя токена: только латинские буквы, цифры и дефис, начинается с буквы, до 32 знаков (например, card-bg). Кириллица в именах запрещена.';
  var list=isGrad?tok.grads(p):tok.names(p);
  if(name!==except&&list.indexOf(name)>=0)return 'Токен «'+name+'» уже есть.';
  return '';};
function usedText(list){return list.slice(0,4).join('; ')+(list.length>4?' и ещё '+(list.length-4):'');}
function res(ok,err){return ok?{ok:true}:{error:err||'Изменение не выполнено.'};}
/* профили (Шаг 1А): набор имён токенов и градиентов одинаков во всех профилях, поэтому добавление, переименование и удаление
   делаются во всех сразу, а значения цветов правятся только в активном профиле (он не должен быть встроенным) */
function ALL(x){return ST.prof?ST.prof.list(x):[{tokens:x.tokens}];}
function lockErr(){return ST.prof?ST.prof.guard():null;}

/* ---------- команды (всё через ST.do, значит отмена и возврат работают) ---------- */
tok.add=function(name,l,d,role){var g=lockErr();if(g)return g;name=tok.cleanName(name);var e=tok.checkName(ST.p,name);if(e)return {error:e};
  l=tok.norm(l||'#888888');d=tok.norm(d||l);if(!l||!d)return {error:'Цвет не распознан. Примеры: #f59a23, rgb(245 154 35), rgba(0,0,0,.28).'};
  return res(ST.do('новый токен '+name,function(x){ALL(x).forEach(function(q){var T=q.tokens;T.light[name]=l;T.dark[name]=d;
    T.info=T.info||{};T.info[name]={app:'',role:role||''};});}));};
tok.setVal=function(name,th,v){var g=lockErr();if(g)return g;var c=tok.norm(v);if(!c)return {error:'Цвет не распознан. Примеры: #f59a23, #f59a23cc, rgb(245 154 35), rgba(0,0,0,.28).'};
  if(tok.val(ST.p,th,name)===c)return {ok:true};
  return res(ST.do('цвет '+name+(th==='light'?' (светлая)':' (тёмная)'),function(x){x.tokens[th][name]=c;}));};
tok.setMeta=function(name,f,v){var g=lockErr();if(g)return g;v=String(v==null?'':v).trim();
  if(f==='app'&&v&&!/^--[a-z][a-z0-9-]*$/.test(v))return {error:'Имя в приложении пишется как CSS-переменная: --panel, --acc (латиница, цифры, дефис).'};
  var cur=((ST.p.tokens.info||{})[name]||{})[f]||'';if(cur===v)return {ok:true};
  return res(ST.do('токен '+name+': '+(f==='app'?'имя в приложении':'роль'),function(x){x.tokens.info=x.tokens.info||{};
    var i=x.tokens.info[name]=x.tokens.info[name]||{app:'',role:''};i[f]=v;}));};
function renameRefs(x,old,nw,g){
  function fix(s){return s.replace(REF,function(m,gg,n){return (!!gg===!!g&&n===old)?'@'+(g?'g:':'')+nw:m;});}
  eachNode(x,function(n){eachStr(n.style,function(v,set){var nv=fix(v);if(nv!==v)set(nv);});});
  ALL(x).forEach(function(q){var G=(q.tokens&&q.tokens.grad)||{};
    Object.keys(G).forEach(function(k){((G[k]||{}).stops||[]).forEach(function(s){if(typeof s.c==='string')s.c=fix(s.c);});});
    Object.keys(q.text||{}).forEach(function(k){var t=q.text[k];if(isO(t)&&typeof t.c==='string')t.c=fix(t.c);});});} /* стили текста тоже ссылаются на токены (@tx) */
function reorder(o,old,nw){var r={};Object.keys(o).forEach(function(k){r[k===old?nw:k]=o[k];});return r;}
tok.rename=function(old,nw){var g=lockErr();if(g)return g;nw=tok.cleanName(nw);if(nw===old)return {ok:true};var e=tok.checkName(ST.p,nw,old);if(e)return {error:e};
  return res(ST.do('переименование '+old+' → '+nw,function(x){ALL(x).forEach(function(q){var T=q.tokens;
    T.light=reorder(T.light,old,nw);T.dark=reorder(T.dark,old,nw);T.info=reorder(T.info||{},old,nw);});renameRefs(x,old,nw,false);}));};
tok.remove=function(name){var g=lockErr();if(g)return g;var u=tok.usage(ST.p).c[name];
  if(u&&u.length)return {error:'Токен «'+name+'» используется: '+usedText(u)+'. Сначала замените его в этих местах, потом удалите.',used:u};
  return res(ST.do('удаление токена '+name,function(x){ALL(x).forEach(function(q){var T=q.tokens;delete T.light[name];delete T.dark[name];if(T.info)delete T.info[name];});}));};

/* ---------- градиенты: 2–3 стопа, стоп = токен («@имя») или свой цвет ---------- */
tok.gradCheck=function(p,g){
  if(!g||!Array.isArray(g.stops)||g.stops.length<2||g.stops.length>3)return 'В градиенте нужно 2 или 3 стопа.';
  if(!isFinite(g.angle))return 'Угол должен быть числом.';
  var have=tok.names(p);
  for(var i=0;i<g.stops.length;i++){var s=g.stops[i];
    if(!(s.at>=0&&s.at<=100))return 'Позиция стопа от 0 до 100 %.';
    var r=tok.refs(s.c);
    if(r.length===1&&!r[0].g&&s.c==='@'+r[0].n){if(have.indexOf(r[0].n)<0)return 'Токен «'+r[0].n+'» не найден.';}
    else if(!tok.parse(s.c))return 'Стоп '+(i+1)+': цвет не распознан.';}
  return '';};
tok.gradCss=function(g){return 'linear-gradient('+(Number(g.angle)||0)+'deg,'+g.stops.map(function(s){return tok.css(s.c)+' '+(Number(s.at)||0)+'%';}).join(',')+')';};
tok.addGrad=function(name){var g=lockErr();if(g)return g;name=tok.cleanName(name);var e=tok.checkName(ST.p,name,'',true);if(e)return {error:e};
  var n=tok.names(ST.p),a=n[0]?'@'+n[0]:'#888888',b=n[1]?'@'+n[1]:'#444444';
  return res(ST.do('новый градиент '+name,function(x){ALL(x).forEach(function(q){q.tokens.grad=q.tokens.grad||{};q.tokens.grad[name]={angle:180,stops:[{c:a,at:0},{c:b,at:100}]};});}));};
tok.setGrad=function(name,g){var le=lockErr();if(le)return le;var e=tok.gradCheck(ST.p,g);if(e)return {error:e};
  return res(ST.do('градиент '+name,function(x){x.tokens.grad[name]=g;}));};
tok.renameGrad=function(old,nw){var g=lockErr();if(g)return g;nw=tok.cleanName(nw);if(nw===old)return {ok:true};var e=tok.checkName(ST.p,nw,old,true);if(e)return {error:e};
  return res(ST.do('переименование градиента '+old+' → '+nw,function(x){ALL(x).forEach(function(q){q.tokens.grad=reorder(q.tokens.grad||{},old,nw);});renameRefs(x,old,nw,true);}));};
tok.removeGrad=function(name){var g=lockErr();if(g)return g;var u=tok.usage(ST.p).g[name];
  if(u&&u.length)return {error:'Градиент «'+name+'» используется: '+usedText(u)+'. Сначала замените его, потом удалите.',used:u};
  return res(ST.do('удаление градиента '+name,function(x){ALL(x).forEach(function(q){delete (q.tokens.grad||{})[name];});}));};

/* ---------- сырой цвет → токен (кнопку «сделать токеном» поставит Шаг 4 в инспекторе узла) ---------- */
tok.promote=function(nodeId,path,color,name){name=tok.cleanName(name);
  var exists=tok.names(ST.p).indexOf(name)>=0;
  if(!exists){var g=lockErr();if(g)return g;var e=tok.checkName(ST.p,name);if(e)return {error:e};}
  var c=tok.norm(color);if(!exists&&!c)return {error:'Этот цвет нельзя сделать токеном: формат не распознан.'};
  return res(ST.do('сырой цвет → токен '+name,function(x){
    if(!exists)ALL(x).forEach(function(q){var T=q.tokens;T.light[name]=c;T.dark[name]=c;T.info=T.info||{};T.info[name]={app:'',role:''};});
    var done=false;
    eachNode(x,function(n){if(done||n.id!==nodeId)return;var o=n.style;
      for(var i=0;i<path.length-1;i++){o=o&&o[path[i]];}
      var k=path[path.length-1];
      if(o&&typeof o[k]==='string'&&o[k].indexOf(color)>=0){o[k]=o[k].replace(color,'@'+name);done=true;}});
    if(!done)throw new Error('цвет в узле не найден (возможно, он уже изменён)');}));};

/* ---------- значения для холста и экспорта ---------- */
tok.vars=function(p,th){var v={},T=p.tokens;
  tok.names(p).forEach(function(n){var c=T[th][n];if(c&&tok.parse(c))v['--'+n]=c;});
  Object.keys(T.grad||{}).forEach(function(k){if(!tok.gradCheck(p,T.grad[k]))v['--g-'+k]=tok.gradCss(T.grad[k]);});
  return v;};
tok.styleAttr=function(p,th){var v=tok.vars(p,th);return Object.keys(v).map(function(k){return k+':'+v[k]+';';}).join('');};
})();
