#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildVisitorWaveManifest } from '../src/government/visitorWaveManifest.ts';

const studyId=process.argv[2];
const contentVersion=process.argv[3];
const count=Number(process.argv[4]);
const out=process.argv[5] || 'evidence/pre-pilot/visitor-wave-manifest.json';
if(!studyId||!contentVersion||!Number.isInteger(count)) {
  console.error('Usage: npm run pilot:visitor-wave -- <studyId> <contentVersion> <20..50> [out.json]');
  process.exit(2);
}
const manifest=buildVisitorWaveManifest({studyId,expectedContentVersion:contentVersion,participantCount:count});
const resolved=path.resolve(process.cwd(),out);
const rel=path.relative(process.cwd(),resolved);
if(rel.startsWith('..')||path.isAbsolute(rel)) throw new Error('output must stay inside repository');
fs.mkdirSync(path.dirname(resolved),{recursive:true});
fs.writeFileSync(resolved,JSON.stringify(manifest,null,2)+'\n');
console.log(out);
