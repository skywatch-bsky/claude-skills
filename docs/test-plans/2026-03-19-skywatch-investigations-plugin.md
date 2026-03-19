# Human Test Plan: Skywatch Investigations Plugin

## Prerequisites

- Bun runtime installed (`bun --version`)
- `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test` passing (86 automated tests green)
- SSH access to a host running ClickHouse in Docker (for SSH mode)
- Local or remote ClickHouse with `osprey_execution_results` table populated
- Ozone instance with admin credentials (for labelling tests)
- Claude Code installed with skywatch-investigations plugin enabled

## Phase 1: ClickHouse Data Access

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Set `CLICKHOUSE_MODE=direct` in `.mcp.json`, configure `CLICKHOUSE_HOST`/`CLICKHOUSE_PORT` to a running ClickHouse instance. Start the MCP server via `bun run servers/skywatch-mcp/src/index.ts`. | Server starts without errors |
| 1.2 | Send `clickhouse_query` with `{"sql": "SELECT * FROM osprey_execution_results LIMIT 5"}` | Response contains `columns` array (each with `name` and `type`) and `rows` array (each row is an object keyed by column name). No errors. |
| 1.3 | Send `clickhouse_schema` with no input | Response contains columns array where each entry has `name` (string) and `type` (string, e.g. "String", "UInt64", "DateTime") |
| 1.4 | Change `CLICKHOUSE_MODE=ssh` in `.mcp.json`, set `SSH_HOST`, `SSH_USER`, `SSH_DOCKER_CONTAINER`. Restart server. | Server starts without errors, no code changes required |
| 1.5 | Repeat step 1.2 with SSH mode | Response shape is identical to step 1.2 — same `{columns, rows}` structure. Compare a few column names and types to confirm parity. |
| 1.6 | Repeat step 1.3 with SSH mode | Same schema output as direct mode |

## Phase 2: Recon Tools (Live Network)

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Send `domain_check` with `{"domain": "bsky.app"}` | `resolves: true`, non-empty A records, NS records present, HTTP status object with status code (likely 200 or 301) |
| 2.2 | Send `ip_lookup` with `{"ip": "1.1.1.1"}` | Geo data shows country, city present, lat/lon are numbers. Network shows ISP containing "Cloudflare", ASN present. |
| 2.3 | Send `url_expand` with `{"url": "https://t.co/<known-link>"}` (use a real t.co short link) | Response shows hops array with at least 2 entries, each hop has a status code (301/302), final destination URL differs from input |
| 2.4 | Send `whois_lookup` with `{"domain": "bsky.app"}` | Response contains registrar name, creation date, nameservers array with entries, domain age in days as a number |

## Phase 3: Content Similarity + Ozone

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | With ClickHouse connected, send `content_similarity` with `{"text": "follow me for free followers", "limit": 5}` | Response contains up to 5 results, each with user/handle/text/score fields. Score is a float between 0 and 1. Results ordered by score ascending (most similar first). |
| 3.2 | Set `OZONE_SERVICE_URL`, `OZONE_ADMIN_PASSWORD`, `OZONE_DID` to valid Ozone credentials. Send `ozone_label` with `{"subject": "did:plc:<test-did>", "label": "test-label", "action": "apply"}` | Confirmation response (not an error). Verify in Ozone admin UI that the label was applied. |
| 3.3 | Send `ozone_label` with `{"subject": "did:plc:<test-did>", "label": "test-label", "action": "remove"}` | Confirmation response. Verify in Ozone admin UI that the label was removed. Clean up complete. |

## Phase 4: Skills Content Quality

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Compare `skills/accessing-osprey/references/osprey-schema.md` against `DESCRIBE TABLE osprey_execution_results` output from live ClickHouse. | All columns from live schema are documented. No stale/missing columns. |
| 4.2 | Count query pattern sections in `skills/querying-clickhouse/references/common-queries.md`. | At least 15 distinct query pattern sections with runnable SQL examples. |
| 4.3 | Execute 3-5 of the query patterns from step 4.2 against live ClickHouse via `clickhouse_query`. | Queries execute without syntax errors. Results match the described purpose. |
| 4.4 | Verify `skills/conducting-investigations/SKILL.md` has 6 phase headings. | 6 phases present (Discovery, Characterisation, Linkage, Amplification Mapping, Rule Validation, Reporting). Each references specific tools and describes signals. |
| 4.5 | Verify `skills/reporting-results/references/report-templates.md` has 4 report type templates. | 4 templates (memo, cell deep-dive, cross-cell, rule check). Each follows B-I-N-D-Ts structure. |

