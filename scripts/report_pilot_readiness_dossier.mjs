#!/usr/bin/env node
import { currentPilotReadinessDossier } from '../src/government/pilotReadinessDossier.ts';

const args = process.argv.slice(2);
const asText = args.includes('--text');
const unknown = args.filter((arg) => arg !== '--text');

if (unknown.length > 0) {
  throw new Error(`Unexpected argument: ${unknown[0]}`);
}

if (!asText) {
  process.stdout.write(JSON.stringify(currentPilotReadinessDossier, null, 2) + '\n');
} else {
  const d = currentPilotReadinessDossier;
  const lines = [
    'MOSCOW PILOT READINESS DOSSIER',
    `total: ${d.summary.total}`,
    `preparableNow: ${d.summary.preparableNow}`,
    `blockedField: ${d.summary.blockedField}`,
    `blockedExternal: ${d.summary.blockedExternal}`,
    `blockedLegal: ${d.summary.blockedLegal}`,
    `phase0Status: ${d.summary.phase0Status}`,
    `decisionPackReady: ${d.summary.decisionPackReady}`,
    `submissionReady: ${d.summary.submissionReady}`,
    '',
    'ITEMS'
  ];

  for (const item of d.items) {
    lines.push(
      `- [${item.status}] ${item.title}`,
      `  owner: ${item.requiredOwner}`,
      `  input: ${item.requiredInput}`,
      `  gate: ${item.acceptanceGate}`,
      `  blockedUntil: ${item.blockedUntil ?? 'none'}`
    );
  }

  process.stdout.write(lines.join('\n') + '\n');
}
