# PoonthaiDigital Tools — Post-Reset Search, Social & AI Discovery Architecture

Primary domain: https://poonthaidigital.com/

Reset date: 2026-09-20
Current paid catalog state: 1 LIVE VALIDATED PRODUCT / POST_RESET_PRODUCT_001
Previous Etsy listing IDs: HISTORICAL ONLY / NON-EXECUTABLE

Business model during reset:
**Search / Social / AI discovery → useful guide or free tool → practical result → fresh market validation → one evidence-backed paid product at a time**

## Production routes

Core:
- `/`
- `/tools/`
- `/guides/`
- `/about/`
- `/catalog-status/` (noindex, follow)
- `/invoice-payment-tracker/` (live paid-product destination)

Free tools:
- `/inventory-reorder-calculator/`
- `/food-waste-cost-calculator/`
- `/bakery-production-capacity-calculator/`
- `/boba-shop-inventory-calculator/`
- `/restaurant-opening-closing-checklist/`
- `/coffee-shop-opening-closing-checklist/`
- `/cafe-cleaning-schedule-planner/`
- `/private-chef-job-cost-calculator/`

Niche hubs:
- `/restaurant-tools/`
- `/boba-shop-tools/`
- `/bakery-tools/`

Problem-solving guides:
- `/guides/restaurant-shift-handoff-checklist/`
- `/guides/restaurant-food-waste-log/`
- `/guides/bakery-production-schedule/`
- `/guides/professional-organizer-client-project-workflow/`

## Post-reset product / destination policy

- No previous Etsy listing ID is treated as live.
- Public pages must not send visitors to deleted listing URLs.
- Paid-product CTAs may point to a product only after that exact product is freshly validated and released. Unmatched historical product families remain routed to `/catalog-status/`.
- Do not silently redirect a deleted product to an unrelated product.
- Free tools and guides remain first-party resources and may continue to receive organic/social traffic.
- New paid-product mapping is created only after fresh market validation, Product Truth, tester, final QC and Etsy release authorization.

## SEO / discovery implementation

- Unique title + meta description per production page
- Canonical URLs on `https://poonthaidigital.com`
- Crawlable semantic H1/H2 structure
- WebSite / Organization / CollectionPage / WebApplication / Article / Breadcrumb structured data where appropriate
- `robots.txt` allows crawling and points to `sitemap.xml`
- XML sitemap includes first-party routes; `/catalog-status/` is intentionally noindex
- Guide → related Tool internal-link architecture remains active
- GA4 and Vercel Analytics remain active
- UTM-preserving social → website attribution remains active
- Organization entity links to Facebook; stale Etsy identity links are removed during reset
- No fabricated prices, sales, reviews, rankings, guarantees or unsupported claims

## Governance

- Google Drive is the canonical operational source of truth.
- GitHub `chutcpoo/poonthaidigital-tools` is code source truth.
- Vercel project `poonthaidigital-tools` is deployment truth.
- `poonthaidigital.com` is production web/funnel truth.
- Etsy is READ-ONLY by default for mutations. Current post-reset live catalog baseline is 1 validated product: PDT-IPT-001 / Listing 4578945050.
- Keep one primary search intent per page and avoid duplicate-intent thin pages.
- Expand content only from buyer-problem evidence or measured search signals.
- Prefer useful original tools, examples and workflows over generic high-volume blogging.

## Deployment

GitHub repo: `chutcpoo/poonthaidigital-tools`
Vercel project: `poonthaidigital-tools`
Production domain: `https://poonthaidigital.com/`

POST_RESET_PRODUCT_001 (PDT-IPT-001) passed the release gates and is live. Additional paid products remain gated one at a time.
