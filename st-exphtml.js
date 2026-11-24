/* Catworking Studio: экспорт, часть 2 (Шаг 7): разметка, ключи T(), действия data-a, JS в стиле приложения. Без DOM. Дополняет ST.exp.
   Разметка сначала собирается как список частей (статический текст и текст через T), из него получаются и JS-код для приложения, и HTML для самопроверки.
   Так код в пакете и то, что проверила студия, не могут разойтись. Стиль приложения: строка собирается конкатенацией, данные идут через esc() (STUDIO_CONTRACT §3, §5). */
(function(){'use strict';
var ST=window.ST,X=ST.exp,N=ST.nodes,h=ST.esc;
var PARAM=/\{([A-Za-z][A-Za-z0-9_]*)\}/g;
X.params=function(t){var o=[],m;PARAM.lastIndex=0;while((m=PARAM.exec(t)))if(o.indexOf(m[1])<0)o.push(m[1]);return o;};
function q(s){return "'"+String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r/g,'').replace(/\n/g,'\\n')+"'";}
X.q=q;

/* c: {root, cls, acts:[{id,name}], prefix, sslug, screenName} → {parts, i18n:[{key,ru,en,node,params}], data:[{name,text,node}], warns} */
X.markup=function(c){
  var parts=[],i18n=[],data={},warns=[],acts={},used={},base=c.prefix+'_'+X.slug(c.sslug,20).replace(/-/g,'_');
  c.acts.forEach(function(a){acts[a.id]=a.name;});
  function S(s){parts.push({s:s});}
  function key(name){var b=base+'_'+X.slug(name,22).replace(/-/g,'_'),k=b,i=1;
    while(used[k]||X.taken(c.prefix,'keys',k)){i++;k=b+'_'+i;}used[k]=1;return k;}
  (function walk(n,top){
    var cls=c.cls[n.id],btn=!top&&!!acts[n.id],tag=btn?'button':'div',name=n.name||n.type;
    S('<'+tag+(btn?' type="button"':'')+' class="'+cls+'"'+(btn?' data-a="'+acts[n.id]+'"':'')+(n.type==='icon'||n.type==='image'?(n.type==='icon'?' aria-hidden="true"':' role="img" aria-label="'+h(name)+'"'):'')+'>');
    if(n.type==='text'){
      var t=String((n.props&&n.props.text)||'');
      if(t){var k=key(name),ps=X.params(t);i18n.push({key:k,ru:t,en:t,node:name,params:ps});
        ps.forEach(function(p){if(!data[p])data[p]={name:p,text:t,node:name};});
        parts.push({k:k,p:ps});}}
    else if(n.type==='icon')S('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(N.ICONS[n.props&&n.props.icon]||N.ICONS.star)+'</svg>');
    else if(n.type==='image')warns.push('Картинка «'+name+'»: файла в экспорте нет, на её месте пустой блок. Положите изображение в проект и подключите его в CSS класса .'+cls+'.');
    (n.children||[]).forEach(function(k){walk(k,false);});
    S('</'+tag+'>');
  })(c.root,true);
  return {parts:parts,i18n:i18n,data:Object.keys(data).map(function(k){return data[k];}),warns:warns};};

/* имя функции: {camel}Html; если занято в модуле — {camel}View, затем {camel}Dsg */
X.fnName=function(prefix,sslug){var b=X.camel(sslug),a=[b+'Html',b+'View',b+'Dsg'],i;
  for(i=0;i<a.length;i++)if(!X.taken(prefix,'fns',a[i]))return a[i];return a[2];};

/* код функции для приложения (ES2020, конкатенация, esc() и T() — глобальные функции app.js) */
X.js=function(c,mk){
  var ex=mk.parts.map(function(p){
    if(p.s!==undefined)return q(p.s);
    var ps=p.p.map(function(x){return x+': d.'+x;}).join(', ');
    return 'esc(T('+q(p.k)+(ps?', { '+ps+' }':'')+'))';});
  return '/* '+c.ns+'.'+c.fn+'(d): экран «'+String(c.screenName).replace(/\*\//g,'* /')+'»; создан Catworking Studio. Данные d: '+(mk.data.length?mk.data.map(function(x){return 'd.'+x.name;}).join(', '):'не нужны')+'. */\n'
    +c.ns+'.'+c.fn+' = function (d) {\n  d = d || {};\n  return '+ex.join('\n    + ')+';\n};';};

/* строка словарей для XXX.L (ru и en); en пока равен ru: перевод делает ИИ-кодер (в пакете об этом сказано) */
X.dict=function(c,mk){
  function side(l){return c.ns+'.L.'+l;}
  function body(l){return mk.i18n.map(function(x){return '  '+x.key+': '+q(x[l]);}).join(',\n');}
  if(!mk.i18n.length)return '';
  return 'Object.assign('+side('ru')+', {\n'+body('ru')+'\n});\nObject.assign('+side('en')+', {\n'+body('en')+'\n});';};

/* действия: заготовка Object.assign(XXX.act, {...}); их тело пишет ИИ-кодер по описанию в пакете */
X.actCode=function(c){
  if(!c.acts.length)return '';
  return 'Object.assign('+c.ns+'.act, {\n'+c.acts.map(function(a){return '  '+a.name+'(d) { /* кнопка «'+String(a.node).replace(/\*\//g,'* /')+'»: что она делает, описано в пакете */ }';}).join(',\n')+'\n});';};

/* HTML для самопроверки: то же, что вернёт функция из X.js при T из словаря ru; недостающие данные подставляются как {имя} (так же показывает холст) */
X.render=function(mk,data){
  var dict={};mk.i18n.forEach(function(x){dict[x.key]=x.ru;});
  function T(k,o){return String(dict[k]).replace(PARAM,function(m,n){return o&&o[n]!==undefined?o[n]:m;});}
  return mk.parts.map(function(p){
    if(p.s!==undefined)return p.s;
    var o={};p.p.forEach(function(x){if(data&&data[x]!==undefined)o[x]=data[x];});
    return h(T(p.k,o));}).join('');};
})();
