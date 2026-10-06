#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const runId=process.argv[2];
if(!runId || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(runId)){
  console.error('Usage: npm run pilot:init-evidence -- <pilot-run-id>');
  process.exit(2);
}
const root=path.resolve(process.cwd(),'evidence','varvarka-zaryadye',runId);
const rel=path.relative(process.cwd(),root);
if(rel.startsWith('..')||path.isAbsolute(rel)) throw new Error('archive path escapes repository');
const dirs=[
  '00-governance','01-build','02-romanov','03-old-english-court',
  '04-visitor-pilot/reports','04-visitor-pilot/observers','05-provider',
  '06-observability','07-economics','08-acceptance','09-final'
];
for(const d of dirs) fs.mkdirSync(path.join(root,d),{recursive:true});
const readme=[
  '# Pilot evidence archive',
  '',
  `runId: ${runId}`,
  '',
  'This directory is a container for real evidence only.',
  'Do not create placeholder PASS artifacts or synthetic provider/field evidence.'
].join('\n');
fs.writeFileSync(path.join(root,'README.md'),readme+'\n',{flag:'wx'});
console.log(path.relative(process.cwd(),root));
