# Skywatch Investigations Plugin

Last verified: 2026-03-19

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
- **MCP Tools** (8 total):
  - `clickhouse_query` — Execute read-only queries against osprey_execution_results
  - `clickhouse_schema` — Discover table structure and column definitions
  - `content_similarity` — Detect text similarity via ClickHouse ngramDistance
  - `domain_check` — Verify domain registration and WHOIS data
  - `ip_lookup` — Geolocate IP addresses via ip-api.com
  - `url_expand` — Expand shortened URLs to full targets
  - `whois_lookup` — Query WHOIS databases for registrant information
  - `ozone_label` — Apply moderation labels via Ozone API

### Guarantees

- Investigator NEVER writes ClickHouse queries directly — delegates to data-analyst
- All ClickHouse queries are read-only (SELECT + LIMIT only, osprey_execution_results table only)
- Ozone labelling requires explicit credentials — fails gracefully without them
- Data-analyst always includes SQL used in its output (reproducibility)
- Investigation reports follow B-I-N-D-Ts format (Brief, Investigation, Notable findings, Data, Technical details)

### Expects

- ClickHouse access (direct or SSH mode) configured via env vars
- Bun runtime installed for MCP server
- Ozone credentials (optional — only for labelling)

## Dependencies

- **Uses**: ClickHouse (osprey_execution_results table), ip-api.com (GeoIP), WHOIS servers, Ozone API
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

## Key Files

| File | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin manifest (name, version 0.1.0, metadata) |
| `.mcp.json` | MCP server configuration with ClickHouse/SSH/Ozone env vars |
| `agents/investigator.md` | Orchestrator agent, dispatches data-analyst for queries |
| `agents/data-analyst.md` | ClickHouse query agent, focused on osprey_execution_results |
| `skills/accessing-osprey/SKILL.md` | Osprey system context and schema reference |
| `skills/querying-clickhouse/SKILL.md` | ClickHouse query patterns and best practices |
| `skills/conducting-investigations/SKILL.md` | Investigation methodology and correlation techniques |
| `skills/reporting-results/SKILL.md` | Report structure, B-I-N-D-Ts format, presentation |
| `servers/skywatch-mcp/src/index.ts` | MCP server entry point |
| `servers/skywatch-mcp/src/tools/` | Tool implementations (8 tools across 4 files) |

## Gotchas

- MCP server requires Bun runtime — `bun` must be on PATH
- `CLICKHOUSE_MODE` defaults to `ssh` — set to `direct` for local ClickHouse
- Ozone tools fail gracefully without credentials (clear error message)
- `content_similarity` depends on ClickHouse — recon tools work independently
- ip-api.com free tier has 45 req/min rate limit
- SSH mode requires `SSH_HOST`, `SSH_USER`, and `SSH_DOCKER_CONTAINER` to be configured
- Investigator never writes queries directly; if you see it writing SQL, something is wrong
