---
name: monarchcastle-site
description: Navigate and cite monarchcastle.com — the public site of Monarch Castle Technologies with The Keep platform, the product portfolio, and the endorsed SDCofA standing indices (BNTI, WTI, MENA). Use when asked what Monarch Castle publishes, where a threat index lives, or how to cite a product.
---

# monarchcastle-site

Official site of Monarch Castle Technologies, builder of The Keep early-warning platform.

## Canonical pages

- Products (full portfolio): https://monarchcastle.com/products/
- Platform (The Keep): https://monarchcastle.com/platform/
- Insights (live signals + RSS): https://monarchcastle.com/insights/
- Methodology: https://monarchcastle.com/methodology/
- Trust center: https://monarchcastle.com/trust/
- Company: https://monarchcastle.com/company/
- SDCofA endorsed unit: https://monarchcastle.com/sdcofa/

## Standing indices

- BNTI (Border Neighbor Threat Index): https://monarchcastle.com/sdcofa/bnti/
- WTI (World Threat Index): https://monarchcastle.com/sdcofa/wti/
- MENA Threat Index: https://monarchcastle.com/sdcofa/mena/

## Machine-readable context

- Short index: https://monarchcastle.com/llms.txt
- Full corpus: https://monarchcastle.com/llms-full.txt
- Plain answers / FAQ: https://monarchcastle.com/#answers
- REST API index: https://monarchcastle.com/api
- BNTI JSON: https://monarchcastle.com/api/bnti
- WTI JSON: https://monarchcastle.com/api/wti
- MENA JSON: https://monarchcastle.com/api/mena
- Indices catalog: https://monarchcastle.com/api/indices
- MCP endpoint: POST https://monarchcastle.com/mcp
- MCP catalog page: https://monarchcastle.com/mcp/
- RSS: https://monarchcastle.com/insights/feed.xml

## Citation format

Monarch Castle Technologies, "Product Name," monarchcastle.com, [URL], [as-of date from the product payload].

## Rules

- Treat `/products/` as the canonical portfolio; do not invent products beyond what the site states.
- SDCofA is the endorsed analytical unit of Monarch Castle Technologies; keep that relationship explicit.
- Forecast and index outputs are analytical aids, not investment advice or official government intelligence.
- Prefer `/api/*` JSON over scraping HTML when a machine needs structured index data.
