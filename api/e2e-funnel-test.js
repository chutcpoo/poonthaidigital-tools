import leadHandler from './lead-capture.js';
import unsubscribeHandler from './unsubscribe.js';

function mockResponse() {
  const result = { statusCode: 200, body: null, headers: {} };
  return {
    result,
    setHeader(name, value) { result.headers[name] = value; },
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return body; }
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (process.env.VERCEL_ENV !== 'preview') return res.status(404).json({ ok:false });
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const email = 'delivered@resend.dev';
  const leadReq = {
    method:'POST',
    headers:{ 'x-forwarded-host':host, 'x-forwarded-proto':'https' },
    body:{ email, leadMagnet:'coffee-checklist-starter', sourcePath:'/e2e/', marketingConsent:true, utm_source:'e2e', utm_medium:'server', utm_campaign:'lead-funnel-v1' }
  };
  const leadRes = mockResponse();
  await leadHandler(leadReq, leadRes);
  if (leadRes.result.statusCode !== 200 || !leadRes.result.body?.ok) return res.status(500).json({ ok:false, phase:'lead', lead:leadRes.result });

  const unsubReq = { method:'POST', headers:{}, body:{ email, source:'e2e_test' } };
  const unsubRes = mockResponse();
  await unsubscribeHandler(unsubReq, unsubRes);
  const body = { ok: unsubRes.result.statusCode === 200 && unsubRes.result.body?.ok === true, lead: leadRes.result.body, unsubscribe: unsubRes.result.body };
  return res.status(body.ok ? 200 : 500).json(body);
}
