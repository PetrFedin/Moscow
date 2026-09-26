import assert from 'node:assert/strict';
import test from 'node:test';

import { romanovPublishedCandidate } from '../src/spatial/romanovPublishedCandidate.ts';
import type { PublishedSpatialPackage } from '../src/spatial/publishedSpatialPackage.ts';
import {
  createStudioDraft,
  getStudioProjection,
  openNextStudioRevision,
  publishStudioRecord,
  reviewStudioDraft,
  reviseStudioDraft,
  submitStudioDraftForReview,
  type CityHeritageStudioRecord,
  type StudioActor
} from '../src/studio/cityHeritageStudio.ts';

const editor: StudioActor = { id: 'editor-1', roles: ['editor'] };
const historian: StudioActor = { id: 'historian-1', roles: ['historian-reviewer'] };
const rights: StudioActor = { id: 'rights-1', roles: ['rights-reviewer'] };
const technical: StudioActor = { id: 'technical-1', roles: ['technical-reviewer'] };
const publisher: StudioActor = { id: 'publisher-1', roles: ['publisher'] };

function clearedCandidate(): PublishedSpatialPackage {
  const pkg = structuredClone(romanovPublishedCandidate);
  pkg.sources = pkg.sources.map((source) => ({ ...source, rights: 'public-domain' }));
  return pkg;
}

function approveAll(record: CityHeritageStudioRecord) {
  let next = reviewStudioDraft(record, {
    kind: 'historical',
    status: 'approved',
    actor: historian,
    at: '2026-09-26T10:10:00.000Z'
  });
  next = reviewStudioDraft(next, {
    kind: 'rights',
    status: 'approved',
    actor: rights,
    at: '2026-09-26T10:11:00.000Z'
  });
  return reviewStudioDraft(next, {
    kind: 'technical',
    status: 'approved',
    actor: technical,
    at: '2026-09-26T10:12:00.000Z'
  });
}

test('Studio requires all three current-revision approvals before publication', () => {
  const draft = createStudioDraft({
    id: 'studio-romanov',
    package: clearedCandidate(),
    actor: editor,
    at: '2026-09-26T10:00:00.000Z'
  });

  let review = submitStudioDraftForReview(draft, {
    actor: editor,
    at: '2026-09-26T10:05:00.000Z'
  });

  review = reviewStudioDraft(review, {
    kind: 'historical',
    status: 'approved',
    actor: historian,
    at: '2026-09-26T10:06:00.000Z'
  });

  assert.equal(review.state, 'in-review');
  assert.deepEqual(getStudioProjection(review).missingApprovals, ['rights', 'technical']);
  assert.throws(
    () => publishStudioRecord(review, {
      channel: 'internal-preview',
      actor: publisher,
      at: '2026-09-26T10:07:00.000Z'
    }),
    /not approved/
  );
});

test('requested changes force a new revision and discard stale approvals', () => {
  let record = createStudioDraft({
    id: 'studio-romanov',
    package: clearedCandidate(),
    actor: editor,
    at: '2026-09-26T10:00:00.000Z'
  });
  record = submitStudioDraftForReview(record, {
    actor: editor,
    at: '2026-09-26T10:01:00.000Z'
  });
  record = reviewStudioDraft(record, {
    kind: 'historical',
    status: 'approved',
    actor: historian,
    at: '2026-09-26T10:02:00.000Z'
  });
  record = reviewStudioDraft(record, {
    kind: 'rights',
    status: 'changes-requested',
    actor: rights,
    at: '2026-09-26T10:03:00.000Z',
    note: 'Resolve the remaining reproduction-rights ambiguity.'
  });

  assert.equal(record.state, 'changes-requested');

  const revisedPackage = clearedCandidate();
  revisedPackage.version = 2;
  record = reviseStudioDraft(record, {
    package: revisedPackage,
    actor: editor,
    at: '2026-09-26T10:04:00.000Z',
    note: 'Rights metadata corrected.'
  });

  assert.equal(record.revision, 2);
  assert.equal(record.state, 'draft');
  assert.deepEqual(record.reviews, {});
  assert.deepEqual(getStudioProjection(record).missingApprovals, ['historical', 'rights', 'technical']);
});

test('author cannot review or publish own submitted revision', () => {
  const conflicted: StudioActor = {
    id: editor.id,
    roles: ['editor', 'historian-reviewer', 'publisher']
  };
  let record = createStudioDraft({
    id: 'studio-separation',
    package: clearedCandidate(),
    actor: conflicted,
    at: '2026-09-26T10:00:00.000Z'
  });
  record = submitStudioDraftForReview(record, {
    actor: conflicted,
    at: '2026-09-26T10:01:00.000Z'
  });

  assert.throws(
    () => reviewStudioDraft(record, {
      kind: 'historical',
      status: 'approved',
      actor: conflicted,
      at: '2026-09-26T10:02:00.000Z'
    }),
    /separation between author and reviewer/
  );
});

test('internal preview may publish a rights-cleared production candidate but public spatial release remains blocked', () => {
  let record = createStudioDraft({
    id: 'studio-preview',
    package: clearedCandidate(),
    actor: editor,
    at: '2026-09-26T10:00:00.000Z'
  });
  record = submitStudioDraftForReview(record, {
    actor: editor,
    at: '2026-09-26T10:01:00.000Z'
  });
  record = approveAll(record);

  assert.equal(record.state, 'approved');
  assert.deepEqual(getStudioProjection(record).nextActions, ['publish:internal-preview']);

  assert.throws(
    () => publishStudioRecord(record, {
      channel: 'public',
      actor: publisher,
      at: '2026-09-26T10:15:00.000Z'
    }),
    /requires field-verified/
  );

  const published = publishStudioRecord(record, {
    channel: 'internal-preview',
    actor: publisher,
    at: '2026-09-26T10:16:00.000Z'
  });
  assert.equal(published.state, 'published');
  assert.equal(published.publications.length, 1);
  assert.equal(published.publications[0]?.channel, 'internal-preview');
  assert.equal(Object.isFrozen(published.publications[0]), true);
  assert.equal(Object.isFrozen(published.publications[0]?.package), true);
});

test('published snapshot is immutable and next revision must increment package version', () => {
  let record = createStudioDraft({
    id: 'studio-versioning',
    package: clearedCandidate(),
    actor: editor,
    at: '2026-09-26T10:00:00.000Z'
  });
  record = submitStudioDraftForReview(record, {
    actor: editor,
    at: '2026-09-26T10:01:00.000Z'
  });
  record = approveAll(record);
  record = publishStudioRecord(record, {
    channel: 'internal-preview',
    actor: publisher,
    at: '2026-09-26T10:15:00.000Z'
  });

  const snapshotTitle = record.publications[0]?.package.titleRu;
  record.package.titleRu = 'Mutable working copy';
  assert.equal(record.publications[0]?.package.titleRu, snapshotTitle);

  assert.throws(
    () => openNextStudioRevision(record, {
      package: clearedCandidate(),
      actor: editor,
      at: '2026-09-26T10:20:00.000Z'
    }),
    /must be greater than published version/
  );

  const nextPackage = clearedCandidate();
  nextPackage.version = 2;
  const next = openNextStudioRevision(record, {
    package: nextPackage,
    actor: editor,
    at: '2026-09-26T10:21:00.000Z'
  });

  assert.equal(next.state, 'draft');
  assert.equal(next.revision, 2);
  assert.equal(next.package.version, 2);
  assert.equal(next.publications.length, 1);
});
