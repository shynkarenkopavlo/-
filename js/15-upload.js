/* ---------- загрузка файлов и папок: кнопки и перетаскивание в окно (любые типы) ---------- */
(function(){
  var MAX=25*1024*1024,MAXN=300,inp=$('upf'),inpd=$('upfd'),app=document.querySelector('.app'),busy=false;
  if(!inp||!$('upl'))return;
  /* служебные папки и файлы, которые не нужны в редакторе (и могут весить сотни мегабайт) */
  var SKIP=/(^|\/)(\.git|node_modules|__pycache__|\.idea|\.vscode|\.DS_Store|Thumbs\.db)(\/|$)/;

  function readUrl(file){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=function(){rej(r.error)};r.readAsDataURL(file)})}
  /* текст или бинарные данные? null — бинарный файл */
  function decodeText(b){
    var n=Math.min(b.length,8192),bad=0;
    for(var i=0;i<n;i++){var c=b[i];if(c===0)return null;if(c<9||(c>13&&c<32&&c!==27))bad++}
    if(n&&bad/n>0.02)return null;
    try{return {s:new TextDecoder('utf-8',{fatal:true}).decode(b)}}catch(e){}
    try{return {s:new TextDecoder('windows-1251').decode(b),enc:'Windows-1251'}}catch(e){return null}
  }
  /* «папка\\файл», «../x» → безопасный путь «папка/файл» */
  function cleanPath(p){return String(p).replace(/\\/g,'/').split('/').filter(function(s){return s&&s!=='.'&&s!=='..'}).join('/')}
  function uniq(L,path){
    var dir=dirOf(path),name=path.slice(dir.length),d=name.lastIndexOf('.'),base=d>0?name.slice(0,d):name,ext=d>0?name.slice(d):'',n=2,t;
    do{t=dir+base+' ('+(n++)+')'+ext}while(L.files.some(function(f){return f.name===t}));
    return t;
  }

  /* список файлов из <input> → {out:[{file,path}], skipped, over} */
  function fromList(list){
    var ctx={out:[],skipped:0,over:false};
    [].slice.call(list).forEach(function(f){
      var p=cleanPath(f.webkitRelativePath||f.name);
      if(!p)return;
      if(SKIP.test(p)){ctx.skipped++;return}
      if(ctx.out.length>=MAXN){ctx.over=true;return}
      ctx.out.push({file:f,path:p});
    });
    return ctx;
  }
  /* обход перетащенных папок (FileSystem Entry API) */
  function readAll(reader){return new Promise(function(res,rej){var all=[];(function next(){reader.readEntries(function(b){if(!b.length)return res(all);all=all.concat([].slice.call(b));next()},rej)})()})}
  async function walk(entry,prefix,ctx){
    var p=prefix+entry.name;
    if(SKIP.test(p)){ctx.skipped++;return}
    if(entry.isFile){
      if(ctx.out.length>=MAXN){ctx.over=true;return}
      await new Promise(function(res){entry.file(function(f){var cp=cleanPath(p);if(cp)ctx.out.push({file:f,path:cp});res()},function(){res()})});
    }else if(entry.isDirectory){
      var kids=[];
      try{kids=await readAll(entry.createReader())}catch(e){}
      for(var k=0;k<kids.length&&!ctx.over;k++)await walk(kids[k],p+'/',ctx);
    }
  }

  async function addFiles(ctx){
    var items=ctx.out;
    if(ctx.skipped)notify('Пропущено служебных файлов и папок: '+ctx.skipped+' (.git, node_modules и т. п.).');
    if(ctx.over)notify('Слишком много файлов: загружены первые '+MAXN+'.','e');
    if(!items.length||busy)return;
    busy=true;
    try{
      var L=LANGS[lang],last=-1,n=0,folders={};
      var exist=items.filter(function(it){return L.files.some(function(f){return f.name===it.path})});
      var replaceAll=false;
      if(exist.length)replaceAll=confirm(exist.length===1
        ?'Файл «'+exist[0].path+'» уже есть в проекте.\n\nOK — заменить его, Отмена — сохранить как копию.'
        :'Файлы с такими именами уже есть в проекте ('+exist.length+', например «'+exist[0].path+'»).\n\nOK — заменить их, Отмена — сохранить как копии.');
      for(var k=0;k<items.length;k++){
        var file=items[k].file,path=items[k].path;
        if(file.size>MAX){notify('Файл «'+path+'» больше 25 МБ — пропущен.','e');continue}
        var obj={name:path,code:''};
        try{
          var bytes=new Uint8Array(await file.arrayBuffer()),t=decodeText(bytes);
          if(t){
            obj.code=t.s;
            if(t.enc)notify('«'+path+'» не в UTF-8 — прочитан как '+t.enc+' и будет сохранён в UTF-8.');
            if(bytes.length>1048576)notify('«'+path+'» — большой файл ('+fmtSize(bytes.length)+'), редактор может тормозить.');
          }else obj.data=await readUrl(file);
        }catch(e){notify('Не удалось прочитать «'+path+'».','e');continue}
        var idx=L.files.findIndex(function(f){return f.name===path});
        if(idx>-1){
          if(replaceAll){L.files[idx]=obj;last=idx;n++;continue}
          obj.name=uniq(L,path);
        }
        L.files.push(obj);last=L.files.length-1;n++;
        if(dirOf(obj.name))folders[dirOf(obj.name).split('/')[0]]=1;
      }
      if(n){
        openFile(last);
        var fc=Object.keys(folders).length;
        var hint=lang==='python'?' В коде Python читайте их через open("папка/имя") — в полном режиме (Pyodide).'
                :lang==='js'?' Код на вкладке JavaScript их не видит: загруженные файлы нужны для HTML и Python.':'';
        notify('Загружено файлов: '+n+(fc?' (папок верхнего уровня: '+fc+')':'')+'.'+hint);
      }
    }finally{busy=false}
  }

  $('upl').onclick=function(){inp.click()};
  inp.onchange=function(){var c=fromList(inp.files);inp.value='';addFiles(c)};
  if(inpd){
    $('upd').onclick=function(){inpd.click()};
    inpd.onchange=function(){var c=fromList(inpd.files);inpd.value='';addFiles(c)};
  }

  /* перетаскивание файлов и папок в окно браузера */
  var depth=0;
  function hasFiles(e){var t=e.dataTransfer&&e.dataTransfer.types;return !!t&&[].indexOf.call(t,'Files')>-1}
  function endDrop(){depth=0;app.classList.remove('drop');document.body.classList.remove('dropping')}
  window.addEventListener('dragenter',function(e){if(!hasFiles(e))return;e.preventDefault();e.stopPropagation();depth++;app.classList.add('drop');document.body.classList.add('dropping')},true);
  window.addEventListener('dragover',function(e){if(!hasFiles(e))return;e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='copy'},true);
  window.addEventListener('dragleave',function(e){if(!hasFiles(e))return;depth=Math.max(0,depth-1);if(!depth)endDrop()},true);
  window.addEventListener('drop',function(e){
    if(!hasFiles(e))return;
    e.preventDefault();e.stopPropagation();
    /* записи нужно взять сразу: после первого await список перетащенного уже недоступен */
    var dt=e.dataTransfer,entries=[],plain=[].slice.call(dt.files);
    if(dt.items)[].slice.call(dt.items).forEach(function(it){
      if(it.kind==='file'&&it.webkitGetAsEntry){var en=it.webkitGetAsEntry();if(en)entries.push(en)}
    });
    endDrop();
    if(entries.length){
      var ctx={out:[],skipped:0,over:false};
      (async function(){for(var i=0;i<entries.length;i++)await walk(entries[i],'',ctx);addFiles(ctx)})();
    }else addFiles(fromList(plain));
  },true);
})();
