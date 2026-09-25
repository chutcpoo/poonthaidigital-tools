import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export const ETSY_ALT_TEXT_TASK_ID =
  'PDT-HBOP-001-V2-ETSY-ALT-TEXT-R01-20260925 LISTING 4581821318 EXACT SCOPE ONLY';
export const ETSY_ALT_TEXT_LISTING_ID = 4581821318;
export const ETSY_ALT_TEXT_SHOP_ID = 23582741;

export const ETSY_ALT_TEXTS = Object.freeze([
  'Cake order form and Excel workflow tracker with real dashboard and printable form preview.',
  'Real Excel dashboard showing open orders, balances, due dates, order status and payment state.',
  'Cake Orders worksheet for customer details, needed date, fulfillment method, totals and payment state.',
  'Cake order balance and payment log showing total paid, balance due and recorded payments by Order ID.',
  'Production Board worksheet showing production dates, prep status and overdue, today, upcoming or cancelled states.',
  'Fulfillment worksheet for pickup or delivery date, time, remaining balance, order status and handoff state.',
  'Order Items worksheet for multi-item cake orders with flavor, size, quantity, production date and prep status.',
  'Five-step cake order workflow from intake and Order ID through payments, production and fulfillment.',
  'Four digital buyer files: clean Excel workbook, demo workbook, printable cake order form and quick start guide.',
  'Compatibility and product boundaries for Excel 365 or Excel 2021+, with no automation or compliance claims.'
]);

const EXPECTED_TITLE =
  'Cake Order Form & Bakery Order Tracker | Excel Spreadsheet + Printable PDF for Home Bakers';
const EXPECTED_TAGS = Object.freeze([
  'cake order form',
  'bakery order form',
  'cake order tracker',
  'bakery order tracker',
  'home bakery',
  'custom cake form',
  'cake order sheet',
  'bakery spreadsheet',
  'order tracker',
  'production planner',
  'pickup delivery',
  'payment tracker',
  'excel template'
]);

const REQUIRED_SCOPES = Object.freeze(['listings_r', 'listings_w']);
const MAX_AUTHORIZATION_WINDOW_MS = 24 * 60 * 60 * 1000;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export class EtsyAltTextOperationError extends Error {
  constructor(message, etsyWriteCount = 0) {
    super(message);
    this.name = 'EtsyAltTextOperationError';
    this.etsyWriteCount = etsyWriteCount;
  }
}

function text(value) {
  return String(value ?? '').normalize('NFC').trim();
}

function json(value) {
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left ?? ''), 'utf8');
  const b = Buffer.from(String(right ?? ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function positiveInteger(value, code) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(code);
  return parsed;
}

function parsePriceUsd(price) {
  const amount = Number(price?.amount);
  const divisor = Number(price?.divisor);
  const currency = text(price?.currency_code).toUpperCase();
  if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(divisor) || divisor <= 0) return null;
  return { amount, divisor, currency };
}

function sortedObject(value) {
  if (Array.isArray(value)) return value.map(sortedObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, sortedObject(item)])
  );
}

function stableJson(value) {
  return JSON.stringify(sortedObject(value));
}

