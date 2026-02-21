# Human Test Plan: Osprey Rules v2 Orchestrator Architecture

Generated: 2026-02-21

## Prerequisites

- Working directory: `/Users/scarndp/dev/skywatch/claude-skills/.worktrees/osprey-rules-v2/`
- All files present on disk (verified by structural checks)
- Familiarity with the old `writing-osprey-rules` and `debugging-osprey-rules` skills (for content migration comparison)

## Phase 1: Agent Description Quality (AC2.5)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `plugins/osprey-rules/agents/osprey-rule-planner.md`, read the `description` field in frontmatter | Description starts with "Use when", describes meaningful triggers ("gathering requirements for a new Osprey SML rule"), and describes the action ("Asks clarifying questions... Produces a structured rule spec") |
| 2 | Open `plugins/osprey-rules/agents/osprey-rule-impl.md`, read the `description` field | Description starts with "Use when", describes trigger ("writing or modifying Osprey SML rule files from a validated rule specification"), and action ("authors the actual SML: models, rules, effects, and execution graph wiring") |
| 3 | Open `plugins/osprey-rules/agents/osprey-rule-reviewer.md`, read the `description` field | Description starts with "Use when", describes trigger ("validating or reviewing"), and action ("Runs three-layer verification"). Mentions "Read-only analysis -- never modifies rule files." |
| 4 | Open `plugins/osprey-rules/agents/osprey-rule-debugger.md`, read the `description` field | Description starts with "Use when", describes trigger ("fixing Osprey SML validation errors or reviewer-identified issues"), and action ("diagnoses root causes, applies fixes") |
| 5 | For each description, assess: Would Claude Code's auto-delegation correctly route to this agent given its trigger phrases? Are the example phrases distinct enough to avoid confusion between agents? | No two agents should overlap in trigger phrases. Planner = new rule planning; Impl = writing from spec; Reviewer = validating/reviewing; Debugger = fixing errors |

## Phase 2: Prose Domain Knowledge in Agents (AC2.6)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Read the full body of `plugins/osprey-rules/agents/osprey-rule-planner.md` (below the frontmatter) | Body contains ONLY: Identity, Mandatory First Action, Input Expectations, Output Format, Critical Rules, Out of Scope. No SML syntax examples, no type system explanations, no labeling pattern guidance. |
| 2 | Read the full body of `plugins/osprey-rules/agents/osprey-rule-impl.md` | Body contains ONLY: Identity, Mandatory First Action, Input Expectations, Output Rules, Critical Rules, Out of Scope. No SML code examples beyond what's needed to describe output expectations. The agent says "does not contain SML knowledge" and defers to skills. |
| 3 | Read the full body of `plugins/osprey-rules/agents/osprey-rule-reviewer.md` | Body contains routing/coordination logic. The Output Format section describes what layers check for (as summaries), but does NOT contain the actual check methodology or SML examples. Those live in the skill. |
| 4 | Read the full body of `plugins/osprey-rules/agents/osprey-rule-debugger.md` | Body contains ONLY: Identity, Mandatory First Action, Input Expectations, Workflow, Output Format, Critical Rules, Out of Scope. No error categories, fix patterns, or SML examples. |
| 5 | Assessment: For each agent, confirm the body contains only routing/coordination/constraint logic. Any prose that teaches SML authoring, debugging patterns, or review criteria belongs in skills, not agent prompts. | All four agents should be "thin" -- they say WHAT to do (load skill, receive input, produce output) but not HOW to do the domain work. |

## Phase 3: Dispatch Sequence Ordering (AC1.1)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `plugins/osprey-rules/agents/osprey-rule-writer.md`, read the Flow 1 section | Steps proceed in logical order: (1) investigator produces context, (2) planner uses context to produce spec, (3) baseline captured, (4) impl uses spec + context to write SML, (5) reviewer verifies, (6) diff against baseline, (7-8) success or loop |
| 2 | Verify the ordering makes domain sense: Can the planner work without the investigator's output? | No -- the planner needs the investigator report to know what labels, models, and UDFs exist. Investigator MUST come before planner. |
| 3 | Can the impl work without the planner's output? | No -- the impl needs a rule specification to know what to build. Planner MUST come before impl. |
| 4 | Can the reviewer work before the impl writes files? | It would have nothing new to review. Impl MUST come before reviewer (post-write). |
| 5 | Is the baseline capture positioned correctly (step 3, before impl at step 4)? | Yes -- baseline must capture pre-existing state before any writes occur. |

## Phase 4: Runtime Behaviour Verification (AC1.6)

