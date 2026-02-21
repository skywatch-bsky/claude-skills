# Osprey Rules v2 Implementation Plan — Phase 6: Plugin Manifest & Documentation

**Goal:** Update `plugin.json` and `CLAUDE.md` to reflect the v2 orchestrator architecture with new agents, restructured skills, and updated contracts.

**Architecture:** plugin.json gets an updated description reflecting the orchestrator model. CLAUDE.md gets a complete rewrite documenting the v2 contracts (five agents, four skills, orchestrator pattern), dependencies (osprey-rule-investigator), key decisions (decomposition rationale), and updated key files and gotchas.

**Tech Stack:** JSON manifest and markdown documentation

**Scope:** 6 phases from original design (phase 6 of 6)

**Codebase verified:** 2026-02-21

**Verifies: None** — infrastructure phase. Verification is structural (manifest and documentation accurately reflect the implemented architecture).

---

<!-- START_TASK_1 -->
### Task 1: Update plugin.json manifest

**Files:**
- Modify: `plugins/osprey-rules/.claude-plugin/plugin.json`

**Step 1: Update the plugin description**

The current plugin.json is minimal (name, description, version, author, keywords). Update the description to reflect the orchestrator architecture. Change:

```json
{
  "name": "osprey-rules",
  "description": "Teaches Claude Code how to write, edit, and validate Osprey SML moderation rules for atproto.",
  "version": "0.1.0",
  "author": {
    "name": "Skywatch Blue"
  },
  "keywords": ["osprey", "sml", "moderation", "atproto", "bluesky", "rules"]
}
```

To:

```json
{
  "name": "osprey-rules",
  "description": "Orchestrator plugin for writing, reviewing, and debugging Osprey SML moderation rules for atproto. Dispatches specialized subagents (planner, implementor, reviewer, debugger) via a thin coordinator.",
  "version": "0.2.0",
  "author": {
    "name": "Skywatch Blue"
  },
  "keywords": ["osprey", "sml", "moderation", "atproto", "bluesky", "rules", "orchestrator"]
}
```

Changes:
- Description updated to mention orchestrator and subagents
- Version bumped from 0.1.0 to 0.2.0 (breaking architecture change)
- Added "orchestrator" keyword

**Step 2: Verify the update**

Run:
```bash
python3 -c "import json; d=json.load(open('plugins/osprey-rules/.claude-plugin/plugin.json')); assert d['version']=='0.2.0'; assert 'orchestrator' in d['description'].lower(); print('OK')"
```
Expected: `OK`

**Commit:** `chore(osprey-rules): bump version to 0.2.0 for orchestrator architecture`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Rewrite CLAUDE.md for v2 architecture

**Files:**
- Modify: `plugins/osprey-rules/CLAUDE.md` (complete rewrite)

**Step 1: Replace CLAUDE.md contents**

Replace the entire contents of `plugins/osprey-rules/CLAUDE.md` with the following. This documents the v2 orchestrator architecture with updated contracts, dependencies, key decisions, invariants, key files, and gotchas.

