/* ---------- загрузка файлов: кнопка и перетаскивание в окно (любые типы) ---------- */
(function(){
  var MAX=25*1024*1024,inp=$('upf'),app=document.querySelector('.app'),busy=false;
  if(!inp||!$('upl'))return;

  function readUrl(file){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=function(){rej(r.error)};r.readAsDataURL(file)})}
  /* текст или бинарные данные? null — бинарный файл */
  function decodeText(b){
    var n=Math.min(b.length,8192),bad=0;
    for(var i=0;i<n;i++){var c=b[i];if(c===0)return null;if(c<9||(c>13&&c<32&&c!==27))bad++}
    if(n&&bad/n>0.02)return null;
    try{return {s:new TextDecoder('utf-8',{fatal:true}).decode(b)}}catch(e){}
    try{return {s:new TextDecoder('windows-1251').decode(b),enc:'Windows-1251'}}catch(e){return null}
  }
  function uniq(L,name){
    var d=name.lastIndexOf('.'),base=d>0?name.slice(0,d):name,ext=d>0?name.slice(d):'',n=2,t;
    do{t=base+' ('+(n++)+')'+ext}while(L.files.some(function(f){return f.name===t}));
    return t;
  }

  async function addFiles(list){
    list=[].slice.call(list);
    if(!list.length||busy)return;
    busy=true;
    try{
      var L=LANGS[lang],last=-1,n=0;
      for(var k=0;k<list.length;k++){
        var file=list[k],name=file.name.replace(/[\\\/]/g,'').trim()||'file';
        if(file.size>MAX){notify('Файл «'+name+'» больше 25 МБ — пропущен.','e');continue}
        var obj={name:name,code:''};
        try{
          var bytes=new Uint8Array(await file.arrayBuffer()),t=decodeText(bytes);
          if(t){
            obj.code=t.s;
            if(t.enc)notify('«'+name+'» не в UTF-8 — прочитан как '+t.enc+' и будет сохранён в UTF-8.');
            if(bytes.length>1048576)notify('«'+name+'» — большой файл ('+fmtSize(bytes.length)+'), редактор может тормозить.');
          }else obj.data=await readUrl(file);
        }catch(e){notify('Не удалось прочитать «'+name+'».','e');continue}
        var idx=L.files.findIndex(function(f){return f.name===name});
        if(idx>-1){
          if(confirm('Файл «'+name+'» уже есть в проекте.\n\nOK — заменить его, Отмена — сохранить как копию.')){L.files[idx]=obj;last=idx;n++;continue}
          obj.name=uniq(L,name);
        }
        L.files.push(obj);last=L.files.length-1;n++;
      }
      if(n){
        openFile(last);
        var hint=lang==='python'?' В коде Python читайте их через open("имя") — в полном режиме (Pyodide).'
                :lang==='js'?' Код на вкладке JavaScript их не видит: загруженные файлы нужны для HTML и Python.':'';
        notify('Загружено файлов: '+n+'.'+hint);
      }
    }finally{busy=false}
  }

  $('upl').onclick=function(){inp.click()};
  inp.onchange=function(){var l=[].slice.call(inp.files);inp.value='';addFiles(l)};

  /* перетаскивание файлов в окно браузера */
  var depth=0;
  function hasFiles(e){var t=e.dataTransfer&&e.dataTransfer.types;return !!t&&[].indexOf.call(t,'Files')>-1}
  function endDrop(){depth=0;app.classList.remove('drop');document.body.classList.remove('dropping')}
  window.addEventListener('dragenter',function(e){if(!hasFiles(e))return;e.preventDefault();e.stopPropagation();depth++;app.classList.add('drop');document.body.classList.add('dropping')},true);
  window.addEventListener('dragover',function(e){if(!hasFiles(e))return;e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='copy'},true);
  window.addEventListener('dragleave',function(e){if(!hasFiles(e))return;depth=Math.max(0,depth-1);if(!depth)endDrop()},true);
  window.addEventListener('drop',function(e){if(!hasFiles(e))return;e.preventDefault();e.stopPropagation();var l=[].slice.call(e.dataTransfer.files);endDrop();addFiles(l)},true);
})();
