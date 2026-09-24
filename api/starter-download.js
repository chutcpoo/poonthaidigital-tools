import { STARTERS } from './_starter-config.js';
import { neonInsert, verifyDownloadToken } from './_lead-utils.js';
import { buildStarterXlsx } from './_xlsx.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const token = Array.isArray(req.query?.token) ? req.query.token[0] : req.query?.token;
  const payload = verifyDownloadToken(token);
  const cfg = payload ? STARTERS[payload.s] : null;
  if (!payload || !cfg) return res.status(403).send('This download link is invalid or has expired.');

  try {
    const file = buildStarterXlsx(cfg);
    await neonInsert('lead_events', {
      email: null,
      lead_magnet: payload.s,
      event_name: 'starter_download',
      source_path: '/api/starter-download',
      metadata: { token_exp: payload.e, attribution_id: payload.a || null }
    }).catch(() => {});

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${cfg.filename.replace(/[^A-Za-z0-9._-]/g, '_')}"`);
    res.setHeader('Content-Length', String(file.length));
    return res.status(200).send(file);
  } catch (error) {
    console.error('starter-download', error);
    return res.status(500).send('The starter could not be generated. Please request a fresh link.');
  }
}
