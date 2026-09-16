const n = id => Number(document.getElementById(id)?.value || 0);
const fmt = v => new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(v);
const money = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v);
const postSafeEvent = (url, payload) => {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    else fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true }).catch(() => {});
  } catch (_) {}
};
const trackVa = (name, data = {}) => {
  try { if (typeof window.va === 'function') window.va('event', { name, data }); } catch (_) {}
  try {
    if (typeof window.gtag === 'function') {
      if (name === 'Tool Used' && data.tool) window.gtag('event','tool_used',{tool_name:data.tool,page_path:window.location.pathname});
      if (name === 'Etsy Click') window.gtag('event','etsy_click',{product:data.product || 'shop',page_path:data.sourcePath || window.location.pathname});
    }
  } catch (_) {}
  if (name === 'Tool Used' && data.tool) postSafeEvent('/api/tool-use/', { tool:data.tool, sourcePath:window.location.pathname });
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

const etsyProductFromUrl = (url) => {
  if (url.includes('4561821192')) return 'inventory';
  if (url.includes('4566738686')) return 'bakery';
  if (url.includes('4560696421')) return 'boba';
  if (url.includes('4561819638')) return 'restaurant';
  if (url.includes('4561793463')) return 'coffee';
  if (url.includes('4561795303')) return 'cleaning';
  if (url.includes('4569445414')) return 'private_chef';
  return 'shop';
};

document.addEventListener('click', (event) => {
  const link=event.target.closest('a[href*="etsy.com"]'); if (!link) return;
  const product=etsyProductFromUrl(link.href), sourcePath=window.location.pathname;
  trackVa('Etsy Click',{product,sourcePath});
  const payload=JSON.stringify({product,sourcePath,target:link.href});
  if (navigator.sendBeacon) navigator.sendBeacon('/api/etsy-click/',new Blob([payload],{type:'application/json'}));
  else fetch('/api/etsy-click/',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(()=>{});
});

document.addEventListener('change', (event) => {
  if (event.target.matches('.checkitem input[type="checkbox"]') && event.target.checked && !window.__pdChecklistTracked) {
    window.__pdChecklistTracked=true;
    trackVa('Tool Used',{tool:'restaurant_checklist'});
  }
});
