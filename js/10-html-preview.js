/* ---------- HTML ---------- */
/* скрипт-«сторож» внутри предпросмотра: ловит ошибки и необработанные Promise и шлёт их во вкладку «Проблемы» */
var REPORTER='<script>'
 +'window.addEventListener("error",function(e){parent.postMessage({__p:1,msg:e.message,line:e.lineno},"*")});'
 +'window.addEventListener("unhandledrejection",function(e){var r=e.reason;parent.postMessage({__p:1,msg:"Необработанная ошибка Promise: "+(r&&r.message||r)},"*")})'
 +'<\/script>';
/* путь из ссылки → путь файла в проекте: «./a.css», «../img/a.png», «/css/a.css», «a.css?v=2» */
function resolveRef(h,dir){
  h=String(h).trim().replace(/[?#].*$/,'');
  try{h=decodeURIComponent(h)}catch(e){}
  var out=[];
  (h.charAt(0)==='/'?h.slice(1):dir+h).split('/').forEach(function(s){if(s==='..')out.pop();else if(s&&s!=='.')out.push(s)});
  return out.join('/');
}
var TEXT_MIME={svg:'image/svg+xml',json:'application/json',xml:'application/xml',csv:'text/csv',md:'text/markdown'};
function buildHtml(){
  var files=LANGS.html.files,by={},bin={},txt={};
  files.forEach(function(f){
    if(f.data!==undefined){bin[f.name]=f.data;return}
    var c=fileCode(f);by[f.name]=c;
    if(!/\.(css|m?js|html?)$/i.test(f.name))txt[f.name]=c;
  });
  /* ссылка относительно папки dir (или от корня проекта) → ключ файла из карты m */
  function look(m,h,dir){var c=[resolveRef(h,dir),resolveRef(h,'')];for(var i=0;i<c.length;i++)if(m[c[i]]!==undefined)return c[i];return null}
  /* адрес для подстановки: бинарный файл — как есть, текстовый (svg, json…) — как data-URL */
  function asset(h,dir){
    if(/^data:/i.test(h))return null;
    var k=look(bin,h,dir);if(k!==null)return bin[k];
    k=look(txt,h,dir);
    return k!==null?'data:'+(TEXT_MIME[extOf(k)]||'text/plain')+';charset=utf-8,'+encodeURIComponent(txt[k]).replace(/'/g,'%27'):null;
  }
  function cssUrls(t,dir){return t.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi,function(m,q,h){var u=asset(h,dir);return u?'url("'+u+'")':m})}
  var tf=files.filter(function(f){return f.data===undefined});
  var main=tf.find(function(f){return f.name==='index.html'})||tf.find(function(f){return /(^|\/)index\.html?$/i.test(f.name)})||tf.find(function(f){return /\.html?$/i.test(f.name)})||tf[0],cf=curFile();
  if(cf.data===undefined&&/\.html?$/i.test(cf.name))main=cf;
  if(!main)return '<p style="font-family:sans-serif">В проекте нет HTML-файла.</p>';
  var dir=dirOf(main.name),d=fileCode(main);
  /* подставляем только <link rel="stylesheet">; адреса внутри CSS считаются от папки самого CSS-файла */
  d=d.replace(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi,function(m,h){
    var k=look(by,h,dir);
    return (k!==null&&/rel\s*=\s*["']?stylesheet/i.test(m))?'<style>'+cssUrls(by[k],dirOf(k)).replace(/<\/style/gi,'<\\/style')+'</style>':m;
  });
  d=d.replace(/<script([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,function(m,a,h){
    var k=look(by,h,dir);
    return k!==null?'<script>'+by[k].replace(/<\/script/gi,'<\\/script')+'<\/script>':m;
  });
  /* загруженные файлы: src="img/photo.png", href="doc.pdf", poster=…, url(font.woff2) и img.src = "photo.png" в скриптах */
  d=d.replace(/(\b(?:src|href|poster|data)\s*=\s*)(["'])([^"']+)\2/gi,function(m,a,q,h){var u=asset(h,dir);return u?a+q+u+q:m});
  d=cssUrls(d,dir);
  return /<head[^>]*>/i.test(d)?d.replace(/<head[^>]*>/i,function(m){return m+REPORTER}):REPORTER+d;
}
window.addEventListener('message',function(e){var d=e.data;if(d&&d.__p&&e.source===frame.contentWindow)addProblem(String(d.msg),null,'предпросмотр')});
