export const PRE_PILOT_HANDOFF_VERSION = 1 as const;

export type PrePilotHandoffReadiness = {
  version: typeof PRE_PILOT_HANDOFF_VERSION;
  requiredDocs: string[];
  requiredCommands: string[];
  requiredArtifacts: string[];
  guardrails: string[];
};

export const prePilotHandoffReadiness: PrePilotHandoffReadiness = {
  version: PRE_PILOT_HANDOFF_VERSION,
  requiredDocs: [
    'docs/PILOT_EXECUTION_INDEX.md',
    'docs/PILOT_RACI.md',
    'docs/FIELD_DAY_PACK.md',
    'docs/VISITOR_PILOT_PACK.md',
    'docs/PROVIDER_ACTIVATION_PACK.md',
    'docs/MEASURED_ECONOMICS_CAPTURE.md',
    'docs/GOVERNMENT_MEETING_ASK.md',
    'docs/PRE_PILOT_CONFIGURATION_BUNDLE.md',
    'docs/PRE_PILOT_EXTERNAL_INPUT_REQUEST.md',
    'docs/EVIDENCE_ARCHIVE_STRUCTURE.md',
    'docs/PILOT_DAY_COMMAND_CENTRE.md',
    'docs/PILOT_EXECUTION_MASTER_PLAN_TRACEABILITY.md'
  ],
  requiredCommands: [
    'pilot:owners-template',
    'pilot:field-plan',
    'pilot:visitor-wave',
    'pilot:config-template',
    'pilot:external-input-template',
    'pilot:init-evidence',
    'pilot:preflight-bundle',
    'pilot:readiness-dossier',
    'pilot:economics-validate'
  ],
  requiredArtifacts: [
    'owner-assignment.json',
    'romanov-field-session-plan.json',
    'visitor-wave-manifest.json',
    'pre-pilot-configuration.json',
    'external-input-request.json'
  ],
  guardrails: [
    'no credentials in repository artifacts',
    'no owner may be inferred or fabricated',
    'no field/provider/user PASS may be inferred from preparation',
    'no citywide rollout request before pilot evidence',
    'master-plan sequencing remains authoritative'
  ]
};

export function validatePrePilotHandoffSurface(input: {
  docs: string[];
  commands: string[];
}) {
  const missingDocs = prePilotHandoffReadiness.requiredDocs.filter(
    (doc) => !input.docs.includes(doc)
  );
  const missingCommands = prePilotHandoffReadiness.requiredCommands.filter(
    (command) => !input.commands.includes(command)
  );

  return {
    ready: missingDocs.length === 0 && missingCommands.length === 0,
    missingDocs,
    missingCommands
  };
}
