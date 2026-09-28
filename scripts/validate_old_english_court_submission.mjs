import fs from 'node:fs';
import path from 'node:path';

import { buildGlbBinaryReport } from './report_glb_asset.mjs';
import {
  buildOldEnglishCourtModelCandidateFromSubmission,
  parseOldEnglishCourtModelSubmissionManifest
} from '../src/spatial/oldEnglishCourtModelSubmission.ts';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertReportMatchesActual(supplied, actual) {
  if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) {
    throw new Error('binary report must be a JSON object');
  }
  for (const [key, actualValue] of Object.entries(actual)) {
    if (supplied[key] !== actualValue) {
      throw new Error(
        `binary report does not match actual GLB: ${key}; supplied=${String(supplied[key])}; actual=${String(actualValue)}`
      );
    }
  }
  const suppliedKeys = Object.keys(supplied);
  const actualKeys = Object.keys(actual);
  if (suppliedKeys.length !== actualKeys.length) {
    throw new Error('binary report has unexpected or missing fields');
  }
}

const requestedManifest = process.argv[2];
if (!requestedManifest) {
  console.error(
    'Usage: npm run validate:oec-model-submission -- <path-to-submission.json>'
  );
  process.exit(2);
}

try {
  const manifestPath = path.resolve(process.cwd(), requestedManifest);
  const manifest = parseOldEnglishCourtModelSubmissionManifest(
    fs.readFileSync(manifestPath, 'utf8')
  );

  const assetPath = path.resolve(process.cwd(), manifest.assetPath);
  const reportPath = path.resolve(process.cwd(), manifest.binaryReportPath);
  const evidenceFiles = [
    ['provenance', manifest.provenanceEvidenceRef],
    ['rights', manifest.rightsEvidenceRef],
    ['metric scale', manifest.metricScaleEvidenceRef]
  ];

  if (!fs.existsSync(assetPath)) {
    throw new Error(`GLB does not exist: ${manifest.assetPath}`);
  }
  if (!fs.existsSync(reportPath)) {
    throw new Error(`binary report does not exist: ${manifest.binaryReportPath}`);
  }
  for (const [label, evidenceRef] of evidenceFiles) {
    const evidencePath = path.resolve(process.cwd(), evidenceRef);
    if (!fs.existsSync(evidencePath) || !fs.statSync(evidencePath).isFile()) {
      throw new Error(`${label} evidence file does not exist: ${evidenceRef}`);
    }
  }

  const actualReport = buildGlbBinaryReport(assetPath);
  const suppliedReport = readJson(reportPath);
  assertReportMatchesActual(suppliedReport, actualReport);

  const candidate = buildOldEnglishCourtModelCandidateFromSubmission(
    manifest,
    actualReport
  );

  process.stdout.write(JSON.stringify({
    accepted: true,
    candidateId: candidate.id,
    version: candidate.version,
    assetPath: candidate.assetPath,
    sha256: candidate.checksumSha256,
    authority: 'old-english-court-spatial-authority-v1',
    nextGates: [
      'old-english-court-metric-authority',
      'old-english-court-control-point-authority',
      'physical-survey',
      'field-proof'
    ]
  }, null, 2) + '\n');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
