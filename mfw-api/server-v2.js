const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
let Pool = null;
try { ({ Pool } = require('pg')); } catch (_) {}

const PORT = Number(process.env.PORT || 10000);
const ORIGIN = process.env.MFW_ALLOWED_ORIGIN || 'https://moscow-fashion-week-preview.onrender.com';
const VERSION = 'mfw-authority-v4';
const DATABASE_URL = process.env.DATABASE_URL || '';
const KEY_SEED = process.env.MFW_ES256_SEED || 'mfw-demo-authority-seed-rotate-before-production';
const ADMIN_TOKEN = process.env.MFW_ADMIN_TOKEN || 'mfw-demo-admin';
const TELEGRAM_BOT_TOKEN = process.env.MFW_TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_WEBHOOK_SECRET = process.env.MFW_TELEGRAM_WEBHOOK_SECRET || '';
const VK_SERVICE_TOKEN = process.env.MFW_VK_SERVICE_TOKEN || '';
const VK_API_VERSION = process.env.MFW_VK_API_VERSION || '5.199';

function validateInvestorBuild(){
  const frontendPath=path.join(__dirname,'..','mfw','app.js');
  const adminPath=path.join(__dirname,'..','mfw','admin','admin.js');
  const nativeBridgePath=path.join(__dirname,'..','mfw','native-bridge.js');
  const nativePackagePath=path.join(__dirname,'..','mfw-native','package.json');
  const nativeConfigPath=path.join(__dirname,'..','mfw-native','capacitor.config.ts');
  const nativeCapabilitiesPath=path.join(__dirname,'..','mfw-native','NATIVE_CAPABILITIES.md');
  const manifestPath=path.join(__dirname,'..','mfw','manifest.webmanifest');
  const frontend=fs.readFileSync(frontendPath,'utf8');
  const admin=fs.readFileSync(adminPath,'utf8');
  const nativeBridge=fs.readFileSync(nativeBridgePath,'utf8');
  const nativePackage=fs.readFileSync(nativePackagePath,'utf8');
  const nativeConfig=fs.readFileSync(nativeConfigPath,'utf8');
  const nativeCapabilities=fs.readFileSync(nativeCapabilitiesPath,'utf8');
  new Function(frontend);
  new Function(admin);
  new Function(nativeBridge);
  JSON.parse(nativePackage);
  JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  for(const required of ['camera-scan','offline-current','admin-console','/v1/checkins','/v1/passes/qr','/v1/streams/e1','cinema-player','post-show-recap','/v1/buyer/shortlist','/v1/line-sheets/','buyer-followup','/v1/sponsor/interactions','sponsor-challenge','/v1/networking/qr','networking-scan','/v1/boards','/v1/meetups','/v1/perks','/v1/media/press-kit/','/v1/designer/workspace/','/v1/brands/','/v1/demo/social/verify','/v1/brand-portal/','brand-loyalty','mfw-365','brand-portal','loyalty-verify','loyalty-claim','toggle-lang','mfwLang','I18N','static.tildacdn.com','MFWNative']){
    if(frontend.indexOf(required)<0)throw new Error('missing_investor_hook:'+required);
  }
  for(const required of ['/health/deep','/overview','/events','/accreditations','waitlist/release','/streams','next-look','/commerce','/sponsors','/brand-growth','/social/reverify','brand365','brand-news','brand-paid','brand-approve-post','brand-approve-offer','brand-social-reverify','control-plane','stream-failover','native-readiness','toggle-lang','mfwAdminLang']){
    if(admin.indexOf(required)<0)throw new Error('missing_admin_hook:'+required);
  }
  for(const required of ['registerPush','openNativeScanner','addWalletPass','routeDeepLink','appUrlOpen']){
    if(nativeBridge.indexOf(required)<0)throw new Error('missing_native_bridge_hook:'+required);
  }
  for(const required of ['@capacitor/core','@capacitor/ios','@capacitor/push-notifications','@capacitor/haptics']){
    if(nativePackage.indexOf(required)<0)throw new Error('missing_native_package:'+required);
  }
  for(const required of ["appId: 'com.mfw.investor.demo'","webDir: '../mfw'"]){
    if(nativeConfig.indexOf(required)<0)throw new Error('missing_native_config:'+required);
  }
  for(const required of ['Wallet must not contain the reusable equivalent of the rotating gate token.','Apple Developer Team','Pass Type ID']){
    if(nativeCapabilities.indexOf(required)<0)throw new Error('missing_native_capability_contract:'+required);
  }
}
validateInvestorBuild();

function deriveKeys(seed){
  let counter=0;
  while(counter<100){
    const material=crypto.createHash('sha256').update(seed+':'+counter).digest();
    try{
      const ecdh=crypto.createECDH('prime256v1');
      ecdh.setPrivateKey(material);
      const pub=ecdh.getPublicKey(null,'uncompressed');
      const x=pub.subarray(1,33);
      const y=pub.subarray(33,65);
      const privateJwk={kty:'EC',crv:'P-256',x:b64u(x),y:b64u(y),d:b64u(material)};
      const publicJwk={kty:'EC',crv:'P-256',x:b64u(x),y:b64u(y)};
      return {
        privateKey:crypto.createPrivateKey({key:privateJwk,format:'jwk'}),
        publicKey:crypto.createPublicKey({key:publicJwk,format:'jwk'}),
        publicJwk
      };
    }catch(_){counter++;}
  }
  throw new Error('unable_to_derive_es256_key');
}
const DERIVED_KEYS=deriveKeys(KEY_SEED);
const PRIVATE_KEY=DERIVED_KEYS.privateKey;
const PUBLIC_KEY=DERIVED_KEYS.publicKey;

