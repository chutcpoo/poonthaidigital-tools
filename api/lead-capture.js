import { Resend } from 'resend';
import { STARTERS } from './_starter-config.js';
import { deliveryEmail, nurtureEmails } from './_email-content.js';
import { abuseIpHash, checkLeadRateLimit, enqueueNurture, isUnsubscribed, makeDownloadToken, neonInsert, parseBody, requestBaseUrl, validEmail } from './_lead-utils.js';

function allowedOrigin(req) {
  const origin = String(req.headers.origin || '').trim();
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    return host === 'poonthaidigital.com' || host === 'www.poonthaidigital.com' || host.endsWith('.vercel.app');
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok:false, error:'method_not_allowed' }); }
  if (!allowedOrigin(req)) return res.status(403).json({ ok:false, error:'origin_not_allowed' });
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) return res.status(415).json({ ok:false, error:'content_type_not_allowed' });
  const contentLength = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > 8192) return res.status(413).json({ ok:false, error:'payload_too_large' });
  const fetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (fetchSite && fetchSite !== 'same-origin') return res.status(403).json({ ok:false, error:'cross_site_not_allowed' });

  const body = parseBody(req);
  if (String(body.website || '').trim()) return res.status(200).json({ ok:true });
  const email = validEmail(body.email);
  const slug = String(body.leadMagnet || '').slice(0,80);
  const cfg = STARTERS[slug];
  if (!email || !cfg) return res.status(400).json({ ok:false, error:'invalid_request' });

  const marketingConsent = body.marketingConsent === true;
  const sourcePath = String(body.sourcePath || '/').slice(0,160);
  const attribution = { utm_source:body.utm_source ? String(body.utm_source).slice(0,120) : null, utm_medium:body.utm_medium ? String(body.utm_medium).slice(0,120) : null, utm_campaign:body.utm_campaign ? String(body.utm_campaign).slice(0,160) : null, utm_content:body.utm_content ? String(body.utm_content).slice(0,160) : null };
  const lead = { email, lead_magnet:slug, source_path:sourcePath, marketing_consent:marketingConsent, privacy_version:'2026-09-16', utm_source:attribution.utm_source, utm_medium:attribution.utm_medium, utm_campaign:attribution.utm_campaign };
  const ipHash = abuseIpHash(req);

  try {
    const rate = await checkLeadRateLimit(email, ipHash);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSeconds));
      console.warn(JSON.stringify({ event:'lead_rate_limited', leadMagnet:slug, counts:rate.counts, at:new Date().toISOString() }));
      return res.status(429).json({ ok:false, error:'too_many_requests' });
    }

    await neonInsert('leads', lead);
    await neonInsert('lead_events', { email, lead_magnet:slug, event_name:'lead_captured', source_path:sourcePath, metadata:{ marketing_consent:marketingConsent, ...attribution, ...(ipHash ? { abuse_ip_hash:ipHash } : {}) } }).catch(()=>{});
    if (marketingConsent) await neonInsert('marketing_consents', { email, lead_magnet:slug, source_path:sourcePath, privacy_version:'2026-09-16' }).catch(()=>{});

    const token = makeDownloadToken(slug);
    const baseUrl = requestBaseUrl(req);
    const downloadUrl = `${baseUrl}/api/starter-download?token=${encodeURIComponent(token)}`;
    const unsubscribeUrl = `${baseUrl}/unsubscribe/?email=${encodeURIComponent(email)}`;
    let emailQueued = false;
    let emailError = null;
    let nurtureQueued = 0;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const delivery = deliveryEmail(cfg, downloadUrl);
      const { data, error } = await resend.emails.send({ from:'PoonthaiDigital <hello@poonthaidigital.com>', to:[email], subject:delivery.subject, html:delivery.html, text:delivery.text, tags:[{name:'funnel',value:'starter_delivery'},{name:'starter',value:slug}] });
      if (error) emailError = error.message || 'delivery_failed';
      else emailQueued = Boolean(data?.id);
    }

    if (marketingConsent && !(await isUnsubscribed(email))) {
      for (const message of nurtureEmails(cfg, unsubscribeUrl)) {
        const sendAt = new Date(Date.now() + message.delayDays * 86400000).toISOString();
        await enqueueNurture(email, slug, message.key, sendAt);
        nurtureQueued += 1;
      }
    }

    console.log(JSON.stringify({ event:'lead_captured_server', leadMagnet:slug, sourcePath, marketingConsent, emailQueued, nurtureQueued, ...attribution, at:new Date().toISOString() }));
    return res.status(200).json({ ok:true, downloadUrl, expiresInSeconds:172800, emailQueued, emailError, nurtureQueued });
  } catch (error) {
    console.error('lead-capture', error);
    return res.status(503).json({ ok:false, error:'lead_capture_unavailable' });
  }
}
