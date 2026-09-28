(function(){
  var frame=document.getElementById('eventFrame');
  var note=document.getElementById('eventNote');
  var buttons=[].slice.call(document.querySelectorAll('[data-event]'));
  var accountDrawer=document.getElementById('accountDrawer');
  var registrationModal=document.getElementById('registrationModal');
  var profileForm=document.getElementById('profileForm');
  var registrationForm=document.getElementById('registrationForm');
  var registrationGrid=document.getElementById('registrationGrid');
  var currentRegistrationEvent=null;

  var DEFAULT_PROFILE={firstName:'Alex',lastName:'Morgan',email:'alex@example.com',phone:'+7 900 000-00-00',company:'Fashion Industry',title:'Guest',country:'Russia'};
  var EVENT_CONFIG={
    mfw:{name:'Moscow Fashion Week',short:'MFW',types:['visitor','buyer','designer','media','speaker','partner']},
    bfs:{name:'BRICS+ Fashion Summit',short:'BFS',types:['visitor','delegate','speaker','media','partner']}
  };

  function loadState(){
    var state={profile:DEFAULT_PROFILE,registrations:{mfw:null,bfs:null}};
    try{
      var saved=JSON.parse(localStorage.getItem('mfp.account.v1')||'null');
      if(saved){state.profile=Object.assign({},DEFAULT_PROFILE,saved.profile||{});state.registrations=Object.assign({mfw:null,bfs:null},saved.registrations||{});}
    }catch(e){}
    return state;
  }
  var accountState=loadState();
  function saveState(){
    try{localStorage.setItem('mfp.account.v1',JSON.stringify(accountState));}catch(e){}
    notifyFrame();
  }
  function notifyFrame(){
    try{frame.contentWindow.postMessage({type:'mfp-account-state',payload:accountState},'*');}catch(e){}
  }
  function openEvent(event){
    var mfw=event==='mfw';
    document.body.classList.toggle('bfs-mode',!mfw);
    buttons.forEach(function(b){b.classList.toggle('active',b.dataset.event===event);});
    frame.src=mfw?'../index.html':'./bfs/index.html';
    note.textContent=mfw?'MFW · ORIGINAL EXPERIENCE':'BFS · OFFICIAL-BRAND EXPERIENCE';
    try{localStorage.setItem('mfp.activeEvent',event);}catch(e){}
  }
  function fillProfile(){
    Object.keys(accountState.profile).forEach(function(key){
      if(profileForm.elements[key]) profileForm.elements[key].value=accountState.profile[key]||'';
    });
  }
  function statusLabel(reg){
    if(!reg)return 'НЕ ЗАРЕГИСТРИРОВАН';
    return ({submitted:'ОТПРАВЛЕНО',approved:'ОДОБРЕНО',draft:'ЧЕРНОВИК'})[reg.status]||reg.status.toUpperCase();
  }
  function renderRegistrations(){
    registrationGrid.innerHTML=['mfw','bfs'].map(function(code){
      var cfg=EVENT_CONFIG[code],reg=accountState.registrations[code];
      var other=code==='mfw'?'bfs':'mfw';
      var otherReg=accountState.registrations[other];
      return '<section class="registration-item"><div class="registration-item-head"><h3>'+cfg.name+'</h3><span class="reg-status">'+statusLabel(reg)+'</span></div>'+
      '<div class="reg-actions"><button data-register="'+code+'">'+(reg?'ПРОВЕРИТЬ / ИЗМЕНИТЬ':'ЗАРЕГИСТРИРОВАТЬСЯ')+'</button>'+
      (otherReg&&!reg?'<button class="secondary" data-copy="'+code+'">СКОПИРОВАТЬ ДАННЫЕ ИЗ '+EVENT_CONFIG[other].short+'</button>':'')+
      '</div></section>';
    }).join('');
    [].slice.call(registrationGrid.querySelectorAll('[data-register]')).forEach(function(b){b.onclick=function(){openRegistration(b.dataset.register,false);};});
    [].slice.call(registrationGrid.querySelectorAll('[data-copy]')).forEach(function(b){b.onclick=function(){openRegistration(b.dataset.copy,true);};});
  }
  function openAccount(){
    fillProfile();renderRegistrations();accountDrawer.classList.remove('hidden');accountDrawer.setAttribute('aria-hidden','false');
  }
  function closeAccount(){accountDrawer.classList.add('hidden');accountDrawer.setAttribute('aria-hidden','true');}
  function openRegistration(code,copied){
    currentRegistrationEvent=code;
    var cfg=EVENT_CONFIG[code],existing=accountState.registrations[code];
    document.getElementById('registrationKicker').textContent=cfg.short+' · SEPARATE EVENT REGISTRATION';
    document.getElementById('registrationTitle').textContent=cfg.name;
    document.getElementById('confirmLabel').textContent='Подтверждаю отдельную регистрацию именно на '+cfg.name;
    var select=document.getElementById('registrationType');
    select.innerHTML=cfg.types.map(function(x){return '<option value="'+x+'">'+x.toUpperCase()+'</option>';}).join('');
    registrationForm.elements.company.value=(existing&&existing.company)||accountState.profile.company||'';
    registrationForm.elements.title.value=(existing&&existing.title)||accountState.profile.title||'';
    registrationForm.elements.purpose.value=(existing&&existing.purpose)||'';
    registrationForm.elements.registrationType.value=(existing&&existing.registrationType)||cfg.types[0];
    registrationForm.elements.confirm.checked=false;
    if(copied){
      registrationForm.elements.company.value=accountState.profile.company||'';
      registrationForm.elements.title.value=accountState.profile.title||'';
    }
    registrationModal.classList.remove('hidden');registrationModal.setAttribute('aria-hidden','false');
  }
  function closeRegistration(){registrationModal.classList.add('hidden');registrationModal.setAttribute('aria-hidden','true');currentRegistrationEvent=null;}
  profileForm.onsubmit=function(e){
    e.preventDefault();
    var fd=new FormData(profileForm);
    accountState.profile=Object.assign({},accountState.profile,Object.fromEntries(fd.entries()));
    saveState();renderRegistrations();
  };
  registrationForm.onsubmit=function(e){
    e.preventDefault();if(!currentRegistrationEvent)return;
    var fd=new FormData(registrationForm);
    accountState.registrations[currentRegistrationEvent]={
      eventCode:currentRegistrationEvent,
      registrationType:fd.get('registrationType'),
      company:fd.get('company'),
      title:fd.get('title'),
      purpose:fd.get('purpose'),
      status:'submitted',
      confirmedAt:new Date().toISOString()
    };
    saveState();closeRegistration();renderRegistrations();
  };
  document.getElementById('accountBtn').onclick=openAccount;
  document.getElementById('accountClose').onclick=closeAccount;
  document.getElementById('registrationClose').onclick=closeRegistration;
  accountDrawer.addEventListener('click',function(e){if(e.target===accountDrawer)closeAccount();});
  registrationModal.addEventListener('click',function(e){if(e.target===registrationModal)closeRegistration();});
  buttons.forEach(function(b){b.addEventListener('click',function(){openEvent(b.dataset.event);});});
  window.addEventListener('message',function(e){
    if(!e.data||typeof e.data!=='object')return;
    if(e.data.type==='mfp-open-account')openAccount();
    if(e.data.type==='mfp-open-registration')openRegistration(e.data.eventCode||'bfs',false);
    if(e.data.type==='mfp-request-account-state')notifyFrame();
  });
  frame.addEventListener('load',notifyFrame);
  var saved='mfw';try{saved=localStorage.getItem('mfp.activeEvent')||'mfw';}catch(e){}
  openEvent(saved==='bfs'?'bfs':'mfw');
})();