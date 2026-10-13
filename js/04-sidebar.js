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
var collapsed={};                                    /* свёрнутые папки: «язык|путь» → true */
function expandTo(name){var p=dirOf(name).replace(/\/$/,'').split('/'),acc='';p.forEach(function(s){if(!s)return;acc+=(acc?'/':'')+s;delete collapsed[lang+'|'+acc]})}
function openFile(i){
  active[lang]=i;var f=curFile(),bv=$('binview');expandTo(f.name);
  if(f.data!==undefined){
    if(!emptySess){emptySess=ace.createEditSession('');try{emptySess.setUseWorker(false)}catch(x){}}
    aceEd.setSession(emptySess);aceEd.setReadOnly(true);showBin(f);bv.classList.add('show');
  }else{
    bv.classList.remove('show');bv.innerHTML='';aceEd.setReadOnly(false);aceEd.setSession(sess(f));
  }
  renderTabs();annotate();updPos();if(f.data===undefined)aceEd.focus();
}
function addFile(ext){
  var L=LANGS[lang],n=1,name,dir=dirOf(curFile().name);ext=ext||L.ext;      /* новый файл создаётся рядом с открытым */
  do{name=dir+'file'+(n++)+'.'+ext}while(L.files.some(function(f){return f.name===name}));
  L.files.push({name:name,code:''});
  var i=L.files.length-1;openFile(i);
  var el=$('files').querySelector('.fi[data-i="'+i+'"]'),nm=el&&el.querySelector('.nm');
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
function closeDir(path){
  var L=LANGS[lang],pre=path+'/',keep=L.files.filter(function(f){return f.name.indexOf(pre)!==0}),cnt=L.files.length-keep.length;
  if(!keep.length){notify('Нельзя удалить все файлы проекта.');return}
  if(!confirm('Удалить папку «'+path+'» и все файлы в ней ('+cnt+')?'))return;
  var cur=curFile();
  problems=problems.filter(function(p){return p.file.indexOf(pre)!==0});
  L.files=keep;var ni=keep.indexOf(cur);active[lang]=ni>-1?ni:0;
  renderProbs();openFile(active[lang]);
}
function cleanName(v){return v.trim().replace(/\\/g,'/').replace(/\/+/g,'/').replace(/^\/|\/$/g,'')}
function badName(n){return !n||/(^|\/)\.\.?(\/|$)/.test(n)}
function rename(i,span){
  var f=LANGS[lang].files[i],inp=document.createElement('input'),done=false;
  var dir=dirOf(f.name),bn=f.name.slice(dir.length);       /* переименовывается только имя файла, папка сохраняется */
  /* в Python и JavaScript расширение (.py / .js) подставляется автоматически; в HTML имя вводится целиком */
  var auto=((lang==='python'||lang==='js')&&bn.toLowerCase().slice(-(LANGS[lang].ext.length+1))==='.'+LANGS[lang].ext)?LANGS[lang].ext:null;
  var tail=auto?'.'+auto:'';
  var hasTail=function(n){return !!tail&&n.toLowerCase().slice(-tail.length)===tail};
  var base=bn;if(hasTail(base))base=base.slice(0,-tail.length);
  var box=document.createElement('span');box.className='rnw';
  inp.value=base;inp.className='ren';inp.title='Можно ввести «папка/имя», чтобы переместить файл в папку';box.appendChild(inp);
  if(auto){var sf=document.createElement('span');sf.className='sfx';sf.textContent=tail;box.appendChild(sf)}
  span.replaceWith(box);inp.focus();inp.select();
  function fin(ok){
    if(done)return;done=true;
    var n=cleanName(inp.value);
    if(auto&&n){var last=n.split('/').pop().toLowerCase();if(last===tail)n='';else if(!hasTail(n))n+=tail}
    n=n?dir+n:'';
    if(ok&&!badName(n)&&n!==f.name&&!LANGS[lang].files.some(function(g,j){return j!==i&&g.name===n})){
      var old=f.name;f.name=n;if(f.sess){f.sess.setMode(modeFor(n));sessOpts(f)}
      if(lang==='html')fixRefs(old,n);
      expandTo(n);
    }
    renderTabs();
  }
  inp.onblur=function(){fin(true)};
  inp.onkeydown=function(e){if(e.key==='Enter')fin(true);if(e.key==='Escape')fin(false)};
}
function renameDir(path,span){
  var inp=document.createElement('input'),done=false,parent=dirOf(path),base=path.slice(parent.length);
  var box=document.createElement('span');box.className='rnw';
  inp.value=base;inp.className='ren';box.appendChild(inp);
  span.replaceWith(box);inp.focus();inp.select();
  function fin(ok){
    if(done)return;done=true;
    var n=cleanName(inp.value);
    if(ok&&!badName(n)&&n!==base){
      var np=parent+n,L=LANGS[lang],pre=path+'/',moves=[],taken={};
      L.files.forEach(function(f){if(f.name.indexOf(pre)===0)moves.push([f,np+'/'+f.name.slice(pre.length)]);else taken[f.name]=1});
      if(moves.some(function(m){return taken[m[1]]}))notify('Такое имя уже занято.','e');
      else{
        var cnt=0;
        moves.forEach(function(m){
          var o=m[0].name;m[0].name=m[1];
          if(m[0].sess){m[0].sess.setMode(modeFor(m[1]));sessOpts(m[0])}
          if(lang==='html')cnt+=fixRefs(o,m[1],true);
        });
        if(cnt)notify('Ссылки в HTML-файлах обновлены ('+cnt+').');
        expandTo(np+'/x');
      }
    }
    renderTabs();
  }
  inp.onblur=function(){fin(true)};
  inp.onkeydown=function(e){if(e.key==='Enter')fin(true);if(e.key==='Escape')fin(false)};
}
/* после переименования файла в HTML-проекте обновляем ссылки href="…" / src="…" в остальных HTML-файлах (и от корня проекта, и от папки самого HTML) */
function fixRefs(oldN,newN,quiet){
  var cnt=0;
  LANGS.html.files.forEach(function(g){
    if(g.data!==undefined||!/\.html?$/i.test(g.name))return;
    var d=dirOf(g.name),pairs=[[oldN,newN]];
    if(d&&oldN.indexOf(d)===0&&newN.indexOf(d)===0)pairs.push([oldN.slice(d.length),newN.slice(d.length)]);
    var c=fileCode(g),r=c;
    pairs.forEach(function(p){
      var q=p[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),re=new RegExp('((?:href|src)\\s*=\\s*)(["\'])(?:\\.\\/)?'+q+'\\2','g');
      r=r.replace(re,function(m,a,b){cnt++;return a+b+p[1]+b});
    });
    if(r!==c){if(g.sess)g.sess.setValue(r);else g.code=r}
  });
  if(cnt&&!quiet)notify('Ссылки на «'+oldN+'» обновлены на «'+newN+'» ('+cnt+').');
  return cnt;
}
function download(){
  var f=curFile(),b=f.data!==undefined?new Blob([dataToBytes(f.data)],{type:dataMime(f.data)}):new Blob([fileCode(f)],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download=f.name.split('/').pop();document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
}
function mkIco(name){var s=document.createElement('span'),e=extOf(name);s.className='ico '+e;s.textContent=(e.length>4?e.slice(0,4):e).toUpperCase();return s}
/* список файлов проекта → плоский список строк «папка / файл» с глубиной вложенности (папки сверху) */
function treeRows(files){
  var root={dirs:Object.create(null),files:[]},rows=[];
  files.forEach(function(f,i){
    var parts=f.name.split('/'),node=root;
    for(var k=0;k<parts.length-1;k++){node=node.dirs[parts[k]]||(node.dirs[parts[k]]={dirs:Object.create(null),files:[],path:parts.slice(0,k+1).join('/')})}
    node.files.push({i:i,name:parts[parts.length-1]});
  });
  (function walk(n,depth){
    Object.keys(n.dirs).sort(function(x,y){return x.localeCompare(y)}).forEach(function(name){
      var d=n.dirs[name],open=!collapsed[lang+'|'+d.path];
      rows.push({dir:true,path:d.path,name:name,depth:depth,open:open});
      if(open)walk(d,depth+1);
    });
    n.files.forEach(function(f){rows.push({dir:false,idx:f.i,name:f.name,depth:depth})});
  })(root,0);
  return rows;
}
function renderTabs(){
  var box=$('files');box.innerHTML='';var L=LANGS[lang];
  treeRows(L.files).forEach(function(r){
    var t=document.createElement('div'),nm=document.createElement('span');
    t.style.setProperty('--d',r.depth);nm.className='nm';nm.textContent=r.name;
    if(r.dir){
      t.className='fi dir';nm.title='Щелчок — свернуть/развернуть, двойной щелчок — переименовать';
      var ic=document.createElement('span');ic.className='ico dir';ic.textContent=r.open?'▾':'▸';
      nm.ondblclick=function(e){e.stopPropagation();renameDir(r.path,nm)};
      t.onclick=function(){var k=lang+'|'+r.path;if(collapsed[k])delete collapsed[k];else collapsed[k]=true;renderTabs()};
      t.appendChild(ic);t.appendChild(nm);
      if(L.files.length>1){var xd=document.createElement('b');xd.className='x';xd.textContent='×';xd.title='Удалить папку';xd.onclick=function(e){e.stopPropagation();closeDir(r.path)};t.appendChild(xd)}
    }else{
      var i=r.idx,f=L.files[i];
      t.className='fi'+(i===active[lang]?' on':'');t.dataset.i=i;nm.title=f.name+'\nДвойной щелчок — переименовать';
      nm.ondblclick=function(e){e.stopPropagation();rename(i,nm)};
      t.onclick=function(){if(i!==active[lang])openFile(i)};
      t.appendChild(mkIco(f.name));t.appendChild(nm);
      if(L.files.length>1){var x=document.createElement('b');x.className='x';x.textContent='×';x.title='Закрыть';x.onclick=function(e){e.stopPropagation();closeFile(i)};t.appendChild(x)}
    }
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

