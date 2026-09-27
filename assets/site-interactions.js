(()=>{
  if(window.__pdSiteInteractionTracker)return;
  window.__pdSiteInteractionTracker=true;
  const send=(name,params)=>{
    try{
      if(typeof window.gtag==='function'){
        window.gtag('event',name,{...params,transport_type:'beacon'});
      }
    }catch(_){}
  };
  document.addEventListener('click',event=>{
    const link=event.target&&event.target.closest?event.target.closest('a[href]'):null;
    if(!link)return;
    let url;
    try{url=new URL(link.href,window.location.href);}catch(_){return;}
    if(url.hostname!=='shop.poonthaidigital.com')return;
    const params={
      link_url:url.toString(),
      source_path:window.location.pathname,
      placement:link.dataset.pdCta||''
    };
    send('shopify_click',params);
    if(
      window.location.pathname==='/invoice-aging-calculator/' &&
      url.pathname.includes('/products/invoice-payment-tracker-excel')
    ){
      send('product_cta_click',{...params,product:'PDT-IPT-001'});
    }
  },true);
})();