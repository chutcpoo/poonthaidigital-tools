const META_PIXEL_ID = process.env.META_PIXEL_ID || '1416562443742691';
const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v24.0';

function requestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.headers['x-real-ip'] || '').trim() || null;
}

function cookieValue(req, name) {
  const raw = String(req.headers.cookie || '');
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('=') || '');
  }
  return null;
}

function cleanCustomData(data = {}) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) =>
    value !== undefined && value !== null && value !== ''
  ));
}

export async function sendMetaCapiEvent(req, {
  eventName,
  eventId,
  eventSourceUrl,
  customData = {}
}) {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!accessToken) return { ok:false, disabled:true, reason:'missing_access_token' };
  if (!eventName || !eventId || !eventSourceUrl) {
    return { ok:false, disabled:false, reason:'invalid_event' };
  }

  const userData = cleanCustomData({
    client_ip_address: requestIp(req),
    client_user_agent: String(req.headers['user-agent'] || '').slice(0, 512) || null,
    fbp: cookieValue(req, '_fbp'),
    fbc: cookieValue(req, '_fbc')
  });

  const payload = {
    data: [{
      event_name: String(eventName).slice(0, 80),
      event_time: Math.floor(Date.now() / 1000),
      event_id: String(eventId).slice(0, 120),
      action_source: 'website',
      event_source_url: String(eventSourceUrl).slice(0, 500),
      user_data: userData,
      custom_data: cleanCustomData(customData)
    }],
    access_token: accessToken
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('meta-capi', JSON.stringify({
        eventName,
        status: response.status,
        error: body?.error?.message || 'request_failed'
      }));
      return { ok:false, disabled:false, status:response.status };
    }
    console.log(JSON.stringify({
      event:'meta_capi_sent',
      eventName,
      eventId:String(eventId).slice(0,120),
      eventsReceived:body.events_received ?? null,
      at:new Date().toISOString()
    }));
    return { ok:true, disabled:false, status:response.status, eventsReceived:body.events_received ?? null };
  } catch (error) {
    console.error('meta-capi', JSON.stringify({
      eventName,
      error:error?.name || 'network_error'
    }));
    return { ok:false, disabled:false, reason:error?.name || 'network_error' };
  } finally {
    clearTimeout(timeout);
  }
}
