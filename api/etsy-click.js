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

  console.log(JSON.stringify({
    event: 'etsy_outbound_click',
    product,
    sourcePath,
    target,
    at: new Date().toISOString()
  }));

  res.setHeader('Cache-Control', 'no-store');
  return res.status(204).end();
}
