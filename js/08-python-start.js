/* ---------- запуск Python ---------- */
var starting=false;
async function startPython(){
  if(starting)return;starting=true;setMode('loading');
  if(WORKERS===null){
    WORKERS=await probeWorkers();
    if(!WORKERS)notify('Режим совместимости: Web Worker заблокированы. Лимит вывода 2 МБ работает, но «Стоп» не прервёт цикл без вывода (в Python и в JavaScript).');
  }
  await initSkulpt();
  if(engine){
    setMode('idle');
    if(!pyW)initPyodide();
  }else{
    await initPyodide();
    if(engine){setMode('idle')}
    else{setMode('failed');var fm='Python не загрузился: проверьте интернет, отключите VPN/блокировщик и нажмите «Запустить».';print(fm,'e');notify(fm,'e')}
  }
  starting=false;
}

