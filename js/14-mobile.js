/* ---------- панель символов для телефона: Tab, отмена, стрелки и знаки, которых нет на экранной клавиатуре ---------- */
(function(){
  var box=$('keys');
  if(!box||typeof aceEd==='undefined')return;

  var KEYS=[
    ['⇥','tab','Tab — отступ или принять подсказку',1],['↶','undo','Отменить'],['↷','redo','Вернуть'],
    ['←','left','Курсор влево'],['→','right','Курсор вправо'],
    '(',')','[',']','{','}','"',"'",':','=','.',',','_','#','/','\\','<','>',';','!','&','|','+','-','*','%','$','@'
  ];

  function act(k){
    aceEd.focus();                                           /* клавиатура остаётся открытой */
    if(k==='tab'){
      var c=aceEd.completer;
      if(c&&c.activated)c.insertMatch();                     /* если открыты подсказки — принять выбранную */
      else aceEd.execCommand('indent');
    }
    else if(k==='undo')aceEd.undo();
    else if(k==='redo')aceEd.redo();
    else if(k==='left')aceEd.navigateLeft(1);
    else if(k==='right')aceEd.navigateRight(1);
    else aceEd.insert(k);
  }

  KEYS.forEach(function(d){
    var key=typeof d==='string'?d:d[1],label=typeof d==='string'?d:d[0];
    var b=document.createElement('button');
    b.type='button';b.textContent=label;
    if(typeof d!=='string'){b.title=d[2]||'';if(d[3])b.className='wide'}
    b.setAttribute('aria-label',(typeof d!=='string'&&d[2])||('Вставить '+label));
    b.addEventListener('mousedown',function(e){e.preventDefault()});   /* не отбирать фокус у редактора */
    b.addEventListener('click',function(){act(key)});
    box.appendChild(b);
  });
})();
