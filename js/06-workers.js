/* ---------- Web Workers: код выполняется отдельно от страницы ---------- */
var WORKERS=null,loadedScripts={};
function probeWorkers(){
  return new Promise(function(res){
    try{
      var w=new Worker(URL.createObjectURL(new Blob(['onmessage=function(){postMessage(1)}'],{type:'text/javascript'})));
      var t=setTimeout(function(){w.terminate();res(false)},2500);
      w.onmessage=function(){clearTimeout(t);w.terminate();res(true)};
      w.onerror=function(){clearTimeout(t);w.terminate();res(false)};
      w.postMessage(0);
    }catch(e){res(false)}
  });
}
function loadOnce(u){return loadedScripts[u]||(loadedScripts[u]=loadScript(u).catch(function(e){delete loadedScripts[u];throw e}))}
/* режим совместимости: тот же код «воркера», но внутри страницы (если Web Worker заблокированы) */
function fakeWorker(fn){
  var fw={dead:false,throwOnDead:false,onmessage:null,onerror:null},S={};
  function importScripts(){
    var urls=[].slice.call(arguments);
    return urls.reduce(function(p,u){return p.then(function(){return loadOnce(u)})},Promise.resolve());
  }
  function post(m){
    if(fw.dead){if(fw.throwOnDead){fw.throwOnDead=false;throw new Error('OUTPUT_LIMIT')}return}
    if(fw.onmessage)fw.onmessage({data:m});
    if(fw.dead&&fw.throwOnDead){fw.throwOnDead=false;throw new Error('OUTPUT_LIMIT')}
  }
  new Function('self','postMessage','importScripts','('+fn.toString()+')()')(S,post,importScripts);
  fw.postMessage=function(m){setTimeout(function(){
    if(fw.dead||!S.onmessage)return;
    try{var r=S.onmessage({data:m});if(r&&r.catch)r.catch(function(){})}catch(e){}
  },0)};
  fw.terminate=function(){fw.dead=true};
  fw.abortRun=function(){fw.throwOnDead=true};
  return fw;
}
function spawn(fn){
  if(WORKERS!==false){
    try{return new Worker(URL.createObjectURL(new Blob(['('+fn.toString()+')()'],{type:'text/javascript'})))}
    catch(e){WORKERS=false}
  }
  return fakeWorker(fn);
}

function jsWorkerFn(){
  var buf='',cls='',last=Date.now();
  function flush(){if(buf){postMessage({t:'out',s:buf,c:cls});buf=''}last=Date.now()}
  function out(s,c){c=c||'';out.total=(out.total||0)+(out.te||(out.te=new TextEncoder())).encode(s).length;if(out.total>2097152){if(!out.hit){out.hit=true;flush();postMessage({t:'limit'})}throw new Error('OUTPUT_LIMIT')}if(c!==cls){flush();cls=c}buf+=s;if(buf.length>4096||Date.now()-last>30)flush()}
  function fmt(v){if(typeof v==='string')return v;try{return typeof v==='object'?JSON.stringify(v):String(v)}catch(e){return String(v)}}
  self.onmessage=function(e){
    var d=e.data;if(d.t!=='run')return;out.total=0;out.hit=false;
    var j=function(a){return [].map.call(a,fmt).join(' ')+'\n'};
    var c={log:function(){out(j(arguments))},warn:function(){out(j(arguments),'e')},error:function(){out(j(arguments),'e')}};
    c.info=c.log;
    (async function(){
      try{
        var AF=Object.getPrototypeOf(async function(){}).constructor;
        var r=await new AF('console',d.src)(c);
        if(r!==undefined)out('→ '+fmt(r)+'\n','m');
        flush();
      }catch(err){
        flush();
        var m=/<anonymous>:(\d+):\d+/.exec(String(err&&err.stack||''));
        var em=String(err),hint='';
        if(/\b(document|window|alert|prompt|confirm|localStorage|sessionStorage|navigator) is not defined/.test(em))hint='\n💡 На вкладке JavaScript код работает в фоне, без страницы: document, window, alert и prompt здесь недоступны. Для работы со страницей используйте вкладку HTML.';
        postMessage({t:'err',m:em+hint,line:m?Math.max(1,+m[1]-2):null});
      }
      postMessage({t:'done'});
    })();
  };
}