## Phase 5: Agent Behaviour

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | In Claude Code, dispatch `data-analyst` agent with: "How many distinct rules triggered in the last 24 hours?" | Agent loads `querying-clickhouse` skill, uses `clickhouse_query` MCP tool, returns answer with the SQL it used. |
| 5.2 | Dispatch `investigator` agent with: "Investigate did:plc:\<known-suspicious-did\>" | Agent loads `conducting-investigations` and `reporting-results` skills. Delegates ClickHouse queries to `data-analyst` subagent. Uses recon tools directly. |
| 5.3 | Verify investigator does NOT write SQL directly during step 5.2. | All SQL queries appear inside `data-analyst` subagent calls, never in the investigator's own tool calls. |
| 5.4 | Dispatch investigator with: "Check the domain registrations for accounts that triggered rule X in the last week" | Investigator dispatches data-analyst for account lookup, then calls `domain_check`/`whois_lookup` directly for recon. |

## Phase 6: Plugin Metadata + Documentation

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Review `CLAUDE.md` "When to Use" table. | Maps at least 6 user intents to correct skills/agents. |

## End-to-End: Full Investigation Workflow

1. In Claude Code with skywatch-investigations plugin active and ClickHouse + Ozone configured
2. Send to investigator agent: "Investigate accounts that triggered the spam-network rule more than 10 times this week. Check their domains and IP addresses. Produce a memo report."
3. Verify: data-analyst is dispatched to query ClickHouse (SQL visible in output)
4. Verify: investigator calls `domain_check` and/or `whois_lookup` on domains found
5. Verify: investigator calls `ip_lookup` on any IPs found
6. Verify: final output follows B-I-N-D-Ts memo format
7. Verify: report is placed in the expected directory per skill conventions

## End-to-End: Graceful Degradation

1. Remove all Ozone env vars (set to empty strings). Restart MCP server.
2. Send `ozone_label` request. Verify: "not configured" error, NOT a crash.
3. Disconnect ClickHouse (stop service or use invalid host). Send `clickhouse_query`.
4. Verify: clear connection error message, not an unhandled exception.
5. Send `domain_check` with `{"domain": "example.com"}`. Verify: recon tools still work independently.

## Traceability

| AC | Automated Test | Manual Step |
|----|----------------|-------------|
| AC1.1 | — | Phase 1, 1.1-1.2 |
| AC1.2 | `ssh-output-parser.test.ts` (parser) | Phase 1, 1.4-1.5 (e2e) |
| AC1.3 | — | Phase 1, 1.3 |
| AC1.4 | `sql-validation.test.ts` | — |
| AC1.5 | `sql-validation.test.ts` | — |
| AC1.6 | `sql-validation.test.ts` | — |
| AC1.7 | — | Phase 1, 1.1 vs 1.4 |
| AC2.1 | `domain.test.ts` | Phase 2, 2.1 |
| AC2.2 | `ip.test.ts` | Phase 2, 2.2 |
| AC2.3 | `url.test.ts` | Phase 2, 2.3 |
| AC2.4 | `url.test.ts` | — |
| AC2.5 | `whois.test.ts` | Phase 2, 2.4 |
| AC2.6 | `domain.test.ts` | — |
| AC2.7 | `ip.test.ts` | — |
| AC3.1 | — | Phase 3, 3.1 |
| AC3.2 | — | Phase 3, 3.2 |
| AC3.3 | — | Phase 3, 3.3 |
| AC3.4 | `ozone.test.ts` | — |
| AC3.5 | `content.test.ts` | — |
| AC4.1 | Structural | — |
| AC4.2 | — | Phase 4, 4.1 |
| AC4.3 | — | Phase 4, 4.2-4.3 |
| AC4.4 | — | Phase 4, 4.4 |
| AC4.5 | — | Phase 4, 4.5 |
| AC5.1 | — | Phase 5, 5.1 |
| AC5.2 | — | Phase 5, 5.2 |
| AC5.3 | — | Phase 5, 5.3 |
| AC5.4 | — | Phase 5, 5.4 |
| AC6.1 | Structural | — |
| AC6.2 | — | Phase 6, 6.1 |
| AC6.3 | Structural | — |
