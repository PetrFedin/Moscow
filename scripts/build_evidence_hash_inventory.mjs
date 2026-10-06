#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  buildPilotEvidenceInventory,
  validatePilotEvidenceInventory
} from '../src/government/evidenceArchiveInventory.ts';

const runId=process.argv[2];
if(!runId){
  console.error('Usage: npm run pilot:evidence-inventory -- <pilot-run-id>');
  process.exit(2);
}

const root=path.resolve(process.cwd(),'evidence','varvarka-zaryadye',runId);
const relativeRoot=path.relative(process.cwd(),root).replace(/\\/g,'/');
if(relativeRoot.startsWith('..')||path.isAbsolute(relativeRoot)){
  throw new Error('evidence root escapes repository');
}
if(!fs.existsSync(root) || !fs.statSync(root).isDirectory()){
  console.error(`Evidence root does not exist: ${relativeRoot}`);
  process.exit(2);
}

const outputPath=path.join(root,'09-final','evidence-hash-inventory.json');
const files=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){
      walk(full);
      continue;
    }
    if(!entry.isFile()) continue;
    if(path.resolve(full)===path.resolve(outputPath)) continue;
    const buffer=fs.readFileSync(full);
    const rel=path.relative(root,full).replace(/\\/g,'/');
    files.push({
      path:rel,
      sizeBytes:buffer.byteLength,
      sha256:createHash('sha256').update(buffer).digest('hex')
    });
  }
}

walk(root);
if(files.length===0){
  console.error('No evidence files found; refusing to create empty inventory');
  process.exit(2);
}

const inventory=buildPilotEvidenceInventory({
  runId,
  generatedAt:new Date().toISOString(),
  rootRelative:relativeRoot,
  files
});
const validation=validatePilotEvidenceInventory(inventory);
if(!validation.valid){
  console.error(JSON.stringify(validation,null,2));
  process.exit(2);
}

fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(inventory,null,2)+'\n');
console.log(JSON.stringify({
  status:'INVENTORY_CREATED',
  fileCount:validation.fileCount,
  rootHash:validation.rootHash,
  output:path.relative(process.cwd(),outputPath).replace(/\\/g,'/'),
  integrityMeaning:inventory.integrityMeaning
},null,2));
