import {
  assertPublishedSpatialPackageCanPublish,
  validatePublishedSpatialPackage,
  type PublishedSpatialPackage
} from '../spatial/publishedSpatialPackage.ts';

export type StudioRole =
  | 'editor'
  | 'historian-reviewer'
  | 'rights-reviewer'
  | 'technical-reviewer'
  | 'publisher';

export type StudioWorkflowState =
  | 'draft'
  | 'in-review'
  | 'changes-requested'
  | 'approved'
  | 'published';

export type StudioReviewKind = 'historical' | 'rights' | 'technical';
export type StudioReviewStatus = 'approved' | 'changes-requested';
export type StudioPublicationChannel = 'internal-preview' | 'public';

export type StudioActor = {
  id: string;
  roles: StudioRole[];
};

export type StudioReviewDecision = {
  kind: StudioReviewKind;
  status: StudioReviewStatus;
  actorId: string;
  note?: string;
  reviewedAt: string;
  reviewedRevision: number;
};

export type StudioAuditEvent = {
  sequence: number;
  event:
    | 'draft-created'
    | 'draft-revised'
    | 'review-submitted'
    | 'review-approved'
    | 'review-changes-requested'
    | 'revision-opened'
    | 'published';
  actorId: string;
  at: string;
  revision: number;
  note?: string;
  reviewKind?: StudioReviewKind;
  publicationId?: string;
};

export type StudioPublication = {
  publicationId: string;
  channel: StudioPublicationChannel;
  publishedAt: string;
  publishedBy: string;
  draftRevision: number;
  package: PublishedSpatialPackage;
};

export type CityHeritageStudioRecord = {
  id: string;
  placeId: string;
  state: StudioWorkflowState;
  revision: number;
  package: PublishedSpatialPackage;
  createdBy: string;
  createdAt: string;
  lastEditedBy: string;
  lastEditedAt: string;
  submittedBy?: string;
  submittedAt?: string;
  reviews: Partial<Record<StudioReviewKind, StudioReviewDecision>>;
  publications: StudioPublication[];
  audit: StudioAuditEvent[];
};

const reviewRole: Record<StudioReviewKind, StudioRole> = {
  historical: 'historian-reviewer',
  rights: 'rights-reviewer',
  technical: 'technical-reviewer'
};

const requiredReviewKinds: StudioReviewKind[] = ['historical', 'rights', 'technical'];

function assertActor(actor: StudioActor) {
  if (!actor.id.trim()) throw new Error('Studio actor id is required');
}

function assertRole(actor: StudioActor, role: StudioRole) {
  assertActor(actor);
  if (!actor.roles.includes(role)) {
    throw new Error(`Studio actor ${actor.id} lacks required role: ${role}`);
  }
}

function clonePackage(pkg: PublishedSpatialPackage): PublishedSpatialPackage {
  return JSON.parse(JSON.stringify(pkg)) as PublishedSpatialPackage;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return value;
}

function appendAudit(
  record: CityHeritageStudioRecord,
  event: Omit<StudioAuditEvent, 'sequence'>
): StudioAuditEvent[] {
  return [
    ...record.audit,
    {
      ...event,
      sequence: record.audit.length + 1
    }
  ];
}

function assertDraftEditable(record: CityHeritageStudioRecord) {
  if (record.state !== 'draft' && record.state !== 'changes-requested') {
    throw new Error(`Studio draft is not editable in state: ${record.state}`);
  }
}

function assertPackageMatchesRecord(record: CityHeritageStudioRecord, pkg: PublishedSpatialPackage) {
  if (pkg.placeId !== record.placeId) {
    throw new Error(`Package place id mismatch: expected ${record.placeId}, got ${pkg.placeId}`);
  }
}

function allCurrentReviewsApproved(record: CityHeritageStudioRecord) {
  return requiredReviewKinds.every((kind) => {
    const review = record.reviews[kind];
    return review?.status === 'approved' && review.reviewedRevision === record.revision;
  });
}

