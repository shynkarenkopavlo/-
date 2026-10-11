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

  /* ===== HTML ===== */
  var VOID={area:1,base:1,br:1,col:1,embed:1,hr:1,img:1,input:1,link:1,meta:1,param:1,source:1,track:1,wbr:1};
  var TAG_ROWS=[
    ['html','корневой элемент страницы'],['head','служебная часть страницы'],['body','видимая часть страницы'],['title','заголовок вкладки браузера'],
    ['meta','метаданные страницы'],['link','подключение внешнего файла (CSS, иконка)'],['style','стили CSS'],['script','скрипт JavaScript'],['base','базовый адрес ссылок'],
    ['header','шапка страницы или раздела'],['footer','подвал'],['nav','блок навигации'],['main','основное содержимое'],['section','раздел'],['article','самостоятельная статья'],['aside','боковой блок'],
    ['div','блок'],['span','строчный контейнер'],['p','абзац'],['h1','заголовок 1 уровня'],['h2','заголовок 2 уровня'],['h3','заголовок 3 уровня'],['h4','заголовок 4 уровня'],['h5','заголовок 5 уровня'],['h6','заголовок 6 уровня'],
    ['a','ссылка'],['img','изображение'],['ul','маркированный список'],['ol','нумерованный список'],['li','элемент списка'],['dl','список определений'],['dt','термин'],['dd','описание термина'],
    ['table','таблица'],['thead','шапка таблицы'],['tbody','тело таблицы'],['tfoot','подвал таблицы'],['tr','строка таблицы'],['td','ячейка таблицы'],['th','ячейка-заголовок'],['caption','подпись таблицы'],['colgroup','группа столбцов'],['col','столбец'],
    ['form','форма'],['input','поле ввода'],['button','кнопка'],['label','подпись к полю'],['select','выпадающий список'],['option','пункт списка'],['optgroup','группа пунктов'],['textarea','многострочное поле'],['fieldset','группа полей'],['legend','заголовок группы полей'],['datalist','варианты для поля'],['output','результат вычисления'],['progress','индикатор прогресса'],['meter','шкала значения'],
    ['br','перенос строки'],['hr','горизонтальная линия'],['strong','важный текст'],['em','выделение курсивом'],['b','жирный текст'],['i','курсив'],['u','подчёркнутый текст'],['s','зачёркнутый текст'],['small','мелкий текст'],['mark','текст-маркер'],['code','фрагмент кода'],['pre','текст с сохранением пробелов'],['kbd','клавиша'],['samp','пример вывода'],['var','переменная'],['sub','нижний индекс'],['sup','верхний индекс'],['blockquote','длинная цитата'],['q','короткая цитата'],['abbr','аббревиатура'],['cite','источник'],['time','дата и время'],['del','удалённый текст'],['ins','добавленный текст'],['wbr','возможный перенос слова'],
    ['canvas','холст для рисования'],['video','видео'],['audio','аудио'],['source','источник медиа'],['track','субтитры'],['picture','адаптивное изображение'],['iframe','встроенная страница'],['embed','встроенный объект'],['object','внешний объект'],['param','параметр объекта'],['map','карта-изображение'],['area','область карты'],['svg','векторная графика'],
    ['figure','иллюстрация'],['figcaption','подпись к иллюстрации'],['details','раскрывающийся блок'],['summary','заголовок раскрывающегося блока'],['dialog','диалоговое окно'],['template','шаблон'],['noscript','содержимое без JavaScript']
  ];
  var TAG_SNIP={
    a:'a href="${1}">${2}</a>',img:'img src="${1}" alt="${2}">',input:'input type="${1:text}" name="${2}">',
    link:'link rel="stylesheet" href="${1:style.css}">',script:'script src="${1:script.js}"><\/script>',meta:'meta name="${1}" content="${2}">',
    button:'button type="${1:button}">${2}</button>',form:'form action="${1}" method="${2:post}">\n\t${0}\n</form>',
    ul:'ul>\n\t<li>${0}</li>\n</ul>',ol:'ol>\n\t<li>${0}</li>\n</ol>',table:'table>\n\t<tr>\n\t\t<td>${0}</td>\n\t</tr>\n</table>',
    label:'label for="${1}">${2}</label>',select:'select name="${1}">\n\t<option value="${2}">${0}</option>\n</select>',video:'video src="${1}" controls>${0}</video>'
  };
  function tagItems(withLt,score){
    return TAG_ROWS.map(function(r){
      var t=r[0],s=TAG_SNIP[t]||(VOID[t]?(' br hr wbr '.indexOf(' '+t+' ')>-1?t+'>':t+' ${1}>'):t+'>${1}</'+t+'>');
      return item(t,(withLt?'':'<')+s,'тег',r[1],score||1000);
    });
  }
  var TAGS=tagItems(true),TAGS_BARE=tagItems(false,900);
  var HTML5=item('html5','<!DOCTYPE html>\n<html lang="ru">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Документ}</title>\n</head>\n<body>\n\t${0}\n</body>\n</html>','шаблон','Каркас HTML-страницы',1100);
  var HCOMMENT=item('comment','<!-- ${0} -->','шаблон','Комментарий',950);

  var BOOL={checked:1,disabled:1,required:1,selected:1,hidden:1,controls:1,autoplay:1,loop:1,muted:1,multiple:1,readonly:1,defer:1,async:1,autofocus:1,open:1,reversed:1,allowfullscreen:1};
  var GLOBAL_ATTRS='class id style title lang hidden tabindex contenteditable draggable spellcheck data- onclick onchange oninput onsubmit onload onkeydown onkeyup onmouseover onmouseout onfocus onblur'.split(' ');
  var TAG_ATTRS={
    a:'href target rel download',img:'src alt width height loading',
    input:'type name value placeholder required disabled checked min max step maxlength readonly autocomplete autofocus',
    button:'type name value disabled',form:'action method enctype autocomplete',label:'for',select:'name multiple required disabled',
    option:'value selected disabled',textarea:'name rows cols placeholder required readonly maxlength',meta:'charset name content',
    link:'rel href type media',script:'src type defer async',style:'media',iframe:'src width height allowfullscreen loading',
    video:'src controls autoplay loop muted poster width height',audio:'src controls autoplay loop muted',source:'src type',
    td:'colspan rowspan',th:'colspan rowspan scope',table:'border',ol:'start type reversed',canvas:'width height',svg:'width height viewBox xmlns',
    fieldset:'disabled',details:'open',progress:'value max',meter:'value min max'
  };
  function attrItems(tag,tagText){
    var have={};
    tagText.replace(/"[^"]*"|'[^']*'/g,'""').replace(/^<[\w:-]+/,'').replace(/\s([a-zA-Z_:][\w:.-]*)/g,function(a,n){have[n.toLowerCase()]=1;return a});
    var own=(TAG_ATTRS[tag]||'').split(' ').filter(Boolean),res=[];
    function add(n,sc){
      if(have[n])return;
      var o=item(n,BOOL[n]?null:(n==='data-'?'data-${1}="${2}"':n+'="${1}"'),'атрибут',null,sc);
      res.push(o);
    }
    own.forEach(function(n){add(n,1000)});
    GLOBAL_ATTRS.forEach(function(n){if(own.indexOf(n)<0)add(n,900)});
    return res;
  }
  var INPUT_TYPES='text password email number checkbox radio submit button file date time range color search tel url hidden reset image'.split(' ');
  var ATTR_VALS={
    target:'_blank _self _parent _top',rel:'stylesheet icon noopener noreferrer nofollow preload',method:'get post',
    loading:'lazy eager',lang:'ru en uk de fr',charset:'UTF-8',autocomplete:'on off',enctype:'multipart/form-data application/x-www-form-urlencoded',
    scope:'row col',contenteditable:'true false',draggable:'true false',spellcheck:'true false'
  };
  function attrValues(tag,attr){
    var v;
    if(attr==='type'){
      v=tag==='input'?INPUT_TYPES:tag==='button'?['button','submit','reset']:tag==='script'?['module','text/javascript']:tag==='link'?['text/css']:[];
    }else if(attr==='name'&&tag==='meta'){v='viewport description keywords author theme-color'.split(' ')}
    else v=(ATTR_VALS[attr]||'').split(' ').filter(Boolean);
    return v.map(function(x){return item(x,null,'значение',null,1000)});
  }
  function closeItems(all){
    var st=(typeof htmlOpenStack==='function')?htmlOpenStack(all):[],seen={},res=[];
    for(var i=st.length-1;i>=0;i--){
      if(seen[st[i]])continue;seen[st[i]]=1;
      var o=item(st[i],null,'закрыть тег','Закрывает открытый тег <'+st[i]+'>',1200-i);o.value=st[i]+'>';res.push(o);
    }
    return res;
  }

  /* ===== CSS ===== */
  var CSS_PROPS=('color background background-color background-image background-size background-position background-repeat font-size font-family font-weight font-style margin margin-top margin-right margin-bottom margin-left padding padding-top padding-right padding-bottom padding-left border border-top border-bottom border-left border-right border-color border-width border-style border-radius outline display flex flex-direction flex-wrap flex-grow flex-shrink justify-content align-items align-self align-content gap row-gap column-gap position top left right bottom z-index width height min-width min-height max-width max-height text-align text-decoration text-transform text-shadow line-height letter-spacing white-space word-break overflow overflow-x overflow-y cursor opacity visibility box-shadow box-sizing transition transform animation float clear object-fit grid grid-template-columns grid-template-rows grid-column grid-row user-select pointer-events list-style content filter backdrop-filter').split(' ').map(function(p){return item(p,p+': ${1};','свойство CSS',null,1000)});
  var CSS_VALS=words('block inline-block inline flex grid none auto center left right bold normal solid dashed relative absolute fixed sticky inherit transparent pointer hidden visible nowrap space-between column row 100% 0 red blue green white black gray orange yellow purple pink currentColor','значение',800);
  var CSS_BY={
    display:'block inline inline-block flex inline-flex grid none',position:'static relative absolute fixed sticky',
    'flex-direction':'row column row-reverse column-reverse','flex-wrap':'nowrap wrap wrap-reverse',
    'justify-content':'flex-start flex-end center space-between space-around space-evenly','align-items':'stretch flex-start flex-end center baseline',
    'text-align':'left right center justify','font-weight':'normal bold 100 200 300 400 500 600 700 800 900','font-style':'normal italic',
    overflow:'visible hidden scroll auto','overflow-x':'visible hidden scroll auto','overflow-y':'visible hidden scroll auto',
    cursor:'pointer default text move not-allowed grab','text-decoration':'none underline line-through','text-transform':'none uppercase lowercase capitalize',
    'border-style':'none solid dashed dotted double','box-sizing':'border-box content-box','background-repeat':'no-repeat repeat repeat-x repeat-y',
    'white-space':'normal nowrap pre pre-wrap',visibility:'visible hidden',float:'none left right','user-select':'none auto text',
    'object-fit':'cover contain fill none','pointer-events':'auto none'
  };
  function cssList(all){
    var open=all.lastIndexOf('{'),close=all.lastIndexOf('}');
    if(open<=close)return TAG_ROWS.map(function(r){return item(r[0],null,'селектор',null,900)});   /* вне блока { } — имена тегов-селекторов */
    var seg=all.slice(Math.max(open,all.lastIndexOf(';'))+1),m=/^\s*([\w-]+)\s*:/.exec(seg);
    if(m){var v=CSS_BY[m[1]];return v?words(v,'значение',1000).concat(CSS_VALS):CSS_VALS}
    return CSS_PROPS;
  }

  function fileKind(){
    var e=extOf(curFile().name);
    return e==='py'?'py':e==='js'?'js':e==='css'?'css':(e==='html'||e==='htm')?'html':'txt';
  }
  function odd(s,ch){return (s.split(ch).length-1)%2===1}
  function allText(sess,pos,prefix){return sess.getTextRange({start:{row:0,column:0},end:{row:pos.row,column:pos.column-prefix.length}})}

  function jsList(before,line){
    var m;
    if(/^\s*\/\//.test(line)||odd(before,'"')||odd(before,"'")||odd(before,'`'))return [];
    if((m=/([A-Za-z_$][\w$]*)\.$/.exec(before)))return JSM[m[1]]||JSM_ANY;
    if(/[\)\]"']\.$/.test(before))return JSM_ANY;
    return JS_ALL;
  }
  function htmlList(sess,pos,prefix,before){
    var all=allText(sess,pos,prefix),ctx=(typeof htmlContext==='function')?htmlContext(all):'html';
    if(ctx==='style')return cssList(all);
    if(ctx==='script')return jsList(before,sess.getLine(pos.row));
    var lt_=before.lastIndexOf('<'),gt=before.lastIndexOf('>');
    if(/<\/$/.test(before))return closeItems(all);
    if(/<$/.test(before))return TAGS;
    if(lt_>gt){
      var tagText=before.slice(lt_),tm=/^<([\w:-]+)/.exec(tagText),tag=tm?tm[1].toLowerCase():'';
      var vm=/([\w:-]+)\s*=\s*(["'])[^"']*$/.exec(tagText);
      if(vm)return attrValues(tag,vm[1].toLowerCase());
      if(/\s/.test(tagText))return attrItems(tag,tagText);
      return [];
    }
    if(prefix.length>=2)return [HTML5,HCOMMENT].concat(TAGS_BARE);
    return [];
  }

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
        out=jsList(before,line);
      }else if(kind==='html'){
        out=htmlList(sess,pos,prefix,before);
      }else if(kind==='css'){
        out=cssList(allText(sess,pos,prefix));
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

