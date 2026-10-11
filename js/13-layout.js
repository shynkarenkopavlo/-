/* ---------- перетаскиваемые разделители: панель файлов | редактор | терминал ---------- */
(function(){
  var LKEY='uniide:layout:v1',body=document.querySelector('.body');
  var aside=document.querySelector('aside'),edPane=$('paneEd'),outPane=$('paneOut'),gv=$('gv'),gs=$('gs');
  if(!body||!aside||!edPane||!outPane||!gv||!gs)return;

  var st={sbw:200,ed:1000,out:1000};            /* ширина панели файлов (px) и доли редактора/терминала */
  try{
    var s=JSON.parse(localStorage.getItem(LKEY)||'null');
    if(s&&s.v===1&&s.sbw>=120&&s.ed>0&&s.out>0){st.sbw=s.sbw;st.ed=s.ed;st.out=s.out}
  }catch(e){}

  function apply(){
    body.style.setProperty('--sbw',st.sbw+'px');
    body.style.setProperty('--ed',st.ed+'fr');
    body.style.setProperty('--out',st.out+'fr');
  }
  function save(){try{localStorage.setItem(LKEY,JSON.stringify({v:1,sbw:st.sbw,ed:st.ed,out:st.out}))}catch(e){}}
  function stacked(){return window.matchMedia('(max-width:900px)').matches}
  var raf=0;
  function relayout(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;try{aceEd.resize()}catch(e){}})}

  function setup(g,begin,move){
    g.addEventListener('pointerdown',function(e){
      if(e.button!==undefined&&e.button!==0)return;
      e.preventDefault();
      var ctx=begin(e);
      try{g.setPointerCapture(e.pointerId)}catch(x){}
      g.classList.add('on');document.body.classList.add('dragging');
      function mv(ev){move(ctx,ev);apply();relayout()}
      function up(ev){
        g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up);
        try{g.releasePointerCapture(ev.pointerId)}catch(x){}
        g.classList.remove('on');document.body.classList.remove('dragging');
        save();relayout();
      }
      g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);
    });
  }

  /* редактор | терминал (на узком экране — верх | низ) */
  setup(gv,function(e){
    var a=edPane.getBoundingClientRect(),b=outPane.getBoundingClientRect(),v=stacked();
    return {v:v,start:v?e.clientY:e.clientX,a:v?a.height:a.width,total:v?a.height+b.height:a.width+b.width};
  },function(c,e){
    var pos=c.v?e.clientY:e.clientX,min=Math.min(200,c.total/3);
    var a=Math.max(min,Math.min(c.total-min,c.a+pos-c.start));
    st.ed=Math.round(a/c.total*1000);st.out=1000-st.ed;
  });
  /* панель файлов | редактор */
  setup(gs,function(e){return {start:e.clientX,w:aside.getBoundingClientRect().width}},function(c,e){
    st.sbw=Math.max(150,Math.min(380,Math.round(c.w+e.clientX-c.start)));
  });

  /* двойной щелчок по разделителю — вернуть размеры по умолчанию */
  gv.addEventListener('dblclick',function(){st.ed=1000;st.out=1000;apply();save();relayout()});
  gs.addEventListener('dblclick',function(){st.sbw=200;apply();save();relayout()});

  apply();
})();