export function createStudioDraft(input: {
  id: string;
  package: PublishedSpatialPackage;
  actor: StudioActor;
  at: string;
}): CityHeritageStudioRecord {
  assertRole(input.actor, 'editor');
  if (!input.id.trim()) throw new Error('Studio draft id is required');
  if (!input.at.trim()) throw new Error('Studio draft timestamp is required');

  const pkg = clonePackage(input.package);
  const record: CityHeritageStudioRecord = {
    id: input.id,
    placeId: pkg.placeId,
    state: 'draft',
    revision: 1,
    package: pkg,
    createdBy: input.actor.id,
    createdAt: input.at,
    lastEditedBy: input.actor.id,
    lastEditedAt: input.at,
    reviews: {},
    publications: [],
    audit: []
  };

  return {
    ...record,
    audit: appendAudit(record, {
      event: 'draft-created',
      actorId: input.actor.id,
      at: input.at,
      revision: record.revision
    })
  };
}

export function reviseStudioDraft(
  record: CityHeritageStudioRecord,
  input: {
    package: PublishedSpatialPackage;
    actor: StudioActor;
    at: string;
    note?: string;
  }
): CityHeritageStudioRecord {
  assertRole(input.actor, 'editor');
  assertDraftEditable(record);
  assertPackageMatchesRecord(record, input.package);

  const revision = record.revision + 1;
  const next: CityHeritageStudioRecord = {
    ...record,
    state: 'draft',
    revision,
    package: clonePackage(input.package),
    lastEditedBy: input.actor.id,
    lastEditedAt: input.at,
    submittedBy: undefined,
    submittedAt: undefined,
    reviews: {}
  };

  return {
    ...next,
    audit: appendAudit(next, {
      event: 'draft-revised',
      actorId: input.actor.id,
      at: input.at,
      revision,
      note: input.note
    })
  };
}

export function submitStudioDraftForReview(
  record: CityHeritageStudioRecord,
  input: {
    actor: StudioActor;
    at: string;
    note?: string;
  }
): CityHeritageStudioRecord {
  assertRole(input.actor, 'editor');
  if (record.state !== 'draft') {
    throw new Error(`Studio draft cannot enter review from state: ${record.state}`);
  }

  const validation = validatePublishedSpatialPackage(record.package);
  if (!validation.valid) {
    throw new Error(`Studio package is structurally invalid: ${validation.blockers.join('; ')}`);
  }

  const next: CityHeritageStudioRecord = {
    ...record,
    state: 'in-review',
    submittedBy: input.actor.id,
    submittedAt: input.at,
    reviews: {}
  };

  return {
    ...next,
    audit: appendAudit(next, {
      event: 'review-submitted',
      actorId: input.actor.id,
      at: input.at,
      revision: next.revision,
      note: input.note
    })
  };
}

export function reviewStudioDraft(
  record: CityHeritageStudioRecord,
  input: {
    kind: StudioReviewKind;
    status: StudioReviewStatus;
    actor: StudioActor;
    at: string;
    note?: string;
  }
): CityHeritageStudioRecord {
  assertRole(input.actor, reviewRole[input.kind]);
  if (record.state !== 'in-review') {
    throw new Error(`Studio review is not allowed in state: ${record.state}`);
  }
  if (input.actor.id === record.submittedBy || input.actor.id === record.lastEditedBy) {
    throw new Error('Studio review requires separation between author and reviewer');
  }
  if (input.status === 'changes-requested' && !input.note?.trim()) {
    throw new Error('Requested changes require a review note');
  }

  const decision: StudioReviewDecision = {
    kind: input.kind,
    status: input.status,
    actorId: input.actor.id,
    note: input.note,
    reviewedAt: input.at,
    reviewedRevision: record.revision
  };

  const reviews = {
    ...record.reviews,
    [input.kind]: decision
  };
  const state: StudioWorkflowState = input.status === 'changes-requested'
    ? 'changes-requested'
    : allCurrentReviewsApproved({ ...record, reviews })
      ? 'approved'
      : 'in-review';

  const next: CityHeritageStudioRecord = {
    ...record,
    state,
    reviews
  };

  return {
    ...next,
    audit: appendAudit(next, {
      event: input.status === 'approved' ? 'review-approved' : 'review-changes-requested',
      actorId: input.actor.id,
      at: input.at,
      revision: next.revision,
      note: input.note,
      reviewKind: input.kind
    })
  };
}

