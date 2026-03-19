# Skywatch Investigations Plugin Implementation Plan — Phase 4

**Goal:** Write the first two skills — `accessing-osprey` and `querying-clickhouse` — with reference materials derived from live ClickHouse data.

**Architecture:** Skills are markdown documentation files following the established pattern from osprey-rules plugin: `SKILL.md` with 3-field YAML frontmatter (`name`, `description`, `user-invocable`), optional `references/` subdirectory with markdown reference files.

**Tech Stack:** Markdown, YAML frontmatter. Requires live ClickHouse access (via the MCP server from Phases 1-2) to extract schema and build query patterns.

**Scope:** Phase 4 of 7 from original design

**Codebase verified:** 2026-03-19

---

## Acceptance Criteria Coverage

This phase implements and tests:

### skywatch-investigations-plugin.AC4: Skills
- **skywatch-investigations-plugin.AC4.1 Success:** Each skill has valid YAML frontmatter (name, description, user-invocable) — for accessing-osprey and querying-clickhouse
- **skywatch-investigations-plugin.AC4.2 Success:** `accessing-osprey` references include complete schema for `osprey_execution_results`
- **skywatch-investigations-plugin.AC4.3 Success:** `querying-clickhouse` references include 15+ proven query patterns from real investigations

---

## Prerequisites

This phase requires a working ClickHouse connection. Before starting:

1. Ensure the MCP server from Phases 1-2 is functional
2. Have `CLICKHOUSE_MODE` configured (direct or ssh) with valid credentials
3. The executor must be able to run queries against the live `osprey_execution_results` table

**Fallback if ClickHouse is unavailable:** If live ClickHouse access cannot be established, create the skill structure with placeholder content marked `<!-- TODO: populate from live ClickHouse -->` in the schema reference and query patterns. The skill files and frontmatter can still be completed. Revisit this phase when access is available.

---

<!-- START_TASK_1 -->
### Task 1: Extract ClickHouse schema from live database

**Verifies:** skywatch-investigations-plugin.AC4.2 (data gathering step)

**Files:**
- No files created — this task gathers data for Task 2

**Step 1: Query the table schema**

Use the `clickhouse_schema` MCP tool (or run directly):

```sql
DESCRIBE TABLE default.osprey_execution_results
```

This returns all column names and their ClickHouse types.

**Step 2: Query sample data for context**

Run a few exploratory queries to understand column semantics:

```sql
SELECT * FROM default.osprey_execution_results LIMIT 5
```

```sql
SELECT DISTINCT rule_name FROM default.osprey_execution_results LIMIT 50
```

```sql
SELECT count() as total, min(created_at) as earliest, max(created_at) as latest FROM default.osprey_execution_results LIMIT 1
```

**Step 3: Document findings**

Record:
- Every column name, ClickHouse type, and a description of what the column contains (inferred from data)
- Which columns are commonly used in WHERE clauses
- Which columns contain AT Protocol identifiers (DIDs, AT-URIs, handles)
- Data volume and time range

This data feeds directly into Task 2 (schema reference file) and Task 4 (query patterns).

**No commit** — data gathering only.
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create accessing-osprey skill

**Verifies:** skywatch-investigations-plugin.AC4.1, skywatch-investigations-plugin.AC4.2

**Files:**
- Create: `plugins/skywatch-investigations/skills/accessing-osprey/SKILL.md`
- Create: `plugins/skywatch-investigations/skills/accessing-osprey/references/osprey-schema.md`

**Step 1: Create SKILL.md**

Create `plugins/skywatch-investigations/skills/accessing-osprey/SKILL.md` with:

```yaml
---
name: accessing-osprey
description: Understanding the Osprey moderation infrastructure — system architecture, ClickHouse data access, schema reference, and relationship to Ozone labelling. Use when investigating AT Protocol accounts or reviewing rule execution data.
user-invocable: false
---
```

The body should cover:
1. **What is Osprey** — The Skywatch moderation rule engine for AT Protocol. Evaluates content against defined rules and writes execution results to ClickHouse.
2. **System topology** — How Osprey connects to the AT Protocol firehose, processes events, executes rules, and writes results
3. **ClickHouse data access** — How to connect (direct vs SSH modes), which table to query (`default.osprey_execution_results`), read-only access constraints
4. **Relationship to Ozone** — Osprey detects; Ozone labels. The `ozone_label` tool writes to Ozone. Osprey data informs labelling decisions.
5. **Relationship to osprey-rules plugin** — For writing rules, use the osprey-rules plugin. This skill is about accessing and understanding existing rule execution data, not authoring rules.
6. **Schema reference** — Point to `references/osprey-schema.md` for the full column listing

Write this as a practical guide, not a glossary. The reader is an investigator who needs to understand what data is available and how to access it.

**Step 2: Create schema reference file**

Create `plugins/skywatch-investigations/skills/accessing-osprey/references/osprey-schema.md` with the complete column listing from Task 1.

