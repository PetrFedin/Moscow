#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { evaluatePrePilotGate } from '../src/government/prePilotGoNoGo.ts';

function safeRead(relativePath) {
  const resolved=path.resolve(process.cwd(),relativePath);
  const rel=path.relative(process.cwd(),resolved);
  if(rel.startsWith('..')||path.isAbsolute(rel)) throw new Error(`path escapes repository: ${relativePath}`);
  return JSON.parse(fs.readFileSync(resolved,'utf8'));
}

const configPath=process.argv[2];
if(!configPath){
  console.error('Usage: npm run pilot:preflight -- <config.json>');
  process.exit(2);
}
const config=safeRead(configPath);
const result=evaluatePrePilotGate({
  ...config,
  owners:safeRead(config.ownersPath),
  romanovFieldPlan:safeRead(config.romanovFieldPlanPath),
  visitorWave:safeRead(config.visitorWavePath)
});
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(result.status!=='GO_FOR_CONTROLLED_PILOT') process.exitCode=2;
