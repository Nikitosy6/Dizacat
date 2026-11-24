/* Catworking Studio: экспорт, часть 1 (Шаг 7): справочник модулей, имена, CSS узлов, блоки токенов. Без DOM. Объект ST.exp.
   CSS узла берётся у холста (ST.nodes.css), чтобы экспорт и холст не расходились; затем имена токенов студии заменяются именами приложения (поле app у токена),
   формы профиля и роли шрифтов получают имена --r --rl --bw --ledge --sh --ff-*. Правила STUDIO_CONTRACT: §1, §3, §5, §7, §8, §11. */
(function(){'use strict';
var ST=window.ST=window.ST||{},X=ST.exp=ST.exp||{},N=ST.nodes;

/* ---------- справочник (STUDIO_CONTRACT) ---------- */
X.APP_VARS=['bg','panel','line','fg','mut','acc','accfg','p2','accd','bg2','mint','pink','ok','warn','bad','r','sh']; /* переменные приложения, §1 */
X.BUSY_VARS=['cc','x','dl','a','sj-kb','sj-cv','fx-ring','fx-c','fx-p','fx-dx']; /* заняты модулями приложения, §1 и §8 п. 16 */
X.MODS={ /* корни шторок (§11.2), куда вставлять файлы (§3) */
  sj:{ns:'SJ',shell:['.sj-sh-bg','.sj-sh'],css:'sj-course.css',js:'sj-course-view.js',boot:'sj-boot.js'},
  fx:{ns:'FX',shell:['.fx-sh-bg','.fx-sh'],css:'fx.css',js:'fx-sheet.js',boot:'fx-boot.js'},
  cal:{ns:'CAL',shell:['.cal-sheet-bg','.cal-sheet','.cal-ghost'],css:'calendar.css',js:'cal-extra.js',boot:'cal-boot.js'},
  imx:{ns:'IMX',shell:['.imx-mdl'],css:'imx.css',js:'imx-view.js',boot:'imx-boot.js'},
  dk:{ns:'DK',shell:[],css:'dk.css',js:'dk-view.js',boot:'dk-boot.js'}};
X.mod=function(prefix){var m=X.MODS[prefix];
  return m?{ns:m.ns,shell:m.shell,css:m.css,js:m.js,boot:m.boot,known:true}:{ns:prefix.toUpperCase(),shell:[],css:null,js:null,boot:null,known:false};};
X.NAV_RE=/нижн\S*\s+панел|навигац|tab\s?bar|(^|\s)nav(\s|$)/i; /* нижнюю панель рисует приложение (nav), в экспорт она не входит */
X.RAW_RE=/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
X.BTN_RESET=['appearance:none','margin:0','border:0','background:none','padding:0','font-family:inherit','font-size:inherit','font-weight:inherit','line-height:inherit','color:inherit','text-align:inherit','cursor:pointer'];

/* ---------- имена ---------- */
var TR={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya','і':'i','ї':'yi','є':'ye','ґ':'g'};
X.slug=function(s,max){s=String(s==null?'':s).toLowerCase();var o='',i;
  for(i=0;i<s.length;i++)o+=TR[s.charAt(i)]!==undefined?TR[s.charAt(i)]:s.charAt(i);
  o=o.replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,max||24).replace(/-+$/,'');return o||'x';};
X.cap=function(s){return s.charAt(0).toUpperCase()+s.slice(1);};
X.camel=function(s){return X.slug(s,30).replace(/-([a-z0-9])/g,function(m,c){return c.toUpperCase();});};
X.taken=function(prefix,kind,name){var T=X.TAKEN||{},a=(T[prefix]&&T[prefix][kind])||[],m=(T.misc&&T.misc[kind])||[];return a.indexOf(name)>=0||m.indexOf(name)>=0;};
X.isBtn=function(n){return !!n&&N.isButton(n);};
function appVar(pr,nm){var a=((pr.tokens.info||{})[nm]||{}).app;return a&&/^--[a-z][a-z0-9-]*$/.test(a)?a:'--'+nm;}
X.appVar=appVar;
/* классы и действия: {cls:{id:класс}, acts:[{id,name,node}], renamed:[«было → стало»]} */
X.assign=function(root,prefix,sslug){
  var cls={},acts=[],used={},au={},renamed=[],rc=prefix+'-'+sslug;
  function free(base){var c=base,i=1,hit=false;while(used[c]||X.taken(prefix,'cls',c)){if(X.taken(prefix,'cls',c))hit=true;i++;c=base+'-'+i;}if(hit)renamed.push(base+' → '+c);used[c]=1;return c;}
  function freeAct(base){var c=base,i=1;while(au[c]||X.taken(prefix,'acts',c)){i++;c=base+i;}au[c]=1;return c;}
  (function walk(n,top){
    cls[n.id]=free(top?rc:rc+'-'+X.slug(n.name||n.type,20));
    if(!top&&X.isBtn(n))acts.push({id:n.id,name:freeAct(prefix+X.cap(X.camel(sslug))+X.cap(X.camel(n.name||'action'))),node:n.name||'кнопка'});
    (n.children||[]).forEach(function(c){walk(c,false);});})(root,true);
  return {cls:cls,acts:acts,renamed:renamed};};

/* ---------- имена токенов студии → имена приложения ---------- */
function mapVars(s,pr){
  var g=pr.tokens.grad||{};
  return String(s).replace(/var\(--([a-z0-9-]+)(?:,[^()]*)?\)/g,function(m,nm){
    if(nm.indexOf('g-')===0&&g[nm.slice(2)])return mapVars(ST.tok.gradCss(g[nm.slice(2)]),pr); /* градиент токеном не задаётся в приложении: подставляется целиком */
    var f=/^f-(display|body|mono|pixel)$/.exec(nm);if(f)return 'var(--ff-'+f[1]+')';
    if(nm==='r'||nm==='rl'||nm==='bw'||nm==='ledge'||nm==='sh')return 'var(--'+nm+')';
    return 'var('+appVar(pr,nm)+')';});}
X.mapVars=mapVars;
function declsOf(n,pdir,top,state,pr){
  return N.css(n,ST.p,{dir:pdir,root:top,state:state}).split(';').map(function(x){return x.trim();}).filter(Boolean).map(function(x){return mapVars(x,pr);});}
function prop(d){return d.slice(0,d.indexOf(':'));}
var RESET={'box-shadow':'none','transform':'none','opacity':'1','filter':'none','mix-blend-mode':'normal','background':'none','border':'0','border-radius':'0','color':'inherit'};
function stateDiff(base,st){ /* только отличия состояния от обычного вида; пропавшее свойство сбрасывается */
  var bm={},sm={},out=[];base.forEach(function(d){bm[prop(d)]=d;});st.forEach(function(d){sm[prop(d)]=d;});
  st.forEach(function(d){if(bm[prop(d)]!==d)out.push(d);});
  Object.keys(bm).forEach(function(k){if(sm[k]===undefined&&RESET[k]!==undefined)out.push(k+':'+RESET[k]);});
  return out;}
function cmt(s){return String(s==null?'':s).replace(/\*\//g,'* /').replace(/[\r\n]+/g,' ');}
function rule(sel,list,name){return '/* '+cmt(name)+' */\n'+sel+'{\n  '+list.join(';\n  ')+';\n}';}

/* CSS всех узлов экрана. c: {root, cls, pr, screen:{w}, warns[]} → {rules:[{id,name,text}], raws:[{node,decl}], text} */
X.css=function(c){
  var rules=[],raws=[];
  (function walk(n,pdir,top){
    var cls=c.cls[n.id],btn=!top&&X.isBtn(n),L=n.layout||{},name=n.name||n.type,fixed=!top&&typeof L.w==='number'&&!L.float,wide=fixed&&L.w>=c.screen.w;
    function fix(a){return wide?a.map(function(x){return x==='width:'+L.w+'px'?'width:100%':x;}):a;} /* не зашиваем ширину экрана (контракт §8 п. 4) */
    var d=fix(declsOf(n,pdir,top,'normal',c.pr));
    if(wide)c.warns.push('«'+name+'»: ширина '+L.w+' px равна ширине экрана, в коде стоит width:100%.');
    else if(fixed&&typeof L.maxW!=='number')d.push('max-width:100%');
    var list=(btn?X.BTN_RESET:[]).concat(d);
    rules.push({id:n.id,name:name,text:rule('.'+cls,list,name)});
    list.forEach(function(x){if(X.RAW_RE.test(x))raws.push({node:name,decl:x});});
    if(n.type==='icon')rules.push({id:n.id,name:name+' (значок)',text:rule('.'+cls+' svg',['display:block','width:100%','height:100%'],name+': значок')});
    var st=n.states||{};
    if(st.pressed){var a=stateDiff(d,fix(declsOf(n,pdir,top,'pressed',c.pr)));if(a.length)rules.push({id:n.id,name:name+' (нажато)',text:rule('.'+cls+':active',a,name+': нажато')});}
    if(st.disabled){var b=stateDiff(d,fix(declsOf(n,pdir,top,'disabled',c.pr)));if(b.length)rules.push({id:n.id,name:name+' (выключено)',text:rule('.'+cls+':disabled,\n.'+cls+'[aria-disabled=true]',b,name+': выключено')});}
    var dir=n.layout&&n.layout.dir==='row'?'row':'column';
    (n.children||[]).forEach(function(k){walk(k,dir,false);});
  })(c.root,undefined,true);
  var text=rules.map(function(r){return r.text;}).join('\n');
  if(/\b(transition|animation)\s*:/.test(text))text+='\n@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}'; /* в узлах анимаций нет; страховка */
  return {rules:rules,raws:raws,text:text};};
X.used=function(text){var o={},re=/var\((--[a-z0-9-]+)/g,m;while((m=re.exec(text)))o[m[1]]=1;return Object.keys(o).sort();};

/* ---------- значения переменных профиля ---------- */
function stack(pr,r){return (pr.stacks&&pr.stacks[r])||ST.fonts.stack((pr.fonts||{})[r]||ST.fonts.DEF_ROLES[r]);}
X.varsOf=function(pr,th){
  var v=ST.tok.vars({tokens:pr.tokens},th),out=[],s=pr.shape||{};
  Object.keys(v).forEach(function(k){if(k.indexOf('--g-')!==0)out.push([appVar(pr,k.slice(2)),v[k]]);});
  out.push(['--r',s.r],['--rl',s.rl],['--bw',s.bw],['--ledge',s.ledge],['--sh',s.shadow]);
  ST.fonts.ROLES.forEach(function(r){out.push(['--ff-'+r,stack(pr,r)]);});
  return out;};
function lines(list){var o=[],i;for(i=0;i<list.length;i+=4)o.push('  '+list.slice(i,i+4).map(function(x){return x[0]+':'+x[1]+';';}).join(' '));return o.join('\n');}
function selFor(scope,k,r,sfx){
  if(scope==='skin')return r+(k==='d'?'':k==='l'?':not([data-theme=dark])':'[data-theme=light]')+sfx;
  if(scope==='app')return k==='d'?':root':k==='l'?':root:not([data-theme=dark])':':root[data-theme=light]';
  return k==='d'?r+sfx:(k==='l'?':root:not([data-theme=dark]) ':':root[data-theme=light] ')+r+sfx;}
/* три блока одного состава: тёмная по умолчанию, светлая через @media, светлая принудительно (структура styles.css:3–5) */
X.triple=function(scope,roots,sfx,body){
  function one(k){var sels=[];roots.forEach(function(r){var s=selFor(scope,k,r,sfx||'');if(sels.indexOf(s)<0)sels.push(s);});
    return sels.join(',\n')+'{\n'+body(k==='d'?'dark':'light')+'\n}';}
  return '/* тёмная по умолчанию */\n'+one('d')+'\n@media(prefers-color-scheme:light){\n'+one('l').replace(/^/gm,'  ')+'\n}\n/* светлая принудительно */\n'+one('e');};
/* значения профиля «Catworking сейчас» (то, что уже есть в приложении) для сравнения */
function baseMap(th){var b=ST.prof.builtin('catworking-now'),o={};if(b)X.varsOf(b,th).forEach(function(x){o[x[0]]=x[1];});return o;}
/* блок значений по режиму. c: {mode,prefix,pr,used:[имена var], skinId}. → {text, add:[…], diff:[…], notes:[…]} */
X.tokenBlock=function(c){
  var mode=c.mode,pr=c.pr,res={text:'',add:[],diff:[],notes:[]},m=X.mod(c.prefix);
  if(mode==='module'){
    var roots=['.'+c.prefix+'-root'].concat(m.shell).concat(c.extra||[]);
    res.text=X.triple('module',roots,'',function(th){return lines(X.varsOf(pr,th));});
    res.roots=roots;
    if(!m.known)res.notes.push('Модуль «'+c.prefix+'»: корни шторок и окон неизвестны (файлов нет в контракте). В селектор входит только .'+c.prefix+'-root; если у модуля есть шторки или окна, добавьте их классы в поле «Доп. селекторы».');
    return res;}
  if(mode==='skin'){
    var id='data-skin='+c.skinId;
    res.text=X.triple('skin',[':root['+id+']'],'',function(th){return lines(X.varsOf(pr,th));});
    res.roots=[':root['+id+']'];return res;}
  /* app: «добавить» только новые переменные, которые использует CSS; значения, отличающиеся от приложения, отдельным списком (§1) */
  var base={d:baseMap('dark'),l:baseMap('light')},used=c.used||[];
  function isNew(nm){return X.APP_VARS.indexOf(nm.slice(2))<0;}
  ['dark','light'].forEach(function(th){X.varsOf(pr,th).forEach(function(x){
    if(isNew(x[0])){if(used.indexOf(x[0])>=0&&!res.add.some(function(a){return a.v===x[0];}))res.add.push({v:x[0]});}
    else{var b=(th==='dark'?base.d:base.l)[x[0]];if(b!==undefined&&b!==x[1])res.diff.push({v:x[0],th:th,mine:x[1],app:b});}});});
  if(res.add.length)res.text=X.triple('app',[':root'],'',function(th){return lines(X.varsOf(pr,th).filter(function(x){return res.add.some(function(a){return a.v===x[0];});}));});
  else res.notes.push('Новых переменных этому экрану не нужно: блок в :root не требуется.');
  return res;};
/* кнопки оценки «Повтора» (§8 п. 18, [предложение]): жёсткий цвет текста поверх --bad --warn --mint --ok */
var RATE=[['#2a0a0a','bad'],['#3a2a00','warn'],['#06302a','mint'],['#06300f','ok']];
X.rate=function(pr,scope,roots,warns,skinId){
  var cols={dark:[],light:[]},low=false,fake={tokens:pr.tokens};
  ['dark','light'].forEach(function(th){RATE.forEach(function(r){var bg=ST.tok.val(fake,th,r[1]),col=r[0],k=ST.tok.contrast(r[0],bg);
    if(k===null||k<4.5){low=true;var b=ST.tok.contrast('#000000',bg)||0,w=ST.tok.contrast('#ffffff',bg)||0;col=b>=w?'#000000':'#ffffff';
      if(Math.max(b,w)<4.5)warns.push('Кнопка оценки на --'+r[1]+' ('+th+'): ни чёрный, ни белый текст не даёт контраста 4,5:1.');}
    cols[th].push(col);});});
  if(!low)return '';
  var out=RATE.map(function(r,i){return X.triple(scope,roots,' .rate .btn:nth-child('+(i+1)+')',function(th){return '  color:'+cols[th][i]+'; border-color:var(--'+r[1]+');';});});
  return '/* Кнопки оценки: в styles.css цвет текста жёсткий, без переопределения контраст ниже 4,5:1 */\n'+out.join('\n');};

/* ---------- файлы шрифтов ---------- */
X.fonts=function(pr,root){
  var fam={},roles={};
  function add(t){if(!t||typeof t.ff!=='string')return;var m=/^role:(\w+)$/.exec(t.ff);if(m)roles[m[1]]=1;else fam[t.ff]=1;}
  N.walk(root,function(n){var S=n.style||{};add(S.text);Object.keys(n.states||{}).forEach(function(k){add(((n.states[k]||{}).style||{}).text);});});
  Object.keys(roles).forEach(function(r){var f=(pr.fonts||{})[r];if(f)fam[f]=1;});
  var files=[],face=[],warns=[];
  if(pr.scope==='app')return {files:files,face:'',warns:warns}; /* «Catworking сейчас»: системный шрифт, файлов нет (P6 п. 23) */
  Object.keys(fam).forEach(function(nm){var cat=ST.fonts.CAT.filter(function(c){return c.n===nm;})[0];
    if(!cat){warns.push('Гарнитуры «'+nm+'» нет в студии: файл придётся добавить вручную.');return;}
    files.push({name:cat.n,file:'fonts/'+cat.f,kb:cat.kb,lic:cat.lic});
    face.push("@font-face{font-family:'"+cat.n+"';src:url('fonts/"+cat.f+"') format('woff');font-weight:"+cat.w[0]+' '+cat.w[1]+';font-style:normal;font-display:swap}');
    if(ST.fonts.level(cat.n)==='bad')warns.push('«'+cat.n+'»: нет русских букв, использовать нельзя.');
    else if(ST.fonts.level(cat.n)==='warn')warns.push('«'+cat.n+'»: нет символов «'+ST.fonts.miss(cat.n)+'», их нарисует запасной шрифт.');});
  return {files:files,face:face.join('\n'),warns:warns};};
})();
