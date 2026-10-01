import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';

import {
  fieldPilotObservabilityEnabled,
  sanitizeFieldPilotDiagnostic,
  sanitizeFieldPilotSentryEvent,
  type FieldPilotDiagnostic
} from './fieldPilotObservabilityContract';

let initialized = false;

export function initFieldPilotObservability() {
  if (initialized) return { enabled: true, reason: 'already-initialized' as const };

  const enabled = fieldPilotObservabilityEnabled({
    enabledFlag: process.env.EXPO_PUBLIC_FIELD_OBSERVABILITY,
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN
  });

  if (!enabled) {
    return { enabled: false, reason: 'disabled-or-dsn-missing' as const };
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN!.trim();

  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event, hint) {
      if (hint?.attachments) hint.attachments = [];
      return sanitizeFieldPilotSentryEvent(event);
    }
  });

  initialized = true;
  return { enabled: true, reason: 'initialized' as const };
}

export function recordFieldPilotFailure(input: FieldPilotDiagnostic) {
  if (!initialized) return false;

  const safe = sanitizeFieldPilotDiagnostic({
    ...input,
    buildVersion: input.buildVersion ?? process.env.EXPO_PUBLIC_BUILD_ID,
    osClass: input.osClass ?? String(Platform.OS)
  });

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(safe.tags)) {
      scope.setTag(key, value);
    }
    scope.setLevel('error');
    Sentry.captureMessage(`field-pilot:${safe.kind}`);
  });

  return true;
}
