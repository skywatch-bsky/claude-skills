# Human Test Plan: osprey-rule-investigator

Generated: 2026-02-21
Implementation plan: `docs/implementation-plans/2026-02-21-osprey-rule-investigator/`

## Prerequisites

- Both `osprey-rule-investigator` and `osprey-rules` plugins installed in a Claude Code session
- A valid Osprey SML rules project available locally (with `main.sml`, `config/labels.yaml`, `models/`, `rules/`)
- The `osprey-for-atproto` repository available locally (with `plugins_atproto/src/register_plugins.py`)
- A partial project directory prepared (see Session 2 setup)
- A nonexistent path prepared for fallback testing (e.g., `/tmp/not-a-repo`)
- All structural verification checks passing

---

## Session 1: Happy Path — Full Investigation

**Purpose:** Validate the investigator produces a complete, accurate report when given valid inputs.

**Setup:**
1. Have a real Osprey rules project path (e.g., `/path/to/rules-project`)
2. Have the osprey-for-atproto repo path (e.g., `/path/to/osprey-for-atproto`)
3. Run `find /path/to/rules-project -name "*.sml" | sort > /tmp/sml_inventory.txt` to create ground truth

| Step | Action | Expected |
|------|--------|----------|
| 1 | Spawn `osprey-rule-investigator` agent with prompt: "Investigate the Osprey rules project at /path/to/rules-project. The osprey-for-atproto repo is at /path/to/osprey-for-atproto. Produce a full structured report." | Agent loads `investigating-osprey-rules` skill immediately |
| 2 | Wait for report to complete. Verify the output has NO file writes. Run: `find /path/to/rules-project -type f \| sort > /tmp/after.txt && diff /tmp/sml_inventory_full_before.txt /tmp/after.txt` | No differences — zero files created (AC5.1) |
| 3 | Verify report begins with "## 1. Project Structure Inventory" section | Section 1 heading present (AC5.3) |
| 4 | In "1.1 Structure Validation", verify all 6 components show checkmark indicators | `main.sml`, `config/`, `config/labels.yaml`, `models/`, `rules/`, `rules/index.sml` all marked present (AC1.5) |
| 5 | In "1.2 SML File Inventory", count the listed files. Compare against `wc -l /tmp/sml_inventory.txt` | Counts match exactly (AC1.1) |
| 6 | In "1.3 Labels", verify the table exists. Open `config/labels.yaml` and spot-check 5 labels: confirm name, valid_for, and connotation match | All 5 spot-checks match (AC1.2) |
| 7 | In "1.3 Labels", verify the "Total: N labels" count matches `grep -c "^[a-z]" config/labels.yaml` | Count matches (AC1.2) |
| 8 | In "1.4 Models", verify each model file has a variable table with Line, Variable, Type, Details columns | Tables present per file (AC1.3) |
| 9 | Spot-check 5 variable line numbers from the models tables: open the actual model files and verify each line number points to the correct variable definition | All 5 line numbers accurate (AC5.2) |
| 10 | Verify report has "## 2." section for UDF Discovery | Section 2 present, appears after Section 1 (AC5.3) |
| 11 | In "2.1 UDF Discovery Mode", verify it states "Discovery mode: DYNAMIC (high confidence)" | Dynamic mode used with high confidence (AC2.4) |
| 12 | In "2.2 Registered UDFs", count listed UDFs. Open `register_plugins.py` and count class names in `register_udfs()` return list | Counts match (AC2.1) |
| 13 | In "2.3 UDF Signatures", spot-check 3 UDF signatures: open the Python source file for each and verify parameter names, types, defaults, and return type | All 3 match (AC2.2) |
| 14 | Verify at least one UDF shows inheritance chain (e.g., IncrementWindow -> CacheWindowArgumentsBase -> CacheArgumentsBase) | Inheritance chain traced (AC2.2) |
| 15 | Verify report has "## 3." section for Execution Graph | Section 3 present, appears after Section 2 (AC5.3) |
| 16 | In "3.1 Execution Graph Trace", verify `main.sml` appears as root | Root node correct (AC3.1) |
| 17 | Manually trace `main.sml`'s Require statements. Verify each appears in the graph trace. Follow 2 levels deep and confirm the agent found the same files | All branches present (AC3.1) |
| 18 | Verify leaf files are marked with `[LEAF]` | Leaf markers present (AC3.1) |
| 19 | If any Require has `require_if=`, verify the condition is shown alongside the Require statement in the graph | Conditional requires annotated (AC3.5) |
| 20 | In "3.2 Rule Definitions", verify each Rule() has Line, Variable, Scope, and Conditions columns | Format correct (AC3.2) |
| 21 | Grep the project for `Rule(` and count. Compare against the report's "Total: N rules" | Counts match (AC3.2) |
| 22 | Spot-check 3 Rule() line numbers against actual files | Line numbers accurate (AC5.2) |
| 23 | In "3.3 WhenRules Invocations", verify each has line number, triggers (rules_any), and effects (then) | Format correct (AC3.3) |
| 24 | Grep the project for `WhenRules(` and count. Compare against the report | Counts match (AC3.3) |
| 25 | In "3.4 Rule Summary", verify table has columns: Rule, File, Conditions, Effect, Label, Entity | All columns present (AC3.4) |
| 26 | Verify a rule with multiple effects appears on multiple rows | Multi-effect rows present (AC3.4) |
| 27 | If conditional requires exist, verify "Conditional graph gates" section at bottom of summary | Gates documented (AC3.5) |

