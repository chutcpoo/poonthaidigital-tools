# PDT-IPT-001 HyperFrames Pilot R02

Status: PILOT / DRAFT PR ONLY / NO PRODUCTION MUTATION
HyperFrames version: 0.8.72 (pinned after live CLI validation)

## Deliverable
- 15.0 seconds
- 1080 × 1920 (9:16)
- 30 fps
- Silent MP4
- Brand: Navy #16324F / Teal #2B6F70 / Warm Gold #D89B3C / Cream #F6F1E8

## Product Truth Guardrails
- REAL-FILE-FIRST
- Pixel-true workbook proof
- No fake UI
- No fake reviews / sales / results
- No invoice sending, payment processing, bank sync, CRM automation, tax/legal advice, or accounting-system claims
- No Google Sheets buyer-file claim
- Buyer package remains Excel-only

## Canonical Drive sources used
- Dashboard: PDT-IPT-001_GALLERY_SOURCE_02_DASHBOARD.png — Drive ID 1MgFxZ0_lnpNU4zG2NY4VgxCQiyEobw_0
- Invoices: PDT-IPT-001_GALLERY_SOURCE_03_INVOICES.png — Drive ID 1gEm7LZCQZ0MdAB7-6RN3DBIqK3tqrUm5
- Aging & Follow-Up: PDT-IPT-001_GALLERY_SOURCE_05_AGING_FOLLOWUP.png — Drive ID 1ZtIV4uQXbjtsubnj3nvDyhr25iwpu4F9
- Monthly Summary: PDT-IPT-001_GALLERY_SOURCE_06_MONTHLY_SUMMARY.png — Drive ID 1aQKBe8o4KLDhfXiZokxyQpqbjzXM6y3_

Screenshot bytes are embedded only in the scene composition files. No buyer workbook file is committed.

## Composition structure
Root index mounts 5 HyperFrames sub-compositions on separate timeline tracks:
1. 0.0–2.7 — Dashboard — “Know What’s Outstanding — Fast”
2. 2.7–5.7 — Invoices — “Track Every Invoice in One Place”
3. 5.7–8.8 — Aging & Follow-Up — “Turn Overdue Invoices into an Action List”
4. 8.8–11.8 — Monthly Summary — “See Monthly Invoiced vs Received”
5. 11.8–15.0 — CTA — “Track. Review. Follow Up.” / Excel • 2 Files • 7 Tabs

## Gate
PASS only when:
1. `hyperframes lint . --strict` = PASS
2. `hyperframes check . --strict` at representative scene timestamps = PASS
3. Snapshot review = PASS
4. HyperFrames render = PASS
5. ffprobe verifies H.264, 1080×1920, 30 fps, approx 15 seconds

Existing Etsy R01 720×720 video is protected and unchanged.
