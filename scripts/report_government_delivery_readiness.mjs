#!/usr/bin/env node
import {
  evaluateGovernmentDeliveryReadiness
} from '../src/government/governmentDeliveryManifest.ts';

const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  process.stdout.write(
    'Usage: npm run government:readiness\n' +
    'Prints the current Government Pilot Delivery Manifest readiness as JSON.\n'
  );
} else if (args.length > 0) {
  throw new Error(`Unexpected argument: ${args[0]}`);
} else {
  process.stdout.write(
    JSON.stringify(evaluateGovernmentDeliveryReadiness(), null, 2) + '\n'
  );
}
