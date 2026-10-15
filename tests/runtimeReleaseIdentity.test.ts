import assert from 'node:assert/strict';
import test from 'node:test';
import { moscowRuntimeReleaseIdentity } from '../src/travel/runtimeReleaseIdentity.ts';

const sha = 'abcdef0123456789abcdef0123456789abcdef01';

test('release identity reports only sanitized exact commit from the authorized Render repository', () => {
  const actual = moscowRuntimeReleaseIdentity({
    RENDER: 'true', RENDER_GIT_COMMIT: sha.toUpperCase(),
    RENDER_GIT_BRANCH: 'fix/moscow-release-proof-durable-import-20261015',
    RENDER_GIT_REPO_SLUG: 'PetrFedin/Moscow', RENDER_SERVICE_ID: 'srv-dakkd0lg1s2s73ckof9g',
    DATABASE_URL: 'private-secret', OPENAI_API_KEY: 'private-key'
  });
  assert.equal(actual.commitSha, sha);
  assert.equal(actual.source, 'render-runtime-environment');
  assert.equal(actual.repository, 'PetrFedin/Moscow');
  assert.ok(!JSON.stringify(actual).includes('private'));
});

test('non-Render local build and unrelated Render project cannot claim Moscow release', () => {
  for (const env of [
    { RENDER_GIT_COMMIT: sha, RENDER_GIT_REPO_SLUG: 'PetrFedin/Moscow' },
    { RENDER:'true', RENDER_GIT_COMMIT:sha, RENDER_GIT_REPO_SLUG:'other/repo' },
    { RENDER:'true', RENDER_GIT_COMMIT:'invalid', RENDER_GIT_REPO_SLUG:'PetrFedin/Moscow' }
  ]) {
    const identity = moscowRuntimeReleaseIdentity(env);
    assert.equal(identity.commitSha, null);
    assert.equal(identity.source, 'unavailable');
  }
});

test('release identity rejects unexpected branch and service strings without disclosing tokens', () => {
  const identity = moscowRuntimeReleaseIdentity({
    RENDER:'true', RENDER_GIT_COMMIT:sha, RENDER_GIT_REPO_SLUG:'PetrFedin/Moscow',
    RENDER_GIT_BRANCH:'../../bad?token=top-secret',
    RENDER_SERVICE_ID:'srv-okay\nAuthorization: token'
  });
  assert.equal(identity.commitSha, sha);
  assert.equal(identity.branch, null);
  assert.equal(identity.serviceId, null);
});
