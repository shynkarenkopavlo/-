/* ---------- HTML ---------- */
var REPORTER='<script>window.addEventListener("error",function(e){parent.postMessage({__p:1,msg:e.message,line:e.lineno},"*")})<\/script>';
function buildHtml(){
  var files=LANGS.html.files,by={};files.forEach(function(f){by[f.name]=fileCode(f)});
  var main=files.find(function(f){return f.name==='index.html'})||files.find(function(f){return /\.html?$/i.test(f.name)})||files[0],cf=curFile();
  if(/\.html?$/i.test(cf.name))main=cf;
  var d=fileCode(main);
  d=d.replace(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi,function(m,h){return by[h]!==undefined?'<style>'+by[h]+'</style>':m});
  d=d.replace(/<script([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,function(m,a,h){return by[h]!==undefined?'<script>'+by[h].replace(/<\/script/gi,'<\\/script')+'<\/script>':m});
  return /<head[^>]*>/i.test(d)?d.replace(/<head[^>]*>/i,function(m){return m+REPORTER}):REPORTER+d;
}
window.addEventListener('message',function(e){var d=e.data;if(d&&d.__p&&e.source===frame.contentWindow)addProblem(String(d.msg),null,'предпросмотр')});

