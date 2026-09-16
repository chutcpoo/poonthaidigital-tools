import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

let sqlClient;

function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing');
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

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
  const payload = { s: slug, e: Math.floor(Date.now() / 1000) + ttlSeconds, n: crypto.randomBytes(10).toString('hex') };
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

export async function neonInsert(table, payload) {
  const sql = db();
  if (table === 'leads') {
    await sql`INSERT INTO leads (email, lead_magnet, source_path, marketing_consent, privacy_version, utm_source, utm_medium, utm_campaign, status)
      VALUES (${payload.email}, ${payload.lead_magnet}, ${payload.source_path}, ${Boolean(payload.marketing_consent)}, ${payload.privacy_version || '2026-09-16'}, ${payload.utm_source || null}, ${payload.utm_medium || null}, ${payload.utm_campaign || null}, 'active')
      ON CONFLICT (email, lead_magnet) DO UPDATE SET
        source_path = EXCLUDED.source_path,
        marketing_consent = leads.marketing_consent OR EXCLUDED.marketing_consent,
        privacy_version = EXCLUDED.privacy_version,
        utm_source = COALESCE(EXCLUDED.utm_source, leads.utm_source),
        utm_medium = COALESCE(EXCLUDED.utm_medium, leads.utm_medium),
        utm_campaign = COALESCE(EXCLUDED.utm_campaign, leads.utm_campaign),
        status = 'active'`;
  } else if (table === 'lead_events') {
    await sql`INSERT INTO lead_events (email, lead_magnet, event_name, source_path, metadata)
      VALUES (${payload.email || null}, ${payload.lead_magnet || null}, ${payload.event_name}, ${payload.source_path || null}, ${JSON.stringify(payload.metadata || {})}::jsonb)`;
  } else if (table === 'marketing_consents') {
    await sql`INSERT INTO marketing_consents (email, lead_magnet, source_path, privacy_version)
      VALUES (${payload.email}, ${payload.lead_magnet}, ${payload.source_path || null}, ${payload.privacy_version || '2026-09-16'})`;
  } else if (table === 'unsubscribes') {
    await sql`INSERT INTO unsubscribes (email, source) VALUES (${payload.email}, ${payload.source || 'website'})
      ON CONFLICT (email) DO UPDATE SET source = EXCLUDED.source, unsubscribed_at = now()`;
  } else {
    throw new Error(`unsupported_table_${table}`);
  }
  return { ok: true, status: 201 };
}