---

## Session 2: Missing Structure

**Purpose:** Validate the investigator handles partial/invalid projects gracefully.

**Setup:**
1. Create a temporary directory: `mkdir -p /tmp/partial-osprey/config`
2. Create a minimal main.sml: `touch /tmp/partial-osprey/main.sml`
3. Create a labels file: `echo "test-label:\n  valid_for: [UserId]\n  connotation: neutral" > /tmp/partial-osprey/config/labels.yaml`
4. Do NOT create `models/` or `rules/`

| Step | Action | Expected |
|------|--------|----------|
| 1 | Spawn `osprey-rule-investigator` with prompt: "Investigate the Osprey rules project at /tmp/partial-osprey. No osprey-for-atproto path available." | Agent starts investigation |
| 2 | In "1.1 Structure Validation", verify `main.sml` shows checkmark | Present component marked (AC1.5) |
| 3 | Verify `config/` and `config/labels.yaml` show checkmarks | Present components marked (AC1.5) |
| 4 | Verify `models/` shows cross/MISSING indicator | Absent component reported (AC1.4, AC1.5) |
| 5 | Verify `rules/` shows cross/MISSING indicator | Absent component reported (AC1.4, AC1.5) |
| 6 | Verify agent does NOT stop after reporting missing components | Investigation continues past validation (AC1.4) |
| 7 | Verify agent still reads `config/labels.yaml` and produces labels table despite missing models/rules | Partial investigation succeeds (AC1.4) |
| 8 | Verify "1.4 Models" section states models/ is missing and skips model catalogue | Graceful degradation (AC1.4) |

---

## Session 3: UDF Static Fallback

**Purpose:** Validate the investigator falls back to static UDF reference when dynamic discovery is unavailable.

**Setup:** Use any valid rules project path, but provide a bogus atproto path.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Spawn agent with prompt: "Investigate rules project at /path/to/rules-project. The osprey-for-atproto repo is at /tmp/not-a-repo." | Agent starts investigation |
| 2 | In "2.1 UDF Discovery Mode", verify report states `register_plugins.py not found` with cross indicator | Missing file reported (AC2.5) |
| 3 | Verify report states "Falling back to static reference" | Fallback triggered (AC2.5) |
| 4 | Verify report states "Discovery mode: STATIC (low confidence)" | Static mode with low confidence (AC2.4) |
| 5 | Verify UDF signatures from the static reference appear in the report (spot-check: TextContains, IncrementWindow, AddAtprotoLabel) | Static content used (AC2.3) |
| 6 | Verify a staleness caveat/warning is present near the UDF data | Caveat included (AC2.3) |
| 7 | Verify agent does NOT error or abort — Sections 1 and 3 still complete normally | No crash on fallback (AC2.5) |

---

## Session 4: Integration — Writer Delegates to Investigator

**Purpose:** Validate the osprey-rule-writer correctly spawns the investigator as a subagent.

