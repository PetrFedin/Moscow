import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIVE_CITY_PUBLISH_AUDIENCE,
  LIVE_CITY_PUBLISH_REF,
  LIVE_CITY_PUBLISH_REPOSITORY,
  LIVE_CITY_PUBLISH_REPOSITORY_ID,
  LIVE_CITY_PUBLISH_REPOSITORY_OWNER_ID,
  LIVE_CITY_PUBLISH_SUBJECT,
  LIVE_CITY_PUBLISH_WORKFLOW_REF,
  parsePublishedLiveCitySnapshot,
  validateGitHubActionsPublisherClaims
} from '../src/travel/liveCityPublicationAuthority.ts';

function claims() {
  return {
    iss: 'https://token.actions.githubusercontent.com',
    aud: LIVE_CITY_PUBLISH_AUDIENCE,
    sub: LIVE_CITY_PUBLISH_SUBJECT,
    repository: LIVE_CITY_PUBLISH_REPOSITORY,
    repository_id: LIVE_CITY_PUBLISH_REPOSITORY_ID,
    repository_owner_id: LIVE_CITY_PUBLISH_REPOSITORY_OWNER_ID,
    ref: LIVE_CITY_PUBLISH_REF,
    sha: 'a'.repeat(40),
    workflow_ref: LIVE_CITY_PUBLISH_WORKFLOW_REF,
    event_name: 'push',
    run_id: '123456',
    run_attempt: '1',
    iat: 1_000,
    nbf: 990,
    exp: 1_300
  };
}

function snapshot() {
  return {
    schemaVersion: 1,
    kind: 'live-city-current-snapshot',
    destinationId: 'moscow',
    refreshedAt: '2026-10-09T16:00:00.000Z',
    sourceSnapshots: [
      {
        providerId: 'tretyakov-official',
        sourceUrl: 'https://example.org/venue',
        fetchedAt: '2026-10-09T15:59:50.000Z',
        payloadSha256: 'a'.repeat(64)
      },
      {
        providerId: 'tretyakov-programme-official',
        sourceUrl: 'https://example.org/programme',
        fetchedAt: '2026-10-09T15:59:51.000Z',
        payloadSha256: 'b'.repeat(64)
      }
    ],
    mergedFeed: {
      schemaVersion: 1,
      destinationId: 'moscow',
      generatedAt: '2026-10-09T16:00:00.000Z',
      providers: [
        {
          id: 'tretyakov-official',
          name: 'Tretyakov venue',
          relationship: 'official',
          capabilities: ['inventory', 'operational-status', 'opening-hours'],
          sourceUrl: 'https://example.org/venue',
          attributionRu: 'Источник',
          attributionEn: 'Source',
          attributionZh: '来源'
        },
        {
          id: 'tretyakov-programme-official',
          name: 'Tretyakov programme',
          relationship: 'official',
          capabilities: ['inventory', 'event-schedule', 'operational-status'],
          sourceUrl: 'https://example.org/programme',
          attributionRu: 'Источник',
          attributionEn: 'Source',
          attributionZh: '来源'
        }
      ],
      entities: [
        {
          id: 'new-tretyakov-live',
          providerEntityId: 'new-tretyakov',
          providerId: 'tretyakov-official',
          canonicalDestinationNodeId: 'new-tretyakov',
          kind: 'museum',
          titleRu: 'Новая Третьяковка',
          titleEn: 'New Tretyakov',
          titleZh: '新特列季亚科夫画廊',
          tags: ['museum'],
          sourceUrl: 'https://example.org/venue',
          observedAt: '2026-10-09T15:59:50.000Z',
          expiresAt: '2026-10-09T16:30:00.000Z',
          operationalStatus: 'open'
        },
        {
          id: 'programme-live',
          providerEntityId: 'programme',
          providerId: 'tretyakov-programme-official',
          canonicalDestinationNodeId: 'programme-live',
          kind: 'exhibition',
          titleRu: 'Выставка',
          titleEn: 'Exhibition',
          titleZh: '展览',
          tags: ['event'],
          sourceUrl: 'https://example.org/programme',
          observedAt: '2026-10-09T15:59:51.000Z',
          expiresAt: '2026-10-09T16:30:00.000Z',
          operationalStatus: 'scheduled',
          startsAt: '2026-10-01T00:00:00+03:00',
          endsAt: '2026-12-01T23:59:59+03:00'
        }
      ]
    },
    disruptions: []
  };
}

test('GitHub Actions publisher claims admit the immutable exact-main workflow identity', () => {
  const result = validateGitHubActionsPublisherClaims(claims(), 1_050);
  assert.equal(result.valid, true);
  assert.deepEqual(result.blockers, []);
  assert.equal(
    LIVE_CITY_PUBLISH_SUBJECT,
    'repo:PetrFedin@81327591/Moscow@1371430954:ref:refs/heads/main'
  );
});

test('GitHub Actions publisher claims reject legacy subject, PR refs and wrong workflow identity', () => {
  const value = claims();
  value.ref = 'refs/pull/12/merge' as typeof value.ref;
  value.sub = 'repo:PetrFedin/Moscow:ref:refs/heads/main';
  value.workflow_ref = 'PetrFedin/Moscow/.github/workflows/other.yml@refs/heads/main' as typeof value.workflow_ref;
  value.event_name = 'pull_request' as typeof value.event_name;

  const result = validateGitHubActionsPublisherClaims(value, 1_050);
  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('oidc-subject-invalid'));
  assert.ok(result.blockers.includes('oidc-ref-invalid'));
  assert.ok(result.blockers.includes('oidc-workflow-ref-invalid'));
  assert.ok(result.blockers.includes('oidc-event-invalid'));
});

test('GitHub Actions publisher claims reject a mismatched owner ID when present', () => {
  const value = claims();
  value.repository_owner_id = '999999' as typeof value.repository_owner_id;
  const result = validateGitHubActionsPublisherClaims(value, 1_050);
  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('oidc-repository-owner-id-invalid'));
});

test('published current snapshot requires both admitted real providers and recent truth', () => {
  const parsed = parsePublishedLiveCitySnapshot(
    snapshot(),
    '2026-10-09T16:05:00.000Z'
  );

  assert.equal(parsed.destinationId, 'moscow');
  assert.equal(parsed.sourceSnapshots.length, 2);
  assert.equal(parsed.mergedFeed.entities.length, 2);
});

test('published current snapshot fails closed when provider proof or freshness is missing', () => {
  const missingProvider = snapshot();
  missingProvider.sourceSnapshots = missingProvider.sourceSnapshots.slice(0, 1);
  assert.throws(
    () => parsePublishedLiveCitySnapshot(
      missingProvider,
      '2026-10-09T16:05:00.000Z'
    ),
    /source provider is missing: tretyakov-programme-official/
  );

  assert.throws(
    () => parsePublishedLiveCitySnapshot(
      snapshot(),
      '2026-10-09T16:11:00.001Z'
    ),
    /snapshot is too old/
  );
});
