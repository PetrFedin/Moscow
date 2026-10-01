import type { FieldPilotDiagnostic } from './fieldPilotObservabilityContract';

export function initFieldPilotObservability() {
  return { enabled: false, reason: 'web-disabled' as const };
}

export function recordFieldPilotFailure(_input: FieldPilotDiagnostic) {
  return false;
}
