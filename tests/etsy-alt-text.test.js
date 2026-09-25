import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EtsyAltTextOperationError,
  ETSY_ALT_TEXT_LISTING_ID,
  ETSY_ALT_TEXT_SHOP_ID,
  ETSY_ALT_TEXT_TASK_ID,
  ETSY_ALT_TEXTS,
  endpointAuthorized,
  executeAltTextOperation
} from '../api/_etsy-alt-text.js';

const TEST_ENV = {
  ETSY_API_KEY: 'test-key',
  ETSY_SHARED_SECRET: 'test-secret',
  ETSY_ALT_TEXT_WRITES_ENABLED: 'true',
  ETSY_ALT_TEXT_AUTHORIZATION_ID: ETSY_ALT_TEXT_TASK_ID,
  ETSY_ALT_TEXT_AUTHORIZED_UNTIL: '2026-09-25T17:00:00.000Z'
};

function listing(overrides = {}) {
  return {
    listing_id: ETSY_ALT_TEXT_LISTING_ID,
    shop_id: ETSY_ALT_TEXT_SHOP_ID,
    state: 'draft',
    title: 'Cake Order Form & Bakery Order Tracker | Excel Spreadsheet + Printable PDF for Home Bakers',
    description: 'frozen product truth description',
    price: { amount: 999, divisor: 100, currency_code: 'USD' },
    taxonomy_id: 12476,
    quantity: 999,
    tags: [
      'cake order form', 'bakery order form', 'cake order tracker', 'bakery order tracker',
      'home bakery', 'custom cake form', 'cake order sheet', 'bakery spreadsheet',
      'order tracker', 'production planner', 'pickup delivery', 'payment tracker', 'excel template'
    ],
    who_made: 'i_did',
    when_made: '2020_2026',
    listing_type: 'download',
    shop_section_id: null,
    should_auto_renew: false,
    is_personalizable: false,
    is_customizable: false,
    ...overrides
  };
}

