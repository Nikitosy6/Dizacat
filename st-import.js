/* Catworking Studio: импорт разметки HTML → узлы (Шаг 6б). Объект ST.imp. Работает в браузере: разметка рисуется в скрытом iframe (sandbox, без скриптов),
   размеры, цвета и шрифты читаются у настоящих элементов (getComputedStyle), поэтому импорт не зависит от того, как написан CSS.
   Результат {root, map, report}: root — рамка экрана (узлы схемы 7), map — id узла → путь элемента в исходной разметке (для сверки, в проект не пишется),
   report — что не удалось передать точно. Совпавшие с токеном цвета заменяются токеном, остальные остаются сырыми; радиусы, рамка и бортик, равные значениям
   профиля, становятся ссылками var:r, var:rl, var:bw, var:ledge. В проект ничего не пишется: решает вызывающий (ST.impui). */
(function(){'use strict';
var ST=window.ST=window.ST||{},N=ST.nodes,I=ST.imp={};
function isO(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function r2(x){return Math.round(x*100)/100;}
function px(v){var x=parseFloat(v);return isFinite(x)?x:0;}

/* две иконки макетов, которых нет в наборе Шага 5 (путь чуть другой): добавляются в набор, чтобы значок не подменялся похожим */
var EXTRA={'menu-s':['<path d="M4 7h16M4 12h16M4 17h16"/>','меню (как в макетах)'],'trophy-s':['<path d="M7 4h10v5a5 5 0 01-10 0zM12 14v4M8 20h8"/>','кубок без ручек (как в макетах)']};
Object.keys(EXTRA).forEach(function(k){if(!N.ICONS[k]){N.ICONS[k]=EXTRA[k][0];if(ST.icons&&ST.icons.NAMES)ST.icons.NAMES[k]=EXTRA[k][1];}});
var NAVIC={'План':'calendar','Сегодня':'sun','Фокус':'timer','Кот':'paw','Предметы':'book'}; /* как в мастере нижней панели (Шаг 5) */
var DEFS=[];
function iconByPath(d){ /* путь значка → имя из набора (пробелы не важны) */
  var key=String(d).replace(/\s+/g,'');
  if(!iconByPath.m){iconByPath.m={};Object.keys(N.ICONS).forEach(function(k){var a=[],re=/ d="([^"]+)"/g,x;while((x=re.exec(N.ICONS[k])))a.push(x[1]);
    var kk=a.join('|').replace(/\s+/g,'');if(!iconByPath.m[kk])iconByPath.m[kk]=k;});}
  return iconByPath.m[key]||'';}

/* ---------- цвета ---------- */
function rgba(s){var m=/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,\/]\s*([\d.]+%?))?\s*\)$/.exec(String(s).trim());if(!m)return null;
  var a=m[4]===undefined?1:(m[4].slice(-1)==='%'?parseFloat(m[4])/100:parseFloat(m[4]));return [Math.round(+m[1]),Math.round(+m[2]),Math.round(+m[3]),Math.round(a*1000)/1000];}
function ckey(c){return c[0]+','+c[1]+','+c[2]+','+c[3];}
function hex(c){function x(n){return (n<16?'0':'')+n.toString(16);}return '#'+x(c[0])+x(c[1])+x(c[2]);}
function tokMap(p,theme){ /* значение токена в теме → '@имя' (первый по порядку) */
  var m={},t=p&&p.tokens&&p.tokens[theme]||{};
  Object.keys(t).forEach(function(n){var c=ST.tok&&ST.tok.parse(t[n]);if(!c)return;var k=ckey([c[0],c[1],c[2],Math.round(c[3]*1000)/1000]);if(!m[k])m[k]='@'+n;});
  return m;}
function colorOf(css,X,where){ /* '' если прозрачный */
  var c=rgba(css);if(!c||c[3]===0)return '';
  var t=X.tk[ckey(c)];if(t){X.rep.tok++;return t;}
  X.rep.raw.push({where:where,color:c[3]===1?hex(c):'rgba('+c[0]+','+c[1]+','+c[2]+','+c[3]+')'});
  return c[3]===1?hex(c):'rgba('+c[0]+','+c[1]+','+c[2]+','+c[3]+')';}

