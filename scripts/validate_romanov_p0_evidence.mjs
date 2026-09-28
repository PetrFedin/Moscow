import fs from 'node:fs';
import path from 'node:path';

import {
  buildRomanovP0EvidencePackage,
  parseRomanovP0EvidencePackage,
  serializeRomanovP0EvidencePackage
} from '../src/spatial/romanovP0EvidencePackage.ts';
import {
  parseRomanovP0EvidenceManifest
} from '../src/spatial/romanovP0EvidenceManifest.ts';

function resolveEvidencePath(relativePath) {
  const root = process.cwd();
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`evidence path escapes repository root: ${relativePath}`);
  }
  return resolved;
}

function readJsonFile(relativePath) {
  const resolved = resolveEvidencePath(relativePath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error(`evidence file does not exist: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

const requestedManifest = process.argv[2];
const requestedOutput = process.argv[3];

if (!requestedManifest) {
  console.error(
    'Usage: npm run validate:romanov-p0-evidence -- <manifest.json> [consolidated-output.json]'
  );
  process.exit(2);
}

try {
  const manifestPath = resolveEvidencePath(requestedManifest);
  if (!fs.existsSync(manifestPath) || !fs.statSync(manifestPath).isFile()) {
    throw new Error(`manifest does not exist: ${requestedManifest}`);
  }

  const manifest = parseRomanovP0EvidenceManifest(
    fs.readFileSync(manifestPath, 'utf8')
  );

  const campaign = readJsonFile(manifest.campaignPath);
  const sessionBundles = manifest.sessionBundlePaths.map(readJsonFile);
  const anchorProof = readJsonFile(manifest.anchorProofPath);

  const pkg = buildRomanovP0EvidencePackage({
    campaign,
    sessionBundles,
    anchorProof
  });

  if (!pkg.releaseReady) {
    const blockers = [
      ...pkg.packageBlockers,
      ...pkg.releaseGate.blockers
    ];
    throw new Error(
      `Romanov P0 evidence is not release-ready: ${[...new Set(blockers)].join('; ')}`
    );
  }

  let outputPath;
  if (requestedOutput) {
    outputPath = resolveEvidencePath(requestedOutput);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const serialized = serializeRomanovP0EvidencePackage(pkg);
    fs.writeFileSync(outputPath, serialized + '\n', 'utf8');
    parseRomanovP0EvidencePackage(fs.readFileSync(outputPath, 'utf8'));
  }

  process.stdout.write(JSON.stringify({
    releaseReady: true,
    state: pkg.releaseGate.state,
    surveyPacketId: pkg.surveyPacketId,
    appBuild: pkg.appBuild,
    releaseSessionCount: pkg.releaseSessionIds.length,
    devices: pkg.deviceInventory.map((device) => ({
      deviceLabel: device.deviceLabel,
      platform: device.platform,
      deviceVersion: device.deviceVersion,
      appBuild: device.appBuild,
      sessions: device.sessionIds.length
    })),
    anchorProofId: pkg.anchorProof.anchor.id,
    independentResolveDevice: pkg.anchorProof.anchor.resolvedByDeviceLabel,
    restartRecoverySessionId: pkg.anchorProof.anchor.recoverySessionId,
    output: requestedOutput ?? null
  }, null, 2) + '\n');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
