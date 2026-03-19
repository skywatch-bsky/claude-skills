# Skywatch Investigations Plugin Design

## Summary

The Skywatch Investigations plugin packages the AT Protocol investigation workflow into a self-contained Claude Code plugin. It bundles an MCP server that exposes eight native tools — covering ClickHouse data access, domain/IP/URL reconnaissance, content similarity detection, and Ozone moderation labelling — alongside four skills that codify investigation methodology as loadable reference material, and two agents that orchestrate the full workflow from brief to report.

The central design decision is layering: the MCP server gives Claude raw tool access, the skills give it institutional knowledge (schema references, query cookbooks, investigation phases, report templates), and the agents compose those layers into coherent workflows. The `investigator` agent delegates all ClickHouse work to a `data-analyst` subagent while handling recon directly, keeping concerns cleanly separated. ClickHouse connectivity is abstracted behind a single interface that supports both direct HTTP and SSH-via-docker-exec modes, switchable by environment variable alone — no code changes needed when moving between local and production environments.

## Definition of Done

1. A new `skywatch-investigations` plugin exists in `plugins/skywatch-investigations/` containing an MCP server, 4 skills, and 2 agents that together enable conducting AT Protocol network investigations from Claude Code — from ClickHouse data extraction through recon through structured reporting.

2. The MCP server exposes 8 tools (ClickHouse query/schema, content similarity, domain check, IP lookup, URL expansion, whois lookup, ozone labelling) as native Claude Code tools via stdio transport, with configurable ClickHouse connectivity (direct or SSH fallback).

3. The 4 skills codify the investigation workflow: accessing Osprey infrastructure, querying ClickHouse effectively, conducting multi-phase investigations, and formatting results into structured reports.

4. The 2 agents (data-analyst and investigator) orchestrate the skills and MCP tools — the data-analyst handles ClickHouse queries, the investigator runs full investigations by delegating data work to the data-analyst and using recon tools directly.

5. The plugin is general-purpose: configurable via environment variables, usable by anyone with appropriate Osprey/ClickHouse access, not hardcoded to a specific user's environment.

## Acceptance Criteria

### skywatch-investigations-plugin.AC1: MCP Server & ClickHouse Tools
- **skywatch-investigations-plugin.AC1.1 Success:** `clickhouse_query` with valid SELECT + LIMIT returns `{columns, rows}` via direct mode
- **skywatch-investigations-plugin.AC1.2 Success:** `clickhouse_query` with valid SELECT + LIMIT returns same shape via SSH mode
- **skywatch-investigations-plugin.AC1.3 Success:** `clickhouse_schema` returns column names and types for `osprey_execution_results`
- **skywatch-investigations-plugin.AC1.4 Failure:** `clickhouse_query` rejects INSERT/UPDATE/DELETE statements with clear error
- **skywatch-investigations-plugin.AC1.5 Failure:** `clickhouse_query` rejects queries without LIMIT clause
- **skywatch-investigations-plugin.AC1.6 Failure:** `clickhouse_query` rejects queries targeting tables other than `osprey_execution_results`
- **skywatch-investigations-plugin.AC1.7 Edge:** Switching `CLICKHOUSE_MODE` between direct/ssh requires only env var change, no code changes

### skywatch-investigations-plugin.AC2: Recon Tools
- **skywatch-investigations-plugin.AC2.1 Success:** `domain_check` returns DNS records (A, AAAA, NS, MX, TXT, CNAME, SOA) and HTTP status
- **skywatch-investigations-plugin.AC2.2 Success:** `ip_lookup` returns geo (country, city, lat/lon) and network (ISP, ASN) data
- **skywatch-investigations-plugin.AC2.3 Success:** `url_expand` follows redirect chain and reports each hop with status code
- **skywatch-investigations-plugin.AC2.4 Success:** `url_expand` identifies known URL shorteners (bit.ly, t.co, etc.)
- **skywatch-investigations-plugin.AC2.5 Success:** `whois_lookup` returns registrar, creation/expiration dates, nameservers, domain age
- **skywatch-investigations-plugin.AC2.6 Failure:** `domain_check` with non-resolving domain returns `resolves: false` (not an error)
- **skywatch-investigations-plugin.AC2.7 Failure:** `ip_lookup` with invalid IP format returns clear error