function skWorkerFn(){
  var buf='',cls='',last=Date.now(),inputCb=null;
  function flush(){if(buf){postMessage({t:'out',s:buf,c:cls});buf=''}last=Date.now()}
  function out(s,c){c=c||'';out.total=(out.total||0)+(out.te||(out.te=new TextEncoder())).encode(s).length;if(out.total>2097152){if(!out.hit){out.hit=true;flush();postMessage({t:'limit'})}throw new Error('OUTPUT_LIMIT')}if(c!==cls){flush();cls=c}buf+=s;if(buf.length>4096||Date.now()-last>30)flush()}
  self.onmessage=async function(e){
    var d=e.data;
    if(d.t==='input'){if(inputCb)inputCb.res(d.v);inputCb=null;return}
    if(d.t==='eof'){if(inputCb)inputCb.rej(new Error('EOFError: ввод прерван'));inputCb=null;return}
    if(d.t==='ping'){
      try{await importScripts(d.libs[0],d.libs[1]);postMessage({t:'ready'})}
      catch(err){postMessage({t:'fail',m:String(err&&err.message||err)})}
      return;
    }
    if(d.t==='run'){
      out.total=0;out.hit=false;
      try{await importScripts(d.libs[0],d.libs[1])}
      catch(err){postMessage({t:'err',m:'Не удалось загрузить Skulpt: '+err,line:null});postMessage({t:'done'});return}
      d.files.forEach(function(f){Sk.builtinFiles.files['src/lib/'+f.name]=f.code});
      Sk.configure({
        output:function(s){out(s,'')},
        read:function(x){if(Sk.builtinFiles===undefined||Sk.builtinFiles.files[x]===undefined)throw "File not found: '"+x+"'";return Sk.builtinFiles.files[x]},
        inputfun:function(p){flush();return new Promise(function(res,rej){inputCb={res:res,rej:rej};postMessage({t:'input',p:String(p==null?'':p)})})},
        inputfunTakesPrompt:true,__future__:Sk.python3
      });
      Sk.misceval.asyncToPromise(function(){return Sk.importMainWithBody('<stdin>',false,d.src,true)}).then(
        function(){flush();postMessage({t:'done'})},
        function(err){
          flush();var m=String(err&&err.toString?err.toString():err),mm=/on line (\d+)/.exec(m);
          postMessage({t:'err',m:m,line:mm?+mm[1]:null});postMessage({t:'done'});
        });
    }
  };
}

