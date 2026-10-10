/* ---------- JavaScript ---------- */
async function runJs(src){
  var w;
  try{w=spawn(jsWorkerFn)}catch(e){print('Web Worker недоступен: '+(e&&e.message||e),'e');return}
  var p=attach(w,'js',false);
  w.postMessage({t:'run',src:src});
  await p;
}