### skywatch-investigations-plugin.AC3: Content & Ozone Tools
- **skywatch-investigations-plugin.AC3.1 Success:** `content_similarity` finds matching posts within threshold, returns user/handle/text/score
- **skywatch-investigations-plugin.AC3.2 Success:** `ozone_label` applies a label to a DID and returns confirmation
- **skywatch-investigations-plugin.AC3.3 Success:** `ozone_label` removes a label from an AT-URI and returns confirmation
- **skywatch-investigations-plugin.AC3.4 Failure:** `ozone_label` without configured credentials returns clear "not configured" error
- **skywatch-investigations-plugin.AC3.5 Edge:** `content_similarity` with very common text returns capped results (respects limit param)

### skywatch-investigations-plugin.AC4: Skills
- **skywatch-investigations-plugin.AC4.1 Success:** Each skill has valid YAML frontmatter (name, description, user-invocable)
- **skywatch-investigations-plugin.AC4.2 Success:** `accessing-osprey` references include complete schema for `osprey_execution_results`
- **skywatch-investigations-plugin.AC4.3 Success:** `querying-clickhouse` references include 15+ proven query patterns from real investigations
- **skywatch-investigations-plugin.AC4.4 Success:** `conducting-investigations` covers all 6 phases with per-phase tool and signal guidance
- **skywatch-investigations-plugin.AC4.5 Success:** `reporting-results` includes templates for memo, cell deep-dive, cross-cell, and rule check report types

### skywatch-investigations-plugin.AC5: Agents
- **skywatch-investigations-plugin.AC5.1 Success:** `data-analyst` agent loads `querying-clickhouse` skill and has access to ClickHouse MCP tools
- **skywatch-investigations-plugin.AC5.2 Success:** `investigator` agent loads `conducting-investigations` and `reporting-results` skills
- **skywatch-investigations-plugin.AC5.3 Success:** `investigator` can dispatch `data-analyst` as a subagent
- **skywatch-investigations-plugin.AC5.4 Success:** `investigator` has direct access to recon MCP tools (domain, IP, URL, whois)

### skywatch-investigations-plugin.AC6: Plugin Integration
- **skywatch-investigations-plugin.AC6.1 Success:** Plugin appears in marketplace.json with correct metadata
- **skywatch-investigations-plugin.AC6.2 Success:** CLAUDE.md provides trigger patterns for when to use each skill and agent
- **skywatch-investigations-plugin.AC6.3 Success:** `.mcp.json` configures server with all env vars and sensible defaults (SSH mode default)

## Glossary

- **AT Protocol**: The decentralised social networking protocol underlying Bluesky and related platforms. Defines identity (DIDs), data storage (PDSes), and the record/lexicon system used throughout this plugin.
- **Osprey**: Skywatch's internal moderation rule engine. Evaluates AT Protocol content against defined rules and writes execution results to a ClickHouse table (`osprey_execution_results`) for downstream analysis.
- **Ozone**: The AT Protocol moderation service layer. This plugin's `ozone_label` tool writes to an Ozone instance to apply or remove moderation labels on accounts or content.
- **ClickHouse**: A column-oriented OLAP database used to store Osprey's rule execution results. Queried via HTTP (`@clickhouse/client`) or SSH + `docker exec`, depending on deployment context.
- **MCP (Model Context Protocol)**: Anthropic's open protocol for exposing tools to Claude. An MCP server registers tools; Claude Code invokes them natively during inference. This plugin uses stdio transport.
- **stdio transport**: MCP communication over standard input/output. The MCP server runs as a local subprocess; Claude Code communicates with it via stdin/stdout rather than over a network socket.
- **DID (Decentralised Identifier)**: The stable, portable identity primitive in AT Protocol. Used as subject identifiers when applying Ozone labels.
- **AT-URI**: A URI scheme for addressing records within the AT Protocol network (e.g. `at://did:plc:.../app.bsky.feed.post/...`). Also a valid subject for Ozone labels.
- **ngramDistance**: A ClickHouse string similarity function used by `content_similarity` to detect near-duplicate posts (copypasta). Returns a score between 0 (identical) and 1 (completely dissimilar).
- **Subagent**: A Claude Code agent dispatched by another agent to handle a scoped subtask. The `investigator` dispatches `data-analyst` as a subagent for ClickHouse work.
- **Cell**: Investigation terminology for a coordinated cluster of accounts operating as a unit (shared infrastructure, behaviour, content). The reporting skill includes cell-level report templates.
- **B-I-N-D-Ts**: A structured report format used in Skywatch investigations — Bottom line, Impact, Next steps, Details, Timestamps.
- **ASN (Autonomous System Number)**: A routing identifier for a block of IP addresses, assigned to an organisation or ISP. Returned by `ip_lookup` and used for infrastructure correlation.
- **YAML frontmatter**: A block of YAML metadata at the top of a Markdown file (delimited by `---`). Skills use it to declare name, description, and invocability.
- **Marketplace**: The plugin registry (`marketplace.json`) at the repo root that makes plugins discoverable within Claude Code's plugin system.
- **GeoIP**: The practice of mapping an IP address to a geographic location. The `ip_lookup` tool uses ip-api.com for this.
- **Copypasta**: Identical or near-identical text posted across multiple accounts — a signal of coordinated inauthentic behaviour. Detected via `content_similarity`.
- **PDS (Personal Data Server)**: AT Protocol server that stores a user's data. PDS host concentration is an investigation signal for coordinated networks.

