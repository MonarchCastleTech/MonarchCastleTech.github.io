# auth.md — monarchcastle.com

Site: https://monarchcastle.com
Owner: Monarch Castle Technologies

## Agent registration

Agent registration is open and automatic. No register_uri call, API key, or invitation is required to read this site.

```yaml
agent_auth:
  skill: https://monarchcastle.com/.well-known/agent-skills/monarchcastle-site/SKILL.md
  register_uri: "https://monarchcastle.com/auth.md"
  registration_method: anonymous
  identity_types_supported: [anonymous]
  anonymous:
    credential_types_supported: []
    claim_uri: "https://monarchcastle.com/auth.md"
  revocation_uri: "https://monarchcastle.com/auth.md"
  authorization_servers: ["https://monarchcastle.com"]
```

- identity_types: none (anonymous access)
- credential_types: none (no credentials issued)
- Supported grant types: none (no token endpoint issues tokens)
- All content is public, read-only, and safe to fetch with plain GET.

## Endpoints

- Short index: https://monarchcastle.com/llms.txt
- Full corpus: https://monarchcastle.com/llms-full.txt
- API catalog: https://monarchcastle.com/.well-known/api-catalog
- ARD manifest: https://monarchcastle.com/.well-known/ard.json
- Protected resource metadata: https://monarchcastle.com/.well-known/oauth-protected-resource
- Authorization server metadata: https://monarchcastle.com/.well-known/oauth-authorization-server
- MCP server card: https://monarchcastle.com/.well-known/mcp/server-card.json
- MCP endpoint (streamable HTTP): https://monarchcastle.com/mcp
- A2A agent card: https://monarchcastle.com/.well-known/agent-card.json
- Contact: https://github.com/MonarchCastleTech

## Crawl policy

Respect robots.txt (AI crawlers are explicitly welcomed; Content-Signal: ai-train=yes, search=yes, ai-input=yes) and the privacy, cookie, and terms pages when quoting policy content.
