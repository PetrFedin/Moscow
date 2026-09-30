import { createHash } from 'node:crypto';

import type { JourneyEvidencePack } from './journeyEvidencePack.ts';
import type { ProviderAdmissionResult, RealProviderAdmission } from './realProviderAdmission.ts';

export const REAL_PROVIDER_EVIDENCE_RUN_VERSION = 1 as const;

export type EvidenceArchiveEntry = {
  path: string;
  sha256: string;
  evidenceRef: string;
};

export type RealProviderEvidenceRun = {
  version: typeof REAL_PROVIDER_EVIDENCE_RUN_VERSION;
  runId: string;
  providerId: string;
  startedAt: string;
  completedAt: string;
  admission: RealProviderAdmission;
  admissionResult: ProviderAdmissionResult;
  journeyEvidencePack: JourneyEvidencePack;
  archive: EvidenceArchiveEntry[];
};

export type EvidenceArchiveManifest = {
  schemaVersion: 1;
  runId: string;
  providerId: string;
  createdAt: string;
  entries: EvidenceArchiveEntry[];
  rootSha256: string;
};

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalEntries(entries: EvidenceArchiveEntry[]) {
  return [...entries]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((entry) => `${entry.path}\n${entry.sha256}\n${entry.evidenceRef}`)
    .join('\n---\n');
}

export function buildEvidenceArchiveManifest(input: {
  runId: string;
  providerId: string;
  createdAt: string;
  entries: EvidenceArchiveEntry[];
}): EvidenceArchiveManifest {
  if (!input.runId.trim()) throw new Error('Evidence archive requires runId');
  if (!input.providerId.trim()) throw new Error('Evidence archive requires providerId');
  if (!Number.isFinite(Date.parse(input.createdAt))) throw new Error('Evidence archive requires valid createdAt');
  if (input.entries.length === 0) throw new Error('Evidence archive requires entries');

  const seen = new Set<string>();
  for (const entry of input.entries) {
    if (!entry.path.trim() || entry.path.startsWith('/') || entry.path.includes('..')) {
      throw new Error(`Unsafe evidence archive path: ${entry.path}`);
    }
    if (seen.has(entry.path)) throw new Error(`Duplicate evidence archive path: ${entry.path}`);
    seen.add(entry.path);
    if (!/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error(`Invalid evidence SHA-256: ${entry.path}`);
    if (!entry.evidenceRef.trim()) throw new Error(`Missing evidence ref: ${entry.path}`);
  }

  const entries = [...input.entries].sort((a, b) => a.path.localeCompare(b.path));
  return {
    schemaVersion: 1,
    runId: input.runId,
    providerId: input.providerId,
    createdAt: input.createdAt,
    entries,
    rootSha256: sha256(canonicalEntries(entries))
  };
}

export function verifyEvidenceArchiveManifest(manifest: EvidenceArchiveManifest) {
  return sha256(canonicalEntries(manifest.entries)) === manifest.rootSha256;
}

export function validateRealProviderEvidenceRun(
  run: RealProviderEvidenceRun
) {
  const blockers: string[] = [];
  if (!run.runId.trim()) blockers.push('evidence-run-id-missing');
  if (!Number.isFinite(Date.parse(run.startedAt))) blockers.push('evidence-run-start-invalid');
  if (!Number.isFinite(Date.parse(run.completedAt))) blockers.push('evidence-run-completion-invalid');
  if (Date.parse(run.completedAt) < Date.parse(run.startedAt)) blockers.push('evidence-run-time-order-invalid');
  if (run.admissionResult.status !== 'admitted') blockers.push('provider-admission-not-passed');
  if (run.providerId !== run.admission.providerId) blockers.push('run-admission-provider-mismatch');
  if (run.providerId !== run.journeyEvidencePack.providerId) blockers.push('run-pack-provider-mismatch');
  if (run.journeyEvidencePack.source.integrationProof.status !== 'complete') blockers.push('integration-proof-not-complete');
  if (run.archive.length === 0) blockers.push('immutable-archive-empty');

  const requiredEvidence = [
    'credentials',
    'capabilities',
    'schema-mapping',
    'raw-snapshot',
    'ingestion',
    'projection',
    'provider-change',
    'replan',
    'runtime',
    'provider-receipt',
    'journey-evidence-pack'
  ];
  for (const name of requiredEvidence) {
    if (!run.archive.some((entry) => entry.path.includes(name))) {
      blockers.push(`archive-entry-missing:${name}`);
    }
  }

  return {
    status: blockers.length === 0 ? 'pass' as const : 'blocked' as const,
    runId: run.runId,
    providerId: run.providerId,
    blockers: [...new Set(blockers)]
  };
}
