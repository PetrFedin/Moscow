import {
  PILOT_STUDY_MANIFEST_VERSION,
  type PilotStudyManifest
} from '../analytics/pilotStudy.ts';

export const VISITOR_WAVE_PLAN_VERSION = 1 as const;

function slotId(index:number) {
  return `P${String(index).padStart(3,'0')}` as `P${string}`;
}

export function buildVisitorWaveManifest(input:{
  studyId:string;
  expectedContentVersion:string;
  participantCount:number;
}):PilotStudyManifest {
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(input.studyId)) throw new Error('invalid studyId');
  if (!input.expectedContentVersion.trim()) throw new Error('expectedContentVersion required');
  if (!Number.isInteger(input.participantCount) || input.participantCount < 20 || input.participantCount > 50) {
    throw new Error('participantCount must be 20..50');
  }

  return {
    kind:'varvarka-supervised-pilot-study',
    version:PILOT_STUDY_MANIFEST_VERSION,
    studyId:input.studyId,
    routeId:'varvarka-zaryadye-pilot',
    protocol:'supervised-varvarka-v1',
    expectedContentVersion:input.expectedContentVersion.trim(),
    slots:Array.from({length:input.participantCount},(_,i)=>({
      slotId:slotId(i+1),
      reportStatus:'missing' as const,
      observerStatus:'missing' as const
    }))
  };
}
