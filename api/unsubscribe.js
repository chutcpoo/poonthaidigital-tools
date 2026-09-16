import { cancelPendingNurture, neonInsert, parseBody, validEmail } from './_lead-utils.js';

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
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ ok:false, error:'method_not_allowed' }); }
  if (!allowedOrigin(req)) return res.status(403).json({ ok:false, error:'origin_not_allowed' });
  const body = parseBody(req);
  if (String(body.website || '').trim()) return res.status(200).json({ ok:true });
  const email = validEmail(body.email);
  if (!email) return res.status(400).json({ ok:false, error:'invalid_email' });

  try {
    await neonInsert('unsubscribes', { email, source:String(body.source || 'website').slice(0,80) });
    const cancelled = await cancelPendingNurture(email);
    await neonInsert('lead_events', { email, lead_magnet:null, event_name:'unsubscribed', source_path:'/unsubscribe/', metadata:{ cancelled_pending_emails:cancelled } }).catch(()=>{});
    return res.status(200).json({ ok:true, cancelled });
  } catch (error) {
    console.error('unsubscribe', error);
    return res.status(503).json({ ok:false, error:'unsubscribe_unavailable' });
  }
}
