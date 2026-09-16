
const n = id => Number(document.getElementById(id)?.value || 0);
const fmt = v => new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(v);

function calcReorder(){
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
  const available=n('availableMin'), batch=n('batchMin'), units=n('unitsBatch'), reserve=n('reserveMin');
  const usable=Math.max(0,available-reserve);
  const batches=batch>0?Math.floor(usable/batch):0;
  document.getElementById('result').innerHTML =
    `<strong>Estimated maximum: ${fmt(batches*units)} units</strong><br>${fmt(batches)} full batch(es) within ${fmt(usable)} usable minutes.`;
}
function calcBoba(){
  const cups=n('cupsDay'), per=n('useCup'), days=Math.max(1,Math.min(7,n('openDays')||7));
  const unit=document.getElementById('ingredientUnit')?.value || 'ml';
  const daily=cups*per;
  document.getElementById('result').innerHTML =
    `<strong>Daily estimate: ${fmt(daily)} ${unit}</strong><br>Weekly estimate (${days} open days): ${fmt(daily*days)} ${unit}.`;
}
