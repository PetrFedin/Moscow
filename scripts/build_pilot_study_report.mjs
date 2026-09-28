#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  assertPilotStudyManifest,
  buildPilotStudyReport
} from '../src/analytics/pilotStudy.ts';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveBundlePath(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`pilot study path escapes bundle: ${relativePath}`);
  }
  return resolved;
}

function readRequiredJson(root, relativePath, label) {
  const resolved = resolveBundlePath(root, relativePath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error(`${label} file does not exist: ${relativePath}`);
  }
  if (fs.statSync(resolved).size <= 0) {
    throw new Error(`${label} file is empty: ${relativePath}`);
  }
  return readJson(resolved);
}

const args = process.argv.slice(2);
let manifestArg = null;
let outputPath = null;
let showHelp = false;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--help' || arg === '-h') {
    showHelp = true;
  } else if (arg === '--out') {
    outputPath = args[index + 1] ?? null;
    index += 1;
  } else if (!manifestArg) {
    manifestArg = arg;
  } else {
    throw new Error(`Unexpected argument: ${arg}`);
  }
}

if (showHelp) {
  process.stdout.write(
    'Usage: npm run pilot:study -- <study-manifest.json> [--out final-study-report.json]\n' +
    'The bundle must contain aggregate-only app reports and non-identifying observer notes.\n'
  );
} else if (!manifestArg) {
  process.stderr.write(
    'Usage: npm run pilot:study -- <study-manifest.json> [--out final-study-report.json]\n'
  );
  process.exitCode = 1;
} else {
  const manifestPath = path.resolve(process.cwd(), manifestArg);
  const bundleRoot = path.dirname(manifestPath);
  const manifest = assertPilotStudyManifest(readJson(manifestPath));
  const reportsBySlot = {};
  const observersBySlot = {};

  for (const slot of manifest.slots) {
    if (slot.reportStatus === 'received') {
      reportsBySlot[slot.slotId] = readRequiredJson(
        bundleRoot,
        slot.reportPath,
        `aggregate report for ${slot.slotId}`
      );
    }
    if (slot.observerStatus === 'received') {
      observersBySlot[slot.slotId] = readRequiredJson(
        bundleRoot,
        slot.observerPath,
        `observer note for ${slot.slotId}`
      );
    }
  }

  const report = buildPilotStudyReport({
    manifest,
    reportsBySlot,
    observersBySlot
  });
  const payload = JSON.stringify(report, null, 2) + '\n';

  if (outputPath) {
    fs.writeFileSync(path.resolve(process.cwd(), outputPath), payload, 'utf8');
    process.stderr.write(
      `Wrote pilot study report: ${report.receivedAggregateReports} aggregate reports, ${report.receivedObserverNotes} observer notes, completeForFirstReview=${report.completeForFirstReview}.\n`
    );
  } else {
    process.stdout.write(payload);
  }
}
