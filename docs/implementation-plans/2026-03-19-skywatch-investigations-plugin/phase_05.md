# Skywatch Investigations Plugin Implementation Plan — Phase 5

**Goal:** Write the investigation methodology and reporting skills.

**Architecture:** Two skills following established pattern: `SKILL.md` with 3-field YAML frontmatter, `references/` subdirectory with markdown reference files. Content is investigation methodology — 6-phase process and 4 report types.

**Tech Stack:** Markdown, YAML frontmatter

**Scope:** Phase 5 of 7 from original design

**Codebase verified:** 2026-03-19

---

## Acceptance Criteria Coverage

This phase implements and tests:

### skywatch-investigations-plugin.AC4: Skills
- **skywatch-investigations-plugin.AC4.1 Success:** Each skill has valid YAML frontmatter (name, description, user-invocable) — for conducting-investigations and reporting-results
- **skywatch-investigations-plugin.AC4.4 Success:** `conducting-investigations` covers all 6 phases with per-phase tool and signal guidance
- **skywatch-investigations-plugin.AC4.5 Success:** `reporting-results` includes templates for memo, cell deep-dive, cross-cell, and rule check report types

---

<!-- START_TASK_1 -->
### Task 1: Create conducting-investigations skill

**Verifies:** skywatch-investigations-plugin.AC4.1, skywatch-investigations-plugin.AC4.4

**Files:**
- Create: `plugins/skywatch-investigations/skills/conducting-investigations/SKILL.md`
- Create: `plugins/skywatch-investigations/skills/conducting-investigations/references/investigation-checklist.md`

**Step 1: Create SKILL.md**

Create `plugins/skywatch-investigations/skills/conducting-investigations/SKILL.md` with:

```yaml
---
name: conducting-investigations
description: Six-phase investigation methodology for AT Protocol network analysis — from initial discovery through reporting. Covers tool selection, signal identification, evidence standards, and directory conventions. Use when conducting or planning investigations.
user-invocable: false
---
```

The body must cover all 6 investigation phases as defined in the design plan:

**Phase 1: Discovery**
- Starting from a lead (reported accounts, rule hits, suspicious patterns)
- Initial data pull: query ClickHouse for the target account's rule hit history
- Tool guidance: use `clickhouse_query` for data extraction, `domain_check` for any domains found in content
- Signals to look for: volume of rule hits, temporal clustering, content patterns
- Output: initial assessment — is this worth deeper investigation?

**Phase 2: Characterization**
- Deep profile of the target account(s)
- Posting patterns: volume, timing, content themes
- Infrastructure: PDS host, account creation date, profile characteristics
- Tool guidance: `clickhouse_query` for detailed timelines, `ip_lookup` for any IPs found, `whois_lookup` for domains
- Output: account profile document

**Phase 3: Linkage**
- Finding connected accounts
- Content similarity: `content_similarity` tool to find copypasta
- Temporal correlation: accounts posting the same content at similar times
- Infrastructure correlation: shared PDS hosts, shared domains
- Tool guidance: `content_similarity` for text matching, `clickhouse_query` with GROUP BY for clustering
- Output: network graph — which accounts are linked and by what signals

**Phase 4: Amplification Mapping**
- Understanding the network's reach and strategy
- How content spreads: repost chains, quote posts, reply trees
- Target identification: which accounts/topics are being amplified
- Tool guidance: `clickhouse_query` for engagement patterns, `url_expand` for link analysis
- Output: amplification report — what is being pushed and how

**Phase 5: Rule Validation**
- Testing whether existing rules catch the network
- Coverage analysis: do current rules trigger on the identified accounts?
- Gap analysis: what behaviour isn't caught?
- Tool guidance: `clickhouse_query` for rule hit analysis
- Output: rule coverage assessment with recommendations

**Phase 6: Reporting**
- Synthesize findings into structured report
- Select appropriate report type (memo, cell deep-dive, cross-cell, rule check)
- Follow `reporting-results` skill for formatting
- Apply labels via `ozone_label` if warranted
- Output: formatted investigation report

Additional sections in SKILL.md:
- **Evidence standards** — What constitutes sufficient evidence for each conclusion type
- **Directory conventions** — Where to store investigation artefacts
- **Escalation criteria** — When to escalate vs. continue investigating

**Step 2: Create investigation checklist reference**

Create `plugins/skywatch-investigations/skills/conducting-investigations/references/investigation-checklist.md`

Format as a per-phase checklist:

