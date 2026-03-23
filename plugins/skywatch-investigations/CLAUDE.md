# Skywatch Investigations Plugin

Last verified: 2026-03-23

## Purpose

Investigation toolkit for AT Protocol network analysis. Provides MCP tools for ClickHouse data access, domain/IP/URL reconnaissance, content similarity detection, and Ozone moderation labelling. Skills codify investigation methodology. Agents orchestrate the full workflow from brief to report.

## Architecture

Three layers — MCP server (native tool access), skills (codified methodology), agents (orchestrated workflows). The investigator agent delegates ClickHouse work to a data-analyst subagent while handling reconnaissance directly.

## Contracts

### Exposes

- **Agents**:
  - `investigator` — investigation orchestrator, dispatches data-analyst for ClickHouse queries
  - `data-analyst` — focused ClickHouse query agent
- **Skills**:
  - `accessing-osprey` — Osprey system context and schema reference
  - `querying-clickhouse` — ClickHouse query patterns and best practices
  - `conducting-investigations` — investigation methodology (reconnaissance, correlation, analysis)
  - `reporting-results` — report structure, formatting, and presentation
- **MCP Tools** (11 total):
  - `clickhouse_query` — Execute read-only queries against osprey_execution_results, pds_signup_anomalies, url_overdispersion_results, account_entropy_results, url_cosharing_pairs, url_cosharing_clusters, url_cosharing_membership
  - `clickhouse_schema` — Discover table structure and column definitions for all queryable tables
  - `content_similarity` — Detect text similarity via ClickHouse ngramDistance
  - `cosharing_clusters` — Find URL co-sharing clusters by DID, cluster_id, date, or minimum size (supports JOINs internally)
  - `cosharing_pairs` — Get raw co-sharing pairs for a specific DID with edge weights and shared URLs
  - `cosharing_evolution` — Trace a cluster's evolution history (births, merges, splits, deaths)
  - `domain_check` — Verify domain registration and WHOIS data
  - `ip_lookup` — Geolocate IP addresses via ip-api.com
  - `url_expand` — Expand shortened URLs to full targets
  - `whois_lookup` — Query WHOIS databases for registrant information
  - `ozone_label` — Apply/remove moderation labels via Ozone API (supports comment and batchId for grouping related label operations)

### Guarantees

- Investigator NEVER writes ClickHouse queries directly — delegates to data-analyst
- All ClickHouse queries via `clickhouse_query` are read-only (SELECT + LIMIT only, restricted to: osprey_execution_results, pds_signup_anomalies, url_overdispersion_results, account_entropy_results, url_cosharing_pairs, url_cosharing_clusters, url_cosharing_membership)
- Co-sharing tools (`cosharing_clusters`, `cosharing_pairs`, `cosharing_evolution`) use `queryTrusted` to bypass the JOIN restriction for server-built queries with sanitised inputs
- Ozone labelling requires explicit credentials — fails gracefully without them
- Data-analyst always includes SQL used in its output (reproducibility)
- Investigation reports follow B-I-N-D-Ts format (Brief, Investigation, Notable findings, Data, Technical details)

### Expects

- ClickHouse access (direct or SSH mode) configured via env vars
- Bun runtime installed for MCP server
- Ozone credentials (optional — only for labelling): `OZONE_HANDLE`, `OZONE_ADMIN_PASSWORD`, `OZONE_DID`, `OZONE_PDS`

## Dependencies

- **Uses**: ClickHouse (osprey_execution_results, pds_signup_anomalies, url_overdispersion_results, account_entropy_results, url_cosharing_pairs, url_cosharing_clusters, url_cosharing_membership tables), ip-api.com (GeoIP), WHOIS servers, Ozone API
- **Used by**: Any Claude Code session with this plugin installed
- **Boundary**: Does NOT overlap with osprey-rules plugin (rule writing) or osprey-rule-investigator (rule project analysis). The `accessing-osprey` skill provides context about the Osprey system but directs users to osprey-rules for rule authoring.

## When to Use

| User Intent | Use |
|-------------|-----|
| "Investigate these accounts" | `investigator` agent |
| "Find accounts triggered by rule X" | `data-analyst` agent or `investigator` |
| "What does the osprey schema look like?" | `accessing-osprey` skill |
| "How do I query ClickHouse effectively?" | `querying-clickhouse` skill |
| "Conduct a full investigation" | `investigator` agent (loads methodology automatically) |
| "Write a report on these findings" | `reporting-results` skill |
| "Check if this account is a bot" | `data-analyst` agent (query `account_entropy_results`) |
| "Find coordinated domain sharing" | `data-analyst` agent (query `url_overdispersion_results`) |
| "Find URL co-sharing clusters" | `cosharing_clusters` tool or `data-analyst` agent |
| "Is this account in a co-sharing network?" | `cosharing_clusters` tool with `did` param |
| "Trace this cluster's history" | `cosharing_evolution` tool with `cluster_id` param |

## Key Files

| File | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin manifest (name, version 0.15.0, metadata) |
| `.mcp.json` | MCP server configuration with ClickHouse/SSH env vars (Ozone env vars set via shell/settings) |
| `agents/investigator.md` | Orchestrator agent, dispatches data-analyst for queries |
| `agents/data-analyst.md` | ClickHouse query agent, focused on osprey_execution_results |
| `skills/accessing-osprey/SKILL.md` | Osprey system context and schema reference |
| `skills/querying-clickhouse/SKILL.md` | ClickHouse query patterns and best practices |
| `skills/conducting-investigations/SKILL.md` | Investigation methodology and correlation techniques |
| `skills/reporting-results/SKILL.md` | Report structure, B-I-N-D-Ts format, presentation |
| `servers/skywatch-mcp/src/index.ts` | MCP server entry point |
| `servers/skywatch-mcp/src/tools/` | Tool implementations (11 tools across 5 files) |
| `servers/skywatch-mcp/src/tools/cosharing.ts` | Co-sharing cluster/pairs/evolution tools |

## Gotchas

- MCP server requires Bun runtime — `bun` must be on PATH
- `CLICKHOUSE_MODE` defaults to `ssh` — set to `direct` for local ClickHouse
- Ozone tools fail gracefully without credentials (clear error message)
- Ozone env vars (`OZONE_HANDLE`, `OZONE_ADMIN_PASSWORD`, `OZONE_DID`, `OZONE_PDS`) are NOT in `.mcp.json` — set them in `~/.claude/settings.json` or `~/.zshrc` to avoid committing secrets
- Ozone auth goes through the PDS (via `atproto-proxy` header), not directly to the Ozone service URL
- `content_similarity` depends on ClickHouse — recon tools work independently
- ip-api.com free tier has 45 req/min rate limit
- SSH mode requires `SSH_HOST`, `SSH_USER`, and `SSH_DOCKER_CONTAINER` to be configured
- Investigator never writes queries directly; if you see it writing SQL, something is wrong
- Co-sharing tools use `queryTrusted` (bypasses SQL validator) — the queries are built server-side with sanitised inputs, not user-supplied SQL
- `url_cosharing_pairs` and `url_cosharing_membership` have 7-day TTL — queries beyond that window return no results
- `url_cosharing_clusters` has no TTL — cluster-level data is retained indefinitely
