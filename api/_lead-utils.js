import crypto from 'node:crypto';

export const NEON_REST = 'https://ep-old-leaf-b4ujw9wc.apirest.c-6.us-east-2.aws.neon.tech/neondb/rest/v1';

export function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

export function validEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function makeDownloadToken(slug, ttlSeconds = 60 * 60 * 48) {
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) throw new Error('DOWNLOAD_SIGNING_SECRET missing');
  const payload = {
    s: slug,
    e: Math.floor(Date.now() / 1000) + ttlSeconds,
    n: crypto.randomBytes(10).toString('hex')
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyDownloadToken(token) {
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret || !token || !String(token).includes('.')) return null;
  const [body, sig] = String(token).split('.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  let actual;
  try { actual = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
  if (!payload?.s || !payload?.e || Number(payload.e) < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function requestBaseUrl(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'poonthaidigital.com').split(',')[0].trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return `${proto}://${host}`;
}

export async function neonInsert(table, payload, extra = '') {
  return fetch(`${NEON_REST}/${table}${extra}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(payload)
  });
}
