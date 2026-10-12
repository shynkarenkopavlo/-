/* ---------- тема ---------- */
var theme=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';
var aceEd=ace.edit('ace');
aceEd.setOptions({showLineNumbers:true,showGutter:true,highlightActiveLine:true,showPrintMargin:false,fontSize:14,displayIndentGuides:true,highlightIndentGuides:true,fontFamily:'"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace'});
aceEd.commands.addCommand({name:'run',bindKey:{win:'Ctrl-Enter',mac:'Command-Enter'},exec:function(){run()}});
function setTheme(t){
  theme=t;document.documentElement.dataset.theme=t;
  aceEd.setTheme(t==='dark'?'ace/theme/tomorrow_night':'ace/theme/chrome');
  $('theme').textContent=t==='dark'?'☀️':'🌙';
}
$('theme').onclick=function(){setTheme(theme==='dark'?'light':'dark');scheduleSave()};
setTheme(theme);

/* ---------- сохранение проектов на этом устройстве (localStorage) ---------- */
var saveT=null;
function saveState(){
  try{
    var o={v:1,lang:lang,theme:theme,active:active,langs:{}};
    Object.keys(LANGS).forEach(function(l){o.langs[l]=LANGS[l].files.map(function(f){return {name:f.name,code:fileCode(f)}})});
    localStorage.setItem(KEY,JSON.stringify(o));
    $('sbsave').textContent='Сохранено на устройстве · '+new Date().toTimeString().slice(0,8);
  }catch(e){$('sbsave').textContent='Автосохранение недоступно в этом окружении'}
}
function scheduleSave(){clearTimeout(saveT);saveT=setTimeout(saveState,800)}
function loadState(){
  try{
    var raw=localStorage.getItem(KEY);if(!raw)return;
    var o=JSON.parse(raw);if(!o||o.v!==1)return;
    ['python','js','html'].forEach(function(l){
      var a=o.langs&&o.langs[l];
      if(Array.isArray(a)&&a.length&&a.every(function(f){return f&&typeof f.name==='string'&&typeof f.code==='string'}))
        LANGS[l].files=a.map(function(f){return {name:f.name,code:f.code}});
      var i=o.active&&o.active[l];
      active[l]=(typeof i==='number'&&i>=0&&i<LANGS[l].files.length)?i:0;
    });
    if(o.lang==='python'||o.lang==='js'||o.lang==='html')lang=o.lang;
    if(o.theme==='dark'||o.theme==='light')setTheme(o.theme);
    document.querySelectorAll('#langs .lt').forEach(function(x){x.classList.toggle('on',x.dataset.l===lang)});
  }catch(e){}
}
aceEd.on('change',scheduleSave);
window.addEventListener('beforeunload',function(){saveState()});

