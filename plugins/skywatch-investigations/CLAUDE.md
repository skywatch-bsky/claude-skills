# Skywatch Investigations Plugin

Last verified: 2026-03-24

## Purpose

Investigation toolkit for AT Protocol network analysis. Provides MCP tools for ClickHouse data access, domain/IP/URL reconnaissance, content similarity detection, and Ozone moderation labelling. Skills codify investigation methodology. Agents orchestrate the full workflow from brief to report.

## Architecture

Three layers — MCP server (native tool access), skills (codified methodology), agents (orchestrated workflows). The investigator agent delegates ClickHouse work to a data-analyst subagent while handling reconnaissance directly.

**Phase 1 Refactoring (2026-03-24):** Ozone tool internals refactored to extract reusable helpers: `validateOzoneConfig`, `buildSubjectRef`, `buildModTool`, and `ozoneRequest`. These enable future read tools and maintain zero-behaviour-change principle.

**Phase 3: Write Tools (2026-03-24):** Added 7 write tools (comment, acknowledge, escalate, tag, mute, unmute, resolve_appeal) that emit moderation events via Ozone `emitEvent` API. All use the `emitOzoneEvent` helper for consistent event construction with $type, createdBy, modTool metadata, and batchId support.

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
- **MCP Tools** (20 total):
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
  - `ozone_query_statuses` — Query the Ozone moderation queue with filters for review state, tags, appeal/takedown status, and pagination
  - `ozone_query_events` — Query moderation event history with filters for event type, moderator, date range, and labels
  - `ozone_comment` — Add a comment to a subject's moderation record (supports sticky comments)
  - `ozone_acknowledge` — Acknowledge a subject, moving it from open to reviewed (supports bulk account acknowledgement)
  - `ozone_escalate` — Escalate a subject for higher-level review
  - `ozone_tag` — Add and/or remove tags from a subject's moderation record
  - `ozone_mute` — Mute a subject for a specified duration in hours
  - `ozone_unmute` — Unmute a previously muted subject
  - `ozone_resolve_appeal` — Resolve an appeal on a subject (requires comment)

### Guarantees

- Investigator NEVER writes ClickHouse queries directly — delegates to data-analyst
- All ClickHouse queries via `clickhouse_query` are read-only (SELECT + LIMIT only, restricted to: osprey_execution_results, pds_signup_anomalies, url_overdispersion_results, account_entropy_results, url_cosharing_pairs, url_cosharing_clusters, url_cosharing_membership)
- Co-sharing tools (`cosharing_clusters`, `cosharing_pairs`, `cosharing_evolution`) use `queryTrusted` to bypass the JOIN restriction for server-built queries with sanitised inputs
- All Ozone tools require explicit credentials — fail gracefully without them
- Data-analyst always includes SQL used in its output (reproducibility)
- Investigation reports follow B-I-N-D-Ts format (Brief, Investigation, Notable findings, Data, Technical details)
- **Ozone internals (Phase 1):** Reusable helpers are exported (`validateOzoneConfig`, `buildSubjectRef`, `buildModTool`, `ozoneRequest`) to support read and write tools. `ozone_label` handler uses these helpers with zero behaviour change.
- **Ozone write tools (Phase 3):** All 7 write tools use the `emitOzoneEvent` helper to emit proper event payloads via Ozone `emitEvent` API. Each tool enforces required fields: `ozone_tag` requires at least one of add/remove; `ozone_resolve_appeal` requires comment.
- All Ozone write tools include modTool metadata (`name: "skywatch-mcp"`, batchId) for traceability
- All Ozone write tools validate credentials before attempting API calls

### Expects

- ClickHouse access (direct or SSH mode) configured via env vars
- Bun runtime installed for MCP server
- Ozone credentials (optional — only for read/write tools): `OZONE_HANDLE`, `OZONE_ADMIN_PASSWORD`, `OZONE_DID`, `OZONE_PDS`

## Dependencies

- **Uses**: ClickHouse (osprey_execution_results, pds_signup_anomalies, url_overdispersion_results, account_entropy_results, url_cosharing_pairs, url_cosharing_clusters, url_cosharing_membership tables), ip-api.com (GeoIP), WHOIS servers, Ozone API (read/write moderation events)
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
| "Label a subject in Ozone" | `ozone_label` tool |
| "Query the moderation queue" | `ozone_query_statuses` tool or `data-analyst` agent |
| "What moderation events happened on this account?" | `ozone_query_events` tool or `data-analyst` agent |
| "Add a comment to this subject" | `ozone_comment` tool |
| "Acknowledge this report" | `ozone_acknowledge` tool |
| "Escalate this subject" | `ozone_escalate` tool |
| "Tag/untag this subject" | `ozone_tag` tool |
| "Mute this subject" | `ozone_mute` tool |
| "Unmute this subject" | `ozone_unmute` tool |
| "Resolve this appeal" | `ozone_resolve_appeal` tool |

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
| `servers/skywatch-mcp/src/tools/` | Tool implementations (20 tools across 5 files) |
| `servers/skywatch-mcp/src/tools/ozone.ts` | 10 Ozone tools (1 label, 2 query, 7 write) + helpers (validateOzoneConfig, buildSubjectRef, buildModTool, ozoneRequest, emitOzoneEvent) |
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
- Ozone `ozoneRequest` helper automatically retries on ExpiredToken with session refresh — no manual retry needed in consuming code
