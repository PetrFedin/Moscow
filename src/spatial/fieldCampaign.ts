import {
  isFieldSessionEvidenceAuthoritative,
  validateFieldSessionIntegrity,
  type RomanovFieldSession
} from './fieldVerification.ts';
import {
  summarizeRomanovSurvey,
  type RomanovSurveyPacket
} from './romanovSurvey.ts';

export const ROMANOV_FIELD_CAMPAIGN_VERSION = 1;
export const ROMANOV_FIELD_SESSION_BUNDLE_VERSION = 1;

export type RomanovFieldCampaignPackage = {
  kind: 'romanov-field-campaign';
  version: typeof ROMANOV_FIELD_CAMPAIGN_VERSION;
  survey: RomanovSurveyPacket;
};

export type RomanovFieldSessionBundle = {
  kind: 'romanov-field-session-bundle';
  version: typeof ROMANOV_FIELD_SESSION_BUNDLE_VERSION;
  surveyPacketId: string;
  calibrationVersion: number;
  deviceLabel: string;
  sessions: RomanovFieldSession[];
};

export function isFieldCampaignAuthoritative(survey: RomanovSurveyPacket) {
  return summarizeRomanovSurvey(survey).complete;
}

export function serializeFieldCampaignPackage(survey: RomanovSurveyPacket) {
  if (!isFieldCampaignAuthoritative(survey)) {
    throw new Error('field campaign requires an approved current survey');
  }
  const payload: RomanovFieldCampaignPackage = {
    kind: 'romanov-field-campaign',
    version: ROMANOV_FIELD_CAMPAIGN_VERSION,
    survey
  };
  return JSON.stringify(payload);
}

export function parseFieldCampaignPackage(raw: string): RomanovFieldCampaignPackage {
  const value = JSON.parse(raw) as Partial<RomanovFieldCampaignPackage>;
  if (value.kind !== 'romanov-field-campaign') throw new Error('unsupported field campaign kind');
  if (value.version !== ROMANOV_FIELD_CAMPAIGN_VERSION) throw new Error('unsupported field campaign version');
  if (!value.survey || !isFieldCampaignAuthoritative(value.survey)) {
    throw new Error('field campaign authority validation failed');
  }
  return value as RomanovFieldCampaignPackage;
}

export function serializeFieldSessionBundle(sessions: RomanovFieldSession[]) {
  if (sessions.length === 0) throw new Error('no field sessions to export');
  if (!sessions.every(validateFieldSessionIntegrity)) throw new Error('field session integrity validation failed');

  const surveyIds = new Set(sessions.map((item) => item.surveyPacketId));
  const calibrationVersions = new Set(sessions.map((item) => item.calibration.version));
  const labels = new Set(sessions.map((item) => item.deviceLabel?.trim()).filter(Boolean));
  if (surveyIds.size !== 1 || !sessions[0]?.surveyPacketId) throw new Error('session bundle must use one survey packet');
  if (calibrationVersions.size !== 1) throw new Error('session bundle must use one calibration version');
  if (labels.size !== 1) throw new Error('session bundle must represent one physical device');

  const payload: RomanovFieldSessionBundle = {
    kind: 'romanov-field-session-bundle',
    version: ROMANOV_FIELD_SESSION_BUNDLE_VERSION,
    surveyPacketId: sessions[0].surveyPacketId,
    calibrationVersion: sessions[0].calibration.version,
    deviceLabel: sessions[0].deviceLabel!.trim(),
    sessions
  };
  return JSON.stringify(payload);
}

export function parseFieldSessionBundle(raw: string): RomanovFieldSessionBundle {
  const value = JSON.parse(raw) as Partial<RomanovFieldSessionBundle>;
  if (value.kind !== 'romanov-field-session-bundle') throw new Error('unsupported field session bundle kind');
  if (value.version !== ROMANOV_FIELD_SESSION_BUNDLE_VERSION) throw new Error('unsupported field session bundle version');
  if (!Array.isArray(value.sessions) || value.sessions.length === 0) throw new Error('field session bundle is empty');
  if (!value.sessions.every(validateFieldSessionIntegrity)) throw new Error('field session integrity validation failed');
  if (!value.surveyPacketId || value.sessions.some((item) => item.surveyPacketId !== value.surveyPacketId)) {
    throw new Error('field session survey authority mismatch');
  }
  if (!Number.isInteger(value.calibrationVersion) || value.sessions.some((item) => item.calibration.version !== value.calibrationVersion)) {
    throw new Error('field session calibration authority mismatch');
  }
  if (!value.deviceLabel?.trim() || value.sessions.some((item) => item.deviceLabel?.trim() !== value.deviceLabel?.trim())) {
    throw new Error('field session device identity mismatch');
  }
  if (!value.sessions.every(isFieldSessionEvidenceAuthoritative)) throw new Error('field session evidence is not release-authoritative');
  return value as RomanovFieldSessionBundle;
}
