# Skywatch Investigations Plugin Implementation Plan — Phase 7

**Goal:** Wire everything together — finalize CLAUDE.md, add marketplace registration, verify .mcp.json configuration.

**Architecture:** Plugin integration phase. Updates the placeholder CLAUDE.md from Phase 1 with full contract documentation following the osprey-rules pattern. Adds entry to root marketplace.json. Verifies .mcp.json has all env vars with sensible defaults.

**Tech Stack:** Markdown, JSON

**Scope:** Phase 7 of 7 from original design

**Codebase verified:** 2026-03-19

---

## Acceptance Criteria Coverage

This phase implements and tests:

### skywatch-investigations-plugin.AC6: Plugin Integration
- **skywatch-investigations-plugin.AC6.1 Success:** Plugin appears in marketplace.json with correct metadata
- **skywatch-investigations-plugin.AC6.2 Success:** CLAUDE.md provides trigger patterns for when to use each skill and agent
- **skywatch-investigations-plugin.AC6.3 Success:** `.mcp.json` configures server with all env vars and sensible defaults (SSH mode default)

---

<!-- START_TASK_1 -->
### Task 1: Finalize CLAUDE.md

**Verifies:** skywatch-investigations-plugin.AC6.2

**Files:**
- Modify: `plugins/skywatch-investigations/CLAUDE.md` (replace placeholder from Phase 1)

**Implementation:**

Replace the placeholder CLAUDE.md with a full contract document following the pattern from `plugins/osprey-rules/CLAUDE.md` and `plugins/osprey-rule-investigator/CLAUDE.md`.

The CLAUDE.md should include these sections:

**Header:**
```markdown
# Skywatch Investigations Plugin

Last verified: [current date]
```

**Purpose:** Investigation toolkit for AT Protocol network analysis. Provides MCP tools for ClickHouse data access, domain/IP/URL reconnaissance, content similarity detection, and Ozone moderation labelling. Skills codify investigation methodology. Agents orchestrate the full workflow from brief to report.

**Architecture:** Three layers — MCP server (native tool access), skills (codified methodology), agents (orchestrated workflows). The investigator agent delegates ClickHouse work to a data-analyst subagent while handling recon directly.

**Contracts section:**

- **Exposes:**
  - Agent: `investigator` — investigation orchestrator, dispatches data-analyst
  - Agent: `data-analyst` — focused ClickHouse query agent
  - Skills: `accessing-osprey`, `querying-clickhouse`, `conducting-investigations`, `reporting-results`
  - MCP Tools (8): `clickhouse_query`, `clickhouse_schema`, `content_similarity`, `domain_check`, `ip_lookup`, `url_expand`, `whois_lookup`, `ozone_label`

- **Guarantees:**
  - Investigator NEVER writes ClickHouse queries directly — delegates to data-analyst
  - All ClickHouse queries are read-only (SELECT + LIMIT only, osprey_execution_results table only)
  - Ozone labelling requires explicit credentials — fails gracefully without them
  - Data-analyst always includes SQL used in its output (reproducibility)
  - Investigation reports follow B-I-N-D-Ts format

- **Expects:**
  - ClickHouse access (direct or SSH mode) configured via env vars
  - Bun runtime installed for MCP server
  - Ozone credentials (optional — only for labelling)

**Dependencies section:**
- **Uses**: ClickHouse (osprey_execution_results), ip-api.com (GeoIP), whois servers, Ozone API
- **Used by**: Any Claude Code session with this plugin installed
- **Boundary**: Does NOT overlap with osprey-rules plugin (rule writing) or osprey-rule-investigator (rule project analysis). The `accessing-osprey` skill provides context about the Osprey system but directs users to osprey-rules for rule authoring.

**When to use section (trigger patterns):**

| User intent | Use |
|-------------|-----|
| "Investigate these accounts" | `investigator` agent |
| "Find accounts triggered by rule X" | `data-analyst` agent or `investigator` |
| "What does the osprey schema look like?" | `accessing-osprey` skill |
| "How do I query ClickHouse effectively?" | `querying-clickhouse` skill |
| "Conduct a full investigation" | `investigator` agent (loads methodology automatically) |
| "Write a report on these findings" | `reporting-results` skill |

**Key Files section:**

Table of all significant files with their purpose.

**Gotchas section:**
- MCP server requires Bun runtime — `bun` must be on PATH
- `CLICKHOUSE_MODE` defaults to `ssh` — set to `direct` for local ClickHouse
- Ozone tools fail gracefully without credentials (clear error message)
- `content_similarity` depends on ClickHouse — recon tools work independently
- ip-api.com free tier has 45 req/min rate limit

