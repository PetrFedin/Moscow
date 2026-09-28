import {
  parseFieldCampaignPackage,
  parseFieldSessionBundle,
  type RomanovFieldCampaignPackage,
  type RomanovFieldSessionBundle
} from './fieldCampaign.ts';
import {
  summarizeFieldMatrix,
  type RomanovFieldSession
} from './fieldVerification.ts';
import {
  parsePersistentAnchorPackage,
  ROMANOV_PERSISTENT_ANCHOR_PACKAGE_VERSION,
  type RomanovPersistentAnchor,
  type RomanovPersistentAnchorPackage
} from './persistentAnchor.ts';
import {
  summarizeRomanovReleaseGate,
  type RomanovReleaseGate
} from './romanovReleaseGate.ts';

export const ROMANOV_P0_EVIDENCE_PACKAGE_VERSION = 1;

export type RomanovP0EvidencePackage = {
  kind: 'romanov-p0-evidence-package';
  version: typeof ROMANOV_P0_EVIDENCE_PACKAGE_VERSION;
  surveyPacketId: string;
  campaign: RomanovFieldCampaignPackage;
  sessionBundles: RomanovFieldSessionBundle[];
  anchorProof: RomanovPersistentAnchorPackage;
  deviceInventory: Array<{
    deviceLabel: string;
    platform: string;
    deviceVersion: string;
    appBuild: string;
    sessionIds: string[];
  }>;
  releaseSessionIds: string[];
  appBuild?: string;
  releaseGate: RomanovReleaseGate;
  packageBlockers: string[];
  releaseReady: boolean;
};

function roundTripCampaign(value: RomanovFieldCampaignPackage) {
  return parseFieldCampaignPackage(JSON.stringify(value));
}

function roundTripBundle(value: RomanovFieldSessionBundle) {
  return parseFieldSessionBundle(JSON.stringify(value));
}

