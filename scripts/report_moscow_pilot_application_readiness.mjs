#!/usr/bin/env node
import {
  evaluateMoscowPilotApplicationReadiness
} from '../src/government/moscowPilotApplicationReadiness.ts';

const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const asText = args.includes('--text');
const unknown = args.filter((arg) => arg !== '--help' && arg !== '-h' && arg !== '--text');

if (showHelp) {
  process.stdout.write(
    'Usage: npm run government:application-readiness -- [--text]\n' +
    'Default: prints Moscow Pilot Application Readiness as JSON.\n' +
    '--text: prints a concise human-readable blocker list.\n'
  );
} else if (unknown.length > 0) {
  throw new Error(`Unexpected argument: ${unknown[0]}`);
} else {
  const readiness = evaluateMoscowPilotApplicationReadiness();

  if (!asText) {
    process.stdout.write(JSON.stringify(readiness, null, 2) + '\n');
  } else {
    const lines = [
      'MOSCOW PILOT APPLICATION READINESS',
      `verifiedOn: ${readiness.verifiedOn}`,
      `ready: ${readiness.readyFields}/${readiness.totalFields}`,
      `submissionReady: ${readiness.submissionReady}`,
      `projectDraft: ${readiness.byStatus['project-draft']}`,
      `applicantInputRequired: ${readiness.byStatus['applicant-input-required']}`,
      `externalConfirmationRequired: ${readiness.byStatus['external-confirmation-required']}`,
      `legalReviewRequired: ${readiness.byStatus['legal-review-required']}`,
      `missingArtifact: ${readiness.byStatus['missing-artifact']}`,
      '',
      'BLOCKERS'
    ];

    for (const blocker of readiness.blockers) {
      lines.push(
        `- [${blocker.status}] ${blocker.title}\n  ${blocker.requiredAction}`
      );
    }

    lines.push('', 'NEXT ACTION', readiness.nextAction);
    process.stdout.write(lines.join('\n') + '\n');
  }
}