```markdown
# Osprey Rules Plugin

Last verified: 2026-02-21

## Purpose

Orchestrator plugin that coordinates specialized subagents to write, review, and
debug Osprey SML moderation rules for the AT Protocol (Bluesky). The entry point
agent (`osprey-rule-writer`) dispatches domain-specific subagents rather than
doing rule work itself — all SML knowledge lives in skills loaded by each subagent.

## Architecture

v2 uses an orchestrator-and-subagents pattern (modelled on ed3d-plan-and-execute):

- **osprey-rule-writer** (orchestrator) — thin coordinator, dispatches subagents, manages review→fix loop
- **osprey-rule-planner** — gathers requirements, produces rule specifications
- **osprey-rule-impl** — writes SML files from rule specifications
- **osprey-rule-reviewer** — three-layer verification gate (osprey-cli, proactive checks, conventions)
- **osprey-rule-debugger** — fixes reviewer-identified issues

The orchestrator routes user intent to the right flow:

| Flow | Trigger | Agents |
|------|---------|--------|
| Flow 1 | "Write a rule for X" | investigator → planner → impl → reviewer (→ debugger loop) |
| Flow 2 | "Validate my rules" | investigator → reviewer (→ offer debugger) |
| Flow 3 | "Fix this error" | investigator → debugger → reviewer (→ debugger loop) |
| Flow 4 | "What patterns exist?" | None (orchestrator loads `osprey-sml-reference` directly) |
| Flow 5 | "Review this rule" | reviewer (ad-hoc mode) |

## Contracts

- **Exposes**:
  - Agent: `osprey-rule-writer` — orchestrator entry point for all Osprey rule tasks
  - Agent: `osprey-rule-planner` — requirements gathering subagent
  - Agent: `osprey-rule-impl` — SML authoring subagent
  - Agent: `osprey-rule-reviewer` — verification gate subagent
  - Agent: `osprey-rule-debugger` — issue fixer subagent
  - Command: `/osprey-validate [path]` — runs `uv run osprey-cli push-rules --dry-run`
  - Skills: `planning-osprey-rules`, `authoring-osprey-rules`, `reviewing-osprey-rules`, `fixing-osprey-rules`, `osprey-sml-reference`
- **Guarantees**:
  - Orchestrator NEVER writes SML code (delegates to impl agent)
  - Orchestrator NEVER loads domain skills (except `osprey-sml-reference` for Flow 4)
  - Orchestrator prints full subagent output after every dispatch (no summarisation)
  - All SML domain knowledge lives in skills, not agent prompts
  - Reviewer is a hard gate: zero issues across all severities (Critical/Important/Minor) required to pass
  - Baseline captured before writing; only new issues block the gate
  - Review→fix loop maxes at 5 cycles then escalates to human
  - Labels must exist in `config/labels.yaml` before use in effects
- **Expects**:
  - Access to `osprey-for-atproto` repo (user-provided path, used for validation and UDF discovery)
  - `osprey-rule-investigator` plugin installed (used by orchestrator for project analysis in Flows 1-3)
  - `uv` installed for running `uv run osprey-cli` and `uv sync`
  - A valid Osprey rules project with `main.sml`, `config/`, `models/`, `rules/`
  - User provides project path on first invocation

## Dependencies

- **Uses**: `osprey-cli` via `uv run` from `osprey-for-atproto` repo (validation in reviewer and debugger self-check)
- **Uses**: `osprey-rule-investigator` plugin (project analysis via Task tool delegation — required for Flows 1-3)
- **Used by**: Any Claude Code session with this plugin installed
- **Boundary**: Orchestrator depends on `osprey-rule-investigator` for project state discovery; if not installed, Flows 1-3 cannot run

## Key Decisions

- **Orchestrator + subagents over monolithic agent**: Separates concerns (planning, writing, reviewing, fixing), prevents one agent from being overloaded, allows each agent to load only the skills it needs
- **Reviewer as hard gate**: All severities must be zero to pass — Minor issues are not optional. Prevents convention drift.
- **Baseline diffing**: Captures pre-existing errors before writing, so the review loop only focuses on regressions from current work. Prevents wasting fix cycles on old issues.
- **Skills are fat, agents are thin**: Domain knowledge lives in skills (`planning-osprey-rules`, `authoring-osprey-rules`, etc.), not in agent prompts. Agents contain routing logic and constraints only.
- **Five skills split by agent responsibility**: planning (requirements), authoring (SML writing), reviewing (verification), fixing (error resolution), reference (shared SML knowledge)

## Invariants

- `Rule()` objects must be stored in non-underscore-prefixed variables
- `when_all` lists must contain homogeneous types (all `bool` or all `RuleT`)
- `EntityJson` for label targets, `JsonData` for primitives only
- Time durations use named constants (`Day`, `Hour`) not raw integers
- `WhenRules` uses `rules_any=`, never `rules_all=`
- Reviewer runs ALL three layers (osprey-cli, proactive checks, conventions) — no partial reviews
- Orchestrator captures baseline ONCE per flow — it never shifts during the review→fix loop

## Skill Ownership

| Agent | Skills |
|-------|--------|
| `osprey-rule-planner` | `planning-osprey-rules`, `osprey-sml-reference` |
| `osprey-rule-impl` | `authoring-osprey-rules`, `osprey-sml-reference` |
| `osprey-rule-reviewer` | `reviewing-osprey-rules`, `osprey-sml-reference` |
| `osprey-rule-debugger` | `fixing-osprey-rules` |
| `osprey-rule-writer` (orchestrator) | `osprey-sml-reference` (Flow 4 only) |

## Key Files

- `.claude-plugin/plugin.json` — plugin manifest (name, version 0.2.0, metadata)
- `agents/osprey-rule-writer.md` — orchestrator with flow routing and review→fix loop
- `agents/osprey-rule-planner.md` — requirements gathering agent
- `agents/osprey-rule-impl.md` — SML authoring agent
- `agents/osprey-rule-reviewer.md` — three-layer verification gate agent
- `agents/osprey-rule-debugger.md` — issue fixer agent
- `commands/osprey-validate.md` — validation command definition
- `skills/planning-osprey-rules/SKILL.md` — requirements gathering workflow
- `skills/authoring-osprey-rules/SKILL.md` — SML authoring workflow
- `skills/reviewing-osprey-rules/SKILL.md` — three-layer verification methodology
- `skills/fixing-osprey-rules/SKILL.md` — error categories and fix patterns
- `skills/osprey-sml-reference/SKILL.md` — SML type system and constructs
- `skills/osprey-sml-reference/references/labeling-patterns.md` — 24 labeling pattern templates
- `skills/osprey-sml-reference/references/sml-conventions.md` — naming conventions, anti-patterns, reviewer checklist

## Gotchas

- `osprey-cli` is NOT on PATH; must be invoked via `uv run` from within `osprey-for-atproto`
- `osprey-cli` validation catches syntax errors but NOT all logic/convention violations; the reviewer's Layer 2 (proactive checks) and Layer 3 (convention review) exist because osprey-cli is insufficient
- `_` prefixed variables are file-local in SML; they cannot be imported cross-file
- Skills are not user-invocable (`user-invocable: false`); they load via agent routing
- The orchestrator NEVER writes SML — if you see it writing `.sml` files, something is wrong
- Baseline is captured ONCE per flow; it never shifts during the review→fix loop
- If `osprey-rule-investigator` plugin is not installed, Flows 1-3 will fail; the orchestrator should detect this and inform the user
- The reviewer is read-only; it NEVER modifies rule files
- Minor issues are NOT optional — they block the reviewer gate just like Critical issues
```

