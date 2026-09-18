import { sendMetaCapiEvent } from './_meta-capi.js';

const ALLOWED_EVENTS = new Set([
  'PageView',
  'ToolUsed',
  'Lead',
  'MarketingOptIn',
  'StarterDownload',
  'EtsyClick'
]);

function allowedOrigin(req) {
  const origin = String(req.headers.origin || '').trim();
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    return host === 'poonthaidigital.com' || host === 'www.poonthaidigital.com' || host.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function cleanAttribution(body) {
  return {
    utm_source: body.utm_source ? String(body.utm_source).slice(0,120) : null,
    utm_medium: body.utm_medium ? String(body.utm_medium).slice(0,120) : null,
    utm_campaign: body.utm_campaign ? String(body.utm_campaign).slice(0,160) : null,
    utm_content: body.utm_content ? String(body.utm_content).slice(0,160) : null
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return res.status(403).json({ ok:false, error:'origin_not_allowed' });
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) return res.status(415).json({ ok:false, error:'content_type_not_allowed' });
  const contentLength = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > 8192) return res.status(413).json({ ok:false, error:'payload_too_large' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const eventName = String(body.event_name || '').slice(0,80);
  const eventId = String(body.event_id || '').slice(0,120);
  const sourcePath = String(body.sourcePath || '/').slice(0,180);
  if (!ALLOWED_EVENTS.has(eventName) || !eventId || !sourcePath.startsWith('/')) {
    return res.status(400).json({ ok:false, error:'invalid_event' });
  }

  const attribution = cleanAttribution(body);
  const eventSourceUrl = `https://poonthaidigital.com${sourcePath.split('?')[0]}`;
  const customData = {
    ...(body.content_name ? { content_name:String(body.content_name).slice(0,120) } : {}),
    ...(body.tool ? { tool:String(body.tool).slice(0,80) } : {}),
    ...(body.product ? { product:String(body.product).slice(0,80) } : {}),
    ...attribution
  };

  const result = await sendMetaCapiEvent(req, {
    eventName,
    eventId,
    eventSourceUrl,
    customData
  });

  if (result.disabled) return res.status(202).json({ ok:true, capi:false, reason:'not_configured' });
  if (!result.ok) return res.status(502).json({ ok:false, error:'meta_capi_failed' });
  return res.status(200).json({ ok:true, capi:true });
}
