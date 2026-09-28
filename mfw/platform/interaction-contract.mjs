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
 ['profile form',html,'id="profileForm"'],
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
['favorite-brand','mfwFavoriteBrands','brand-loyalty','loyalty-follow-brand'].forEach(x=>{if(!mfw.includes(x))throw new Error('MFW loyalty/favorite contract missing: '+x)});
['z-index:9999','visibility:visible!important','100dvh'].forEach(x=>{if(!mfwCss.includes(x))throw new Error('MFW mobile nav hardening missing: '+x)});
console.log('MFW navigation + loyalty contract: PASS');
