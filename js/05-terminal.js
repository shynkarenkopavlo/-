/* ---------- панель вывода: Терминал / Проблемы ---------- */
function applyView(){
  var h=lang==='html';
  $('otmain').textContent=h?'Предпросмотр':'Терминал';
  document.querySelectorAll('.ot').forEach(function(b){b.classList.toggle('on',b.dataset.t===outTab)});
  wrap.style.display=(outTab==='main'&&!h)?'block':'none';
  frame.style.display=(outTab==='main'&&h)?'block':'none';
  probsEl.style.display=outTab==='probs'?'block':'none';
  $('row').style.display=lang==='python'?'flex':'none';
}
document.querySelectorAll('.ot').forEach(function(b){b.onclick=function(){outTab=b.dataset.t;applyView()}});

var problems=[];
function lastLine(s){var L=String(s).split('\n').filter(Boolean);return L[L.length-1]||String(s)}
function addProblem(msg,line,file){problems.push({msg:lastLine(msg),line:line||null,file:file||runFile});renderProbs()}
function renderProbs(){
  probsEl.innerHTML='';
  if(!problems.length){var n=document.createElement('div');n.className='pnone';n.textContent='Проблем нет.';probsEl.appendChild(n)}
  problems.forEach(function(p){
    var d=document.createElement('div');d.className='pi';
    var i=document.createElement('i');i.textContent='●';
    var s=document.createElement('span');s.textContent=p.file+(p.line?':'+p.line:'')+' — '+p.msg;
    d.appendChild(i);d.appendChild(s);
    d.onclick=function(){
      var L=LANGS[lang],k=L.files.findIndex(function(f){return f.name===p.file});
      if(k>-1){if(k!==active[lang])openFile(k);if(p.line){aceEd.gotoLine(p.line,0,true)}aceEd.focus()}
    };
    probsEl.appendChild(d);
  });
  var c=$('pc');c.textContent=problems.length;c.className=problems.length?'bad':'';
  annotate();
}
function annotate(){
  var f=curFile();
  aceEd.session.setAnnotations(problems.filter(function(p){return p.file===f.name&&p.line}).map(function(p){return {row:p.line-1,column:0,text:p.msg,type:'error'}}));
}
function lastNum(re,s){var m,r=null,g=new RegExp(re.source,'g');while((m=g.exec(s)))r=+m[1];return r}

/* ---------- терминал ---------- */
var mode='loading',pending=null,hist=[],hi=0,engine=null,pyLoading=false,runFile='';
var LIMIT=2*1024*1024,outBytes=0,halted=false,lastSpan=null,lastCls='',enc=new TextEncoder(),scrollQ=false;
function clearOut(){out.innerHTML='';lastSpan=null;outBytes=0;halted=false}
function write(s,c){
  if(halted||s==='')return;
  c=c||'';
  outBytes+=enc.encode(s).length;
  if(outBytes>LIMIT){forceLimit()}else if(lastSpan&&lastCls===c){lastSpan.firstChild.appendData(s)}
  else{var sp=document.createElement('span');if(c)sp.className=c;sp.textContent=s;out.appendChild(sp);lastSpan=sp;lastCls=c}
  if(!scrollQ){scrollQ=true;requestAnimationFrame(function(){scrollQ=false;wrap.scrollTop=wrap.scrollHeight})}
}
function notify(msg,kind){
  try{console[kind==='e'?'warn':'info']('[UniIDE] '+msg)}catch(e){}
  var box=$('toast');
  for(var k=0;k<box.children.length;k++)if(box.children[k].firstChild.textContent===msg)return;
  var it=document.createElement('div');it.className='tw'+(kind==='e'?' err':'');
  var tx=document.createElement('span');tx.textContent=msg;
  var x=document.createElement('button');x.className='tx';x.textContent='×';x.title='Закрыть';x.setAttribute('aria-label','Закрыть');
  x.onclick=function(){it.remove()};
  it.appendChild(tx);it.appendChild(x);box.appendChild(it);
  while(box.children.length>4)box.removeChild(box.firstChild);
}
function stopIfHalted(){if(halted)throw new Error('OUTPUT_LIMIT')}
function print(s,c){write(s+'\n',c)}
function fmt(v){if(typeof v==='string')return v;try{return typeof v==='object'?JSON.stringify(v):String(v)}catch(e){return String(v)}}
var STAT={loading:'загрузка Python…',running:'выполняется…',input:'ожидание ввода',idle:'готово',failed:'Python не загружен'};
function refreshStat(){
  if(lang!=='python'){$('stat').textContent='JS · браузер';return}
  var t=STAT[mode];
  if(engine==='pyodide')t+=' · Pyodide';
  else if(engine==='skulpt')t+=' · Skulpt'+(pyLoading?' (Pyodide грузится…)':'');
  $('stat').textContent=t;
}
function setMode(m){
  mode=m;ti.disabled=(m!=='idle'&&m!=='input');
  if(m!=='input')ps.textContent=(m==='idle')?'>>> ':'';
  refreshStat();
  if(m==='idle'||m==='input')ti.focus({preventScroll:true});
}
wrap.addEventListener('click',function(){if(!ti.disabled)ti.focus()});
ti.addEventListener('keydown',function(e){
  if(e.key==='Enter'){
    var t=ti.value;ti.value='';
    if(mode==='input'&&pending){print(pending.p+t);var r=pending.res;pending=null;ps.textContent='';setMode('running');r(t)}
    else if(mode==='idle'){if(halted)clearOut();print('>>> '+t,'m');if(t.trim()){hist.push(t);hi=hist.length;if(engine==='pyodide')execPy(t,true);else execSk(t,true)}}
  }else if(e.key==='Escape'&&mode==='input'&&pending){
    var q=pending;pending=null;ps.textContent='';setMode('running');q.rej(new Error('EOFError: ввод прерван'));
  }else if(e.key==='ArrowUp'&&mode==='idle'){e.preventDefault();if(hi>0){hi--;ti.value=hist[hi]}}
  else if(e.key==='ArrowDown'&&mode==='idle'){e.preventDefault();if(hi<hist.length-1){hi++;ti.value=hist[hi]}else{hi=hist.length;ti.value=''}}
});
function ainput(p){
  return new Promise(function(res,rej){
    p=p==null?'':String(p);pending={res:res,rej:rej,p:p};
    mode='input';ps.textContent=p;ti.disabled=false;ti.focus();refreshStat();
  });
}
function timeout(p,ms,msg){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error(msg))},ms)})])}
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('не удалось скачать '+src))};document.head.appendChild(s)})}
function otherPyFiles(){var cf=curFile();return LANGS.python.files.filter(function(f){return f!==cf&&/\.py$/i.test(f.name)})}

