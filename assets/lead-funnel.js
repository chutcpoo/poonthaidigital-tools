(() => {
  const API='https://ep-old-leaf-b4ujw9wc.apirest.c-6.us-east-2.aws.neon.tech/neondb/rest/v1';
  const MAP={
    '/inventory-reorder-calculator/':{slug:'inventory-reorder-starter',title:'Free Inventory Reorder Starter',kind:'inventory',etsy:'https://poonthaidigital.etsy.com/listing/4561821192',paid:'Inventory & Waste Tracker',why:'Upgrade when stock, waste, suppliers and reorder decisions need to live together with a repeatable weekly review.'},
    '/food-waste-cost-calculator/':{slug:'food-waste-cost-starter',title:'Free Food Waste Cost Starter',kind:'waste',etsy:'https://poonthaidigital.etsy.com/listing/4561821192',paid:'Inventory & Waste Tracker',why:'Upgrade when waste decisions need to connect to stock levels, suppliers, reorders and recurring management review.'},
    '/bakery-production-capacity-calculator/':{slug:'bakery-capacity-starter',title:'Free Bakery Capacity Starter',kind:'bakery',etsy:'https://poonthaidigital.etsy.com/listing/4566738686',paid:'Home Bakery Operations Toolkit',why:'Upgrade when orders, production, ingredient needs and pickup or delivery need to stay coordinated in one repeatable workflow.'},
    '/boba-shop-inventory-calculator/':{slug:'boba-operations-starter',title:'Free Boba Daily Operations Starter',kind:'boba',etsy:'https://poonthaidigital.etsy.com/listing/4560696421',paid:'Boba Shop Operations Toolkit',why:'Upgrade when opening, closing, prep, cleaning, stock/waste and cash handoff need separate structured logs for a team.'},
    '/restaurant-opening-closing-checklist/':{slug:'restaurant-operations-starter',title:'Free Restaurant Daily Operations Starter',kind:'restaurant',etsy:'https://poonthaidigital.etsy.com/listing/4561819638',paid:'Restaurant Daily Operations Checklist',why:'Upgrade when opening, pre-service, closing, prep/temperature, cleaning and handoff need connected verification and corrective follow-up.'},
    '/coffee-shop-opening-closing-checklist/':{slug:'coffee-checklist-starter',title:'Free Coffee Shop Opening & Closing Starter',kind:'coffee',etsy:'https://poonthaidigital.etsy.com/listing/4561793463',paid:'Coffee Shop Opening & Closing Checklist',why:'Upgrade when opening/closing must connect to brew & prep, cleaning, stock/waste and cash handoff across multiple staff.'},
    '/cafe-cleaning-schedule-planner/':{slug:'cleaning-schedule-starter',title:'Free Cafe Cleaning Schedule Starter',kind:'cleaning',etsy:'https://poonthaidigital.etsy.com/listing/4561795303',paid:'Cafe Cleaning Checklist & Schedule',why:'Upgrade when daily, weekly and monthly cleaning need assignment, verification, corrective follow-up and reusable printable formats.'},
    '/private-chef-job-cost-calculator/':{slug:'private-chef-cost-starter',title:'Free Private Chef Service Starter',kind:'chef',etsy:'https://poonthaidigital.etsy.com/listing/4569445414',paid:'Private Chef Client-to-Service Operations System',why:'For a simple one-off service, Steps 1–10 may be enough. Upgrade for Step 11 Follow-up & Rebooking when repeat clients matter, and Step 12 Dashboard & Next Actions when several services, blockers, balances and next actions must be prioritized.'}
  };
  const cfg=MAP[location.pathname]; if(!cfg) return;
  const css=document.createElement('link'); css.rel='stylesheet'; css.href='/assets/lead-funnel.css'; document.head.appendChild(css);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const qs=new URLSearchParams(location.search);
  const utm={utm_source:qs.get('utm_source'),utm_medium:qs.get('utm_medium'),utm_campaign:qs.get('utm_campaign')};
  const post=async(table,payload,extra='')=>fetch(`${API}/${table}${extra}`,{method:'POST',headers:{'Content-Type':'application/json','Prefer':'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(payload)});
  const ga=(name,params={})=>{try{if(typeof gtag==='function')gtag('event',name,{lead_magnet:cfg.slug,page_path:location.pathname,...params});}catch(_){}};
  const event=(name,email=null,meta={})=>{post('lead_events',{email,lead_magnet:cfg.slug,event_name:name,source_path:location.pathname,metadata:meta}).catch(()=>{});ga(name);};

  const taskSets={
    boba:['Opening readiness check','Equipment check','Prep priority list','Ingredient par check','Cleaning check','Stock note','Waste note','Cash handoff note','Closing check','Next-shift handoff note'],
    restaurant:['Opening facility check','Opening equipment check','Pre-service readiness','Prep check','Temperature note','Cleaning check','Service issue note','Closing check','Manager verification','Shift handoff'],
    coffee:['Unlock/facility check','Espresso machine readiness','Brew setup','Prep priority','Cleaning readiness','Stock spot-check','Cash/POS readiness','Opening sign-off','Closing reset','Shift handoff'],
    cleaning:['List cleaning tasks','Choose daily/weekly/monthly frequency','Assign owner','Set due day','Mark complete','Add verification','Record issue','Record corrective action','Review weekly misses','Adjust next cycle']
  };
  const rows=()=>{
    if(cfg.kind==='inventory') return [['Item','Current Qty','Avg Daily Use','Lead Time (days)','Safety Stock','Reorder Point','Status'],...Array.from({length:10},(_,i)=>[`Item ${i+1}`,'','','','','',''])];
    if(cfg.kind==='waste') return [['Date','Item','Qty Wasted','Unit Cost','Waste Cost','Reason','Corrective Action'],...Array.from({length:10},()=>['','','','','','',''])];
    if(cfg.kind==='bakery') return [['Product','Order Qty','Units / Batch','Min / Batch','Batches Needed','Required Min','Capacity Status'],...Array.from({length:10},()=>['','','','','','',''])];
    if(cfg.kind==='chef') return [['Step','Area','Your Input / Decision','Status','Notes'],...['Settings','Client','Service','Menu / Service Idea','Food / Material Cost','Labor / Travel / Add-ons','Quote','Service Plan','Shopping & Prep','Actuals & Payments'].map((x,i)=>[i+1,x,'','Not started',''])];
    return [['Task','Frequency / Stage','Owner','Done?','Verified By','Issue / Note'],...(taskSets[cfg.kind]||[]).map(x=>[x,'','','No','',''])];
  };
  const csv=()=>rows().map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const download=()=>{const blob=new Blob(['\ufeff'+csv()],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`PoonthaiDigital_${cfg.slug}.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);event('starter_download');};

  const el=document.createElement('section'); el.className='lead-section'; el.id='free-starter';
  el.innerHTML=`<div class="wrap lead-shell"><div class="lead-copy"><span class="eyebrow">FREE STARTER FILE</span><h2>Use the simple version first. Upgrade only when you need more.</h2><p>The web tool stays free and does not require an account. Enter your email only if you want the reusable starter spreadsheet file.</p><div class="lead-bullets"><div class="lead-bullet"><span class="lead-dot">✓</span><span><strong>Useful on its own:</strong> the starter covers the core workflow for a simple operation.</span></div><div class="lead-bullet"><span class="lead-dot">✓</span><span><strong>No forced upgrade:</strong> if the starter is enough for your business, keep using it.</span></div></div><div class="upgrade-box"><strong>When the full Etsy version makes sense</strong><p>${esc(cfg.why)}</p><a href="${esc(cfg.etsy)}" target="_blank" rel="noopener">See ${esc(cfg.paid)} on Etsy ↗</a></div></div><div class="lead-form-card"><h3>${esc(cfg.title)}</h3><p class="lead-muted">Enter an email to unlock the downloadable starter. The download opens in Excel, Google Sheets and most spreadsheet apps as a CSV file.</p><form id="pdLeadForm"><label>Email<input id="pdLeadEmail" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"></label><label class="lead-consent"><input id="pdMarketing" type="checkbox"><span>Send me practical small-business tips and occasional PoonthaiDigital template updates. Optional. Unsubscribe anytime.</span></label><label class="lead-hp" aria-hidden="true">Website<input id="pdWebsite" tabindex="-1" autocomplete="off"></label><button id="pdLeadButton" class="btn btn-primary" type="submit">Unlock Free Starter</button><div id="pdLeadStatus" class="lead-status" role="status" aria-live="polite"></div></form><div id="pdLeadSuccess" class="lead-success" hidden><h4>Your starter is unlocked.</h4><p class="lead-muted">For a basic workflow, start here. You can decide later whether the full system is useful.</p><button id="pdDownload" class="btn btn-gold" type="button">Download Starter CSV</button></div><p class="lead-privacy">We use your email to provide the requested starter. Marketing is optional and only applies if you check the box. See <a href="/privacy/">Privacy</a> and <a href="/unsubscribe/">Unsubscribe</a>.</p></div></div>`;
  const anchor=document.querySelector('.footer-cta')||document.querySelector('footer'); anchor?.parentNode.insertBefore(el,anchor);
  event('lead_form_view');
  el.querySelector('#pdDownload').addEventListener('click',download);
  el.querySelector('#pdLeadForm').addEventListener('submit',async e=>{
    e.preventDefault(); if(el.querySelector('#pdWebsite').value) return;
    const email=el.querySelector('#pdLeadEmail').value.trim().toLowerCase(); const consent=el.querySelector('#pdMarketing').checked;
    const btn=el.querySelector('#pdLeadButton'),status=el.querySelector('#pdLeadStatus');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){status.textContent='Please enter a valid email address.';return;}
    btn.disabled=true; status.textContent='Unlocking your starter…';
    const lead={email,lead_magnet:cfg.slug,source_path:location.pathname,marketing_consent:consent,privacy_version:'2026-09-16',...utm};
    try{
      const r=await post('leads',lead,`?on_conflict=email,lead_magnet`);
      if(!(r.ok||r.status===409)) throw new Error('capture_failed');
      await post('lead_events',{email,lead_magnet:cfg.slug,event_name:'lead_captured',source_path:location.pathname,metadata:{marketing_consent:consent}}).catch(()=>{});
      if(consent){await post('marketing_consents',{email,lead_magnet:cfg.slug,source_path:location.pathname,privacy_version:'2026-09-16'}).catch(()=>{});event('marketing_opt_in',null);}
      ga('lead_captured',{marketing_consent:consent});
      el.querySelector('#pdLeadSuccess').hidden=false; status.textContent='Ready.'; btn.textContent='Unlocked';
    }catch(err){status.textContent='We could not unlock the file right now. Please try again in a moment.';btn.disabled=false;}
  });
})();
