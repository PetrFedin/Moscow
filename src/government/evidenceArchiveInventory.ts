import { createHash } from 'node:crypto';

export const PILOT_EVIDENCE_INVENTORY_VERSION = 1 as const;

export type PilotEvidenceInventoryEntry = {
  path: string;
  sizeBytes: number;
  sha256: string;
};

export type PilotEvidenceInventory = {
  kind: 'moscow-pilot-evidence-hash-inventory';
  version: typeof PILOT_EVIDENCE_INVENTORY_VERSION;
  pilotId: 'varvarka-zaryadye-pilot';
  runId: string;
  generatedAt: string;
  rootRelative: string;
  files: PilotEvidenceInventoryEntry[];
  rootHash: string;
  integrityMeaning: 'file-integrity-only-not-authenticity';
};

function validHash(value: string) {
  return /^[a-f0-9]{64}$/.test(value);
}

function safeRelativePath(value: string) {
  if (!value || value.startsWith('/') || /^[a-zA-Z]:\//.test(value)) return false;
  const normalized=value.replace(/\\/g,'/');
  return !normalized.split('/').includes('..');
}

export function canonicalEvidenceInventoryPayload(
  entries: PilotEvidenceInventoryEntry[]
) {
  return [...entries]
    .sort((a,b)=>a.path.localeCompare(b.path))
    .map((entry)=>`${entry.path}\t${entry.sizeBytes}\t${entry.sha256}`)
    .join('\n');
}

export function computeEvidenceInventoryRootHash(
  entries: PilotEvidenceInventoryEntry[]
) {
  return createHash('sha256')
    .update(canonicalEvidenceInventoryPayload(entries),'utf8')
    .digest('hex');
}

export function buildPilotEvidenceInventory(input:{
  runId:string;
  generatedAt:string;
  rootRelative:string;
  files:PilotEvidenceInventoryEntry[];
}):PilotEvidenceInventory {
  const sorted=[...input.files].sort((a,b)=>a.path.localeCompare(b.path));
  return {
    kind:'moscow-pilot-evidence-hash-inventory',
    version:PILOT_EVIDENCE_INVENTORY_VERSION,
    pilotId:'varvarka-zaryadye-pilot',
    runId:input.runId,
    generatedAt:input.generatedAt,
    rootRelative:input.rootRelative,
    files:sorted,
    rootHash:computeEvidenceInventoryRootHash(sorted),
    integrityMeaning:'file-integrity-only-not-authenticity'
  };
}

export function validatePilotEvidenceInventory(
  inventory:PilotEvidenceInventory
) {
  const blockers:string[]=[];

  if (inventory.kind !== 'moscow-pilot-evidence-hash-inventory') blockers.push('kind-invalid');
  if (inventory.version !== PILOT_EVIDENCE_INVENTORY_VERSION) blockers.push('version-invalid');
  if (inventory.pilotId !== 'varvarka-zaryadye-pilot') blockers.push('pilot-invalid');
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(inventory.runId)) blockers.push('run-id-invalid');
  if (!Number.isFinite(Date.parse(inventory.generatedAt))) blockers.push('generated-at-invalid');
  if (!safeRelativePath(inventory.rootRelative)) blockers.push('root-relative-invalid');
  if (inventory.integrityMeaning !== 'file-integrity-only-not-authenticity') blockers.push('integrity-meaning-invalid');

  const seen=new Set<string>();
  for (const [index,entry] of inventory.files.entries()) {
    if (!safeRelativePath(entry.path)) blockers.push(`file-path-invalid:${index}`);
    if (seen.has(entry.path)) blockers.push(`file-path-duplicate:${entry.path}`);
    seen.add(entry.path);
    if (!Number.isInteger(entry.sizeBytes) || entry.sizeBytes < 0) blockers.push(`file-size-invalid:${entry.path}`);
    if (!validHash(entry.sha256)) blockers.push(`file-hash-invalid:${entry.path}`);
  }

  if (inventory.files.length === 0) blockers.push('files-empty');

  const expectedRootHash=computeEvidenceInventoryRootHash(inventory.files);
  if (!validHash(inventory.rootHash)) blockers.push('root-hash-invalid');
  if (inventory.rootHash !== expectedRootHash) blockers.push('root-hash-mismatch');

  const sortedPaths=[...inventory.files].map(x=>x.path).sort((a,b)=>a.localeCompare(b));
  if (JSON.stringify(sortedPaths)!==JSON.stringify(inventory.files.map(x=>x.path))) {
    blockers.push('files-not-canonically-sorted');
  }

  return {
    valid:blockers.length===0,
    blockers:[...new Set(blockers)],
    fileCount:inventory.files.length,
    rootHash:inventory.rootHash
  };
}
