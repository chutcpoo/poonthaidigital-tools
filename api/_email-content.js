const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function shell(title, body, footer='') {
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head><body style="margin:0;background:#F6F1E8;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td align="center" style="padding:24px 16px"><table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;background:#fff"><tr><td bgcolor="#16324F" style="background:#16324F;padding:20px 24px;color:#fff;font-size:20px;line-height:28px;font-weight:bold">PoonthaiDigital</td></tr><tr><td style="padding:28px 24px 10px;color:#16324F;font-size:23px;line-height:31px;font-weight:bold">${esc(title)}</td></tr><tr><td style="padding:0 24px 24px;color:#17212B;font-size:16px;line-height:24px">${body}</td></tr>${footer ? `<tr><td style="padding:0 24px 24px;color:#667085;font-size:12px;line-height:18px">${footer}</td></tr>` : ''}</table></td></tr></table></body></html>`;
}

const button = (label, url) => `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:18px"><tr><td bgcolor="#D89B3C" style="background:#D89B3C;border-radius:6px"><a href="${esc(url)}" style="display:inline-block;padding:12px 18px;color:#16324F;text-decoration:none;font-weight:bold">${esc(label)}</a></td></tr></table>`;
const unsub = url => `You can stop practical follow-up emails at any time: <a href="${esc(url)}" style="color:#667085">unsubscribe</a>.`;

function trackedPaidUrl(rawUrl, cfg, content) {
  try {
    const url = new URL(String(rawUrl), 'https://poonthaidigital.com');
    url.searchParams.set('utm_source', 'email');
    url.searchParams.set('utm_medium', 'nurture');
    url.searchParams.set('utm_campaign', 'starter_followup');
    url.searchParams.set('utm_content', `${cfg.kind || 'starter'}_${content}`);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function deliveryEmail(cfg, downloadUrl) {
  const title = `Your ${cfg.starterName} is ready`;
  const html = shell(title, `Your free starter is ready. It is designed to be useful on its own for ${esc(cfg.freeScope)}.${button('Download your free starter', downloadUrl)}<p style="margin-top:18px">If that solves the job, keep using the free version. A paid version only makes sense when the workflow needs more structure or scale and a matching validated product is currently available.</p>`);
  const text = `${title}\n\nDownload: ${downloadUrl}\n\nThe free starter is designed for ${cfg.freeScope}. If that solves the job, keep using it.`;
  return { subject: title, html, text };
}

export function nurtureEmails(cfg, unsubscribeUrl) {
  const day5Url = trackedPaidUrl(cfg.etsyUrl, cfg, 'day5');
  const day8Url = trackedPaidUrl(cfg.etsyUrl, cfg, 'day8');
  return [
    { key:'day1', delayDays:1, subject:'A simple way to use your PoonthaiDigital starter', html:shell('Start simple', `Use your ${esc(cfg.starterName)} for one real task first. Keep the process small, record the result, and only add complexity when the basic routine is working.`, unsub(unsubscribeUrl)), text:`Start simple with your ${cfg.starterName}. Use it for one real task first.\n\nUnsubscribe: ${unsubscribeUrl}` },
    { key:'day3', delayDays:3, subject:'When the free version is enough', html:shell('You may not need the paid version yet', `If the starter already handles ${esc(cfg.freeScope)}, the free version may be enough. Consider upgrading only when you need:<br><br>• ${esc(cfg.advanced1)}<br>• ${esc(cfg.advanced2)}`, unsub(unsubscribeUrl)), text:`If the starter already handles ${cfg.freeScope}, the free version may be enough. Upgrade only when you need ${cfg.advanced1} or ${cfg.advanced2}.\n\nUnsubscribe: ${unsubscribeUrl}` },
    { key:'day5', delayDays:5, subject:'Why the advanced version exists', html:shell('When the full system starts to help', `The advanced version is intended for businesses that need ${esc(cfg.advanced1)} or ${esc(cfg.advanced2)}.${button('Check current paid catalog', day5Url)}`, unsub(unsubscribeUrl)), text:`The full version is intended for ${cfg.advanced1} or ${cfg.advanced2}.\nCurrent paid catalog: ${day5Url}\n\nUnsubscribe: ${unsubscribeUrl}` },
    { key:'day8', delayDays:8, subject:'If you need a complete system, check what is live', html:shell('Need a more complete workflow?', `If the free starter is still enough, keep using it. If you now need the complete ${esc(cfg.paidName)} workflow, check the current catalog to see whether a matching validated product is live.${button('Check current paid catalog', day8Url)}`, unsub(unsubscribeUrl)), text:`If the free starter is still enough, keep using it. If you need the complete ${cfg.paidName}, check the current catalog: ${day8Url}\n\nUnsubscribe: ${unsubscribeUrl}` }
  ];
}
