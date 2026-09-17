(() => {
  const MAP={
    '/inventory-reorder-calculator/':{slug:'inventory-reorder-starter',title:'Free Inventory Reorder Starter',etsy:'https://poonthaidigital.etsy.com/listing/4561821192',paid:'Inventory & Waste Tracker',why:'Upgrade when stock, waste, suppliers and reorder decisions need to live together with a repeatable weekly review.'},
    '/food-waste-cost-calculator/':{slug:'food-waste-cost-starter',title:'Free Food Waste Cost Starter',etsy:'https://poonthaidigital.etsy.com/listing/4561821192',paid:'Inventory & Waste Tracker',why:'Upgrade when waste decisions need to connect to stock levels, suppliers, reorders and recurring management review.'},
    '/bakery-production-capacity-calculator/':{slug:'bakery-capacity-starter',title:'Free Bakery Capacity Starter',etsy:'https://poonthaidigital.etsy.com/listing/4566738686',paid:'Home Bakery Operations Toolkit',why:'Upgrade when orders, production, ingredient needs and pickup or delivery need to stay coordinated in one repeatable workflow.'},
    '/boba-shop-inventory-calculator/':{slug:'boba-operations-starter',title:'Free Boba Daily Operations Starter',etsy:'https://poonthaidigital.etsy.com/listing/4560696421',paid:'Boba Shop Operations Toolkit',why:'Upgrade when opening, closing, prep, cleaning, stock/waste and cash handoff need separate structured logs for a team.'},
    '/restaurant-opening-closing-checklist/':{slug:'restaurant-operations-starter',title:'Free Restaurant Daily Operations Starter',etsy:'https://poonthaidigital.etsy.com/listing/4561819638',paid:'Restaurant Daily Operations Checklist',why:'Upgrade when opening, pre-service, closing, prep/temperature, cleaning and handoff need connected verification and corrective follow-up.'},
    '/coffee-shop-opening-closing-checklist/':{slug:'coffee-checklist-starter',title:'Free Coffee Shop Opening & Closing Starter',etsy:'https://poonthaidigital.etsy.com/listing/4561793463',paid:'Coffee Shop Opening & Closing Checklist',why:'Upgrade when opening/closing must connect to brew & prep, cleaning, stock/waste and cash handoff across multiple staff.'},
    '/cafe-cleaning-schedule-planner/':{slug:'cleaning-schedule-starter',title:'Free Cafe Cleaning Schedule Starter',etsy:'https://poonthaidigital.etsy.com/listing/4561795303',paid:'Cafe Cleaning Checklist & Schedule',why:'Upgrade when daily, weekly and monthly cleaning need assignment, verification, corrective follow-up and reusable printable formats.'},
    '/private-chef-job-cost-calculator/':{slug:'private-chef-cost-starter',title:'Free Private Chef Service Starter',etsy:'https://poonthaidigital.etsy.com/listing/4569445414',paid:'Private Chef Client-to-Service Operations System',why:'For a simple one-off service, Steps 1–10 may be enough. Upgrade for Step 11 Follow-up & Rebooking when repeat clients matter, and Step 12 Dashboard & Next Actions when several services, blockers, balances and next actions must be prioritized.'}
  };
  const cfg=MAP[location.pathname]; if(!cfg) return;
  const css=document.createElement('link'); css.rel='stylesheet'; css.href='/assets/lead-funnel.css'; document.head.appendChild(css);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const qs=new URLSearchParams(location.search);
  const ga=(name,params={})=>{try{if(typeof gtag==='function')gtag('event',name,{lead_magnet:cfg.slug,page_path:location.pathname,...params});}catch(_){}};

  const el=document.createElement('section'); el.className='lead-section'; el.id='free-starter';
  el.innerHTML=`<div class="wrap lead-shell"><div class="lead-copy"><span class="eyebrow">FREE STARTER XLSX</span><h2>Use the simple version first. Upgrade only when you need more.</h2><p>The web tool stays free and does not require an account. Enter your email only if you want the reusable Excel starter.</p><div class="lead-bullets"><div class="lead-bullet"><span class="lead-dot">✓</span><span><strong>Useful on its own:</strong> the starter covers the core workflow for a simple operation.</span></div><div class="lead-bullet"><span class="lead-dot">✓</span><span><strong>No forced upgrade:</strong> if the starter is enough for your business, keep using it.</span></div></div><div class="upgrade-box"><strong>When the full Etsy version makes sense</strong><p>${esc(cfg.why)}</p><a href="${esc(cfg.etsy)}" target="_blank" rel="noopener">See ${esc(cfg.paid)} on Etsy ↗</a></div></div><div class="lead-form-card"><h3>${esc(cfg.title)}</h3><p class="lead-muted">Enter an email to receive a secure XLSX download link. The link expires after 48 hours.</p><form id="pdLeadForm"><label>Email<input id="pdLeadEmail" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"></label><label class="lead-consent"><input id="pdMarketing" type="checkbox"><span>Send me practical small-business tips and occasional PoonthaiDigital template updates. Optional. Unsubscribe anytime.</span></label><label class="lead-hp" aria-hidden="true">Website<input id="pdWebsite" tabindex="-1" autocomplete="off"></label><button id="pdLeadButton" class="btn btn-primary" type="submit">Email My Free Starter</button><div id="pdLeadStatus" class="lead-status" role="status" aria-live="polite"></div></form><div id="pdLeadSuccess" class="lead-success" hidden><h4>Your starter is ready.</h4><p class="lead-muted">We sent the secure link by email. You can also download it now on this device.</p><a id="pdDownload" class="btn btn-gold" href="#" rel="nofollow">Download Starter XLSX</a></div><p class="lead-privacy">We use your email to provide the requested starter. Marketing is optional and only applies if you check the box. See <a href="/privacy/">Privacy</a> and <a href="/unsubscribe/">Unsubscribe</a>.</p></div></div>`;
  const anchor=document.querySelector('.footer-cta')||document.querySelector('footer'); anchor?.parentNode.insertBefore(el,anchor);
  ga('lead_form_view');

  el.querySelector('#pdLeadForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const trap=el.querySelector('#pdWebsite').value; if(trap) return;
    const email=el.querySelector('#pdLeadEmail').value.trim().toLowerCase();
    const consent=el.querySelector('#pdMarketing').checked;
    const btn=el.querySelector('#pdLeadButton'),status=el.querySelector('#pdLeadStatus');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){status.textContent='Please enter a valid email address.';return;}
    btn.disabled=true; status.textContent='Preparing your secure starter…';
    const payload={
      email,leadMagnet:cfg.slug,sourcePath:location.pathname,marketingConsent:consent,website:'',
      utm_source:qs.get('utm_source'),utm_medium:qs.get('utm_medium'),utm_campaign:qs.get('utm_campaign'),utm_content:qs.get('utm_content')
    };
    try{
      const r=await fetch('/api/lead-capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.ok||!data.downloadUrl) throw new Error(data.error||'capture_failed');
      const dl=el.querySelector('#pdDownload'); dl.href=data.downloadUrl;
      dl.addEventListener('click',()=>ga('starter_download'),{once:true});
      el.querySelector('#pdLeadSuccess').hidden=false;
      status.textContent=data.emailQueued?'Sent — check your inbox too.':'Your download is ready below.';
      btn.textContent='Starter Ready';
      ga('lead_captured',{marketing_consent:consent,email_queued:Boolean(data.emailQueued)});
      if(consent) ga('marketing_opt_in');
    }catch(_){
      status.textContent='We could not prepare the file right now. Please try again in a moment.';
      btn.disabled=false;
    }
  });
})();
