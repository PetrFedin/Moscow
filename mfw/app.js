(function(){
  'use strict';

  var API='https://moscow-fashion-week-authority.onrender.com';
  var VISUALS={
    runway:'https://images.unsplash.com/photo-1742237424056-ea5cbb674d66?auto=format&fit=crop&w=1600&q=88',
    backstage:'https://images.unsplash.com/photo-1764347120228-947f575f9c82?auto=format&fit=crop&w=1400&q=86',
    street:'https://images.unsplash.com/photo-1768825136230-34fb80291f19?auto=format&fit=crop&w=1400&q=86',
    designer:'https://images.unsplash.com/photo-1760022638435-aad7c1e684b6?auto=format&fit=crop&w=1400&q=86'
  };
  var DEMO_VIDEO='https://videos.pexels.com/video-files/19863106/19863106-uhd_2160_3840_30fps.mp4';
  var streamPollTimer=null;
  var passRefreshTimer=null;
  var scannerStream=null;
  var scannerFrame=null;
  var demoEvents = [
    {id:'e1',time:'17:00',name:'MFW Opening Runway',type:'Показ',venue:'Манеж · Зал 1',status:'LIVE',access:'OPEN'},
    {id:'e2',time:'18:00',name:'New Names: Moscow',type:'Показ',venue:'Манеж · Зал 2',status:'REGISTRATION',access:'OPEN'},
    {id:'e3',time:'19:00',name:'Ваш бренд глазами байера',type:'Лекция',venue:'Лекторий',status:'OPEN',access:'OPEN'},
    {id:'e4',time:'20:30',name:'International Exchange Show',type:'Показ',venue:'Манеж · Зал 1',status:'WAITLIST',access:'REQUEST ACCESS'},
    {id:'e5',time:'21:30',name:'Private Industry Reception',type:'B2B',venue:'Partner Lounge',status:'INVITE ONLY',access:'INVITE ONLY'}
  ];
  var brands = [
    {id:'b1',name:'MFW / NEW 01',city:'Москва',tag:'Emerging · Womenswear',desc:'Демонстрационная карточка бренда для проверки UX. Здесь будут история бренда, дизайнер, коллекции и точки продаж.'},
    {id:'b2',name:'MFW / STUDIO 02',city:'Санкт-Петербург',tag:'Contemporary · Unisex',desc:'Пример brand profile с коллекциями, replay, сохранением и профессиональными B2B-действиями.'},
    {id:'b3',name:'MFW / ATELIER 03',city:'Казань',tag:'Heritage · Couture',desc:'Пример участника с editorial-подачей, медиаматериалами и showroom-механикой.'},
    {id:'b4',name:'MFW / LAB 04',city:'Москва',tag:'Tech · Accessories',desc:'Пример brand discovery для молодой марки и новых форматов взаимодействия.'}
  ];
  var state = {
    tab:'today',
    discoverTab:'brands',
    role:localStorage.getItem('mfwRole') || 'Visitor',
    name:localStorage.getItem('mfwName') || 'Пётр Федин',
    savedLooks:JSON.parse(localStorage.getItem('mfwSavedLooks') || '["look-07"]'),
    savedBrands:JSON.parse(localStorage.getItem('mfwSavedBrands') || '[]'),
    myEvents:JSON.parse(localStorage.getItem('mfwMyEvents') || '["e2","e3"]'),
    connections:2,
    meeting:false,
    voted:false,
    scannerState:'idle',
    backendStatus:'checking',
    authStatus:'local',
    session:null,
    userId:null,
    passToken:null,
    passPayload:null,
    scannerReason:'',
    openingSeen:localStorage.getItem('mfwOpeningSeen') === '1',
    stream:null,
    streamLoading:false,
    buyerShortlist:[],
    commerceLoading:false,
    onboarding:localStorage.getItem('mfwOnboarded') === '1'
  };

  function persist(){
    localStorage.setItem('mfwRole',state.role);
    localStorage.setItem('mfwName',state.name);
    localStorage.setItem('mfwSavedLooks',JSON.stringify(state.savedLooks));
    localStorage.setItem('mfwSavedBrands',JSON.stringify(state.savedBrands));
    localStorage.setItem('mfwMyEvents',JSON.stringify(state.myEvents));
  }

  async function api(path, options){
    var opts=options||{};
    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort();},6500);
    opts.signal=controller.signal;
    opts.headers=Object.assign({'Content-Type':'application/json'},opts.headers||{});
    var res;
    try{ res=await fetch(API+path,opts); }
    finally{ clearTimeout(timer); }
    var data=await res.json().catch(function(){return {};});
    if(!res.ok){
      var err=new Error(data.error||data.reason||('api_'+res.status));
      err.status=res.status;err.data=data;throw err;
    }
    return data;
  }

  function updateBackendIndicator(){
    var el=document.getElementById('backend-status');
    if(!el)return;
    el.textContent=state.backendStatus==='online'?'API ONLINE':state.backendStatus==='offline'?'API OFFLINE':'CHECKING';
    el.className='badge '+(state.backendStatus==='online'?'open':state.backendStatus==='offline'?'live':'');
  }

  async function cacheOfflineAuthority(){
    try{
      var key=await api('/v1/authority/public-key');
      localStorage.setItem('mfwAuthorityJwk',JSON.stringify(key.jwk));
      var rev=await api('/v1/authority/revocations');
      localStorage.setItem('mfwRevocations',JSON.stringify(rev.revoked||[]));
    }catch(_){}
  }

  async function loadStreamAuthority(){
    if(state.streamLoading)return;
    state.streamLoading=true;
    try{
      var out=await api('/v1/streams/e1');
      var changed=!state.stream||state.stream.currentLook!==out.data.currentLook||state.stream.status!==out.data.status||state.stream.replayAvailable!==out.data.replayAvailable;
      state.stream=out.data;
      if(changed&&state.tab==='live')setTimeout(function(){render();},0);
    }catch(_){}
    state.streamLoading=false;
    if(state.tab==='live'){
      if(streamPollTimer)clearTimeout(streamPollTimer);
      streamPollTimer=setTimeout(loadStreamAuthority,3500);
    }
  }

  async function checkBackend(){
    try{
      await api('/health');
      state.backendStatus='online';
      cacheOfflineAuthority();
    }catch(_){
      state.backendStatus='offline';
    }
    updateBackendIndicator();
  }

  function schedulePassRotation(ms){
    if(passRefreshTimer)clearTimeout(passRefreshTimer);
    passRefreshTimer=setTimeout(function(){
      state.passToken=null;state.passPayload=null;
      if(state.tab==='me')ensurePass();
    },Math.max(15000,Number(ms||45000)));
  }

  async function renderPassQR(){
    var el=document.getElementById('qr');if(!el||!state.passToken)return;
    try{
      var controller=new AbortController();
      var timer=setTimeout(function(){controller.abort();},6500);
      var res=await fetch(API+'/v1/passes/qr',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({token:state.passToken}),
        signal:controller.signal
      });
      clearTimeout(timer);
      if(!res.ok)throw new Error('qr_'+res.status);
      el.innerHTML=await res.text();
    }catch(_){
      el.innerHTML='<div style="color:#111;font-size:11px;padding:36px 12px;text-align:center">QR temporarily unavailable</div>';
    }
  }

  async function ensurePass(){
    if(state.passToken&&state.passPayload&&Number(state.passPayload.exp||0)>Date.now()+30000){
      renderPassQR();return;
    }
    try{
      var data=await api('/v1/passes/issue',{
        method:'POST',
        body:JSON.stringify({
          userId:state.userId||('demo_'+state.name.toLowerCase().replace(/[^a-z0-9а-я]+/gi,'_').slice(0,40)),
          role:state.role,
          eventId:'e1',
          entitlements:[entitlementText()]
        })
      });
      state.passToken=data.token;
      state.passPayload=data.payload;
      renderPassQR();
      schedulePassRotation(data.refreshAfterMs);
      var el=document.getElementById('pass-authority');
      if(el)el.textContent='ES256 · rotating · '+String(data.payload.jti||'').slice(-8);
    }catch(_){
      var el2=document.getElementById('pass-authority');
      if(el2)el2.textContent='API unavailable · cached pass only';
    }
  }

  function track(type, meta){
    api('/v1/analytics/track',{method:'POST',body:JSON.stringify({type:type,meta:meta||{},at:new Date().toISOString()})}).catch(function(){});
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});
  }

  function badge(status){
    var cls = status==='LIVE'?'live':status==='OPEN'?'open':status.indexOf('WAIT')>=0?'wait':status.indexOf('INVITE')>=0?'invite':'';
    return '<span class="badge '+cls+'">'+esc(status)+'</span>';
  }

  function topbar(){
    return '<div class="topbar"><div class="wordmark"><span>MOSCOW</span><span>FASHION WEEK</span></div><div class="top-actions"><button class="investor-pill" data-action="investor-tour">INVESTOR</button><button class="icon-btn" data-action="notifications">●</button><button class="icon-btn pass" data-tab="me">QR</button></div></div>';
  }

  function nav(){
    var items=[
      ['today','◐','Сегодня'],
      ['schedule','▦','Программа'],
      ['live','▶','LIVE'],
      ['discover','◇','Открыть'],
      ['me','◎','Я']
    ];
    return '<nav class="bottom-nav">'+items.map(function(x){
      return '<button class="nav-btn '+(state.tab===x[0]?'active':'')+'" data-tab="'+x[0]+'"><b>'+x[1]+'</b>'+x[2]+'</button>';
    }).join('')+'</nav>';
  }

  function demoNote(){
    return '<div class="demo-note"><b>CONCEPT DEMO.</b> Программа, бренды и права доступа на этом стенде — демонстрационные данные. Архитектура интерфейса предназначена для подключения к официальным данным MFW.</div>';
  }

  function lookVisual(n,label){
    var urls=[VISUALS.runway,VISUALS.backstage,VISUALS.street,VISUALS.designer];
    return '<div class="look-photo" style="background-image:url('+urls[(n-1)%urls.length]+')"><span class="look-number">'+esc(label||('LOOK '+String(n).padStart(2,'0')))+'</span></div>';
  }

  function openingExperience(){
    return '<div class="opening-experience">'+
      '<div class="opening-media" style="background-image:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.82)),url('+VISUALS.runway+')"></div>'+
      '<div class="opening-grain"></div>'+
      '<div class="opening-copy"><div class="opening-mark"><span>MOSCOW</span><span>FASHION WEEK</span></div>'+
      '<div class="opening-season">26 SEP — 01 OCT · 2026</div>'+
      '<h1>МОСКВА<br>ВЫХОДИТ<br>НА ПОДИУМ.</h1>'+
      '<p>Показы, LIVE, бренды, люди и ваш цифровой пропуск — в одном пространстве.</p>'+
      '<button class="opening-cta" data-action="enter-experience">Войти в Moscow Fashion Week <span>→</span></button>'+
      '<button class="opening-ghost" data-action="investor-tour">Investor demo · 3 min</button></div>'+
      '<div class="opening-credit">Investor concept · demo visuals</div></div>';
  }

  function today(){
    var isNight=(new Date().getHours()>=19||new Date().getHours()<6);
    return '<main class="'+(isNight?'night-state':'day-state')+'">'+
      '<div class="today-masthead"><div><div class="eyebrow">26 сентября · День 1</div><h1>СЕГОДНЯ<br>В MFW</h1></div><div class="day-orbit">'+(isNight?'NIGHT':'DAY')+'</div></div>'+
      '<section class="fashion-hero" style="background-image:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.86)),url('+VISUALS.runway+')">'+
        '<div class="fashion-hero-top"><span class="live-tag"><span class="dot"></span> LIVE NOW</span><span class="native-partner">PARTNER EXPERIENCE · DEMO</span></div>'+
        '<div class="fashion-hero-bottom"><div class="eyebrow">MFW OPENING RUNWAY · HALL 1</div><div class="fashion-title">THE CITY<br>IS WATCHING.</div><div class="hero-meta">LOOK '+esc(String((state.stream&&state.stream.currentLook)||14).padStart(2,'0'))+' / '+esc((state.stream&&state.stream.totalLooks)||32)+'</div>'+
        '<div class="action-row"><button class="action light" data-tab="live">Смотреть LIVE</button><button class="action glass" data-action="sponsor-experience">Experience</button></div></div>'+
      '</section>'+
      '<div class="investor-strip premium"><div><div class="kicker">Investor path</div><b>Audience → access → commerce → organizer</b><p>Весь путь уже собран в одном vertical slice.</p></div><button class="action primary" data-action="investor-tour">3 min</button></div>'+
      '<div class="section-head"><h2>Ваш вечер</h2><span class="link" data-tab="schedule">Вся программа</span></div>'+
      '<div class="timeline premium-timeline">'+demoEvents.slice(1,4).map(eventRow).join('')+'</div>'+
      '<div class="editorial-duo"><button class="editorial-story" data-action="brand" data-id="b1" style="background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.78)),url('+VISUALS.backstage+')"><span class="eyebrow">BACKSTAGE</span><b>До выхода<br>30 секунд</b><small>Открыть историю бренда →</small></button>'+
      '<button class="editorial-story" data-discover="street" style="background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.78)),url('+VISUALS.street+')"><span class="eyebrow">STREET STYLE</span><b>Москва<br>между показами</b><small>Смотреть feed →</small></button></div>'+
      '<div class="section-head"><h2>Runway now</h2><span class="link" data-action="saved-looks">Сохранённые</span></div>'+
      '<div class="visual-look-rail">'+[11,12,13,14,15].map(function(n){var id='look-'+n;return '<button class="visual-look '+(state.savedLooks.indexOf(id)>=0?'saved':'')+'" data-action="save-look" data-look="'+id+'">'+lookVisual(n)+'</button>';}).join('')+'</div>'+
      '<div class="recap-teaser" data-action="post-show-recap"><div><div class="eyebrow">POST-SHOW RECAP</div><b>Ваш день в MFW,<br>собранный автоматически.</b><p>Показы · сохранённые образы · бренды · контакты.</p></div><span>→</span></div>'+
    '</main>';
  }

  function eventRow(e){
    return '<div class="event" data-action="event" data-id="'+e.id+'"><div class="time">'+e.time+'</div><div><h3>'+esc(e.name)+'</h3><div class="meta">'+esc(e.venue)+' · '+esc(e.type)+'</div></div>'+badge(e.status)+'</div>';
  }

  function schedule(){
    return '<main>'+
      '<div class="eyebrow" style="margin-top:18px">Ваш персональный календарь</div><h1>ПРОГРАММА</h1>'+
      '<div class="filters">'+['26 SEP','27','28','29','30','01 OCT'].map(function(x,i){return '<button class="chip '+(i===0?'active':'')+'">'+x+'</button>';}).join('')+'</div>'+
      '<div class="filters">'+['Все','Мои','Показы','Лекции','B2B','Онлайн','Доступно мне'].map(function(x,i){return '<button class="chip '+(i===0?'active':'')+'">'+x+'</button>';}).join('')+'</div>'+
      demoEvents.map(function(e){
        var mine=state.myEvents.indexOf(e.id)>=0;
        return '<div class="card event-card" data-action="event" data-id="'+e.id+'"><div class="event-top"><div><div class="eyebrow">'+e.time+' · '+esc(e.type)+'</div><div class="event-name">'+esc(e.name)+'</div><div class="event-details">'+esc(e.venue)+' · '+esc(e.access)+'</div></div>'+badge(e.status)+'</div><div class="mini-actions"><button class="action '+(mine?'ghost':'primary')+'" data-action="toggle-event" data-id="'+e.id+'">'+(mine?'✓ В моей программе':'+ Добавить')+'</button><button class="action ghost" data-action="route" data-id="'+e.id+'">Маршрут</button></div></div>';
      }).join('')+
    '</main>';
  }

  function live(){
    var stream=state.stream||{status:'live',currentLook:14,totalLooks:32,playbackUrl:DEMO_VIDEO,posterUrl:VISUALS.runway,replayAvailable:true};
    var current=Number(stream.currentLook||14);
    var saved=state.savedLooks.indexOf('look-'+current)>=0;
    return '<main class="live-screen"><div class="live-kicker"><span class="live-tag"><span class="dot"></span> '+esc(String(stream.status||'live').toUpperCase())+'</span><span class="stream-authority">STREAM AUTHORITY</span></div>'+
      '<h1>RUNWAY<br>LIVE</h1>'+
      '<div class="cinema-player">'+
        '<video class="runway-video" autoplay muted loop playsinline poster="'+esc(stream.posterUrl||VISUALS.runway)+'"><source src="'+esc(stream.playbackUrl||DEMO_VIDEO)+'" type="video/mp4"></video>'+
        '<div class="cinema-vignette"></div>'+
        '<div class="cinema-top"><span>MFW · OPENING RUNWAY</span><span>CC · RU / EN</span></div>'+
        '<div class="cinema-bottom"><div><div class="look-index">LOOK '+String(current).padStart(2,'0')+' / '+esc(stream.totalLooks||32)+'</div><div class="live-brand">MFW / NEW 01</div></div>'+
        '<div class="live-actions"><button class="round-action '+(saved?'saved':'')+'" data-action="save-look" data-look="look-'+current+'">'+(saved?'♥':'♡')+'</button><button class="round-action" data-action="brand" data-id="b1">↗</button></div></div>'+
      '</div>'+
      '<div class="live-progress"><span style="width:'+(Math.max(4,Math.min(100,(current/Number(stream.totalLooks||32))*100)))+'%"></span></div>'+
      '<div class="section-head"><h2>Look-by-look</h2><span class="link">Синхронизировано с эфиром</span></div>'+
      '<div class="visual-look-rail live-rail">'+[current-2,current-1,current,current+1,current+2].filter(function(n){return n>0&&n<=Number(stream.totalLooks||32);}).map(function(n){return '<button class="visual-look '+(n===current?'current':'')+'" data-action="save-look" data-look="look-'+n+'">'+lookVisual(n)+'</button>';}).join('')+'</div>'+
      '<div class="live-editorial-card" style="background-image:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.22)),url('+VISUALS.backstage+')"><div><div class="eyebrow">BACKSTAGE · LIVE LAYER</div><b>Что происходит<br>за кулисами сейчас</b><button class="action light" data-action="brand" data-id="b1">Открыть бренд</button></div></div>'+
      '<div class="section-head"><h2>Далее</h2><span class="link">18:00</span></div>'+
      '<div class="card premium-card"><div class="eyebrow">UP NEXT · HALL 2</div><div class="event-name">New Names: Moscow</div><div class="sub">Персональное напоминание за 10 минут · 4 минуты пешком.</div><div class="action-row"><button class="action primary" data-action="toggle-event" data-id="e2">Добавить</button><button class="action ghost" data-action="route">Маршрут</button></div></div>'+
      '<div class="replay-state"><div><div class="eyebrow">REPLAY READY</div><b>После показа эфир станет<br>структурированным архивом.</b><p>Видео + looks + captions + brand story.</p></div><span class="replay-icon">▶</span></div>'+
    '</main>';
  }

  function discover(){
    var tabs=['brands','speakers','people','street','market','map'];
    var labels={brands:'Бренды',speakers:'Спикеры',people:'Люди',street:'Street',market:'Маркет',map:'Карта'};
    var content='';
    if(state.discoverTab==='brands'){
      content='<input class="input editorial-search" placeholder="Бренд, дизайнер, категория" />'+
      '<div class="editorial-brand-grid">'+brands.map(function(b,i){
        var img=[VISUALS.designer,VISUALS.runway,VISUALS.backstage,VISUALS.street][i%4];
        return '<button class="editorial-brand-card" data-action="brand" data-id="'+b.id+'" style="background-image:linear-gradient(180deg,transparent 20%,rgba(0,0,0,.84)),url('+img+')"><span class="brand-tag">'+esc(b.tag)+'</span><div><h3>'+esc(b.name)+'</h3><div class="sub">'+esc(b.city)+'</div></div></button>';
      }).join('')+'</div>';
    } else if(state.discoverTab==='speakers'){
      content='<div class="speaker-card"><div class="speaker-photo" style="background-image:url('+VISUALS.designer+')"></div><div class="speaker-copy"><div class="eyebrow">RETAIL · BUYING</div><div class="event-name">Анна · Buyer Perspective</div><div class="sub">Как байер принимает решение о бренде и коллекции.</div><div class="action-row"><button class="action primary" data-action="questions">Live Q&A</button><button class="action ghost" data-action="toggle-event" data-id="e3">В программу</button></div></div></div>'+
      '<div class="speaker-card reverse"><div class="speaker-photo" style="background-image:url('+VISUALS.backstage+')"></div><div class="speaker-copy"><div class="eyebrow">TECH · FASHION</div><div class="event-name">AI в fashion-команде</div><div class="sub">Сессия, материалы, запись и ключевые выводы после выступления.</div><button class="action ghost" data-action="toast" data-message="Материалы будут доступны после сессии">Материалы</button></div></div>';
    } else if(state.discoverTab==='people'){
      content='<div class="filters">'+['Buyer','Designer','Retail','Media','Stylist','Creator'].map(function(x,i){return '<button class="chip '+(i===0?'active':'')+'">'+x+'</button>';}).join('')+'</div>'+
      '<div class="people-editorial"><div class="person-photo" style="background-image:url('+VISUALS.street+')"></div><div><div class="eyebrow">BUYER · MOSCOW</div><h2>Мария</h2><p class="sub">Premium Womenswear · ищет новые российские марки.</p><div class="action-row"><button class="action primary" data-action="connect">Connect</button><button class="action ghost" data-action="toast" data-message="QR exchange готов к сканированию">QR exchange</button></div></div></div>';
    } else if(state.discoverTab==='street'){
      content='<div class="street-feed">'+
        '<article class="street-post tall" style="background-image:url('+VISUALS.street+')"><span>STREET 001</span><b>Outside Manege</b></article>'+
        '<article class="street-post" style="background-image:url('+VISUALS.backstage+')"><span>DETAIL</span><b>Before the show</b></article>'+
        '<article class="street-post" style="background-image:url('+VISUALS.runway+')"><span>FRONT ROW</span><b>Seen at MFW</b></article>'+
      '</div><div class="demo-note"><b>Editorial moderation.</b> В production сюда попадают только одобренные official + UGC материалы с правами на публикацию.</div>';
    } else if(state.discoverTab==='market'){
      content='<div class="market-hero" style="background-image:linear-gradient(90deg,rgba(0,0,0,.84),rgba(0,0,0,.18)),url('+VISUALS.designer+')"><div><div class="eyebrow">MFW MARKET</div><b>Из офлайн-стенда<br>в цифровую витрину.</b><p>QR → бренд → коллекция → Follow → где купить.</p><button class="action light" data-action="brand" data-id="b2">Открыть бренд</button></div></div>';
    } else {
      content='<div class="indoor-map"><div class="map-zone hall1"><b>HALL 1</b><span>LIVE</span></div><div class="map-zone hall2"><b>HALL 2</b><span>18:00</span></div><div class="map-zone hall3"><b>HALL 3</b></div><div class="map-zone lecture"><b>LECTURE</b></div><div class="map-zone showroom"><b>SHOWROOM</b></div><div class="map-zone market"><b>MARKET</b></div><div class="you-are-here">● YOU</div></div>'+
      '<div class="card premium-card"><div class="eyebrow">NEXT · 18:00</div><div class="event-name">New Names: Moscow</div><div class="sub">Hall 2 · 4 минуты пешком · без конфликта с вашей программой.</div><button class="action primary" data-action="route">Построить маршрут</button></div>';
    }
    return '<main><div class="eyebrow" style="margin-top:18px">Discover MFW</div><h1>ОТКРЫТЬ</h1><div class="filters discover-tabs">'+tabs.map(function(t){return '<button class="chip '+(state.discoverTab===t?'active':'')+'" data-discover="'+t+'">'+labels[t]+'</button>';}).join('')+'</div>'+content+'</main>';
  }

  function me(){
    var roleContent='';
    if(state.role==='Buyer'){
      roleContent=buyerPanel();
      setTimeout(loadBuyerShortlist,0);
    } else if(state.role==='Media'){
      roleContent='<h2>Press mode</h2><div class="card"><div class="eyebrow">APPROVED ASSETS</div><div class="event-name">Press kit · Opening Runway</div><div class="sub">Press release · 18 approved images · credits · press contact</div><button class="action primary" data-action="toast" data-message="Demo: пакет подготовлен к выгрузке">Получить press kit</button></div>';
    } else if(state.role==='Designer'){
      roleContent='<h2>Brand dashboard</h2><div class="stat-grid"><div class="stat"><b>82%</b><small>Профиль</small></div><div class="stat"><b>148</b><small>Сохранения</small></div><div class="stat"><b>17</b><small>Buyer interest</small></div></div><div class="card" style="margin-top:10px"><h3>До показа</h3><div class="sub">Нужно загрузить 4 look metadata и проверить порядок выхода.</div><button class="action primary" data-action="toast" data-message="Demo: открыта подготовка коллекции">Продолжить подготовку</button></div>';
    } else if(state.role==='Staff'){
      roleContent=staffPanel();
    } else if(state.role==='Organizer'){
      roleContent=organizerPanel();
    }

    return '<main><div class="eyebrow" style="margin-top:18px">MFW ID</div><h1>ВАШ<br>ПРОФИЛЬ</h1>'+
      '<div class="profile-head"><div class="avatar"></div><div><h3>'+esc(state.name)+'</h3><div class="role">'+esc(state.role.toUpperCase())+'</div><div class="sub">Demo account</div></div></div>'+
      '<div class="pass-card"><div class="pass-top"><div><div class="pass-title">MOSCOW FASHION WEEK</div><div class="pass-role">'+esc(state.role)+' PASS · DEMO</div></div><b>01</b></div><div id="qr" class="qr" aria-label="Demo pass code"></div><div style="text-align:center;font-size:10px;font-weight:800;margin-top:-10px;margin-bottom:14px" id="pass-authority">Requesting server-signed pass…</div><div class="pass-top"><div><b>26 SEP — 01 OCT</b><div style="font-size:11px;margin-top:5px">Entitlements: '+entitlementText()+'</div></div><div class="offline"><span class="okdot"></span> Offline ready</div></div></div>'+
      '<h2>Demo role</h2><div class="role-switcher">'+['Visitor','Buyer','Media','Designer','Organizer','Staff'].map(function(r){return '<button class="role-btn '+(state.role===r?'active':'')+'" data-role="'+r+'">'+r+'</button>';}).join('')+'</div>'+
      '<div class="stat-grid"><div class="stat"><b>'+state.myEvents.length+'</b><small>События</small></div><div class="stat"><b>'+state.savedLooks.length+'</b><small>Образы</small></div><div class="stat"><b>'+state.connections+'</b><small>Контакты</small></div></div>'+
      roleContent+
      '<h2>MFW Passport</h2><div class="progress"><span style="width:60%"></span></div><div class="passport" style="margin-top:10px"><div class="stamp done"><div class="symbol">✓</div><b>Первый показ</b><div class="sub">Получено</div></div><div class="stamp done"><div class="symbol">◇</div><b>Открыть бренд</b><div class="sub">Получено</div></div><div class="stamp"><div class="symbol">□</div><b>Fashion Film</b><div class="sub">Ещё не получено</div></div><div class="stamp done"><div class="symbol">◎</div><b>Лекция</b><div class="sub">Получено</div></div></div>'+
      '<h2>Настройки</h2><div class="card"><div class="event" style="grid-template-columns:1fr auto;padding-top:0"><div><h3>Уведомления</h3><div class="meta">Критические · LIVE · персональные</div></div><span class="badge open">ON</span></div><button class="action ghost" data-action="restart-onboarding">Перезапустить onboarding</button></div>'+
    '</main>';
  }

  function entitlementText(){
    if(state.role==='Buyer') return 'Showroom · B2B · selected shows';
    if(state.role==='Media') return 'Media · Press Zone · selected shows';
    if(state.role==='Designer') return 'Backstage · Brand Zone · assigned show';
    if(state.role==='Staff') return 'Gate · Operations';
    if(state.role==='Organizer') return 'Programme · Access · Content · Analytics';
    return 'Public programme · registered events';
  }

  function buyerPanel(){
    var shortlist=state.buyerShortlist||[];
    return '<h2>Buyer workspace</h2>'+
      '<div class="buyer-workspace-hero"><div><div class="eyebrow">BUYER MODE</div><b>От интереса<br>к заказу.</b><p>Shortlist → line sheet → meeting → follow-up.</p></div><span>'+shortlist.length+'</span></div>'+
      '<div class="card"><div class="eyebrow">SHORTLIST · SERVER</div><div class="event-name">'+(shortlist.length?shortlist.length+' бренда сохранено':'Добавьте первый бренд')+'</div>'+
      '<div class="buyer-shortlist">'+(shortlist.length?shortlist.map(function(b){return '<button data-action="brand" data-id="'+esc(b.id)+'"><b>'+esc(b.name)+'</b><span>'+esc(b.city||'')+'</span></button>';}).join(''):'<div class="premium-empty"><div class="symbol">◇</div><b>Shortlist пуст</b><p>Откройте бренд и добавьте его для коммерческой работы.</p></div>')+'</div></div>'+
      '<div class="card"><div class="eyebrow">MEETING</div><div class="event-name">'+(state.meeting?'14:30 · MFW / NEW 01':'Запросить встречу')+'</div><div class="sub">'+(state.meeting?'Showroom Meeting Point 4 · подтверждено':'Выберите бренд и доступный слот.')+'</div><button class="action '+(state.meeting?'ghost':'primary')+'" data-action="meeting">'+(state.meeting?'Добавить private note':'Выбрать слот')+'</button></div>';
  }

  function organizerPanel(){
    return '<h2>Organizer cockpit</h2>'+
      '<div class="card"><div class="event-top"><div><div class="eyebrow">SYSTEM AUTHORITY</div><div class="event-name">MFW Authority</div><div class="sub">ES256 pass · check-in · CMS · accreditation · live operations</div></div><span id="backend-status" class="badge">CHECKING</span></div><div class="action-row"><button class="action primary" data-action="admin-console">Открыть Admin Console</button></div></div>'+
      '<div class="value-grid" style="margin-top:10px"><div class="value-card"><div class="n">8.4K</div><small>demo active users today</small></div><div class="value-card"><div class="n">71%</div><small>demo programme engagement</small></div><div class="value-card"><div class="n">312</div><small>demo buyer actions</small></div></div>'+
      '<div class="commercial-card"><div class="eyebrow">PARTNER VALUE · DEMO METRICS</div><div class="event-name">Из показа — в измеримый результат</div><div class="metric-row"><b>Sponsored LIVE reach</b><strong>24.8K</strong></div><div class="metric-row"><b>Brand profile opens</b><strong>6.1K</strong></div><div class="metric-row"><b>Saved looks</b><strong>1.9K</strong></div><div class="metric-row"><b>Shop / showroom intent</b><strong>487</strong></div></div>'+
      '<div class="card"><div class="eyebrow">WHY THIS SELLS</div><div class="event-name">Один слой данных для всего события</div><div class="sub">Регистрация → доступ → посещение → просмотр → сохранение → встреча → лид → отчёт партнёру.</div><div class="action-row"><button class="action ghost" data-action="investor-tour">Investor tour</button></div></div>';
  }

  function staffPanel(){
    var result='';
    if(state.scannerState==='valid') result='<div class="access-result valid">CHECK-IN ACCEPTED</div><div class="sub" style="margin-top:8px">'+esc(state.scannerReason||'ES256 + entitlement accepted')+'</div>';
    if(state.scannerState==='offline') result='<div class="access-result valid">OFFLINE VALID</div><div class="sub" style="margin-top:8px">'+esc(state.scannerReason||'signature verified on device')+'</div>';
    if(state.scannerState==='duplicate') result='<div class="access-result no" style="background:#3b2d12;color:#ffe08a">DUPLICATE CHECK-IN</div><div class="sub" style="margin-top:8px">'+esc(state.scannerReason||'already checked in')+'</div>';
    if(state.scannerState==='no') result='<div class="access-result no">ACCESS REJECTED</div><div class="sub" style="margin-top:8px">'+esc(state.scannerReason||'invalid pass')+'</div>';
    return '<h2>Gate scanner</h2>'+
      '<div class="scanner" data-action="camera-scan"></div>'+result+
      '<div class="action-row"><button class="action primary" data-action="camera-scan">Открыть камеру</button><label class="action ghost file-scan">Фото QR<input id="qr-file" type="file" accept="image/*" capture="environment"></label></div>'+
      '<div class="action-row"><button class="action ghost" data-action="checkin-current">Check-in текущего pass</button><button class="action ghost" data-action="checkin-current">Повторить → duplicate</button></div>'+
      '<div class="action-row"><button class="action ghost" data-action="offline-current">Offline verify</button><button class="action danger" data-action="tamper-current">Tampered</button></div>'+
      '<div class="action-row"><button class="action danger" data-action="test-revoked">Проверить revoked pass</button></div>'+
      '<div class="demo-note"><b>Authority.</b> ES256 signature · 2-minute rotating token · cached public key · cached revocation delta · server duplicate check-in.</div>';
  }

  function render(){
    var app=document.getElementById('app');
    if(!state.openingSeen){
      app.innerHTML=openingExperience();
      bind();
      return;
    }
    if(!state.onboarding){
      app.innerHTML=onboarding();
      bind();
      return;
    }
    var screen=state.tab==='today'?today():state.tab==='schedule'?schedule():state.tab==='live'?live():state.tab==='discover'?discover():me();
    if(state.tab==='live')loadStreamAuthority();
    else if(streamPollTimer){clearTimeout(streamPollTimer);streamPollTimer=null;}
    app.innerHTML='<div class="app">'+topbar()+screen+nav()+'</div>';
    if(state.tab==='me'){ ensurePass(); updateBackendIndicator(); }
    bind();
  }

  function onboarding(){
    return '<div class="app"><main style="padding-top:48px"><div class="eyebrow">MOSCOW FASHION WEEK · CONCEPT DEMO</div><h1>ОДИН ID.<br>ВСЯ НЕДЕЛЯ<br>МОДЫ.</h1><p class="sub">Показы, пропуск, LIVE, бренды, networking и личная программа — в одном мобильном опыте.</p>'+demoNote()+
      '<div class="card" style="margin-top:24px"><label class="eyebrow">Ваше имя</label><input id="onboard-name" class="input" style="margin-top:8px" value="'+esc(state.name)+'" /><div class="eyebrow" style="margin-top:18px">Роль для демо</div><div class="role-switcher">'+['Visitor','Buyer','Media','Designer'].map(function(r){return '<button class="role-btn '+(state.role===r?'active':'')+'" data-onboard-role="'+r+'">'+r+'</button>';}).join('')+'</div><div class="eyebrow" style="margin-top:18px">Интересы</div><div class="filters" style="margin-left:0;margin-right:0;padding:0">'+['Russian design','Luxury','Emerging','Retail','Technology'].map(function(x,i){return '<button class="chip '+(i<3?'active':'')+'">'+x+'</button>';}).join('')+'</div><button class="action primary" style="width:100%;margin-top:12px" data-action="finish-onboarding">Войти в MFW</button></div>'+
      '<p class="sub" style="font-size:11px;margin-top:16px">Продолжая, вы видите демонстрационный интерфейс. Реальные согласия и обработка данных будут подключаться отдельными юридическими сущностями.</p></main></div>';
  }

  function b64urlBytes(v){
    v=v.replace(/-/g,'+').replace(/_/g,'/');
    while(v.length%4)v+='=';
    var raw=atob(v),out=new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
    return out;
  }

  function decodePayload(token){
    try{
      var p=token.split('.')[1];
      return JSON.parse(new TextDecoder().decode(b64urlBytes(p)));
    }catch(_){return null;}
  }

  async function verifyOfflineToken(token){
    token=String(token||'').replace(/^MFW:/,'');
    var jwk;
    try{jwk=JSON.parse(localStorage.getItem('mfwAuthorityJwk')||'null');}catch(_){}
    if(!jwk)return {ok:false,reason:'public_key_not_cached'};
    var parts=token.split('.');
    if(parts.length!==3)return {ok:false,reason:'malformed'};
    var payload=decodePayload(token);
    if(!payload)return {ok:false,reason:'bad_payload'};
    if(payload.exp&&Date.now()>=payload.exp)return {ok:false,reason:'expired',payload:payload};
    try{
      var key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
      var data=new TextEncoder().encode(parts[0]+'.'+parts[1]);
      var ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,b64urlBytes(parts[2]),data);
      if(!ok)return {ok:false,reason:'bad_signature',payload:payload};
      var rev=[];try{rev=JSON.parse(localStorage.getItem('mfwRevocations')||'[]');}catch(_){}
      if(rev.some(function(x){return x.jti===payload.jti;}))return {ok:false,reason:'revoked_cached',payload:payload};
      return {ok:true,payload:payload};
    }catch(_){return {ok:false,reason:'offline_crypto_error',payload:payload};}
  }

  function openEvent(id){
    var e=demoEvents.filter(function(x){return x.id===id;})[0]; if(!e)return;
    var mine=state.myEvents.indexOf(id)>=0;
    openSheet('<div class="eyebrow">'+e.time+' · '+esc(e.type)+'</div><h1 style="font-size:42px">'+esc(e.name)+'</h1><p class="sub">'+esc(e.venue)+' · '+esc(e.access)+'</p>'+badge(e.status)+'<div class="action-row"><button class="action primary" data-action="toggle-event" data-id="'+e.id+'">'+(mine?'✓ В моей программе':'+ Добавить в программу')+'</button><button class="action ghost" data-action="route">Маршрут</button></div><h2>Доступ</h2><div class="card"><b>Credential → Entitlement → Event</b><p class="sub">В production решение о входе будет приниматься серверной моделью прав, а не названием роли пользователя.</p></div>');
  }

  function openBrand(id){
    var b=brands.filter(function(x){return x.id===id;})[0]; if(!b)return;
    var saved=state.savedBrands.indexOf(id)>=0;
    var pro=(state.role==='Buyer'||state.role==='Media');
    openSheet('<div class="brand-editorial-hero" style="background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.84)),url('+VISUALS.runway+')"><div><div class="eyebrow">'+esc(b.city)+' · '+esc(b.tag)+'</div><h1>'+esc(b.name)+'</h1><p>SS27 · Moscow Fashion Week</p></div></div>'+
      '<div class="brand-story"><div><div class="eyebrow">THE BRAND</div><h2>Новая российская мода<br>как культурный продукт.</h2><p class="sub">'+esc(b.desc)+'</p></div><div class="designer-portrait" style="background-image:url('+VISUALS.designer+')"><span>DESIGNER</span></div></div>'+
      '<div class="action-row"><button class="action primary" data-action="save-brand" data-id="'+b.id+'">'+(saved?'✓ Following':'Follow brand')+'</button><button class="action ghost" data-action="sponsor-experience">Share / Experience</button></div>'+
      '<div class="section-head"><h2>SS27 runway</h2><span class="link">32 looks</span></div><div class="brand-look-grid">'+[1,2,3,4,5,6].map(function(n){return '<button data-action="save-look" data-look="'+b.id+'-look-'+n+'">'+lookVisual(n)+'</button>';}).join('')+'</div>'+
      '<div class="brand-meta-grid"><div><span>SHOW</span><b>26 SEP · 17:00</b></div><div><span>CITY</span><b>'+esc(b.city)+'</b></div><div><span>FORMAT</span><b>Runway + showroom</b></div></div>'+
      (pro?'<div class="buyer-commerce-card"><div><div class="eyebrow">BUYER MODE · SERVER</div><b>Из вдохновения — в коммерческий контакт.</b><p>Line sheet · shortlist · meeting · follow-up.</p></div><div class="action-row"><button class="action primary" data-action="line-sheet" data-id="'+b.id+'">Line sheet</button><button class="action light" data-action="toggle-shortlist" data-id="'+b.id+'">'+(state.buyerShortlist.some(function(x){return x.id===b.id;})?'✓ Shortlisted':'＋ Shortlist')+'</button><button class="action light" data-action="meeting">Встреча</button><button class="action ghost" data-action="buyer-followup" data-id="'+b.id+'">Follow-up</button></div></div>':''));
  }

  function questions(){
    openSheet('<div class="eyebrow">LIVE Q&A · DEMO</div><h1 style="font-size:42px">ВОПРОСЫ<br>СПИКЕРУ</h1><div class="question"><button class="vote" data-action="upvote">▲ 127</button><b>Что байер оценивает в первые пять минут встречи?</b></div><div class="question"><button class="vote" data-action="upvote">▲ 84</button><b>Какие ошибки чаще всего мешают бренду получить заказ?</b></div><input class="input" style="margin-top:16px" placeholder="Ваш вопрос" /><button class="action primary" style="margin-top:10px" data-action="toast" data-message="Вопрос отправлен модератору">Отправить</button>');
  }

  function investorTour(){
    openSheet('<div class="kicker">Investor tour · 3 minutes</div><h1 style="font-size:42px">ПОКАЖИТЕ<br>НЕ ЭКРАНЫ,<br>А БИЗНЕС</h1>'+
      '<div class="demo-step"><span class="step-num">1</span><b>Audience experience</b><p>Откройте Today → LIVE → сохраните образ. Покажите, что трансляция превращается в структурированный fashion content.</p></div>'+
      '<div class="demo-step"><span class="step-num">2</span><b>Access authority</b><p>Откройте QR в профиле: роль и право входа разделены, пропуск готов к offline-проверке.</p></div>'+
      '<div class="demo-step"><span class="step-num">3</span><b>Buyer commerce</b><p>Переключите роль на Buyer → бренд → line sheet → meeting slot → private follow-up.</p></div>'+
      '<div class="demo-step"><span class="step-num">4</span><b>Organizer control</b><p>Переключите роль на Organizer: capacity, waitlist, push и partner-value analytics в одном cockpit.</p></div>'+
      '<div class="demo-step"><span class="step-num">5</span><b>Scale story</b><p>Объяснение инвестору: текущий стенд — front-end proof. Production подключает MFW ID, PostgreSQL, signed pass, CMS, streaming и analytics без смены UX-модели.</p></div>'+
      '<div class="phone-hint"><div class="symbol">＋</div><div><b>Для показа на iPhone</b><p>Откройте сайт в Safari → Поделиться → На экран «Домой». PWA запускается как отдельное приложение без браузерной панели.</p></div></div>'+
      '<div class="action-row"><button class="action primary" data-action="tour-start">Начать с Visitor</button><button class="action ghost" data-action="tour-organizer">Сразу Organizer</button></div>');
  }

  function postShowRecap(){
    openSheet('<div class="recap-hero" style="background-image:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.88)),url('+VISUALS.street+')"><div><div class="eyebrow">YOUR MFW · DAY 1</div><h1>ВАШ ДЕНЬ<br>В МОДЕ.</h1><p>Персональный recap после завершения программы.</p></div></div>'+
      '<div class="recap-stats"><div><b>'+state.myEvents.length+'</b><span>события</span></div><div><b>'+state.savedLooks.length+'</b><span>looks</span></div><div><b>'+state.savedBrands.length+'</b><span>brands</span></div><div><b>'+state.connections+'</b><span>contacts</span></div></div>'+
      '<div class="section-head"><h2>Вы сохранили</h2><span class="link">Сегодня</span></div><div class="visual-look-rail">'+[11,14,15].map(function(n){return '<div class="visual-look">'+lookVisual(n)+'</div>';}).join('')+'</div>'+
      '<div class="card premium-card"><div class="eyebrow">TOMORROW FOR YOU</div><div class="event-name">New Russian Names · 12:00</div><div class="sub">Рекомендация на основе сохранённых вами образов и брендов.</div><button class="action primary" data-action="toast" data-message="Добавлено в программу">Добавить на завтра</button></div>');
  }

  function sponsorExperience(){
    openSheet('<div class="sponsor-experience" style="background-image:linear-gradient(180deg,rgba(0,0,0,.14),rgba(0,0,0,.9)),url('+VISUALS.backstage+')"><div class="eyebrow">NATIVE PARTNER EXPERIENCE · DEMO</div><h1>БРЕНД<br>ВНУТРИ<br>СОБЫТИЯ.</h1><p>Не баннер, а отдельный fashion experience: backstage story, challenge, lounge, gift, AR/try-on и измеримый переход к бренду.</p><div class="sponsor-metrics"><span>24.8K reach</span><span>6.1K opens</span><span>487 intent</span></div></div>');
  }

  function notifications(){
    openSheet('<div class="eyebrow">Notification center</div><h1 style="font-size:42px">СЕГОДНЯ</h1><div class="card"><b>Критическое</b><p class="sub">Demo: при переносе зала или времени уведомление появится здесь и в push.</p></div><div class="card"><b>LIVE</b><p class="sub">Opening Runway уже в эфире.</p></div><div class="card"><b>Персональное</b><p class="sub">До сохранённой вами лекции 45 минут.</p></div>');
  }

  function openSheet(html){
    closeSheet();
    var wrap=document.createElement('div');wrap.className='modal';wrap.id='modal';
    wrap.innerHTML='<div class="sheet"><div class="sheet-head"><div class="eyebrow">MFW</div><button class="close" data-action="close">×</button></div>'+html+'</div>';
    document.body.appendChild(wrap);bind();
  }
  function closeSheet(){
    stopCameraScanner();
    var m=document.getElementById('modal');if(m)m.remove();
  }

  function softHaptic(){
    document.documentElement.classList.remove('tap-feedback');
    void document.documentElement.offsetWidth;
    document.documentElement.classList.add('tap-feedback');
    if(navigator.vibrate)navigator.vibrate(8);
  }

  function toast(msg){
    var old=document.querySelector('.toast');if(old)old.remove();
    var t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);
    setTimeout(function(){if(t.parentNode)t.remove();},1800);
  }

  function setRole(r){state.role=r;state.session=null;state.sessionRole=null;state.passToken=null;state.passPayload=null;persist();render();toast('Demo role: '+r);track('role_switched',{role:r});}
  function toggleEvent(id){
    var i=state.myEvents.indexOf(id);
    if(i>=0){state.myEvents.splice(i,1);toast('Удалено из программы');}
    else{state.myEvents.push(id);toast('Добавлено в вашу программу');}
    persist();closeSheet();render();track(i>=0?'event_removed':'event_saved',{eventId:id});
  }
  function saveLook(id){
    var i=state.savedLooks.indexOf(id);
    if(i>=0){state.savedLooks.splice(i,1);toast('Образ удалён из сохранённых');}
    else{state.savedLooks.push(id);toast('Образ сохранён');}
    persist();render();track(i>=0?'look_unsaved':'look_saved',{lookId:id});
  }
  function saveBrand(id){
    var i=state.savedBrands.indexOf(id);
    if(i>=0){state.savedBrands.splice(i,1);toast('Подписка снята');}
    else{state.savedBrands.push(id);toast('Бренд добавлен');}
    persist();closeSheet();render();track(i>=0?'brand_unfollowed':'brand_followed',{brandId:id});
  }
  async function loadBuyerShortlist(){
    if(state.commerceLoading||state.role!=='Buyer')return;
    state.commerceLoading=true;
    try{
      var buyerId=state.userId||'demo_buyer';
      var out=await api('/v1/buyer/shortlist?buyerId='+encodeURIComponent(buyerId));
      state.buyerShortlist=out.data||[];
      if(state.tab==='me'&&state.role==='Buyer')setTimeout(function(){render();},0);
    }catch(_){}
    state.commerceLoading=false;
  }

  async function toggleShortlist(brandId){
    try{
      var exists=state.buyerShortlist.some(function(x){return x.id===brandId;});
      var out=await api('/v1/buyer/shortlist',{method:'POST',body:JSON.stringify({
        buyerId:state.userId||'demo_buyer',
        brandId:brandId,
        action:exists?'remove':'save'
      })});
      await loadBuyerShortlistForce();
      closeSheet();
      render();
      toast(out.saved?'Бренд добавлен в shortlist':'Бренд удалён из shortlist');
    }catch(err){toast('Shortlist unavailable');}
  }

  async function loadBuyerShortlistForce(){
    try{
      var out=await api('/v1/buyer/shortlist?buyerId='+encodeURIComponent(state.userId||'demo_buyer'));
      state.buyerShortlist=out.data||[];
    }catch(_){}
  }

  async function openLineSheet(brandId){
    openSheet('<div class="eyebrow">LINE SHEET · SERVER</div><h1 style="font-size:42px">LOADING<br>COLLECTION</h1><div class="card skeleton" style="height:180px"></div>');
    try{
      var out=await api('/v1/line-sheets/'+encodeURIComponent(brandId||'b1'));
      var sheet=out.data;
      var rows=(sheet.looks||[]).map(function(l){
        return '<div class="line-sheet-row"><div><b>'+esc(l.title)+'</b><span>Wholesale</span></div><strong>'+Number(l.wholesale||0).toLocaleString('ru-RU')+' ₽</strong><em>RRP '+Number(l.rrp||0).toLocaleString('ru-RU')+' ₽</em></div>';
      }).join('');
      openSheet('<div class="eyebrow">LINE SHEET · v'+esc(sheet.version)+'</div><h1 style="font-size:42px">SS27<br>BUYING</h1>'+
        '<div class="line-sheet-summary"><div><span>CURRENCY</span><b>'+esc(sheet.currency)+'</b></div><div><span>TERMS</span><b>'+esc(sheet.terms)+'</b></div></div>'+
        '<div class="line-sheet-list">'+rows+'</div>'+
        '<div class="action-row"><button class="action primary" data-action="toggle-shortlist" data-id="'+esc(brandId||'b1')+'">＋ Shortlist</button><button class="action ghost" data-action="meeting">Meeting</button></div>');
    }catch(err){
      openSheet('<div class="eyebrow">LINE SHEET</div><h1 style="font-size:42px">TEMPORARILY<br>UNAVAILABLE</h1><div class="premium-empty"><b>Не удалось загрузить данные</b><p>Server authority недоступен.</p></div>');
    }
  }

  async function buyerFollowup(brandId){
    try{
      var out=await api('/v1/leads',{method:'POST',body:JSON.stringify({
        brandId:brandId||'b1',
        buyerId:state.userId||'demo_buyer',
        source:'brand_profile',
        stage:'follow_up',
        note:'Investor demo follow-up'
      })});
      toast('Follow-up lead создан · '+out.data.id.slice(-6));
      track('buyer_followup',{brandId:brandId});
    }catch(_){toast('Follow-up unavailable');}
  }

  function meeting(){
    if(state.role!=='Buyer' && state.role!=='Media'){toast('В demo встреча доступна профессиональным ролям');return;}
    if(state.meeting){openSheet('<div class="eyebrow">PRIVATE NOTE</div><h1 style="font-size:40px">MFW / NEW 01</h1><textarea class="input" style="height:120px" placeholder="Private buyer note"></textarea><button class="action primary" style="margin-top:10px" data-action="toast" data-message="Private note сохранена">Сохранить</button>');return;}
    openSheet('<div class="eyebrow">REQUEST MEETING</div><h1 style="font-size:40px">ВЫБЕРИТЕ<br>СЛОТ</h1><div class="action-row"><button class="action ghost" data-action="confirm-meeting">14:10</button><button class="action primary" data-action="confirm-meeting">14:30</button><button class="action ghost" data-action="confirm-meeting">15:20</button></div>');
  }

  async function ensureServerSession(roleOverride){
    var wanted=roleOverride||state.role;
    if(state.session&&state.sessionRole===wanted)return state.session;
    var auth=await api('/v1/auth/demo',{method:'POST',body:JSON.stringify({name:state.name,role:wanted})});
    state.session=auth.session;state.userId=auth.user.id;state.sessionRole=wanted;state.authStatus='server';
    return state.session;
  }

  async function adminApi(path, options){
    var token=await ensureServerSession('Organizer');
    var opts=options||{};
    opts.headers=Object.assign({},opts.headers||{},{Authorization:'Bearer '+token});
    return api('/v1/admin'+path,opts);
  }

  function adminEventRow(e){
    return '<div class="card" style="margin-top:10px"><div class="event-top"><div><div class="eyebrow">'+esc(e.id||'EVENT')+' · '+esc(e.status||'')+'</div><div class="event-name">'+esc(e.title||'Untitled')+'</div><div class="sub">'+esc(e.venue||'')+' · '+esc(e.startsAt||'')+'</div></div><span class="badge '+((e.status==='live'||e.status==='published')?'open':'wait')+'">'+esc(String(e.capacity||0))+' cap</span></div><div class="action-row"><button class="action ghost" data-action="admin-delay" data-id="'+esc(e.id)+'">+15 мин</button><button class="action ghost" data-action="admin-move" data-id="'+esc(e.id)+'">Сменить зал</button></div></div>';
  }

  function adminAccreditationRow(a){
    return '<div class="card" style="margin-top:10px"><div class="event-top"><div><div class="eyebrow">'+esc(a.kind)+' · '+esc(a.organisation)+'</div><div class="event-name">'+esc(a.name)+'</div><div class="sub">Status: '+esc(a.status)+'</div></div><span class="badge '+(a.status==='approved'?'open':a.status==='pending'?'wait':'live')+'">'+esc(a.status.toUpperCase())+'</span></div>'+(a.status==='pending'?'<div class="action-row"><button class="action primary" data-action="admin-approve" data-id="'+esc(a.id)+'">Approve</button><button class="action danger" data-action="admin-reject" data-id="'+esc(a.id)+'">Reject</button></div>':'')+'</div>';
  }

  async function openAdminConsole(){
    openSheet('<div class="eyebrow">MFW ADMIN CONSOLE</div><h1 style="font-size:40px">LIVE<br>OPERATIONS</h1><div class="card"><div class="sub">Загружаем серверное состояние…</div></div>');
    try{
      var data=await Promise.all([adminApi('/overview'),adminApi('/events'),adminApi('/accreditations')]);
      var o=data[0].data,events=data[1].data||[],acc=data[2].data||[];
      var html='<div class="eyebrow">MFW ADMIN CONSOLE · SERVER</div><h1 style="font-size:40px">LIVE<br>OPERATIONS</h1>'+
        '<div class="value-grid"><div class="value-card"><div class="n">'+esc(o.activeUsers)+'</div><small>active users</small></div><div class="value-card"><div class="n">'+esc(o.live.occupancyPct)+'%</div><small>occupancy</small></div><div class="value-card"><div class="n">'+esc(o.live.waitlist)+'</div><small>waitlist</small></div></div>'+
        '<h2>Programme CMS</h2>'+events.map(adminEventRow).join('')+
        '<div class="card" style="margin-top:10px"><div class="eyebrow">LIVE CONTROL</div><div class="metric-row"><b>Checked in</b><strong>'+esc(o.live.checkedIn)+'</strong></div><div class="metric-row"><b>Waitlist</b><strong>'+esc(o.live.waitlist)+'</strong></div><div class="action-row"><button class="action primary" data-action="admin-release">Release 12</button><button class="action ghost" data-action="admin-push">Critical push</button><button class="action ghost" data-action="admin-invite">Send invite</button></div><div class="action-row"><button class="action danger" data-action="admin-revoke">Revoke current pass</button></div></div>'+
        '<h2>Accreditation</h2>'+acc.map(adminAccreditationRow).join('')+
        '<div class="demo-note"><b>Server-backed demo.</b> Все кнопки выше меняют authority state и повторное открытие Console показывает результат.</div>';
      openSheet(html);
    }catch(err){
      openSheet('<div class="eyebrow">MFW ADMIN CONSOLE</div><h1 style="font-size:40px">CONTROL<br>UNAVAILABLE</h1><div class="card"><div class="sub">'+esc(String(err&&err.message||err))+'</div></div>');
    }
  }

  async function adminRelease(){
    try{await adminApi('/waitlist/release',{method:'POST',body:JSON.stringify({eventId:'e1',count:12})});toast('12 мест освобождены сервером');openAdminConsole();}catch(e){toast('Admin action failed');}
  }
  async function adminPush(){
    try{await adminApi('/notifications',{method:'POST',body:JSON.stringify({category:'critical',title:'Programme update',body:'Opening Runway: updated operational notice'})});toast('Critical push создан');}catch(e){toast('Push failed');}
  }
  async function adminInvite(){
    try{await adminApi('/invitations',{method:'POST',body:JSON.stringify({eventId:'e1',recipient:'investor-demo@mfw.local'})});toast('Invitation sent');}catch(e){toast('Invite failed');}
  }
  async function adminRevokeCurrent(){
    try{
      if(!state.passToken)await ensurePass();
      if(!state.passToken||!state.passPayload)throw new Error('pass_unavailable');
      var revokedToken=state.passToken;
      var jti=state.passPayload.jti;
      var session=await ensureServerSession('Organizer');
      await api('/v1/passes/revoke',{method:'POST',headers:{Authorization:'Bearer '+session},body:JSON.stringify({jti:jti,reason:'investor_demo_revoke'})});
      localStorage.setItem('mfwRevokedDemoToken',revokedToken);
      state.passToken=null;state.passPayload=null;
      await cacheOfflineAuthority();
      toast('Pass revoked · сохранён для Staff demo');
      openAdminConsole();
    }catch(e){toast('Revoke failed');}
  }
  async function adminChangeEvent(id,kind){
    var body=kind==='delay'?{startsAt:'2026-09-26T17:15:00+03:00',status:'delayed'}:{venue:'Manege · Hall 3'};
    try{await adminApi('/events/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(body)});toast(kind==='delay'?'Показ перенесён на +15 мин':'Зал изменён');openAdminConsole();}catch(e){toast('Programme update failed');}
  }
  async function adminAccreditation(id,status){
    try{await adminApi('/accreditations/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:status})});toast('Accreditation '+status);openAdminConsole();}catch(e){toast('Accreditation update failed');}
  }

  async function completeOnboarding(){
    var input=document.getElementById('onboard-name');
    if(input&&input.value.trim())state.name=input.value.trim();
    try{
      var auth=await api('/v1/auth/demo',{method:'POST',body:JSON.stringify({name:state.name,role:state.role})});
      state.session=auth.session;
      state.sessionRole=state.role;
      state.userId=auth.user.id;
      state.authStatus='server';
    }catch(_){
      state.session=null;
      state.userId=null;
      state.authStatus='local';
    }
    state.onboarding=true;
    localStorage.setItem('mfwOnboarded','1');
    persist();
    render();
    toast(state.authStatus==='server'?'MFW ID создан сервером':'MFW ID создан локально · API warming');
    track('onboarding_completed',{role:state.role,authority:state.authStatus});
  }

  async function checkinToken(token){
    token=String(token||'').replace(/^MFW:/,'');
    try{
      var out=await api('/v1/checkins',{method:'POST',body:JSON.stringify({token:token,eventId:'e1',scannerId:'iphone-investor-demo'})});
      state.scannerState='valid';
      state.scannerReason='Server check-in · '+new Date(out.checkedInAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    }catch(err){
      if(err.status===409){
        state.scannerState='duplicate';
        state.scannerReason='same user + event already checked in';
      }else{
        state.scannerState='no';
        state.scannerReason=String((err.data&&err.data.reason)||err.message||'rejected');
      }
    }
    render();
  }

  async function checkinCurrent(tamper){
    if(!state.passToken)await ensurePass();
    if(!state.passToken){state.scannerState='no';state.scannerReason='pass unavailable';render();return;}
    var token=state.passToken;
    if(tamper)token=token.slice(0,-2)+'xx';
    await checkinToken(token);
  }

  async function testRevokedPass(){
    var token=localStorage.getItem('mfwRevokedDemoToken');
    if(!token){state.scannerState='no';state.scannerReason='Сначала revoke pass в Organizer → Admin Console';render();return;}
    await checkinToken(token);
  }

  async function offlineCheckinCurrent(){
    if(!state.passToken)await ensurePass();
    if(!state.passToken){state.scannerState='no';state.scannerReason='pass unavailable';render();return;}
    var result=await verifyOfflineToken(state.passToken);
    if(!result.ok){state.scannerState='no';state.scannerReason=result.reason;render();return;}
    var key='e1:'+result.payload.sub;
    var offline=[];try{offline=JSON.parse(localStorage.getItem('mfwOfflineCheckins')||'[]');}catch(_){}
    if(offline.indexOf(key)>=0){
      state.scannerState='duplicate';state.scannerReason='duplicate detected in this device offline cache';render();return;
    }
    offline.push(key);localStorage.setItem('mfwOfflineCheckins',JSON.stringify(offline));
    state.scannerState='offline';
    state.scannerReason='ES256 valid · revocation cache checked · queued for sync';
    render();
  }

  function stopCameraScanner(){
    if(scannerFrame){cancelAnimationFrame(scannerFrame);scannerFrame=null;}
    if(scannerStream){scannerStream.getTracks().forEach(function(t){t.stop();});scannerStream=null;}
  }

  async function cameraScan(){
    openSheet('<div class="eyebrow">GATE SCANNER · CAMERA</div><h1 style="font-size:40px">НАВЕДИТЕ<br>НА MFW PASS</h1><div class="scanner-camera"><video id="qr-video" playsinline muted></video><div class="frame"></div><div class="scan-line"></div></div><canvas id="qr-canvas" hidden></canvas><div id="camera-status" class="scan-status">Запрашиваем доступ к камере…</div>');
    var video=document.getElementById('qr-video'),canvas=document.getElementById('qr-canvas'),status=document.getElementById('camera-status');
    try{
      scannerStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      video.srcObject=scannerStream;await video.play();
      status.textContent='Камера активна · ищем QR';
      var ctx=canvas.getContext('2d',{willReadFrequently:true});
      function tick(){
        if(video.readyState===video.HAVE_ENOUGH_DATA){
          canvas.width=video.videoWidth;canvas.height=video.videoHeight;
          ctx.drawImage(video,0,0,canvas.width,canvas.height);
          var img=ctx.getImageData(0,0,canvas.width,canvas.height);
          var code=window.jsQR?window.jsQR(img.data,img.width,img.height,{inversionAttempts:'dontInvert'}):null;
          if(code&&code.data){
            status.textContent='QR найден';
            var token=String(code.data).replace(/^MFW:/,'');
            stopCameraScanner();closeSheet();checkinToken(token);return;
          }
        }
        scannerFrame=requestAnimationFrame(tick);
      }
      tick();
    }catch(err){
      status.textContent='Камера недоступна: '+String(err&&err.message||err);
    }
  }

  async function scanImageFile(file){
    if(!file||!window.jsQR)return;
    try{
      var bitmap=await createImageBitmap(file);
      var canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
      var ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);
      var img=ctx.getImageData(0,0,canvas.width,canvas.height);
      var code=window.jsQR(img.data,img.width,img.height,{inversionAttempts:'attemptBoth'});
      if(!code)throw new Error('QR не найден');
      checkinToken(String(code.data).replace(/^MFW:/,''));
    }catch(err){
      state.scannerState='no';state.scannerReason=String(err&&err.message||err);render();
    }
  }

  async function createMeeting(){
    try{
      await api('/v1/meetings',{method:'POST',body:JSON.stringify({brandId:'b1',buyerId:state.userId||'demo_buyer',slot:'14:30'})});
      await api('/v1/leads',{method:'POST',body:JSON.stringify({brandId:'b1',buyerId:state.userId||'demo_buyer',source:'meeting',stage:'meeting',note:'Showroom meeting confirmed'})});
      state.meeting=true;closeSheet();render();toast('Встреча подтверждена сервером: 14:30');track('meeting_confirmed',{brandId:'b1',slot:'14:30'});
    }catch(_){
      toast('API недоступен — встреча не подтверждена');
    }
  }

  function bind(){
    document.querySelectorAll('[data-tab]').forEach(function(el){el.onclick=function(){state.tab=el.getAttribute('data-tab');closeSheet();render();window.scrollTo(0,0);};});
    document.querySelectorAll('[data-discover]').forEach(function(el){el.onclick=function(){state.discoverTab=el.getAttribute('data-discover');state.tab='discover';render();};});
    document.querySelectorAll('[data-role]').forEach(function(el){el.onclick=function(){setRole(el.getAttribute('data-role'));};});
    document.querySelectorAll('[data-onboard-role]').forEach(function(el){el.onclick=function(){state.role=el.getAttribute('data-onboard-role');render();};});
    document.querySelectorAll('[data-action]').forEach(function(el){el.onclick=function(ev){
      ev.stopPropagation();
      softHaptic();
      var a=el.getAttribute('data-action');
      if(a==='close')closeSheet();
      else if(a==='enter-experience'){state.openingSeen=true;localStorage.setItem('mfwOpeningSeen','1');render();}
      else if(a==='event')openEvent(el.getAttribute('data-id'));
      else if(a==='toggle-event')toggleEvent(el.getAttribute('data-id'));
      else if(a==='save-look')saveLook(el.getAttribute('data-look'));
      else if(a==='brand')openBrand(el.getAttribute('data-id'));
      else if(a==='save-brand')saveBrand(el.getAttribute('data-id'));
      else if(a==='notifications')notifications();
      else if(a==='investor-tour')investorTour();
      else if(a==='post-show-recap')postShowRecap();
      else if(a==='sponsor-experience')sponsorExperience();
      else if(a==='admin-console')openAdminConsole();
      else if(a==='admin-release')adminRelease();
      else if(a==='admin-push')adminPush();
      else if(a==='admin-invite')adminInvite();
      else if(a==='admin-revoke')adminRevokeCurrent();
      else if(a==='admin-delay')adminChangeEvent(el.getAttribute('data-id'),'delay');
      else if(a==='admin-move')adminChangeEvent(el.getAttribute('data-id'),'move');
      else if(a==='admin-approve')adminAccreditation(el.getAttribute('data-id'),'approved');
      else if(a==='admin-reject')adminAccreditation(el.getAttribute('data-id'),'rejected');
      else if(a==='tour-start'){state.openingSeen=true;localStorage.setItem('mfwOpeningSeen','1');state.role='Visitor';state.tab='today';persist();closeSheet();render();toast('Investor tour: Visitor experience');}
      else if(a==='tour-organizer'){state.openingSeen=true;localStorage.setItem('mfwOpeningSeen','1');state.role='Organizer';state.tab='me';persist();closeSheet();render();toast('Investor tour: Organizer cockpit');}
      else if(a==='questions')questions();
      else if(a==='meeting')meeting();
      else if(a==='confirm-meeting'){createMeeting();}
      else if(a==='connect'){state.connections+=1;render();toast('Запрос на связь отправлен');}
      else if(a==='line-sheet')openLineSheet(el.getAttribute('data-id')||'b1');
      else if(a==='toggle-shortlist')toggleShortlist(el.getAttribute('data-id')||'b1');
      else if(a==='buyer-followup')buyerFollowup(el.getAttribute('data-id')||'b1');
      else if(a==='route')toast('Demo: маршрут построен');
      else if(a==='toast')toast(el.getAttribute('data-message')||'Готово');
      else if(a==='saved-looks'){state.tab='me';render();}
      else if(a==='camera-scan'){cameraScan();}
      else if(a==='checkin-current'){checkinCurrent(false);}
      else if(a==='offline-current'){offlineCheckinCurrent();}
      else if(a==='tamper-current'){checkinCurrent(true);}
      else if(a==='test-revoked'){testRevokedPass();}
      else if(a==='restart-onboarding'){localStorage.removeItem('mfwOnboarded');state.onboarding=false;render();}
      else if(a==='finish-onboarding'){completeOnboarding();}
      else if(a==='upvote')toast('Голос учтён в demo');
    };});
    var fileInput=document.getElementById('qr-file');
    if(fileInput)fileInput.onchange=function(){if(fileInput.files&&fileInput.files[0])scanImageFile(fileInput.files[0]);};
  }

  if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}
  render();
  checkBackend();
})();