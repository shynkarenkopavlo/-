/* ---------- HTML ---------- */
/* скрипт-«сторож» внутри предпросмотра: ловит ошибки и необработанные Promise и шлёт их во вкладку «Проблемы» */
var REPORTER='<script>'
 +'window.addEventListener("error",function(e){parent.postMessage({__p:1,msg:e.message,line:e.lineno},"*")});'
 +'window.addEventListener("unhandledrejection",function(e){var r=e.reason;parent.postMessage({__p:1,msg:"Необработанная ошибка Promise: "+(r&&r.message||r)},"*")})'
 +'<\/script>';
function normRef(h){return String(h).trim().replace(/^\.\//,'')}
var TEXT_MIME={svg:'image/svg+xml',json:'application/json',xml:'application/xml',csv:'text/csv',md:'text/markdown'};
function buildHtml(){
  var files=LANGS.html.files,by={},bin={},txt={};
  files.forEach(function(f){
    if(f.data!==undefined){bin[f.name]=f.data;return}
    var c=fileCode(f);by[f.name]=c;
    if(!/\.(css|m?js|html?)$/i.test(f.name))txt[f.name]=c;
  });
  /* адрес для подстановки: бинарный файл — как есть, текстовый (svg, json…) — как data-URL */
  function asset(k){
    if(bin[k]!==undefined)return bin[k];
    if(txt[k]!==undefined)return 'data:'+(TEXT_MIME[extOf(k)]||'text/plain')+';charset=utf-8,'+encodeURIComponent(txt[k]).replace(/'/g,'%27');
    return null;
  }
  var tf=files.filter(function(f){return f.data===undefined});
  var main=tf.find(function(f){return f.name==='index.html'})||tf.find(function(f){return /\.html?$/i.test(f.name)})||tf[0],cf=curFile();
  if(cf.data===undefined&&/\.html?$/i.test(cf.name))main=cf;
  if(!main)return '<p style="font-family:sans-serif">В проекте нет HTML-файла.</p>';
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
  /* загруженные файлы: src="photo.png", href="doc.pdf", poster=…, url(font.woff2) и img.src = "photo.png" в скриптах */
  d=d.replace(/(\b(?:src|href|poster|data)\s*=\s*)(["'])([^"']+)\2/gi,function(m,a,q,h){var u=asset(normRef(h));return u?a+q+u+q:m});
  d=d.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi,function(m,q,h){var u=asset(normRef(h));return u?'url("'+u+'")':m});
  return /<head[^>]*>/i.test(d)?d.replace(/<head[^>]*>/i,function(m){return m+REPORTER}):REPORTER+d;
}
window.addEventListener('message',function(e){var d=e.data;if(d&&d.__p&&e.source===frame.contentWindow)addProblem(String(d.msg),null,'предпросмотр')});
