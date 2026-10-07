import {
  ROMANOV_FIELD_DISTANCES,
  ROMANOV_REQUIRED_ANDROID_DEVICES,
  ROMANOV_REQUIRED_IOS_DEVICES
} from '../spatial/fieldVerification.ts';

export const FIELD_SESSION_PLAN_VERSION = 1 as const;

export type PlannedFieldDevice = {
  platform: 'ios' | 'android';
  deviceLabel: string;
  deviceVersion: string;
  appBuild: string;
};

export type PlannedFieldSession = {
  sessionKey: string;
  platform: 'ios' | 'android';
  deviceLabel: string;
  distanceMeters: 5 | 10 | 15;
  status: 'planned' | 'captured' | 'failed' | 'cancelled';
  evidencePath?: string;
};

export type FieldSessionPlan = {
  kind: 'romanov-field-session-plan';
  version: typeof FIELD_SESSION_PLAN_VERSION;
  pilotId: 'varvarka-zaryadye-pilot';
  siteId: 'romanov-chambers';
  plannedDate: string;
  surveyPacketRef: string;
  calibrationRef: string;
  devices: PlannedFieldDevice[];
  sessions: PlannedFieldSession[];
};

function slug(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function isIsoDate(value: string) {
  return Number.isFinite(Date.parse(value));
}

export function buildRomanovFieldSessionPlan(input: {
  plannedDate: string;
  surveyPacketRef: string;
  calibrationRef: string;
  iosDevices: Array<Omit<PlannedFieldDevice,'platform'>>;
  androidDevices: Array<Omit<PlannedFieldDevice,'platform'>>;
}): FieldSessionPlan {
  if (!isIsoDate(input.plannedDate)) throw new Error('plannedDate must be ISO-compatible');
  if (!input.surveyPacketRef.trim()) throw new Error('surveyPacketRef required');
  if (!input.calibrationRef.trim()) throw new Error('calibrationRef required');
  if (input.iosDevices.length < ROMANOV_REQUIRED_IOS_DEVICES) throw new Error('at least two iOS devices required');
  if (input.androidDevices.length < ROMANOV_REQUIRED_ANDROID_DEVICES) throw new Error('at least two Android devices required');

  const devices: PlannedFieldDevice[] = [
    ...input.iosDevices.map((device) => ({ ...device, platform:'ios' as const })),
    ...input.androidDevices.map((device) => ({ ...device, platform:'android' as const }))
  ];

  const seen = new Set<string>();
  for (const device of devices) {
    if (!device.deviceLabel.trim() || !device.deviceVersion.trim() || !device.appBuild.trim()) {
      throw new Error('deviceLabel, deviceVersion and appBuild are required');
    }
    const key = `${device.platform}:${device.deviceLabel.trim().toLowerCase()}`;
    if (seen.has(key)) throw new Error(`duplicate device: ${key}`);
    seen.add(key);
  }

  const sessions: PlannedFieldSession[] = [];
  for (const device of devices) {
    for (const distance of ROMANOV_FIELD_DISTANCES) {
      sessions.push({
        sessionKey:`${device.platform}-${slug(device.deviceLabel)}-${distance}m`,
        platform:device.platform,
        deviceLabel:device.deviceLabel.trim(),
        distanceMeters:distance,
        status:'planned'
      });
    }
  }

  return {
    kind:'romanov-field-session-plan',
    version:FIELD_SESSION_PLAN_VERSION,
    pilotId:'varvarka-zaryadye-pilot',
    siteId:'romanov-chambers',
    plannedDate:new Date(input.plannedDate).toISOString(),
    surveyPacketRef:input.surveyPacketRef.trim(),
    calibrationRef:input.calibrationRef.trim(),
    devices,
    sessions
  };
}

export function validateFieldSessionPlan(plan: FieldSessionPlan) {
  const blockers:string[]=[];
  if (plan.kind !== 'romanov-field-session-plan') blockers.push('kind-invalid');
  if (plan.version !== FIELD_SESSION_PLAN_VERSION) blockers.push('version-invalid');
  if (plan.siteId !== 'romanov-chambers') blockers.push('site-invalid');
  if (!isIsoDate(plan.plannedDate)) blockers.push('planned-date-invalid');
  if (!plan.surveyPacketRef.trim()) blockers.push('survey-ref-missing');
  if (!plan.calibrationRef.trim()) blockers.push('calibration-ref-missing');

  const ios = new Set(plan.devices.filter(d=>d.platform==='ios').map(d=>d.deviceLabel.trim().toLowerCase()));
  const android = new Set(plan.devices.filter(d=>d.platform==='android').map(d=>d.deviceLabel.trim().toLowerCase()));
  if (ios.size < ROMANOV_REQUIRED_IOS_DEVICES) blockers.push('ios-device-count-insufficient');
  if (android.size < ROMANOV_REQUIRED_ANDROID_DEVICES) blockers.push('android-device-count-insufficient');

  for (const device of plan.devices) {
    for (const distance of ROMANOV_FIELD_DISTANCES) {
      if (!plan.sessions.some(s => s.platform===device.platform && s.deviceLabel===device.deviceLabel && s.distanceMeters===distance)) {
        blockers.push(`session-missing:${device.platform}:${device.deviceLabel}:${distance}`);
      }
    }
  }

  return {
    valid:blockers.length===0,
    blockers:[...new Set(blockers)],
    plannedSessionCount:plan.sessions.length
  };
}
