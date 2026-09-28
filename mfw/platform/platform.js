(function(){
  var frame=document.getElementById('eventFrame');
  var note=document.getElementById('eventNote');
  var buttons=[].slice.call(document.querySelectorAll('[data-event]'));
  function openEvent(event){
    var mfw=event==='mfw';
    document.body.classList.toggle('bfs-mode',!mfw);
    buttons.forEach(function(b){b.classList.toggle('active',b.dataset.event===event);});
    frame.src=mfw?'../index.html':'./bfs/index.html';
    note.textContent=mfw?'MFW · ORIGINAL EXPERIENCE':'BFS · OFFICIAL-BRAND EXPERIENCE';
    try{localStorage.setItem('mfp.activeEvent',event);}catch(e){}
  }
  buttons.forEach(function(b){b.addEventListener('click',function(){openEvent(b.dataset.event);});});
  var saved='mfw';try{saved=localStorage.getItem('mfp.activeEvent')||'mfw';}catch(e){}
  openEvent(saved==='bfs'?'bfs':'mfw');
})();