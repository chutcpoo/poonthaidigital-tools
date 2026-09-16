
const n = id => Number(document.getElementById(id)?.value || 0);
const fmt = v => new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(v);
const postSafeEvent = (url, payload) => {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch (_) {}
};
const trackVa = (name, data = {}) => {
  try {
    if (typeof window.va === 'function') window.va('event', { name, data });
  } catch (_) {}
  try {
    if (typeof window.gtag === 'function') {
      if (name === 'Tool Used' && data.tool) {
        window.gtag('event', 'tool_used', { tool_name: data.tool, page_path: window.location.pathname });
      }
      if (name === 'Etsy Click') {
        window.gtag('event', 'etsy_click', { product: data.product || 'shop', page_path: data.sourcePath || window.location.pathname });
      }
    }
  } catch (_) {}
  if (name === 'Tool Used' && data.tool) {
    postSafeEvent('/api/tool-use/', { tool: data.tool, sourcePath: window.location.pathname });
  }
};

function calcReorder(){
  trackVa('Tool Used', { tool: 'inventory_reorder' });
  const stock=n('stock'), use=n('dailyUse'), lead=n('leadDays'), safety=n('safety');
  const point=(use*lead)+safety;
  const cover=use>0?stock/use:0;
  const status=stock<=point
    ? "Current stock is at or below the estimated reorder point."
    : "Current stock is above the estimated reorder point.";
  document.getElementById('result').innerHTML =
    `<strong>Estimated reorder point: ${fmt(point)} units</strong><br>${status}`+
    (use>0?`<br>Approximate stock cover: ${fmt(cover)} days.`:"");
}
function calcBakery(){
  trackVa('Tool Used', { tool: 'bakery_capacity' });
  const available=n('availableMin'), batch=n('batchMin'), units=n('unitsBatch'), reserve=n('reserveMin');
  const usable=Math.max(0,available-reserve);
  const batches=batch>0?Math.floor(usable/batch):0;
  document.getElementById('result').innerHTML =
    `<strong>Estimated maximum: ${fmt(batches*units)} units</strong><br>${fmt(batches)} full batch(es) within ${fmt(usable)} usable minutes.`;
}
function calcBoba(){
  trackVa('Tool Used', { tool: 'boba_ingredient_usage' });
  const cups=n('cupsDay'), per=n('useCup'), days=Math.max(1,Math.min(7,n('openDays')||7));
  const unit=document.getElementById('ingredientUnit')?.value || 'ml';
  const daily=cups*per;
  document.getElementById('result').innerHTML =
    `<strong>Daily estimate: ${fmt(daily)} ${unit}</strong><br>Weekly estimate (${days} open days): ${fmt(daily*days)} ${unit}.`;
}

const etsyProductFromUrl = (url) => {
  if (url.includes('4561821192')) return 'inventory';
  if (url.includes('4566738686')) return 'bakery';
  if (url.includes('4560696421')) return 'boba';
  if (url.includes('4561819638')) return 'restaurant';
  return 'shop';
};

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href*="etsy.com"]');
  if (!link) return;
  const product = etsyProductFromUrl(link.href);
  const sourcePath = window.location.pathname;
  trackVa('Etsy Click', { product, sourcePath });
  const payload = JSON.stringify({
    product,
    sourcePath,
    target: link.href
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/etsy-click/', new Blob([payload], { type: 'application/json' }));
  } else {
    fetch('/api/etsy-click/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  }
});



document.addEventListener('change', (event) => {
  if (event.target.matches('.checkitem input[type="checkbox"]') && event.target.checked) {
    if (!window.__pdChecklistTracked) {
      window.__pdChecklistTracked = true;
      trackVa('Tool Used', { tool: 'restaurant_checklist' });
    }
  }
});