/* ---------- градиент ---------- */
function splitTop(s){var out=[],d=0,cur='';for(var i=0;i<s.length;i++){var ch=s[i];if(ch==='(')d++;if(ch===')')d--;if(ch===','&&d===0){out.push(cur.trim());cur='';}else cur+=ch;}if(cur.trim())out.push(cur.trim());return out;}
function parseGrad(s){
  var m=/^linear-gradient\((.*)\)$/.exec(String(s).trim());if(!m)return null;
  var parts=splitTop(m[1]),ang=180;
  if(/^-?[\d.]+deg$/.test(parts[0])){ang=parseFloat(parts.shift());}else if(/^to /.test(parts[0]))return null;
  var stops=parts.map(function(p){var q=/^(rgba?\([^)]*\))\s*([\d.]+(?:%|px))?$/.exec(p);if(!q)return null;var c=rgba(q[1]);
    return {c:c,at:q[2]===undefined?null:(q[2].slice(-1)==='%'?parseFloat(q[2]):null),px:q[2]&&q[2].slice(-2)==='px'?parseFloat(q[2]):null};});
  if(stops.some(function(x){return !x||!x.c;})||stops.length<2)return null;
  if(stops[0].at===null)stops[0].at=0;if(stops[stops.length-1].at===null)stops[stops.length-1].at=100;
  for(var i=1;i<stops.length-1;i++)if(stops[i].at===null){var a=i-1,b=i+1;while(stops[b].at===null)b++;stops[i].at=stops[a].at+(stops[b].at-stops[a].at)/(b-a);}
  return {angle:ang,stops:stops};}
function gradToken(g,X){ /* градиент профиля с теми же цветами и положениями (угол может отличаться: записывается в отчёт) */
  var gr=X.p&&X.p.tokens&&X.p.tokens.grad||{},best='';
  Object.keys(gr).forEach(function(n){if(best)return;var d=gr[n];if(!d||!d.stops||d.stops.length!==g.stops.length)return;
    var ok=d.stops.every(function(s,i){var c=ST.tok.parse(String(X.p.tokens[X.theme][String(s.c).slice(1)]||''));var q=g.stops[i].c;
      return c&&c[0]===q[0]&&c[1]===q[1]&&c[2]===q[2]&&Math.abs((Number(s.at)||0)-g.stops[i].at)<0.6;});
    if(ok){best=n;if(Math.abs((Number(d.angle)||0)-g.angle)>0.5)X.rep.notes.push('градиент «'+n+'»: угол в макете '+g.angle+'°, в профиле '+d.angle+'°');}});
  return best?'@g:'+best:'';}

/* ---------- тень ---------- */
function shadows(s){ /* строка box-shadow → [{x,y,b,sp,inset,c:[r,g,b,a]}] */
  if(!s||s==='none')return [];
  return splitTop(s).map(function(p){var inset=/\binset\b/.test(p);p=p.replace(/\binset\b/,'').trim();
    var m=/^(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?$/.exec(p);if(!m)return null;
    return {c:rgba(m[1]),x:+m[2],y:+m[3],b:+m[4],sp:m[5]===undefined?0:+m[5],inset:inset};}).filter(Boolean);}

/* ---------- стиль текста ---------- */
var TA={start:'left',left:'left',center:'center',right:'right',end:'right','-webkit-center':'center'};
function textStyle(cs,tag,X,where){
  var fs=px(cs.fontSize),lh=cs.lineHeight==='normal'?1.364:r2(px(cs.lineHeight)/fs),ls=cs.letterSpacing==='normal'?0:px(cs.letterSpacing)/fs;
  var tt={none:'none',uppercase:'upper',lowercase:'lower',capitalize:'cap'}[cs.textTransform]||'none';
  var role=/^h[1-3]$/.test(tag)||(parseInt(cs.fontWeight,10)>=800&&fs>=24)?'role:display':'role:body';
  var fam=(cs.fontFamily.split(',')[0]||'').replace(/["']/g,'').trim();
  var prof=X.p&&X.p.fonts||{},r=role.slice(5);
  var ff=(prof[r]&&String(prof[r]).toLowerCase()===fam.toLowerCase())?role:(/^[A-Za-z0-9][A-Za-z0-9 \-]{0,39}$/.test(fam)?fam:role);
  if(ff!==role)X.rep.notes.push('шрифт «'+fam+'» не из профиля (узел «'+where+'»)');
  return {ff:ff,fw:parseInt(cs.fontWeight,10)||400,fs:fs,lh:Math.max(0.5,Math.min(4,lh)),ls:r2(Math.max(-0.5,Math.min(2,ls))*1000)/1000,tt:tt,ta:TA[cs.textAlign]||'left',cl:0,
    c:colorOf(cs.color,X,where)||'@tx',tnum:/tabular-nums/.test(cs.fontVariantNumeric||'')};}
I._u={isO:isO,r2:r2,px:px,rgba:rgba,ckey:ckey,hex:hex,tokMap:tokMap,colorOf:colorOf,parseGrad:parseGrad,gradToken:gradToken,shadows:shadows,textStyle:textStyle,iconByPath:iconByPath,NAVIC:NAVIC,splitTop:splitTop};
})();
