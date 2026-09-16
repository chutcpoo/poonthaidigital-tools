import crypto from 'node:crypto';
import { Resend } from 'resend';
import { STARTERS } from './_starter-config.js';
import { nurtureEmails } from './_email-content.js';
import { getDueNurture, markNurtureSent, requestBaseUrl } from './_lead-utils.js';

const SCHEDULER_KEY_SHA256 = '2145d423e99e073b4bdd9c0fd5619f2948e8591bacd38b6617bf9bf7ccc93262';

function authorized(req) {
  const authHeader = String(req.headers.authorization || '');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  const supplied = String(req.headers['x-pd-scheduler-key'] || (process.env.VERCEL_ENV === 'preview' ? req.query?.key || '' : ''));
  if (!supplied) return false;
  const actual = crypto.createHash('sha256').update(supplied).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(SCHEDULER_KEY_SHA256));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (!['GET','POST'].includes(req.method)) { res.setHeader('Allow','GET, POST'); return res.status(405).json({ ok:false }); }
  if (!authorized(req)) return res.status(401).json({ ok:false, error:'unauthorized' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ ok:false, error:'resend_unavailable' });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const due = await getDueNurture(25);
  let sent = 0;
  let failed = 0;
  const baseUrl = requestBaseUrl(req);

  for (const row of due) {
    const cfg = STARTERS[row.lead_magnet];
    if (!cfg) { failed += 1; continue; }
    const unsubscribeUrl = `${baseUrl}/unsubscribe/?email=${encodeURIComponent(row.email)}`;
    const message = nurtureEmails(cfg, unsubscribeUrl).find(item => item.key === row.message_type);
    if (!message) { failed += 1; continue; }
    try {
      const { data, error } = await resend.emails.send({
        from:'PoonthaiDigital <hello@poonthaidigital.com>',
        to:[row.email],
        subject:message.subject,
        html:message.html,
        text:message.text,
        tags:[{name:'funnel',value:message.key},{name:'starter',value:row.lead_magnet}]
      });
      if (error || !data?.id) { failed += 1; console.warn('nurture-send', row.id, error); continue; }
      await markNurtureSent(row.id, data.id);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.warn('nurture-send', row.id, error);
    }
  }

  console.log(JSON.stringify({ event:'nurture_processor', due:due.length, sent, failed, at:new Date().toISOString() }));
  return res.status(200).json({ ok:true, due:due.length, sent, failed });
}
