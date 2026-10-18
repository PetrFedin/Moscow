import { probeMoscowRelease } from '../src/travel/releaseCandidateProbe.ts';

const [url,expectedSha,expectedBranch,expectedServiceId]=process.argv.slice(2);
if(!url||!expectedSha||!expectedBranch||!expectedServiceId){
  console.error('Usage: npm run release:probe -- https://<render-host>.onrender.com <40-char-sha> <branch> <srv-id>');
  process.exitCode=2;
}else{
  try{
    const result=await probeMoscowRelease({url,expectedSha,expectedBranch,expectedServiceId});
    console.log(JSON.stringify(result,null,2));
    process.exitCode=result.acceptance.releaseReady?0:2;
  }catch(e){
    console.error(JSON.stringify({releaseReady:false,error:e instanceof Error?e.message:'Invalid release probe request'}));
    process.exitCode=2;
  }
}
