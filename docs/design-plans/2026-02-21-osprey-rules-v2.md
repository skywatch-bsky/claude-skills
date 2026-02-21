# Osprey Rules v2 — Orchestrator Architecture Design

## Summary

The osprey-rules plugin currently has a single agent (`osprey-rule-writer`) that handles everything — gathering requirements, writing SML rules, validating them, and fixing errors — by loading different skills sequentially. This works but doesn't scale: the agent takes on too much responsibility, validation is inconsistent, and there's no principled separation between writing and reviewing.

v2 decomposes this into an orchestrator-and-subagents architecture. The `osprey-rule-writer` becomes a thin coordinator that routes user intent to four specialised subagents: a planner that gathers requirements before any code is written, an implementation agent that writes the actual SML, a reviewer that runs three layers of validation (CLI tool, proactive pattern checks, and convention review), and a debugger that receives structured issue reports and applies fixes. The orchestrator manages the review→fix loop, captures a baseline of pre-existing errors before writing begins so new issues can be cleanly separated from old ones, and escalates to the human if the loop doesn't converge. All domain knowledge lives in skills owned by each agent — the orchestrator itself holds none.

## Definition of Done

1. **osprey-rule-writer becomes a thin orchestrator** — it dispatches domain-specific subagents but never writes SML or loads domain skills itself. Its only job is routing user intent to the right agent and coordinating the write→verify→fix loop.

2. **New domain-specific agents** exist within the osprey-rules plugin: at minimum a verification/review agent (osprey-rule-reviewer) and a debugger/fixer agent (osprey-rule-debugger), alongside the osprey-rule-investigator being built in a separate worktree.

3. **Skills are restructured** to align with the new agent boundaries rather than the current three-skill split (writing, reference, debugging). Each agent gets skills tailored to its responsibility.

4. **Verification is a hard gate** — the reviewer agent runs osprey-cli validation, proactive checks (type mixing, hardcoded time values), AND convention/naming review against sml-conventions.md. Zero issues required to pass.

5. **The orchestrator follows the ed3d dispatch pattern** — thin coordinator dispatching specialized subagents via the Task tool, printing full subagent output for human visibility, and looping on the review→fix→re-review cycle until zero issues.

## Acceptance Criteria

### osprey-rules-v2.AC1: Orchestrator Dispatches Subagents
- **osprey-rules-v2.AC1.1 Success:** Given "write a rule for X", orchestrator dispatches investigator → planner → impl → reviewer in sequence
- **osprey-rules-v2.AC1.2 Success:** Given "validate my rules", orchestrator skips planner and impl, dispatches investigator → reviewer directly
- **osprey-rules-v2.AC1.3 Success:** Given "fix this validation error", orchestrator dispatches investigator → debugger → reviewer
- **osprey-rules-v2.AC1.4 Success:** Given "what labeling patterns exist?", orchestrator loads `osprey-sml-reference` directly without dispatching subagents
- **osprey-rules-v2.AC1.5 Success:** Given "review this rule", orchestrator dispatches reviewer in ad-hoc mode
- **osprey-rules-v2.AC1.6 Success:** Orchestrator prints full subagent output after every dispatch (no summarisation)
- **osprey-rules-v2.AC1.7 Failure:** Orchestrator never writes SML content to any file directly
- **osprey-rules-v2.AC1.8 Failure:** Orchestrator never loads domain skills (except `osprey-sml-reference` for Flow 4)

### osprey-rules-v2.AC2: Domain-Specific Agents Exist
- **osprey-rules-v2.AC2.1 Success:** `osprey-rule-planner` agent exists with AskUserQuestion in allowed-tools, sonnet model, and loads `planning-osprey-rules` skill
- **osprey-rules-v2.AC2.2 Success:** `osprey-rule-impl` agent exists with Edit/Write in allowed-tools, sonnet model, and loads `authoring-osprey-rules` skill
- **osprey-rules-v2.AC2.3 Success:** `osprey-rule-reviewer` agent exists with Bash in allowed-tools (for osprey-cli), sonnet model, and loads `reviewing-osprey-rules` skill
- **osprey-rules-v2.AC2.4 Success:** `osprey-rule-debugger` agent exists with Edit/Write in allowed-tools, sonnet model, and loads `fixing-osprey-rules` skill
- **osprey-rules-v2.AC2.5 Success:** Each agent's description follows "Use when [triggers] — [what it does]" format for auto-delegation
- **osprey-rules-v2.AC2.6 Failure:** No agent contains SML domain knowledge in its prompt (all knowledge lives in skills)