| Step | Action | Expected |
|------|--------|----------|
| 1 | In a Claude Code session with the plugin installed, trigger Flow 1 by saying "Write a rule for detecting spam posts" | Orchestrator dispatches investigator first. After investigator returns, the FULL investigator output is printed (not summarised). |
| 2 | After the planner runs, check the orchestrator's output | The FULL planner output (rule spec) is printed verbatim. No "Here's a summary of what the planner found" type messages. |
| 3 | After the reviewer runs, check the orchestrator's output | The FULL reviewer report (all three layers) is printed. Every issue, every layer, every severity. |
| 4 | Trigger Flow 2 by saying "Validate my rules" | The FULL reviewer report is printed after dispatch. No truncation. |

## Phase 5: Full Content Migration (AC3.6)

Purpose: Confirm that ALL content from `writing-osprey-rules` and `debugging-osprey-rules` was migrated, not just section headers.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Obtain a copy of the old `writing-osprey-rules` skill (from git history before deletion) | Old skill content available for comparison |
| 2 | Compare old writing skill Steps 1-3 against `skills/planning-osprey-rules/SKILL.md` | All requirements gathering guidance, clarifying question methodology, label checking, UDF availability checking, and spec output format should be present. No paragraphs of guidance dropped. |
| 3 | Compare old writing skill Steps 4-7 against `skills/authoring-osprey-rules/SKILL.md` | All model writing rules, rule file patterns, effect wiring patterns, execution graph wiring, and verification checklist should be present. |
| 4 | Compare old writing skill "Common Mistakes" section | Each common mistake should appear in either planning-osprey-rules or authoring-osprey-rules, distributed by which phase the mistake occurs in. |
| 5 | Compare old writing skill "Rationalizations" section | Each rationalization should appear in either planning-osprey-rules or authoring-osprey-rules, distributed by relevance. |
| 6 | Obtain a copy of the old `debugging-osprey-rules` skill (from git history) | Old skill content available for comparison |
| 7 | Compare old debugging skill Sections 1-10 against `skills/fixing-osprey-rules/SKILL.md` | All error categories (Type Mismatch, Import Cycle, Undefined Variable, Function Call Error, Duplicate Definition, Rule Constraint), debugging workflow, quick reference table, and end-to-end examples should be present. |
| 8 | Compare old debugging skill Section 11 (proactive checks) against `skills/reviewing-osprey-rules/SKILL.md` Layer 2 | All proactive checks should be present in the reviewing skill's Layer 2 section: type mixing, hardcoded times, `rules_all=`, `JsonData` for entities, dead rules, `(?i)` regex. |
| 9 | Compare old debugging skill severity classification against `skills/reviewing-osprey-rules/SKILL.md` | Severity classification (Critical/Important/Minor) and PASS/FAIL gate definition should be present in the reviewing skill. |

## End-to-End: Full Write Flow

Purpose: Validates the complete AC1.1 + AC5.1-AC5.8 chain.

1. Set up an Osprey rules project with known pre-existing validation errors (to test baseline diffing).
2. In a Claude Code session with the plugin, say "Write a rule for detecting posts with phone numbers."
3. Verify the investigator runs first and produces a structured report.
4. Verify the planner receives the investigator output and asks clarifying questions.
5. Verify the orchestrator captures a baseline BEFORE dispatching the impl.
6. Verify the impl writes SML files to the correct directories.
7. Verify the reviewer runs all three layers and produces a structured report.
8. Verify the orchestrator diffs the reviewer's report against the baseline.
9. If new issues exist, verify the debugger receives ONLY new issues (not pre-existing).
10. Verify the loop exits when zero new issues are found.
11. Verify pre-existing issues are reported to the user but did not block.

## End-to-End: Validate-Only Flow

Purpose: Validates AC1.2 + AC5 baseline skip (Flow 2 doesn't write, so no baseline).

1. In a Claude Code session, say "Validate my rules."
2. Verify the investigator runs first.
3. Verify the planner and impl are NOT dispatched.
4. Verify the reviewer runs and produces a full three-layer report.
5. If issues found, verify the orchestrator asks "Want me to fix these?" via AskUserQuestion.

## End-to-End: Reference Lookup Without Dispatch

Purpose: Validates AC1.4 -- orchestrator handles Flow 4 directly.

1. In a Claude Code session, say "What labeling patterns exist?"
2. Verify NO subagent is dispatched (no investigator, no planner, no impl, no reviewer).
3. Verify the orchestrator loads `osprey-sml-reference` skill directly.
4. Verify the response contains labeling pattern information from the skill.

## Human Verification Required

| Criterion | Why Manual | Steps |
|-----------|-----------|-------|
| AC1.1 | Semantic ordering cannot be verified by grep | Phase 3 above |
| AC1.6 | Runtime output behaviour requires live session | Phase 4 above |
| AC2.5 | Description quality requires human judgement | Phase 1 above |
| AC2.6 | Prose domain knowledge could be embedded without literal SML keywords | Phase 2 above |
| AC3.6 | Full content migration requires line-by-line comparison | Phase 5 above |
