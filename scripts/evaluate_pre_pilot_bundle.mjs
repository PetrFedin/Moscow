#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  configurationToPrePilotRefs,
  validatePrePilotConfigurationBundle
} from '../src/government/prePilotConfigurationBundle.ts';
import { evaluatePrePilotGate } from '../src/government/prePilotGoNoGo.ts';

function safeJson(relativePath) {
  const resolved=path.resolve(process.cwd(),relativePath);
  const rel=path.relative(process.cwd(),resolved);
  if(rel.startsWith('..')||path.isAbsolute(rel)) throw new Error(`path escapes repository: ${relativePath}`);
  return JSON.parse(fs.readFileSync(resolved,'utf8'));
}

const bundlePath=process.argv[2];
if(!bundlePath){
  console.error('Usage: npm run pilot:preflight-bundle -- <bundle.json>');
  process.exit(2);
}

const bundle=safeJson(bundlePath);
const bundleValidation=validatePrePilotConfigurationBundle(bundle);

if(!bundleValidation.valid){
  process.stdout.write(JSON.stringify({
    status:'NO_GO',
    stage:'configuration-bundle',
    blockers:bundleValidation.blockers
  },null,2)+'\n');
  process.exit(2);
}

const refs=configurationToPrePilotRefs(bundle);
const result=evaluatePrePilotGate({
  owners:safeJson(bundle.manifests.ownerAssignmentPath),
  romanovFieldPlan:safeJson(bundle.manifests.romanovFieldPlanPath),
  visitorWave:safeJson(bundle.manifests.visitorWavePath),
  ...refs
});

process.stdout.write(JSON.stringify({
  bundleId:bundle.bundleId,
  pilotId:bundle.pilotId,
  site:bundle.pilotSite,
  frozenBuild:bundle.frozenBuild,
  provider:{
    providerId:bundle.provider.providerId,
    companyMode:bundle.provider.companyMode,
    companyId:bundle.provider.companyId,
    companyAuthorityRef:bundle.provider.companyAuthorityRef
  },
  result
},null,2)+'\n');

if(result.status!=='GO_FOR_CONTROLLED_PILOT') process.exitCode=2;
