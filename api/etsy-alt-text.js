import { endpointAuthorized, executeAltTextOperation } from './_etsy-alt-text.js';

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

function reply(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return reply(res, 405, { status: 'BLOCKED', error: 'METHOD_NOT_ALLOWED', ETSY_WRITE_COUNT: 0 });
  }

  if (!endpointAuthorized(req.headers, process.env)) {
    return reply(res, 401, { status: 'BLOCKED', error: 'UNAUTHORIZED', ETSY_WRITE_COUNT: 0 });
  }

  const body = req.method === 'POST' ? parseBody(req) : {};
  const mode = req.method === 'GET' ? 'dry-run' : String(body.mode || 'dry-run');

  try {
    const result = await executeAltTextOperation({ mode, body });
    return reply(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    const status = message === 'MODE_NOT_ALLOWED' || message.includes('MISMATCH') || message.includes('INVALID')
      ? 409
      : 503;
    return reply(res, status, {
      status: 'BLOCKED',
      mode,
      error: message,
      ETSY_WRITE_COUNT: Number(error?.etsyWriteCount) || 0
    });
  }
}