async function responseJson(response) {
  const body = await response.text();
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function etsyHeaders(accessToken, env) {
  const key = text(env.ETSY_API_KEY);
  const shared = text(env.ETSY_SHARED_SECRET);
  if (!key || !shared) throw new Error('ETSY_APP_CREDENTIALS_NOT_CONFIGURED');
  return {
    accept: 'application/json',
    authorization: `Bearer ${accessToken}`,
    'x-api-key': `${key}:${shared}`
  };
}

function tokenEncryptionKey(env) {
  const raw = text(env.ETSY_TOKEN_ENCRYPTION_KEY);
  if (raw.length < 32) throw new Error('ETSY_TOKEN_ENCRYPTION_KEY_NOT_CONFIGURED');
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

function decryptSecret(envelope, env) {
  const [version, ivEncoded, tagEncoded, ciphertextEncoded] = text(envelope).split(':');
  if (version !== 'v1' || !ivEncoded || !tagEncoded || !ciphertextEncoded) {
    throw new Error('INVALID_SECRET_ENVELOPE');
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    tokenEncryptionKey(env),
    Buffer.from(ivEncoded, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

function encryptSecret(value, env) {
  if (!value) throw new Error('EMPTY_SECRET');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', tokenEncryptionKey(env), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url')
  ].join(':');
}

function tokenDatabase(env) {
  const url = text(env.ETSY_TOKEN_DATABASE_URL);
  if (!url) throw new Error('ETSY_TOKEN_DATABASE_URL_NOT_CONFIGURED');
  return neon(url);
}

function assertScopes(scope) {
  const granted = new Set(text(scope).split(/\s+/u).filter(Boolean));
  const missing = REQUIRED_SCOPES.filter((item) => !granted.has(item));
  if (missing.length > 0) throw new Error(`ETSY_SCOPE_MISSING:${missing.join(',')}`);
}

async function loadStoredToken(env) {
  const sql = tokenDatabase(env);
  const rows = await sql`
    SELECT access_token_enc, refresh_token_enc, expires_at, scope, token_type
    FROM oauth_tokens
    WHERE provider = 'etsy' AND account_key = 'primary'
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) throw new Error('ETSY_OAUTH_NOT_CONNECTED');
  assertScopes(row.scope);
  return {
    accessToken: decryptSecret(row.access_token_enc, env),
    refreshToken: decryptSecret(row.refresh_token_enc, env),
    expiresAt: new Date(row.expires_at),
    scope: text(row.scope),
    tokenType: text(row.token_type) || 'Bearer'
  };
}

async function refreshStoredToken(stored, env, fetchImpl) {
  const key = text(env.ETSY_API_KEY);
  if (!key) throw new Error('ETSY_API_KEY_NOT_CONFIGURED');
  const response = await fetchImpl('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: key,
      refresh_token: stored.refreshToken
    }),
    cache: 'no-store'
  });
  const payload = await responseJson(response);
  if (!response.ok || !payload.access_token) {
    throw new Error(`ETSY_TOKEN_REFRESH_FAILED:${response.status}`);
  }
  const nextRefreshToken = text(payload.refresh_token) || stored.refreshToken;
  const expiresIn = Math.max(60, Number(payload.expires_in) || 3600);
  const nextScope = text(payload.scope) || stored.scope;
  assertScopes(nextScope);
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  const sql = tokenDatabase(env);
  await sql`
    UPDATE oauth_tokens
    SET access_token_enc = ${encryptSecret(text(payload.access_token), env)},
        refresh_token_enc = ${encryptSecret(nextRefreshToken, env)},
        expires_at = ${expiresAt},
        scope = ${nextScope},
        token_type = ${text(payload.token_type) || stored.tokenType},
        updated_at = now()
    WHERE provider = 'etsy' AND account_key = 'primary'
  `;
  return text(payload.access_token);
}

export async function getValidEtsyAccessToken(env, fetchImpl = fetch) {
  const stored = await loadStoredToken(env);
  if (stored.expiresAt.getTime() - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
    return stored.accessToken;
  }
  return refreshStoredToken(stored, env, fetchImpl);
}

function normalizeListing(raw) {
  const price = parsePriceUsd(raw?.price);
  return {
    listingId: positiveInteger(raw?.listing_id, 'LISTING_ID_INVALID'),
    shopId: positiveInteger(raw?.shop_id, 'SHOP_ID_INVALID'),
    state: text(raw?.state).toLowerCase(),
    title: text(raw?.title),
    description: text(raw?.description),
    price,
    taxonomyId: positiveInteger(raw?.taxonomy_id, 'TAXONOMY_ID_INVALID'),
    quantity: positiveInteger(raw?.quantity, 'QUANTITY_INVALID'),
    tags: Array.isArray(raw?.tags) ? raw.tags.map(text) : [],
    whoMade: text(raw?.who_made),
    whenMade: text(raw?.when_made),
    listingType: text(raw?.listing_type),
    shopSectionId: raw?.shop_section_id == null ? null : Number(raw.shop_section_id),
    shouldAutoRenew: Boolean(raw?.should_auto_renew),
    isPersonalizable: Boolean(raw?.is_personalizable),
    isCustomizable: Boolean(raw?.is_customizable)
  };
}

function normalizeImage(raw, providerPosition) {
  return {
    providerPosition,
    listingImageId: positiveInteger(raw?.listing_image_id, 'LISTING_IMAGE_ID_INVALID'),
    rank: positiveInteger(raw?.rank, 'LISTING_IMAGE_RANK_INVALID'),
    altText: text(raw?.alt_text),
    urlFull: text(raw?.url_fullxfull),
    width: positiveInteger(raw?.full_width, 'LISTING_IMAGE_WIDTH_INVALID'),
    height: positiveInteger(raw?.full_height, 'LISTING_IMAGE_HEIGHT_INVALID')
  };
}

function normalizeImages(payload) {
  if (!payload || !Array.isArray(payload.results)) throw new Error('ETSY_IMAGES_READBACK_INVALID');
  return payload.results.map((item, index) => normalizeImage(item, index + 1));
}

function protectedIdentity(snapshot) {
  return {
    listing: snapshot.listing,
    images: snapshot.images.map(({ altText: _ignored, ...image }) => image)
  };
}

function observedState(snapshot) {
  return {
    identity: protectedIdentity(snapshot),
    altTexts: snapshot.images.map((image) => ({
      listingImageId: image.listingImageId,
      rank: image.rank,
      altText: image.altText
    }))
  };
}

export function snapshotFingerprint(snapshot) {
  return sha256(stableJson(observedState(snapshot)));
}

function identityFingerprint(snapshot) {
  return sha256(stableJson(protectedIdentity(snapshot)));
}

function assertCanonicalListing(listing) {
  if (listing.listingId !== ETSY_ALT_TEXT_LISTING_ID) throw new Error('LISTING_ALLOWLIST_MISMATCH');
  if (listing.shopId !== ETSY_ALT_TEXT_SHOP_ID) throw new Error('SHOP_ALLOWLIST_MISMATCH');
  if (listing.state !== 'draft') throw new Error('LISTING_STATE_NOT_DRAFT');
  if (listing.title !== EXPECTED_TITLE) throw new Error('CANONICAL_TITLE_MISMATCH');
  if (!listing.price || listing.price.amount !== 999 || listing.price.divisor !== 100 || listing.price.currency !== 'USD') {
    throw new Error('CANONICAL_PRICE_MISMATCH');
  }
  if (listing.taxonomyId !== 12476) throw new Error('CANONICAL_TAXONOMY_MISMATCH');
  if (listing.quantity !== 999) throw new Error('CANONICAL_QUANTITY_MISMATCH');
  if (stableJson(listing.tags) !== stableJson(EXPECTED_TAGS)) throw new Error('CANONICAL_TAGS_MISMATCH');
}

function orderedImages(snapshot) {
  if (snapshot.images.length !== 10) throw new Error('CANONICAL_GALLERY_COUNT_MISMATCH');
  const byRank = [...snapshot.images].sort((a, b) => a.rank - b.rank);
  if (byRank.some((image, index) => image.rank !== index + 1)) {
    throw new Error('CANONICAL_GALLERY_RANK_MISMATCH');
  }
  if (new Set(byRank.map((image) => image.listingImageId)).size !== 10) {
    throw new Error('CANONICAL_GALLERY_IDENTITY_MISMATCH');
  }
  if (byRank.some((image) => image.width !== 2000 || image.height !== 2000 || !image.urlFull)) {
    throw new Error('CANONICAL_GALLERY_DIMENSION_MISMATCH');
  }
  return byRank;
}

function baselinePlan(snapshot) {
  assertCanonicalListing(snapshot.listing);
  const images = orderedImages(snapshot);
  const final = images.every((image, index) => image.altText === ETSY_ALT_TEXTS[index]);
  if (final) return { final: true, changes: [] };

  if (images[0].altText !== ETSY_ALT_TEXTS[0]) throw new Error('CANONICAL_ALT_BASELINE_IMAGE_01_MISMATCH');
  for (let index = 1; index <= 8; index += 1) {
    if (images[index].altText !== '') {
      throw new Error(`CANONICAL_ALT_BASELINE_IMAGE_${String(index + 1).padStart(2, '0')}_MISMATCH`);
    }
  }
  if (images[9].altText !== ETSY_ALT_TEXTS[0]) {
    throw new Error('CANONICAL_ALT_BASELINE_IMAGE_10_MISMATCH');
  }

  return {
    final: false,
    changes: images.slice(1).map((image, index) => ({
      listingImageId: image.listingImageId,
      rank: image.rank,
      from: image.altText,
      to: ETSY_ALT_TEXTS[index + 1]
    }))
  };
}

async function readSnapshot(accessToken, env, fetchImpl) {
  const headers = etsyHeaders(accessToken, env);
  const listingUrl = `https://api.etsy.com/v3/application/listings/${ETSY_ALT_TEXT_LISTING_ID}`;
  const imagesUrl = `${listingUrl}/images`;
  const [listingResponse, imagesResponse] = await Promise.all([
    fetchImpl(listingUrl, { method: 'GET', headers, cache: 'no-store' }),
    fetchImpl(imagesUrl, { method: 'GET', headers, cache: 'no-store' })
  ]);
  if (!listingResponse.ok) throw new Error(`ETSY_LISTING_READ_HTTP_${listingResponse.status}`);
  if (!imagesResponse.ok) throw new Error(`ETSY_IMAGES_READ_HTTP_${imagesResponse.status}`);
  return {
    listing: normalizeListing(await responseJson(listingResponse)),
    images: normalizeImages(await responseJson(imagesResponse))
  };
}

function assertEndpointAuthorization(headers, env) {
  const configured = text(env.ETSY_ALT_TEXT_ENDPOINT_TOKEN);
  if (configured.length < 32) return false;
  const supplied = text(headers?.authorization ?? headers?.Authorization);
  if (!supplied.startsWith('Bearer ')) return false;
  return safeEqual(supplied.slice(7), configured);
}

export function endpointAuthorized(headers, env = process.env) {
  return assertEndpointAuthorization(headers, env);
}

function assertApplyGrant(body, env, now) {
  if (text(env.ETSY_ALT_TEXT_WRITES_ENABLED).toLowerCase() !== 'true') {
    throw new Error('ETSY_ALT_TEXT_WRITES_DISABLED');
  }
  if (!safeEqual(text(env.ETSY_ALT_TEXT_AUTHORIZATION_ID), ETSY_ALT_TEXT_TASK_ID)) {
    throw new Error('ETSY_ALT_TEXT_ENV_AUTHORIZATION_MISMATCH');
  }
  if (!safeEqual(text(body.authorizationId), ETSY_ALT_TEXT_TASK_ID)) {
    throw new Error('ETSY_ALT_TEXT_REQUEST_AUTHORIZATION_MISMATCH');
  }
  const expiresAt = Date.parse(text(env.ETSY_ALT_TEXT_AUTHORIZED_UNTIL));
  const nowMs = now().getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= nowMs || expiresAt - nowMs > MAX_AUTHORIZATION_WINDOW_MS) {
    throw new Error('ETSY_ALT_TEXT_AUTHORIZATION_NOT_CURRENT');
  }
  const fingerprint = text(body.expectedBaselineSha256).toLowerCase();
  if (!/^[a-f0-9]{64}$/u.test(fingerprint)) throw new Error('EXPECTED_BASELINE_SHA256_INVALID');
  if (body.listingId != null && Number(body.listingId) !== ETSY_ALT_TEXT_LISTING_ID) {
    throw new Error('LISTING_ALLOWLIST_MISMATCH');
  }
  return fingerprint;
}

async function writeAltText({ accessToken, env, fetchImpl, image, altText }) {
  const body = new FormData();
  body.append('listing_image_id', String(image.listingImageId));
  body.append('rank', String(image.rank));
  body.append('alt_text', altText);
  const response = await fetchImpl(
    `https://api.etsy.com/v3/application/shops/${ETSY_ALT_TEXT_SHOP_ID}/listings/${ETSY_ALT_TEXT_LISTING_ID}/images`,
    {
      method: 'POST',
      headers: etsyHeaders(accessToken, env),
      body,
      cache: 'no-store'
    }
  );
  const payload = await responseJson(response);
  if (!response.ok) throw new Error(`ETSY_ALT_TEXT_WRITE_HTTP_${response.status}`);
  if (Number(payload?.listing_image_id) !== image.listingImageId) {
    throw new Error('ETSY_ALT_TEXT_WRITE_RECEIPT_IDENTITY_MISMATCH');
  }
}

async function waitForTargetReadback({ accessToken, env, fetchImpl, sleep, identitySha256, rank, altText }) {
  let last;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    last = await readSnapshot(accessToken, env, fetchImpl);
    if (identityFingerprint(last) !== identitySha256) throw new Error('PROTECTED_IMAGE_OR_LISTING_DRIFT');
    const image = orderedImages(last)[rank - 1];
    if (image.altText === altText) return last;
    if (attempt < 7) await sleep(750);
  }
  throw new Error('ETSY_ALT_TEXT_READBACK_TIMEOUT');
}

export async function executeAltTextOperation({
  mode,
  body = {},
  env = process.env,
  fetchImpl = fetch,
  tokenProvider = getValidEtsyAccessToken,
  now = () => new Date(),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
}) {
  if (mode !== 'dry-run' && mode !== 'apply') throw new Error('MODE_NOT_ALLOWED');
  const accessToken = await tokenProvider(env, fetchImpl);
  const before = await readSnapshot(accessToken, env, fetchImpl);
  const plan = baselinePlan(before);
  const baselineSha256 = snapshotFingerprint(before);
  const identitySha256 = identityFingerprint(before);

  if (plan.final) {
    return {
      status: 'PASS',
      mode,
      taskId: ETSY_ALT_TEXT_TASK_ID,
      listingId: ETSY_ALT_TEXT_LISTING_ID,
      baselineSha256,
      plannedChanges: [],
      ETSY_WRITE_COUNT: 0,
      alreadyComplete: true
    };
  }

  if (mode === 'dry-run') {
    return {
      status: 'DRY_RUN_PASS',
      mode,
      taskId: ETSY_ALT_TEXT_TASK_ID,
      listingId: ETSY_ALT_TEXT_LISTING_ID,
      listingState: before.listing.state,
      baselineSha256,
      protectedIdentitySha256: identitySha256,
      plannedChanges: plan.changes.map(({ listingImageId, rank, to }) => ({ listingImageId, rank, altText: to })),
      forbiddenFields: ['title', 'description', 'tags', 'price', 'images', 'files', 'video', 'publishState'],
      ETSY_WRITE_COUNT: 0
    };
  }

  const expectedBaseline = assertApplyGrant(body, env, now);
  if (!safeEqual(expectedBaseline, baselineSha256)) throw new Error('PROTECTED_STATE_BASELINE_MISMATCH');

  let writeCount = 0;
  let current = before;
  try {
    for (const change of plan.changes) {
      const currentImages = orderedImages(current);
      const currentImage = currentImages[change.rank - 1];
      if (currentImage.listingImageId !== change.listingImageId) throw new Error('PROTECTED_IMAGE_IDENTITY_DRIFT');
      await writeAltText({
        accessToken,
        env,
        fetchImpl,
        image: currentImage,
        altText: change.to
      });
      writeCount += 1;
      current = await waitForTargetReadback({
        accessToken,
        env,
        fetchImpl,
        sleep,
        identitySha256,
        rank: change.rank,
        altText: change.to
      });
    }

    const afterPlan = baselinePlan(current);
    if (!afterPlan.final) throw new Error('FINAL_ALT_TEXT_READBACK_MISMATCH');
    if (identityFingerprint(current) !== identitySha256) throw new Error('FINAL_PROTECTED_IDENTITY_DRIFT');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    throw new EtsyAltTextOperationError(message, writeCount);
  }

  return {
    status: 'PASS',
    mode,
    taskId: ETSY_ALT_TEXT_TASK_ID,
    listingId: ETSY_ALT_TEXT_LISTING_ID,
    prewriteBaselineSha256: baselineSha256,
    postwriteSha256: snapshotFingerprint(current),
    protectedIdentitySha256: identitySha256,
    appliedRanks: plan.changes.map((change) => change.rank),
    ETSY_WRITE_COUNT: writeCount,
    publishPerformed: false
  };
}
