# Ozone MCP Tools Implementation Plan — Phase 4: Documentation Update

**Goal:** Update the plugin CLAUDE.md to accurately reflect the expanded tool set (11 → 20 MCP tools).

**Architecture:** Documentation-only phase. Updates the Contracts section in `plugins/skywatch-investigations/CLAUDE.md`.

**Tech Stack:** Markdown

**Scope:** 4 phases from original design (phase 4 of 4)

**Codebase verified:** 2026-03-24

---

## Acceptance Criteria Coverage

This phase implements:

### ozone-mcp-tools.AC4: Documentation is accurate
- **ozone-mcp-tools.AC4.1 Success:** Plugin CLAUDE.md lists all 20 MCP tools with correct descriptions

---

<!-- START_TASK_1 -->
### Task 1: Update CLAUDE.md MCP Tools listing and tool count

**Verifies:** ozone-mcp-tools.AC4.1

**Files:**
- Modify: `plugins/skywatch-investigations/CLAUDE.md`

**Implementation:**

Update the following sections in `plugins/skywatch-investigations/CLAUDE.md`:

**1. Update the Purpose section** — change "11 tools" mention if present, or add reference to expanded Ozone toolkit.

**2. Update the MCP Tools list under Contracts → Exposes** — change `(11 total)` to `(20 total)` and add the 9 new tool descriptions after the existing `ozone_label` entry:

```markdown
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
```

**3. Update the Key Files table** — update the tools line to reflect the new count:

```markdown
| `servers/skywatch-mcp/src/tools/` | Tool implementations (20 tools across 5 files) |
```

**4. Update the "When to Use" table** — add entries for the new Ozone tools:

```markdown
| "Query the moderation queue" | `ozone_query_statuses` tool or `data-analyst` agent |
| "What moderation events happened on this account?" | `ozone_query_events` tool or `data-analyst` agent |
| "Add a comment to this subject" | `ozone_comment` tool |
| "Acknowledge this report" | `ozone_acknowledge` tool |
| "Escalate this subject" | `ozone_escalate` tool |
| "Tag/untag this subject" | `ozone_tag` tool |
| "Mute this subject" | `ozone_mute` tool |
| "Resolve this appeal" | `ozone_resolve_appeal` tool |
```

**5. Update Guarantees section** — add guarantees for the new write tools:

```markdown
- All Ozone write tools include modTool metadata (`name: "skywatch-mcp"`, batchId) for traceability
- All Ozone write tools validate credentials before attempting API calls
```

**6. Update the `Last verified` date** at the top to `2026-03-24`.

**Verification:**

Manually review the updated file. Count all tool entries to confirm exactly 20.

Run: `grep -c "^\s*- \`" plugins/skywatch-investigations/CLAUDE.md` in the MCP Tools section to verify count.

**Commit:** `docs: update CLAUDE.md with 9 new Ozone MCP tools (11 → 20 total)`
<!-- END_TASK_1 -->
