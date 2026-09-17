export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  let payload = req.body || {};
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { payload = {}; }
  }

  const product = String(payload.product || 'unknown').slice(0, 40);
  const sourcePath = String(payload.sourcePath || '/').slice(0, 160);
  const target = String(payload.target || '').slice(0, 220);
  const attribution = {
    utm_source: payload.utm_source ? String(payload.utm_source).slice(0,120) : null,
    utm_medium: payload.utm_medium ? String(payload.utm_medium).slice(0,120) : null,
    utm_campaign: payload.utm_campaign ? String(payload.utm_campaign).slice(0,160) : null,
    utm_content: payload.utm_content ? String(payload.utm_content).slice(0,160) : null
  };

  console.log(JSON.stringify({
    event: 'etsy_outbound_click',
    product,
    sourcePath,
    target,
    ...attribution,
    at: new Date().toISOString()
  }));

  res.setHeader('Cache-Control', 'no-store');
  return res.status(204).end();
}
