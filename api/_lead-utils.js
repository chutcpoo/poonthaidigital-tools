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

function requestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.headers['x-real-ip'] || '').trim() || null;
}

export function abuseIpHash(req) {
  const ip = requestIp(req);
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!ip || !secret) return null;
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHmac('sha256', secret).update(`abuse-ip:v1|${day}|${ip}`).digest('base64url');
}

export async function checkLeadRateLimit(email, ipHash) {
  const sql = db();
  let rows;

  if (ipHash) {
    rows = await sql`SELECT
      count(*) FILTER (WHERE email=${email} AND occurred_at > now() - interval '1 hour')::int AS email_hour,
      count(*) FILTER (WHERE email=${email} AND occurred_at > now() - interval '24 hours')::int AS email_day,
      count(*) FILTER (WHERE metadata->>'abuse_ip_hash'=${ipHash}::text AND occurred_at > now() - interval '1 hour')::int AS ip_hour,
      count(*) FILTER (WHERE metadata->>'abuse_ip_hash'=${ipHash}::text AND occurred_at > now() - interval '24 hours')::int AS ip_day
      FROM lead_events
      WHERE event_name='lead_captured'
        AND occurred_at > now() - interval '24 hours'
        AND (email=${email} OR metadata->>'abuse_ip_hash'=${ipHash}::text)`;
  } else {
    rows = await sql`SELECT
      count(*) FILTER (WHERE occurred_at > now() - interval '1 hour')::int AS email_hour,
      count(*)::int AS email_day,
      0::int AS ip_hour,
      0::int AS ip_day
      FROM lead_events
      WHERE event_name='lead_captured'
        AND occurred_at > now() - interval '24 hours'
        AND email=${email}`;
  }

  const counts = rows[0] || {};
  const limited = Number(counts.email_hour || 0) >= 5
    || Number(counts.email_day || 0) >= 12
    || Number(counts.ip_hour || 0) >= 15
    || Number(counts.ip_day || 0) >= 50;
  return { limited, retryAfterSeconds: limited ? 3600 : 0, counts };
}

export function makeDownloadToken(slug, attributionId = null, ttlSeconds = 60 * 60 * 48) {
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) throw new Error('DOWNLOAD_SIGNING_SECRET missing');
  const payload = { s: slug, e: Math.floor(Date.now() / 1000) + ttlSeconds, n: crypto.randomBytes(10).toString('hex'), ...(attributionId ? { a: String(attributionId).slice(0, 120) } : {}) };
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
      ON CONFLICT (email, lead_magnet) DO UPDATE SET source_path=EXCLUDED.source_path, marketing_consent=leads.marketing_consent OR EXCLUDED.marketing_consent, privacy_version=EXCLUDED.privacy_version, utm_source=COALESCE(EXCLUDED.utm_source,leads.utm_source), utm_medium=COALESCE(EXCLUDED.utm_medium,leads.utm_medium), utm_campaign=COALESCE(EXCLUDED.utm_campaign,leads.utm_campaign), status='active'`;
  } else if (table === 'lead_events') {
    await sql`INSERT INTO lead_events (email, lead_magnet, event_name, source_path, metadata) VALUES (${payload.email || null}, ${payload.lead_magnet || null}, ${payload.event_name}, ${payload.source_path || null}, ${JSON.stringify(payload.metadata || {})}::jsonb)`;
  } else if (table === 'marketing_consents') {
    await sql`INSERT INTO marketing_consents (email, lead_magnet, source_path, privacy_version) VALUES (${payload.email}, ${payload.lead_magnet}, ${payload.source_path || null}, ${payload.privacy_version || '2026-09-16'})`;
  } else if (table === 'unsubscribes') {
    await sql`INSERT INTO unsubscribes (email, source) VALUES (${payload.email}, ${payload.source || 'website'}) ON CONFLICT (email) DO UPDATE SET source=EXCLUDED.source, unsubscribed_at=now()`;
  } else throw new Error(`unsupported_table_${table}`);
  return { ok: true, status: 201 };
}

export async function isUnsubscribed(email) {
  const sql = db();
  const rows = await sql`SELECT 1 FROM unsubscribes WHERE email=${email} LIMIT 1`;
  return rows.length > 0;
}

export async function enqueueNurture(email, leadMagnet, messageType, sendAt) {
  const sql = db();
  await sql`INSERT INTO nurture_queue (email, lead_magnet, message_type, send_at, status) VALUES (${email}, ${leadMagnet}, ${messageType}, ${sendAt}, 'pending') ON CONFLICT (email, lead_magnet, message_type) DO NOTHING`;
}

export async function getDueNurture(limit = 25) {
  const sql = db();
  return sql`SELECT q.id, q.email, q.lead_magnet, q.message_type, q.send_at FROM nurture_queue q LEFT JOIN unsubscribes u ON u.email=q.email WHERE q.status='pending' AND q.send_at<=now() AND u.email IS NULL ORDER BY q.send_at ASC LIMIT ${limit}`;
}

export async function markNurtureSent(id, resendEmailId) {
  const sql = db();
  await sql`UPDATE nurture_queue SET status='sent', resend_email_id=${resendEmailId || null}, processed_at=now() WHERE id=${id}`;
}

export async function markNurtureFailed(id) {
  const sql = db();
  await sql`UPDATE nurture_queue SET status='failed', processed_at=now() WHERE id=${id}`;
}

export async function cancelPendingNurture(email) {
  const sql = db();
  const rows = await sql`UPDATE nurture_queue SET status='cancelled', processed_at=now() WHERE email=${email} AND status='pending' RETURNING id`;
  return rows.length;
}
