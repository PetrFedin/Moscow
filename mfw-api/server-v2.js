const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
let Pool = null;
try { ({ Pool } = require('pg')); } catch (_) {}

const PORT = Number(process.env.PORT || 10000);
const ORIGIN = process.env.MFW_ALLOWED_ORIGIN || 'https://moscow-fashion-week-preview.onrender.com';
const VERSION = 'mfw-authority-v2';
const DATABASE_URL = process.env.DATABASE_URL || '';
const KEY_SEED = process.env.MFW_ES256_SEED || 'mfw-demo-authority-seed-rotate-before-production';
const ADMIN_TOKEN = process.env.MFW_ADMIN_TOKEN || 'mfw-demo-admin';

function validateInvestorBuild(){
  const frontendPath=path.join(__dirname,'..','mfw','app.js');
  const adminPath=path.join(__dirname,'..','mfw','admin','admin.js');
  const manifestPath=path.join(__dirname,'..','mfw','manifest.webmanifest');
  const frontend=fs.readFileSync(frontendPath,'utf8');
  const admin=fs.readFileSync(adminPath,'utf8');
  new Function(frontend);
  new Function(admin);
  JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  for(const required of ['camera-scan','offline-current','admin-console','/v1/checkins','/v1/passes/qr','/v1/streams/e1','cinema-player','post-show-recap','/v1/buyer/shortlist','/v1/line-sheets/','buyer-followup','/v1/sponsor/interactions','sponsor-challenge','/v1/networking/qr','/v1/boards','/v1/meetups','/v1/perks','/v1/media/press-kit/','/v1/designer/workspace/','toggle-lang','mfwLang','I18N','static.tildacdn.com']){
    if(frontend.indexOf(required)<0)throw new Error('missing_investor_hook:'+required);
  }
  for(const required of ['/health/deep','/overview','/events','/accreditations','waitlist/release','/streams','next-look','/commerce','/sponsors','control-plane','stream-failover','toggle-lang','mfwAdminLang']){
    if(admin.indexOf(required)<0)throw new Error('missing_admin_hook:'+required);
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
function adminOk(req){
  if(req.headers['x-mfw-admin']===ADMIN_TOKEN)return true;
  var auth=String(req.headers.authorization||'');
  if(!auth.startsWith('Bearer '))return false;
  var v=verifyToken(auth.slice(7));
  return !!(v.ok&&v.payload&&v.payload.typ==='session'&&['Organizer','Staff'].indexOf(v.payload.role)>=0);
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

  const localeAuthority=true;
  const roles=await runRoleGoldenPathSelfTest();

  const sponsorTest={id:'self_spi_'+crypto.randomBytes(4).toString('hex'),campaignId:'cmp1',placementId:'pl1',userId:'self_test',interactionType:'open'};
  memory.sponsorInteractions.push(sponsorTest);
  const sponsorAuthority=memory.sponsors.some(x=>x.id==='sp1')&&memory.sponsorCampaigns.some(x=>x.id==='cmp1')&&memory.sponsorPlacements.some(x=>x.id==='pl1')&&memory.sponsorInteractions.some(x=>x.id===sponsorTest.id);
  memory.sponsorInteractions=memory.sponsorInteractions.filter(x=>x.id!==sponsorTest.id);

  const ok=!!(verified.ok&&svg.indexOf('<svg')>=0&&first.ok&&!second.ok&&second.status==='duplicate'&&streamSync&&streamingBoundary&&commerceAuthority&&networkingAuthority&&localeAuthority&&sponsorAuthority&&roles.all);
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
    es256:true,qr:true,offlineVerification:true,duplicateCheckin:true,revocation:true,streamAuthority:true,streamingBoundary:true,commerceAuthority:true,networkingAuthority:true,localeAuthority:true,sponsorAuthority:true
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
