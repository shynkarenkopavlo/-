/* ---------- сайдбар ---------- */
var emptySess=null;
/* бинарный файл: вместо редактора показываем карточку (для картинок, видео и звука — ещё и предпросмотр) */
function showBin(f){
  var v=$('binview');v.innerHTML='';
  var mime=dataMime(f.data),el;
  if(/^image\//.test(mime)){el=document.createElement('img');el.alt=f.name;el.src=f.data}
  else if(/^video\//.test(mime)){el=document.createElement('video');el.controls=true;el.src=f.data}
  else if(/^audio\//.test(mime)){el=document.createElement('audio');el.controls=true;el.src=f.data}
  else{el=mkIco(f.name);el.style.cssText='width:56px;height:56px;font-size:15px;border-radius:14px'}
  var n=document.createElement('div');n.className='bn';n.textContent=f.name;
  var m=document.createElement('div');m.className='bm';m.textContent=mime+' · '+fmtSize(dataSize(f.data))+' · редактирование недоступно';
  var b=document.createElement('button');b.className='btn';b.textContent='⬇ Скачать файл';b.onclick=download;
  v.appendChild(el);v.appendChild(n);v.appendChild(m);v.appendChild(b);
}
function openFile(i){
  active[lang]=i;var f=curFile(),bv=$('binview');
  if(f.data!==undefined){
    if(!emptySess){emptySess=ace.createEditSession('');try{emptySess.setUseWorker(false)}catch(x){}}
    aceEd.setSession(emptySess);aceEd.setReadOnly(true);showBin(f);bv.classList.add('show');
  }else{
    bv.classList.remove('show');bv.innerHTML='';aceEd.setReadOnly(false);aceEd.setSession(sess(f));
  }
  renderTabs();annotate();updPos();if(f.data===undefined)aceEd.focus();
}
function addFile(ext){
  var L=LANGS[lang],n=1,name;ext=ext||L.ext;
  do{name='file'+(n++)+'.'+ext}while(L.files.some(function(f){return f.name===name}));
  L.files.push({name:name,code:''});
  var i=L.files.length-1;openFile(i);
  var el=$('files').children[i],nm=el&&el.querySelector('.nm');
  if(nm)rename(i,nm);
}
function closeFile(i){
  var L=LANGS[lang];if(L.files.length<2)return;
  problems=problems.filter(function(p){return p.file!==L.files[i].name});
  L.files.splice(i,1);
  if(active[lang]>=L.files.length)active[lang]=L.files.length-1;
  else if(i<active[lang])active[lang]--;
  renderProbs();openFile(active[lang]);
}
function rename(i,span){
  var f=LANGS[lang].files[i],inp=document.createElement('input'),done=false;
  /* в Python и JavaScript расширение (.py / .js) подставляется автоматически; в HTML имя вводится целиком */
  var auto=((lang==='python'||lang==='js')&&f.name.toLowerCase().slice(-(LANGS[lang].ext.length+1))==='.'+LANGS[lang].ext)?LANGS[lang].ext:null;
  var tail=auto?'.'+auto:'';
  var hasTail=function(n){return !!tail&&n.toLowerCase().slice(-tail.length)===tail};
  var base=f.name;if(hasTail(base))base=base.slice(0,-tail.length);
  var box=document.createElement('span');box.className='rnw';
  inp.value=base;inp.className='ren';box.appendChild(inp);
  if(auto){var sf=document.createElement('span');sf.className='sfx';sf.textContent=tail;box.appendChild(sf)}
  span.replaceWith(box);inp.focus();inp.select();
  function fin(ok){
    if(done)return;done=true;
    var n=inp.value.trim().replace(/[\\\/]/g,'');
    if(auto&&n){if(n.toLowerCase()===tail)n='';else if(!hasTail(n))n+=tail}
    if(ok&&n&&!LANGS[lang].files.some(function(g,j){return j!==i&&g.name===n})){
      var old=f.name;f.name=n;if(f.sess){f.sess.setMode(modeFor(n));sessOpts(f)}
      if(lang==='html'&&old!==n)fixRefs(old,n);
    }
    renderTabs();
  }
  inp.onblur=function(){fin(true)};
  inp.onkeydown=function(e){if(e.key==='Enter')fin(true);if(e.key==='Escape')fin(false)};
}
/* после переименования файла в HTML-проекте обновляем ссылки href="…" / src="…" в остальных HTML-файлах */
function fixRefs(oldN,newN){
  var q=oldN.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),re=new RegExp('((?:href|src)\\s*=\\s*)(["\'])(?:\\.\\/)?'+q+'\\2','g'),cnt=0;
  LANGS.html.files.forEach(function(g){
    if(!/\.html?$/i.test(g.name))return;
    var c=fileCode(g),r=c.replace(re,function(m,a,b){cnt++;return a+b+newN+b});
    if(r!==c){if(g.sess)g.sess.setValue(r);else g.code=r}
  });
  if(cnt)notify('Ссылки на «'+oldN+'» обновлены на «'+newN+'» ('+cnt+').');
}
function download(){
  var f=curFile(),b=f.data!==undefined?new Blob([dataToBytes(f.data)],{type:dataMime(f.data)}):new Blob([fileCode(f)],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download=f.name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
}
function mkIco(name){var s=document.createElement('span'),e=extOf(name);s.className='ico '+e;s.textContent=(e.length>4?e.slice(0,4):e).toUpperCase();return s}
function renderTabs(){
  var box=$('files');box.innerHTML='';var L=LANGS[lang];
  L.files.forEach(function(f,i){
    var t=document.createElement('div');t.className='fi'+(i===active[lang]?' on':'');
    var nm=document.createElement('span');nm.className='nm';nm.textContent=f.name;nm.title='Двойной щелчок — переименовать';
    nm.ondblclick=function(e){e.stopPropagation();rename(i,nm)};
    t.onclick=function(){if(i!==active[lang])openFile(i)};
    t.appendChild(mkIco(f.name));t.appendChild(nm);
    if(L.files.length>1){var x=document.createElement('b');x.className='x';x.textContent='×';x.title='Закрыть';x.onclick=function(e){e.stopPropagation();closeFile(i)};t.appendChild(x)}
    box.appendChild(t);
  });
  var cf=curFile(),ci=$('curico'),e=extOf(cf.name);
  ci.className='ico '+e;ci.textContent=(e.length>4?e.slice(0,4):e).toUpperCase();
  $('curname').textContent=cf.name;$('shl').textContent='Проект · '+LANG_NAMES[lang];$('sblang').textContent=LANG_NAMES[lang];
  scheduleSave();
}
$('addf').onclick=function(){if(lang==='html')$('types').classList.toggle('show');else addFile()};
document.querySelectorAll('#types .btn').forEach(function(b){b.onclick=function(){$('types').classList.remove('show');addFile(b.dataset.x)}});
$('dl').onclick=download;
var rstT=null;
function rstLabel(armed){var b=$('rst');b.classList.toggle('armed',armed);b.querySelector('.tx').textContent=armed?(window.matchMedia('(max-width:900px)').matches?'Точно?':'Точно сбросить?'):'Сбросить проект'}
$('rst').onclick=function(){
  var b=$('rst');
  if(!b.dataset.arm){b.dataset.arm='1';rstLabel(true);rstT=setTimeout(function(){delete b.dataset.arm;rstLabel(false)},3000);return}
  clearTimeout(rstT);delete b.dataset.arm;rstLabel(false);
  LANGS[lang].files=JSON.parse(JSON.stringify(DEFAULTS[lang].files));active[lang]=0;
  problems=[];renderProbs();openFile(0);saveState();
};
document.querySelectorAll('#langs .lt').forEach(function(b){b.onclick=function(){
  lang=b.dataset.l;$('types').classList.remove('show');
  document.querySelectorAll('#langs .lt').forEach(function(x){x.classList.toggle('on',x===b)});
  openFile(active[lang]);applyView();refreshStat();
}});
function updPos(){var p=aceEd.getCursorPosition();$('sbpos').textContent='Стр '+(p.row+1)+', Стлб '+(p.column+1)}
aceEd.on('changeSelection',updPos);aceEd.on('changeSession',updPos);

