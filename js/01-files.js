var $=function(i){return document.getElementById(i)};
var out=$('out'),frame=$('frame'),ti=$('ti'),ps=$('ps'),wrap=$('termwrap'),probsEl=$('probs');
var LANG_NAMES={python:'Python',js:'JavaScript',html:'HTML'};

/* ---------- файлы проекта ---------- */
var LANGS={
 python:{ext:'py',files:[{name:'main.py',code:'name = input("Как вас зовут? ")\nprint("Привет, " + name + "!")\n\nn = int(input("Введите число: "))\nfor i in range(1, n + 1):\n    print(i, "в квадрате =", i * i)\n'}]},
 js:{ext:'js',files:[{name:'script.js',code:'const nums = [1, 2, 3, 4, 5];\nconsole.log("Квадраты:", nums.map(n => n * n));\nconsole.log("Сумма:", nums.reduce((a, b) => a + b, 0));\n'}]},
 html:{ext:'css',files:[
  {name:'index.html',code:'<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1 id="t">Привет, мир!</h1>\n  <button id="b">Нажми меня</button>\n  <script src="script.js"><\/script>\n</body>\n</html>\n'},
  {name:'style.css',code:'body { font-family: sans-serif; text-align: center; padding: 40px; }\nbutton { padding: 10px 20px; font-size: 16px; }\n'},
  {name:'script.js',code:'document.getElementById("b").onclick = function () {\n  document.getElementById("t").textContent = "Работает!";\n};\n'}
 ]}
};
var DEFAULTS=JSON.parse(JSON.stringify(LANGS)),KEY='uniide:projects:v1';
var active={python:0,js:0,html:0},lang='python',outTab='main';
var MODES={py:'python',js:'javascript',html:'html',htm:'html',css:'css',json:'json',md:'markdown',txt:'text'};
function extOf(n){return n.split('.').pop().toLowerCase()}
function modeFor(n){return 'ace/mode/'+(MODES[extOf(n)]||'text')}
/* Python — отступ 4 пробела, HTML/CSS/JS — 2; встроенные проверки-воркеры Ace отключены */
function sessOpts(f){var e=extOf(f.name);f.sess.setTabSize(e==='py'?4:2);f.sess.setUseSoftTabs(true)}
function sess(f){
  if(!f.sess){
    f.sess=ace.createEditSession(f.code);
    try{f.sess.setUseWorker(false)}catch(x){}
    f.sess.setMode(modeFor(f.name));sessOpts(f);
  }
  return f.sess;
}
function fileCode(f){return f.sess?f.sess.getValue():f.code}
function curFile(){return LANGS[lang].files[active[lang]]}

