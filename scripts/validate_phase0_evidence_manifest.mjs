import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

import {
  assertMoscowPhase0EvidenceManifest
} from '../src/spatial/integrationPhase0EvidenceManifest.ts';
import {
  buildMoscowIntegrationRoadmap,
  evaluateMoscowIntegrationPhase0
} from '../src/spatial/integrationMasterPlanGate.ts';
import { parseRomanovP0EvidencePackage } from '../src/spatial/romanovP0EvidencePackage.ts';

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function resolveEvidence(baseDir, relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const absolute = path.resolve(baseDir, normalized);
  const relative = path.relative(baseDir, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Evidence path escapes manifest directory: ${relativePath}`);
  }
  return absolute;
}

function readVerified(baseDir, ref, label) {
  const absolute = resolveEvidence(baseDir, ref.path);
  const bytes = fs.readFileSync(absolute);
  const actual = sha256(bytes);
  if (actual.toLowerCase() !== ref.sha256.toLowerCase()) {
    throw new Error(`${label} SHA-256 mismatch: expected ${ref.sha256}, got ${actual}`);
  }
  return {
    absolute,
    relative: ref.path,
    sha256: actual,
    raw: bytes.toString('utf8')
  };
}

const manifestArg = process.argv[2];
if (!manifestArg) {
  console.error('Usage: npm run integration:validate-phase0 -- <phase0-evidence-manifest.json>');
  process.exit(2);
}

const manifestPath = path.resolve(process.cwd(), manifestArg);
const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
const manifest = assertMoscowPhase0EvidenceManifest(JSON.parse(manifestRaw));
const baseDir = path.dirname(manifestPath);

const romanovFile = readVerified(baseDir, manifest.romanovEvidencePackage, 'Romanov evidence package');
const oecFile = readVerified(baseDir, manifest.oldEnglishCourtRepeatabilityProof, 'Old English Court proof');
const pilotFile = readVerified(baseDir, manifest.visitorPilotReport, 'Visitor pilot report');

const romanovEvidence = parseRomanovP0EvidencePackage(romanovFile.raw);
const oldEnglishCourtEvidence = JSON.parse(oecFile.raw);
const visitorPilotReport = JSON.parse(pilotFile.raw);

const phase0 = evaluateMoscowIntegrationPhase0({
  romanovEvidence,
  oldEnglishCourtEvidence,
  visitorPilotReport,
  visitorPilotEvidenceRef: `${pilotFile.relative}#sha256:${pilotFile.sha256}`
});
const roadmap = buildMoscowIntegrationRoadmap({ phase0 });

const manifestSha256 = sha256(Buffer.from(manifestRaw));

console.log(JSON.stringify({
  kind: 'moscow-integration-phase0-validation',
  manifest: {
    path: manifestArg,
    sha256: manifestSha256,
    createdAt: manifest.createdAt
  },
  evidence: {
    romanov: {
      path: romanovFile.relative,
      sha256: romanovFile.sha256,
      releaseReady: romanovEvidence.releaseReady
    },
    oldEnglishCourt: {
      path: oecFile.relative,
      sha256: oecFile.sha256
    },
    visitorPilot: {
      path: pilotFile.relative,
      sha256: pilotFile.sha256
    }
  },
  phase0,
  nextPhase: roadmap.nextPhase
}, null, 2));

if (phase0.status !== 'pass') process.exitCode = 2;
