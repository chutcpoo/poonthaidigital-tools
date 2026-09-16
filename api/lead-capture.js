import { Resend } from 'resend';
import { STARTERS } from './_starter-config.js';
import { makeDownloadToken, neonInsert, parseBody, requestBaseUrl, validEmail } from './_lead-utils.js';

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname;
    return host === 'poonthaidigital.com' || host === 'www.poonthaidigital.com' || host.endsWith('.vercel.app');
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return res.status(403).json({ ok: false, error: 'origin_not_allowed' });

  const body = parseBody(req);
  if (String(body.website || '').trim()) return res.status(200).json({ ok: true });

  const email = validEmail(body.email);
  const slug = String(body.leadMagnet || '').slice(0, 80);
  const cfg = STARTERS[slug];
  if (!email || !cfg) return res.status(400).json({ ok: false, error: 'invalid_request' });

  const marketingConsent = body.marketingConsent === true;
  const sourcePath = String(body.sourcePath || '/').slice(0, 160);
  const lead = {
    email,
    lead_magnet: slug,
    source_path: sourcePath,
    marketing_consent: marketingConsent,
    privacy_version: '2026-09-16',
    utm_source: body.utm_source ? String(body.utm_source).slice(0, 120) : null,
    utm_medium: body.utm_medium ? String(body.utm_medium).slice(0, 120) : null,
    utm_campaign: body.utm_campaign ? String(body.utm_campaign).slice(0, 160) : null
  };

  try {
    const leadResponse = await neonInsert('leads', lead, '?on_conflict=email,lead_magnet');
    if (!(leadResponse.ok || leadResponse.status === 409)) throw new Error(`lead_insert_${leadResponse.status}`);
    await neonInsert('lead_events', { email, lead_magnet: slug, event_name: 'lead_captured', source_path: sourcePath, metadata: { marketing_consent: marketingConsent } }).catch(() => {});
    if (marketingConsent) {
      await neonInsert('marketing_consents', { email, lead_magnet: slug, source_path: sourcePath, privacy_version: '2026-09-16' }).catch(() => {});
    }

    const token = makeDownloadToken(slug);
    const downloadUrl = `${requestBaseUrl(req)}/api/starter-download?token=${encodeURIComponent(token)}`;
    let emailQueued = false;
    let emailError = null;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.events.send({
        event: 'starter.requested',
        email,
        payload: {
          starter_name: cfg.starterName,
          download_url: downloadUrl,
          paid_name: cfg.paidName,
          etsy_url: cfg.etsyUrl,
          free_scope: cfg.freeScope,
          advanced_1: cfg.advanced1,
          advanced_2: cfg.advanced2,
          marketing_consent: marketingConsent
        }
      });
      if (error) emailError = error.message || 'resend_event_failed';
      else emailQueued = true;
    }

    console.log(JSON.stringify({ event: 'lead_captured_server', leadMagnet: slug, sourcePath, marketingConsent, emailQueued, at: new Date().toISOString() }));
    return res.status(200).json({ ok: true, downloadUrl, expiresInSeconds: 172800, emailQueued, emailError });
  } catch (error) {
    console.error('lead-capture', error);
    return res.status(503).json({ ok: false, error: 'lead_capture_unavailable' });
  }
}