function baselineImages() {
  return ETSY_ALT_TEXTS.map((_, index) => ({
    listing_image_id: 7001 + index,
    rank: index + 1,
    alt_text: index === 0 || index === 9 ? ETSY_ALT_TEXTS[0] : '',
    url_fullxfull: `https://img.example/${index + 1}.png`,
    full_width: 2000,
    full_height: 2000
  }));
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function provider(initialListing = listing(), initialImages = baselineImages()) {
  let listingState = structuredClone(initialListing);
  let images = structuredClone(initialImages);
  const calls = [];
  const fetchImpl = async (input, init = {}) => {
    const url = String(input);
    const method = String(init.method || 'GET').toUpperCase();
    calls.push({ url, method, body: init.body });
    if (method === 'GET' && url.endsWith(`/listings/${ETSY_ALT_TEXT_LISTING_ID}`)) {
      return jsonResponse(listingState);
    }
    if (method === 'GET' && url.endsWith(`/listings/${ETSY_ALT_TEXT_LISTING_ID}/images`)) {
      return jsonResponse({ count: images.length, results: images });
    }
    if (method === 'POST' && url.endsWith(`/listings/${ETSY_ALT_TEXT_LISTING_ID}/images`)) {
      assert.ok(init.body instanceof FormData);
      assert.equal(init.body.get('image'), null);
      assert.equal(init.body.get('overwrite'), null);
      const id = Number(init.body.get('listing_image_id'));
      const rank = Number(init.body.get('rank'));
      const image = images.find((item) => item.listing_image_id === id && item.rank === rank);
      if (!image) return jsonResponse({ error: 'not found' }, 404);
      image.alt_text = String(init.body.get('alt_text'));
      return jsonResponse({ ...image }, 201);
    }
    return jsonResponse({ error: 'unexpected request' }, 500);
  };
  return { calls, fetchImpl, get images() { return images; }, set listing(value) { listingState = value; } };
}

const tokenProvider = async () => '123.test-access-token';
const now = () => new Date('2026-09-25T16:00:00.000Z');

test('endpoint bearer authentication is fail-closed and constant-scope', () => {
  const env = { ETSY_ALT_TEXT_ENDPOINT_TOKEN: 'a'.repeat(48) };
  assert.equal(endpointAuthorized({}, env), false);
  assert.equal(endpointAuthorized({ authorization: `Bearer ${'b'.repeat(48)}` }, env), false);
  assert.equal(endpointAuthorized({ authorization: `Bearer ${'a'.repeat(48)}` }, env), true);
});

test('dry-run accepts only the exact canonical baseline and plans ranks 2-10', async () => {
  const p = provider();
  const result = await executeAltTextOperation({
    mode: 'dry-run', env: TEST_ENV, fetchImpl: p.fetchImpl, tokenProvider, now
  });
  assert.equal(result.status, 'DRY_RUN_PASS');
  assert.deepEqual(result.plannedChanges.map((item) => item.rank), [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(result.ETSY_WRITE_COUNT, 0);
  assert.ok(p.calls.every((call) => call.method === 'GET'));
});

test('dry-run blocks protected listing drift', async () => {
  const p = provider(listing({ title: 'changed title' }));
  await assert.rejects(
    executeAltTextOperation({ mode: 'dry-run', env: TEST_ENV, fetchImpl: p.fetchImpl, tokenProvider, now }),
    /CANONICAL_TITLE_MISMATCH/
  );
  assert.ok(p.calls.every((call) => call.method === 'GET'));
});

test('apply requires the exact fresh baseline fingerprint and exact authorization', async () => {
  const p = provider();
  const dryRun = await executeAltTextOperation({
    mode: 'dry-run', env: TEST_ENV, fetchImpl: p.fetchImpl, tokenProvider, now
  });
  const result = await executeAltTextOperation({
    mode: 'apply',
    body: {
      listingId: ETSY_ALT_TEXT_LISTING_ID,
      authorizationId: ETSY_ALT_TEXT_TASK_ID,
      expectedBaselineSha256: dryRun.baselineSha256
    },
    env: TEST_ENV,
    fetchImpl: p.fetchImpl,
    tokenProvider,
    now,
    sleep: async () => {}
  });
  assert.equal(result.status, 'PASS');
  assert.equal(result.ETSY_WRITE_COUNT, 9);
  assert.deepEqual(result.appliedRanks, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(p.images.map((item) => item.alt_text), ETSY_ALT_TEXTS);
  const writes = p.calls.filter((call) => call.method === 'POST');
  assert.equal(writes.length, 9);
});

test('apply rejects stale baseline without making a write', async () => {
  const p = provider();
  await assert.rejects(
    executeAltTextOperation({
      mode: 'apply',
      body: {
        listingId: ETSY_ALT_TEXT_LISTING_ID,
        authorizationId: ETSY_ALT_TEXT_TASK_ID,
        expectedBaselineSha256: '0'.repeat(64)
      },
      env: TEST_ENV,
      fetchImpl: p.fetchImpl,
      tokenProvider,
      now
    }),
    /PROTECTED_STATE_BASELINE_MISMATCH/
  );
  assert.equal(p.calls.filter((call) => call.method === 'POST').length, 0);
});

test('already-complete state is a zero-write pass', async () => {
  const complete = baselineImages().map((item, index) => ({ ...item, alt_text: ETSY_ALT_TEXTS[index] }));
  const p = provider(listing(), complete);
  const result = await executeAltTextOperation({
    mode: 'apply', body: {}, env: TEST_ENV, fetchImpl: p.fetchImpl, tokenProvider, now
  });
  assert.equal(result.alreadyComplete, true);
  assert.equal(result.ETSY_WRITE_COUNT, 0);
  assert.equal(p.calls.filter((call) => call.method === 'POST').length, 0);
});

test('a post-write protected-state drift reports the real write count and stops', async () => {
  const p = provider();
  const dryRun = await executeAltTextOperation({
    mode: 'dry-run', env: TEST_ENV, fetchImpl: p.fetchImpl, tokenProvider, now
  });
  const originalFetch = p.fetchImpl;
  let postSeen = false;
  const driftFetch = async (input, init = {}) => {
    const response = await originalFetch(input, init);
    if (String(init.method || 'GET').toUpperCase() === 'POST') postSeen = true;
    if (postSeen && String(init.method || 'GET').toUpperCase() === 'GET' && String(input).endsWith('/images')) {
      const payload = await response.json();
      payload.results[0].url_fullxfull = 'https://img.example/unexpected-drift.png';
      return jsonResponse(payload);
    }
    return response;
  };

  await assert.rejects(
    executeAltTextOperation({
      mode: 'apply',
      body: {
        listingId: ETSY_ALT_TEXT_LISTING_ID,
        authorizationId: ETSY_ALT_TEXT_TASK_ID,
        expectedBaselineSha256: dryRun.baselineSha256
      },
      env: TEST_ENV,
      fetchImpl: driftFetch,
      tokenProvider,
      now,
      sleep: async () => {}
    }),
    (error) => {
      assert.ok(error instanceof EtsyAltTextOperationError);
      assert.equal(error.message, 'PROTECTED_IMAGE_OR_LISTING_DRIFT');
      assert.equal(error.etsyWriteCount, 1);
      return true;
    }
  );
  assert.equal(p.calls.filter((call) => call.method === 'POST').length, 1);
});