Format as a markdown table:

```markdown
# osprey_execution_results Schema

| Column | Type | Description |
|--------|------|-------------|
| column_name | ClickHouseType | What this column contains |
| ... | ... | ... |
```

Include:
- Every column from `DESCRIBE TABLE`
- Type information (ClickHouse native types)
- Human-readable descriptions of what each column contains (derived from exploratory queries in Task 1)
- Notes on which columns are commonly used for filtering (created_at, rule_name, did, handle)
- Notes on AT Protocol identifier columns (DID format, AT-URI format, handle format)

**Step 3: Verify structure**

Run: `head -5 plugins/skywatch-investigations/skills/accessing-osprey/SKILL.md`
Expected: Shows valid YAML frontmatter with `name: accessing-osprey`

Run: `wc -l plugins/skywatch-investigations/skills/accessing-osprey/references/osprey-schema.md`
Expected: Non-trivial line count (schema should have many columns)

**Commit:** `feat: add accessing-osprey skill with schema reference`
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Build query pattern inventory from live data

**Verifies:** skywatch-investigations-plugin.AC4.3 (data gathering step)

**Files:**
- No files created — this task gathers data for Task 4

**Step 1: Develop investigation query patterns**

Using the schema from Task 1, develop 15-20 query patterns by running them against live data. Categories to cover:

**Account investigation queries:**
- Find all rule hits for a specific DID
- Find all rule hits for a specific handle
- Find accounts that triggered a specific rule in a time window
- Count rule hits per account (top offenders)

**Temporal analysis queries:**
- Rule hit volume over time (hourly/daily bucketing)
- Activity timeline for a specific account
- Burst detection (high-frequency posting patterns)

**Content analysis queries:**
- ngramDistance similarity search (copypasta detection)
- Most common content patterns for a rule
- Content clustering by similarity

**Infrastructure correlation queries:**
- Accounts sharing the same PDS host
- Accounts created in the same time window
- Cross-referencing multiple signals (same content + same timing)

**Rule performance queries:**
- Hit rate per rule
- False positive candidates (rule hits on established accounts)
- New rule coverage analysis

**Step 2: Validate each query**

Run each query against live ClickHouse to confirm it returns useful results. Record:
- The SQL
- What it reveals (investigation value)
- Expected output shape
- Any performance notes (which queries are slow, need tighter time bounds, etc.)

**No commit** — data gathering only.
<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: Create querying-clickhouse skill

**Verifies:** skywatch-investigations-plugin.AC4.1, skywatch-investigations-plugin.AC4.3

**Files:**
- Create: `plugins/skywatch-investigations/skills/querying-clickhouse/SKILL.md`
- Create: `plugins/skywatch-investigations/skills/querying-clickhouse/references/common-queries.md`

**Step 1: Create SKILL.md**

Create `plugins/skywatch-investigations/skills/querying-clickhouse/SKILL.md` with:

```yaml
---
name: querying-clickhouse
description: Query patterns, safety rules, and performance tips for ClickHouse investigation queries against osprey_execution_results. Use when writing or reviewing ClickHouse queries for investigations.
user-invocable: false
---
```

The body should cover:
1. **Safety rules** — SELECT only, LIMIT required, osprey_execution_results table only, 60-second timeout
2. **Query structure best practices** — Always filter by time range first (created_at), use LIMIT generously, avoid SELECT *, prefer specific columns
3. **Performance tips** — ClickHouse column-oriented storage means fewer columns = faster queries. Time-range filtering is critical for large tables. ngramDistance is expensive — always pair with other filters.
4. **Common patterns overview** — Brief descriptions of each query category, pointing to the reference file for full SQL
5. **Column quick reference** — The most-used columns for filtering and their types (subset of full schema, focused on investigation use)
6. **Output interpretation** — How to read rule execution results, what score values mean, how to correlate across rows

**Step 2: Create common queries reference file**

Create `plugins/skywatch-investigations/skills/querying-clickhouse/references/common-queries.md` with the 15-20 proven query patterns from Task 3.

Format each query as:

```markdown
## [N]. [Query Name]

**Purpose:** What investigation question this answers

**SQL:**
\`\`\`sql
SELECT ...
FROM default.osprey_execution_results
WHERE ...
LIMIT ...
\`\`\`

**Output:** Description of what the results show

**Notes:** Performance considerations, typical parameter values, when to use this
```

Group queries by category (Account, Temporal, Content, Infrastructure, Rule Performance).

**Step 3: Verify**

Run: `head -5 plugins/skywatch-investigations/skills/querying-clickhouse/SKILL.md`
Expected: Shows valid YAML frontmatter with `name: querying-clickhouse`

Run: `grep -c "^## " plugins/skywatch-investigations/skills/querying-clickhouse/references/common-queries.md`
Expected: 15 or more (one heading per query pattern)

**Commit:** `feat: add querying-clickhouse skill with 15+ proven query patterns`
<!-- END_TASK_4 -->