### osprey-rules-v2.AC3: Skills Restructured to Agent Boundaries
- **osprey-rules-v2.AC3.1 Success:** `planning-osprey-rules` skill covers requirements gathering and rule spec output (from writing Steps 1-3)
- **osprey-rules-v2.AC3.2 Success:** `authoring-osprey-rules` skill covers SML authoring workflow (from writing Steps 4-7) with no validation or debugging steps
- **osprey-rules-v2.AC3.3 Success:** `reviewing-osprey-rules` skill defines three-layer verification (osprey-cli, proactive checks, convention review) with severity classification
- **osprey-rules-v2.AC3.4 Success:** `fixing-osprey-rules` skill contains error categories and fix patterns (from debugging skill) without proactive checks
- **osprey-rules-v2.AC3.5 Success:** `osprey-sml-reference` remains consumable by planner, impl, and reviewer agents
- **osprey-rules-v2.AC3.6 Failure:** No domain knowledge from `writing-osprey-rules` or `debugging-osprey-rules` is lost during restructuring — all content accounted for in new skills
- **osprey-rules-v2.AC3.7 Success:** Old skills (`writing-osprey-rules`, `debugging-osprey-rules`) are deleted after content is redistributed

### osprey-rules-v2.AC4: Verification Is a Hard Gate
- **osprey-rules-v2.AC4.1 Success:** Reviewer runs `osprey-cli push-rules --dry-run` as Layer 1 — any non-zero exit code is Critical severity
- **osprey-rules-v2.AC4.2 Success:** Reviewer performs proactive checks as Layer 2 — type mixing, hardcoded times, `rules_all=`, `JsonData` for entities, dead rules, `(?i)` regex
- **osprey-rules-v2.AC4.3 Success:** Reviewer checks conventions as Layer 3 — naming (PascalCase, Rule suffix), descriptions (f-strings), structure (no orphans), label existence in `config/labels.yaml`
- **osprey-rules-v2.AC4.4 Success:** Reviewer output is structured with severity sections (Critical/Important/Minor) and total issue count
- **osprey-rules-v2.AC4.5 Success:** PASS requires zero issues across ALL severity levels (Minor issues are not optional)
- **osprey-rules-v2.AC4.6 Failure:** Reviewer never modifies rule files — read-only analysis only

### osprey-rules-v2.AC5: Orchestrator Follows ed3d Dispatch Pattern
- **osprey-rules-v2.AC5.1 Success:** Baseline capture runs before impl writes anything; baseline is reused across all review cycles
- **osprey-rules-v2.AC5.2 Success:** Post-write reviewer report is diffed against baseline — only new issues block
- **osprey-rules-v2.AC5.3 Success:** Pre-existing issues (in baseline) are reported to human but don't block the gate
- **osprey-rules-v2.AC5.4 Success:** New issues in unmodified files (cross-file breakage) are treated as blocking
- **osprey-rules-v2.AC5.5 Success:** Review→fix loop dispatches debugger with only new issues, not pre-existing ones
- **osprey-rules-v2.AC5.6 Success:** Loop exits at zero new issues OR after max 5 cycles (escalate to human)
- **osprey-rules-v2.AC5.7 Success:** If issue count increases between cycles, orchestrator flags this to the human
- **osprey-rules-v2.AC5.8 Success:** Issues from prior cycles that silently disappear from reviewer output are flagged (silence ≠ fixed)

## Glossary

