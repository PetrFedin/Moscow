import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const testsDir = path.resolve(process.cwd(), 'tests');
const files = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith('.test.ts'))
  .sort()
  .map((name) => path.join('tests', name));

if (files.length === 0) {
  console.error('No contract tests found in tests/*.test.ts');
  process.exit(2);
}

const result = spawnSync(
  process.execPath,
  ['--experimental-strip-types', '--test', ...files],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env
  }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