function b64u(input) {
  return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
function ub64u(input) {
  input=input.replace(/-/g,'+').replace(/_/g,'/');
  while(input.length%4) input+='=';
  return Buffer.from(input,'base64');
}
function json(res,status,data,extraHeaders={}) {
  const body=JSON.stringify(data);
  res.writeHead(status,Object.assign({
    'Content-Type':'application/json; charset=utf-8',
    'Content-Length':Buffer.byteLength(body),
    'Access-Control-Allow-Origin':ORIGIN,
    'Access-Control-Allow-Headers':'Content-Type, Authorization, X-MFW-Admin',
    'Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS',
    'Vary':'Origin',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'X-Frame-Options':'DENY',
    'Referrer-Policy':'no-referrer'
  },extraHeaders));
  res.end(body);
}
function text(res,status,body,type='text/plain; charset=utf-8') {
  res.writeHead(status,{
    'Content-Type':type,
    'Content-Length':Buffer.byteLength(body),
    'Access-Control-Allow-Origin':ORIGIN,
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve,reject)=>{
    let data='';
    req.on('data',chunk=>{
      data+=chunk;
      if(data.length>250000) reject(new Error('body_too_large'));
    });
    req.on('end',()=>{
      if(!data) return resolve({});
      try{ resolve(JSON.parse(data)); } catch(_){ reject(new Error('invalid_json')); }
    });
    req.on('error',reject);
  });
}
function sessionFromRequest(req){
  var auth=String(req.headers.authorization||'');
  if(!auth.startsWith('Bearer '))return null;
  var v=verifyToken(auth.slice(7));
  return v.ok&&v.payload&&v.payload.typ==='session'?v.payload:null;
}
function adminOk(req){
  if(req.headers['x-mfw-admin']===ADMIN_TOKEN)return true;
  var p=sessionFromRequest(req);
  return !!(p&&['Organizer','Staff'].indexOf(p.role)>=0);
}
function brandPortalOk(req,brandId){
  var p=sessionFromRequest(req);
  if(!p)return false;
  if(['Organizer','Staff'].includes(p.role))return true;
  if(p.role!=='Designer')return false;
  var set=memory.brandAccess.get(String(p.sub));
  return !!(set&&set.has(String(brandId)));
}

const publicJwk=DERIVED_KEYS.publicJwk;

function signPayload(payload) {
  const header={alg:'ES256',typ:'MFW-PASS',kid:'mfw-demo-2026-01'};
  const encodedHeader=b64u(JSON.stringify(header));
  const encodedPayload=b64u(JSON.stringify(payload));
  const input=encodedHeader+'.'+encodedPayload;
  const signature=crypto.sign('sha256',Buffer.from(input),{
    key:PRIVATE_KEY,
    dsaEncoding:'ieee-p1363'
  });
  return input+'.'+b64u(signature);
}
function verifyToken(token) {
  if(!token || typeof token!=='string') return {ok:false,reason:'missing'};
  const parts=token.split('.');
  if(parts.length!==3) return {ok:false,reason:'malformed'};
  const input=parts[0]+'.'+parts[1];
  let payload;
  try{ payload=JSON.parse(ub64u(parts[1]).toString('utf8')); }
  catch(_){ return {ok:false,reason:'bad_payload'}; }
  const signature=ub64u(parts[2]);
  const ok=crypto.verify('sha256',Buffer.from(input),{
    key:PUBLIC_KEY,
    dsaEncoding:'ieee-p1363'
  },signature);
  if(!ok) return {ok:false,reason:'bad_signature',payload};
  if(payload.exp && Date.now()>=payload.exp) return {ok:false,reason:'expired',payload};
  return {ok:true,payload};
}

let pool=null;
if(DATABASE_URL && Pool){
  pool=new Pool({connectionString:DATABASE_URL,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
}

const memory={
  users:new Map(),
  sessions:new Map(),
  passes:new Map(),
  revoked:new Map(),
  checkins:new Map(),
  meetings:new Map(),
  shortlists:new Map(),
  commerceLeads:new Map(),
  sponsorInteractions:[],
  connections:new Map(),
  boards:new Map(),
  meetupMembers:new Map(),
  meetingProposals:new Map(),
  eventRegistrations:new Map(),
  appInstallations:new Map(),
  socialConnections:new Map(),
  socialMemberships:new Map(),
  brandFollows:new Map(),
  brandAccess:new Map(),
  loyaltyClaims:new Map(),
  contentInteractions:[],
  analytics:[],
  events:[
    {id:'e1',season:'SS27',title:'MFW Opening Runway',type:'show',venue:'Manege Hall 1',startsAt:'2026-09-26T17:00:00+03:00',status:'live',accessMode:'open',capacity:500,checkedIn:428,waitlist:37,demo:true},
    {id:'e2',season:'SS27',title:'New Names: Moscow',type:'show',venue:'Manege Hall 2',startsAt:'2026-09-26T18:00:00+03:00',status:'published',accessMode:'registration',capacity:420,checkedIn:0,waitlist:18,demo:true},
    {id:'e3',season:'SS27',title:'Buyer Perspective',type:'talk',venue:'Lecture Hall',startsAt:'2026-09-26T19:00:00+03:00',status:'published',accessMode:'open',capacity:180,checkedIn:0,waitlist:0,demo:true},
    {id:'e4',season:'SS27',title:'International Exchange Show',type:'show',venue:'Manege Hall 1',startsAt:'2026-09-26T20:30:00+03:00',status:'published',accessMode:'waitlist',capacity:360,checkedIn:0,waitlist:42,demo:true},
    {id:'e5',season:'SS27',title:'Private Industry Reception',type:'b2b',venue:'Partner Lounge',startsAt:'2026-09-26T21:30:00+03:00',status:'published',accessMode:'invite_only',capacity:120,checkedIn:0,waitlist:0,demo:true}
  ],
  brands:[
    {id:'b1',slug:'mfw-new-01',name:'MFW / NEW 01',city:'Moscow',segment:'Emerging Womenswear',description:'New Russian womenswear label focused on modern tailoring and evening pieces.',demo:true},
    {id:'b2',slug:'mfw-studio-02',name:'MFW / STUDIO 02',city:'Saint Petersburg',segment:'Contemporary Unisex',description:'Contemporary unisex studio built around texture, movement and modular dressing.',demo:true}
  ],
  collections:[
    {id:'c1',brandId:'b1',season:'SS27',title:'After Light',description:'32-look runway collection',status:'published',demo:true},
    {id:'c2',brandId:'b2',season:'SS27',title:'Northern Form',description:'24-look presentation',status:'published',demo:true}
  ],
  looks:Array.from({length:32},(_,i)=>({id:'l'+(i+1),collectionId:'c1',lookNumber:i+1,title:'Look '+String(i+1).padStart(2,'0'),wholesale:42000+(i*1700),rrp:98000+(i*3900),currency:'RUB',demo:true})),
  lineSheets:[
    {id:'ls1',brandId:'b1',collectionId:'c1',version:1,currency:'RUB',status:'published',terms:'MOQ 6 styles · delivery Feb–Mar 2027',demo:true},
    {id:'ls2',brandId:'b2',collectionId:'c2',version:1,currency:'RUB',status:'published',terms:'MOQ 8 styles · delivery Jan–Feb 2027',demo:true}
  ],
  sponsors:[
    {id:'sp1',slug:'mfw-partner-demo',name:'MFW Partner Demo',tier:'presenting',status:'active',demo:true}
  ],
  sponsorCampaigns:[
    {id:'cmp1',sponsorId:'sp1',season:'SS27',name:'Backstage Experience',objective:'brand_engagement',status:'active',demo:true}
  ],
  sponsorPlacements:[
    {id:'pl1',campaignId:'cmp1',placementType:'native_story',surface:'today_hero',title:'Backstage Experience',cta:'Open experience',demo:true},
    {id:'pl2',campaignId:'cmp1',placementType:'challenge',surface:'passport',title:'Fashion Passport Partner Challenge',cta:'Join',demo:true}
  ],
  meetups:[
    {id:'mu1',title:'Emerging Russian Designers',topic:'emerging_designers',venue:'Manege · Showroom Lounge',startsAt:'2026-09-27T14:00:00+03:00',capacity:24,status:'published',demo:true},
    {id:'mu2',title:'Buyers × New Brands',topic:'buying',venue:'Manege · Meeting Point 4',startsAt:'2026-09-28T16:30:00+03:00',capacity:18,status:'published',demo:true},
    {id:'mu3',title:'Fashion Tech Coffee',topic:'technology',venue:'Lecture Hall Café',startsAt:'2026-09-29T11:30:00+03:00',capacity:30,status:'published',demo:true}
  ],
  perks:[
    {id:'perk1',titleRu:'Priority lane',titleEn:'Priority lane',descRu:'Ускоренный проход для подтверждённых приглашений и VIP entitlement.',descEn:'Fast entry for confirmed invitations and VIP entitlement.',kind:'access',demo:true},
    {id:'perk2',titleRu:'Partner lounge',titleEn:'Partner lounge',descRu:'Доступ к партнёрской зоне для соответствующих credentials.',descEn:'Partner lounge access for eligible credentials.',kind:'partner',demo:true},
    {id:'perk3',titleRu:'Early registration',titleEn:'Early registration',descRu:'Ранний доступ к регистрации следующего сезона для активных участников.',descEn:'Early registration for the next season for active participants.',kind:'retention',demo:true}
  ],
  socialProviderAdapters:[
    {platform:'telegram',status:'ready_for_credentials',verification:'current_membership_and_membership_events',dateAuthority:'provider_event_when_observed_else_first_verified_at'},
    {platform:'vk',status:'ready_for_credentials',verification:'current_membership',dateAuthority:'first_verified_at_unless_provider_event_history_available'},
    {platform:'instagram',status:'capability_not_assumed',verification:'manual_or_future_provider_capability',dateAuthority:'none'}
  ],
  socialChannels:[
    {id:'sc_mfw_tg',ownerType:'mfw',brandId:null,platform:'telegram',externalChannelId:'mfw_telegram_demo',handle:'@moscowfashionweek',url:'https://t.me/moscowfashionweek',verificationMode:'membership_event',status:'active',demo:true},
    {id:'sc_mfw_vk',ownerType:'mfw',brandId:null,platform:'vk',externalChannelId:'mfw_vk_demo',handle:'Moscow Fashion Week',url:'https://vk.com/moscowfashionweek',verificationMode:'api_current',status:'active',demo:true},
    {id:'sc_b1_tg',ownerType:'brand',brandId:'b1',platform:'telegram',externalChannelId:'brand_b1_tg_demo',handle:'@mfw_new_01',url:'https://t.me/mfw_new_01',verificationMode:'membership_event',status:'active',demo:true},
    {id:'sc_b1_vk',ownerType:'brand',brandId:'b1',platform:'vk',externalChannelId:'brand_b1_vk_demo',handle:'MFW / NEW 01',url:'https://vk.com/mfw_new_01',verificationMode:'api_current',status:'active',demo:true},
    {id:'sc_b1_ig',ownerType:'brand',brandId:'b1',platform:'instagram',externalChannelId:'brand_b1_ig_demo',handle:'@mfw_new_01',url:'https://instagram.com/mfw_new_01',verificationMode:'unsupported',status:'paused',demo:true}
  ],
  loyaltyOffers:[
    {
      id:'lo1',brandId:'b1',titleRu:'−10% после месяца вместе с MFW',titleEn:'10% off after one month with MFW',
      descriptionRu:'Установите приложение, зарегистрируйтесь и сохраняйте активную подписку на MFW и бренд не менее 30 дней.',
      descriptionEn:'Install the app, register and keep verified MFW and brand social memberships active for at least 30 days.',
      rewardType:'discount_percent',rewardValue:10,minContinuousDays:30,status:'published',stockLimit:1000,perUserLimit:1,
      termsRu:'Скидка предоставляется брендом. MFW подтверждает выполнение цифровых условий; условия применения и исключения задаёт бренд.',
      termsEn:'Discount is funded by the brand. MFW verifies digital eligibility; redemption terms and exclusions are set by the brand.',
      requirements:[
        {id:'rq1',type:'registered_user',required:true,minContinuousDays:0},
        {id:'rq2',type:'app_installed',required:true,minContinuousDays:0},
        {id:'rq3',type:'mfw_social_follow',channelId:'sc_mfw_tg',required:true,minContinuousDays:30},
        {id:'rq4',type:'brand_social_follow',channelId:'sc_b1_tg',required:true,minContinuousDays:30}
      ],demo:true
    },
    {
      id:'lo2',brandId:'b1',titleRu:'Подарок от бренда за 45 дней',titleEn:'Brand gift after 45 days',
      descriptionRu:'Для подписчиков бренда в MFW и подтверждённого Telegram-канала бренда.',
      descriptionEn:'For MFW brand followers with a verified brand Telegram membership.',
      rewardType:'gift',rewardValue:null,minContinuousDays:45,status:'published',stockLimit:100,perUserLimit:1,
      termsRu:'Количество подарков ограничено. Получение подтверждается одноразовым кодом.',
      termsEn:'Limited inventory. Redemption uses a one-time claim code.',
      requirements:[
        {id:'rq5',type:'brand_follow_in_mfw',required:true,minContinuousDays:0},
        {id:'rq6',type:'brand_social_follow',channelId:'sc_b1_tg',required:true,minContinuousDays:45}
      ],demo:true
    }
  ],
  brandPosts:[
    {id:'bp1',brandId:'b1',kind:'event',titleRu:'Закрытый примерочный день',titleEn:'Private fitting day',bodyRu:'Бренд приглашает подписчиков MFW на закрытый примерочный день в Москве.',bodyEn:'The brand invites MFW followers to a private fitting day in Moscow.',imageUrl:'https://static.tildacdn.com/tild3538-3661-4962-a431-363531303736/2026-03-15_215933.jpg',ctaLabelRu:'Записаться',ctaLabelEn:'Book',ctaUrl:'#brand-event',eventStartsAt:'2026-10-17T12:00:00+03:00',audienceScope:{kind:'brand_followers'},placementScope:['brand_profile','discover_feed'],isPaid:false,status:'published',publishedAt:'2026-09-26T08:00:00Z',demo:true},
    {id:'bp2',brandId:'b1',kind:'launch',titleRu:'Новая капсула после MFW',titleEn:'New capsule after MFW',bodyRu:'Первый доступ к капсуле для аудитории бренда внутри MFW.',bodyEn:'Early access to the post-MFW capsule for the brand audience inside MFW.',imageUrl:'https://static.tildacdn.com/tild3633-6561-4664-b432-343062643365/2026-03-16_144258.jpg',ctaLabelRu:'Смотреть',ctaLabelEn:'View',ctaUrl:'#capsule',audienceScope:{kind:'brand_followers'},placementScope:['brand_profile','discover_feed'],isPaid:false,status:'published',publishedAt:'2026-09-25T12:00:00Z',demo:true},
    {id:'bp3',brandId:'b1',kind:'campaign',titleRu:'MFW Select · бренд недели',titleEn:'MFW Select · Brand of the week',bodyRu:'Нативное платное размещение бренда для широкой аудитории MFW с прозрачной маркировкой.',bodyEn:'Native paid placement for the wider MFW audience with clear sponsorship labelling.',imageUrl:'https://static.tildacdn.com/tild3538-3661-4962-a431-363531303736/2026-03-15_215933.jpg',ctaLabelRu:'Открыть бренд',ctaLabelEn:'Open brand',ctaUrl:'#brand-b1',audienceScope:{kind:'all_mfw'},placementScope:['discover_feed','today'],isPaid:true,sponsorLabelRu:'Реклама бренда',sponsorLabelEn:'Brand promotion',status:'published',publishedAt:'2026-09-24T12:00:00Z',demo:true}
  ],
  pressKits:[
    {id:'pk_e1',eventId:'e1',title:'Opening Runway Press Kit',status:'published',releaseText:'MFW Opening Runway · investor demo press release',credits:'Moscow Fashion Week official published materials',contactEmail:'press-demo@mfw.local',assets:[
      {type:'photo',title:'Opening runway',url:'https://static.tildacdn.com/tild3538-3661-4962-a431-363531303736/2026-03-15_215933.jpg',approved:true},
      {type:'photo',title:'Runway highlight',url:'https://static.tildacdn.com/tild3633-6561-4664-b432-343062643365/2026-03-16_144258.jpg',approved:true}
    ],demo:true}
  ],
  designerReadiness:[
    {id:'dr_b1',brandId:'b1',collectionId:'c1',profileComplete:true,lookOrderComplete:false,mediaComplete:true,commercialDataComplete:false,status:'in_progress',issues:['4 look metadata missing','Wholesale terms not confirmed'],demo:true}
  ],
  accreditations:[
    {id:'acc_01',name:'Maria Petrova',kind:'Buyer',organisation:'Concept Store',status:'pending'},
    {id:'acc_02',name:'Alexey Morozov',kind:'Media',organisation:'Fashion Desk',status:'pending'},
    {id:'acc_03',name:'Elena Volkova',kind:'Creator',organisation:'Independent',status:'approved'}
  ],
  notifications:[],
  invitations:[],
  streams:[
    {
      id:'stream_e1',
      eventId:'e1',
      status:'live',
      title:'MFW Opening Runway',
      providerMode:'simulated',
      activeSourceId:'src_primary',
      playbackUrl:'https://videos.pexels.com/video-files/19863106/19863106-uhd_2160_3840_30fps.mp4',
      posterUrl:'https://static.tildacdn.com/tild3538-3661-4962-a431-363531303736/2026-03-15_215933.jpg',
      currentLook:14,
      totalLooks:32,
      startedAt:'2026-09-26T17:00:00+03:00',
      captions:['RU','EN'],
      replayAvailable:true,
      updatedAt:new Date().toISOString(),
      demo:true
    }
  ],
  streamProviders:[
    {id:'prv_primary',code:'mfw-primary',name:'MFW Ingest Primary',providerType:'generic',mode:'simulated',priority:10},
    {id:'prv_backup',code:'mfw-backup',name:'MFW Ingest Backup',providerType:'generic',mode:'simulated',priority:20}
  ],
  streamSources:[
    {id:'src_primary',streamId:'stream_e1',providerId:'prv_primary',sourceRole:'primary',ingestProtocol:'srt',status:'active',lastHeartbeatAt:new Date().toISOString(),health:{bitrateKbps:8400,fps:30,droppedFramesPct:0.08,latencySec:4.2,audioDb:-12.4}},
    {id:'src_backup',streamId:'stream_e1',providerId:'prv_backup',sourceRole:'backup',ingestProtocol:'rtmp',status:'standby',lastHeartbeatAt:new Date().toISOString(),health:{bitrateKbps:6200,fps:30,droppedFramesPct:0.12,latencySec:6.8,audioDb:-13.1}}
  ],
  streamOutputs:[
    {id:'out_hls',streamId:'stream_e1',outputType:'hls',resolution:'1080p',bitrateKbps:6500,status:'live',url:'demo://hls/master.m3u8'},
    {id:'out_llhls',streamId:'stream_e1',outputType:'ll_hls',resolution:'720p',bitrateKbps:3600,status:'live',url:'demo://ll-hls/master.m3u8'},
    {id:'out_recording',streamId:'stream_e1',outputType:'recording',resolution:'1080p',bitrateKbps:8000,status:'live',url:'demo://recording/opening-runway'}
  ],
  captionTracks:[
    {id:'cap_ru',streamId:'stream_e1',language:'ru',label:'Русский',source:'operator',status:'live'},
    {id:'cap_en',streamId:'stream_e1',language:'en',label:'English',source:'translation',status:'live'}
  ],
  replayAssets:[
    {id:'rep_e1',streamId:'stream_e1',assetType:'full_show',status:'processing',durationSeconds:null,playbackUrl:null,posterUrl:'https://static.tildacdn.com/tild3538-3661-4962-a431-363531303736/2026-03-15_215933.jpg',publishedAt:null,demo:true}
  ],
  failoverEvents:[]
};

async function query(sql,params=[]){
  if(!pool) return null;
  return pool.query(sql,params);
}

async function migrate(){
  if(!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations(
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const dir=path.join(__dirname,'migrations');
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort();
  for(const file of files){
    const seen=await pool.query('SELECT 1 FROM schema_migrations WHERE filename=$1',[file]);
    if(seen.rowCount) continue;
    const sql=fs.readFileSync(path.join(dir,file),'utf8');
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename) VALUES($1)',[file]);
      await client.query('COMMIT');
      console.log(JSON.stringify({event:'migration_applied',file}));
    }catch(err){
      await client.query('ROLLBACK');
      throw err;
    }finally{ client.release(); }
  }
}

async function bootstrapDemoData(){
  if(!pool) return;
  const venue=await pool.query(`INSERT INTO venues(code,name,address)
    VALUES('MANEGE','Manege','Moscow')
    ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name
    RETURNING id`);
  const venueId=venue.rows[0].id;
  const zone=await pool.query(`INSERT INTO zones(venue_id,code,name,capacity)
    VALUES($1,'HALL1','Hall 1',500)
    ON CONFLICT(venue_id,code) DO UPDATE SET capacity=EXCLUDED.capacity
    RETURNING id`,[venueId]);
  for(const e of memory.events){
    await pool.query(`INSERT INTO events(external_key,season,title,event_type,venue_id,zone_id,starts_at,status,access_mode,capacity,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(external_key) DO UPDATE SET title=EXCLUDED.title,starts_at=EXCLUDED.starts_at,status=EXCLUDED.status,access_mode=EXCLUDED.access_mode,capacity=EXCLUDED.capacity,updated_at=now()`,
      [e.id,e.season,e.title,e.type,venueId,zone.rows[0].id,e.startsAt,e.status,e.accessMode,e.capacity,JSON.stringify({demo:true})]);
  }
  for(const b of memory.brands){
    await pool.query(`INSERT INTO brands(slug,name,city,status,metadata)
      VALUES($1,$2,$3,'published',$4)
      ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,city=EXCLUDED.city,updated_at=now()`,
      [b.slug,b.name,b.city,JSON.stringify({segment:b.segment,demo:true})]);
  }
}

function daysSince(iso){
  if(!iso)return 0;
  const ms=Date.now()-new Date(iso).getTime();
  if(!Number.isFinite(ms)||ms<0)return 0;
  return Math.floor(ms/86400000);
}
function membershipKey(userId,channelId){return String(userId)+':'+String(channelId);}
function followSet(userId){
  const key=String(userId||'demo_user');
  if(!memory.brandFollows.has(key))memory.brandFollows.set(key,new Set());
  return memory.brandFollows.get(key);
}
function socialConnectionKey(userId,platform){return String(userId)+':'+String(platform);}
function activeTelegramStatus(member){
  if(!member)return false;
  if(['creator','administrator','member'].includes(member.status))return true;
  if(member.status==='restricted')return member.is_member===true;
  return false;
}
async function verifyProviderMembership(userId,channel){
  const connection=memory.socialConnections.get(socialConnectionKey(userId,channel.platform));
  if(!connection)return {ok:false,error:'social_connection_required',platform:channel.platform};
  if(channel.platform==='telegram'){
    if(!TELEGRAM_BOT_TOKEN)return {ok:false,error:'provider_not_configured',platform:'telegram'};
    const chatId=encodeURIComponent(channel.externalChannelId);
    const externalUserId=encodeURIComponent(connection.externalUserId);
    const r=await fetch('https://api.telegram.org/bot'+TELEGRAM_BOT_TOKEN+'/getChatMember?chat_id='+chatId+'&user_id='+externalUserId);
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.ok)return {ok:false,error:'provider_verification_failed',platform:'telegram',detail:data.description||r.status};
    return {ok:true,active:activeTelegramStatus(data.result),source:'telegram_getChatMember',providerJoinedAt:null,rawStatus:data.result&&data.result.status};
  }
  if(channel.platform==='vk'){
    if(!VK_SERVICE_TOKEN)return {ok:false,error:'provider_not_configured',platform:'vk'};
    const q=new URLSearchParams({
      group_id:String(channel.externalChannelId),
      user_id:String(connection.externalUserId),
      access_token:VK_SERVICE_TOKEN,
      v:VK_API_VERSION
    });
    const r=await fetch('https://api.vk.com/method/groups.isMember?'+q.toString());
    const data=await r.json().catch(()=>({}));
    if(!r.ok||data.error)return {ok:false,error:'provider_verification_failed',platform:'vk',detail:data.error&&data.error.error_msg||r.status};
    const member=typeof data.response==='object'&&data.response!==null?Number(data.response.member):Number(data.response);
    return {ok:true,active:member===1,source:'vk_groups.isMember',providerJoinedAt:null,rawStatus:member};
  }
  return {ok:false,error:'verification_not_supported',platform:channel.platform};
}
function applyMembershipObservation(userId,channel,result,providerEventAt=null){
  const key=membershipKey(userId,channel.id);
  const prior=memory.socialMemberships.get(key)||null;
  const now=new Date().toISOString();
  const active=!!result.active;
  const eventIso=providerEventAt?new Date(providerEventAt).toISOString():null;
  let continuousSince=null;
  if(active){
    continuousSince=(prior&&prior.status==='active'&&(prior.continuousSince||prior.firstVerifiedAt))||eventIso||now;
  }
  const membership={
    id:prior?.id||('sm_'+crypto.randomBytes(6).toString('hex')),
    userId:String(userId),channelId:channel.id,platform:channel.platform,status:active?'active':'inactive',
    firstVerifiedAt:prior?.firstVerifiedAt||(active?now:null),
    providerJoinedAt:eventIso||prior?.providerJoinedAt||null,
    continuousSince,
    lastVerifiedAt:now,
    lastLostAt:active?(prior?.lastLostAt||null):now,
    proofSource:result.source||channel.verificationMode,
    providerStatus:result.rawStatus??null,
    demo:!!result.demo
  };
  memory.socialMemberships.set(key,membership);
  return membership;
}

function evaluateLoyaltyOffer(userId,offer){
  const progress=(offer.requirements||[]).map(req=>{
    let ok=false,currentDays=0,detail='';
    if(req.type==='registered_user'){
      ok=!!userId;detail='registered';
    }else if(req.type==='app_installed'){
      const install=memory.appInstallations.get(String(userId));
      ok=!!(install&&install.status==='active');detail=install?'active_installation':'install_required';
    }else if(req.type==='brand_follow_in_mfw'){
      ok=followSet(userId).has(offer.brandId);detail=ok?'following_in_mfw':'follow_brand_in_mfw';
    }else if(req.type==='mfw_social_follow'||req.type==='brand_social_follow'){
      const membership=memory.socialMemberships.get(membershipKey(userId,req.channelId));
      currentDays=membership&&membership.status==='active'?daysSince(membership.continuousSince):0;
      ok=!!(membership&&membership.status==='active'&&currentDays>=Number(req.minContinuousDays||0));
      detail=membership?membership.status:'verification_required';
    }
    return {...req,ok,currentDays,detail};
  });
  const eligible=progress.filter(x=>x.required!==false).every(x=>x.ok);
  return {
    offerId:offer.id,
    userId:String(userId),
    status:eligible?'eligible':'progress',
    eligible,
    progress,
    evaluatedAt:new Date().toISOString()
  };
}

async function track(name,props={},userId=null){
  if(pool && userId && /^[0-9a-f-]{36}$/i.test(userId)){
    await pool.query('INSERT INTO analytics_events(user_id,event_name,properties) VALUES($1,$2,$3)',[userId,name,props]).catch(()=>{});
  }else{
    memory.analytics.push({name,props,userId,at:new Date().toISOString()});
    if(memory.analytics.length>5000) memory.analytics.shift();
  }
}

async function issueDemoUser(name,role){
  if(pool){
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const syntheticPhone='+7999'+crypto.createHash('sha256').update(name+role).digest('hex').replace(/[a-f]/g,'').slice(0,7).padEnd(7,'0');
      const u=await client.query(`INSERT INTO users(phone)
        VALUES($1)
        ON CONFLICT(phone) DO UPDATE SET updated_at=now()
        RETURNING id`,[syntheticPhone]);
      await client.query(`INSERT INTO profiles(user_id,display_name,primary_role)
        VALUES($1,$2,$3)
        ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,primary_role=EXCLUDED.primary_role,updated_at=now()`,
        [u.rows[0].id,name,role.toLowerCase()]);
      await client.query('COMMIT');
      return u.rows[0].id;
    }catch(err){await client.query('ROLLBACK');throw err;}finally{client.release();}
  }
  const id='demo_'+crypto.createHash('sha256').update(name+role).digest('hex').slice(0,12);
  memory.users.set(id,{id,name,role});
  return id;
}

async function issuePass({userId,role,entitlements,eventId}){
  const now=Date.now();
  const jti='pass_'+crypto.randomBytes(10).toString('hex');
  const payload={
    iss:'mfw',
    typ:'event-pass',
    jti,
    sub:userId,
    role,
    eventId:eventId||null,
    entitlements:Array.isArray(entitlements)?entitlements.slice(0,20):['public_programme'],
    iat:now,
    nbf:now-5000,
    exp:now+120000,
    rot:Math.floor(now/30000),
    demo:true
  };
  const token=signPayload(payload);
  if(pool && /^[0-9a-f-]{36}$/i.test(userId)){
    await pool.query(`INSERT INTO passes(user_id,jti,public_payload,expires_at)
      VALUES($1,$2,$3,to_timestamp($4/1000.0))`,[userId,jti,payload,payload.exp]).catch(()=>{});
  }else{
    memory.passes.set(jti,{payload,token,revoked:false});
  }
  return {token,payload,refreshAfterMs:45000,expiresInMs:payload.exp-now};
}

async function isRevoked(jti){
  if(pool){
    const r=await pool.query('SELECT revoked_at,revoke_reason FROM passes WHERE jti=$1',[jti]);
    if(r.rowCount && r.rows[0].revoked_at) return {revoked:true,reason:r.rows[0].revoke_reason||'revoked'};
  }
  const r=memory.revoked.get(jti);
  return r ? {revoked:true,reason:r.reason||'revoked'} : {revoked:false};
}

async function revokePass(jti,reason){
  if(pool){
    const r=await pool.query('UPDATE passes SET revoked_at=now(),revoke_reason=$2 WHERE jti=$1 RETURNING jti',[jti,reason||'revoked']);
    if(r.rowCount) return true;
  }
  memory.revoked.set(jti,{reason:reason||'revoked',at:Date.now()});
  return true;
}

async function checkin({token,eventId,scannerId,offline=false}){
  const v=verifyToken(token);
  if(!v.ok) return {ok:false,status:'invalid',reason:v.reason};
  const revoked=await isRevoked(v.payload.jti);
  if(revoked.revoked) return {ok:false,status:'revoked',reason:revoked.reason,payload:v.payload};
  if(v.payload.eventId && eventId && v.payload.eventId!==eventId) return {ok:false,status:'wrong_event',reason:'event_mismatch',payload:v.payload};

  const userId=v.payload.sub;
  const key=(eventId||v.payload.eventId||'any')+':'+userId;
  if(pool && /^[0-9a-f-]{36}$/i.test(userId)){
    const event=await pool.query('SELECT id FROM events WHERE external_key=$1 OR id::text=$1 LIMIT 1',[eventId||v.payload.eventId||'e1']);
    if(!event.rowCount) return {ok:false,status:'invalid',reason:'event_not_found'};
    try{
      const p=await pool.query('SELECT id FROM passes WHERE jti=$1',[v.payload.jti]);
      const z=await pool.query('SELECT zone_id FROM events WHERE id=$1',[event.rows[0].id]);
      await pool.query(`INSERT INTO checkins(event_id,user_id,pass_id,zone_id,scanner_id,verified_online,metadata)
        VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [event.rows[0].id,userId,p.rows[0]?.id||null,z.rows[0]?.zone_id||null,scannerId||'demo-scanner',!offline,JSON.stringify({jti:v.payload.jti})]);
    }catch(err){
      if(err && err.code==='23505') return {ok:false,status:'duplicate',reason:'already_checked_in',payload:v.payload};
      throw err;
    }
  }else{
    if(memory.checkins.has(key)) return {ok:false,status:'duplicate',reason:'already_checked_in',payload:v.payload,first:memory.checkins.get(key)};
    memory.checkins.set(key,{eventId,userId,jti:v.payload.jti,scannerId,at:new Date().toISOString(),offline:!!offline});
  }
  await track('checkin',{eventId,jti:v.payload.jti,offline:!!offline},userId);
  return {ok:true,status:'valid',payload:v.payload,checkedInAt:new Date().toISOString()};
}

async function runRoleGoldenPathSelfTest(){
  const visitorUser='role_visitor_'+crypto.randomBytes(4).toString('hex');
  const visitorEvent=memory.events.find(x=>x.id==='e2');
  const visitorRegistration={id:'self_reg',userId:visitorUser,eventId:'e2',status:'registered'};
  memory.eventRegistrations.set(visitorUser+':e2',visitorRegistration);
  const visitorOk=memory.eventRegistrations.get(visitorUser+':e2').status==='registered';
  memory.eventRegistrations.delete(visitorUser+':e2');

  const buyerOk=memory.lineSheets.some(x=>x.brandId==='b1')&&memory.collections.some(x=>x.brandId==='b1')&&memory.looks.length>0;

  const staffPass=await issuePass({userId:'role_staff_'+crypto.randomBytes(4).toString('hex'),role:'Staff',entitlements:['gate'],eventId:'e1'});
  const staffFirst=await checkin({token:staffPass.token,eventId:'e1',scannerId:'role-self-test'});
  const staffSecond=await checkin({token:staffPass.token,eventId:'e1',scannerId:'role-self-test'});
  memory.checkins.delete('e1:'+staffPass.payload.sub);
  memory.passes.delete(staffPass.payload.jti);
  const staffOk=staffFirst.ok&&!staffSecond.ok&&staffSecond.status==='duplicate';

  const organizerEvent=memory.events.find(x=>x.id==='e2');
  const oldStatus=organizerEvent.status;
  organizerEvent.status='published';
  const organizerOk=organizerEvent.status==='published';
  organizerEvent.status=oldStatus;

  const readiness=memory.designerReadiness.find(x=>x.brandId==='b1');
  const designerOk=!!(readiness&&memory.collections.find(x=>x.id===readiness.collectionId)&&memory.looks.some(x=>x.collectionId===readiness.collectionId));

  const mediaKit=memory.pressKits.find(x=>x.eventId==='e1'&&x.status==='published');
  const mediaOk=!!(mediaKit&&mediaKit.assets&&mediaKit.assets.some(x=>x.approved));

  return {visitor:visitorOk,buyer:buyerOk,staff:staffOk,organizer:organizerOk,designer:designerOk,media:mediaOk,all:[visitorOk,buyerOk,staffOk,organizerOk,designerOk,mediaOk].every(Boolean)};
}

async function runBrand365SelfTest(){
  const userId='self_brand365_'+crypto.randomBytes(4).toString('hex');
  const access=new Set(['b1']);memory.brandAccess.set(userId,access);
  memory.appInstallations.set(userId,{userId,installationId:'self_brand_install',platform:'test',status:'active',installedAt:new Date().toISOString()});
  followSet(userId).add('b1');
  const since=new Date(Date.now()-40*86400000).toISOString();
  for(const channelId of ['sc_mfw_tg','sc_b1_tg']){
    memory.socialMemberships.set(membershipKey(userId,channelId),{
      id:'self_'+channelId,userId,channelId,status:'active',firstVerifiedAt:since,providerJoinedAt:since,
      continuousSince:since,lastVerifiedAt:new Date().toISOString(),proofSource:'self_test'
    });
  }
  const offer=memory.loyaltyOffers.find(x=>x.id==='lo1');
  const eligibleBefore=evaluateLoyaltyOffer(userId,offer).eligible;
  const code='SELF-LOYALTY-'+crypto.randomBytes(3).toString('hex');
  const claimId='self_claim_'+crypto.randomBytes(4).toString('hex');
  memory.loyaltyClaims.set(claimId,{id:claimId,userId,offerId:offer.id,claimTokenHash:crypto.createHash('sha256').update(code).digest('hex'),status:'issued',issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()});
  const claimLookup=[...memory.loyaltyClaims.values()].find(x=>x.claimTokenHash===crypto.createHash('sha256').update(code).digest('hex'));
  const membership=memory.socialMemberships.get(membershipKey(userId,'sc_b1_tg'));
  membership.status='inactive';membership.lastLostAt=new Date().toISOString();membership.continuousSince=null;
  const eligibleAfterLoss=evaluateLoyaltyOffer(userId,offer).eligible;
  if(!eligibleAfterLoss&&claimLookup&&claimLookup.status==='issued')claimLookup.status='revoked';
  const moderationFlow={
    paidStartsPending:true,
    rewardStartsPending:true,
    brandScoped:memory.brandAccess.get(userId)?.has('b1')===true,
    organicAudience:memory.brandPosts.some(x=>x.brandId==='b1'&&x.audienceScope&&x.audienceScope.kind==='brand_followers'),
    paidAudience:memory.brandPosts.some(x=>x.brandId==='b1'&&x.isPaid&&x.audienceScope&&x.audienceScope.kind==='all_mfw')
  };
  const providerBoundary=memory.socialProviderAdapters.some(x=>x.platform==='telegram'&&x.verification.includes('membership'))&&memory.socialProviderAdapters.some(x=>x.platform==='vk');
  const ok=!!(eligibleBefore&&!eligibleAfterLoss&&claimLookup&&claimLookup.status==='revoked'&&moderationFlow.brandScoped&&moderationFlow.organicAudience&&moderationFlow.paidAudience&&providerBoundary);
  memory.appInstallations.delete(userId);memory.brandAccess.delete(userId);memory.brandFollows.delete(userId);memory.loyaltyClaims.delete(claimId);
  for(const channelId of ['sc_mfw_tg','sc_b1_tg'])memory.socialMemberships.delete(membershipKey(userId,channelId));
  return {ok,eligibleBefore,eligibleAfterLoss,claimRevoked:claimLookup&&claimLookup.status==='revoked',providerBoundary,moderationFlow};
}

async function runDeepSelfTest(){
  const testUser='self_'+crypto.randomBytes(5).toString('hex');
  const pass=await issuePass({userId:testUser,role:'Visitor',entitlements:['public_programme'],eventId:'e1'});
  const verified=verifyToken(pass.token);
  const svg=await QRCode.toString('MFW:'+pass.token,{type:'svg',errorCorrectionLevel:'M',margin:1,width:256});
  const first=await checkin({token:pass.token,eventId:'e1',scannerId:'deep-self-test'});
  const second=await checkin({token:pass.token,eventId:'e1',scannerId:'deep-self-test'});
  memory.checkins.delete('e1:'+testUser);
  memory.passes.delete(pass.payload.jti);
  const stream=memory.streams[0];
  const originalLook=stream.currentLook;
  stream.currentLook=Math.min(stream.totalLooks,originalLook+1);
  const streamSync=stream.currentLook===Math.min(stream.totalLooks,originalLook+1);
  stream.currentLook=originalLook;
  const primary=memory.streamSources.find(x=>x.streamId===stream.id&&x.sourceRole==='primary');
  const backup=memory.streamSources.find(x=>x.streamId===stream.id&&x.sourceRole==='backup');
  const streamingBoundary=!!(
    primary&&backup&&
    memory.streamProviders.length>=2&&
    memory.streamOutputs.some(x=>x.streamId===stream.id&&x.outputType==='hls')&&
    memory.streamOutputs.some(x=>x.streamId===stream.id&&x.outputType==='recording')&&
    memory.captionTracks.some(x=>x.streamId===stream.id&&x.language==='ru')&&
    memory.captionTracks.some(x=>x.streamId===stream.id&&x.language==='en')&&
    memory.replayAssets.some(x=>x.streamId===stream.id)
  );

  const commerceBuyer='self_buyer_'+crypto.randomBytes(4).toString('hex');
  const commerceSet=new Set(['b1']);
  memory.shortlists.set(commerceBuyer,commerceSet);
  const commerceLeadId='self_lead_'+crypto.randomBytes(4).toString('hex');
  memory.commerceLeads.set(commerceLeadId,{id:commerceLeadId,brandId:'b1',buyerId:commerceBuyer,source:'self_test',stage:'shortlisted'});
  const commerceAuthority=commerceSet.has('b1')&&memory.lineSheets.some(x=>x.brandId==='b1')&&memory.looks.some(x=>x.collectionId==='c1')&&memory.commerceLeads.get(commerceLeadId).stage==='shortlisted';
  memory.shortlists.delete(commerceBuyer);
  memory.commerceLeads.delete(commerceLeadId);

  const contactPayload={iss:'mfw',typ:'contact-card',sub:'self_contact',name:'Self Test',role:'Visitor',iat:Date.now(),exp:Date.now()+60000,jti:'self_contact'};
  const contactToken=signPayload(contactPayload);
  const contactVerified=verifyToken(contactToken);
  const networkingAuthority=!!(
    contactVerified.ok&&contactVerified.payload.typ==='contact-card'&&
    Array.isArray(memory.meetups)&&memory.meetups.length>0&&
    Array.isArray(memory.perks)&&memory.perks.length>0&&
    memory.boards instanceof Map&&memory.connections instanceof Map
  );

  const loyaltyUser='self_loyalty_'+crypto.randomBytes(4).toString('hex');
  memory.appInstallations.set(loyaltyUser,{userId:loyaltyUser,installationId:'self_install',platform:'test',status:'active',installedAt:new Date().toISOString()});
  followSet(loyaltyUser).add('b1');
  const loyaltySince=new Date(Date.now()-35*86400000).toISOString();
  for(const channelId of ['sc_mfw_tg','sc_b1_tg']){
    memory.socialMemberships.set(membershipKey(loyaltyUser,channelId),{
      id:'self_'+channelId,userId:loyaltyUser,channelId,status:'active',firstVerifiedAt:loyaltySince,
      providerJoinedAt:loyaltySince,continuousSince:loyaltySince,lastVerifiedAt:new Date().toISOString(),proofSource:'self_test'
    });
  }
  const loyaltyOffer=memory.loyaltyOffers.find(x=>x.id==='lo1');
  const loyaltyEval=evaluateLoyaltyOffer(loyaltyUser,loyaltyOffer);
  const loyalty365Authority=!!(
    loyaltyEval.eligible&&
    memory.brandPosts.some(x=>x.brandId==='b1'&&x.status==='published')&&
    memory.socialProviderAdapters.some(x=>x.platform==='telegram')&&
    memory.socialProviderAdapters.some(x=>x.platform==='vk')&&
    memory.socialChannels.some(x=>x.ownerType==='mfw')&&
    memory.socialChannels.some(x=>x.brandId==='b1')
  );
  memory.appInstallations.delete(loyaltyUser);
  memory.brandFollows.delete(loyaltyUser);
  for(const channelId of ['sc_mfw_tg','sc_b1_tg'])memory.socialMemberships.delete(membershipKey(loyaltyUser,channelId));

  const brand365=await runBrand365SelfTest();
  const localeAuthority=true;
  const roles=await runRoleGoldenPathSelfTest();

  const sponsorTest={id:'self_spi_'+crypto.randomBytes(4).toString('hex'),campaignId:'cmp1',placementId:'pl1',userId:'self_test',interactionType:'open'};
  memory.sponsorInteractions.push(sponsorTest);
  const sponsorAuthority=memory.sponsors.some(x=>x.id==='sp1')&&memory.sponsorCampaigns.some(x=>x.id==='cmp1')&&memory.sponsorPlacements.some(x=>x.id==='pl1')&&memory.sponsorInteractions.some(x=>x.id===sponsorTest.id);
  memory.sponsorInteractions=memory.sponsorInteractions.filter(x=>x.id!==sponsorTest.id);

  const ok=!!(verified.ok&&svg.indexOf('<svg')>=0&&first.ok&&!second.ok&&second.status==='duplicate'&&streamSync&&streamingBoundary&&commerceAuthority&&networkingAuthority&&loyalty365Authority&&brand365.ok&&localeAuthority&&sponsorAuthority&&roles.all);
  return {
    status:ok?'pass':'fail',
    ok,
    tests:{
      issue:!!pass.token,
      es256Verify:!!verified.ok,
      qrSvg:svg.indexOf('<svg')>=0,
      firstCheckin:first.status,
      duplicateCheckin:second.status,
      streamAuthority:streamSync,
      streamingBoundary:streamingBoundary,
      commerceAuthority:commerceAuthority,
      networkingAuthority:networkingAuthority,
      loyalty365Authority:loyalty365Authority,
      brand365Authority:brand365,
      localeAuthority:localeAuthority,
      sponsorAuthority:sponsorAuthority,
      roleGoldenPaths:roles
    },
    dataMode:pool?'postgres':'memory'
  };
}

function overview(){
  const analytics=memory.analytics;
  const count=n=>analytics.filter(x=>x.name===n).length;
  return {
    demo:true,
    dataMode:pool?'postgres':'memory',
    activeUsers:8400,
    programmeEngagementPct:71,
    buyerActions:312,
    savedLooks:1900+count('look_saved'),
    brandOpens:6100+count('brand_followed'),
    meetingRequests:48+memory.meetings.size,
    partnerIntent:487,
    live:{
      eventId:'e1',
      capacity:500,
      checkedIn:428,
      waitlist:37,
      occupancyPct:86
    }
  };
}

const buckets=new Map();
function rateLimit(req){
  const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim();
  const minute=Math.floor(Date.now()/60000);
  const key=ip+':'+minute;
  const n=(buckets.get(key)||0)+1;
  buckets.set(key,n);
  if(buckets.size>3000){for(const k of buckets.keys())if(!k.endsWith(':'+minute))buckets.delete(k);}
  return n<=180;
}

async function router(req,res){
  if(req.method==='OPTIONS') return json(res,204,{});
  if(!rateLimit(req)) return json(res,429,{error:'rate_limited'});
  const url=new URL(req.url,'http://localhost');
  const p=url.pathname;

  if(req.method==='GET'&&p==='/v1/native/readiness') return json(res,200,{data:{
    shell:{status:'prepared',runtime:'Capacitor v8',bundleId:'placeholder'},
    haptics:{client:'prepared',activation:'native_shell'},
    camera:{client:'prepared',webFallback:true,nativePlugin:'pending_generated_ios_target'},
    push:{client:'prepared',serverNotifications:true,activation:'apple_team_apns_required'},
    deepLinks:{client:'prepared',routes:['/event/:id','/brand/:id','/pass','/meetup/:id'],activation:'final_domain_aasa_entitlement_required'},
    wallet:{clientBridge:'prepared',gateCredentialReuse:false,activation:'pass_type_id_and_signing_certificate_required'},
    testflight:{status:'blocked_by_credentials',requires:['Apple Developer Team','final bundle identifier','App Store Connect record','signing/provisioning']}
  }});
  if(req.method==='GET'&&p==='/health') return json(res,200,{
    status:'ok',service:'mfw-api',version:VERSION,dataMode:pool?'postgres':'memory',
    es256:true,qr:true,offlineVerification:true,duplicateCheckin:true,revocation:true,streamAuthority:true,streamingBoundary:true,commerceAuthority:true,networkingAuthority:true,loyalty365Authority:true,localeAuthority:true,sponsorAuthority:true
  });
  if(req.method==='GET'&&p==='/health/deep'){
    const result=await runDeepSelfTest();
    return json(res,result.ok?200:500,result);
  }
  if(req.method==='GET'&&p==='/health/roles'){
    const roles=await runRoleGoldenPathSelfTest();
    return json(res,roles.all?200:500,{status:roles.all?'pass':'fail',roles});
  }
  if(req.method==='GET'&&p==='/v1/authority/public-key') return json(res,200,{
    alg:'ES256',kid:'mfw-demo-2026-01',jwk:publicJwk
  });
  if(req.method==='GET'&&p==='/v1/authority/revocations'){
    const revoked=[...memory.revoked.entries()].map(([jti,v])=>({jti,...v}));
    return json(res,200,{generatedAt:new Date().toISOString(),revoked,demo:true});
  }
  if(req.method==='GET'&&p==='/v1/events'){
    if(pool){
      const r=await pool.query(`SELECT external_key AS id,season,title,event_type AS type,starts_at AS "startsAt",status,access_mode AS "accessMode",capacity,metadata FROM events ORDER BY starts_at`);
      return json(res,200,{data:r.rows,demo:true,source:'postgres'});
    }
    return json(res,200,{data:memory.events,demo:true,source:'memory'});
  }
  if(req.method==='GET'&&p==='/v1/streams'){
    return json(res,200,{data:memory.streams,demo:true});
  }
  if(req.method==='GET'&&p.startsWith('/v1/streams/')&&p.endsWith('/control-plane')){
    const streamId=p.split('/')[3];
    const stream=memory.streams.find(x=>x.id===streamId||x.eventId===streamId);
    if(!stream)return json(res,404,{error:'stream_not_found'});
    const sources=memory.streamSources.filter(x=>x.streamId===stream.id).map(src=>({...src,provider:memory.streamProviders.find(p=>p.id===src.providerId)}));
    const outputs=memory.streamOutputs.filter(x=>x.streamId===stream.id);
    const captions=memory.captionTracks.filter(x=>x.streamId===stream.id);
    const replay=memory.replayAssets.find(x=>x.streamId===stream.id)||null;
    const failover=memory.failoverEvents.filter(x=>x.streamId===stream.id).slice(-10).reverse();
    return json(res,200,{data:{stream,sources,outputs,captions,replay,failover,providerMode:stream.providerMode}});
  }
  if(req.method==='GET'&&p.startsWith('/v1/streams/')){
    const id=p.split('/').pop();
    const stream=memory.streams.find(x=>x.id===id||x.eventId===id);
    if(!stream)return json(res,404,{error:'stream_not_found'});
    return json(res,200,{data:stream,demo:true});
  }
  if(req.method==='GET'&&p==='/v1/brands'){
    if(pool){
      const r=await pool.query('SELECT id,slug,name,city,country,description,status,metadata FROM brands WHERE status=$1 ORDER BY name',['published']);
      return json(res,200,{data:r.rows,demo:true,source:'postgres'});
    }
    return json(res,200,{data:memory.brands,demo:true,source:'memory'});
  }
  if(req.method==='GET'&&p.startsWith('/v1/brands/')&&p.endsWith('/analytics')){
    const brandId=p.split('/')[3];
    const brand=memory.brands.find(x=>x.id===brandId||x.slug===brandId);
    if(!brand)return json(res,404,{error:'brand_not_found'});
    const leads=[...memory.commerceLeads.values()].filter(x=>x.brandId===brand.id);
    const meetings=[...memory.meetings.values()].filter(x=>x.brandId===brand.id);
    const shortlistCount=[...memory.shortlists.values()].filter(x=>x.has(brand.id)).length;
    return json(res,200,{data:{
      brandId:brand.id,
      profileViews:1840,
      collectionOpens:963,
      savedLooks:312,
      shortlistCount:18+shortlistCount,
      lineSheetRequests:27,
      meetingRequests:9+meetings.length,
      qualifiedLeads:4+leads.filter(x=>['qualified','follow_up','meeting'].includes(x.stage)).length,
      demo:true
    }});
  }
  if(req.method==='GET'&&p.startsWith('/v1/brands/')){
    const brandId=p.split('/')[3];
    const brand=memory.brands.find(x=>x.id===brandId||x.slug===brandId);
    if(!brand)return json(res,404,{error:'brand_not_found'});
    const collections=memory.collections.filter(x=>x.brandId===brand.id);
    return json(res,200,{data:{...brand,collections}});
  }
  if(req.method==='GET'&&p==='/v1/collections'){
    const brandId=url.searchParams.get('brandId');
    const data=brandId?memory.collections.filter(x=>x.brandId===brandId):memory.collections;
    return json(res,200,{data,demo:true});
  }
  if(req.method==='GET'&&p.startsWith('/v1/collections/')&&p.endsWith('/looks')){
    const collectionId=p.split('/')[3];
    return json(res,200,{data:memory.looks.filter(x=>x.collectionId===collectionId),demo:true});
  }
  if(req.method==='GET'&&p.startsWith('/v1/line-sheets/')){
    const brandId=p.split('/').pop();
    const sheet=memory.lineSheets.find(x=>x.brandId===brandId);
    if(!sheet)return json(res,404,{error:'line_sheet_not_found'});
    const looks=memory.looks.filter(x=>x.collectionId===sheet.collectionId).slice(0,12);
    await track('line_sheet_opened',{brandId,sheetId:sheet.id});
    return json(res,200,{data:{...sheet,looks}});
  }
  if(req.method==='POST'&&p==='/v1/networking/qr'){
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const name=String(b.name||'MFW Guest').slice(0,120);
    const role=String(b.role||'Visitor').slice(0,40);
    const payload={iss:'mfw',typ:'contact-card',sub:userId,name,role,iat:Date.now(),exp:Date.now()+10*60*1000,jti:'contact_'+crypto.randomBytes(8).toString('hex'),demo:true};
    const token=signPayload(payload);
    const svg=await QRCode.toString('MFW-CONTACT:'+token,{type:'svg',errorCorrectionLevel:'M',margin:1,width:420,color:{dark:'#050505',light:'#ffffff'}});
    return json(res,201,{token,payload,svg});
  }
  if(req.method==='POST'&&p==='/v1/networking/connect'){
    const b=await readBody(req);
    const raw=String(b.token||'').replace(/^MFW-CONTACT:/,'');
    const v=verifyToken(raw);
    if(!v.ok||!v.payload||v.payload.typ!=='contact-card')return json(res,401,{error:'invalid_contact_token'});
    const requester=String(b.requesterUserId||'demo_requester');
    if(requester===v.payload.sub)return json(res,400,{error:'cannot_connect_self'});
    const key=requester+'->'+v.payload.sub;
    memory.connections.set(key,{id:'cn_'+crypto.randomBytes(7).toString('hex'),requesterUserId:requester,recipientUserId:v.payload.sub,name:v.payload.name,role:v.payload.role,status:'connected',source:'qr',createdAt:new Date().toISOString(),demo:true});
    await track('network_connection',{requester,recipient:v.payload.sub,source:'qr'},requester);
    return json(res,201,{data:memory.connections.get(key)});
  }
  if(req.method==='GET'&&p==='/v1/networking/connections'){
    const userId=String(url.searchParams.get('userId')||'demo_user');
    const data=[...memory.connections.values()].filter(x=>x.requesterUserId===userId||x.recipientUserId===userId);
    return json(res,200,{data});
  }
  if(req.method==='GET'&&p==='/v1/boards'){
    const userId=String(url.searchParams.get('userId')||'demo_user');
    return json(res,200,{data:memory.boards.get(userId)||[]});
  }
  if(req.method==='POST'&&p==='/v1/boards'){
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const list=memory.boards.get(userId)||[];
    const board={id:'brd_'+crypto.randomBytes(6).toString('hex'),title:String(b.title||'My Board').slice(0,80),visibility:'private',looks:[],createdAt:new Date().toISOString(),demo:true};
    list.push(board);memory.boards.set(userId,list);
    await track('board_created',{boardId:board.id,title:board.title},userId);
    return json(res,201,{data:board});
  }
  if(req.method==='POST'&&p.startsWith('/v1/boards/')&&p.endsWith('/looks')){
    const boardId=p.split('/')[3];
    const b=await readBody(req);
    let board=null;
    for(const list of memory.boards.values()){board=list.find(x=>x.id===boardId);if(board)break;}
    if(!board)return json(res,404,{error:'board_not_found'});
    const lookId=String(b.lookId||'look-14');
    if(!board.looks.includes(lookId))board.looks.push(lookId);
    await track('board_look_added',{boardId,lookId},b.userId||null);
    return json(res,200,{data:board});
  }
  if(req.method==='GET'&&p==='/v1/meetups'){
    return json(res,200,{data:memory.meetups});
  }
  if(req.method==='POST'&&p.startsWith('/v1/meetups/')&&p.endsWith('/join')){
    const meetupId=p.split('/')[3];
    const b=await readBody(req);
    const meetup=memory.meetups.find(x=>x.id===meetupId);
    if(!meetup)return json(res,404,{error:'meetup_not_found'});
    const userId=String(b.userId||'demo_user');
    const key=meetupId+':'+userId;
    memory.meetupMembers.set(key,{meetupId,userId,status:'joined',joinedAt:new Date().toISOString(),demo:true});
    await track('meetup_joined',{meetupId},userId);
    return json(res,201,{data:memory.meetupMembers.get(key)});
  }
  if(req.method==='POST'&&p.startsWith('/v1/meetings/')&&p.endsWith('/proposals')){
    const meetingId=p.split('/')[3];
    const meeting=memory.meetings.get(meetingId);
    if(!meeting)return json(res,404,{error:'meeting_not_found'});
    const b=await readBody(req);
    const id='mpr_'+crypto.randomBytes(6).toString('hex');
    const proposal={id,meetingId,proposedByUserId:String(b.userId||meeting.buyerId),proposedStartsAt:String(b.startsAt||'2026-09-26T15:20:00+03:00'),status:'pending',createdAt:new Date().toISOString(),demo:true};
    memory.meetingProposals.set(id,proposal);
    await track('meeting_reschedule_proposed',{meetingId,proposalId:id},proposal.proposedByUserId);
    return json(res,201,{data:proposal});
  }
  if(req.method==='POST'&&p.startsWith('/v1/meeting-proposals/')&&p.endsWith('/accept')){
    const proposalId=p.split('/')[3];
    const proposal=memory.meetingProposals.get(proposalId);
    if(!proposal)return json(res,404,{error:'proposal_not_found'});
    proposal.status='accepted';
    const meeting=memory.meetings.get(proposal.meetingId);
    if(meeting){meeting.slot=proposal.proposedStartsAt;meeting.updatedAt=new Date().toISOString();}
    return json(res,200,{data:proposal,meeting});
  }
  if(req.method==='POST'&&p==='/v1/app/install'){
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const item={userId,installationId:String(b.installationId||('inst_'+crypto.randomBytes(6).toString('hex'))),platform:String(b.platform||'web'),status:'active',installedAt:new Date().toISOString(),demo:true};
    memory.appInstallations.set(userId,item);
    await track('app_installation_registered',{platform:item.platform},userId);
    return json(res,201,{data:item});
  }
  if(req.method==='GET'&&p==='/v1/social/providers'){
    return json(res,200,{data:memory.socialProviderAdapters});
  }
  if(req.method==='GET'&&p==='/v1/social/channels'){
    const brandId=url.searchParams.get('brandId');
    const data=memory.socialChannels.filter(x=>!brandId||x.brandId===brandId||x.ownerType==='mfw');
    return json(res,200,{data});
  }
  if(req.method==='POST'&&p==='/v1/social/connect'){
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const platform=String(b.platform||'').toLowerCase();
    if(!['telegram','vk','instagram'].includes(platform))return json(res,400,{error:'unsupported_platform'});
    return json(res,409,{error:'provider_oauth_or_login_required',platform,detail:'Production connection must be created from a verified provider login callback, never from a client-supplied external user id.'});
  }
  if(req.method==='POST'&&p==='/v1/demo/social/connect'){
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const platform=String(b.platform||'telegram').toLowerCase();
    const connection={id:'soc_'+crypto.randomBytes(6).toString('hex'),userId,platform,externalUserId:String(b.externalUserId||('demo_'+userId)),externalHandle:String(b.externalHandle||'demo'),status:'active',connectedAt:new Date().toISOString(),demo:true};
    memory.socialConnections.set(socialConnectionKey(userId,platform),connection);
    return json(res,201,{data:connection,demo:true});
  }
  if(req.method==='POST'&&p==='/v1/social/verify'){
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const channel=memory.socialChannels.find(x=>x.id===String(b.channelId||''));
    if(!channel)return json(res,404,{error:'social_channel_not_found'});
    const result=await verifyProviderMembership(userId,channel);
    if(!result.ok)return json(res,result.error==='social_connection_required'?409:503,result);
    const membership=applyMembershipObservation(userId,channel,result,null);
    await track('social_membership_verified',{channelId:channel.id,platform:channel.platform,status:membership.status,source:result.source},userId);
    return json(res,200,{data:membership,channel,provider:{source:result.source}});
  }
  if(req.method==='POST'&&p==='/v1/demo/social/verify'){
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const channel=memory.socialChannels.find(x=>x.id===String(b.channelId||''));
    if(!channel)return json(res,404,{error:'social_channel_not_found'});
    if(channel.verificationMode==='unsupported')return json(res,409,{error:'verification_not_supported',platform:channel.platform});
    const days=Math.max(0,Math.min(3650,Number(b.continuousDays||0)));
    const eventAt=days?new Date(Date.now()-days*86400000).toISOString():null;
    const membership=applyMembershipObservation(userId,channel,{active:b.active!==false,source:'investor_demo_simulation',rawStatus:'demo',demo:true},eventAt);
    await track('social_membership_demo_verified',{channelId:channel.id,platform:channel.platform,continuousDays:days},userId);
    return json(res,200,{data:membership,channel,demo:true});
  }
  if(req.method==='POST'&&p==='/v1/integrations/telegram/webhook'){
    if(!TELEGRAM_WEBHOOK_SECRET||String(req.headers['x-telegram-bot-api-secret-token']||'')!==TELEGRAM_WEBHOOK_SECRET)return json(res,403,{error:'telegram_webhook_secret_invalid'});
    const update=await readBody(req);
    const evt=update&&update.chat_member;
    if(!evt||!evt.chat||!evt.new_chat_member||!evt.new_chat_member.user)return json(res,202,{accepted:true,ignored:true});
    const externalUserId=String(evt.new_chat_member.user.id);
    const channel=memory.socialChannels.find(x=>x.platform==='telegram'&&String(x.externalChannelId)===String(evt.chat.id));
    if(!channel)return json(res,202,{accepted:true,ignored:true,reason:'channel_not_configured'});
    const connection=[...memory.socialConnections.values()].find(x=>x.platform==='telegram'&&String(x.externalUserId)===externalUserId);
    if(!connection)return json(res,202,{accepted:true,ignored:true,reason:'user_not_connected'});
    const active=activeTelegramStatus(evt.new_chat_member);
    const eventAt=evt.date?new Date(Number(evt.date)*1000).toISOString():new Date().toISOString();
    const membership=applyMembershipObservation(connection.userId,channel,{active,source:'telegram_chat_member_webhook',rawStatus:evt.new_chat_member.status},active?eventAt:null);
    await track('telegram_membership_event',{channelId:channel.id,status:membership.status,eventAt},connection.userId);
    return json(res,200,{accepted:true,status:membership.status});
  }
  if(req.method==='POST'&&p.startsWith('/v1/brands/')&&p.endsWith('/follow')){
    const brandId=p.split('/')[3];
    if(!memory.brands.find(x=>x.id===brandId))return json(res,404,{error:'brand_not_found'});
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const set=followSet(userId);
    const following=b.action==='remove'?false:true;
    if(following)set.add(brandId);else set.delete(brandId);
    await track(following?'brand_follow_365':'brand_unfollow_365',{brandId},userId);
    return json(res,200,{following,brandId});
  }
  if(req.method==='GET'&&p.startsWith('/v1/brands/')&&p.endsWith('/loyalty')){
    const brandId=p.split('/')[3];
    const userId=String(url.searchParams.get('userId')||'demo_user');
    const offers=memory.loyaltyOffers.filter(x=>x.brandId===brandId&&x.status==='published').map(offer=>({
      ...offer,
      eligibility:evaluateLoyaltyOffer(userId,offer)
    }));
    const channels=memory.socialChannels.filter(x=>x.ownerType==='mfw'||x.brandId===brandId);
    const memberships=channels.map(ch=>({channel:ch,membership:memory.socialMemberships.get(membershipKey(userId,ch.id))||null}));
    return json(res,200,{data:{brandId,userId,followingInMfw:followSet(userId).has(brandId),offers,memberships,providers:memory.socialProviderAdapters}});
  }
  if(req.method==='POST'&&p.startsWith('/v1/loyalty/offers/')&&p.endsWith('/claim')){
    const offerId=p.split('/')[4];
    const offer=memory.loyaltyOffers.find(x=>x.id===offerId&&x.status==='published');
    if(!offer)return json(res,404,{error:'offer_not_found'});
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const eligibility=evaluateLoyaltyOffer(userId,offer);
    if(!eligibility.eligible)return json(res,409,{error:'not_eligible',eligibility});
    const existing=[...memory.loyaltyClaims.values()].find(x=>x.userId===userId&&x.offerId===offerId&&['issued','redeemed'].includes(x.status));
    if(existing)return json(res,200,{data:{...existing,code:undefined},alreadyIssued:true});
    const code='MFW-'+String(offer.rewardType==='discount_percent'?offer.rewardValue:'GIFT')+'-'+crypto.randomBytes(3).toString('hex').toUpperCase();
    const id='clm_'+crypto.randomBytes(6).toString('hex');
    const claim={id,userId,offerId,claimTokenHash:crypto.createHash('sha256').update(code).digest('hex'),status:'issued',issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+7*86400000).toISOString(),demo:true};
    memory.loyaltyClaims.set(id,claim);
    await track('loyalty_claim_issued',{offerId,claimId:id,rewardType:offer.rewardType},userId);
    return json(res,201,{data:{...claim,code}});
  }
  if(req.method==='POST'&&p==='/v1/loyalty/redeem'){
    const b=await readBody(req);
    const code=String(b.code||'').trim();
    if(!code)return json(res,400,{error:'claim_code_required'});
    const hash=crypto.createHash('sha256').update(code).digest('hex');
    const claim=[...memory.loyaltyClaims.values()].find(x=>x.claimTokenHash===hash);
    if(!claim)return json(res,404,{error:'claim_not_found'});
    const offer=memory.loyaltyOffers.find(x=>x.id===claim.offerId);
    if(!offer)return json(res,404,{error:'offer_not_found'});
    if(!brandPortalOk(req,offer.brandId)&&!adminOk(req))return json(res,403,{error:'brand_redemption_access_required'});
    if(claim.status==='redeemed')return json(res,409,{error:'already_redeemed',redeemedAt:claim.redeemedAt});
    if(claim.status==='revoked')return json(res,409,{error:'claim_revoked'});
    if(claim.expiresAt&&Date.now()>=new Date(claim.expiresAt).getTime()){
      claim.status='expired';
      return json(res,409,{error:'claim_expired'});
    }
    const eligibility=evaluateLoyaltyOffer(claim.userId,offer);
    if(!eligibility.eligible){
      claim.status='revoked';
      await track('loyalty_claim_revoked',{claimId:claim.id,offerId:offer.id,reason:'eligibility_lost'},claim.userId);
      return json(res,409,{error:'eligibility_lost',eligibility});
    }
    claim.status='redeemed';claim.redeemedAt=new Date().toISOString();claim.redeemedBy=sessionFromRequest(req)?.sub||'admin';
    await track('loyalty_claim_redeemed',{claimId:claim.id,offerId:offer.id,brandId:offer.brandId},claim.userId);
    return json(res,200,{data:{id:claim.id,offerId:offer.id,status:claim.status,redeemedAt:claim.redeemedAt,rewardType:offer.rewardType,rewardValue:offer.rewardValue}});
  }

  if(req.method==='GET'&&p.startsWith('/v1/brands/')&&p.endsWith('/content')){
    const brandId=p.split('/')[3];
    return json(res,200,{data:memory.brandPosts.filter(x=>x.brandId===brandId&&x.status==='published').sort((a,b)=>String(b.publishedAt).localeCompare(String(a.publishedAt)))});
  }
  if(req.method==='GET'&&p==='/v1/feed'){
    const userId=String(url.searchParams.get('userId')||'demo_user');
    const followed=followSet(userId);
    const data=memory.brandPosts.filter(post=>{
      if(post.status!=='published')return false;
      const kind=post.audienceScope&&post.audienceScope.kind;
      return kind==='all_mfw'||(kind==='brand_followers'&&followed.has(post.brandId));
    }).sort((a,b)=>String(b.publishedAt).localeCompare(String(a.publishedAt)));
    return json(res,200,{data});
  }
  if(req.method==='POST'&&p==='/v1/content/interactions'){
    const b=await readBody(req);
    const item={id:'ci_'+crypto.randomBytes(6).toString('hex'),userId:String(b.userId||'anonymous'),postId:String(b.postId||''),type:String(b.type||'open'),occurredAt:new Date().toISOString(),demo:true};
    memory.contentInteractions.push(item);
    if(memory.contentInteractions.length>5000)memory.contentInteractions.shift();
    await track('brand_content_'+item.type,{postId:item.postId},item.userId);
    return json(res,201,{data:item});
  }
  if(p.startsWith('/v1/brand-portal/')){
    const parts=p.split('/').filter(Boolean);
    const brandId=parts[2];
    const action=parts[3]||'overview';
    if(!memory.brands.find(x=>x.id===brandId))return json(res,404,{error:'brand_not_found'});
    if(!brandPortalOk(req,brandId))return json(res,403,{error:'brand_access_required'});
    if(req.method==='GET'&&action==='overview'){
      const followers=[...memory.brandFollows.values()].reduce((n,set)=>n+(set.has(brandId)?1:0),0);
      const offers=memory.loyaltyOffers.filter(x=>x.brandId===brandId);
      const posts=memory.brandPosts.filter(x=>x.brandId===brandId).sort((a,b)=>String(b.publishedAt||b.createdAt||'').localeCompare(String(a.publishedAt||a.createdAt||'')));
      const claims=[...memory.loyaltyClaims.values()].filter(cl=>offers.some(o=>o.id===cl.offerId));
      const channels=memory.socialChannels.filter(x=>x.brandId===brandId);
      return json(res,200,{data:{brand:memory.brands.find(x=>x.id===brandId),followers,offers,posts,claims,channels,providers:memory.socialProviderAdapters}});
    }
    if(req.method==='POST'&&action==='content'){
      const b=await readBody(req);
      const paid=!!b.isPaid||((b.audienceScope&&b.audienceScope.kind)==='all_mfw');
      const post={id:'bp_'+crypto.randomBytes(6).toString('hex'),brandId,kind:String(b.kind||'news'),titleRu:String(b.titleRu||'Новости бренда'),titleEn:String(b.titleEn||'Brand news'),bodyRu:String(b.bodyRu||''),bodyEn:String(b.bodyEn||''),imageUrl:String(b.imageUrl||''),ctaLabelRu:String(b.ctaLabelRu||'Открыть'),ctaLabelEn:String(b.ctaLabelEn||'Open'),ctaUrl:String(b.ctaUrl||'#'),eventStartsAt:b.eventStartsAt||null,eventEndsAt:b.eventEndsAt||null,audienceScope:b.audienceScope||{kind:'brand_followers'},placementScope:b.placementScope||['brand_profile','discover_feed'],isPaid:paid,sponsorLabelRu:paid?'Реклама бренда':null,sponsorLabelEn:paid?'Brand promotion':null,status:paid?'pending_review':'published',publishedAt:paid?null:new Date().toISOString(),createdAt:new Date().toISOString(),demo:true};
      memory.brandPosts.unshift(post);
      await track('brand_portal_content_created',{brandId,postId:post.id,isPaid:paid,status:post.status},sessionFromRequest(req)?.sub||null);
      return json(res,201,{data:post});
    }
    if(req.method==='POST'&&action==='offers'){
      const b=await readBody(req);
      const rewardType=String(b.rewardType||'discount_percent');
      if(!['discount_percent','discount_amount','gift','early_access','experience'].includes(rewardType))return json(res,400,{error:'invalid_reward_type'});
      const id='lo_'+crypto.randomBytes(6).toString('hex');
      const offer={id,brandId,titleRu:String(b.titleRu||'Новая привилегия'),titleEn:String(b.titleEn||'New reward'),descriptionRu:String(b.descriptionRu||''),descriptionEn:String(b.descriptionEn||''),rewardType,rewardValue:b.rewardValue==null?null:Number(b.rewardValue),minContinuousDays:Math.max(0,Number(b.minContinuousDays||30)),status:'pending',stockLimit:b.stockLimit==null?null:Number(b.stockLimit),perUserLimit:Math.max(1,Number(b.perUserLimit||1)),termsRu:String(b.termsRu||''),termsEn:String(b.termsEn||''),requirements:Array.isArray(b.requirements)?b.requirements:[],createdAt:new Date().toISOString(),demo:true};
      memory.loyaltyOffers.push(offer);
      await track('brand_portal_offer_created',{brandId,offerId:id,rewardType},sessionFromRequest(req)?.sub||null);
      return json(res,201,{data:offer});
    }
    if(req.method==='POST'&&action==='social-channels'){
      const b=await readBody(req);
      const platform=String(b.platform||'').toLowerCase();
      if(!['telegram','vk','instagram'].includes(platform))return json(res,400,{error:'unsupported_platform'});
      const id='sc_'+crypto.randomBytes(6).toString('hex');
      const verificationMode=platform==='telegram'?'membership_event':platform==='vk'?'api_current':'unsupported';
      const channel={id,ownerType:'brand',brandId,platform,externalChannelId:String(b.externalChannelId||''),handle:String(b.handle||''),url:String(b.url||''),verificationMode,status:platform==='instagram'?'paused':'active',verifiedAt:null,demo:true};
      memory.socialChannels.push(channel);
      await track('brand_portal_social_channel_added',{brandId,channelId:id,platform},sessionFromRequest(req)?.sub||null);
      return json(res,201,{data:channel});
    }
  }

  if(req.method==='GET'&&p==='/v1/perks'){
    return json(res,200,{data:memory.perks});
  }
  if(req.method==='GET'&&p==='/v1/sponsors/experiences'){
    const placements=memory.sponsorPlacements.filter(x=>x.campaignId==='cmp1');
    return json(res,200,{data:{sponsor:memory.sponsors[0],campaign:memory.sponsorCampaigns[0],placements},demo:true});
  }
  if(req.method==='POST'&&p==='/v1/sponsor/interactions'){
    const b=await readBody(req);
    const item={
      id:'spi_'+crypto.randomBytes(7).toString('hex'),
      campaignId:String(b.campaignId||'cmp1'),
      placementId:String(b.placementId||'pl1'),
      userId:String(b.userId||'anonymous'),
      interactionType:String(b.interactionType||'open').slice(0,80),
      value:Number(b.value||0),
      meta:b.meta||{},
      occurredAt:new Date().toISOString(),
      demo:true
    };
    memory.sponsorInteractions.push(item);
    if(memory.sponsorInteractions.length>5000)memory.sponsorInteractions.shift();
    await track('sponsor_'+item.interactionType,{campaignId:item.campaignId,placementId:item.placementId},item.userId);
    return json(res,201,{data:item});
  }
  if(req.method==='GET'&&p==='/v1/buyer/shortlist'){
    const buyerId=String(url.searchParams.get('buyerId')||'demo_buyer');
    const set=memory.shortlists.get(buyerId)||new Set();
    return json(res,200,{data:[...set].map(id=>memory.brands.find(b=>b.id===id)).filter(Boolean)});
  }
  if(req.method==='POST'&&p==='/v1/buyer/shortlist'){
    const b=await readBody(req);
    const buyerId=String(b.buyerId||'demo_buyer');
    const brandId=String(b.brandId||'b1');
    if(!memory.brands.find(x=>x.id===brandId))return json(res,404,{error:'brand_not_found'});
    const set=memory.shortlists.get(buyerId)||new Set();
    const saved=b.action==='remove'?false:true;
    if(saved)set.add(brandId);else set.delete(brandId);
    memory.shortlists.set(buyerId,set);
    const leadId='lead_'+crypto.randomBytes(6).toString('hex');
    if(saved)memory.commerceLeads.set(leadId,{id:leadId,brandId,buyerId,source:'shortlist',stage:'shortlisted',createdAt:new Date().toISOString(),demo:true});
    await track(saved?'brand_shortlisted':'brand_unshortlisted',{buyerId,brandId});
    return json(res,200,{saved,data:[...set]});
  }
  if(req.method==='POST'&&p==='/v1/leads'){
    const b=await readBody(req);
    const id='lead_'+crypto.randomBytes(7).toString('hex');
    const lead={id,brandId:String(b.brandId||'b1'),buyerId:String(b.buyerId||'demo_buyer'),source:String(b.source||'brand_profile'),stage:String(b.stage||'interest'),note:String(b.note||'').slice(0,500),createdAt:new Date().toISOString(),demo:true};
    memory.commerceLeads.set(id,lead);
    await track('commerce_lead_created',lead,lead.buyerId);
    return json(res,201,{data:lead});
  }

  if(req.method==='POST'&&p.startsWith('/v1/events/')&&p.endsWith('/register')){
    const eventId=p.split('/')[3];
    const event=memory.events.find(x=>x.id===eventId);
    if(!event)return json(res,404,{error:'event_not_found'});
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    if(event.accessMode==='invite_only')return json(res,403,{error:'invitation_required',eventId});
    const status=(event.accessMode==='waitlist'||(event.waitlist>0&&event.checkedIn>=event.capacity))?'waitlist':'registered';
    const key=userId+':'+eventId;
    const item={id:'reg_'+crypto.randomBytes(6).toString('hex'),userId,eventId,status,source:'app',createdAt:new Date().toISOString(),demo:true};
    memory.eventRegistrations.set(key,item);
    await track('event_registered',{eventId,status},userId);
    return json(res,201,{data:item});
  }
  if(req.method==='POST'&&p.startsWith('/v1/events/')&&p.endsWith('/cancel')){
    const eventId=p.split('/')[3];
    const b=await readBody(req);
    const userId=String(b.userId||'demo_user');
    const key=userId+':'+eventId;
    let item=memory.eventRegistrations.get(key);
    if(!item){
      item={id:'reg_'+crypto.randomBytes(6).toString('hex'),userId,eventId,status:'cancelled',source:'app',createdAt:new Date().toISOString(),demo:true};
      memory.eventRegistrations.set(key,item);
    }else{
      item.status='cancelled';item.updatedAt=new Date().toISOString();
    }
    await track('event_registration_cancelled',{eventId},userId);
    return json(res,200,{data:item});
  }
  if(req.method==='GET'&&p.startsWith('/v1/media/press-kit/')){
    const eventId=p.split('/').pop();
    const kit=memory.pressKits.find(x=>x.eventId===eventId&&x.status==='published');
    if(!kit)return json(res,404,{error:'press_kit_not_found'});
    await track('press_kit_opened',{eventId,kitId:kit.id});
    return json(res,200,{data:kit});
  }
  if(req.method==='GET'&&p.startsWith('/v1/designer/workspace/')){
    const brandId=p.split('/').pop();
    const brand=memory.brands.find(x=>x.id===brandId);
    if(!brand)return json(res,404,{error:'brand_not_found'});
    const readiness=memory.designerReadiness.find(x=>x.brandId===brandId);
    const collection=memory.collections.find(x=>x.brandId===brandId);
    const looks=collection?memory.looks.filter(x=>x.collectionId===collection.id).slice(0,8):[];
    const analytics={profileViews:1840,savedLooks:312,buyerInterest:17,lineSheetRequests:9,meetingRequests:4};
    return json(res,200,{data:{brand,collection,looks,readiness,analytics}});
  }
  if(req.method==='POST'&&p.startsWith('/v1/designer/workspace/')&&p.endsWith('/complete-look-order')){
    const brandId=p.split('/')[4];
    const readiness=memory.designerReadiness.find(x=>x.brandId===brandId);
    if(!readiness)return json(res,404,{error:'designer_workspace_not_found'});
    readiness.lookOrderComplete=true;
    readiness.issues=readiness.issues.filter(x=>!x.toLowerCase().includes('look metadata'));
    readiness.status=(readiness.profileComplete&&readiness.lookOrderComplete&&readiness.mediaComplete&&readiness.commercialDataComplete)?'ready':'in_progress';
    await track('designer_look_order_completed',{brandId});
    return json(res,200,{data:readiness});
  }
  if(req.method==='POST'&&p.startsWith('/v1/designer/workspace/')&&p.endsWith('/confirm-commercial')){
    const brandId=p.split('/')[4];
    const readiness=memory.designerReadiness.find(x=>x.brandId===brandId);
    if(!readiness)return json(res,404,{error:'designer_workspace_not_found'});
    readiness.commercialDataComplete=true;
    readiness.issues=readiness.issues.filter(x=>!x.toLowerCase().includes('wholesale'));
    readiness.status=(readiness.profileComplete&&readiness.lookOrderComplete&&readiness.mediaComplete&&readiness.commercialDataComplete)?'ready':'in_progress';
    await track('designer_commercial_confirmed',{brandId});
    return json(res,200,{data:readiness});
  }
  if(req.method==='POST'&&p==='/v1/auth/demo'){
    const b=await readBody(req);
    const name=String(b.name||'Demo User').slice(0,120);
    const role=String(b.role||'Visitor').slice(0,40);
    const userId=await issueDemoUser(name,role);
    const sessionPayload={typ:'session',sub:userId,role,name,iat:Date.now(),exp:Date.now()+6*60*60*1000,demo:true};
    const session=signPayload(sessionPayload);
    memory.sessions.set(userId,{session,sessionPayload});
    if(role==='Designer'){
      const access=memory.brandAccess.get(userId)||new Set();
      access.add('b1');
      memory.brandAccess.set(userId,access);
    }
    await track('auth_demo',{role},userId);
    return json(res,200,{user:{id:userId,name,role,demo:true},session,dataMode:pool?'postgres':'memory'});
  }

  if(req.method==='POST'&&p==='/v1/passes/issue'){
    const b=await readBody(req);
    const pass=await issuePass({
      userId:String(b.userId||'demo_user'),
      role:String(b.role||'Visitor'),
      entitlements:b.entitlements,
      eventId:b.eventId||null
    });
    await track('pass_issued',{jti:pass.payload.jti,eventId:pass.payload.eventId},pass.payload.sub);
    return json(res,201,pass);
  }
  if(req.method==='POST'&&p==='/v1/passes/verify'){
    const b=await readBody(req);
    const v=verifyToken(b.token);
    if(!v.ok) return json(res,401,v);
    const revoked=await isRevoked(v.payload.jti);
    if(revoked.revoked) return json(res,401,{ok:false,reason:'revoked',payload:v.payload});
    return json(res,200,{ok:true,payload:v.payload});
  }
  if(req.method==='POST'&&p==='/v1/passes/qr'){
    const b=await readBody(req);
    const v=verifyToken(b.token);
    if(!v.ok) return json(res,400,{error:'invalid_pass'});
    const svg=await QRCode.toString('MFW:'+b.token,{
      type:'svg',errorCorrectionLevel:'M',margin:1,width:512,
      color:{dark:'#050505',light:'#ffffff'}
    });
    return text(res,200,svg,'image/svg+xml; charset=utf-8');
  }
  if(req.method==='POST'&&p==='/v1/passes/revoke'){
    if(!adminOk(req)) return json(res,403,{error:'admin_required'});
    const b=await readBody(req);
    await revokePass(String(b.jti||''),String(b.reason||'revoked'));
    await track('pass_revoked',{jti:b.jti,reason:b.reason});
    return json(res,200,{ok:true,jti:b.jti});
  }
  if(req.method==='POST'&&p==='/v1/checkins'){
    const b=await readBody(req);
    const result=await checkin({
      token:b.token,eventId:String(b.eventId||'e1'),scannerId:String(b.scannerId||'iphone-demo'),offline:!!b.offline
    });
    return json(res,result.ok?201:(result.status==='duplicate'?409:401),result);
  }

  if(req.method==='POST'&&p==='/v1/meetings'){
    const b=await readBody(req);
    const id='mtg_'+crypto.randomBytes(8).toString('hex');
    const meeting={id,brandId:String(b.brandId||'b1'),buyerId:String(b.buyerId||'demo_buyer'),slot:String(b.slot||'14:30'),status:'confirmed',createdAt:new Date().toISOString(),demo:true};
    memory.meetings.set(id,meeting);
    await track('meeting_confirmed',meeting,meeting.buyerId);
    return json(res,201,{data:meeting});
  }
  if(req.method==='POST'&&p==='/v1/analytics/track'){
    const b=await readBody(req);
    await track(String(b.type||'unknown').slice(0,100),b.meta||{},b.userId||null);
    return json(res,202,{accepted:true});
  }
  if(req.method==='GET'&&p==='/v1/analytics/overview') return json(res,200,{data:overview()});

  if(p.startsWith('/v1/admin/')){
    if(!adminOk(req)) return json(res,403,{error:'admin_required'});
    if(req.method==='GET'&&p==='/v1/admin/overview') return json(res,200,{data:overview()});
    if(req.method==='GET'&&p==='/v1/admin/native-readiness') return json(res,200,{data:{
      shell:{status:'prepared',runtime:'Capacitor v8'},
      haptics:'prepared',
      camera:'prepared_with_web_fallback',
      push:'awaiting_apns_credentials',
      universalLinks:'awaiting_final_domain_and_bundle_id',
      wallet:'awaiting_pass_type_id_certificate',
      testflight:'awaiting_apple_team_signing'
    }});
    if(req.method==='GET'&&p==='/v1/admin/events') return json(res,200,{data:memory.events});
    if(req.method==='GET'&&p==='/v1/admin/accreditations') return json(res,200,{data:memory.accreditations});
    if(req.method==='GET'&&p==='/v1/admin/streams') return json(res,200,{data:memory.streams});
    if(req.method==='GET'&&p.startsWith('/v1/admin/streams/')&&p.endsWith('/control-plane')){
      const streamId=p.split('/')[4];
      const stream=memory.streams.find(x=>x.id===streamId||x.eventId===streamId);
      if(!stream)return json(res,404,{error:'stream_not_found'});
      return json(res,200,{data:{
        stream,
        sources:memory.streamSources.filter(x=>x.streamId===stream.id).map(src=>({...src,provider:memory.streamProviders.find(p=>p.id===src.providerId)})),
        outputs:memory.streamOutputs.filter(x=>x.streamId===stream.id),
        captions:memory.captionTracks.filter(x=>x.streamId===stream.id),
        replay:memory.replayAssets.find(x=>x.streamId===stream.id)||null,
        failover:memory.failoverEvents.filter(x=>x.streamId===stream.id).slice(-20).reverse()
      }});
    }
    if(req.method==='POST'&&p.startsWith('/v1/admin/streams/')&&p.endsWith('/failover')){
      const streamId=p.split('/')[4];
      const stream=memory.streams.find(x=>x.id===streamId||x.eventId===streamId);
      if(!stream)return json(res,404,{error:'stream_not_found'});
      const b=await readBody(req);
      const targetRole=String(b.targetRole||'backup');
      const target=memory.streamSources.find(x=>x.streamId===stream.id&&x.sourceRole===targetRole);
      const current=memory.streamSources.find(x=>x.id===stream.activeSourceId);
      if(!target)return json(res,404,{error:'target_source_not_found'});
      if(current)current.status='standby';
      target.status='active';
      const event={id:'fo_'+crypto.randomBytes(6).toString('hex'),streamId:stream.id,fromSourceId:current?.id||null,toSourceId:target.id,reason:String(b.reason||'manual_operator'),occurredAt:new Date().toISOString(),demo:true};
      memory.failoverEvents.push(event);
      stream.activeSourceId=target.id;stream.updatedAt=new Date().toISOString();
      await track('stream_failover',event);
      return json(res,200,{data:{stream,event,target}});
    }
    if(req.method==='POST'&&p.startsWith('/v1/admin/streams/')&&p.endsWith('/heartbeat')){
      const streamId=p.split('/')[4];
      const b=await readBody(req);
      const source=memory.streamSources.find(x=>x.streamId===streamId&&x.id===String(b.sourceId||'src_primary'));
      if(!source)return json(res,404,{error:'source_not_found'});
      source.lastHeartbeatAt=new Date().toISOString();
      source.health={...source.health,...(b.health||{})};
      if(Number(source.health.droppedFramesPct||0)>2||Number(source.health.latencySec||0)>15)source.status='degraded';
      return json(res,200,{data:source});
    }
    if(req.method==='POST'&&p.startsWith('/v1/admin/streams/')&&p.endsWith('/captions')){
      const streamId=p.split('/')[4];
      const b=await readBody(req);
      const language=String(b.language||'en').toLowerCase();
      let track=memory.captionTracks.find(x=>x.streamId===streamId&&x.language===language);
      if(!track){
        track={id:'cap_'+crypto.randomBytes(5).toString('hex'),streamId,language,label:language.toUpperCase(),source:String(b.source||'operator'),status:'live'};
        memory.captionTracks.push(track);
      }else{
        track.status=String(b.status||track.status);track.source=String(b.source||track.source);
      }
      return json(res,200,{data:track});
    }
    if(req.method==='POST'&&p.startsWith('/v1/admin/streams/')&&p.endsWith('/archive')){
      const streamId=p.split('/')[4];
      const stream=memory.streams.find(x=>x.id===streamId||x.eventId===streamId);
      if(!stream)return json(res,404,{error:'stream_not_found'});
      let replay=memory.replayAssets.find(x=>x.streamId===stream.id);
      if(!replay){replay={id:'rep_'+crypto.randomBytes(6).toString('hex'),streamId:stream.id,assetType:'full_show',demo:true};memory.replayAssets.push(replay);}
      replay.status='ready';replay.durationSeconds=1440;replay.playbackUrl=stream.playbackUrl;replay.publishedAt=new Date().toISOString();
      stream.replayAvailable=true;stream.status='replay';stream.updatedAt=new Date().toISOString();
      memory.streamOutputs.filter(x=>x.streamId===stream.id&&x.outputType==='recording').forEach(x=>x.status='archived');
      await track('stream_archive_ready',{streamId:stream.id,replayId:replay.id});
      return json(res,200,{data:replay,stream});
    }
    if(req.method==='GET'&&p==='/v1/admin/brand-growth'){
      const claims=[...memory.loyaltyClaims.values()];
      const memberships=[...memory.socialMemberships.values()];
      return json(res,200,{data:{
        brands:memory.brands.map(brand=>({
          id:brand.id,name:brand.name,
          followers:[...memory.brandFollows.values()].reduce((n,set)=>n+(set.has(brand.id)?1:0),0),
          publishedPosts:memory.brandPosts.filter(x=>x.brandId===brand.id&&x.status==='published').length,
          activeOffers:memory.loyaltyOffers.filter(x=>x.brandId===brand.id&&x.status==='published').length,
          issuedClaims:claims.filter(x=>memory.loyaltyOffers.find(o=>o.id===x.offerId&&o.brandId===brand.id)).length
        })),
        social:{channels:memory.socialChannels,membershipsVerified:memberships.length,activeMemberships:memberships.filter(x=>x.status==='active').length},
        offers:memory.loyaltyOffers.map(o=>({id:o.id,brandId:o.brandId,titleRu:o.titleRu,titleEn:o.titleEn,rewardType:o.rewardType,rewardValue:o.rewardValue,status:o.status,requirements:o.requirements})),
        content:{posts:memory.brandPosts,recentInteractions:memory.contentInteractions.slice(-20).reverse()},
        providers:memory.socialProviderAdapters
      }});
    }
    if(req.method==='POST'&&p==='/v1/admin/social/reverify'){
      const memberships=[...memory.socialMemberships.values()].filter(x=>x.status==='active');
      const result={checked:0,active:0,inactive:0,skipped:0,errors:[]};
      for(const membership of memberships.slice(0,250)){
        const channel=memory.socialChannels.find(x=>x.id===membership.channelId);
        if(!channel){result.skipped++;continue;}
        try{
          const verification=await verifyProviderMembership(membership.userId,channel);
          if(!verification.ok){
            result.skipped++;
            result.errors.push({userId:membership.userId,channelId:channel.id,error:verification.error});
            continue;
          }
          result.checked++;
          const updated=applyMembershipObservation(membership.userId,channel,verification,null);
          if(updated.status==='active')result.active++;else result.inactive++;
          if(updated.status!=='active'){
            for(const claim of memory.loyaltyClaims.values()){
              if(claim.userId!==membership.userId||claim.status!=='issued')continue;
              const offer=memory.loyaltyOffers.find(o=>o.id===claim.offerId);
              if(offer&&!evaluateLoyaltyOffer(claim.userId,offer).eligible){
                claim.status='revoked';
                await track('loyalty_claim_revoked',{claimId:claim.id,offerId:offer.id,reason:'social_reverification_failed'},claim.userId);
              }
            }
          }
        }catch(err){
          result.errors.push({userId:membership.userId,channelId:channel.id,error:String(err&&err.message||err)});
        }
      }
      await track('social_reverification_batch',result);
      return json(res,200,{data:result});
    }
    if(req.method==='POST'&&p==='/v1/admin/brand-content'){
      const b=await readBody(req);
      const brandId=String(b.brandId||'b1');
      if(!memory.brands.find(x=>x.id===brandId))return json(res,404,{error:'brand_not_found'});
      const post={id:'bp_'+crypto.randomBytes(6).toString('hex'),brandId,kind:String(b.kind||'news'),titleRu:String(b.titleRu||'Новая публикация'),titleEn:String(b.titleEn||'New post'),bodyRu:String(b.bodyRu||''),bodyEn:String(b.bodyEn||''),imageUrl:String(b.imageUrl||''),ctaLabelRu:String(b.ctaLabelRu||'Открыть'),ctaLabelEn:String(b.ctaLabelEn||'Open'),ctaUrl:String(b.ctaUrl||'#'),audienceScope:b.audienceScope||{kind:'brand_followers'},placementScope:b.placementScope||['brand_profile'],isPaid:!!b.isPaid,sponsorLabelRu:b.isPaid?'Реклама бренда':null,sponsorLabelEn:b.isPaid?'Brand promotion':null,status:'published',publishedAt:new Date().toISOString(),createdAt:new Date().toISOString(),demo:true};
      memory.brandPosts.unshift(post);
      await track('brand_content_published',{brandId,postId:post.id,isPaid:post.isPaid});
      return json(res,201,{data:post});
    }
    if(req.method==='PATCH'&&p.startsWith('/v1/admin/brand-content/')){
      const postId=p.split('/').pop();
      const post=memory.brandPosts.find(x=>x.id===postId);
      if(!post)return json(res,404,{error:'post_not_found'});
      const b=await readBody(req);
      if(b.status&&!['pending_review','published','rejected','paused','ended'].includes(String(b.status)))return json(res,400,{error:'invalid_status'});
      if(b.status)post.status=String(b.status);
      if(post.status==='published'&&!post.publishedAt)post.publishedAt=new Date().toISOString();
      post.moderationNote=String(b.moderationNote||post.moderationNote||'');
      await track('brand_content_moderated',{postId,status:post.status});
      return json(res,200,{data:post});
    }
    if(req.method==='PATCH'&&p.startsWith('/v1/admin/loyalty-offers/')){
      const offerId=p.split('/').pop();
      const offer=memory.loyaltyOffers.find(x=>x.id===offerId);
      if(!offer)return json(res,404,{error:'offer_not_found'});
      const b=await readBody(req);
      if(b.status&&!['draft','pending','published','paused','ended'].includes(String(b.status)))return json(res,400,{error:'invalid_status'});
      if(b.status)offer.status=String(b.status);
      await track('loyalty_offer_moderated',{offerId,status:offer.status});
      return json(res,200,{data:offer});
    }
    if(req.method==='GET'&&p==='/v1/admin/sponsors'){
      const interactions=memory.sponsorInteractions;
      const count=t=>interactions.filter(x=>x.interactionType===t).length;
      return json(res,200,{data:{
        sponsor:memory.sponsors[0],
        campaign:memory.sponsorCampaigns[0],
        placements:memory.sponsorPlacements,
        metrics:{
          impressions:24800,
          uniqueReach:19600,
          experienceOpens:6100+count('open'),
          challengeStarts:1280+count('challenge_start'),
          ctaClicks:487+count('cta_click'),
          brandProfileOpens:920+count('brand_open'),
          attributedIntents:214+count('intent')
        },
        recent:interactions.slice(-20).reverse()
      }});
    }
    if(req.method==='GET'&&p==='/v1/admin/commerce'){
      const leads=[...memory.commerceLeads.values()];
      return json(res,200,{data:{
        shortlistActions:[...memory.shortlists.values()].reduce((n,set)=>n+set.size,0),
        lineSheetRequests:27+memory.analytics.filter(x=>x.name==='line_sheet_opened').length,
        meetingRequests:48+memory.meetings.size,
        leads:leads.slice(-20).reverse(),
        funnel:{brandViews:6100,collectionOpens:2180,savedLooks:1900,shortlists:312,meetings:48+memory.meetings.size,qualified:14+leads.filter(x=>['qualified','follow_up','meeting'].includes(x.stage)).length}
      }});
    }
    if(req.method==='PATCH'&&p.startsWith('/v1/admin/streams/')){
      const streamId=p.split('/').pop();
      const body=await readBody(req);
      const stream=memory.streams.find(x=>x.id===streamId||x.eventId===streamId);
      if(!stream)return json(res,404,{error:'stream_not_found'});
      const before={...stream};
      for(const key of ['status','currentLook','totalLooks','replayAvailable']){
        if(Object.prototype.hasOwnProperty.call(body,key))stream[key]=body[key];
      }
      stream.currentLook=Math.max(1,Math.min(Number(stream.currentLook||1),Number(stream.totalLooks||1)));
      stream.updatedAt=new Date().toISOString();
      await track('stream_updated',{streamId,before,after:stream});
      return json(res,200,{data:stream});
    }
    if(req.method==='POST'&&p.startsWith('/v1/admin/streams/')&&p.endsWith('/next-look')){
      const parts=p.split('/');
      const streamId=parts[4];
      const stream=memory.streams.find(x=>x.id===streamId||x.eventId===streamId);
      if(!stream)return json(res,404,{error:'stream_not_found'});
      stream.currentLook=Math.min(stream.totalLooks,stream.currentLook+1);
      stream.updatedAt=new Date().toISOString();
      await track('stream_look_advanced',{streamId,currentLook:stream.currentLook});
      return json(res,200,{data:stream});
    }
    if(req.method==='PATCH'&&p.startsWith('/v1/admin/accreditations/')){
      var accId=p.split('/').pop();
      var accBody=await readBody(req);
      var acc=memory.accreditations.find(x=>x.id===accId);
      if(!acc)return json(res,404,{error:'accreditation_not_found'});
      if(['pending','approved','rejected','revoked'].indexOf(String(accBody.status))<0)return json(res,400,{error:'invalid_status'});
      acc.status=String(accBody.status);
      await track('accreditation_updated',{id:accId,status:acc.status});
      return json(res,200,{data:acc});
    }
    if(req.method==='POST'&&p==='/v1/admin/notifications'){
      var note=await readBody(req);
      var item={id:'ntf_'+crypto.randomBytes(6).toString('hex'),category:String(note.category||'critical'),title:String(note.title||'Programme update'),body:String(note.body||''),status:'sent',sentAt:new Date().toISOString(),demo:true};
      memory.notifications.unshift(item);
      await track('notification_sent',item);
      return json(res,201,{data:item});
    }
    if(req.method==='POST'&&p==='/v1/admin/invitations'){
      var invitationBody=await readBody(req);
      var invitation={id:'inv_'+crypto.randomBytes(6).toString('hex'),eventId:String(invitationBody.eventId||'e1'),recipient:String(invitationBody.recipient||'demo@example.com'),status:'sent',sentAt:new Date().toISOString(),demo:true};
      memory.invitations.unshift(invitation);
      await track('invitation_sent',invitation);
      return json(res,201,{data:invitation});
    }
    if(req.method==='PATCH'&&p.startsWith('/v1/admin/events/')){
      const id=p.split('/').pop();
      const b=await readBody(req);
      const e=memory.events.find(x=>x.id===id);
      if(!e) return json(res,404,{error:'event_not_found'});
      const before={...e};
      for(const k of ['title','venue','startsAt','status','accessMode','capacity','waitlist','checkedIn']){
        if(Object.prototype.hasOwnProperty.call(b,k)) e[k]=b[k];
      }
      await track('admin_event_updated',{id,before,after:e});
      return json(res,200,{data:e});
    }
    if(req.method==='POST'&&p==='/v1/admin/waitlist/release'){
      const b=await readBody(req);
      const e=memory.events.find(x=>x.id===String(b.eventId||'e1'));
      if(!e) return json(res,404,{error:'event_not_found'});
      const count=Math.max(0,Math.min(Number(b.count||0),e.waitlist||0));
      e.waitlist=Math.max(0,(e.waitlist||0)-count);
      await track('waitlist_released',{eventId:e.id,count});
      return json(res,200,{released:count,event:e});
    }
  }

  return json(res,404,{error:'not_found'});
}

async function main(){
  await migrate();
  await bootstrapDemoData();
  const selfTest=await runDeepSelfTest();
  console.log(JSON.stringify({event:'mfw_deep_self_test',...selfTest}));
  if(!selfTest.ok)throw new Error('deep_self_test_failed');
  const server=http.createServer((req,res)=>router(req,res).catch(err=>{
    console.error(err);
    json(res,500,{error:'internal_error'});
  }));
  server.listen(PORT,'0.0.0.0',()=>{
    console.log(JSON.stringify({event:'mfw_api_started',version:VERSION,port:PORT,dataMode:pool?'postgres':'memory'}));
  });
}
main().catch(err=>{console.error(err);process.exit(1);});