## Architecture

Single Claude Code plugin providing three layers: native tool access (MCP server), codified methodology (skills), and orchestrated workflows (agents).

### MCP Server

TypeScript/Bun stdio server at `servers/skywatch-mcp/`. Registers 8 tools:

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `clickhouse_query` | Execute SQL against Osprey ClickHouse | `sql` (string), enforces SELECT + LIMIT |
| `clickhouse_schema` | Fetch table column definitions | none |
| `content_similarity` | Find similar posts via ngramDistance | `text`, `threshold?` (0.4), `limit?` (20) |
| `domain_check` | DNS + HTTP reconnaissance | `domain` |
| `ip_lookup` | GeoIP + ASN lookup | `ip` |
| `url_expand` | Follow redirect chains | `url` |
| `whois_lookup` | Domain registration data | `domain` |
| `ozone_label` | Apply or remove moderation label | `subject` (DID/AT-URI), `label`, `action` (apply/remove) |

**ClickHouse connectivity** is config-driven:
- `CLICKHOUSE_MODE=direct` — connects via `@clickhouse/client` HTTP protocol
- `CLICKHOUSE_MODE=ssh` (default) — shells out via SSH + docker exec, matching current operational pattern

Both modes share the same tool interface. The `clickhouse-client.ts` module abstracts the connection strategy behind a common `query(sql): Promise<{columns, rows}>` interface.

**Security constraints on `clickhouse_query`:**
- Rejects non-SELECT statements (no mutations)
- Requires LIMIT clause (prevents runaway queries)
- Validates table name is `default.osprey_execution_results`
- Query timeout of 60 seconds

### Skills

Four skills providing methodology and reference material:

1. **`accessing-osprey/`** — Understanding the Osprey moderation infrastructure
2. **`querying-clickhouse/`** — Query patterns, schema reference, safety rules
3. **`conducting-investigations/`** — 6-phase investigation methodology
4. **`reporting-results/`** — Report formats, templates, output conventions

Skills are loaded by agents automatically and can be invoked manually when working outside the agent workflow.

### Agents

Two agents with a delegation relationship:

**`data-analyst`** — Focused ClickHouse query agent. Receives a research question, formulates queries, executes via MCP tools, returns structured findings with the SQL used. Loads `querying-clickhouse` skill.

**`investigator`** — Investigation orchestrator. Takes an investigation brief, coordinates data gathering (delegating to data-analyst), performs recon (domain/IP/URL/whois tools directly), synthesizes findings, and produces formatted reports. Loads `conducting-investigations` and `reporting-results` skills. Dispatches `data-analyst` as a subagent for data work.

```
User → investigator
         ├── data-analyst (ClickHouse queries)
         ├── MCP tools (recon: domain, IP, URL, whois)
         ├── MCP tools (content similarity)
         └── Formatted report output
```

### Data Flow

1. User provides investigation brief (target accounts, suspicious signals, or a lead)
2. Investigator plans phases based on `conducting-investigations` methodology
3. Data extraction: investigator dispatches data-analyst for ClickHouse queries
4. Recon: investigator uses domain/IP/URL/whois tools directly for infrastructure analysis
5. Content analysis: investigator uses content_similarity for copypasta detection
6. Synthesis: investigator correlates findings across data sources
7. Output: investigator produces report following `reporting-results` conventions

