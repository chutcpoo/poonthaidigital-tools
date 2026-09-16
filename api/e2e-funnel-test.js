import leadHandler from './lead-capture.js';
import unsubscribeHandler from './unsubscribe.js';
import { enqueueNurture } from './_lead-utils.js';

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

  const deliveryReq = { method:'POST', headers:{ 'x-forwarded-host':host, 'x-forwarded-proto':'https' }, body:{ email:'delivered@resend.dev', leadMagnet:'coffee-checklist-starter', sourcePath:'/e2e/', marketingConsent:false, utm_source:'e2e', utm_medium:'server', utm_campaign:'lead-funnel-v1' } };
  const deliveryRes = mockResponse();
  await leadHandler(deliveryReq, deliveryRes);
  if (deliveryRes.result.statusCode !== 200 || !deliveryRes.result.body?.ok || !deliveryRes.result.body?.emailQueued) return res.status(500).json({ ok:false, phase:'delivery', delivery:deliveryRes.result });

  const queueEmail = `queue-e2e-${Date.now()}@example.invalid`;
  for (const [key,days] of [['day1',1],['day3',3],['day5',5],['day8',8]]) {
    await enqueueNurture(queueEmail, 'coffee-checklist-starter', key, new Date(Date.now()+days*86400000).toISOString());
  }
  const unsubReq = { method:'POST', headers:{}, body:{ email:queueEmail, source:'e2e_test' } };
  const unsubRes = mockResponse();
  await unsubscribeHandler(unsubReq, unsubRes);
  const ok = unsubRes.result.statusCode === 200 && unsubRes.result.body?.ok === true && unsubRes.result.body?.cancelled === 4;
  return res.status(ok ? 200 : 500).json({ ok, delivery:deliveryRes.result.body, queueUnsubscribe:unsubRes.result.body });
}
