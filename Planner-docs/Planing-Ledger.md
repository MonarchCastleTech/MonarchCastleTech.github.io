# Planing Ledger

- 2026-09-22: bf6ea70 canonical domain + agent stack + /sdcofa mounts
- 2026-09-22: 45fdf11 include-hidden-files fix for .well-known on Pages
- 2026-09-22: CF zone 4fb144db…, worker monarch-edge, routes, DNS-AID, DNSSEC DS issued; zone pending NS
- 2026-09-22: OAuth AS discovery + auth.md + A2A agent-card + PRM authorization_servers; worker streamable-http MCP (/mcp POST) with get_index/get_bnti/list_indices/get_site_page; local test 67/67 + test:dist 9/9
- 2026-09-23: isitagentready authMd+a2aAgentCard fail fix — PRM scopes_supported ["read"], agent-card version+supportedInterfaces; test 67/67 + test:dist 9/9 + verify-dist pass
- 2026-09-23: rescan still fail — AS metadata needed `agent_auth` block, supportedInterfaces entries needed `url`; added both; a2aAgentCard pass on rescan; authMd still fail (needs non-empty credential_types + top-level claim_uri); fix in flight
- 2026-09-23: agent_auth claim_uri + credential_types ["none"] fix (928b63b); rescan 21:44Z ALL checks pass, level 5 Agent-Native; MCP get_bnti live CRITICAL 7.29; test 67/67 + test:dist 9/9 + verify-dist pass
- 2026-09-23: public BNTI/WTI/MENA REST API — worker `/api`, `/api/{bnti,wti,mena}`, `/api/indices` (+country/top); api-catalog + llms.txt + /mcp docs; shared with MCP tools