**Setup:** Both plugins installed. Valid rules project + atproto repo available.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start `osprey-rule-writer` agent with task: "Write a rule that detects posts containing the word 'spam'" | Writer agent activates |
| 2 | Verify Step 1 asks for the rules project path via AskUserQuestion | Path prompt appears (AC4.3) |
| 3 | Verify Step 1 ALSO asks for the osprey-for-atproto repo path | Second path prompt appears (AC4.3) |
| 4 | Provide both paths. Verify writer spawns `osprey-rule-investigator` as a subagent via Task tool | Subagent spawned (AC4.1) |
| 5 | Verify the Task call uses `subagent_type: "osprey-rule-investigator:osprey-rule-investigator"` | Correct subagent type (AC4.2) |
| 6 | Wait for investigator to complete. Verify writer receives the structured report | Report received (AC4.2) |
| 7 | Verify writer uses the report data for subsequent rule writing (references labels, models, UDFs from report) | Report used as context, no re-reading files (AC4.2) |

---

## End-to-End: Full Write Cycle with Investigation

**Purpose:** Validate the complete chain from writer -> investigator -> rule creation works end-to-end.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start osprey-rule-writer with "Write a rule that detects posts mentioning 'test-keyword' and labels them with 'spam-post'" | Writer activates |
| 2 | Provide both project paths when asked | Paths accepted |
| 3 | Verify investigator is spawned and completes its full report | Full report returned |
| 4 | Verify writer proceeds to Step 3 (Understand Target Behaviour) using investigator data | Investigation data used as context |
| 5 | Verify writer references labels from the investigator's labels table (not re-reading labels.yaml) | No redundant file reads |
| 6 | Verify writer references UDF signatures from the investigator's UDF section | UDF data from report |
| 7 | Verify writer creates the rule file, wires it into execution graph, and validates | Complete rule created |

---

## Traceability Matrix

| Acceptance Criterion | Automated Test | Manual Step |
|----------------------|----------------|-------------|
| AC1.1 — SML file listing | Glob pattern + Step 1.2 in SKILL.md | Session 1, Steps 5-6 |
| AC1.2 — Labels table | config/labels.yaml + valid_for/connotation in SKILL.md | Session 1, Steps 6-7 |
| AC1.3 — Model catalogue | 4 variable types + Step 1.4 in SKILL.md | Session 1, Steps 8-9 |
| AC1.4 — Missing component reporting | MISSING language in SKILL.md | Session 2, Steps 4-8 |
| AC1.5 — Present/absent structure | 5 components + MISSING format in SKILL.md | Session 2, Steps 2-5 |
| AC2.1 — UDF class extraction | register_plugins.py + register_udfs in SKILL.md | Session 1, Step 12 |
| AC2.2 — UDF signatures | ArgumentsBase + return type + inheritance in SKILL.md | Session 1, Steps 13-14 |
| AC2.3 — Static fallback file | File exists, 107 lines, staleness caveat, Step 2.5 | Session 3, Steps 5-6 |
| AC2.4 — Dynamic/static indicator | DYNAMIC + STATIC + confidence in SKILL.md | Session 1 Step 11; Session 3 Step 4 |
| AC2.5 — Graceful fallback | Falling back to static reference in SKILL.md | Session 3, Steps 1-7 |
| AC3.1 — Import/Require tracing | Step 3.1 + Import + Require + recursive in SKILL.md | Session 1, Steps 16-18 |
| AC3.2 — Rule() catalogue | Step 3.2 + when_all + scope in SKILL.md | Session 1, Steps 20-22 |
| AC3.3 — WhenRules() catalogue | Step 3.3 + rules_any + effect types in SKILL.md | Session 1, Steps 23-24 |
| AC3.4 — Summary table | Step 3.4 + 5 columns in SKILL.md | Session 1, Steps 25-26 |
| AC3.5 — Conditional requires | require_if + conditional gates in SKILL.md | Session 1, Steps 19/27 |
| AC4.1 — Task in writer | Task in allowed-tools + routing row | Session 4, Step 4 |
| AC4.2 — Step 2 delegation | investigator + Task + subagent_type in writing skill | Session 4, Steps 5-7 |
| AC4.3 — Step 1 asks for atproto path | osprey-for-atproto at line 36 of writing skill | Session 4, Steps 2-3 |
| AC4.4 — CLAUDE.md dependency | 3 refs in osprey-rules/CLAUDE.md | N/A (fully structural) |
| AC5.1 — No file writes | NEVER write in agent + skill; no Edit/Write in allowed-tools | Session 1, Step 2 |
| AC5.2 — File paths + line numbers | Mandate in agent; Line column refs in skill | Session 1, Steps 9/22 |
| AC5.3 — Structured sections | 3 Section headings; investigation order in SKILL.md | Session 1, Step 3 |
