/* ---------- JavaScript ---------- */
var jsFakeWarned=false;
async function runJs(src){
  if(WORKERS===false&&!jsFakeWarned){
    jsFakeWarned=true;
    notify('Режим совместимости: JavaScript выполняется прямо в странице. «Стоп» не прервёт бесконечный цикл — вкладку придётся закрыть. Откройте файл напрямую в браузере.');
  }
  var w;
  try{w=spawn(jsWorkerFn)}catch(e){print('Web Worker недоступен: '+(e&&e.message||e),'e');return}
  var p=attach(w,'js',false);
  w.postMessage({t:'run',src:src});
  await p;
}
