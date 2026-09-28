import fs from 'node:fs';
import path from 'node:path';

import { buildGlbBinaryReport } from './report_glb_asset.mjs';
import {
  buildOldEnglishCourtModelCandidateFromSubmission,
  parseOldEnglishCourtModelSubmissionManifest
} from '../src/spatial/oldEnglishCourtModelSubmission.ts';
import {
  validateOldEnglishCourtStructuredEvidence
} from '../src/spatial/oldEnglishCourtSubmissionEvidence.ts';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveBundlePath(bundleRoot, relativePath) {
  const resolved = path.resolve(bundleRoot, relativePath);
  const relative = path.relative(bundleRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`submission path escapes bundle: ${relativePath}`);
  }
  return resolved;
}

function assertNonEmptyFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`${label} file does not exist: ${filePath}`);
  }
  if (fs.statSync(filePath).size <= 0) {
    throw new Error(`${label} file is empty: ${filePath}`);
  }
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

  const bundleRoot = path.dirname(manifestPath);
  const assetPath = resolveBundlePath(bundleRoot, manifest.assetPath);
  const reportPath = resolveBundlePath(bundleRoot, manifest.binaryReportPath);
  const provenancePath = resolveBundlePath(bundleRoot, manifest.provenanceEvidenceRef);
  const rightsPath = resolveBundlePath(bundleRoot, manifest.rightsEvidenceRef);
  const metricScalePath = resolveBundlePath(bundleRoot, manifest.metricScaleEvidenceRef);

  assertNonEmptyFile(assetPath, 'GLB');
  assertNonEmptyFile(reportPath, 'binary report');
  assertNonEmptyFile(provenancePath, 'provenance evidence');
  assertNonEmptyFile(rightsPath, 'rights evidence');
  assertNonEmptyFile(metricScalePath, 'metric scale evidence');

  const actualReport = buildGlbBinaryReport(assetPath);
  const suppliedReport = readJson(reportPath);
  assertReportMatchesActual(suppliedReport, actualReport);

  const expectedIdentity = {
    modelId: manifest.id,
    modelVersion: manifest.modelVersion,
    checksumSha256: actualReport.sha256
  };
  const evidence = {
    provenance: readJson(provenancePath),
    rights: readJson(rightsPath),
    metricScale: readJson(metricScalePath)
  };
  const evidenceValidation = validateOldEnglishCourtStructuredEvidence(
    evidence,
    expectedIdentity
  );
  if (!evidenceValidation.valid) {
    throw new Error(
      `Old English Court structured evidence failed: ${evidenceValidation.blockers.join('; ')}`
    );
  }

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
    evidence: {
      provenance: manifest.provenanceEvidenceRef,
      rights: manifest.rightsEvidenceRef,
      metricScale: manifest.metricScaleEvidenceRef
    },
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
