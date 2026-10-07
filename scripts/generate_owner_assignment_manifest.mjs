#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildOwnerAssignmentTemplate } from '../src/government/ownerAssignmentManifest.ts';

const out=process.argv[2] || 'evidence/pre-pilot/owner-assignment.json';
const resolved=path.resolve(process.cwd(),out);
const rel=path.relative(process.cwd(),resolved);
if(rel.startsWith('..')||path.isAbsolute(rel)) throw new Error('output must stay inside repository');
fs.mkdirSync(path.dirname(resolved),{recursive:true});
fs.writeFileSync(resolved,JSON.stringify(buildOwnerAssignmentTemplate(),null,2)+'\n');
console.log(out);