- **SML**: Osprey's domain-specific declarative language for writing moderation rules. Not Standard ML — uses constructs like `Rule()`, `WhenRules()`, `Import()`, and `Require()`.
- **osprey-cli**: Command-line tool for validating and pushing SML rule files. `osprey-cli push-rules --dry-run` is the primary validation mechanism in Layer 1 of the review gate. Must be invoked via `uv run` from the `osprey-for-atproto` repo.
- **Orchestrator**: An agent whose sole job is routing and coordination. It dispatches specialised subagents rather than doing domain work itself. Pattern borrowed from `ed3d-plan-and-execute`.
- **Skill**: A markdown file loaded into an agent's context at runtime via the `Skill` tool. Skills carry domain knowledge and workflow instructions. Agents are thin; skills are fat.
- **ed3d-plan-and-execute pattern**: Established orchestration pattern: thin coordinator, specialised workers, formal quality gate with fix loop, full output printed for human visibility.
- **Baseline diffing**: Capturing the project's error state before changes, then comparing post-write errors against it. Allows the review loop to ignore pre-existing issues and focus on regressions introduced by current work.
- **Hard gate**: Quality checkpoint that blocks progress unconditionally until it passes. The reviewer is a hard gate — zero issues across all severity levels, including Minor.
- **Proactive checks**: Validation rules that `osprey-cli` does not enforce but that the reviewer catches — type mixing in `when_all`, hardcoded time values, `rules_all=` usage, `JsonData` for entity IDs, dead rules, `(?i)` in regex patterns.
- **Execution graph**: The dependency structure connecting models, rules, and effects in an Osprey rule set, traced from `main.sml` through `Import()` and `Require()` statements.
- **UDF (User-Defined Function)**: Custom functions available in SML rules (e.g., `RegexMatch`, `IncrementWindow`). Implemented as Python classes in `osprey-for-atproto`.
- **osprey-rule-investigator**: Separate read-only subagent (in its own plugin) that catalogues the current project's labels, models, execution graph, and UDF signatures. All Flows 1-3 depend on it.
- **sml-conventions.md**: Reference document within `osprey-sml-reference` defining naming, structural, and description conventions for SML. Used by the reviewer as a checklist in Layer 3.
- **Cross-file breakage**: When changes to one file introduce validation errors in another file that wasn't directly modified. The orchestrator treats this as blocking even though the broken file wasn't touched.
- **haiku / sonnet**: Claude model tiers. Haiku is faster and cheaper, used for read-only agents (investigator). Sonnet is used for agents that reason and write.

## Architecture

The osprey-rules plugin restructures from a single agent that loads skills into an orchestrator that dispatches domain-specific subagents. The architecture follows the ed3d-plan-and-execute pattern: thin coordinator, specialized workers, formal quality gate with fix loop.

### Agent Inventory

**osprey-rule-writer (restructured — orchestrator)**
Pure coordinator. Never writes SML. Never loads domain skills (except `osprey-sml-reference` for Flow 4 reference lookups). Routes user intent to the right subagent via the Task tool. Manages the plan→write→review→fix loop. Prints full subagent output for human visibility. No model override — inherits from caller as the entry point agent.

**osprey-rule-planner (new — requirements gathering)**
Asks the user clarifying questions before any SML is written: event type, behaviour to detect, signals, labels, target entity, examples of content to catch. Produces a structured rule spec (plain text, not SML) for the impl agent. References `osprey-sml-reference` for what's possible and uses investigator output for available labels and models. Model: sonnet. Tools: Read, Grep, Glob, Skill, AskUserQuestion.

**osprey-rule-impl (new — SML author)**
Receives the planner's rule spec and investigator's project context. Writes the actual SML: models, rules, effects, execution graph wiring. References `authoring-osprey-rules` skill and `osprey-sml-reference` for syntax. Does not validate — that's the reviewer's job. Model: sonnet. Tools: Read, Edit, Write, Grep, Glob, Bash, Skill.

**osprey-rule-reviewer (new — verification gate)**
Three-layer verification: (1) `osprey-cli push-rules --dry-run` validation, (2) proactive checks that osprey-cli misses (type mixing in `when_all`, hardcoded time values, `rules_all=` usage, `JsonData` for entity IDs, dead rules, `(?i)` in regex), (3) convention review against `sml-conventions.md` (naming, descriptions, structure). Returns structured findings with severity (Critical/Important/Minor). Zero issues across all severities = PASS. Model: sonnet. Tools: Read, Grep, Glob, Bash, Skill.

