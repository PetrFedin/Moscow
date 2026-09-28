(function(){
var state={view:'today',lang:'ru',account:null,meeting:null,saved:{},followedProjects:{},favoriteProjects:{},rewardStarted:{}};
var sessions=[
{id:'s1',time:'11:00–12:15',title:'Artificial Intelligence in the Creative Process: Tool, or Co-Author?',hall:'Grand Hall',tag:'Creative'},
{id:'s2',time:'12:30–13:45',title:'Fashion as a City’s Symbolic Capital',hall:'Grand Hall',tag:'Entrepreneurship & Investment'},
{id:'s3',time:'14:00–15:15',title:'Facing the Future. Is the Fashion Industry Ready for Global Transformation?',hall:'Open Hall',tag:'Marketing & Sales'},
{id:'s4',time:'15:30–16:45',title:'Fashion as a Museum Artifact. What Do Leading Museums Select and Preserve?',hall:'Chamber Hall',tag:'Creative'}];
var speakers=[['Elena Akhmadullina','Brand owner · Alena Akhmadullina'],['Anton Alikhanov','Minister · Ministry of Industry and Trade'],['Mustafa Cem Altan','International Apparel Federation'],['Madonna Mur','Founder · Fashion Paper']];
var delegates=[['Brazil','Marina Costa','Retail & Investment'],['India','Arjun Mehta','Fashion Technology'],['China','Lin Wei','Cross-border Commerce'],['South Africa','Naledi Khumalo','Creative Industries']];
function $(s){return document.querySelector(s)}function $$(s){return [].slice.call(document.querySelectorAll(s))}
function registration(){return state.account&&state.account.registrations&&state.account.registrations.bfs}
function projectKey(name){return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}
function followProject(name){var k=projectKey(name);state.followedProjects[k]=!state.followedProjects[k];if(state.followedProjects[k]&&!state.rewardStarted[k])state.rewardStarted[k]=Date.now();render()}
function favoriteProject(name){var k=projectKey(name);state.favoriteProjects[k]=!state.favoriteProjects[k];render()}
function rewardProgress(name){var k=projectKey(name),start=state.rewardStarted[k];if(!start)return 0;return Math.min(30,Math.max(0,Math.floor((Date.now()-start)/86400000)))}
function projectActions(name){var k=projectKey(name),followed=!!state.followedProjects[k],fav=!!state.favoriteProjects[k],days=rewardProgress(name);return '<div class="project-actions"><button data-follow-project="'+name+'">'+(followed?'✓ Подписка':'＋ Подписаться')+'</button><button data-favorite-project="'+name+'">'+(fav?'♥ Любимый':'♡ В любимые')+'</button></div>'+(followed?'<div class="reward-progress"><b>'+days+' / 30 дней</b><span>Непрерывная подписка до доступа к призам и предложениям проекта. В production срок подтверждается сервером и подключёнными каналами.</span><i style="width:'+(days/30*100)+'%"></i></div>':'')}
function bindProjectActions(){$('[data-follow-project]').forEach(function(b){b.onclick=function(){followProject(b.dataset.followProject)}});$('[data-favorite-project]').forEach(function(b){b.onclick=function(){favoriteProject(b.dataset.favoriteProject)}})}

function cards(){
 return '<div class="grid">'+sessions.map(function(x){var saved=!!state.saved[x.id];return '<article class="card"><div class="time">'+x.time+'</div><span class="tag">'+x.tag+'</span><h3>'+x.title+'</h3><div class="meta">'+x.hall+' · МКЗ «Зарядье»</div><button class="small-action" data-save="'+x.id+'">'+(saved?'✓ В МОЕЙ ПРОГРАММЕ':'+ ДОБАВИТЬ')+'</button></article>'}).join('')+'</div>';
}
function bindSessionActions(){bindProjectActions();$('[data-save]').forEach(function(b){b.onclick=function(){state.saved[b.dataset.save]=!state.saved[b.dataset.save];render();}})}
function today(){
 $('#content').innerHTML='<div class="registration-banner '+(registration()?'ok':'')+'"><b>'+(registration()?'BFS REGISTRATION · '+registration().status.toUpperCase():'Нужна отдельная регистрация BFS')+'</b><span>'+(registration()?'Общий профиль используется, участие BFS подтверждено отдельно.':'Профиль платформы можно использовать повторно — подтвердить BFS нужно отдельно.')+'</span><button id="registrationCta">'+(registration()?'ОТКРЫТЬ КАБИНЕТ':'ЗАРЕГИСТРИРОВАТЬСЯ')+'</button></div><div class="section-head"><h2>Сегодня</h2><span>28 SEPTEMBER</span></div>'+cards()+'<div class="section-head"><h2>Exhibition</h2><span>QR ACCESS</span></div><article class="card"><span class="tag">Khokhloma</span><h3>International exhibition access</h3><div class="meta">QR-код участника бизнес-программы также открывает доступ на выставку.</div></article>';
 $('#registrationCta').onclick=function(){parent.postMessage({type:registration()?'mfp-open-account':'mfp-open-registration',eventCode:'bfs'},'*')};bindSessionActions();
}
function programme(){$('#content').innerHTML='<div class="section-head"><h2>Business programme</h2><span>GRAND · CHAMBER · OPEN HALL</span></div>'+cards();bindSessionActions()}
function showSpeakers(){$('#content').innerHTML='<div class="section-head"><h2>Спикеры</h2><span>INTERNATIONAL</span></div>'+speakers.map(function(s){return '<div class="speaker"><div class="avatar"></div><div><b>'+s[0]+'</b><span>'+s[1]+'</span>'+projectActions(s[0])+'</div></div>'}).join('');bindProjectActions()}
function delegateDiscovery(){
 $('#content').innerHTML='<div class="section-head"><h2>Делегаты</h2><span>4 SAMPLE PROFILES</span></div>'+delegates.map(function(d,i){return '<article class="delegate"><div><span class="tag">'+d[0]+'</span><h3>'+d[1]+'</h3><p>'+d[2]+'</p>'+projectActions(d[1])+'</div><button data-meet="'+i+'">ЗАПРОСИТЬ ВСТРЕЧУ</button></article>'}).join('');
 bindProjectActions();$('[data-meet]').forEach(function(b){b.onclick=function(){var d=delegates[Number(b.dataset.meet)];state.meeting={delegate:d[1],slot:'29 SEP · 16:00',status:'requested'};b2b();}});
}
function b2b(){
 var meeting=state.meeting?'<div class="meeting-card"><b>'+state.meeting.delegate+'</b><span>'+state.meeting.slot+' · '+state.meeting.status.toUpperCase()+'</span><button id="cancelMeeting">CANCEL</button></div>':'';
 $('#content').innerHTML='<div class="section-head"><h2>B2B meetings</h2><span>DELEGATE MODE</span></div><div class="b2b"><div class="time">NETWORKING</div><h3>Найти делегата и запросить встречу</h3><p class="meta">Поиск по стране, организации и роли → доступные слоты → request → accept → встреча.</p><button class="lang" id="discoverDelegates">OPEN DELEGATE DISCOVERY</button></div>'+meeting;
 $('#discoverDelegates').onclick=delegateDiscovery;if($('#cancelMeeting'))$('#cancelMeeting').onclick=function(){state.meeting=null;b2b()};
}
function qr(){var out='';for(var i=0;i<81;i++)out+=((i*13+i*i)%7<3||i<9||i%9===0)?'<i></i>':'<span></span>';return out}
function pass(){
 if(!registration()){ $('#content').innerHTML='<div class="section-head"><h2>My QR</h2><span>REGISTRATION REQUIRED</span></div><div class="b2b"><h3>Сначала подтвердите отдельную регистрацию BFS</h3><p class="meta">Общий аккаунт уже существует. Данные можно использовать повторно.</p><button class="lang" id="passRegister">REGISTER FOR BFS</button></div>';$('#passRegister').onclick=function(){parent.postMessage({type:'mfp-open-registration',eventCode:'bfs'},'*')};return;}
 $('#content').innerHTML='<div class="section-head"><h2>My QR</h2><span>EVENT CREDENTIAL</span></div><div class="pass"><div class="eyebrow">BRICS+ FASHION SUMMIT</div><h2>'+registration().registrationType.toUpperCase()+'<br>PASS</h2><div class="meta">'+((state.account.profile.firstName||'')+' '+(state.account.profile.lastName||''))+' · Business programme + Exhibition</div><div class="qr">'+qr()+'</div><div class="meta">Действует только для BFS. Регистрация MFW хранится отдельно.</div></div>';
}
function profile(){
 var p=state.account&&state.account.profile||{};var r=registration();
 $('#content').innerHTML='<div class="section-head"><h2>Personal account</h2><span>ONE PLATFORM ID</span></div><div class="profile-row"><b>'+((p.firstName||'Guest')+' '+(p.lastName||''))+'</b><span>GLOBAL PROFILE</span></div><div class="profile-row"><b>BFS</b><span>'+(r?r.status:'NOT REGISTERED')+'</span></div><div class="profile-row"><b>MFW</b><span>'+(state.account&&state.account.registrations&&state.account.registrations.mfw?state.account.registrations.mfw.status:'NOT REGISTERED')+'</span></div><button class="small-action" id="manageAccount">MANAGE ACCOUNT & REGISTRATIONS</button>';
 $('#manageAccount').onclick=function(){parent.postMessage({type:'mfp-open-account'},'*')};
}
function render(){$$('[data-view]').forEach(function(b){b.classList.toggle('active',b.dataset.view===state.view)});({today:today,programme:programme,speakers:showSpeakers,b2b:b2b,pass:pass,profile:profile}[state.view]||today)()}
$$('[data-view]').forEach(function(b){b.onclick=function(){state.view=b.dataset.view;render()}});
$('.lang').onclick=function(){state.lang=state.lang==='ru'?'en':'ru';$('.lang').textContent=state.lang==='ru'?'RU / EN':'EN / RU';};
window.addEventListener('message',function(e){if(e.data&&e.data.type==='mfp-account-state'){state.account=e.data.payload;render();}});
parent.postMessage({type:'mfp-request-account-state'},'*');render();
})();