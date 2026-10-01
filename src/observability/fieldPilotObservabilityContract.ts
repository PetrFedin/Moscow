export const FIELD_PILOT_FAILURE_KINDS = [
  'destination-package-download-failed',
  'destination-package-verify-failed',
  'model-load-failed',
  'ar-session-init-failed',
  'anchor-placement-failed',
  'location-state',
  'compass-state',
  'offline-cache-failed',
  'route-screen-crash'
] as const;

export type FieldPilotFailureKind = typeof FIELD_PILOT_FAILURE_KINDS[number];

export type FieldPilotDiagnostic = {
  kind: FieldPilotFailureKind;
  buildVersion?: string;
  packageId?: string;
  packageVersion?: string;
  sceneId?: string;
  objectId?: string;
  deviceClass?: string;
  osClass?: string;
  errorClass?: string;
};

export type SanitizedFieldPilotDiagnostic = {
  kind: FieldPilotFailureKind;
  tags: Record<string, string>;
};

const MAX_TAG_LENGTH = 120;
const SAFE_TOKEN = /^[a-zA-Z0-9._:@/+ -]+$/;

function bounded(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().slice(0, MAX_TAG_LENGTH);
  if (!normalized || !SAFE_TOKEN.test(normalized)) return undefined;
  return normalized;
}

export function sanitizeFieldPilotDiagnostic(
  value: FieldPilotDiagnostic
): SanitizedFieldPilotDiagnostic {
  if (!FIELD_PILOT_FAILURE_KINDS.includes(value.kind)) {
    throw new Error('Unsupported field-pilot diagnostic kind');
  }

  const candidates: Array<[string, unknown]> = [
    ['app.build', value.buildVersion],
    ['package.id', value.packageId],
    ['package.version', value.packageVersion],
    ['scene.id', value.sceneId],
    ['object.id', value.objectId],
    ['device.class', value.deviceClass],
    ['os.class', value.osClass],
    ['error.class', value.errorClass]
  ];

  const tags: Record<string, string> = {
    'field.kind': value.kind
  };

  for (const [key, raw] of candidates) {
    const safe = bounded(raw);
    if (safe) tags[key] = safe;
  }

  return { kind: value.kind, tags };
}

type SentryLikeEvent = Record<string, unknown> & {
  message?: string;
  tags?: Record<string, unknown>;
  exception?: {
    values?: Array<Record<string, unknown>>;
  };
};

const ALLOWED_EVENT_TAGS = new Set([
  'field.kind',
  'app.build',
  'package.id',
  'package.version',
  'scene.id',
  'object.id',
  'device.class',
  'os.class',
  'error.class'
]);

export function sanitizeFieldPilotSentryEvent<T extends SentryLikeEvent>(event: T): T {
  const safeTags: Record<string, string> = {};
  for (const [key, raw] of Object.entries(event.tags ?? {})) {
    if (!ALLOWED_EVENT_TAGS.has(key)) continue;
    const safe = bounded(raw);
    if (safe) safeTags[key] = safe;
  }

  const safeException = event.exception?.values
    ? {
        ...event.exception,
        values: event.exception.values.map((value) => ({
          ...value,
          value: 'Field pilot diagnostic message redacted'
        }))
      }
    : event.exception;

  const sanitized = {
    ...event,
    message: safeTags['field.kind']
      ? `field-pilot:${safeTags['field.kind']}`
      : 'field-pilot:crash',
    tags: safeTags,
    exception: safeException,
    user: undefined,
    request: undefined,
    breadcrumbs: undefined,
    contexts: undefined,
    extra: undefined,
    fingerprint: undefined,
    transaction: undefined
  };

  return sanitized as T;
}

export function fieldPilotObservabilityEnabled(input: {
  enabledFlag?: string;
  dsn?: string;
}) {
  return input.enabledFlag?.trim() === '1' && Boolean(input.dsn?.trim());
}