**osprey-rule-debugger (new — fixer)**
Receives reviewer's issue report. Diagnoses root causes using error categories. Applies fixes across all issues in one pass. Runs osprey-cli as a self-check before reporting back (not the formal gate — reviewer is the gate). Commits fixes. Model: sonnet. Tools: Read, Edit, Write, Grep, Glob, Bash, Skill.

**osprey-rule-investigator (external plugin — separate worktree)**
Read-only project discovery agent. Already designed in `docs/design-plans/2026-02-21-osprey-rule-investigator.md`. Catalogues labels, models, execution graph, and UDF signatures. Model: haiku. Lives in its own plugin (`osprey-rule-investigator`), spawned as subagent by the orchestrator.

### Orchestrator Flows

**Flow 1: "Write a rule for X" (full pipeline)**
1. Dispatch `osprey-rule-investigator` → project context
2. Dispatch `osprey-rule-planner` → rule spec (receives investigator output)
3. Dispatch `osprey-rule-impl` → SML files (receives planner spec + investigator context)
4. Dispatch `osprey-rule-reviewer` → verify
5. If FAIL → dispatch `osprey-rule-debugger` → fix → re-review → loop until zero issues
6. Done

**Flow 2: "Validate my rules" (bypass to reviewer)**
1. Dispatch `osprey-rule-investigator` → project context
2. Dispatch `osprey-rule-reviewer` → verify
3. If issues → offer to dispatch debugger or just report
4. Done

**Flow 3: "Fix this validation error" (debug entry)**
1. Dispatch `osprey-rule-investigator` → project context
2. Dispatch `osprey-rule-debugger` → fix
3. Dispatch `osprey-rule-reviewer` → verify
4. If FAIL → loop debugger→reviewer
5. Done

**Flow 4: "What labeling patterns exist?" (reference lookup)**
Orchestrator handles directly — loads `osprey-sml-reference` skill. No subagent dispatch needed for pure reference questions.

**Flow 5: "Review this existing rule" (ad-hoc review)**
Dispatch `osprey-rule-reviewer` in ad-hoc mode. Same three-layer verification, same output format. Orchestrator reports findings to human and offers to fix (does not auto-dispatch debugger).

### Review→Fix Loop with Baseline Diffing

The orchestrator manages a review→fix loop that handles pre-existing project errors without burning fix iterations on issues unrelated to the current work.

**Baseline capture:** Before the impl agent writes anything, the orchestrator dispatches the reviewer to capture the current error state. This is the "known issues" baseline.

