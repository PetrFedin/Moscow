#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildRomanovFieldSessionPlan } from '../src/government/fieldSessionPlan.ts';

const configPath=process.argv[2];
const out=process.argv[3] || 'evidence/pre-pilot/romanov-field-session-plan.json';
if(!configPath) {
  console.error('Usage: npm run pilot:field-plan -- <config.json> [out.json]');
  process.exit(2);
}
const config=JSON.parse(fs.readFileSync(path.resolve(process.cwd(),configPath),'utf8'));
const plan=buildRomanovFieldSessionPlan(config);
const resolved=path.resolve(process.cwd(),out);
const rel=path.relative(process.cwd(),resolved);
if(rel.startsWith('..')||path.isAbsolute(rel)) throw new Error('output must stay inside repository');
fs.mkdirSync(path.dirname(resolved),{recursive:true});
fs.writeFileSync(resolved,JSON.stringify(plan,null,2)+'\n');
console.log(out);
