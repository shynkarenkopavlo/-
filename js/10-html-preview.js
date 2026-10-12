/* ---------- HTML ---------- */
/* скрипт-«сторож» внутри предпросмотра: ловит ошибки и необработанные Promise и шлёт их во вкладку «Проблемы» */
var REPORTER='<script>'
 +'window.addEventListener("error",function(e){parent.postMessage({__p:1,msg:e.message,line:e.lineno},"*")});'
 +'window.addEventListener("unhandledrejection",function(e){var r=e.reason;parent.postMessage({__p:1,msg:"Необработанная ошибка Promise: "+(r&&r.message||r)},"*")})'
 +'<\/script>';
function normRef(h){return String(h).trim().replace(/^\.\//,'')}
function buildHtml(){
  var files=LANGS.html.files,by={};files.forEach(function(f){by[f.name]=fileCode(f)});
  var main=files.find(function(f){return f.name==='index.html'})||files.find(function(f){return /\.html?$/i.test(f.name)})||files[0],cf=curFile();
  if(/\.html?$/i.test(cf.name))main=cf;
  var d=fileCode(main);
  /* подставляем только <link rel="stylesheet">; «./style.css» и «style.css» — один и тот же файл */
  d=d.replace(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi,function(m,h){
    var k=normRef(h);
    return (by[k]!==undefined&&/rel\s*=\s*["']?stylesheet/i.test(m))?'<style>'+by[k].replace(/<\/style/gi,'<\\/style')+'</style>':m;
  });
  d=d.replace(/<script([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,function(m,a,h){
    var k=normRef(h);
    return by[k]!==undefined?'<script>'+by[k].replace(/<\/script/gi,'<\\/script')+'<\/script>':m;
  });
  return /<head[^>]*>/i.test(d)?d.replace(/<head[^>]*>/i,function(m){return m+REPORTER}):REPORTER+d;
}
window.addEventListener('message',function(e){var d=e.data;if(d&&d.__p&&e.source===frame.contentWindow)addProblem(String(d.msg),null,'предпросмотр')});
