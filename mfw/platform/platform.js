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
  var investorModal=document.getElementById('investorModal');
  var valueModal=document.getElementById('valueModal');
  var forYouModal=document.getElementById('forYouModal');
  var hubModal=document.getElementById('hubModal');
  var hubContent=document.getElementById('hubContent');
  var hubTab='directory';

  var DEFAULT_PROFILE={firstName:'Alex',lastName:'Morgan',email:'alex@example.com',phone:'+7 900 000-00-00',company:'Fashion Industry',title:'Guest',country:'Russia'};
  var EVENT_CONFIG={
    mfw:{
      name:'Moscow Fashion Week',short:'MFW',
      roles:[
        {id:'visitor',label:'Гость / посетитель',mode:'public',note:'Маркет, шоурум, лекторий и открытые форматы — по отдельной регистрации там, где она требуется.'},
        {id:'buyer',label:'Байер',mode:'accreditation',note:'Профессиональная аккредитация байера.'},
        {id:'stylist',label:'Стилист',mode:'accreditation',note:'Профессиональная аккредитация стилиста.'},
        {id:'media',label:'СМИ',mode:'accreditation',note:'Медиа-аккредитация.'},
        {id:'blogger',label:'Блогер / инфлюенсер',mode:'accreditation',note:'Медиа-аккредитация.'},
        {id:'photo_video',label:'Фото / видео',mode:'accreditation',note:'Фото/видео-аккредитация с правилами доступа в залы.'},
        {id:'volunteer',label:'Волонтёр',mode:'application',note:'Отдельная заявка волонтёра.'},
        {id:'designer_brand',label:'Дизайнер / бренд-участник',mode:'selection',note:'Участие через конкурсный или внеконкурсный отбор организатора.'},
        {id:'speaker',label:'Спикер / эксперт',mode:'managed',note:'Роль назначается или подтверждается организатором.'},
        {id:'partner',label:'Партнёр',mode:'managed',note:'Партнёрский контур оформляется организатором.'}
      ]
    },
    bfs:{
      name:'BRICS+ Fashion Summit',short:'BFS',
      roles:[
        {id:'visitor',label:'Посетитель деловой программы',mode:'public',note:'Публичная регистрация; после неё доступны личный кабинет, выбор сессий и QR.'},
        {id:'media',label:'СМИ',mode:'accreditation',note:'Медиа-аккредитация.'},
        {id:'blogger',label:'Блогер',mode:'accreditation',note:'Медиа-аккредитация.'},
        {id:'photo_video',label:'Фото / видео',mode:'accreditation',note:'Фото/видео-аккредитация.'},
        {id:'volunteer',label:'Волонтёр',mode:'application',note:'Отдельная заявка волонтёра.'},
        {id:'delegate',label:'Делегат',mode:'managed',note:'Профессиональная роль подтверждается организатором / делегацией.'},
        {id:'speaker',label:'Спикер',mode:'managed',note:'Спикерский статус подтверждается организатором, не является публичной self-registration.'},
        {id:'participant',label:'Участник / представитель организации',mode:'managed',note:'Участие в профессиональном контуре подтверждается организатором.'},
        {id:'partner',label:'Партнёр',mode:'managed',note:'Партнёрская роль подтверждается организатором.'}
      ]
    }
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
  function safeJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;}}
  function getInterestState(){
    return {
      mfwFollowed:safeJson('mfwSavedBrands',[]),
      mfwFavorites:safeJson('mfwFavoriteBrands',[]),
      mfwEvents:safeJson('mfwMyEvents',[]),
      bfsFollowed:safeJson('bfsFollowedProjects',{}),
      bfsFavorites:safeJson('bfsFavoriteProjects',{}),
      bfsSaved:safeJson('bfsSavedSessions',{})
    };
  }
  function renderForYou(){
    var data=window.MFP_DATA||{mfw:{brands:[],events:[]},bfs:{sessions:[],speakers:[]}};
    var interests=getInterestState();
    var recs=[];
    data.mfw.brands.forEach(function(b){
      if(interests.mfwFavorites.indexOf(b.id)>=0||interests.mfwFollowed.indexOf(b.id)>=0){
        var show=data.mfw.events.filter(function(e){return e.id===b.showId;})[0];
        recs.push({type:'MFW · BRAND',title:b.name,body:(show?show.date+' · '+show.time+' · '+show.venue:'Следите за обновлениями бренда'),path:'Favorite / Follow → Show → Reminder → Replay → Reward',event:'mfw'});
      }
    });
    Object.keys(interests.bfsSaved||{}).filter(function(k){return interests.bfsSaved[k];}).forEach(function(id){
      var s=data.bfs.sessions.filter(function(x){return x.id===id;})[0];
      if(s)recs.push({type:'BFS · SESSION',title:s.title,body:s.date+' · '+s.time+' · '+s.hall,path:'Saved session → Speaker → Follow → Meeting → Lead',event:'bfs'});
    });
    if(!recs.length){
      recs.push({type:'MFW · START HERE',title:'Добавьте любимый бренд',body:'Откройте MFW → Бренды → выберите Follow или ♥ Favorite.',path:'Brand → Show → LIVE / Replay → Reward',event:'mfw'});
      recs.push({type:'BFS · START HERE',title:'Сохраните интересную сессию',body:'Откройте BFS → Программа → добавьте сессию.',path:'Session → Speaker → Meeting → Lead',event:'bfs'});
    }
    document.getElementById('forYouGrid').innerHTML=recs.slice(0,6).map(function(r){
      return '<article class="rec-card"><div class="rec-type">'+r.type+'</div><h3>'+r.title+'</h3><p>'+r.body+'</p><div class="rec-path">'+r.path+'</div><div class="rec-actions"><button data-rec-event="'+r.event+'">ОТКРЫТЬ '+r.event.toUpperCase()+'</button></div></article>';
    }).join('');
    [].slice.call(document.querySelectorAll('[data-rec-event]')).forEach(function(b){b.onclick=function(){forYouModal.classList.add('hidden');openEvent(b.dataset.recEvent);};});
    var counts={
      registered:(accountState.registrations.mfw?1:0)+(accountState.registrations.bfs?1:0),
      saved:(interests.mfwEvents||[]).length+Object.keys(interests.bfsSaved||{}).filter(function(k){return interests.bfsSaved[k];}).length,
      followed:(interests.mfwFollowed||[]).length+Object.keys(interests.bfsFollowed||{}).filter(function(k){return interests.bfsFollowed[k];}).length,
      favorite:(interests.mfwFavorites||[]).length+Object.keys(interests.bfsFavorites||{}).filter(function(k){return interests.bfsFavorites[k];}).length,
      reward:0,
      meeting:localStorage.getItem('bfsMeetingRequested')==='1'?1:0
    };
    document.getElementById('ownerFunnel').innerHTML='<h3>Ваш личный путь в demo</h3><div class="funnel-grid">'+
      [['REGISTER',counts.registered],['SAVE',counts.saved],['FOLLOW',counts.followed],['FAVORITE',counts.favorite],['REWARD',counts.reward],['MEETING',counts.meeting]].map(function(x){return '<div class="funnel-step"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>';}).join('')+
      '</div><div class="funnel-note">Это только персональный demo-funnel текущего устройства, не aggregate KPI мероприятия. Production analytics должен считать реальные события серверно.</div>';
  }
  
  function agendaLoad(){return safeJson('mfpAgenda.v1',[]);}
  function agendaSave(items){try{localStorage.setItem('mfpAgenda.v1',JSON.stringify(items));}catch(e){}}
  function toMinutes(t){var p=String(t||'00:00').split(':');return Number(p[0])*60+Number(p[1]||0);}
  function planningEnd(item){
    if(item.end)return toMinutes(item.end);
    var mins=item.type==='Показ'?45:60;
    return toMinutes(item.time)+mins;
  }
  function agendaConflicts(items){
    var byDate={};items.forEach(function(x){(byDate[x.date]||(byDate[x.date]=[])).push(x);});
    var conflicts=[];
    Object.keys(byDate).forEach(function(date){
      var arr=byDate[date].slice().sort(function(a,b){return toMinutes(a.time)-toMinutes(b.time);});
      for(var i=0;i<arr.length;i++)for(var k=i+1;k<arr.length;k++){
        if(toMinutes(arr[k].time)<planningEnd(arr[i])){
          conflicts.push({a:arr[i],b:arr[k],date:date});
        }
      }
    });
    return conflicts;
  }
  function addAgenda(kind,id){
    var data=window.MFP_DATA||{},entity=null,eventCode='';
    if(kind==='mfw'){
      entity=(data.mfw.events||[]).filter(function(x){return x.id===id;})[0];eventCode='MFW';
    }else{
      entity=(data.bfs.sessions||[]).filter(function(x){return x.id===id;})[0];eventCode='BFS';
    }
    if(!entity)return;
    var items=agendaLoad();
    if(!items.some(function(x){return x.id===id&&x.kind===kind;})){
      items.push(Object.assign({},entity,{kind:kind,eventCode:eventCode}));
      agendaSave(items);
    }
    renderHub();
  }
  function removeAgenda(kind,id){
    agendaSave(agendaLoad().filter(function(x){return !(x.kind===kind&&x.id===id);}));
    renderHub();
  }
  function directoryEntities(){
    var data=window.MFP_DATA||{mfw:{brands:[],events:[]},bfs:{speakers:[],sessions:[]}}, out=[];
    (data.mfw.brands||[]).forEach(function(x){out.push({kind:'mfw-brand',event:'MFW',id:x.id,title:x.name,subtitle:x.city,meta:(x.tags||[]).join(' · '),showId:x.showId});});
    (data.mfw.events||[]).forEach(function(x){out.push({kind:'mfw-event',event:'MFW',id:x.id,title:x.title,subtitle:x.date+' · '+x.time,meta:x.type+' · '+x.venue});});
    (data.bfs.speakers||[]).forEach(function(x){out.push({kind:'bfs-speaker',event:'BFS',id:x.id,title:x.name,subtitle:x.role,meta:x.org});});
    (data.bfs.sessions||[]).forEach(function(x){out.push({kind:'bfs-session',event:'BFS',id:x.id,title:x.title,subtitle:x.date+' · '+x.time,meta:x.topic+' · '+x.hall});});
    return out;
  }
  function renderDirectory(){
    hubContent.innerHTML='<div class="directory-tools"><input class="directory-search" id="directorySearch" placeholder="Бренд, спикер, сессия, показ"><select class="directory-filter" id="directoryFilter"><option value="all">Все</option><option value="MFW">MFW</option><option value="BFS">BFS</option><option value="brand">Бренды</option><option value="speaker">Спикеры</option><option value="programme">Программа</option></select></div><div class="directory-grid" id="directoryGrid"></div><div class="hub-note">Каталог построен на подтверждённых сущностях текущего MVP. Для полного production-каталога данные должны синхронизироваться с официальными CMS/реестрами MFW и BFS.</div>';
    function draw(){
      var q=(document.getElementById('directorySearch').value||'').toLowerCase(),f=document.getElementById('directoryFilter').value;
      var rows=directoryEntities().filter(function(x){
        var text=(x.title+' '+x.subtitle+' '+x.meta).toLowerCase();
        var okF=f==='all'||x.event===f||(f==='brand'&&x.kind==='mfw-brand')||(f==='speaker'&&x.kind==='bfs-speaker')||(f==='programme'&&(x.kind==='mfw-event'||x.kind==='bfs-session'));
        return okF&&(!q||text.indexOf(q)>=0);
      });
      document.getElementById('directoryGrid').innerHTML=rows.map(function(x){
        var action='';
        if(x.kind==='mfw-event')action='<button data-agenda-kind="mfw" data-agenda-id="'+x.id+'">В КАЛЕНДАРЬ</button>';
        if(x.kind==='bfs-session')action='<button data-agenda-kind="bfs" data-agenda-id="'+x.id+'">В КАЛЕНДАРЬ</button>';
        if(x.kind==='mfw-brand'&&x.showId)action='<button class="secondary" data-link-show="'+x.showId+'">СВЯЗАННЫЙ ПОКАЗ</button>';
        return '<article class="directory-card"><div class="kind">'+x.event+' · '+x.kind.replace('-',' ').toUpperCase()+'</div><h3>'+x.title+'</h3><p>'+x.subtitle+'</p><div class="entity-meta">'+x.meta+'</div><div class="directory-actions">'+action+'</div></article>';
      }).join('')||'<div class="hub-note">Ничего не найдено.</div>';
      [].slice.call(document.querySelectorAll('[data-agenda-kind]')).forEach(function(b){b.onclick=function(){addAgenda(b.dataset.agendaKind,b.dataset.agendaId);};});
      [].slice.call(document.querySelectorAll('[data-link-show]')).forEach(function(b){b.onclick=function(){
        var id=b.dataset.linkShow,e=(window.MFP_DATA.mfw.events||[]).filter(function(x){return x.id===id;})[0];
        if(e){document.getElementById('directorySearch').value=e.title;draw();}
      };});
    }
    document.getElementById('directorySearch').oninput=draw;document.getElementById('directoryFilter').onchange=draw;draw();
  }
  function renderAgenda(){
    var items=agendaLoad().slice().sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time);});
    var conflicts=agendaConflicts(items);
    var alert=conflicts.length?'<div class="agenda-alert"><b>Найдено пересечений: '+conflicts.length+'</b><br>'+conflicts.map(function(c){return c.date+': '+c.a.title+' ↔ '+c.b.title;}).join('<br>')+'<br><small>Для MFW без официальной длительности используется только демонстрационное planning window 45–60 минут; production должен брать реальные времена окончания и travel time.</small></div>':'<div class="agenda-alert agenda-ok"><b>Конфликтов в текущем planning view не найдено.</b></div>';
    hubContent.innerHTML=alert+'<div class="agenda-list">'+items.map(function(x){return '<article class="agenda-item"><div class="agenda-time"><span class="agenda-event">'+x.eventCode+'</span><br>'+x.date+'<br>'+x.time+(x.end?'–'+x.end:'')+'</div><div><h3>'+x.title+'</h3><p>'+(x.venue||x.hall||'')+' · '+(x.type||x.topic||'')+'</p></div><button class="agenda-action" data-remove-kind="'+x.kind+'" data-remove-id="'+x.id+'">УБРАТЬ</button></article>';}).join('')+'</div>'+(items.length?'':'<div class="hub-note">Добавьте показы MFW и сессии BFS из каталога — здесь появится единый маршрут.</div>');
    [].slice.call(document.querySelectorAll('[data-remove-id]')).forEach(function(b){b.onclick=function(){removeAgenda(b.dataset.removeKind,b.dataset.removeId);};});
  }
  function rewardDays(start){if(!start)return 0;return Math.min(30,Math.max(0,Math.floor((Date.now()-Number(start))/86400000)));}
  function renderWallet(){
    var i=getInterestState(), bfsStarts=safeJson('bfsRewardStarted',{}), cards=[];
    (window.MFP_DATA.mfw.brands||[]).forEach(function(b){
      if((i.mfwFollowed||[]).indexOf(b.id)>=0){
        cards.push({name:b.name,event:'MFW',days:0,note:'Eligibility MFW Club должен подтверждаться серверной loyalty authority и подключёнными соцсетями.'});
      }
    });
    Object.keys(i.bfsFollowed||{}).filter(function(k){return i.bfsFollowed[k];}).forEach(function(k){
      cards.push({name:k.replace(/-/g,' '),event:'BFS',days:rewardDays(bfsStarts[k]),note:'Prototype 30-day counter. Production требует серверной непрерывной верификации подписки.'});
    });
    hubContent.innerHTML='<div class="wallet-grid">'+cards.map(function(x){var pct=Math.round(x.days/30*100),eligible=x.days>=30;return '<article class="wallet-card '+(eligible?'':'locked')+'"><div class="kind">'+x.event+' · '+(eligible?'ELIGIBLE':'LOCKED')+'</div><h3>'+x.name+'</h3><div class="days">'+x.days+' / 30</div><div class="wallet-progress"><i style="width:'+pct+'%"></i></div><small>'+x.note+'</small>'+(eligible?'<button class="wallet-action">ОТКРЫТЬ НАГРАДУ</button>':'')+'</article>';}).join('')+'</div>'+(cards.length?'':'<div class="hub-note">Подпишитесь на бренд MFW или проект/спикера BFS — здесь появится прогресс привилегий.</div>');
  }
  function renderOwner(){
    var i=getInterestState(),agenda=agendaLoad();
    var stats={
      registrations:(accountState.registrations.mfw?1:0)+(accountState.registrations.bfs?1:0),
      agenda:agenda.length,
      follows:(i.mfwFollowed||[]).length+Object.keys(i.bfsFollowed||{}).filter(function(k){return i.bfsFollowed[k];}).length,
      favorites:(i.mfwFavorites||[]).length+Object.keys(i.bfsFavorites||{}).filter(function(k){return i.bfsFavorites[k];}).length
    };
    hubContent.innerHTML='<div class="analytics-grid">'+[['REGISTRATIONS',stats.registrations],['AGENDA ITEMS',stats.agenda],['FOLLOWS',stats.follows],['FAVORITES',stats.favorites]].map(function(x){return '<div class="analytics-stat"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>';}).join('')+'</div>'+
      '<div class="kpi-map">'+
      '<div class="kpi-row"><b>Acquisition</b><span>Registration source → role → approval → attendance</span><em>OWNER KPI</em></div>'+
      '<div class="kpi-row"><b>Engagement</b><span>Programme saves → LIVE/Replay → speaker/brand opens → dwell</span><em>PRODUCT KPI</em></div>'+
      '<div class="kpi-row"><b>Relationship</b><span>Follow → Favorite → verified 30-day continuity → reward claim</span><em>CRM KPI</em></div>'+
      '<div class="kpi-row"><b>Commercial</b><span>Buyer/delegate discovery → meeting → qualified lead → follow-up</span><em>REVENUE KPI</em></div>'+
      '<div class="kpi-row"><b>Sponsor</b><span>Campaign exposure → interaction → opt-in → visit/lead/reward attribution</span><em>PARTNER KPI</em></div>'+
      '</div><div class="hub-note">Числа выше — только действия текущего demo-пользователя. Production Owner Analytics должен считать агрегаты на сервере и разделять MFW/BFS, роль, источник и consent.</div>';
  }
  function renderHub(){
    [].slice.call(document.querySelectorAll('[data-hub-tab]')).forEach(function(b){b.classList.toggle('active',b.dataset.hubTab===hubTab);});
    if(hubTab==='directory')renderDirectory();
    else if(hubTab==='agenda')renderAgenda();
    else if(hubTab==='wallet')renderWallet();
    else renderOwner();
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
    select.innerHTML=cfg.roles.map(function(x){return '<option value="'+x.id+'">'+x.label+'</option>';}).join('');
    var roleNote=document.getElementById('registrationRoleNote');
    function updateRoleNote(){var role=cfg.roles.filter(function(x){return x.id===select.value;})[0];if(roleNote)roleNote.innerHTML='<b>'+role.label+'</b><span>'+role.note+'</span><small>FLOW: '+role.mode.toUpperCase()+'</small>';}
    select.onchange=updateRoleNote;updateRoleNote();
    registrationForm.elements.company.value=(existing&&existing.company)||accountState.profile.company||'';
    registrationForm.elements.title.value=(existing&&existing.title)||accountState.profile.title||'';
    registrationForm.elements.purpose.value=(existing&&existing.purpose)||'';
    registrationForm.elements.registrationType.value=(existing&&existing.registrationType)||cfg.roles[0].id; if(select.onchange)select.onchange();
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
  document.getElementById('investorBtn').onclick=function(){investorModal.classList.remove('hidden');};
  document.getElementById('valueBtn').onclick=function(){valueModal.classList.remove('hidden');};
  document.getElementById('forYouBtn').onclick=function(){renderForYou();forYouModal.classList.remove('hidden');};
  document.getElementById('hubBtn').onclick=function(){renderHub();hubModal.classList.remove('hidden');};
  document.getElementById('hubClose').onclick=function(){hubModal.classList.add('hidden');};
  document.getElementById('forYouClose').onclick=function(){forYouModal.classList.add('hidden');};
  document.getElementById('valueClose').onclick=function(){valueModal.classList.add('hidden');};
  document.getElementById('investorClose').onclick=function(){investorModal.classList.add('hidden');};
  [].slice.call(document.querySelectorAll('[data-investor-step]')).forEach(function(b){b.onclick=function(){var step=b.dataset.investorStep;var narrative=document.getElementById('investorNarrative');if(step==='1'){openEvent('mfw');narrative.textContent='MFW сохранён без редизайна: показы, LIVE, Discover, pass, buyer и networking.';}if(step==='2'){openEvent('bfs');narrative.textContent='BFS открывается как самостоятельный бренд с business programme, speakers, exhibition и B2B.';}if(step==='3'){investorModal.classList.add('hidden');openAccount();}if(step==='4'){openEvent('bfs');narrative.textContent='В BFS показаны programme save, отдельная регистрация, QR credential и delegate meeting flow.';}if(step==='5'){narrative.textContent='Shared identity и event-scoped authorities позволяют подключать следующие события без унификации их бренда.';}};});
  document.getElementById('accountClose').onclick=closeAccount;
  document.getElementById('registrationClose').onclick=closeRegistration;
  accountDrawer.addEventListener('click',function(e){if(e.target===accountDrawer)closeAccount();});
  registrationModal.addEventListener('click',function(e){if(e.target===registrationModal)closeRegistration();});
  investorModal.addEventListener('click',function(e){if(e.target===investorModal)investorModal.classList.add('hidden');});
  valueModal.addEventListener('click',function(e){if(e.target===valueModal)valueModal.classList.add('hidden');});
  forYouModal.addEventListener('click',function(e){if(e.target===forYouModal)forYouModal.classList.add('hidden');});
  hubModal.addEventListener('click',function(e){if(e.target===hubModal)hubModal.classList.add('hidden');});
  [].slice.call(document.querySelectorAll('[data-hub-tab]')).forEach(function(b){b.onclick=function(){hubTab=b.dataset.hubTab;renderHub();};});
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