function roundTripAnchor(value: RomanovPersistentAnchorPackage): RomanovPersistentAnchorPackage {
  const anchor = parsePersistentAnchorPackage(JSON.stringify(value));
  return {
    kind: 'romanov-persistent-anchor-proof' as const,
    version: ROMANOV_PERSISTENT_ANCHOR_PACKAGE_VERSION,
    anchor
  };
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function releaseSessions(
  sessions: RomanovFieldSession[],
  releaseSessionIds: string[]
) {
  const ids = new Set(releaseSessionIds);
  return sessions.filter((session) => ids.has(session.id));
}

export function buildRomanovP0EvidencePackage(input: {
  campaign: RomanovFieldCampaignPackage;
  sessionBundles: RomanovFieldSessionBundle[];
  anchorProof: RomanovPersistentAnchorPackage;
}): RomanovP0EvidencePackage {
  const campaign = roundTripCampaign(input.campaign);
  const bundles = input.sessionBundles.map(roundTripBundle);
  const anchorProof = roundTripAnchor(input.anchorProof);
  const surveyPacketId = campaign.survey.id;

  const packageBlockers: string[] = [];

  if (bundles.length === 0) {
    packageBlockers.push('session-bundles-missing');
  }

  const deviceLabels = bundles.map((bundle) => bundle.deviceLabel.trim().toLowerCase());
  if (new Set(deviceLabels).size !== deviceLabels.length) {
    packageBlockers.push('duplicate-device-bundle');
  }

  if (bundles.some((bundle) => bundle.surveyPacketId !== surveyPacketId)) {
    packageBlockers.push('session-bundle-survey-mismatch');
  }

  const sessions = bundles.flatMap((bundle) => bundle.sessions);
  const sessionIds = sessions.map((session) => session.id);
  if (new Set(sessionIds).size !== sessionIds.length) {
    packageBlockers.push('duplicate-field-session-id');
  }

  const matrix = summarizeFieldMatrix(sessions, { surveyPacketId });
  const releaseSessionIds = unique(
    matrix.completeDevices.flatMap((device) => device.sessionIds)
  );
  const selectedReleaseSessions = releaseSessions(sessions, releaseSessionIds);

  const releaseBuilds = unique(
    selectedReleaseSessions
      .map((session) => session.appBuild?.trim())
      .filter((value): value is string => Boolean(value))
  );
  if (
    selectedReleaseSessions.length > 0
    && selectedReleaseSessions.some((session) => !session.appBuild?.trim() || session.appBuild === 'local')
  ) {
    packageBlockers.push('release-build-id-missing-or-local');
  }
  if (releaseBuilds.length > 1) {
    packageBlockers.push('release-build-id-mismatch');
  }

  const deviceInventory = bundles.map((bundle) => {
    const first = bundle.sessions[0]!;
    const builds = unique(
      bundle.sessions
        .map((session) => session.appBuild?.trim())
        .filter((value): value is string => Boolean(value))
    );
    if (builds.length > 1) {
      packageBlockers.push(`device-bundle-build-id-mismatch:${bundle.deviceLabel}`);
    }
    return {
      deviceLabel: bundle.deviceLabel,
      platform: first.devicePlatform,
      deviceVersion: first.deviceVersion,
      appBuild: builds[0] ?? '',
      sessionIds: bundle.sessions.map((session) => session.id)
    };
  });

  const anchor: RomanovPersistentAnchor = anchorProof.anchor;
  const releaseGate = summarizeRomanovReleaseGate({
    calibration: anchor.calibration,
    survey: campaign.survey,
    sessions,
    anchors: [anchor]
  });

  if (anchor.calibration.verifiedAt === undefined) {
    packageBlockers.push('anchor-calibration-not-verified');
  }

  const appBuild = releaseBuilds.length === 1 ? releaseBuilds[0] : undefined;
  const releaseReady =
    packageBlockers.length === 0
    && releaseGate.state === 'field-verified-spatial-scene';

  return {
    kind: 'romanov-p0-evidence-package',
    version: ROMANOV_P0_EVIDENCE_PACKAGE_VERSION,
    surveyPacketId,
    campaign,
    sessionBundles: bundles,
    anchorProof,
    deviceInventory,
    releaseSessionIds,
    appBuild,
    releaseGate,
    packageBlockers,
    releaseReady
  };
}

export function assertRomanovP0EvidenceReleaseReady(
  pkg: RomanovP0EvidencePackage
) {
  if (pkg.kind !== 'romanov-p0-evidence-package') {
    throw new Error('unsupported Romanov P0 evidence package kind');
  }
  if (pkg.version !== ROMANOV_P0_EVIDENCE_PACKAGE_VERSION) {
    throw new Error('unsupported Romanov P0 evidence package version');
  }
  if (!pkg.releaseReady) {
    const blockers = [
      ...pkg.packageBlockers,
      ...pkg.releaseGate.blockers
    ];
    throw new Error(
      `Romanov P0 evidence is not release-ready: ${unique(blockers).join('; ')}`
    );
  }
  return pkg;
}

export function serializeRomanovP0EvidencePackage(
  pkg: RomanovP0EvidencePackage
) {
  assertRomanovP0EvidenceReleaseReady(pkg);
  return JSON.stringify(pkg, null, 2);
}

export function parseRomanovP0EvidencePackage(raw: string) {
  const value = JSON.parse(raw) as Partial<RomanovP0EvidencePackage>;
  if (value.kind !== 'romanov-p0-evidence-package') {
    throw new Error('unsupported Romanov P0 evidence package kind');
  }
  if (value.version !== ROMANOV_P0_EVIDENCE_PACKAGE_VERSION) {
    throw new Error('unsupported Romanov P0 evidence package version');
  }
  if (!value.campaign || !Array.isArray(value.sessionBundles) || !value.anchorProof) {
    throw new Error('Romanov P0 evidence package is incomplete');
  }

  const rebuilt = buildRomanovP0EvidencePackage({
    campaign: value.campaign,
    sessionBundles: value.sessionBundles,
    anchorProof: value.anchorProof
  });
  assertRomanovP0EvidenceReleaseReady(rebuilt);

  const suppliedSessionIds = value.releaseSessionIds ?? [];
  if (
    suppliedSessionIds.length !== rebuilt.releaseSessionIds.length
    || suppliedSessionIds.some((id) => !rebuilt.releaseSessionIds.includes(id))
  ) {
    throw new Error('Romanov P0 release session list does not match recomputed evidence');
  }
  if (value.appBuild !== rebuilt.appBuild) {
    throw new Error('Romanov P0 app build does not match recomputed evidence');
  }
  return rebuilt;
}
