#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import {
  buildPilotCohortReport,
  validatePilotAnalyticsReport
} from '../src/analytics/pilotCohortReport.ts';

const args = process.argv.slice(2);
let outputPath = null;
const inputs = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--out') {
    outputPath = args[index + 1] ?? null;
    index += 1;
    continue;
  }
  inputs.push(arg);
}

if (inputs.length === 0) {
  process.stderr.write(
    'Usage: npm run pilot:cohort -- report1.json report2.json [--out cohort.json]\n'
  );
  process.exitCode = 1;
} else {
  const reports = [];
  for (const path of inputs) {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    const validation = validatePilotAnalyticsReport(parsed);
    if (!validation.valid) {
      throw new Error(
        `Invalid pilot report input: ${validation.blockers.join('; ')}`
      );
    }
    reports.push(parsed);
  }

  const cohort = buildPilotCohortReport(reports);
  const payload = JSON.stringify(cohort, null, 2) + '\n';

  if (outputPath) {
    writeFileSync(outputPath, payload, 'utf8');
    process.stderr.write(
      `Wrote aggregate-only cohort report: ${cohort.sourceReportCount} unique reports, ${cohort.duplicateReportsSkipped} duplicates skipped.\n`
    );
  } else {
    process.stdout.write(payload);
  }
}
