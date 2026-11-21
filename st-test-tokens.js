/* Тесты Шага 2 (токены и темы). Нужен harness с T(name,fn) и eq(a,b,msg); см. st-test-tokens.html */
(function(){
function node(id,name,style){return {id:id,type:'frame',name:name,layout:{dir:'column'},style:style,props:{},children:[]};}
function put(n){ST.do('тестовый узел',function(x){x.screens[0].root.children.push(n);});}
function fresh(){ST.set(ST.blank('Т'));}
function st(id){var r=null;ST.p.screens[0].root.children.forEach(function(n){if(n.id===id)r=n;});return r;}
function has(a,s){if(a.indexOf(s)<0)throw new Error('нет «'+s+'» в '+JSON.stringify(a));}

T('начальный набор: 22 цвета в обеих темах, градиент tile, проект валиден',function(){fresh();
  eq(ST.tok.names(ST.p).length,22);eq(ST.validate(ST.p),'');eq(ST.p.schema,2);
  eq(ST.tok.problems(ST.p).length,0);eq(!!ST.p.tokens.grad.tile,true);
  eq(ST.p.tokens.light.ac,'#f59a23');eq(ST.p.tokens.dark.ac,'#f5a02e');eq(ST.p.tokens.info.card.app,'--panel');});
T('имена: кириллица, пробелы, дубли и пустое запрещены, заглавные приводятся к строчным',function(){fresh();
  ['цвет','my color','','1abc','a_b','a'.repeat(33),'bg'].forEach(function(n){
    if(!ST.tok.add(n,'#fff','#000').error)throw new Error('принято: «'+n+'»');});
  eq(!!ST.tok.add('Brand-1','#fff','#000').ok,true);eq(!!ST.p.tokens.light['brand-1'],true);});
T('смена значения меняет только свою тему и отменяется',function(){fresh();
  eq(!!ST.tok.setVal('ac','light','#112233').ok,true);
  eq(ST.tok.vars(ST.p,'light')['--ac'],'#112233');eq(ST.tok.vars(ST.p,'dark')['--ac'],'#f5a02e');
  ST.undo();eq(ST.tok.vars(ST.p,'light')['--ac'],'#f59a23');});
T('цвет: 3-значный hex, rgb, rgba, мусор',function(){
  eq(ST.tok.norm('#ABC'),'#aabbcc');eq(ST.tok.norm('rgb(1 2 3)'),'rgb(1 2 3)');eq(ST.tok.norm('RGBA(0,0,0,.5)'),'rgba(0,0,0,.5)');
  eq(ST.tok.norm('красный'),'');eq(ST.tok.norm('#12'),'');eq(ST.tok.norm('rgb(300,0,0)'),'');eq(ST.tok.norm('#ff000080'),'#ff000080');});
T('неверный цвет не записывается',function(){fresh();var s=JSON.stringify(ST.p);
  eq(!!ST.tok.setVal('ac','dark','синий').error,true);eq(JSON.stringify(ST.p),s);});
T('вид проекта: светлая / тёмная / обе, по кругу',function(){
  ST.tok.setView('both');eq(ST.tok.themes().length,2);
  ST.tok.cycleView();eq(ST.tok.view,'light');eq(ST.tok.themes().join(),'light');
  ST.tok.cycleView();eq(ST.tok.view,'dark');ST.tok.cycleView();eq(ST.tok.view,'both');});
T('переименование не ломает ссылки и не трогает токены с общим началом (@ac и @act)',function(){fresh();
  put(node('n1','Кнопка',{bg:'@ac',color:'@act',border:{color:'@ac'},shadow:'0 4px 0 @ed',fill:'@g:tile'}));
  eq(!!ST.tok.rename('ac','accent').ok,true);
  var s=st('n1').style;eq(s.bg,'@accent');eq(s.color,'@act');eq(s.border.color,'@accent');eq(s.shadow,'0 4px 0 @ed');eq(s.fill,'@g:tile');
  eq(ST.p.tokens.light.accent,'#f59a23');eq(ST.p.tokens.light.ac,undefined);eq(ST.p.tokens.info.accent.app,'--acc');
  ST.tok.rename('tile0','tile-top');eq(ST.p.tokens.grad.tile.stops[0].c,'@tile-top');
  eq(ST.tok.problems(ST.p).length,0);});
T('переименование в занятое или кириллицу отклоняется',function(){fresh();
  eq(!!ST.tok.rename('ac','bg').error,true);eq(!!ST.tok.rename('ac','акцент').error,true);eq(ST.p.tokens.light.ac,'#f59a23');});
T('удаление используемого токена запрещено, неиспользуемого можно, отмена работает',function(){fresh();
  put(node('n1','Плитка',{bg:'@ac'}));
  var r=ST.tok.remove('ac');eq(!!r.error,true);eq(r.used.length,1);eq(!!ST.p.tokens.light.ac,true);
  eq(!!ST.tok.remove('t2').ok,true);eq(ST.p.tokens.light.t2,undefined);eq(ST.p.tokens.dark.t2,undefined);
  ST.undo();eq(ST.p.tokens.light.t2,'#1c8077');});
T('токен, используемый только градиентом, тоже нельзя удалить',function(){fresh();
  eq(!!ST.tok.remove('tile0').error,true);});
T('токен задан только в одной теме: красная метка (missing), проект всё равно открывается',function(){fresh();
  ST.do('сломать',function(x){delete x.tokens.dark.mu;});
  var pr=ST.tok.problems(ST.p);eq(pr.length,1);eq(pr[0].k,'missing');eq(pr[0].th,'dark');eq(pr[0].n,'mu');
  eq(ST.validate(ST.p),'');eq(ST.tok.countWarn(ST.p)>=1,true);
  ST.tok.setVal('mu','dark','#c4a98e');eq(ST.tok.problems(ST.p).length,0);});
T('ссылка на несуществующий токен находится (dangling)',function(){fresh();
  put(node('n1','Х',{bg:'@nope'}));var pr=ST.tok.problems(ST.p);eq(pr.length,1);eq(pr[0].k,'dangling');});
T('контраст WCAG: чёрное/белое 21, #777 на белом не проходит, #767676 проходит',function(){
  eq(Math.round(ST.tok.contrast('#000','#fff')),21);
  eq(ST.tok.grade(ST.tok.contrast('#777','#fff')),'large');eq(ST.tok.grade(ST.tok.contrast('#767676','#fff')),'AA');
  eq(ST.tok.grade(ST.tok.contrast('#000','#fff')),'AAA');eq(ST.tok.fmtRatio(ST.tok.contrast('#777','#fff')),'4,47:1');
  eq(ST.tok.contrast('цвет','#fff'),null);});
T('прозрачный текст кладётся на фон: 50% чёрного на белом хуже, чем чёрный',function(){
  var a=ST.tok.contrast('#000','#fff'),b=ST.tok.contrast('rgba(0,0,0,.5)','#fff');eq(b<a&&b>3,true);});
T('предупреждение: светло-жёлтый текст на бежевом фоне',function(){fresh();
  ST.tok.setVal('tx','light','#f5d90a');
  var is=ST.tok.pairIssues(ST.p).filter(function(x){return x.fg==='tx'&&x.bg==='bg'&&x.th==='light';});
  eq(is.length,1);eq(is[0].r<2,true);
  ST.tok.setVal('tx','light','#3b2616');eq(ST.tok.pairIssues(ST.p).filter(function(x){return x.fg==='tx'&&x.th==='light';}).length,0);});
T('градиент: css, 2–3 стопа, токены и свой цвет в стопах',function(){fresh();
  eq(ST.tok.gradCss(ST.p.tokens.grad.tile),'linear-gradient(180deg,var(--tile0) 0%,var(--tile1) 100%)');
  eq(ST.tok.vars(ST.p,'dark')['--g-tile'].indexOf('linear-gradient')===0,true);
  eq(!!ST.tok.setGrad('tile',{angle:90,stops:[{c:'@ac',at:0}]}).error,true,'один стоп');
  eq(!!ST.tok.setGrad('tile',{angle:90,stops:[{c:'@ac',at:0},{c:'#fff',at:50},{c:'@bg',at:100},{c:'#000',at:100}]}).error,true,'четыре стопа');
  eq(!!ST.tok.setGrad('tile',{angle:90,stops:[{c:'@net',at:0},{c:'#fff',at:100}]}).error,true,'нет токена');
  eq(!!ST.tok.setGrad('tile',{angle:90,stops:[{c:'@ac',at:0},{c:'#ffffff',at:50},{c:'@bg',at:100}]}).ok,true);
  eq(ST.tok.gradCss(ST.p.tokens.grad.tile),'linear-gradient(90deg,var(--ac) 0%,#ffffff 50%,var(--bg) 100%)');});
T('градиент: используемый нельзя удалить, переименование обновляет ссылки',function(){fresh();
  put(node('n1','Плитка',{bg:'@g:tile'}));
  eq(!!ST.tok.removeGrad('tile').error,true);eq(!!ST.tok.renameGrad('tile','plate').ok,true);
  eq(st('n1').style.bg,'@g:plate');eq(ST.tok.problems(ST.p).length,0);});
T('сырые цвета: поиск, подсказка токена, «сделать токеном», отмена',function(){fresh();
  put(node('n1','Кнопка',{bg:'#F59A23',shadow:'0 4px 0 #abcdef',color:'@tx'}));
  var r=ST.tok.raws(ST.p);eq(r.length,2);eq(r[0].suggest,'ac');eq(r[1].suggest,'');
  eq(!!ST.tok.promote('n1',r[0].path,r[0].color,r[0].suggest).ok,true);eq(st('n1').style.bg,'@ac');
  eq(!!ST.tok.promote('n1',r[1].path,r[1].color,'edge').ok,true);
  eq(st('n1').style.shadow,'0 4px 0 @edge');eq(ST.p.tokens.light.edge,'#abcdef');eq(ST.p.tokens.dark.edge,'#abcdef');
  eq(ST.tok.raws(ST.p).length,0);ST.undo();eq(st('n1').style.shadow,'0 4px 0 #abcdef');eq(ST.p.tokens.light.edge,undefined);});
T('«сделать токеном» с кириллическим именем отклоняется, проект не меняется',function(){fresh();
  put(node('n1','К',{bg:'#abcdef'}));var s=JSON.stringify(ST.p);
  eq(!!ST.tok.promote('n1',['bg'],'#abcdef','цвет').error,true);eq(JSON.stringify(ST.p),s);});
T('css() переводит ссылки в var()',function(){
  eq(ST.tok.css('0 4px 0 @ln'),'0 4px 0 var(--ln)');eq(ST.tok.css('@g:tile'),'var(--g-tile)');});
T('миграция 1→2: пустые токены заполняются, чужие значения остаются',function(){
  var a={schema:1,meta:{},tokens:{light:{},dark:{}},components:[],assets:{},screens:[]};
  eq(ST.validate(a),'');var m=ST.migrate(a);eq(m.schema,2);eq(Object.keys(m.tokens.light).length,22);eq(typeof m.tokens.grad.tile,'object');
  var b={schema:1,meta:{},tokens:{light:{x:'#111'},dark:{x:'#eee'}},components:[],assets:{},screens:[]};
  m=ST.migrate(b);eq(Object.keys(m.tokens.light).join(),'x');eq(JSON.stringify(m.tokens.info),'{}');eq(m.schema,2);});
T('повреждённые info/grad не принимаются, пустой проект с токенами туда-обратно без потерь',function(){
  var p=ST.blank('Т');p.tokens.info=[];eq(ST.validate(p)!=='',true);
  var q=ST.blank('Т2'),r=ST.io.parse(JSON.stringify(q));eq(JSON.stringify(r.project),JSON.stringify(q));});
T('50 токенов: смена значений и образец не тормозят (< 500 мс)',function(){fresh();var t0=Date.now();
  for(var i=0;i<50;i++)ST.tok.add('t-'+i,'#'+('00000'+(i*5000).toString(16)).slice(-6),'#ffffff');
  ST.tok.vars(ST.p,'light');ST.tok.problems(ST.p);ST.tok.pairIssues(ST.p);eq(Date.now()-t0<500,true);});
})();
