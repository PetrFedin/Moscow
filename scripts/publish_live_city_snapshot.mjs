import { readFile } from 'node:fs/promises';

import {
  LIVE_CITY_PUBLISH_AUDIENCE
} from '../src/travel/liveCityPublicationAuthority.ts';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function githubOidcToken() {
  const requestUrl = new URL(required('ACTIONS_ID_TOKEN_REQUEST_URL'));
  requestUrl.searchParams.set('audience', LIVE_CITY_PUBLISH_AUDIENCE);

  const response = await fetch(requestUrl, {
    headers: {
      authorization: `bearer ${required('ACTIONS_ID_TOKEN_REQUEST_TOKEN')}`,
      accept: 'application/json'
    },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) {
    throw new Error(`GitHub OIDC token HTTP ${response.status}`);
  }

  const value = await response.json();
  if (!value || typeof value.value !== 'string' || !value.value) {
    throw new Error('GitHub OIDC token response is invalid');
  }

  console.log(`::add-mask::${value.value}`);
  return value.value;
}

async function publishAttempt(input) {
  const response = await fetch(input.publishUrl, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${input.token}`,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: input.snapshotBody,
    signal: AbortSignal.timeout(30_000)
  });

  const responseText = await response.text();
  let responseBody = null;
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = { raw: responseText.slice(0, 500) };
  }

  return {
    status: response.status,
    ok: response.ok,
    body: responseBody
  };
}

async function main() {
  const publishUrl = process.env.LIVE_CITY_PUBLISH_URL?.trim()
    || 'https://moscow-mobile-preview.onrender.com/live-city/publish';
  if (!/^https:\/\//i.test(publishUrl)) {
    throw new Error('LIVE_CITY_PUBLISH_URL must use HTTPS');
  }

  const snapshotPath = process.env.LIVE_CITY_SNAPSHOT_PATH?.trim()
    || 'evidence/live-city-current/current.json';
  const snapshotBody = await readFile(snapshotPath, 'utf8');
  const snapshot = JSON.parse(snapshotBody);
  const token = await githubOidcToken();
  const maximumAttempts = Math.max(
    1,
    Number(process.env.LIVE_CITY_PUBLISH_ATTEMPTS || 24)
  );
  const retryDelayMs = Math.max(
    1_000,
    Number(process.env.LIVE_CITY_PUBLISH_RETRY_DELAY_MS || 10_000)
  );

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    let result;
    try {
      result = await publishAttempt({
        publishUrl,
        token,
        snapshotBody
      });
    } catch (error) {
      if (attempt === maximumAttempts) throw error;
      console.log(JSON.stringify({
        event: 'live-city-publish-retry',
        attempt,
        maximumAttempts,
        reason: error instanceof Error ? error.message : String(error)
      }));
      await sleep(retryDelayMs);
      continue;
    }

    if (result.ok) {
      console.log(JSON.stringify({
        status: 'pass',
        publishUrl,
        refreshedAt: snapshot.refreshedAt,
        attempt,
        response: result.body
      }, null, 2));
      return;
    }

    if (
      result.status === 409
      && result.body?.error === 'snapshot-not-newer'
    ) {
      console.log(JSON.stringify({
        status: 'pass',
        publishUrl,
        refreshedAt: snapshot.refreshedAt,
        attempt,
        alreadyPublished: true,
        response: result.body
      }, null, 2));
      return;
    }

    const retryable = result.status === 404
      || result.status === 408
      || result.status === 425
      || result.status === 429
      || result.status === 502
      || result.status === 503
      || result.status === 504;

    if (!retryable || attempt === maximumAttempts) {
      throw new Error(
        `Live city publish HTTP ${result.status}: ${JSON.stringify(result.body)}`
      );
    }

    console.log(JSON.stringify({
      event: 'live-city-publish-retry',
      attempt,
      maximumAttempts,
      httpStatus: result.status,
      response: result.body
    }));
    await sleep(retryDelayMs);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
