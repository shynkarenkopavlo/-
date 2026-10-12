/* ---------- кнопка «Запустить» ---------- */
async function run(){
  var f=curFile();runFile=f.name;
  if(lang!=='html'){
    var want=lang==='python'?/\.py$/i:/\.js$/i;
    if(f.data!==undefined||!want.test(f.name)){notify('Чтобы запустить код, выберите файл '+(lang==='python'?'.py':'.js')+' в списке файлов.');return}
  }
  var src=fileCode(f);
  if(lang!=='html'&&job){notify('Программа ещё выполняется — нажмите «Стоп» или дождитесь окончания.');return}
  problems=[];renderProbs();
  if(lang==='html'){frame.srcdoc=buildHtml();return}
  if(lang==='python'){
    if(!engine){
      if(starting)notify('Python ещё загружается — подождите несколько секунд.');
      else await startPython();
      if(!engine)return;
    }
    if(mode!=='idle'){notify('Программа ещё выполняется (Esc — прервать ввод).');return}
    clearOut();
    if(engine==='pyodide')await execPy(src,false);else await execSk(src,false);
    return;
  }
  clearOut();await runJs(src);
}
$('run').onclick=run;
$('clr').onclick=function(){clearOut();problems=[];renderProbs();if(lang==='html')frame.srcdoc=''};

loadState();openFile(active[lang]);applyView();renderProbs();setMode('loading');startPython();
