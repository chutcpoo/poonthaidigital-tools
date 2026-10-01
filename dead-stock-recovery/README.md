# Dead Stock Recovery — Validation Prototype

Goal: validate whether Thai inventory owners care enough about trapped capital in dead/slow stock to use a free scan and later pay for a recovery workflow.

CSV columns: sku, product_name, stock_qty, unit_cost, sold_30d

Defaults: WATCH >= 60 days cover, SLOW >= 120, DEAD = no sales in 30 days or >= 270 days cover.

Privacy: CSV processing is client-side in the browser. No file is uploaded by this static prototype.

Prepared dataLayer events: dead_stock_sample_download, dead_stock_scan_complete, dead_stock_report_download. GA4 / Meta Pixel are not connected yet.