function pyWorkerFn(){
  var py=null,ns=null,tr=null,rp=null,inputCb=null,buf='',cls='',last=Date.now();
  function flush(){if(buf){postMessage({t:'out',s:buf,c:cls});buf=''}last=Date.now()}
  function out(s,c){c=c||'';out.total=(out.total||0)+(out.te||(out.te=new TextEncoder())).encode(s).length;if(out.total>2097152){if(!out.hit){out.hit=true;flush();postMessage({t:'limit'})}throw new Error('OUTPUT_LIMIT')}if(c!==cls){flush();cls=c}buf+=s;if(buf.length>4096||Date.now()-last>30)flush()}
  function clean(m){
    var L=String(m).split('\n'),i=L.findIndex(function(l){return l.indexOf('"<exec>"')>-1});
    if(i>-1)return 'Traceback (most recent call last):\n'+L.slice(i).join('\n');
    return L.filter(Boolean).slice(-3).join('\n');
  }
  function lastNum(s){var m,r=null,g=/line (\d+)/g;while((m=g.exec(s)))r=+m[1];return r}
  function newNs(){if(ns)ns.destroy();ns=py.runPython('{"__name__": "__main__"}')}
  async function run(d){
    out.total=0;out.hit=false;
    try{
      if(!d.repl){
        newNs();
        d.files.forEach(function(f){
          var cur='/home/pyodide';f.name.split('/').slice(0,-1).forEach(function(s){cur+='/'+s;try{py.FS.mkdir(cur)}catch(e){}});
          py.FS.writeFile('/home/pyodide/'+f.name,f.bytes||f.code);
        });
        py.runPython('import sys, importlib\nimportlib.invalidate_caches()\nfor m in '+JSON.stringify(d.files.filter(function(f){return /\.py$/i.test(f.name)}).map(function(f){return f.name.replace(/\.py$/i,'').replace(/\//g,'.')}))+':\n    sys.modules.pop(m, None)');
      }
      var r=await py.runPythonAsync(tr(d.src),{globals:ns});
      if(d.repl&&r!==undefined)out(String(rp(r))+'\n','');
      flush();
    }catch(err){
      flush();var m=clean(err&&err.message||err);
      postMessage({t:'err',m:m,line:d.repl?null:lastNum(m)});
    }
    flush();postMessage({t:'done'});
  }
  self.onmessage=async function(e){
    var d=e.data;
    if(d.t==='input'){if(inputCb)inputCb.res(d.v);inputCb=null;return}
    if(d.t==='eof'){if(inputCb)inputCb.rej(new Error('EOFError: ввод прерван'));inputCb=null;return}
    if(d.t==='run'){run(d);return}
    if(d.t==='init'){
      try{
        importScripts(d.base+'pyodide.js');
        py=await loadPyodide({indexURL:d.base});
        py.setStdout({batched:function(s){out(s+'\n','')}});
        py.setStderr({batched:function(s){out(s+'\n','e')}});
        py.registerJsModule('jsio',{ainput:function(p){
          flush();
          return new Promise(function(res,rej){inputCb={res:res,rej:rej};postMessage({t:'input',p:String(p==null?'':p)})});
        }});
        py.runPython(d.helper);
        tr=py.globals.get('_tr_');rp=py.runPython('repr');newNs();
        postMessage({t:'ready',v:py.runPython('import sys\nsys.version.split()[0]')});
      }catch(err){postMessage({t:'fail',m:String(err&&err.message||err)})}
    }
  };
}

/* ---------- запуск воркера, «Стоп», лимит вывода ---------- */
var job=null,skIdx=0,skOk=false,skFake=false,pyW=null,pyVer='';
function updateStop(){$('stop').style.display=job?'flex':'none'}
function attach(w,kind,repl){
  return new Promise(function(resolve){
    var fin=false;
    function done(){
      if(fin)return;fin=true;
      if(kind!=='pyodide')w.terminate();
      job=null;updateStop();resolve();
    }
    job={w:w,kind:kind,done:done};updateStop();
    w.onmessage=function(e){
      var d=e.data;
      if(d.t==='out'){write(d.s,d.c);if(halted)onLimit()}
      else if(d.t==='limit'){forceLimit();onLimit()}
      else if(d.t==='input'){ainput(d.p).then(function(v){w.postMessage({t:'input',v:v})},function(){w.postMessage({t:'eof'})})}
      else if(d.t==='err'){if(!halted){print(d.m,'e');if(!repl)addProblem(d.m,d.line)}}
      else if(d.t==='done')done();
    };
    w.onerror=function(ev){if(!halted)print('Ошибка воркера: '+(ev.message||'неизвестная'),'e');done()};
  });
}
function forceLimit(){
  if(halted)return;
  halted=true;
  var n=document.createElement('span');n.className='e';n.textContent='\n⛔ Вывод превысил 2 МБ — выполнение остановлено.\n';
  out.appendChild(n);lastSpan=null;
  addProblem('Вывод превысил 2 МБ — выполнение остановлено');
}
/* Skulpt/JS: воркер одноразовый — завершаем сразу. Pyodide: даём коду 3 с остановиться самому (без перезагрузки), иначе завершаем. */
function onLimit(){
  var j=job;if(!j)return;
  if(j.kind!=='pyodide'){kill('limit');return}
  if(!j.wd)j.wd=setTimeout(function(){if(job===j)kill('limit')},3000);
}
function kill(reason){
  if(!job)return;var j=job;
  if(j.w.abortRun)j.w.abortRun();
  j.w.terminate();
  if(reason==='stop')print('\n⛔ Выполнение остановлено.','e');
  if(j.kind==='pyodide'){
    pyW=null;engine=skOk?'skulpt':null;
    setTimeout(function(){notify('Pyodide перезапускается (переменные REPL сброшены)…');initPyodide()},50);
  }
  j.done();
}
$('stop').onclick=function(){kill('stop')};
function filesPayload(){return otherPyFiles().map(function(f){return {name:f.name,code:fileCode(f)}})}
/* для Pyodide в «файловую систему» Python кладём все остальные файлы проекта, включая загруженные (текст и бинарные) — их можно читать через open() */
function allFilesPayload(){
  var cf=curFile();
  return LANGS.python.files.filter(function(f){return f!==cf}).map(function(f){
    return f.data!==undefined?{name:f.name,bytes:dataToBytes(f.data)}:{name:f.name,code:fileCode(f)};
  });
}
