import { sendMetaCapiEvent } from './_meta-capi.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  let payload = req.body || {};
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { payload = {}; }
  }

  const allowed = new Set([
    'inventory_reorder',
    'bakery_capacity',
    'boba_ingredient_usage',
    'restaurant_checklist',
    'coffee_checklist',
    'cleaning_schedule',
    'private_chef_quote',
    'waste_cost'
  ]);
  const tool = allowed.has(String(payload.tool)) ? String(payload.tool) : 'unknown';
  const sourcePath = String(payload.sourcePath || '/').slice(0, 160);
  const attribution = {
    utm_source: payload.utm_source ? String(payload.utm_source).slice(0,120) : null,
    utm_medium: payload.utm_medium ? String(payload.utm_medium).slice(0,120) : null,
    utm_campaign: payload.utm_campaign ? String(payload.utm_campaign).slice(0,160) : null,
    utm_content: payload.utm_content ? String(payload.utm_content).slice(0,160) : null
  };

  console.log(JSON.stringify({ event:'tool_used', tool, sourcePath, ...attribution, at:new Date().toISOString() }));

  const eventId = payload.event_id ? String(payload.event_id).slice(0,120) : null;
  if (eventId) {
    await sendMetaCapiEvent(req, {
      eventName:'ToolUsed',
      eventId,
      eventSourceUrl:`https://poonthaidigital.com${sourcePath.split('?')[0]}`,
      customData:{ tool, ...attribution }
    }).catch(() => {});
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(204).end();
}
