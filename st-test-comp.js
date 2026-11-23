/* Тесты Шага 5 (мастера и экземпляры). Нужен harness с T(name,fn) и eq(a,b,msg); подключать после st-test-profiles.js в st-test-profiles.html */
(function(){
function fresh(){ST.fonts.live={};ST.set(ST.blank('Т'));}
function root(){return ST.screen().root;}
function put(n){ST.do('тестовый узел',function(x){x.screens[0].root.children.push(n);});}
function card(){return {id:'tc',type:'frame',name:'Тестовая карточка',layout:{dir:'row',gap:8,pad:[8,8,8,8],w:'fill',h:'hug'},style:{bg:'@card',r:'var:r',bd:{c:'@ln'}},props:{},
  children:[{id:'tc-t',type:'text',name:'Заголовок',layout:{},style:{text:{ff:'role:body',fw:800,fs:17,lh:1.3,ls:0,tt:'none',ta:'left',cl:0,c:'@tx',tnum:false}},props:{text:'Привет'},children:[]},
   {id:'tc-i',type:'icon',name:'Иконка',layout:{w:24,h:24},style:{ic:'@tx'},props:{icon:'star'},children:[]}]};}
function tt(){return comp().root.children[0].id;}function ti(){return comp().root.children[1].id;}
function comp(i){return ST.comp.list(ST.p)[i||0];}
function insts(){var o=[];ST.nodes.walk(root(),function(n){if(n.type==='instance')o.push(n);});return o;}
function strip(h){return h.replace(/ data-nid="[^"]*"/g,'').replace(/ data-ov="[^"]*"/g,'').replace(/ data-type="[^"]*"/g,'').replace(/ data-pd="[^"]*"/g,'').replace(/ data-dir="[^"]*"/g,'');}
function mk(){fresh();put(card());ST.sel=['tc'];var r=ST.comp.fromSel('Карточка');eq(r.ok,true,r.error);return r;}
function names(p){var o={};Object.keys(p.tokens.light).concat(Object.keys(p.tokens.dark)).forEach(function(n){o[n]=1;});return Object.keys(o).sort().join();}

T('иконки: не меньше 40 новых, у каждой есть русское название, выбор в инспекторе принимает их',function(){
  var n=Object.keys(ST.nodes.ICONS).length;eq(n>=48,true,'иконок: '+n);
  Object.keys(ST.nodes.ICONS).forEach(function(k){eq(!!ST.icons.NAMES[k],true,'название у '+k);eq(ST.nodes.checkVal('props.icon',k),'','иконка '+k);});});
T('стартовый набор: все мастера, проект валиден, в мастерах только токены и роли, повторная установка ничего не добавляет',function(){
  fresh();eq(comp(),undefined);var r=ST.presets.install();eq(r.ok,true,r.error);eq(r.added,ST.presets.count());eq(ST.comp.list(ST.p).length,ST.presets.count());
  eq(ST.validate(ST.p),'');
  ST.comp.list(ST.p).forEach(function(c){var pr=ST.comp.problems(c.root);eq(pr.length,0,c.name+': '+(pr[0]&&pr[0].msg));eq(c.profile,ST.screen().profile);eq(!!ST.prof.get(ST.p,c.profile),true);});
  var again=ST.presets.install();eq(again.added,0);eq(ST.undoS.length>0,true);});
T('стартовый набор: токены scrim, ont и градиент teal есть во всех профилях, набор имён одинаков, цвета без проблем',function(){
  fresh();ST.presets.install();var a=ST.p.profiles,n=names(a[0]);
  a.forEach(function(q){eq(names(q),n,'набор имён в «'+q.name+'»');eq(!!q.tokens.grad.teal,true);eq(q.tokens.info.scrim.app,'--scrim');});
  eq(n.split(',').length,24);eq(ST.tok.problems(ST.p).length,0);});
T('стартовый набор: отмена убирает всё одним шагом, возврат возвращает',function(){
  fresh();var u=ST.undoS.length;ST.presets.install();eq(ST.undoS.length,u+1);ST.undo();eq(ST.comp.list(ST.p).length,0);eq(!!ST.p.profiles[0].tokens.grad.teal,false);
  ST.redo();eq(ST.comp.list(ST.p).length,ST.presets.count());});
T('из выделения: рамка превращается в экземпляр, внешний вид тот же, мастер ссылается на профиль экрана, всё одним шагом',function(){
  fresh();put(card());ST.sel=['tc'];var before=strip(ST.nodes.html(root(),ST.p,{root:true})),u=ST.undoS.length;
  var r=ST.comp.fromSel('Карточка');eq(r.ok,true,r.error);eq(ST.undoS.length,u+1);
  var c=comp(),i=insts();eq(c.name,'Карточка');eq(c.profile,ST.screen().profile);eq(i.length,1);eq(i[0].ref.c,c.id);eq(ST.sel[0],i[0].id);
  eq(strip(ST.nodes.html(root(),ST.p,{root:true})),before,'вид не изменился');eq(ST.validate(ST.p),'');
  ST.undo();eq(insts().length,0);eq(ST.comp.list(ST.p).length,0);eq(!!ST.nodes.get('tc'),true);});
T('из выделения: отказ для сырого цвета, жёсткого радиуса, экземпляра внутри, корня и не-рамки; проект не меняется',function(){
  fresh();var c=card();c.style.bg='#fff';put(c);ST.sel=['tc'];var s=JSON.stringify(ST.p),r=ST.comp.fromSel('Х');eq(!!r.error,true);eq(JSON.stringify(ST.p),s);
  fresh();c=card();c.style.r=12;put(c);ST.sel=['tc'];r=ST.comp.fromSel('Х');eq(/радиус/.test(r.error),true);
  fresh();c=card();c.style.r=999;c.children[0].style.text.ff='Rubik';put(c);ST.sel=['tc'];r=ST.comp.fromSel('Х');eq(/гарнитура/.test(r.error),true);
  fresh();put(card());ST.sel=['tc'];ST.comp.fromSel('Х');var ni=card();ni.id='tc2';ST.do('в рамку',function(x){x.screens[0].root.children.push(ni);ni.children.push(JSON.parse(JSON.stringify(insts()[0])));});
  ST.sel=['tc2'];r=ST.comp.fromSel('Х');eq(/экземпляр/.test(r.error),true);
  ST.sel=[ST.screen().root.id];r=ST.comp.fromSel('Х');eq(!!r.error,true);ST.sel=['tc-t'];r=ST.comp.fromSel('Х');eq(!!r.error,true);
  ST.sel=[];r=ST.comp.fromSel('Х');eq(!!r.error,true);});
T('правка мастера меняет все экземпляры сразу',function(){
  mk();ST.sel=[insts()[0].id];ST.comp.place(comp().id);ST.comp.place(comp().id);eq(insts().length,3);
  ST.comp.edit(comp().id);eq(ST.screen().id,comp().id);eq(ST.comp.active(ST.p).id,comp().id);
  var r=ST.nodes.set(['tc-t'].map(function(x){return ST.comp.get(ST.p,ST.cur).root.children[0].id;}),'props.text','Новый текст');eq(r.ok,true,r.error);
  ST.comp.exit();eq(ST.screen().id,ST.p.screens[0].id);
  insts().forEach(function(n){eq(/Новый текст/.test(ST.nodes.html(n,ST.p,{dir:'column'})),true,'в экземпляре');});});
T('правка мастера: профиль мастера, а не экрана; добавление узла идёт в мастер; выход возвращает экран',function(){
  mk();var c=comp(),pid=ST.prof.list(ST.p)[2].id;ST.prof.assignComponent(c.id,pid);
  ST.comp.edit(c.id);eq(ST.prof.cur(ST.p).id,pid);eq(ST.p.tokens===ST.prof.get(ST.p,pid).tokens,true,'посредник читает профиль мастера');
  var n=comp().root.children.length;var r=ST.nodes.add('text',ST.comp.get(ST.p,c.id).root.id);eq(r.ok,true,r.error);eq(comp().root.children.length,n+1);
  ST.renameScreen(c.id,'Новое имя');eq(comp().name,'Новое имя');
  ST.comp.exit();eq(ST.prof.cur(ST.p).id,ST.screen().profile);});
T('переопределения: текст, иконка, показ, цвет-токен видны в экземпляре, мастер не меняется, сброс работает',function(){
  mk();var i=insts()[0],c=comp(),before=JSON.stringify(c);
  eq(ST.comp.setOv(i.id,tt(),{text:'Другое'}).ok,true);eq(ST.comp.setOv(i.id,ti(),{icon:'heart'}).ok,true);
  eq(ST.comp.setOv(i.id,tt(),{col:'@ac'}).ok,true);eq(ST.comp.setOv(i.id,ti(),{hidden:true}).ok,true);
  var v=ST.comp.resolve(insts()[0],ST.p),t=ST.nodes.find(v,ST.comp.vid(i,tt())).n,ic=ST.nodes.find(v,ST.comp.vid(i,ti())).n;
  eq(t.props.text,'Другое');eq(t.style.text.c,'@ac');eq(ic.props.icon,'heart');eq(ic.hidden,true);eq(JSON.stringify(comp()),before,'мастер не тронут');
  var h=ST.nodes.html(insts()[0],ST.p,{dir:'column'});eq(/Другое/.test(h),true);eq(h.indexOf('<svg')<0,true,'скрытая иконка не рисуется');
  eq(ST.comp.setOv(i.id,tt(),null).ok,true);eq(ST.comp.setOv(i.id,ti(),{hidden:undefined}).ok,true);eq(JSON.stringify(insts()[0].ref.ov),''+JSON.stringify((function(){var o={};o[ti()]={icon:'heart'};return o;})())+'');
  eq(ST.comp.clearOv(i.id).ok,true);eq(JSON.stringify(insts()[0].ref.ov),'{}');eq(ST.validate(ST.p),'');});
T('переопределения: чужие значения отклоняются понятным сообщением и ничего не пишут',function(){
  mk();var i=insts()[0],s=JSON.stringify(ST.p);
  ['#fff','ac','@AC'].forEach(function(c){eq(!!ST.comp.setOv(i.id,tt(),{col:c}).error,true,c);});
  eq(!!ST.comp.setOv(i.id,ti(),{icon:'нет'}).error,true);eq(!!ST.comp.setOv(i.id,tt(),{text:new Array(2002).join('я')}).error,true);eq(!!ST.comp.setOv(i.id,tt(),{hidden:'да'}).error,true);
  eq(!!ST.comp.setOv(i.id,tt(),{fs:99}).error,true);eq(JSON.stringify(ST.p),s);});
T('переопределения: текст в экземпляре экранируется, лишний узел в переопределении не ломает показ',function(){
  mk();var i=insts()[0];ST.comp.setOv(i.id,tt(),{text:'<b>"x"</b>'});var h=ST.nodes.html(insts()[0],ST.p,{dir:'column'});eq(h.indexOf('<b>')<0,true);eq(/&lt;b&gt;/.test(h),true);
  ST.comp.setOv(i.id,'нет-такого',{text:'q'});eq(ST.validate(ST.p),'');eq(/<svg/.test(ST.nodes.html(insts()[0],ST.p,{dir:'column'})),true);});
T('варианты: «сохранить как вариант», переключение, удаление возвращает экземпляры к основному',function(){
  mk();var i=insts()[0];ST.comp.setOv(i.id,tt(),{text:'Вариант А',col:'@bad'});
  var r=ST.comp.variantFromInst(i.id,'Тревога');eq(r.ok,true,r.error);var c=comp();eq(c.variants.length,1);eq(c.variants[0].name,'Тревога');
  eq(insts()[0].ref.v,c.variants[0].k);eq(JSON.stringify(insts()[0].ref.ov),'{}');eq(ST.validate(ST.p),'');
  ST.comp.place(c.id);var j=insts()[1];eq(/Привет/.test(ST.nodes.html(j,ST.p,{dir:'column'})),true);
  eq(ST.comp.setVariant(j.id,c.variants[0].k).ok,true);eq(/Вариант А/.test(ST.nodes.html(insts()[1],ST.p,{dir:'column'})),true);
  eq(!!ST.comp.variantFromInst(j.id,'тревога').error,true,'дубль названия');eq(!!ST.comp.setVariant(j.id,'нет').error,true);
  eq(ST.comp.delVariant(c.id,c.variants[0].k).ok,true);eq(insts().every(function(n){return n.ref.v===undefined;}),true);eq(comp().variants.length,0);eq(ST.validate(ST.p),'');});
T('варианты стартового набора: пилюля срока и нижняя панель меняют цвет и активную вкладку',function(){
  fresh();ST.presets.install();var pill=ST.comp.list(ST.p).filter(function(c){return c.preset==='pill';})[0],nav=ST.comp.list(ST.p).filter(function(c){return c.preset==='nav';})[0];
  eq(pill.variants.map(function(v){return v.k;}).join(),'warn,bad,calm');
  ST.comp.place(pill.id);var i=insts()[0];ST.comp.setVariant(i.id,'bad');var v=ST.comp.resolve(insts()[0],ST.p);eq(v.style.bg,'@bad');
  ST.comp.place(nav.id);var n=insts()[1];ST.comp.setVariant(n.id,'plan');v=ST.comp.resolve(insts()[1],ST.p);
  eq(ST.nodes.find(v,ST.comp.vid(n,'nv-plan')).n.style.bg,'@ton');eq(ST.nodes.find(v,ST.comp.vid(n,'nv-subjects')).n.style.bg,'@card');eq(nav.shell,true);});
T('отсоединить: получается обычная рамка с новыми id, вид тот же, связь с мастером пропадает, один шаг истории',function(){
  mk();var i=insts()[0];ST.comp.setOv(i.id,tt(),{text:'Свой'});var h0=strip(ST.nodes.html(root(),ST.p,{root:true})),u=ST.undoS.length;
  var r=ST.comp.detach([i.id]);eq(r.ok,true,r.error);eq(ST.undoS.length,u+1);eq(insts().length,0);
  var f=ST.nodes.get(i.id);eq(f.n.type,'frame');eq(strip(ST.nodes.html(root(),ST.p,{root:true})),h0);
  eq(f.n.children[0].id.indexOf('i:')<0,true);eq(f.n.children[0].id!==comp().root.children[0].id,true);eq(ST.validate(ST.p),'');
  ST.undo();eq(insts().length,1);eq(!!ST.comp.detach(['tc-t']).error,true);});
T('удаление мастера: с экземплярами запрещено, «отсоединить все» разрешает; без экземпляров удаляется одним шагом',function(){
  mk();var c=comp();ST.comp.place(c.id);var r=ST.comp.remove(c.id);eq(!!r.error,true);eq(r.used.length,2);eq(ST.comp.list(ST.p).length,1);
  eq(ST.comp.detachAll(c.id).ok,true);eq(insts().length,0);eq(ST.comp.remove(c.id).ok,true);eq(ST.comp.list(ST.p).length,0);eq(ST.validate(ST.p),'');
  ST.undo();eq(ST.comp.list(ST.p).length,1);});
T('удаление мастера во время его правки возвращает на экран',function(){
  mk();var c=comp();ST.comp.detachAll(c.id);ST.comp.edit(c.id);eq(ST.cur,c.id);eq(ST.comp.remove(c.id).ok,true);eq(ST.cur,ST.p.screens[0].id);eq(ST.screen().id,ST.p.screens[0].id);});
T('дублирование мастера: новые id узлов, варианты следуют за новыми id, исходный не тронут',function(){
  fresh();ST.presets.install();var s=ST.comp.list(ST.p).filter(function(c){return c.preset==='nav';})[0],before=JSON.stringify(s);
  var r=ST.comp.dup(s.id);eq(r.ok,true,r.error);var d=ST.comp.get(ST.p,r.id);eq(JSON.stringify(ST.comp.get(ST.p,s.id)),before);eq(d.name.indexOf('копия')>0,true);eq(d.preset,undefined);
  var ids={};ST.nodes.walk(d.root,function(n){ids[n.id]=1;});eq(ids['nv-plan'],undefined);
  d.variants.forEach(function(v){Object.keys(v.ov).forEach(function(m){eq(!!ids[m],true,'узел варианта есть в копии');});});eq(ST.validate(ST.p),'');});
T('проверка файла: сломанные ссылки, экземпляр внутри мастера, чужие поля переопределений, повторы',function(){
  function bad(mut,sub){mk();var c=JSON.parse(JSON.stringify(ST.p));mut(c);var e=ST.validate(c);if(!e)throw new Error('повреждение не найдено ('+sub+')');if(e.indexOf(sub)<0)throw new Error('ждали «'+sub+'» в «'+e+'»');
    var t=JSON.stringify(c),r=ST.io.parse(t);eq(!!r.error,true);eq(r.raw,t,'исходный текст не затирается');}
  bad(function(c){c.components=[];},'мастера нет в проекте');
  bad(function(c){c.components[0].root.children.push({id:'z',type:'instance',name:'вложенный',layout:{},style:{},props:{},children:[],ref:{c:'x',ov:{}}});},'внутри мастера не может быть экземпляров');
  bad(function(c){var i=[];c.screens[0].root.children.forEach(function(n){if(n.type==='instance')n.ref.ov={x:{fs:9}};});},'неизвестное переопределение');
  bad(function(c){c.screens[0].root.children.forEach(function(n){if(n.type==='instance')n.ref.v='нет';});},'такого варианта нет');
  bad(function(c){c.components[0].variants=[{k:'a',name:'А',ov:{}},{k:'a',name:'Б',ov:{}}];},'два варианта');
  bad(function(c){c.components.push(JSON.parse(JSON.stringify(c.components[0])));},'два мастера с одним id');
  bad(function(c){c.components[0].root.type='text';},'корень должен быть рамкой');
  bad(function(c){c.components[0].w=0;},'размер рамки');
  bad(function(c){c.components[0].profile='нет';},'несуществующий профиль');
  bad(function(c){c.components[0].root.children[0].type='ерунда';},'неизвестный тип узла');
  bad(function(c){c.screens[0].root.children.forEach(function(n){if(n.type==='instance')n.ref.ov={x:{col:'#fff'}};});},'только токен');});
T('файл туда-обратно: проект с мастерами и экземплярами сохраняется и открывается без потерь; схема 6 открывается как 7',function(){
  fresh();ST.presets.install();ST.comp.place(comp(1).id);var s=JSON.stringify(ST.p),r=ST.io.parse(s);eq(!!r.project,true,r.error);eq(JSON.stringify(r.project),s);
  var j=JSON.parse(s);j.schema=6;j.components=[];j.screens[0].root.children=[];var q=ST.io.parse(JSON.stringify(j));eq(!!q.project,true,q.error);eq(q.project.schema,7);});
T('смена профиля экрана не меняет дерево с экземплярами; профиль мастера меняется отдельно',function(){
  mk();var tree=JSON.stringify(root()),pid=ST.prof.list(ST.p)[2].id;
  eq(ST.prof.assign(ST.screen().id,pid).ok,true);eq(JSON.stringify(root()),tree);ST.undo();eq(JSON.stringify(root()),tree);
  eq(ST.prof.assignComponent(comp().id,pid).ok,true);eq(comp().profile,pid);eq(ST.validate(ST.p),'');});
T('каждая команда мастеров — один шаг истории с отменой и возвратом',function(){
  mk();var c=comp(),i=insts()[0],ops=[
   ['place',function(){return ST.comp.place(c.id);}],['setOv',function(){return ST.comp.setOv(i.id,tt(),{text:'Ы'});}],['clearOv',function(){return ST.comp.clearOv(i.id);}],
   ['rename',function(){return ST.comp.rename(c.id,'Другое');}],['size',function(){return ST.comp.setSize(c.id,200,90);}],['dup',function(){return ST.comp.dup(c.id);}],
   ['detach',function(){return ST.comp.detach([i.id]);}]];
  ops.forEach(function(o){var u=ST.undoS.length,b=JSON.stringify(ST.p),r=o[1]();eq(!r.error,true,o[0]+': '+r.error);eq(ST.undoS.length,u+1,o[0]+': шаг');var a=JSON.stringify(ST.p);
    ST.undo();eq(JSON.stringify(ST.p),b,o[0]+': отмена');ST.redo();eq(JSON.stringify(ST.p),a,o[0]+': возврат');});});
T('поиск и ввод: пустые и длинные названия, предел вариантов',function(){
  mk();var c=comp(),i=insts()[0];eq(!!ST.comp.rename(c.id,'   ').error,true);eq(!!ST.comp.rename(c.id,new Array(82).join('я')).error,true);eq(!!ST.comp.setSize(c.id,0,10).error,true);eq(!!ST.comp.setSize(c.id,10,5000).error,true);
  for(var k=0;k<ST.comp.VARIANTS_MAX;k++){var r=ST.comp.variantFromInst(i.id,'В'+k);if(k<ST.comp.VARIANTS_MAX)eq(r.ok,true,r.error);ST.comp.setOv(i.id,tt(),{text:'т'+k});}
  eq(!!ST.comp.variantFromInst(i.id,'лишний').error,true);});
T('30 экземпляров карточки показываются быстро (меньше 1,5 с), выбор и размер у каждого свои',function(){
  mk();var c=comp();for(var k=0;k<29;k++)ST.comp.place(c.id);eq(insts().length,30);
  var t=Date.now(),h=ST.nodes.html(root(),ST.p,{root:true});var ms=Date.now()-t;eq(ms<1500,true,'мс: '+ms);
  eq(h.split('data-type="instance"').length-1,30);eq(h.indexOf('data-nid="i:')<0,true,'внутренние узлы не выбираются');eq(ST.validate(ST.p),'');
  ST.nodes.set([insts()[3].id],'layout.w',120);eq(insts()[3].layout.w,120);eq(insts()[4].layout.w,'fill');});
T('экземпляр как обычный узел: копируется, группируется, скрывается, двигается; нельзя внутрь экземпляра',function(){
  mk();var i=insts()[0];eq(ST.nodes.dup([i.id]).ok,true);eq(insts().length,2);
  eq(ST.nodes.patch([i.id],[['hidden',true]]).ok,true);eq(ST.nodes.html(ST.nodes.get(i.id).n,ST.p,{}),'');
  eq(ST.nodes.group([insts()[1].id]).ok,true);eq(ST.validate(ST.p),'');
  eq(!!ST.nodes.add('text',i.id).error,true);eq(!!ST.nodes.move(insts()[1].id,i.id,0).error,true);});
T('экземпляр с пропавшим мастером показывается красной рамкой, не ломая холст',function(){
  mk();var i=JSON.parse(JSON.stringify(insts()[0]));i.ref.c='нет';var h=ST.nodes.html(i,ST.p,{dir:'column'});eq(/Мастер не найден/.test(h),true);});
T('иконки в мастере-иконке: заливка внутри пути сохраняется (искры, лапка)',function(){
  eq(/fill="currentColor"/.test(ST.nodes.ICONS.sparkles),true);eq(/fill="currentColor"/.test(ST.nodes.ICONS.paw),true);eq(/fill=/.test(ST.nodes.ICONS.chart),false);});
})();