export function openNextStudioRevision(
  record: CityHeritageStudioRecord,
  input: {
    package: PublishedSpatialPackage;
    actor: StudioActor;
    at: string;
    note?: string;
  }
): CityHeritageStudioRecord {
  assertRole(input.actor, 'editor');
  if (record.state !== 'published') {
    throw new Error(`A new Studio revision can only start from published state, got: ${record.state}`);
  }
  assertPackageMatchesRecord(record, input.package);

  const latestVersion = Math.max(...record.publications.map((item) => item.package.version));
  if (input.package.version <= latestVersion) {
    throw new Error(`New package version must be greater than published version ${latestVersion}`);
  }

  const revision = record.revision + 1;
  const next: CityHeritageStudioRecord = {
    ...record,
    state: 'draft',
    revision,
    package: clonePackage(input.package),
    lastEditedBy: input.actor.id,
    lastEditedAt: input.at,
    submittedBy: undefined,
    submittedAt: undefined,
    reviews: {}
  };

  return {
    ...next,
    audit: appendAudit(next, {
      event: 'revision-opened',
      actorId: input.actor.id,
      at: input.at,
      revision,
      note: input.note
    })
  };
}

export function publishStudioRecord(
  record: CityHeritageStudioRecord,
  input: {
    channel: StudioPublicationChannel;
    actor: StudioActor;
    at: string;
  }
): CityHeritageStudioRecord {
  assertRole(input.actor, 'publisher');
  if (record.state !== 'approved') {
    throw new Error(`Studio package is not approved for publication: ${record.state}`);
  }
  if (!allCurrentReviewsApproved(record)) {
    throw new Error('Studio package is missing current revision approvals');
  }
  if (input.actor.id === record.submittedBy || input.actor.id === record.lastEditedBy) {
    throw new Error('Studio publication requires separation between author and publisher');
  }

  assertPublishedSpatialPackageCanPublish(record.package);

  if (
    input.channel === 'public'
    && record.package.fieldVerification.required
    && record.package.releaseState !== 'field-verified'
  ) {
    throw new Error('Public spatial publication requires field-verified release state');
  }
  if (input.channel === 'public' && record.package.releaseState === 'draft') {
    throw new Error('Draft package cannot be published publicly');
  }

  const publicationId = `${record.placeId}:v${record.package.version}:${input.channel}`;
  if (record.publications.some((item) => item.publicationId === publicationId)) {
    throw new Error(`Studio publication already exists: ${publicationId}`);
  }

  const snapshotPackage = deepFreeze(clonePackage(record.package));
  const publication: StudioPublication = deepFreeze({
    publicationId,
    channel: input.channel,
    publishedAt: input.at,
    publishedBy: input.actor.id,
    draftRevision: record.revision,
    package: snapshotPackage
  });

  const next: CityHeritageStudioRecord = {
    ...record,
    state: 'published',
    publications: [...record.publications, publication]
  };

  return {
    ...next,
    audit: appendAudit(next, {
      event: 'published',
      actorId: input.actor.id,
      at: input.at,
      revision: next.revision,
      publicationId
    })
  };
}

export function getStudioProjection(record: CityHeritageStudioRecord) {
  const validation = validatePublishedSpatialPackage(record.package);
  const missingApprovals = requiredReviewKinds.filter((kind) => {
    const review = record.reviews[kind];
    return review?.status !== 'approved' || review.reviewedRevision !== record.revision;
  });

  const nextActions: string[] = [];
  if (record.state === 'draft') nextActions.push('submit-for-review');
  if (record.state === 'changes-requested') nextActions.push('revise-draft');
  if (record.state === 'in-review') {
    for (const kind of missingApprovals) nextActions.push(`review:${kind}`);
  }
  if (record.state === 'approved') {
    nextActions.push('publish:internal-preview');
    if (!record.package.fieldVerification.required || record.package.releaseState === 'field-verified') {
      nextActions.push('publish:public');
    }
  }
  if (record.state === 'published') nextActions.push('open-next-revision');

  return {
    state: record.state,
    revision: record.revision,
    structurallyValid: validation.valid,
    publicationReady: validation.publishable,
    structuralBlockers: validation.blockers,
    publicationBlockers: validation.publicationBlockers,
    warnings: validation.warnings,
    missingApprovals,
    nextActions
  };
}
