export type HeritageFieldMatrixOptions = {
  surveyPacketId?: string;
  localPlacementVersion?: number;
};

export type HeritageFieldMatrixPolicy<TSession> = {
  distances: number[];
  requiredPlatforms: Record<string, number>;
  getSessionId: (session: TSession) => string;
  getSurveyPacketId: (session: TSession) => string | undefined;
  getDeviceKey: (session: TSession) => string;
  getDeviceLabel: (session: TSession) => string;
  getPlatform: (session: TSession) => string;
  getDistance: (session: TSession) => number;
  getPlacementVersion: (session: TSession) => number;
  isSamePlacement: (left: TSession, right: TSession) => boolean;
  isCurrentAuthority: (session: TSession) => boolean;
  isEvidenceAuthoritative: (session: TSession) => boolean;
  isPassed: (session: TSession) => boolean;
  hasFieldConditions: (session: TSession) => boolean;
  isDaylightEvidence: (session: TSession) => boolean;
};

export type HeritageDeviceVerification = {
  deviceKey: string;
  deviceLabel: string;
  platform: string;
  placementVersion: number;
  sessionIds: string[];
  distancesPassed: number[];
  completeDistanceMatrix: boolean;
};

export type HeritageFieldMatrixSummary = {
  surveyPacketId?: string;
  sessions: number;
  passedSessions: number;
  currentAuthoritySessions: number;
  staleAuthoritySessions: number;
  unmeasuredSessions: number;
  stalePlacementSessions: number;
  completeDevices: HeritageDeviceVerification[];
  platformCompleteDevices: Record<string, number>;
  crossPlatformReady: boolean;
  releaseSessionCount: number;
  fieldConditionsComplete: boolean;
  daylightEvidence: boolean;
  eligibleForPersistentAnchor: boolean;
};

function completeDevicesForSurvey<TSession>(
  sessions: TSession[],
  surveyPacketId: string,
  policy: HeritageFieldMatrixPolicy<TSession>
): HeritageDeviceVerification[] {
  const surveySessions = sessions.filter(
    (session) => policy.getSurveyPacketId(session) === surveyPacketId
  );
  const byDevice = new Map<string, TSession[]>();

  for (const session of surveySessions) {
    const key = policy.getDeviceKey(session);
    const current = byDevice.get(key) ?? [];
    current.push(session);
    byDevice.set(key, current);
  }

  const complete: HeritageDeviceVerification[] = [];
  for (const [deviceKey, deviceSessions] of byDevice) {
    const first = deviceSessions[0];
    if (!first) continue;

    for (const candidate of deviceSessions) {
      const placementSessions = deviceSessions.filter(
        (session) =>
          policy.isSamePlacement(session, candidate)
          && policy.isPassed(session)
          && policy.isEvidenceAuthoritative(session)
      );

      const releaseSessions = policy.distances.map((distance) =>
        placementSessions.find((session) => policy.getDistance(session) === distance)
      );
      if (releaseSessions.some((session) => !session)) continue;

      complete.push({
        deviceKey,
        deviceLabel: policy.getDeviceLabel(first),
        platform: policy.getPlatform(first),
        placementVersion: policy.getPlacementVersion(candidate),
        sessionIds: releaseSessions.map((session) => policy.getSessionId(session!)),
        distancesPassed: [...policy.distances],
        completeDistanceMatrix: true
      });
      break;
    }
  }

  return complete;
}

export function summarizeHeritageFieldMatrix<TSession>(
  sessions: TSession[],
  policy: HeritageFieldMatrixPolicy<TSession>,
  options: HeritageFieldMatrixOptions = {}
): HeritageFieldMatrixSummary {
  const currentAuthoritySessions = sessions.filter(policy.isCurrentAuthority);
  const staleAuthoritySessions = sessions.length - currentAuthoritySessions.length;

  const surveySessions = options.surveyPacketId
    ? currentAuthoritySessions.filter(
        (session) => policy.getSurveyPacketId(session) === options.surveyPacketId
      )
    : currentAuthoritySessions;

  const placementSessions = options.localPlacementVersion === undefined
    ? surveySessions
    : surveySessions.filter(
        (session) => policy.getPlacementVersion(session) === options.localPlacementVersion
      );

  const stalePlacementSessions = options.localPlacementVersion === undefined
    ? 0
    : surveySessions.length - placementSessions.length;

  const evidenceSessions = placementSessions.filter(policy.isEvidenceAuthoritative);
  const unmeasuredSessions = placementSessions.length - evidenceSessions.length;
  const passedSessions = evidenceSessions.filter(policy.isPassed);

  const surveyIds = options.surveyPacketId
    ? [options.surveyPacketId]
    : [...new Set(
        passedSessions
          .map(policy.getSurveyPacketId)
          .filter((value): value is string => Boolean(value))
      )];

  let selectedSurveyPacketId = options.surveyPacketId;
  let completeDevices: HeritageDeviceVerification[] = [];

  for (const surveyPacketId of surveyIds) {
    const candidate = completeDevicesForSurvey(
      passedSessions,
      surveyPacketId,
      policy
    );

    if (!selectedSurveyPacketId || candidate.length > completeDevices.length) {
      selectedSurveyPacketId = surveyPacketId;
      completeDevices = candidate;
    } else if (surveyPacketId === selectedSurveyPacketId) {
      completeDevices = candidate;
    }
  }

  const platformCompleteDevices: Record<string, number> = {};
  for (const platform of Object.keys(policy.requiredPlatforms)) {
    platformCompleteDevices[platform] = completeDevices.filter(
      (device) => device.platform === platform
    ).length;
  }

  const crossPlatformReady = Object.entries(policy.requiredPlatforms).every(
    ([platform, required]) => (platformCompleteDevices[platform] ?? 0) >= required
  );

  const releaseSessionIds = [
    ...new Set(completeDevices.flatMap((device) => device.sessionIds))
  ];
  const releaseSessionIdSet = new Set(releaseSessionIds);
  const releaseSessions = passedSessions.filter((session) =>
    releaseSessionIdSet.has(policy.getSessionId(session))
  );

  const minimumReleaseSessions =
    policy.distances.length
    * Object.values(policy.requiredPlatforms).reduce((sum, value) => sum + value, 0);

  const fieldConditionsComplete =
    releaseSessionIds.length >= minimumReleaseSessions
    && releaseSessions.length === releaseSessionIds.length
    && releaseSessions.every(policy.hasFieldConditions);

  const daylightEvidence = releaseSessions.some(policy.isDaylightEvidence);

  return {
    surveyPacketId: selectedSurveyPacketId,
    sessions: sessions.length,
    passedSessions: passedSessions.length,
    currentAuthoritySessions: currentAuthoritySessions.length,
    staleAuthoritySessions,
    unmeasuredSessions,
    stalePlacementSessions,
    completeDevices,
    platformCompleteDevices,
    crossPlatformReady,
    releaseSessionCount: releaseSessionIds.length,
    fieldConditionsComplete,
    daylightEvidence,
    eligibleForPersistentAnchor:
      crossPlatformReady && fieldConditionsComplete && daylightEvidence
  };
}