**Post-write diffing:** After writing, the reviewer runs again. The orchestrator diffs the two reports:
- Issues in both baseline and post-write = **pre-existing** (reported to human, don't block)
- Issues in post-write but NOT in baseline = **new** (block, must hit zero)
- Issues in baseline but NOT in post-write = **resolved** (note as side effect)

**Scoping layer:** The orchestrator tracks which files were created/modified. New issues in modified files = caused by our work, must fix. New issues in unmodified files = cross-file breakage from our work (e.g., duplicate definitions), must also fix. Pre-existing issues in unmodified files = not our problem.

**Loop mechanics:**
1. Reviewer returns structured report (PASS/FAIL).
2. Orchestrator diffs against baseline, isolates new issues.
3. If zero new issues → PASS.
4. If new issues → dispatch debugger with only the new issues.
5. Debugger fixes all issues in one pass, commits, reports back.
6. Orchestrator dispatches reviewer again, diffs against same baseline.
7. Loop until zero new issues, max 5 cycles.

**Safety:**
- Maximum 5 review→fix cycles. If not resolved, escalate to human with remaining issues.
- Track whether issue count is decreasing between cycles. If count goes UP, flag to human.
- Track issues across cycles: if reviewer doesn't mention a prior issue, flag it rather than assuming fixed (silence ≠ fixed).
- The baseline is captured once and reused — it never shifts.

### Skill Restructuring

Current skills split and realign to agent boundaries:

**`writing-osprey-rules` → splits into two:**
- `planning-osprey-rules` (consumed by `osprey-rule-planner`) — requirements gathering, understanding target behaviour, producing a rule spec. From current Steps 1-3.
- `authoring-osprey-rules` (consumed by `osprey-rule-impl`) — writing models, rules, effects, execution graph wiring. From current Steps 4-7. Stripped of investigation, validation, and debugging.

**`osprey-sml-reference` → stays mostly intact:**
Consumed by multiple agents: planner (what's possible), impl (how to write it), reviewer (conventions to check against). The `references/sml-conventions.md` content may need restructuring as checkable criteria for the reviewer rather than prose guidance.

**`debugging-osprey-rules` → restructured:**
- `fixing-osprey-rules` (consumed by `osprey-rule-debugger`) — retains error categories, fix patterns, and fix→re-validate workflow. Drops proactive checks (moved to reviewer).

**New skill:**
- `reviewing-osprey-rules` (consumed by `osprey-rule-reviewer`) — combines osprey-cli validation, proactive checks from debugging Section 11, and convention review from `sml-conventions.md`. Structured as a checklist with severity classification.

**Skill ownership:**

| Agent | Skills |
|-------|--------|
| `osprey-rule-planner` | `planning-osprey-rules`, `osprey-sml-reference` |
| `osprey-rule-impl` | `authoring-osprey-rules`, `osprey-sml-reference` |
| `osprey-rule-reviewer` | `reviewing-osprey-rules`, `osprey-sml-reference` |
| `osprey-rule-debugger` | `fixing-osprey-rules` |
| `osprey-rule-writer` (orchestrator) | `osprey-sml-reference` (Flow 4 only) |

## Existing Patterns

**ed3d-plan-and-execute orchestrator pattern:**
This design directly follows the established pattern from ed3d-plugins: thin orchestrator dispatches specialized subagents via the Task tool, each subagent loads its own skills, orchestrator prints full output, review→fix→re-review loop until zero issues. The reviewer→debugger relationship mirrors code-reviewer→task-bug-fixer.

**osprey-rules plugin structure:**
The new agents and skills follow the existing plugin directory conventions: agents in `agents/`, skills in `skills/<name>/SKILL.md`, command in `commands/`. The `plugin.json` manifest and `CLAUDE.md` documentation patterns are preserved.

**codebase-investigator pattern (from osprey-rule-investigator design):**
The investigator agent follows the established read-only analysis pattern: thin agent, single required skill, haiku model, text-only output. This design integrates with it as a subagent dependency.

**Current osprey-rule-writer routing:**
The existing task routing table pattern (user intent → skill to load) is preserved in the orchestrator, but routes to agents instead of skills.

## Implementation Phases

<!-- START_PHASE_1 -->
### Phase 1: New Agent Definitions
**Goal:** Create the four new agent definition files within the osprey-rules plugin.

**Components:**
- `plugins/osprey-rules/agents/osprey-rule-planner.md` — agent frontmatter and prompt (role, responsibilities, skill loading, output format, constraints)
- `plugins/osprey-rules/agents/osprey-rule-impl.md` — agent frontmatter and prompt
- `plugins/osprey-rules/agents/osprey-rule-reviewer.md` — agent frontmatter and prompt (three-layer verification, severity output format)
- `plugins/osprey-rules/agents/osprey-rule-debugger.md` — agent frontmatter and prompt (issue intake, fix workflow, self-check, commit)

**Dependencies:** None

**Done when:** All four agent files exist with complete frontmatter (name, description, model, color, allowed-tools) and prompt structure (role, mandatory first actions, process steps, output format, constraints)
<!-- END_PHASE_1 -->

<!-- START_PHASE_2 -->
### Phase 2: Skill Restructuring — Planning & Authoring
**Goal:** Split `writing-osprey-rules` into `planning-osprey-rules` and `authoring-osprey-rules`

**Components:**
- `plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md` — requirements gathering workflow, rule spec output format. Derived from current writing skill Steps 1-3.
- `plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md` — SML authoring workflow (models, rules, effects, wiring). Derived from current writing skill Steps 4-7. No validation or debugging.

**Dependencies:** Phase 1 (agents need to exist to reference these skills)

**Done when:** Both skills have complete SKILL.md files with frontmatter, workflow steps, and the current writing skill's domain knowledge is fully distributed between them with no gaps or duplication. Old `writing-osprey-rules` deleted.
<!-- END_PHASE_2 -->

<!-- START_PHASE_3 -->
### Phase 3: Skill Restructuring — Reviewing & Fixing
**Goal:** Create `reviewing-osprey-rules` and restructure `debugging-osprey-rules` into `fixing-osprey-rules`

**Components:**
- `plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md` — three-layer verification methodology (osprey-cli, proactive checks, convention review), severity classification, structured output format, zero-issues gate definition.
- `plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md` — error categories, fix patterns, fix→re-validate workflow. Derived from current debugging skill minus proactive checks (moved to reviewer).

**Dependencies:** Phase 1 (agents reference these skills)

**Done when:** Both skills have complete SKILL.md files. Proactive checks from debugging Section 11 live in reviewing skill. Error categories and fix patterns live in fixing skill. Old `debugging-osprey-rules` deleted.
<!-- END_PHASE_3 -->

<!-- START_PHASE_4 -->
### Phase 4: osprey-sml-reference Updates
**Goal:** Minor restructuring of `osprey-sml-reference` to support multi-agent consumption

**Components:**
- `plugins/osprey-rules/skills/osprey-sml-reference/SKILL.md` — update if needed for multi-agent context (planner, impl, reviewer all consume it)
- `plugins/osprey-rules/skills/osprey-sml-reference/references/sml-conventions.md` — restructure convention content to be checkable criteria (reviewer needs structured checklist, not just prose)

**Dependencies:** Phase 3 (reviewer skill references conventions)

**Done when:** `osprey-sml-reference` works for all three consuming agents. `sml-conventions.md` has checkable criteria format alongside existing guidance.
<!-- END_PHASE_4 -->

<!-- START_PHASE_5 -->
### Phase 5: Orchestrator Restructuring
**Goal:** Restructure `osprey-rule-writer` from skill-loading router to subagent-dispatching orchestrator

**Components:**
- `plugins/osprey-rules/agents/osprey-rule-writer.md` — complete rewrite: orchestrator identity, flow routing table (5 flows), baseline capture logic, review→fix loop with diffing, max iteration safety, full output printing rules, escalation to human

**Dependencies:** Phases 1-4 (all agents and skills must exist before the orchestrator can reference them)

**Done when:** Orchestrator prompt defines all five flows, baseline diffing logic, loop safety mechanics, and references all subagents by name. Orchestrator never writes SML, never loads domain skills (except `osprey-sml-reference` for Flow 4).
<!-- END_PHASE_5 -->

<!-- START_PHASE_6 -->
### Phase 6: Plugin Manifest & Documentation
**Goal:** Update `plugin.json` and `CLAUDE.md` to reflect new architecture

**Components:**
- `plugins/osprey-rules/.claude-plugin/plugin.json` — updated agent/skill inventory
- `plugins/osprey-rules/CLAUDE.md` — updated contracts (new agents, new skills, orchestrator pattern), dependencies (osprey-rule-investigator), key decisions (full decomposition rationale), key files, gotchas

**Dependencies:** Phase 5 (all components finalized)

**Done when:** `plugin.json` lists all agents and skills. `CLAUDE.md` accurately documents the v2 architecture, contracts, and dependencies.
<!-- END_PHASE_6 -->

## Additional Considerations

**osprey-rule-investigator dependency:** The orchestrator depends on the `osprey-rule-investigator` plugin being installed. If it's not available, Flows 1-3 and 5 cannot run (they all need project context). The orchestrator should detect this and inform the user rather than failing silently.

**Baseline capture cost:** The baseline reviewer dispatch adds one subagent call to every Flow 1 execution. This is acceptable because it prevents the debugger from wasting cycles on pre-existing issues, which is a worse cost.

**Skill migration:** When deleting `writing-osprey-rules` and `debugging-osprey-rules`, all domain knowledge must be accounted for in the new skills. No content should be lost — only redistributed. The implementation plan should include a verification step that diffs content coverage.
