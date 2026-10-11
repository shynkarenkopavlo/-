/* ---------- HTML: мгновенное закрытие тега по «</» ---------- */
var HTML_VOID={area:1,base:1,br:1,col:1,embed:1,hr:1,img:1,input:1,link:1,meta:1,param:1,source:1,track:1,wbr:1};

/* список открытых (ещё не закрытых) тегов в тексте; последний — самый внутренний */
function htmlOpenStack(text){
  var re=/<!--[\s\S]*?-->|<(\/?)([A-Za-z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g,m,st=[],lower=text.toLowerCase();
  while((m=re.exec(text))){
    if(!m[2])continue;                       /* комментарий */
    var name=m[2],low=name.toLowerCase();
    if(m[1]){                                /* закрывающий тег: убираем его и всё, что было открыто внутри */
      for(var i=st.length-1;i>=0;i--)if(st[i].toLowerCase()===low){st.length=i;break}
    }else{
      if(HTML_VOID[low]||/\/\s*$/.test(m[3]))continue;
      st.push(name);
      if(low==='script'||low==='style'){     /* содержимое script/style не разбираем как HTML */
        var end=lower.indexOf('</'+low,re.lastIndex);
        if(end<0)return st;                  /* курсор внутри script/style */
        re.lastIndex=end;
      }
    }
  }
  return st;
}
/* где находится курсор: 'html', 'style' или 'script' */
function htmlContext(text){
  var st=htmlOpenStack(text),t=st.length?st[st.length-1].toLowerCase():'';
  return (t==='script'||t==='style')?t:'html';
}

/* набрали «</» — сразу дописываем имя ближайшего открытого тега и «>» */
(function(){
  if(typeof aceEd==='undefined')return;
  aceEd.commands.on('afterExec',function(e){
    if(!e.command||e.command.name!=='insertstring'||e.args!=='/')return;
    var ext=extOf(curFile().name);
    if(ext!=='html'&&ext!=='htm')return;
    var s=aceEd.session,pos=aceEd.getCursorPosition(),line=s.getLine(pos.row);
    if(line.slice(pos.column-2,pos.column)!=='</')return;
    var text=s.getTextRange({start:{row:0,column:0},end:{row:pos.row,column:pos.column-2}});
    var st=htmlOpenStack(text);
    if(!st.length)return;
    var tag=st[st.length-1];
    var rest=line.slice(pos.column).toLowerCase(),low=tag.toLowerCase();
    if(rest.indexOf('</'+low+'>')===0){                       /* закрывающий тег уже стоит сразу за курсором — не дублируем */
      s.remove({start:{row:pos.row,column:pos.column-2},end:pos});
      return;
    }
    if(rest.indexOf(low+'>')===0)return;
    aceEd.insert(tag+'>');
  });
})();
