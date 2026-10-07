#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { validatePilotEconomicsCapture } from '../src/government/measuredEconomicsCapture.ts';

const file = process.argv[2];

if (!file) {
  console.error('Usage: npm run pilot:economics-validate -- <capture.json>');
  process.exit(2);
}

const resolved = path.resolve(process.cwd(), file);
const relative = path.relative(process.cwd(), resolved);
if (relative.startsWith('..') || path.isAbsolute(relative)) {
  console.error('Economics capture path must stay inside repository');
  process.exit(2);
}

if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
  console.error(`Economics capture file does not exist: ${file}`);
  process.exit(2);
}

const capture = JSON.parse(fs.readFileSync(resolved, 'utf8'));
const result = validatePilotEconomicsCapture(capture);
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
if (!result.complete) process.exitCode = 2;
