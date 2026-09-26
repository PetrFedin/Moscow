(function(){
'use strict';
var API='https://moscow-fashion-week-authority.onrender.com';
var state={tab:'overview',session:null,health:null,deep:null,overview:null,events:[],accreditations:[],streams:[],commerce:null};

async function req(path,opts){
  opts=opts||{};
  opts.headers=Object.assign({'Content-Type':'application/json'},opts.headers||{});
  var controller=new AbortController();
  var timer=setTimeout(function(){controller.abort();},6500);
  opts.signal=controller.signal;
  var res;
  try{res=await fetch(API+path,opts);}finally{clearTimeout(timer);}
  var data=await res.json().catch(function(){return{};});
  if(!res.ok){
    var err=new Error(data.error||data.reason||('http_'+res.status));
    err.status=res.status;err.data=data;throw err;
  }
  return data;
}
async function getSession(){
  if(state.session)return state.session;
  var auth=await req('/v1/auth/demo',{method:'POST',body:JSON.stringify({name:'MFW Admin Demo',role:'Organizer'})});
  state.session=auth.session;
  return state.session;
}
async function admin(path,opts){
  var token=await getSession();
  opts=opts||{};
  opts.headers=Object.assign({},opts.headers||{},{Authorization:'Bearer '+token});
  return req('/v1/admin'+path,opts);
}
function esc(v){
  return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
  });
}
function badge(s){
  var c=(s==='live'||s==='published'||s==='approved')?'live':(s==='pending'||s==='delayed')?'wait':s==='rejected'?'red':'';
  return '<span class="badge '+c+'">'+esc(String(s||'').toUpperCase())+'</span>';
}
function toast(message){
  var old=document.querySelector('.toast');if(old)old.remove();
  var t=document.createElement('div');t.className='toast';t.textContent=message;
  document.body.appendChild(t);setTimeout(function(){t.remove();},1800);
}
function nav(){
  var tabs=[
    ['overview','Overview'],
    ['programme','Programme'],
    ['streaming','Streaming'],
    ['commerce','Commerce'],
    ['accreditation','Accreditation'],
    ['communications','Communications'],
    ['access','Access authority']
  ];
  return tabs.map(function(t){
    return '<button class="'+(state.tab===t[0]?'active':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>';
  }).join('');
}
function shell(content){
  var title={
    overview:'Operations overview',
    programme:'Programme CMS',
    streaming:'Streaming control',
    commerce:'Buyer & brand commerce',
    accreditation:'Accreditation',
    communications:'Communications',
    access:'Access authority'
  }[state.tab];
  return '<div class="shell">'+
    '<aside class="sidebar"><div class="brand"><span>MOSCOW</span><span>FASHION WEEK</span></div>'+
      '<div class="season">Admin Console · Investor Build</div><div class="nav">'+nav()+'</div>'+
      '<div class="side-foot">Server-backed demo<br>ES256 · QR · check-in · live operations</div></aside>'+
    '<section class="main"><header class="top"><h1>'+title+'</h1>'+
      '<div class="status"><span class="dot '+(state.health?'online':'')+'"></span><span>'+(state.health?'AUTHORITY ONLINE':'CONNECTING')+'</span>'+
      '<button class="btn" data-action="refresh">Refresh</button></div></header>'+
      '<div class="content">'+content+'</div></section></div>';
}
function overviewScreen(){
  var o=state.overview||{activeUsers:'—',programmeEngagementPct:'—',buyerActions:'—',live:{occupancyPct:0,checkedIn:'—',waitlist:'—'}};
  var d=state.deep||{};
  return '<div class="eyebrow">Organizer command layer</div><div class="hero-title">LIVE<br>OPERATIONS</div>'+
    '<div class="console-banner"><div><b>One operating system for Fashion Week</b>'+
    '<p>Programme → access → attendance → content → commerce → sponsor reporting.</p></div>'+
    '<div class="health"><span class="'+(d.status==='pass'?'ok':'')+'">Deep test '+esc(d.status||'…')+'</span>'+
    '<span class="'+(state.health&&state.health.es256?'ok':'')+'">ES256</span>'+
    '<span class="'+(state.health&&state.health.duplicateCheckin?'ok':'')+'">Duplicate gate</span></div></div>'+
    '<div class="grid4">'+
      '<div class="metric"><div class="eyebrow">Audience</div><strong>'+esc(o.activeUsers)+'</strong><span>demo active users</span></div>'+
      '<div class="metric"><div class="eyebrow">Engagement</div><strong>'+esc(o.programmeEngagementPct)+'%</strong><span>programme engagement</span></div>'+
      '<div class="metric"><div class="eyebrow">Commerce</div><strong>'+esc(o.buyerActions)+'</strong><span>buyer actions</span></div>'+
      '<div class="metric"><div class="eyebrow">Occupancy</div><strong>'+esc(o.live.occupancyPct)+'%</strong><span>Opening Runway</span></div>'+
    '</div>'+
    '<div class="columns"><div class="card"><div class="eyebrow">Opening Runway · LIVE</div><h2>Capacity & arrivals</h2>'+
      '<div class="capacity"><span style="width:'+esc(o.live.occupancyPct)+'%"></span></div>'+
      '<div class="row"><span>Checked in</span><strong>'+esc(o.live.checkedIn)+'</strong></div>'+
      '<div class="row"><span>Waitlist</span><strong>'+esc(o.live.waitlist)+'</strong></div>'+
      '<div class="actions"><button class="btn primary" data-action="release">Release 12 seats</button>'+
      '<button class="btn" data-action="push">Critical push</button><button class="btn" data-action="invite">Send invitation</button></div></div>'+
    '<div class="card"><div class="eyebrow">Investor proof</div><h2>Authoritative today</h2>'+
      '<div class="row"><span>Signed pass</span><b>ES256</b></div><div class="row"><span>QR</span><b>rotating</b></div>'+
      '<div class="row"><span>Offline verify</span><b>public JWK</b></div><div class="row"><span>Duplicate check-in</span><b>server</b></div>'+
      '<div class="row"><span>Persistence</span><b>'+esc(state.health?state.health.dataMode:'—')+'</b></div></div></div>';
}
function programmeScreen(){
  return '<div class="eyebrow">Programme authority</div><div class="hero-title">PROGRAMME<br>CMS</div>'+
    '<div class="card">'+state.events.map(function(e){
      return '<div class="event"><div class="event-head"><div><div class="eyebrow">'+esc(e.id)+' · '+esc(e.type)+'</div>'+
        '<div class="event-name">'+esc(e.title)+'</div><div class="sub">'+esc(e.venue)+' · '+esc(e.startsAt)+'</div></div>'+badge(e.status)+'</div>'+
        '<div class="actions"><button class="btn" data-action="delay" data-id="'+esc(e.id)+'">+15 min</button>'+
        '<button class="btn" data-action="move" data-id="'+esc(e.id)+'">Move hall</button>'+
        '<button class="btn primary" data-action="golive" data-id="'+esc(e.id)+'">Go live</button></div></div>';
    }).join('')+'</div>';
}
function streamingScreen(){
  var stream=state.streams[0]||{id:'stream_e1',status:'offline',currentLook:0,totalLooks:32,replayAvailable:false};
  var pct=stream.totalLooks?Math.round((Number(stream.currentLook||0)/Number(stream.totalLooks))*100):0;
  return '<div class="eyebrow">Runway direction</div><div class="hero-title">STREAMING<br>AUTHORITY</div>'+
    '<div class="stream-console"><div class="stream-preview" style="background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.78)),url(https://images.unsplash.com/photo-1742237424056-ea5cbb674d66?auto=format&fit=crop&w=1400&q=86)">'+
      '<div class="stream-preview-top">'+badge(stream.status)+'<span>EVENT e1 · HALL 1</span></div>'+
      '<div class="stream-preview-bottom"><div><span>NOW ON RUNWAY</span><strong>LOOK '+String(stream.currentLook||0).padStart(2,'0')+' / '+esc(stream.totalLooks||32)+'</strong></div><b>'+pct+'%</b></div>'+
    '</div>'+
    '<div class="card"><div class="eyebrow">DIRECTOR CONTROLS</div><h2>Opening Runway</h2>'+
      '<div class="row"><span>Status</span>'+badge(stream.status)+'</div>'+
      '<div class="row"><span>Current look</span><strong>'+esc(stream.currentLook||0)+'</strong></div>'+
      '<div class="row"><span>Replay</span><b>'+(stream.replayAvailable?'READY':'OFF')+'</b></div>'+
      '<div class="actions"><button class="btn primary" data-action="next-look" data-id="'+esc(stream.id)+'">NEXT LOOK</button>'+
      '<button class="btn" data-action="stream-live" data-id="'+esc(stream.id)+'">LIVE</button>'+
      '<button class="btn" data-action="stream-replay" data-id="'+esc(stream.id)+'">REPLAY</button></div>'+
      '<div class="capacity"><span style="width:'+pct+'%"></span></div><p class="sub">Изменение currentLook сразу появляется на iPhone LIVE через public stream authority.</p></div></div>';
}
function commerceScreen(){
  var c=state.commerce||{shortlistActions:0,lineSheetRequests:0,meetingRequests:0,leads:[],funnel:{brandViews:0,collectionOpens:0,savedLooks:0,shortlists:0,meetings:0,qualified:0}};
  var f=c.funnel||{};
  var max=Math.max(1,Number(f.brandViews||1));
  function funnelRow(label,value){
    var pct=Math.max(2,Math.round((Number(value||0)/max)*100));
    return '<div class="funnel-row"><span>'+label+'</span><div><i style="width:'+pct+'%"></i></div><strong>'+esc(value||0)+'</strong></div>';
  }
  return '<div class="eyebrow">Commercial operating layer</div><div class="hero-title">BUYER / BRAND<br>COMMERCE</div>'+
    '<div class="grid4"><div class="metric"><div class="eyebrow">Shortlists</div><strong>'+esc(c.shortlistActions)+'</strong><span>server actions</span></div>'+
    '<div class="metric"><div class="eyebrow">Line sheets</div><strong>'+esc(c.lineSheetRequests)+'</strong><span>requests</span></div>'+
    '<div class="metric"><div class="eyebrow">Meetings</div><strong>'+esc(c.meetingRequests)+'</strong><span>buyer requests</span></div>'+
    '<div class="metric"><div class="eyebrow">Qualified</div><strong>'+esc(f.qualified||0)+'</strong><span>leads</span></div></div>'+
    '<div class="columns"><div class="card"><div class="eyebrow">FUNNEL</div><h2>Attention → commercial intent</h2>'+
      funnelRow('Brand views',f.brandViews)+funnelRow('Collection opens',f.collectionOpens)+funnelRow('Saved looks',f.savedLooks)+funnelRow('Shortlists',f.shortlists)+funnelRow('Meetings',f.meetings)+funnelRow('Qualified',f.qualified)+
    '</div><div class="card"><div class="eyebrow">LATEST LEADS</div><h2>Buyer actions</h2>'+
      ((c.leads||[]).length?(c.leads||[]).slice(0,8).map(function(l){return '<div class="lead-row"><div><b>'+esc(l.brandId)+'</b><span>'+esc(l.source)+' · '+esc(l.stage)+'</span></div><small>'+esc(l.buyerId)+'</small></div>';}).join(''):'<div class="sub">No live leads yet.</div>')+
    '</div></div>';
}
function accreditationScreen(){
  return '<div class="eyebrow">People & permissions</div><div class="hero-title">ACCREDITATION</div>'+
    '<div class="card"><table class="table"><thead><tr><th>Name</th><th>Role</th><th>Organisation</th><th>Status</th><th>Decision</th></tr></thead><tbody>'+
    state.accreditations.map(function(a){
      return '<tr><td><b>'+esc(a.name)+'</b></td><td>'+esc(a.kind)+'</td><td>'+esc(a.organisation)+'</td><td>'+badge(a.status)+'</td><td>'+
      (a.status==='pending'?'<button class="btn primary" data-action="approve" data-id="'+esc(a.id)+'">Approve</button> <button class="btn danger" data-action="reject" data-id="'+esc(a.id)+'">Reject</button>':'—')+
      '</td></tr>';
    }).join('')+'</tbody></table></div>';
}
function communicationsScreen(){
  return '<div class="eyebrow">Audience operations</div><div class="hero-title">COMMUNICATIONS</div>'+
    '<div class="columns"><div class="card"><div class="eyebrow">Critical update</div><h2>Operational push</h2>'+
    '<p class="sub">Перенос времени, смена зала и срочное сообщение аудитории.</p>'+
    '<div class="actions"><button class="btn primary" data-action="push">Send critical push</button></div></div>'+
    '<div class="card"><div class="eyebrow">Invitation</div><h2>Opening Runway</h2>'+
    '<p class="sub">Сервер создаёт и фиксирует приглашение для выбранного события.</p>'+
    '<div class="actions"><button class="btn primary" data-action="invite">Send demo invite</button></div></div></div>';
}
function accessScreen(){
  return '<div class="eyebrow">Credential authority</div><div class="hero-title">ACCESS<br>CONTROL</div>'+
    '<div class="grid4"><div class="metric"><div class="eyebrow">Algorithm</div><strong>ES256</strong><span>asymmetric signing</span></div>'+
    '<div class="metric"><div class="eyebrow">Pass TTL</div><strong>120s</strong><span>rotating credential</span></div>'+
    '<div class="metric"><div class="eyebrow">Offline</div><strong>JWK</strong><span>cached public key</span></div>'+
    '<div class="metric"><div class="eyebrow">Duplicate</div><strong>409</strong><span>same user + event</span></div></div>'+
    '<div class="card" style="margin-top:14px"><div class="eyebrow">Release gate</div><h2>Deep authority self-test</h2>'+
    '<pre style="white-space:pre-wrap;color:#a8a8a8;font-size:12px">'+esc(JSON.stringify(state.deep||{},null,2))+'</pre></div>';
}
function render(){
  var body=state.tab==='overview'?overviewScreen():
    state.tab==='programme'?programmeScreen():
    state.tab==='streaming'?streamingScreen():
    state.tab==='commerce'?commerceScreen():
    state.tab==='accreditation'?accreditationScreen():
    state.tab==='communications'?communicationsScreen():accessScreen();
  document.getElementById('admin-app').innerHTML=shell(body);
  bind();
}
async function load(){
  document.getElementById('admin-app').innerHTML=shell('<div class="loading">Loading MFW authority…</div>');
  try{
    var result=await Promise.all([req('/health'),req('/health/deep'),admin('/overview'),admin('/events'),admin('/accreditations'),admin('/streams'),admin('/commerce')]);
    state.health=result[0];state.deep=result[1];state.overview=result[2].data;
    state.events=result[3].data||[];state.accreditations=result[4].data||[];state.streams=result[5].data||[];state.commerce=result[6].data||null;
    render();
  }catch(err){
    document.getElementById('admin-app').innerHTML=shell('<div class="card"><h2>Authority unavailable</h2><div class="sub">'+esc(err.message)+'</div></div>');
    bind();
  }
}
async function action(name,id){
  try{
    if(name==='release')await admin('/waitlist/release',{method:'POST',body:JSON.stringify({eventId:'e1',count:12})});
    if(name==='push')await admin('/notifications',{method:'POST',body:JSON.stringify({category:'critical',title:'Programme update',body:'Opening Runway operational update'})});
    if(name==='invite')await admin('/invitations',{method:'POST',body:JSON.stringify({eventId:'e1',recipient:'investor-demo'})});
    if(name==='delay')await admin('/events/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({startsAt:'2026-09-26T17:15:00+03:00',status:'delayed'})});
    if(name==='move')await admin('/events/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({venue:'Manege · Hall 3'})});
    if(name==='golive')await admin('/events/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:'live'})});
    if(name==='approve'||name==='reject')await admin('/accreditations/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:name==='approve'?'approved':'rejected'})});
    if(name==='next-look')await admin('/streams/'+encodeURIComponent(id)+'/next-look',{method:'POST',body:JSON.stringify({})});
    if(name==='stream-live')await admin('/streams/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:'live'})});
    if(name==='stream-replay')await admin('/streams/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:'replay',replayAvailable:true})});
    toast('Server action: '+name);
    await load();
  }catch(err){toast('Action failed: '+err.message);}
}
function bind(){
  document.querySelectorAll('[data-tab]').forEach(function(b){
    b.onclick=function(){state.tab=b.getAttribute('data-tab');render();};
  });
  document.querySelectorAll('[data-action]').forEach(function(b){
    b.onclick=function(){var a=b.getAttribute('data-action');if(a==='refresh')load();else action(a,b.getAttribute('data-id'));};
  });
}
load();
})();