# Test Requirements: Skywatch Investigations Plugin

> "Automated here means shell one-liner exits 0 on pass" — or bun test.

## Automated Tests

| AC ID | Criterion | Test Type | Test File | Phase |
|-------|-----------|-----------|-----------|-------|
| AC1.4 | `clickhouse_query` rejects INSERT/UPDATE/DELETE statements with clear error | unit | `servers/skywatch-mcp/src/lib/sql-validation.test.ts` | 1 |
| AC1.5 | `clickhouse_query` rejects queries without LIMIT clause | unit | `servers/skywatch-mcp/src/lib/sql-validation.test.ts` | 1 |
| AC1.6 | `clickhouse_query` rejects queries targeting tables other than `osprey_execution_results` | unit | `servers/skywatch-mcp/src/lib/sql-validation.test.ts` | 1 |
| AC1.2 (parser) | SSH output parser returns `{columns, rows}` matching direct mode shape | unit | `servers/skywatch-mcp/src/lib/ssh-output-parser.test.ts` | 2 |
| AC2.1 | `domain_check` returns DNS records (A, AAAA, NS, MX, TXT, CNAME, SOA) and HTTP status | integration | `servers/skywatch-mcp/src/tools/domain.test.ts` (hits real DNS for `example.com`) | 3 |
| AC2.2 | `ip_lookup` returns geo (country, city, lat/lon) and network (ISP, ASN) data | integration | `servers/skywatch-mcp/src/tools/ip.test.ts` (hits ip-api.com with `8.8.8.8`) | 3 |
| AC2.3 | `url_expand` follows redirect chain and reports each hop with status code | integration | `servers/skywatch-mcp/src/tools/url.test.ts` | 3 |
| AC2.4 | `url_expand` identifies known URL shorteners (bit.ly, t.co, etc.) | unit | `servers/skywatch-mcp/src/tools/url.test.ts` (tests `isKnownShortener` pure function) | 3 |
| AC2.5 | `whois_lookup` returns registrar, creation/expiration dates, nameservers, domain age | integration + unit | `servers/skywatch-mcp/src/tools/whois.test.ts` (integration: real WHOIS; unit: `parseWhoisResponse`) | 3 |
| AC2.6 | `domain_check` with non-resolving domain returns `resolves: false` (not an error) | integration | `servers/skywatch-mcp/src/tools/domain.test.ts` | 3 |
| AC2.7 | `ip_lookup` with invalid IP format returns clear error | unit | `servers/skywatch-mcp/src/tools/ip.test.ts` (passes `"not-an-ip"`, `"999.999.999.999"`) | 3 |
| AC3.4 | `ozone_label` without configured credentials returns clear "not configured" error | unit | `servers/skywatch-mcp/src/tools/ozone.test.ts` (null config, asserts error content) | 3 |
| AC3.5 | `content_similarity` with very common text returns capped results (respects limit param) | unit | `servers/skywatch-mcp/src/tools/content.test.ts` (asserts `limit: 5` produces `LIMIT 5` in SQL) | 3 |
| AC4.1 | Each skill has valid YAML frontmatter (name, description, user-invocable) | structural | Shell: `head -5` each SKILL.md, assert frontmatter fields present | 4, 5 |
| AC6.1 | Plugin appears in marketplace.json with correct metadata | structural | Shell: `python3 -m json.tool .claude-plugin/marketplace.json` + `grep "skywatch-investigations"` | 7 |
| AC6.3 | `.mcp.json` configures server with all env vars and sensible defaults (SSH mode default) | structural | Shell: validate JSON + `grep` for `CLICKHOUSE_MODE`, `OZONE_SERVICE_URL`, `SSH_HOST` | 1, 7 |

## Human Verification

| AC ID | Criterion | Justification | Verification Approach |
|-------|-----------|---------------|----------------------|
| AC1.1 | `clickhouse_query` returns `{columns, rows}` via direct mode | Requires running ClickHouse with `osprey_execution_results` | Set `CLICKHOUSE_MODE=direct`, start MCP server, send `clickhouse_query` with `SELECT * FROM osprey_execution_results LIMIT 5`, verify response shape |
| AC1.2 | `clickhouse_query` returns same shape via SSH mode | Requires SSH access to production host with Docker ClickHouse | Set `CLICKHOUSE_MODE=ssh` with valid SSH config, repeat AC1.1 verification, compare output shapes |
| AC1.3 | `clickhouse_schema` returns column names and types | Requires live ClickHouse for `DESCRIBE TABLE` | Start MCP server, send `clickhouse_schema`, verify columns array with name+type pairs |
| AC1.7 | Switching `CLICKHOUSE_MODE` requires only env var change | Structural assertion — no functional test proves "no code changes needed" | Start server with `CLICKHOUSE_MODE=direct`, then with `CLICKHOUSE_MODE=ssh`, confirm both start without code changes |
| AC3.1 | `content_similarity` finds matching posts within threshold | Requires populated ClickHouse data with text content | Start MCP server, send `content_similarity` with known text, verify results contain user/handle/text/score fields |
| AC3.2 | `ozone_label` applies a label to a DID | Requires live Ozone instance with admin credentials | Set OZONE env vars, send `ozone_label` with `action: "apply"`, verify confirmation, check Ozone directly, clean up |
| AC3.3 | `ozone_label` removes a label from an AT-URI | Requires live Ozone instance; multi-step (apply then remove) | Apply test label first (AC3.2), then send `ozone_label` with `action: "remove"`, verify removal |
| AC4.2 | `accessing-osprey` references include complete schema | Completeness verified against live `DESCRIBE TABLE` | Compare `references/osprey-schema.md` against `DESCRIBE TABLE` output, verify all columns present |
| AC4.3 | `querying-clickhouse` references include 15+ proven query patterns | "Proven" means executed against live ClickHouse | Count query sections (`grep -c "^## " common-queries.md` >= 15), execute each against live ClickHouse |
| AC4.4 | `conducting-investigations` covers all 6 phases with tool/signal guidance | Content quality assessment | Verify 6 phase headings, each with tool references and signal descriptions |
| AC4.5 | `reporting-results` includes templates for all 4 report types | Template quality is a judgment call | Verify 4 template sections with B-I-N-D-Ts structure and placeholder content |
| AC5.1 | `data-analyst` agent loads `querying-clickhouse` skill, has ClickHouse MCP access | Agent runtime behaviour only verifiable by running it | Verify markdown references skill, then dispatch agent in Claude Code and confirm behaviour |
| AC5.2 | `investigator` agent loads both methodology skills | Agent runtime behaviour only verifiable by running it | Verify markdown references both skills, then dispatch in Claude Code |
| AC5.3 | `investigator` can dispatch `data-analyst` as subagent | Subagent dispatch is Claude Code runtime feature | Verify `Agent` in allowed-tools, then run investigator with data-requiring brief |
| AC5.4 | `investigator` has direct access to recon MCP tools | MCP tool access is runtime, not declared in allowed-tools | Verify body references recon tools, then run investigator with recon-requiring brief |
| AC6.2 | CLAUDE.md provides trigger patterns for skills and agents | Documentation review, not functional test | Verify "When to use" table maps 6+ intents to correct skills/agents |
