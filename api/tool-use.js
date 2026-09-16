export default function handler(req, res) {
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

  console.log(JSON.stringify({ event:'tool_used', tool, sourcePath, at:new Date().toISOString() }));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(204).end();
}
