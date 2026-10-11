/* ---------- автодополнение: подсказки при наборе, Tab — принять первую ---------- */
(function(){
  var lt;try{lt=ace.require('ace/ext/language_tools')}catch(e){return}
  if(!lt)return;
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function item(cap,snip,meta,doc,score){
    var o={caption:cap,value:cap,meta:meta,score:score||1000,docHTML:'<b>'+esc(cap)+'</b>'+(doc?'<br>'+esc(doc):'')};
    if(snip)o.snippet=snip;
    return o;
  }
  /* список имён через пробел; «=имя» — свойство/константа без скобок */
  function mem(names,meta,sc){
    return names.split(' ').map(function(n){var c=n.charAt(0)==='=';if(c)n=n.slice(1);return item(n,c?null:n+'(${1})',meta,'',sc)});
  }
  function rows(list,meta,sc){return list.map(function(r){return item(r[0],r[1],r[3]||meta,r[2],sc)})}
  function words(str,meta,sc){return str.split(' ').map(function(w){return item(w,null,meta,'',sc)})}
  function uniq(arr){var s={};return arr.filter(function(x){return s[x.caption]?false:(s[x.caption]=1)})}

  /* ===== Python ===== */
  var PY_FN=rows([
    ['print','print(${1})','вывести значения в терминал'],['input','input(${1:"Введите: "})','запросить ввод у пользователя'],
    ['len','len(${1})','длина строки, списка и т. п.'],['range','range(${1})','последовательность чисел'],
    ['int','int(${1})','преобразовать в целое число'],['str','str(${1})','преобразовать в строку'],
    ['float','float(${1})','преобразовать в дробное число'],['list','list(${1})','создать список'],
    ['dict','dict(${1})','создать словарь'],['set','set(${1})','создать множество'],['tuple','tuple(${1})','создать кортеж'],
    ['bool','bool(${1})','логическое значение'],['type','type(${1})','тип значения'],
    ['isinstance','isinstance(${1:x}, ${2:int})','проверить тип'],['sum','sum(${1})','сумма элементов'],
    ['min','min(${1})','минимальное значение'],['max','max(${1})','максимальное значение'],['abs','abs(${1})','модуль числа'],
    ['round','round(${1})','округлить число'],['sorted','sorted(${1})','отсортированная копия'],
    ['reversed','reversed(${1})','обратный порядок'],['enumerate','enumerate(${1})','пары индекс — значение'],
    ['zip','zip(${1}, ${2})','объединить последовательности'],['map','map(${1:func}, ${2:items})','применить функцию к элементам'],
    ['filter','filter(${1:func}, ${2:items})','отфильтровать элементы'],['open','open(${1:"file.txt"})','открыть файл'],
    ['any','any(${1})','хотя бы один элемент истинен'],['all','all(${1})','все элементы истинны'],
    ['chr','chr(${1})','символ по коду'],['ord','ord(${1})','код символа'],['pow','pow(${1:x}, ${2:y})','возведение в степень'],
    ['divmod','divmod(${1:a}, ${2:b})','частное и остаток'],['format','format(${1})','форматирование значения'],
    ['repr','repr(${1})','строковое представление'],['id','id(${1})','идентификатор объекта'],
    ['dir','dir(${1})','список атрибутов объекта'],['iter','iter(${1})','создать итератор'],['next','next(${1})','следующий элемент'],
    ['hex','hex(${1})','шестнадцатеричная запись'],['bin','bin(${1})','двоичная запись']
  ],'функция',1000);
  var PY_SNIP=rows([
    ['def','def ${1:name}(${2}):\n\t${0:pass}','объявить функцию'],['for','for ${1:i} in ${2:range(10)}:\n\t${0:pass}','цикл for'],
    ['while','while ${1:condition}:\n\t${0:pass}','цикл while'],['if','if ${1:condition}:\n\t${0:pass}','условие'],
    ['elif','elif ${1:condition}:\n\t${0:pass}','иначе если'],['else','else:\n\t${0:pass}','иначе'],
    ['class','class ${1:Name}:\n\tdef __init__(self${2}):\n\t\t${0:pass}','объявить класс'],
    ['try','try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${0:print(e)}','обработка ошибок'],
    ['with','with ${1:open("file.txt")} as ${2:f}:\n\t${0:pass}','менеджер контекста'],
    ['lambda','lambda ${1:x}: ${0:x}','анонимная функция'],['import','import ${0}','импорт модуля'],
    ['from','from ${1:module} import ${0}','импорт из модуля']
  ],'шаблон',960);
  var PY_KW=words('return break continue pass in is not and or True False None yield global nonlocal raise assert del as finally except','ключевое слово',900);
  var PY_ALL=PY_FN.concat(PY_SNIP,PY_KW);
  var PY_MODS=words('math random time datetime json os sys re collections itertools string functools','модуль',1000);
  var PYM={
    math:mem('sqrt floor ceil sin cos tan log log10 pow factorial gcd fabs =pi =e','math'),
    random:mem('randint random choice shuffle uniform sample seed randrange','random'),
    time:mem('sleep time perf_counter','time'),json:mem('dumps loads','json'),
    os:mem('getcwd listdir remove mkdir','os'),sys:mem('exit =argv =version','sys'),
    datetime:mem('datetime date timedelta','datetime')
  };
  var PY_STR=mem('upper lower strip lstrip rstrip split join replace find index startswith endswith format capitalize title isdigit isalpha count center zfill','метод str');
  var PY_LIST=mem('append extend insert remove pop sort reverse index count copy clear','метод list');
  var PY_DICT=mem('keys values items get update pop setdefault clear copy','метод dict');
  var PYM_ANY=uniq(PY_STR.concat(PY_LIST,PY_DICT));
  PYM.str=PY_STR;PYM.list=PY_LIST;PYM.dict=PY_DICT;

  /* ===== JavaScript ===== */
  var JS_SNIP=rows([
    ['function','function ${1:name}(${2}) {\n\t${0}\n}','объявить функцию'],['const','const ${1:name} = ${0};','константа'],
    ['let','let ${1:name} = ${0};','переменная'],['var','var ${1:name} = ${0};','переменная (старый стиль)'],
    ['for','for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${0}\n}','цикл for'],
    ['forof','for (const ${1:item} of ${2:items}) {\n\t${0}\n}','цикл for…of'],
    ['if','if (${1:condition}) {\n\t${0}\n}','условие'],['else','else {\n\t${0}\n}','иначе'],
    ['while','while (${1:condition}) {\n\t${0}\n}','цикл while'],
    ['switch','switch (${1:value}) {\n\tcase ${2:x}:\n\t\t${0}\n\t\tbreak;\n}','выбор по значению'],
    ['class','class ${1:Name} {\n\tconstructor(${2}) {\n\t\t${0}\n\t}\n}','объявить класс'],
    ['try','try {\n\t${1}\n} catch (${2:e}) {\n\t${0}\n}','обработка ошибок'],
    ['async','async function ${1:name}(${2}) {\n\t${0}\n}','асинхронная функция'],
    ['arrow','(${1}) => ${0}','стрелочная функция'],['log','console.log(${1});','вывод в консоль']
  ],'шаблон',960);
  var JS_GLOB=rows([
    ['console',null,'объект консоли'],['document',null,'документ страницы (DOM)'],['window',null,'окно браузера'],
    ['Math',null,'математические функции'],['JSON',null,'работа с JSON'],['Object',null,'методы объектов'],
    ['Array',null,'методы массивов'],['Promise',null,'промисы'],['String',null,'строки'],['Number',null,'числа'],['Date',null,'дата и время'],
    ['setTimeout','setTimeout(() => {\n\t${0}\n}, ${1:1000});','выполнить через время'],
    ['setInterval','setInterval(() => {\n\t${0}\n}, ${1:1000});','повторять по таймеру'],
    ['parseInt','parseInt(${1})','строка в целое число'],['parseFloat','parseFloat(${1})','строка в дробное число'],
    ['isNaN','isNaN(${1})','проверка «не число»'],['alert','alert(${1})','окно с сообщением']
  ],'глобальное',1000);
  var JS_KW=words('return break continue new typeof await import export default throw true false null undefined this delete in of instanceof','ключевое слово',900);
  var JS_ALL=JS_GLOB.concat(JS_SNIP,JS_KW);
  var JSM={
    console:mem('log error warn info table clear','console'),
    Math:mem('floor ceil round random max min abs sqrt pow trunc sign =PI =E','Math'),
    JSON:mem('stringify parse','JSON'),Object:mem('keys values entries assign freeze','Object'),
    Array:mem('isArray from of','Array'),Promise:mem('all race resolve reject','Promise'),
    document:mem('getElementById querySelector querySelectorAll createElement addEventListener =body =title','document'),
    window:mem('alert prompt confirm setTimeout setInterval addEventListener','window')
  };
  var JSM_ANY=uniq(mem('push pop shift unshift map filter reduce forEach find findIndex includes join slice splice sort reverse indexOf concat some every flat =length toUpperCase toLowerCase trim split replace startsWith endsWith substring charAt padStart repeat addEventListener querySelector getAttribute setAttribute =textContent =innerHTML =classList =style =value','метод'));

  /* ===== HTML / CSS ===== */
  var VOID={br:1,hr:1,img:1,input:1,meta:1,link:1};
  var TAGS=('html head body div span p h1 h2 h3 h4 h5 h6 a img ul ol li table tr td th form input button label select option textarea link script style meta title header footer nav section article main aside br hr canvas video audio').split(' ').map(function(t){
    return item(t,VOID[t]?t+' ${1}>':t+'>${1}</'+t+'>','тег',null,1000)});
  var ATTRS=words('class id src href alt style type value placeholder name onclick rel charset content width height target for checked disabled title lang','атрибут',1000).map(function(o){o.snippet=o.caption+'="${1}"';return o});
  var CSS_PROPS=('color background background-color font-size font-family font-weight margin padding border border-radius display flex justify-content align-items flex-direction flex-wrap gap position width height max-width min-height text-align box-shadow transition transform overflow cursor opacity z-index top left right bottom line-height letter-spacing text-decoration grid-template-columns').split(' ').map(function(p){return item(p,p+': ${1};','свойство CSS',null,1000)});
  var CSS_VALS=words('block inline-block inline flex grid none auto center left right bold normal solid dashed relative absolute fixed sticky inherit transparent pointer hidden visible nowrap space-between column row 100% 0','значение',800);

  function fileKind(){
    var e=extOf(curFile().name);
    return e==='py'?'py':e==='js'?'js':e==='css'?'css':(e==='html'||e==='htm')?'html':'txt';
  }
  function odd(s,ch){return (s.split(ch).length-1)%2===1}

  var smart={
    triggerCharacters:['.','<'],
    getCompletions:function(ed,sess,pos,prefix,cb){
      var kind=fileKind(),line=sess.getLine(pos.row),before=line.slice(0,pos.column-prefix.length),m,out=[];
      if(kind==='py'){
        if(/^\s*#/.test(line)||odd(before,'"')||odd(before,"'"))out=[];
        else if((m=/([A-Za-z_]\w*)\.$/.exec(before)))out=PYM[m[1]]||PYM_ANY;
        else if(/[\)\]"']\.$/.test(before))out=PYM_ANY;
        else if(/^\s*(import|from)\s+$/.test(before))out=PY_MODS;
        else out=PY_ALL;
      }else if(kind==='js'){
        if(/^\s*\/\//.test(line)||odd(before,'"')||odd(before,"'")||odd(before,'`'))out=[];
        else if((m=/([A-Za-z_$][\w$]*)\.$/.exec(before)))out=JSM[m[1]]||JSM_ANY;
        else if(/[\)\]"']\.$/.test(before))out=JSM_ANY;
        else out=JS_ALL;
      }else if(kind==='html'){
        var lt_=before.lastIndexOf('<'),gt=before.lastIndexOf('>');
        if(/<$/.test(before))out=TAGS;
        else if(lt_>gt&&/\s/.test(before.slice(lt_)))out=ATTRS;
      }else if(kind==='css'){
        out=/:[^;{}]*$/.test(before)?CSS_VALS:CSS_PROPS;
      }
      cb(null,out);
    }
  };
  /* для CSS в слово входит дефис (font-size) */
  Object.defineProperty(smart,'identifierRegexps',{get:function(){return [fileKind()==='css'?/[\w\-]/:/[\w$]/]}});

  aceEd.completers=[smart,lt.textCompleter];
  aceEd.setOptions({enableBasicAutocompletion:true,enableLiveAutocompletion:true,liveAutocompletionDelay:60,liveAutocompletionThreshold:1});

  /* Tab принимает выбранную (первую) подсказку; Enter просто переносит строку и не подставляет подсказку */
  try{
    var AC=ace.require('ace/autocomplete').Autocomplete;
    if(AC&&AC.prototype.commands)AC.prototype.commands['Return']=function(ed){ed.completer.detach();ed.insert('\n')};
  }catch(e){}
})();

