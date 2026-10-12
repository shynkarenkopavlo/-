/* ---------- Skulpt (лёгкий Python, быстрый старт) ---------- */
var SK_SRC=[
 ['https://cdnjs.cloudflare.com/ajax/libs/skulpt/1.2.0/skulpt.min.js','https://cdnjs.cloudflare.com/ajax/libs/skulpt/1.2.0/skulpt-stdlib.js'],
 ['https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js','https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js']
];
function pingSk(k,fake){
  return new Promise(function(res){
    var w;try{w=fake?fakeWorker(skWorkerFn):spawn(skWorkerFn)}catch(e){return res(false)}
    var t=setTimeout(function(){w.terminate();res(false)},40000);
    w.onmessage=function(e){clearTimeout(t);w.terminate();res(e.data.t==='ready')};
    w.onerror=function(){clearTimeout(t);w.terminate();res(false)};
    w.postMessage({t:'ping',libs:SK_SRC[k]});
  });
}
async function initSkulpt(){
  /* сначала пробуем Skulpt в Web Worker; если библиотека там не стартует — тихо запускаем её внутри страницы */
  for(var k=0;k<SK_SRC.length&&!skOk;k++){
    if(WORKERS!==false&&await pingSk(k,false)){skOk=true;skIdx=k;skFake=false;engine='skulpt'}
    else if(await pingSk(k,true)){skOk=true;skIdx=k;skFake=true;engine='skulpt'}
    else console.warn('Skulpt: не удалось загрузить с '+SK_SRC[k][0].split('/')[2]);
  }
}
async function execSk(src,repl){
  setMode('running');
  var w;
  try{w=skFake?fakeWorker(skWorkerFn):spawn(skWorkerFn)}catch(e){print('Не удалось запустить Skulpt: '+(e&&e.message||e),'e');setMode('idle');return}
  var p=attach(w,'skulpt',repl);
  w.postMessage({t:'run',src:src,libs:SK_SRC[skIdx],files:filesPayload()});
  await p;pending=null;setMode('idle');
}

/* ---------- Pyodide (полный Python, грузится в фоне, тоже в воркере) ---------- */
var SOURCES=['https://cdn.jsdelivr.net/npm/pyodide@0.26.4/','https://unpkg.com/pyodide@0.26.4/','https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'];
var HELPER=String.raw`
import ast, builtins, jsio
builtins._ainput_ = jsio.ainput
def _no_sync_input(*a):
    raise RuntimeError("input() здесь не поддерживается (например, внутри lambda или __init__). Вызывайте input() на верхнем уровне или в обычной функции.")
builtins.input = _no_sync_input
def _fname(f):
    if isinstance(f, ast.Name): return f.id
    if isinstance(f, ast.Attribute): return f.attr
def _tr_(src):
    tree = ast.parse(src)
    defs = [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name != '__init__']
    fs = set()
    def needs(d):
        for n in ast.walk(d):
            if isinstance(n, ast.Call):
                f = n.func
                if (isinstance(f, ast.Name) and f.id == 'input') or _fname(f) in fs:
                    return True
        return False
    ch = True
    while ch:
        ch = False
        for d in defs:
            if d.name not in fs and needs(d):
                fs.add(d.name); ch = True
    class T(ast.NodeTransformer):
        def visit_Call(self, n):
            self.generic_visit(n)
            f = n.func
            if isinstance(f, ast.Name) and f.id == 'input':
                n.func = ast.Name('_ainput_', ast.Load())
                return ast.Await(n)
            if _fname(f) in fs:
                return ast.Await(n)
            return n
        def visit_FunctionDef(self, n):
            self.generic_visit(n)
            if n.name in fs:
                n.__class__ = ast.AsyncFunctionDef
            return n
    tree = T().visit(tree)
    ast.fix_missing_locations(tree)
    return ast.unparse(tree)
`;
async function wasmOk(){try{await WebAssembly.compile(new Uint8Array([0,97,115,109,1,0,0,0]));return true}catch(e){return false}}
function pyInitFrom(base){
  return new Promise(function(res){
    var w;try{w=spawn(pyWorkerFn)}catch(e){return res(String(e&&e.message||e))}
    var t=setTimeout(function(){w.terminate();res('таймаут загрузки')},180000);
    w.onmessage=function(e){
      var d=e.data;
      if(d.t==='ready'){clearTimeout(t);pyW=w;pyVer=d.v;res(true)}
      else if(d.t==='fail'){clearTimeout(t);w.terminate();res(d.m)}
    };
    w.onerror=function(ev){clearTimeout(t);w.terminate();res(ev.message||'ошибка воркера')};
    w.postMessage({t:'init',base:base,helper:HELPER});
  });
}
async function initPyodide(){
  if(pyLoading)return;
  if(WORKERS===false){
    if(skOk)notify('Pyodide отключён: Web Worker недоступны в этом окружении. Откройте файл напрямую в браузере — тогда подключится полный Python.');
    return;
  }
  pyLoading=true;refreshStat();
  if(!(await wasmOk())){
    if(skOk)notify('Pyodide пропущен: в этом окружении заблокирован WebAssembly (откройте файл напрямую в браузере). Работает Skulpt.');
    pyLoading=false;refreshStat();return;
  }
  var ok=false;
  for(var k=0;k<SOURCES.length&&!ok;k++){
    var r=await pyInitFrom(SOURCES[k]);
    if(r===true)ok=true;
    else if(/wasm|WebAssembly/i.test(String(r)))break;
  }
  if(ok){engine='pyodide';notify('Загружен полный Python '+pyVer+' (Pyodide). REPL теперь запоминает переменные.')}
  else if(skOk)notify('Pyodide не загрузился. Работает облегчённый Python (Skulpt): без numpy/pandas и части модулей.');
  pyLoading=false;refreshStat();
}
async function execPy(src,repl){
  setMode('running');
  var p=attach(pyW,'pyodide',repl);
  pyW.postMessage({t:'run',src:src,repl:!!repl,files:repl?[]:allFilesPayload()});
  await p;pending=null;setMode('idle');
}

