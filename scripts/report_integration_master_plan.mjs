import fs from 'node:fs';
import path from 'node:path';

import {
  buildMoscowIntegrationRoadmap,
  evaluateMoscowIntegrationPhase0
} from '../src/spatial/integrationMasterPlanGate.ts';
import { parseRomanovP0EvidencePackage } from '../src/spatial/romanovP0EvidencePackage.ts';

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    result[key] = value;
    index += 1;
  }
  return result;
}

function readJson(filePath) {
  const absolute = path.resolve(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

const args = parseArgs(process.argv.slice(2));

const romanovEvidence = args.romanov
  ? parseRomanovP0EvidencePackage(fs.readFileSync(path.resolve(process.cwd(), args.romanov), 'utf8'))
  : null;

const oldEnglishCourtEvidence = args.oec
  ? readJson(args.oec)
  : null;

const visitorPilotReport = args.pilot
  ? readJson(args.pilot)
  : null;

const phase0 = evaluateMoscowIntegrationPhase0({
  romanovEvidence,
  oldEnglishCourtEvidence,
  visitorPilotReport,
  visitorPilotEvidenceRef: args['pilot-ref'] ?? null
});

const roadmap = buildMoscowIntegrationRoadmap({ phase0 });

console.log(JSON.stringify({
  planVersion: roadmap.planVersion,
  phase0: roadmap.phase0,
  nextPhase: roadmap.nextPhase,
  phases: roadmap.phases,
  suppliedEvidence: {
    romanov: Boolean(args.romanov),
    oldEnglishCourt: Boolean(args.oec),
    visitorPilot: Boolean(args.pilot),
    visitorPilotEvidenceRef: Boolean(args['pilot-ref'])
  }
}, null, 2));

if (phase0.status !== 'pass') {
  process.exitCode = 2;
}