## Existing Patterns

Investigation found two existing plugins in this repo (`osprey-rules`, `osprey-rule-investigator`). This design follows their established patterns:

- Plugin structure: `.claude-plugin/plugin.json`, `CLAUDE.md`, `agents/`, `skills/` directories
- Skill format: `SKILL.md` with YAML frontmatter (name, description, user-invocable), optional `references/` subdirectory
- Agent format: Markdown files in `agents/` with model, description, and tool access declarations
- Marketplace registration: entry in root `.claude-plugin/marketplace.json`

**New pattern: MCP server bundled in plugin.** Neither existing plugin includes an MCP server. This design introduces `servers/` directory and `.mcp.json` at plugin root. This follows the Claude Code plugin MCP convention (`.mcp.json` at plugin root, stdio transport, env var configuration).

**No divergence from existing skill/agent patterns** — the new skills and agents follow the same structure as `osprey-rules`.

## Implementation Phases

<!-- START_PHASE_1 -->
### Phase 1: Plugin Scaffold & MCP Server Foundation
**Goal:** Create the plugin structure and a working MCP server with the ClickHouse tools (direct mode only).

**Components:**
- `plugins/skywatch-investigations/.claude-plugin/plugin.json` — plugin manifest
- `plugins/skywatch-investigations/.mcp.json` — MCP server configuration
- `plugins/skywatch-investigations/CLAUDE.md` — plugin-level directives
- `plugins/skywatch-investigations/servers/skywatch-mcp/package.json` — Bun project with dependencies (@modelcontextprotocol/sdk, @clickhouse/client, zod)
- `plugins/skywatch-investigations/servers/skywatch-mcp/tsconfig.json`
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/index.ts` — server entry, McpServer setup, stdio transport
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/clickhouse-client.ts` — ClickHouse connection abstraction (direct mode)
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/clickhouse.ts` — `clickhouse_query` and `clickhouse_schema` tool handlers

**Dependencies:** None (first phase)

**Done when:** `bun run src/index.ts` starts the MCP server, `clickhouse_query` executes a SELECT against a ClickHouse instance, `clickhouse_schema` returns column definitions. Server rejects non-SELECT queries and queries without LIMIT.
<!-- END_PHASE_1 -->

<!-- START_PHASE_2 -->
### Phase 2: SSH Fallback for ClickHouse
**Goal:** Add SSH connection mode so the MCP server works with the current sys2 + docker exec operational pattern.

**Components:**
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/ssh-client.ts` — SSH + docker exec wrapper
- Updates to `clickhouse-client.ts` — config-driven strategy selection (direct vs SSH based on `CLICKHOUSE_MODE` env var)

**Dependencies:** Phase 1 (ClickHouse direct mode)

**Done when:** With `CLICKHOUSE_MODE=ssh`, queries execute via SSH + docker exec and return the same `{columns, rows}` shape as direct mode. Switching between modes requires only changing the env var.
<!-- END_PHASE_2 -->

<!-- START_PHASE_3 -->
### Phase 3: Recon & Content Tools
**Goal:** Add the remaining 6 MCP tools (content similarity, domain, IP, URL, whois, ozone).