```markdown
# Investigation Checklist

## Phase 1: Discovery
- [ ] Pull rule hit history for target account(s)
- [ ] Note volume, frequency, and rule types triggered
- [ ] Check for domain/URL mentions in content
- [ ] Initial assessment: proceed to Phase 2?
...

## Phase 2: Characterization
- [ ] Build timeline of account activity
- [ ] Document posting patterns (times, volume, content themes)
...
```

Each phase should list:
- Required data to collect
- Tools to use (by MCP tool name)
- Signals to document
- Decision point: proceed to next phase or conclude early?

**Step 3: Verify**

Run: `head -5 plugins/skywatch-investigations/skills/conducting-investigations/SKILL.md`
Expected: Valid YAML frontmatter with `name: conducting-investigations`

Run: `grep -c "^## Phase" plugins/skywatch-investigations/skills/conducting-investigations/SKILL.md`
Expected: 6 (one heading per phase)

**Commit:** `feat: add conducting-investigations skill with 6-phase methodology`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create reporting-results skill

**Verifies:** skywatch-investigations-plugin.AC4.1, skywatch-investigations-plugin.AC4.5

**Files:**
- Create: `plugins/skywatch-investigations/skills/reporting-results/SKILL.md`
- Create: `plugins/skywatch-investigations/skills/reporting-results/references/report-templates.md`

**Step 1: Create SKILL.md**

Create `plugins/skywatch-investigations/skills/reporting-results/SKILL.md` with:

```yaml
---
name: reporting-results
description: Report formats, B-I-N-D-Ts structure, data presentation, and output conventions for investigation reports. Use when writing or reviewing investigation reports. Includes templates for memo, cell deep-dive, cross-cell, and rule check report types.
user-invocable: false
---
```

The body must cover:

**B-I-N-D-Ts format** — The standard report structure:
- **B**ottom line — One sentence: what did we find and what does it mean?
- **I**mpact — How many accounts, what's the reach, what's at risk?
- **N**ext steps — Recommended actions (labels, rule updates, escalations)
- **D**etails — Full evidence: data tables, timelines, network graphs
- **T**imestamps — When the investigation was conducted, data time ranges

**Report types** — When to use each:
1. **Memo** — Quick finding, single account or small issue. Used when discovery finds something notable but not a full network.
2. **Cell deep-dive** — Comprehensive analysis of a coordinated cluster. Used after completing all 6 investigation phases for a single cell.
3. **Cross-cell** — Comparison of multiple coordinated clusters, identifying shared infrastructure or tactics. Used when multiple cells appear related.
4. **Rule check** — Assessment of rule coverage against known behaviour. Used after Phase 5 (Rule Validation) when the focus is on detection gaps.

**Data presentation conventions:**
- Tables for structured data (account lists, rule hit counts)
- Timelines for temporal patterns
- Bullet lists for evidence summaries
- Always include the SQL queries used (reproducibility)
- Always include timestamps and data ranges

**Output conventions:**
- Reports are markdown documents
- File naming: `YYYY-MM-DD-{brief-description}.md`
- Include metadata block at top (investigator, date, targets, conclusion)

**Step 2: Create report templates reference**

Create `plugins/skywatch-investigations/skills/reporting-results/references/report-templates.md`

Include skeleton templates for each of the 4 report types:

```markdown
# Report Templates

## Memo Template

### Bottom Line
[One sentence finding]

### Impact
- Accounts affected: [count]
- Time range: [start] to [end]
- Risk level: [low/medium/high]

### Next Steps
- [ ] [Recommended action 1]
- [ ] [Recommended action 2]

### Details
[Evidence tables, data, analysis]

### Timestamps
- Investigation conducted: [date]
- Data range: [start] to [end]
- Report authored: [date]

---

## Cell Deep-Dive Template
...

## Cross-Cell Template
...

## Rule Check Template
...
```

Each template should include:
- All B-I-N-D-Ts sections
- Type-specific sections (e.g., cell deep-dive has network graph, cross-cell has comparison matrix)
- Placeholder text explaining what goes in each section
- Example data formats (table structures, timeline formats)

**Step 3: Verify**

Run: `head -5 plugins/skywatch-investigations/skills/reporting-results/SKILL.md`
Expected: Valid YAML frontmatter with `name: reporting-results`

Run: `grep -c "^## " plugins/skywatch-investigations/skills/reporting-results/references/report-templates.md`
Expected: 4 or more (one per report type template section)

**Commit:** `feat: add reporting-results skill with B-I-N-D-Ts templates`
<!-- END_TASK_2 -->