**Step 2: Verify key sections exist**

Run:
```bash
grep -q "## Architecture" plugins/osprey-rules/CLAUDE.md && \
grep -q "## Contracts" plugins/osprey-rules/CLAUDE.md && \
grep -q "## Dependencies" plugins/osprey-rules/CLAUDE.md && \
grep -q "## Key Decisions" plugins/osprey-rules/CLAUDE.md && \
grep -q "## Skill Ownership" plugins/osprey-rules/CLAUDE.md && \
grep -q "## Key Files" plugins/osprey-rules/CLAUDE.md && \
grep -q "## Gotchas" plugins/osprey-rules/CLAUDE.md && \
echo "CLAUDE.md sections OK" || echo "CLAUDE.md sections FAIL"
```

**Step 3: Verify all agents are listed**

Run:
```bash
grep -c "osprey-rule-" plugins/osprey-rules/CLAUDE.md | xargs test 20 -le && \
echo "Agent references OK" || echo "Agent references FAIL"
```

**Step 4: Verify old skill names are NOT referenced as current**

Run:
```bash
grep -q "writing-osprey-rules" plugins/osprey-rules/CLAUDE.md && echo "FAIL: old writing skill referenced" || echo "OK: old writing skill not referenced"
grep -q "debugging-osprey-rules" plugins/osprey-rules/CLAUDE.md && echo "FAIL: old debugging skill referenced" || echo "OK: old debugging skill not referenced"
```
Expected: Both print OK

**Commit:** `docs(osprey-rules): rewrite CLAUDE.md for v2 orchestrator architecture`
<!-- END_TASK_2 -->