**Components:**
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/content.ts` — `content_similarity` (ngramDistance query against ClickHouse)
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/domain.ts` — `domain_check` (DNS + HTTP recon)
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ip.ts` — `ip_lookup` (GeoIP via ip-api.com)
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/url.ts` — `url_expand` (redirect chain follower)
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/whois.ts` — `whois_lookup` (domain registration)
- `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts` — `ozone_label` (apply/remove labels via Ozone API)

**Dependencies:** Phase 1 (server foundation), Phase 2 (SSH mode, since content_similarity queries ClickHouse)

**Done when:** All 8 MCP tools are registered and functional. Domain check resolves DNS records, IP lookup returns geo/ASN data, URL expand follows redirects, whois returns registration data, content similarity finds matching posts, ozone label applies/removes labels.
<!-- END_PHASE_3 -->

<!-- START_PHASE_4 -->
### Phase 4: Osprey Access & ClickHouse Skills
**Goal:** Write the first two skills — `accessing-osprey` and `querying-clickhouse` — with reference materials.

**Components:**
- `plugins/skywatch-investigations/skills/accessing-osprey/SKILL.md` — Osprey infrastructure guide (what it is, server topology, config structure, relationship to ozone, UDF overview)
- `plugins/skywatch-investigations/skills/accessing-osprey/references/osprey-schema.md` — full column listing for `osprey_execution_results` with types and descriptions
- `plugins/skywatch-investigations/skills/querying-clickhouse/SKILL.md` — query patterns, safety rules, performance tips, column reference
- `plugins/skywatch-investigations/skills/querying-clickhouse/references/common-queries.md` — cookbook of ~15-20 proven query patterns extracted from existing investigations

**Dependencies:** None (skills are documentation, not code)

**Done when:** Both skills are complete with YAML frontmatter, reference files exist with accurate schema and query patterns derived from real investigation queries.
<!-- END_PHASE_4 -->

<!-- START_PHASE_5 -->
### Phase 5: Investigation & Reporting Skills
**Goal:** Write the investigation methodology and reporting skills.

**Components:**
- `plugins/skywatch-investigations/skills/conducting-investigations/SKILL.md` — 6-phase methodology (Discovery, Characterization, Linkage, Amplification Mapping, Rule Validation, Reporting), per-phase tool guidance, evidence standards, directory conventions
- `plugins/skywatch-investigations/skills/conducting-investigations/references/investigation-checklist.md` — per-phase checklist of signals and documentation requirements
- `plugins/skywatch-investigations/skills/reporting-results/SKILL.md` — report types, B-I-N-D-Ts format, data presentation, graph generation conventions
- `plugins/skywatch-investigations/skills/reporting-results/references/report-templates.md` — skeleton templates for each report type (memo, cell deep-dive, cross-cell, rule check)

**Dependencies:** None (skills are documentation)

**Done when:** Both skills are complete. Investigation skill covers all 6 phases with actionable guidance. Reporting skill includes templates for all report types used in the existing investigations.
<!-- END_PHASE_5 -->

<!-- START_PHASE_6 -->
### Phase 6: Agents
**Goal:** Create the data-analyst and investigator agents.

**Components:**
- `plugins/skywatch-investigations/agents/data-analyst.md` — ClickHouse-focused agent, loads querying-clickhouse skill, iterative query pattern, structured output with SQL
- `plugins/skywatch-investigations/agents/investigator.md` — investigation orchestrator, loads conducting-investigations + reporting-results skills, delegates to data-analyst, uses recon tools directly, produces formatted reports

**Dependencies:** Phase 4 (skills the agents load), Phase 5 (skills the agents load)

**Done when:** Both agent definitions are complete with model selection, tool access declarations, skill loading instructions, and behavioural guidance. Investigator correctly describes delegation to data-analyst.
<!-- END_PHASE_6 -->

<!-- START_PHASE_7 -->
### Phase 7: Plugin Integration & Marketplace
**Goal:** Wire everything together — CLAUDE.md, marketplace registration, plugin-level configuration.

**Components:**
- `plugins/skywatch-investigations/CLAUDE.md` — plugin directives: when to use which skill, agent dispatch guidance, MCP tool overview, relationship to osprey-rules plugin
- Root `.claude-plugin/marketplace.json` — add skywatch-investigations entry
- `plugins/skywatch-investigations/.mcp.json` — finalize env var configuration with sensible defaults

**Dependencies:** All previous phases

**Done when:** Plugin appears in marketplace listing, CLAUDE.md provides clear guidance for skill/agent selection, `.mcp.json` configures the server with all required env vars and defaults.
<!-- END_PHASE_7 -->

## Additional Considerations

**Content similarity depends on ClickHouse.** The `content_similarity` tool runs an ngramDistance query against `osprey_execution_results`, so it requires a working ClickHouse connection. If ClickHouse is unavailable, this tool fails while the other recon tools (domain, IP, URL, whois) continue to work independently.

**Ozone labelling requires separate auth.** The `ozone_label` tool needs `OZONE_SERVICE_URL` and `OZONE_ADMIN_PASSWORD` env vars. These are intentionally separate from ClickHouse config since not all users will have ozone write access. The tool returns a clear error if credentials are not configured.

**Relationship to existing plugins.** This plugin complements but does not overlap with `osprey-rules` (rule authoring) or `osprey-rule-investigator` (rule project analysis). The `accessing-osprey` skill provides context about the Osprey system but does not teach rule writing — it directs users to the osprey-rules plugin for that.