**Step 1: Verify**

Run: `grep -c "##" plugins/skywatch-investigations/CLAUDE.md`
Expected: 6+ section headings

Run: `grep "investigator\|data-analyst" plugins/skywatch-investigations/CLAUDE.md | wc -l`
Expected: 5+ references to both agents

**Commit:** `docs: finalize skywatch-investigations CLAUDE.md with full contracts`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Add marketplace.json entry

**Verifies:** skywatch-investigations-plugin.AC6.1

**Files:**
- Modify: `/Users/scarndp/dev/skywatch/claude-skills/.claude-plugin/marketplace.json` (add entry after the last item in the `plugins` array)

**Implementation:**

Add a new entry to the `plugins` array in `.claude-plugin/marketplace.json`. Insert after the osprey-rule-investigator entry (line 49), before the closing `]` bracket.

New entry:
```json
{
  "name": "skywatch-investigations",
  "source": "./plugins/skywatch-investigations",
  "description": "Investigation toolkit for AT Protocol network analysis — MCP tools for ClickHouse data access, domain/IP/URL recon, content similarity, and Ozone labelling, with skills codifying investigation methodology and agents orchestrating the full workflow.",
  "version": "0.1.0",
  "author": {
    "name": "Skywatch Blue"
  },
  "license": "MIT",
  "keywords": [
    "skywatch",
    "investigations",
    "atproto",
    "clickhouse",
    "recon",
    "ozone",
    "moderation"
  ]
}
```

Ensure:
- Version matches `plugin.json` version (`0.1.0`)
- Author matches existing entries (`Skywatch Blue`)
- License matches existing entries (`MIT`)
- Keywords match `plugin.json` keywords
- Add trailing comma after the last existing entry's `}` in the plugins array before inserting the new entry

**Step 1: Verify JSON is valid**

Run: `cd /Users/scarndp/dev/skywatch/claude-skills && python3 -m json.tool .claude-plugin/marketplace.json > /dev/null`
Expected: No errors (valid JSON)

Run: `grep -c '"skywatch-investigations"' .claude-plugin/marketplace.json`
Expected: 1

**Commit:** `feat: register skywatch-investigations in marketplace.json`
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Verify and finalize .mcp.json

**Verifies:** skywatch-investigations-plugin.AC6.3

**Files:**
- Modify: `plugins/skywatch-investigations/.mcp.json` (verify and update if needed — created in Phase 1 Task 6)

**Implementation:**

Review the `.mcp.json` created in Phase 1 and verify it includes all env vars from all phases:

Required env vars:
- `CLICKHOUSE_MODE` — default `"ssh"` (design specifies SSH as default)
- `CLICKHOUSE_HOST` — default `"http://localhost"`
- `CLICKHOUSE_PORT` — default `"8123"`
- `CLICKHOUSE_USER` — default `"default"`
- `CLICKHOUSE_PASSWORD` — default `""`
- `CLICKHOUSE_DATABASE` — default `"default"`
- `SSH_HOST` — default `""` (no default — user must configure for SSH mode)
- `SSH_USER` — default `""` (no default — user must configure for SSH mode)
- `SSH_DOCKER_CONTAINER` — default `""` (no default — user must configure)
- `OZONE_SERVICE_URL` — default `""` (optional — labelling only)
- `OZONE_ADMIN_PASSWORD` — default `""` (optional — labelling only)
- `OZONE_DID` — default `""` (optional — labelling only)

Verify the `command` and `args` are correct for Bun:
```json
"command": "bun",
"args": ["run", "servers/skywatch-mcp/src/index.ts"]
```

Verify `cwd` is relative to the plugin root.

If the .mcp.json from Phase 1 already has all of this, mark as no changes needed. If any env vars are missing, add them.

**Step 1: Verify**

Run: `cd /Users/scarndp/dev/skywatch/claude-skills && python3 -m json.tool plugins/skywatch-investigations/.mcp.json > /dev/null`
Expected: No errors (valid JSON)

Run: `grep -c "CLICKHOUSE_MODE\|OZONE_SERVICE_URL\|SSH_HOST" plugins/skywatch-investigations/.mcp.json`
Expected: 3 (all three key env vars present)

**Commit (only if changes made):** `chore: finalize .mcp.json env var configuration`
<!-- END_TASK_3 -->
