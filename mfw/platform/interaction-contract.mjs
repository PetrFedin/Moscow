import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve('mfw/platform');
const required=[
 'index.html','platform.css','platform.js',
 'bfs/index.html','bfs/styles.css','bfs/app.js'
];
for(const rel of required){
 const p=path.join(root,rel);
 if(!fs.existsSync(p))throw new Error('Missing '+rel);
 if(fs.statSync(p).size===0)throw new Error('Empty '+rel);
}
const platform=fs.readFileSync(path.join(root,'platform.js'),'utf8');
const bfs=fs.readFileSync(path.join(root,'bfs/app.js'),'utf8');
new vm.Script(platform,{filename:'platform.js'});
new vm.Script(bfs,{filename:'bfs/app.js'});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bfsHtml=fs.readFileSync(path.join(root,'bfs/index.html'),'utf8');
[
 ['platform event switcher',html,'data-event="mfw"'],
 ['platform BFS switcher',html,'data-event="bfs"'],
 ['account action',html,'id="accountBtn"'],
 ['investor action',html,'id="investorBtn"'],
 ['value action',html,'id="valueBtn"'],
 ['for you action',html,'id="forYouBtn"'],
 ['platform hub action',html,'id="hubBtn"'],
 ['platform hub',html,'id="hubModal"'],
 ['profile form',html,'id="profileForm"'],
 ['registration role explanation',html,'id="registrationRoleNote"'],
 ['event registration form',html,'id="registrationForm"'],
 ['BFS today',bfsHtml,'data-view="today"'],
 ['BFS programme',bfsHtml,'data-view="programme"'],
 ['BFS speakers',bfsHtml,'data-view="speakers"'],
 ['BFS B2B',bfsHtml,'data-view="b2b"'],
 ['BFS QR',bfsHtml,'data-view="pass"'],
 ['BFS account',bfsHtml,'data-view="profile"']
].forEach(([name,source,needle])=>{if(!source.includes(needle))throw new Error('Missing '+name)});
[
 'openRegistration','profileForm.onsubmit','registrationForm.onsubmit',
 "postMessage({type:'mfp-account-state'","data-investor-step"
].forEach(x=>{if(!platform.includes(x))throw new Error('Platform action not wired: '+x)});
[
 "data-save","discoverDelegates","data-meet","passRegister","manageAccount",
 "mfp-open-registration","mfp-open-account"
].forEach(x=>{if(!bfs.includes(x))throw new Error('BFS action not wired: '+x)});
console.log('dual-event interaction contract: PASS');

const mfw=fs.readFileSync(path.resolve('mfw/app.js'),'utf8');
const mfwCss=fs.readFileSync(path.resolve('mfw/styles.css'),'utf8');
['favorite-brand','mfwFavoriteBrands','brand-loyalty','loyalty-follow-brand','Slava Zaitsev','Ianis Chamalidy','Анна Горбунова'].forEach(x=>{if(!mfw.includes(x))throw new Error('MFW loyalty/favorite contract missing: '+x)});
['z-index:9999','visibility:visible!important','100dvh'].forEach(x=>{if(!mfwCss.includes(x))throw new Error('MFW mobile nav hardening missing: '+x)});
console.log('MFW navigation + loyalty contract: PASS');

const eventData=fs.readFileSync(path.join(root,'event-data.js'),'utf8');
['Slava Zaitsev','Ianis Chamalidy','bfs-3009-1100','Patrick Duffy','analyticsContract','continuousDays'].forEach(x=>{if(!eventData.includes(x))throw new Error('Event graph seed missing: '+x)});
console.log('cross-event graph contract: PASS');

const rootHtml=fs.readFileSync(path.join(root,'..','index.html'),'utf8');
const mfwDedicated=fs.readFileSync(path.join(root,'..','mfw','index.html'),'utf8');
if(!rootHtml.includes('./platform/index.html'))throw new Error('Root does not open platform shell');
if(!platformJs.includes("../mfw/index.html"))throw new Error('Platform does not route to dedicated MFW experience');
if(!mfwDedicated.includes('../styles.css?v=15')||!mfwDedicated.includes('../app.js?v=15'))throw new Error('Dedicated MFW assets are not preserved');
console.log('dedicated MFW route contract: PASS');

const appSource=fs.readFileSync(path.join(root,'..','app.js'),'utf8');
if(appSource.includes("favoriteBrands.indexOf(b.id)>=0;\\n"))throw new Error('MFW app contains escaped-newline syntax defect');
const platformCss=fs.readFileSync(path.join(root,'platform.css'),'utf8');
if(!platformCss.includes('body:not(.bfs-mode) .hub-card')||!platformCss.includes('#c8ff00'))throw new Error('MFW contextual platform theme missing');
console.log('MFW runtime + contextual theme regression contract: PASS');

const officialData=fs.readFileSync(path.join(root,'event-data.js'),'utf8');
['2026-10-01','Black Crown Label','Kazakhstan Fashion Week presents: Dinara Satzhan','China Fashion Week presents: Momiwei','World Fashion Shorts','Noir Fashion Week Global','Мода 0+','Сертификация и стандарты'].forEach(x=>{if(!officialData.includes(x))throw new Error('Official import missing: '+x)});
if(!officialData.includes('syncedAt:"2026-09-29"'))throw new Error('Official data provenance date missing');
console.log('official MFW/BFS data import contract: PASS');

const mfwExperience=fs.readFileSync(path.join(root,'..','mfw','index.html'),'utf8');
const bfsExperience=fs.readFileSync(path.join(root,'bfs','index.html'),'utf8');
const bfsApp=fs.readFileSync(path.join(root,'bfs','app.js'),'utf8');
if(!mfwExperience.includes('event-data.js?v=20260929'))throw new Error('MFW experience missing official data layer');
if(!bfsExperience.includes('event-data.js?v=20260929'))throw new Error('BFS experience missing official data layer');
['openSession','speakerIds','media:{live:"unconfirmed",replay:"unconfirmed"}'].forEach(x=>{if(!(bfsApp+officialData).includes(x))throw new Error('Entity graph contract missing: '+x)});
console.log('event-native official graph contract: PASS');

const sync=fs.readFileSync(path.join(root,'event-sync.js'),'utf8');
['time_changed','venue_changed','access_changed','mfp-official-sync','setReminder','notifyDue'].forEach(x=>{if(!sync.includes(x))throw new Error('Sync/reminder authority missing: '+x)});
['organisations','meeting_requested','qualified_lead'].forEach(x=>{if(!(officialData+bfsApp).includes(x))throw new Error('B2B CRM graph missing: '+x)});
console.log('sync + reminder + B2B CRM contract: PASS');
