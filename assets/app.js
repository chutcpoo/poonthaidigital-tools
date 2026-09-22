// Meta Pixel — PoonthaiDigital PageView + privacy-safe funnel tracking
window.pdNewMetaEventId = window.pdNewMetaEventId || ((name='Event') => {
  const random = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${String(name).replace(/[^A-Za-z0-9_-]/g,'').slice(0,24)}.${Date.now()}.${random}`.slice(0,120);
});
window.__pdPageViewEventId = window.__pdPageViewEventId || window.pdNewMetaEventId('PageView');

(function initMetaPixel(){
  if (window.__pdMetaPixelLoaded) return;
  window.__pdMetaPixelLoaded = true;
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '1416562443742691');
  fbq('track', 'PageView', {}, { eventID: window.__pdPageViewEventId });
})();

const n = id => Number(document.getElementById(id)?.value || 0);
const fmt = v => new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(v);
const money = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v);

// Preserve first-touch campaign attribution for the current browser session so
// internal navigation does not discard the source that brought the visitor in.
const pdQs = new URLSearchParams(window.location.search);
const pdCurrentAttribution = Object.fromEntries(Object.entries({
  utm_source: pdQs.get('utm_source'),
  utm_medium: pdQs.get('utm_medium'),
  utm_campaign: pdQs.get('utm_campaign'),
  utm_content: pdQs.get('utm_content')
}).filter(([,v]) => v));
let pdStoredAttribution = {};
try {
  pdStoredAttribution = JSON.parse(sessionStorage.getItem('pd_first_touch_attribution_v1') || '{}') || {};
  if (!Object.keys(pdStoredAttribution).length && Object.keys(pdCurrentAttribution).length) {
    pdStoredAttribution = { ...pdCurrentAttribution, landing_path: window.location.pathname };
    sessionStorage.setItem('pd_first_touch_attribution_v1', JSON.stringify(pdStoredAttribution));
  }
} catch (_) {
  pdStoredAttribution = {};
}
const pdAttributionClean = Object.keys(pdStoredAttribution).length ? pdStoredAttribution : pdCurrentAttribution;

// Send only non-sensitive funnel metadata to Meta. Never include email addresses
// or calculator inputs in Pixel or Conversions API events.
const postSafeEvent = (url, payload) => {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    else fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true }).catch(() => {});
  } catch (_) {}
};

const trackMeta = (name, data = {}, eventId = null) => {
  const id = eventId || window.pdNewMetaEventId(name);
  try {
    const safeData = Object.fromEntries(Object.entries({
      ...data,
      page_path: window.location.pathname,
      ...pdAttributionClean
    }).filter(([,v]) => v !== undefined && v !== null && v !== ''));
    if (typeof window.fbq === 'function') {
      if (name === 'Lead') window.fbq('track','Lead',safeData,{eventID:id});
      else window.fbq('trackCustom',name,safeData,{eventID:id});
    }
  } catch (_) {}
  return id;
};
window.pdTrackMeta = trackMeta;

window.pdSendMetaServerEvent = (eventName, eventId, data = {}) => {
  if (!eventName || !eventId) return;
  postSafeEvent('/api/meta-capi/', {
    event_name:eventName,
    event_id:eventId,
    sourcePath:window.location.pathname,
    ...pdAttributionClean,
    ...data
  });
};

if (window.__pdPageViewEventId) {
  window.pdSendMetaServerEvent('PageView', window.__pdPageViewEventId);
}

const trackVa = (name, data = {}) => {
  let metaEventId = null;
  try { if (typeof window.va === 'function') window.va('event', { name, data }); } catch (_) {}
  try {
    if (typeof window.gtag === 'function') {
      if (name === 'Tool Used' && data.tool) window.gtag('event','tool_used',{tool_name:data.tool,page_path:window.location.pathname,...pdAttributionClean});
      if (name === 'Etsy Click') window.gtag('event','etsy_click',{product:data.product || 'shop',page_path:data.sourcePath || window.location.pathname,...pdAttributionClean});
    }
  } catch (_) {}
  if (name === 'Tool Used' && data.tool) {
    metaEventId = trackMeta('ToolUsed',{tool:data.tool});
    postSafeEvent('/api/tool-use/', { event_id:metaEventId, tool:data.tool, sourcePath:window.location.pathname, ...pdAttributionClean });
  }
  if (name === 'Etsy Click') {
    metaEventId = trackMeta('EtsyClick',{product:data.product || 'shop',source_path:data.sourcePath || window.location.pathname});
  }
  return metaEventId;
};

function calcReorder(){
  trackVa('Tool Used',{tool:'inventory_reorder'});
  const stock=n('stock'), use=n('dailyUse'), lead=n('leadDays'), safety=n('safety');
  const point=(use*lead)+safety, cover=use>0?stock/use:0;
  const status=stock<=point?'Current stock is at or below the estimated reorder point.':'Current stock is above the estimated reorder point.';
  document.getElementById('result').innerHTML=`<strong>Estimated reorder point: ${fmt(point)} units</strong><br>${status}`+(use>0?`<br>Approximate stock cover: ${fmt(cover)} days.`:'');
}
function calcBakery(){
  trackVa('Tool Used',{tool:'bakery_capacity'});
  const available=n('availableMin'), batch=n('batchMin'), units=n('unitsBatch'), reserve=n('reserveMin');
  const usable=Math.max(0,available-reserve), batches=batch>0?Math.floor(usable/batch):0;
  document.getElementById('result').innerHTML=`<strong>Estimated maximum: ${fmt(batches*units)} units</strong><br>${fmt(batches)} full batch(es) within ${fmt(usable)} usable minutes.`;
}
function calcBoba(){
  trackVa('Tool Used',{tool:'boba_ingredient_usage'});
  const cups=n('cupsDay'), per=n('useCup'), days=Math.max(1,Math.min(7,n('openDays')||7));
  const unit=document.getElementById('ingredientUnit')?.value || 'ml', daily=cups*per;
  document.getElementById('result').innerHTML=`<strong>Daily estimate: ${fmt(daily)} ${unit}</strong><br>Weekly estimate (${days} open days): ${fmt(daily*days)} ${unit}.`;
}
function buildCoffeeChecklist(){
  trackVa('Tool Used',{tool:'coffee_checklist'});
  const shift=document.getElementById('coffeeShift')?.value || 'opening';
  const area=document.getElementById('coffeeArea')?.value || 'all';
  const tasks=[
    ['opening','bar','Check espresso/brewing equipment and required startup routine.'],['opening','bar','Restock cups, lids and frequently used bar supplies.'],['opening','front','Prepare front counter and customer-facing service area.'],['opening','cash','Complete the approved POS/register opening procedure.'],['opening','cleaning','Confirm key service surfaces and hand-wash areas are ready.'],
    ['closing','bar','Complete the approved equipment shutdown and cleaning routine.'],['closing','bar','Record low-stock or maintenance items for the next shift.'],['closing','front','Reset the customer-facing area for the next opening.'],['closing','cash','Complete the approved POS/register closing and handoff procedure.'],['closing','cleaning','Complete assigned end-of-shift cleaning and waste removal tasks.']
  ];
  const list=tasks.filter(([s,a])=>(shift==='both'||s===shift)&&(area==='all'||a===area));
  document.getElementById('result').innerHTML=`<strong>${list.length} starter task${list.length===1?'':'s'}</strong><div class="checklist">${list.map(([, ,text])=>`<div class="checkitem"><span>✓</span><span>${text}</span></div>`).join('')}</div>`;
}
function calcCleaningSchedule(){
  trackVa('Tool Used',{tool:'cleaning_schedule'});
  const daily=n('cleanDailyTasks'), days=Math.max(1,Math.min(7,n('cleanOpenDays')||7)), weekly=n('cleanWeeklyTasks'), monthly=n('cleanMonthlyTasks'), avg=n('cleanAvgMin'), staff=Math.max(1,n('cleanStaff')||1);
  const weeklyTasks=(daily*days)+weekly+(monthly/4.33), weeklyMin=weeklyTasks*avg, weeklyHours=weeklyMin/60;
  document.getElementById('result').innerHTML=`<strong>Estimated weekly cleaning workload: ${fmt(weeklyHours)} staff-hours</strong><br>About ${fmt(weeklyTasks)} task occurrences per week, or ${fmt(weeklyHours/staff)} hours per person if shared evenly across ${fmt(staff)} staff.`;
}
function calcPrivateChefJob(){
  trackVa('Tool Used',{tool:'private_chef_quote'});
  const guests=Math.max(1,n('chefGuests')||1), ingredients=n('chefIngredients'), laborHours=n('chefLaborHours'), laborRate=n('chefLaborRate'), other=n('chefOther'), overheadPct=n('chefOverheadPct'), markupPct=n('chefMarkupPct');
  const direct=ingredients+(laborHours*laborRate)+other, overhead=direct*(overheadPct/100), costBase=direct+overhead, quote=costBase*(1+markupPct/100);
  document.getElementById('result').innerHTML=`<strong>Estimated cost base: ${money(costBase)}</strong><br>Planning quote using your markup assumption: ${money(quote)}<br>Approximate quote per guest: ${money(quote/guests)}.`;
}
function calcWasteCost(){
  trackVa('Tool Used',{tool:'waste_cost'});
  const qty=n('wasteQty'), unitCost=n('wasteUnitCost'), days=Math.max(1,Math.min(7,n('wasteDaysWeek')||7)), weeks=Math.max(1,n('wasteWeeksMonth')||4.33);
  const daily=qty*unitCost, weekly=daily*days, monthly=weekly*weeks;
  document.getElementById('result').innerHTML=`<strong>Estimated daily waste cost: ${money(daily)}</strong><br>Weekly: ${money(weekly)}<br>Monthly estimate: ${money(monthly)}.`;
}


function calcInvoiceAging(){
  const dueValue=document.getElementById('agingDueDate')?.value || '';
  const asOfValue=document.getElementById('agingAsOf')?.value || '';
  const balanceRaw=document.getElementById('agingBalance')?.value ?? '';
  const result=document.getElementById('result');
  const parseYmd=(value)=>{
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if(!m) return null;
    return Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]));
  };
  const due=parseYmd(dueValue), asOf=parseYmd(asOfValue), balance=Number(balanceRaw);
  if(due===null || asOf===null || balanceRaw==='' || !Number.isFinite(balance) || balance<0){
    if(result) result.innerHTML='<strong>Please enter a valid due date, as-of date and non-negative remaining balance.</strong>';
    return;
  }
  if(balance===0){
    trackVa('Tool Used',{tool:'invoice_aging'});
    if(result) result.innerHTML='<strong>Status: Paid</strong><br>Remaining balance is $0.00, so there is no unpaid amount to age.';
    return;
  }
  if(asOf<due){
    const daysUntil=Math.ceil((due-asOf)/86400000);
    trackVa('Tool Used',{tool:'invoice_aging'});
    if(result) result.innerHTML=`<strong>Status: Current</strong><br>Remaining balance: ${money(balance)}<br>${daysUntil} day${daysUntil===1?'':'s'} until the due date.<br>Aging bucket: Current.`;
    return;
  }
  const days=Math.floor((asOf-due)/86400000);
  let bucket='Current', status=days===0?'Due today':'Current';
  if(days>=1 && days<=30){bucket='1–30 days';status='Overdue';}
  else if(days<=60 && days>=31){bucket='31–60 days';status='Overdue';}
  else if(days<=90 && days>=61){bucket='61–90 days';status='Overdue';}
  else if(days>90){bucket='90+ days';status='Overdue';}
  trackVa('Tool Used',{tool:'invoice_aging'});
  if(result) result.innerHTML=`<strong>Status: ${status}</strong><br>Remaining balance: ${money(balance)}<br>Days overdue: ${days}<br>Aging bucket: ${bucket}.`;
}

const etsyProductFromUrl = (url) => {
  if (url.includes('4578945050')) return 'PDT-IPT-001';
  return 'shop';
};

document.addEventListener('click', (event) => {
  const link=event.target.closest('a[href*="etsy.com"]'); if (!link) return;
  const product=etsyProductFromUrl(link.href), sourcePath=window.location.pathname;
  const metaEventId=trackVa('Etsy Click',{product,sourcePath});
  const payload=JSON.stringify({event_id:metaEventId,product,sourcePath,target:link.href,...pdAttributionClean});
  if (navigator.sendBeacon) navigator.sendBeacon('/api/etsy-click/',new Blob([payload],{type:'application/json'}));
  else fetch('/api/etsy-click/',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(()=>{});
});

document.addEventListener('change', (event) => {
  if (event.target.matches('.checkitem input[type="checkbox"]') && event.target.checked && !window.__pdChecklistTracked) {
    window.__pdChecklistTracked=true;
    trackVa('Tool Used',{tool:'restaurant_checklist'});
  }
});

const pdLeadRoutes=new Set([
  '/inventory-reorder-calculator/','/food-waste-cost-calculator/','/bakery-production-capacity-calculator/','/boba-shop-inventory-calculator/',
  '/restaurant-opening-closing-checklist/','/coffee-shop-opening-closing-checklist/','/cafe-cleaning-schedule-planner/','/private-chef-job-cost-calculator/',
  '/invoice-aging-calculator/','/free-resources/invoices/free-invoice-follow-up-starter-pack/'
]);
if(pdLeadRoutes.has(window.location.pathname)){
  const script=document.createElement('script');
  script.src='/assets/lead-funnel.js';
  script.defer=true;
  document.body.appendChild(script);
}
