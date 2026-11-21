/* Catworking Studio: вкладка «Шрифты» (список слева, редактор справа), образец на холсте, проверка русских букв. Объект ST.fontui */
(function(){'use strict';
var ST=window.ST,F=ST.fonts,h=ST.esc,ui=ST.fontui={sel:null,verified:false,verifying:false};
function $(s){return document.querySelector(s);}
function say(r){if(r&&r.error){ST.ui.error(r.error);return false;}return true;}
function own(n){return 'font-family:'+h(F.stack(n))+';';}
function warn(m){return '<span class="st-warn" title="'+h(m)+'" aria-label="'+h(m)+'">⚠</span>';}
function lvMark(n){var l=F.level(n);return l==='bad'?warn('Нет русских букв: '+F.miss(n)):l==='warn'?warn('Нет символов: '+F.miss(n)):'';}
function selOk(){var s=ui.sel,p=ST.p;if(!s)return false;
  return s.k==='role'?F.ROLES.indexOf(s.n)>=0:s.k==='text'?!!(p.text&&p.text[s.n]):!!F.find(s.n);}
ui.badge=function(){return ST.p?F.countWarn(ST.p):0;};

/* ---------- проверка глифов в этом браузере: ширина буквы в шрифте и в трёх запасных; разница значит «буквы нет» ---------- */
var CHARS=Array.from(new Set((F.GLYPHS+'АБВГҐДЕЄЖЗИІЇКЛМНОПРСТУФХЦЧШЬЮЯабвгґдеєжзиіїклмнопрстуфхцчшьюя').replace(/ /g,'')));
function missing(n){
  return document.fonts.load('40px "'+n+'"',CHARS.join('')).then(function(){
    var c=document.createElement('canvas').getContext('2d'),out='',fb=['monospace','serif','sans-serif'];
    CHARS.forEach(function(ch){var w=fb.map(function(f){c.font='40px "'+n+'",'+f;return c.measureText(ch).width;});
      if(Math.abs(w[0]-w[1])>0.01||Math.abs(w[1]-w[2])>0.01)out+=ch;});
    return {miss:out};
  }).catch(function(){return {miss:'',nofile:true};});
}
ui.verify=function(){
  if(ui.verified||ui.verifying)return Promise.resolve();
  if(!(window.document&&document.fonts&&document.fonts.load)){ui.verified=true;return Promise.resolve();}
  ui.verifying=true;
  return Promise.all(F.CAT.map(function(f){return missing(f.n).then(function(r){F.live[f.n]=r;});})).then(function(){
    ui.verified=true;ui.verifying=false;if(ST.ui&&ST.ui.render)ST.ui.render();});
};

/* ---------- слева ---------- */
function sumKb(){var k=0;F.CAT.forEach(function(c){k+=c.kb;});return Math.round(k);}
ui.list=function(){
  ui.verify();
  var p=ST.p,on=function(k,n){return ui.sel&&ui.sel.k===k&&ui.sel.n===n?' on':'';};
  var s='<div class="st-lh">Роли шрифтов</div>'+F.ROLES.map(function(r){var f=p.fonts[r];
    return '<button class="st-b st-row st-tk'+on('role',r)+'" data-st="fsel:role:'+r+'"><span class="st-tkn">'+h(F.ROLE_NAME[r])+'</span>'+
      '<span class="st-fam" style="'+own(f)+'">'+h(f)+'</span>'+(F.find(f)&&F.level(f)!=='bad'?'':warn('Шрифт не подходит'))+'</button>';}).join('');
  s+='<div class="st-lh">Стили текста</div>'+F.PRESETS.map(function(x){var t=p.text[x.k],w=F.warnT(p,t);
    return '<button class="st-b st-row st-tk'+on('text',x.k)+'" data-st="fsel:text:'+x.k+'"><span class="st-tkn">'+h(x.n)+'</span>'+
      '<span class="st-fam">'+h(t.fs)+'/'+h(t.fw)+'</span>'+(w.length?warn(w[0]):'')+'</button>';}).join('');
  var all=F.list().concat(F.blocked());
  s+='<div class="st-lh">Шрифты ('+F.CAT.length+')</div>'+all.map(function(c){var bad=F.level(c.n)==='bad';
    return '<button class="st-b st-row st-tk'+on('font',c.n)+(bad?' st-off':'')+'" data-st="fsel:font:'+h(c.n)+'"><span class="st-tkn" style="'+own(c.n)+'">'+h(c.n)+'</span>'+
      '<span class="st-fam">'+(bad?'не подходит':c.kb+' КБ')+'</span>'+lvMark(c.n)+'</button>';}).join('');
  s+='<p class="st-mut">'+(ui.verified?'Русские буквы проверены на этом устройстве.':'Проверяю русские буквы…')+' Папка fonts/ целиком: около '+sumKb()+' КБ.</p>';
  return s;
};

/* ---------- справа ---------- */
function pv(css,text,th){ /* превью в нужной теме проекта: переменные токенов и ролей на самом блоке */
  var st=ST.tok.styleAttr(ST.p,th)+F.styleAttr(ST.p)+'background:var(--card);color:var(--tx);';
  return '<div class="st-pv" style="'+h(st)+'"><div class="st-pvl">'+(th==='light'?'☀':'🌙')+'</div><div style="'+h(css)+'">'+h(text)+'</div></div>';
}
function opt(v,label,cur){return '<option value="'+h(v)+'"'+(String(v)===String(cur)?' selected':'')+'>'+h(label)+'</option>';}
function warnList(ws){return ws.map(function(w){return '<p class="st-ct st-mid">⚠ '+h(w)+'</p>';}).join('');}
function famOptions(sel,withRoles){
  var p=ST.p,o='',names=F.list().map(function(c){return c.n;});
  if(withRoles)F.ROLES.forEach(function(r){o+=opt('role:'+r,'Роль · '+F.ROLE_NAME[r]+' ('+p.fonts[r]+')',sel);});
  if(!withRoles&&names.indexOf(sel)<0)o+=opt(sel,sel+' (не подходит)',sel);
  names.forEach(function(n){o+=opt(n,withRoles?n+' (вне профиля)':n,sel);});
  if(withRoles&&!F.isRole(sel)&&names.indexOf(sel)<0)o+=opt(sel,sel+' (нет в списке)',sel);
  return o;
}
function summary(){
  var r=F.report(ST.p),own2=r.files.map(function(f){return '<li>'+h(f.name)+' · '+f.file+' · '+f.kb+' КБ · '+h(f.lic)+'</li>';}).join('');
  return '<h3 class="st-h">Шрифты</h3><p class="st-mut">Выберите роль, стиль текста или шрифт в списке слева. Текст ссылается на роль, поэтому смена шрифта роли меняет все такие тексты сразу.</p>'+
    '<div class="st-lh">Что нужно приложению</div>'+(own2?'<ul class="st-ul">'+own2+'</ul><p class="st-mut">Всего: '+r.kb+' КБ.</p>':'<p class="st-mut">Пока ничего.</p>')+warnList(r.warns);
}
function roleEditor(r){
  var f=ST.p.fonts[r];
  return '<h3 class="st-h">Роль «'+h(F.ROLE_NAME[r])+'»</h3>'+
    '<label class="st-lb">Шрифт<select class="st-in" data-xf="fam">'+famOptions(f,false)+'</select></label>'+
    pv('font-family:'+F.stack(f)+';font-size:22px;font-weight:700;line-height:1.2;',F.PANGRAM,'light')+
    pv('font-family:'+F.stack(f)+';font-size:22px;font-weight:700;line-height:1.2;',F.GLYPHS,'dark')+
    (F.level(f)==='ok'?'':warnList(['В шрифте нет: '+F.miss(f)+'.']))+
    '<div class="st-lh">Где используется</div><p class="st-mut">'+h(Object.keys(ST.p.text).filter(function(k){return ST.p.text[k].ff==='role:'+r;}).map(F.name).join(', ')||'пока ни в одном стиле текста')+'</p>';
}
function textEditor(k){
  var p=ST.p,t=p.text[k],fam=F.family(p,t.ff),ws=F.weights(fam);
  if(ws.indexOf(t.fw)<0)ws=ws.concat(t.fw).sort(function(a,b){return a-b;});
  var toks=ST.tok.names(p),cOpts=(t.c.charAt(0)==='@'?'':opt(t.c,'свой цвет '+t.c,t.c))+toks.map(function(n){return opt('@'+n,n,t.c);}).join('');
  function num(f,lab,st){return '<label class="st-lb st-half">'+lab+'<input class="st-in" data-xf="'+f+'" inputmode="decimal" value="'+h(t[f])+'"></label>';}
  var sample=k==='counter'?'1 280':k==='title'?'Предметы':k==='button'?'Начать':k==='caption'?'Осталось 12 дней':'Биология: клетка и её органоиды, длинное название';
  return '<h3 class="st-h">'+h(F.name(k))+'</h3>'+
    '<label class="st-lb">Гарнитура<select class="st-in" data-xf="ff">'+famOptions(t.ff,true)+'</select></label>'+
    '<div class="st-prow"><label class="st-lb st-half">Начертание<select class="st-in" data-xf="fw">'+ws.map(function(w){return opt(w,String(w),t.fw);}).join('')+'</select></label>'+num('fs','Размер, px')+'</div>'+
    '<div class="st-prow">'+num('lh','Межстрочный')+num('ls','Межбуквенный, em')+'</div>'+
    '<div class="st-prow"><label class="st-lb st-half">Регистр<select class="st-in" data-xf="tt">'+Object.keys(F.TT).map(function(x){return opt(x,F.TT[x],t.tt);}).join('')+'</select></label>'+
    '<label class="st-lb st-half">Выравнивание<select class="st-in" data-xf="ta">'+Object.keys(F.TA).map(function(x){return opt(x,F.TA[x],t.ta);}).join('')+'</select></label></div>'+
    '<div class="st-prow">'+num('cl','Обрезка, строк (0 = нет)')+'<label class="st-lb st-half">Цвет (токен)<select class="st-in" data-xf="c">'+cOpts+'</select></label></div>'+
    '<label class="st-lb st-chk"><input type="checkbox" data-xf="tnum"'+(t.tnum?' checked':'')+'> Цифры одной ширины (для счётчиков)</label>'+
    '<div class="st-lh">Предпросмотр</div>'+pv(F.css(t,p),sample,'light')+pv(F.css(t,p),sample,'dark')+warnList(F.warnT(p,t))+
    '<button class="st-b st-row" data-st="fres:'+k+'">Сбросить к значениям макетов</button>';
}
function fontInfo(n){
  var c=F.find(n),lv=F.level(n),live=F.live[n],ws=F.weights(n);
  var st=lv==='ok'?'Все русские буквы, цифры и символы на месте.':lv==='warn'?'Русские буквы есть. Нет символов: '+F.miss(n)+' (их нарисует запасной шрифт).':'Нет русских букв: '+F.miss(n)+'. В списки не попадает.';
  return '<h3 class="st-h">'+h(c.n)+'</h3><p class="st-mut">'+h(c.k)+' · '+c.kb+' КБ · '+h(c.lic)+' · вес '+(c.w[0]===c.w[1]?c.w[0]:c.w[0]+'–'+c.w[1])+'</p>'+
    '<p class="st-ct '+(lv==='ok'?'st-good':lv==='warn'?'st-mid':'st-bad')+'">'+h(st)+(live&&live.nofile?' Файл не загрузился, показаны данные из таблицы.':live?' Проверено на этом устройстве.':'')+'</p>'+
    '<div class="st-pv" style="background:var(--st-bg)"><div style="'+own(n)+'font-size:22px;line-height:1.25">'+h(F.PANGRAM)+'</div>'+
    '<div style="'+own(n)+'font-size:20px;line-height:1.4;margin-top:6px">'+h(F.GLYPHS)+'</div></div>'+
    (lv==='bad'?'':'<div class="st-lh">Назначить роли</div>'+F.ROLES.map(function(r){
      return '<button class="st-b st-row" data-st="fset:'+r+':'+h(n)+'">'+h(F.ROLE_NAME[r])+(ST.p.fonts[r]===n?' ✓':'')+'</button>';}).join(''))+
    '<div class="st-lh">Начертания</div>'+ws.map(function(w){return '<div class="st-wl" style="'+own(n)+'font-weight:'+w+'"><span class="st-mut">'+w+'</span> '+h('Ёё Йй Щщ Ъъ Ыы Эээ Юю Яя 1280')+'</div>';}).join('');
}
ui.inspector=function(){
  if(!selOk()){ui.sel=null;return summary();}
  return ui.sel.k==='role'?roleEditor(ui.sel.n):ui.sel.k==='text'?textEditor(ui.sel.n):fontInfo(ui.sel.n);
};

/* ---------- образец на холсте (вкладка «Шрифты»): тексты проекта в его токенах и шрифтах, обе темы ---------- */
ui.specimen=function(){
  var p=ST.p,t=p.text,c=function(n){return 'var(--'+n+',#888)';};
  function line(k,txt){return '<div style="'+h(F.css(t[k],p))+'">'+h(txt)+'</div>';}
  return '<div style="height:100%;box-sizing:border-box;padding:24px 20px;display:flex;flex-direction:column;gap:16px;background:linear-gradient('+c('bg')+','+c('bg2')+');overflow:hidden">'+
    line('title','Предметы')+
    '<div style="padding:16px;border-radius:20px;border:2px solid '+c('ln')+';box-shadow:0 4px 0 '+c('ln')+';background:'+c('card')+';display:flex;flex-direction:column;gap:6px">'+
      line('cardtitle','Биология: клетка и её органоиды, очень длинное название темы')+line('caption','Осталось 12 дней · 24 карточки')+
      '<div style="'+h(F.css(t.counter,p))+'">1 280 · 07.12 · 3/18</div></div>'+
    '<div style="min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:'+c('ac')+';border-bottom:4px solid '+c('ed')+'">'+
      '<span style="'+h(F.css(t.button,p))+'">Начать</span></div>'+
    F.ROLES.map(function(r){return '<div style="color:'+c('tx')+'"><div style="font:700 11px system-ui,sans-serif;color:'+c('mu')+';margin-bottom:2px">'+h(F.ROLE_NAME[r])+' · '+h(p.fonts[r])+'</div>'+
      '<div style="font-family:var(--f-'+r+');font-size:'+(r==='pixel'?12:17)+'px;line-height:1.3;font-weight:600">'+h(F.PANGRAM)+'</div></div>';}).join('')+
    '<div style="margin-top:auto;font:700 12px system-ui,sans-serif;color:'+c('mu')+'">'+h(F.GLYPHS)+'</div></div>';
};

/* ---------- события ---------- */
function click(e){
  var t=e.target.closest('[data-st]');if(!t)return;var a=t.getAttribute('data-st');
  if(a.indexOf('fsel:')===0){var q=a.split(':');ui.sel={k:q[1],n:q.slice(2).join(':')};
    if(ST.ui.sheet==='left')ST.ui.sheetTo('right');ST.ui.render();}
  else if(a.indexOf('fset:')===0){var q2=a.split(':');if(say(F.setRole(q2[1],q2.slice(2).join(':'))))ST.ui.render();}
  else if(a.indexOf('fres:')===0){if(say(F.resetText(a.slice(5))))ST.ui.render();}
}
function change(e){
  var el=e.target,f=el.getAttribute&&el.getAttribute('data-xf'),s=ui.sel;if(!f||!s||!ST.p)return;
  if(s.k==='role'&&f==='fam'){if(!say(F.setRole(s.n,el.value)))ST.ui.render();return;}
  if(s.k!=='text')return;
  var v,patch={};
  if(f==='tnum')v=el.checked;
  else if(['fs','lh','ls','fw','cl'].indexOf(f)>=0){v=Number(String(el.value).replace(',','.'));
    if(!String(el.value).trim()||!isFinite(v)){say({error:'Здесь нужно число (например, 15 или 1,2).'});ST.ui.render();return;}}
  else v=el.value;
  patch[f]=v;if(!say(F.setText(s.n,patch)))ST.ui.render();
}
ui.bind=function(){[$('#st-left'),$('#st-right')].forEach(function(b){b.addEventListener('click',click);b.addEventListener('change',change);});};
})();
