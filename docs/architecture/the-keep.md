# The Keep architecture

## Public layer

Independent GitHub repositories collect, calculate, test, and publish versioned static outputs. Each current product remains free and directly accessible.

## Platform preview

The company site mounts BNTI, WTI, and MENA outputs during its hourly GitHub Actions build. `/platform/` reads those local JSON files, displays published scores and events, and calculates only the declared available-value mean. It stores no customer data and requires no LLM.

## Enterprise target

Adapters → normalized observation/event schema → exposure graph → watchlist/alert service → workspace/API. Authentication, tenant isolation, audit log, encrypted storage, retention controls, private connectors, and billing must be deployed outside GitHub Pages before confidential customer data is accepted.

## Independence

Core operation uses repository code, pinned dependencies, GitHub Actions, source APIs, deterministic calculations, tests, and runbooks. Codex may assist development but is not a runtime dependency. LLM enrichment, if used by an upstream product, must be optional, declared, bounded, and fail visibly.

## Release gates

Schema validation, source/freshness checks, unit tests, built-artifact verification, responsive browser tests, broken-link/image checks, security review, Pages deployment, and live health check.

