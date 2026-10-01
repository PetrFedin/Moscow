import fs from 'node:fs';
import path from 'node:path';

import { evaluateProviderProofGate } from '../src/integrations/providerProofGate.ts';

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
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
const providerId = args.provider ?? 'yclients';
const admission = args.admission ? readJson(args.admission) : null;
const evidenceRun = args.run ? readJson(args.run) : null;

const runtimeCredentialsConfigured =
  providerId === 'yclients'
    ? Boolean(
        process.env.YCLIENTS_PARTNER_TOKEN
        && process.env.YCLIENTS_USER_TOKEN
        && process.env.YCLIENTS_COMPANY_ID
      )
    : false;

const gate = evaluateProviderProofGate({
  providerId,
  runtimeCredentialsConfigured,
  admission,
  evidenceRun
});

console.log(JSON.stringify({
  kind: 'moscow-real-provider-proof-status',
  providerId,
  gate,
  suppliedEvidence: {
    admission: Boolean(args.admission),
    evidenceRun: Boolean(args.run)
  },
  runtimeSecrets: providerId === 'yclients'
    ? {
        companyIdConfigured: Boolean(process.env.YCLIENTS_COMPANY_ID),
        partnerTokenConfigured: Boolean(process.env.YCLIENTS_PARTNER_TOKEN),
        userTokenConfigured: Boolean(process.env.YCLIENTS_USER_TOKEN)
      }
    : {
        configured: runtimeCredentialsConfigured
      },
  rule: 'Evidence Signing Authority is available only after a validated real-provider PASS.'
}, null, 2));

if (gate.status !== 'pass') process.exitCode = 2;
