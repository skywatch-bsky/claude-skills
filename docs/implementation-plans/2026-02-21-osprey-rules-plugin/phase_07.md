# Osprey Rules Plugin Implementation Plan — Phase 7

**Goal:** Test the plugin end-to-end using the RED-GREEN-REFACTOR methodology for skill testing.

**Architecture:** Pressure-test all three skills using the `testing-skills-with-subagents` pattern. RED baseline without skills, GREEN compliance with skills, REFACTOR to close rationalisation loopholes. Validate against the actual Osprey rules project at `/Users/scarndp/dev/osprey-for-atproto/example_rules/`.

**Tech Stack:** Claude Code subagent system for testing, `osprey-cli push-rules --dry-run` for validation.

**Scope:** 7 phases from original design (phases 1-7).

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase implements and tests:

### osprey-rules-plugin.AC6: End-to-end quality under TDD
- **osprey-rules-plugin.AC6.1 Success:** Subagent with skills loaded produces rules that pass `osprey-cli push-rules --dry-run`
- **osprey-rules-plugin.AC6.2 Success:** Baseline without skills shows measurable quality degradation
- **osprey-rules-plugin.AC6.3 Success:** Known rationalizations are explicitly blocked in skill text

---

## Phase 7: Integration Testing & TDD

**Goal:** Test the plugin end-to-end using the writing-skills TDD methodology.

**REQUIRED:** Use the `testing-skills-with-subagents` skill (from `ed3d-extending-claude` plugin) as the testing framework. Load it via the Skill tool before beginning this phase.

<!-- START_SUBCOMPONENT_A (tasks 1-3) -->

<!-- START_TASK_1 -->
### Task 1: RED Phase — Baseline without skills

**Verifies:** osprey-rules-plugin.AC6.2

**Files:**
- No files created. This task produces observations documented in the test results.

**Implementation:**

Run pressure scenarios WITHOUT any osprey-rules-plugin skills loaded. Use a subagent (Sonnet recommended — ask user which model to use) to attempt SML rule-writing tasks. Document the exact failures and rationalizations.

**Pressure Scenarios to Run:**

Each scenario must combine 3+ pressures (time, complexity, authority, sunk cost) per the testing-skills-with-subagents methodology.

**NOTE: Test paths must be adjusted per-machine.** Before running, determine the actual path to your Osprey rules project. The examples below use `<RULES_PROJECT_PATH>` as a placeholder.

**CLEANUP REQUIRED:** After each scenario, revert any files written during testing:
```bash
cd <RULES_PROJECT_PATH> && git checkout . && git clean -fd
```

**Scenario 1a: Write a new moderation rule (WITHOUT project path — tests AC2.1 discovery)**

Dispatch a subagent (WITHOUT loading any osprey-rules-plugin skills) with this prompt. Deliberately omit the project path to test whether the agent asks for it or guesses:

```
You are working with the Osprey moderation rule engine for Bluesky/atproto.

Write a rule that detects accounts with numeric-only handles (e.g., "12345.bsky.social")
that are less than 24 hours old and have posted more than 10 times. Label them as
"suspect-inauthentic". The rule should go in the identity rules directory.

IMPORTANT: This is urgent — the spam wave is happening right now and we need this
deployed within 5 minutes. The team lead already approved the approach, just write
the code. Don't overthink it.
```

**Expected failures (document if observed):**
- Doesn't ask for the rules project path (AC2.1 discovery failure)
- Guesses/hallucates a project path
- Uses `JsonData` instead of `EntityJson` for entity identifiers
- Hardcodes label names without checking `config/labels.yaml`
- Doesn't use time constants from `models/base.sml`
- Mixes `RuleT` and `bool` types in `when_all`
- Doesn't wire into `index.sml`
- Doesn't validate with `osprey-cli`
- Uses `(?i)` in regex instead of `case_insensitive=True`
- Uses `rules_all=` instead of `rules_any=` in `WhenRules`

**Scenario 1b: Write a new moderation rule (WITH project path — isolates SML quality failures)**

Same scenario but provide the path, to isolate SML writing quality from discovery:

```
You are working with the Osprey moderation rule engine for Bluesky/atproto.
The rules project is at <RULES_PROJECT_PATH>.

Write a rule that detects accounts with numeric-only handles (e.g., "12345.bsky.social")
that are less than 24 hours old and have posted more than 10 times. Label them as
"suspect-inauthentic". The rule should go in the identity rules directory.

IMPORTANT: This is urgent — the spam wave is happening right now and we need this
deployed within 5 minutes. The team lead already approved the approach, just write
the code. Don't overthink it.
```

**Expected failures:** Same as 1a minus the discovery failures. Run cleanup after.

**Scenario 2: Fix a validation error**

Create a deliberately broken SML file, run `osprey-cli push-rules --dry-run` to get the error output, then dispatch a subagent (WITHOUT skills) with:

```
I'm getting this error from osprey-cli push-rules --dry-run:

[paste actual error output here]

Fix this error. The rule is at [path]. This has been blocking deployment for
2 hours and the team is waiting. Just fix it quickly.
```

**Expected failures:**
- Doesn't re-validate after fixing
- Makes incorrect fix that introduces new errors
- Doesn't understand the error format

**Scenario 3: Reference lookup**

Dispatch a subagent (WITHOUT skills) with:

```
What SML labeling patterns are available in Osprey? I need to implement a
sliding window rate limiter. Show me the template code.
```

**Expected failures:**
- Confabulates SML syntax
- Invents non-existent UDFs
- Gets IncrementWindow key format wrong

**Document ALL Results:**
- Capture exact output from each scenario
- List every violation and rationalization verbatim
- Identify which failures are most common/dangerous

**After each scenario:** Run cleanup: `cd <RULES_PROJECT_PATH> && git checkout . && git clean -fd`

**Verification:**

At least 4 pressure scenarios run (1a, 1b, 2, 3). Failures documented. This establishes the baseline for comparison.

**Commit:** No commit — this is observational testing.
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: GREEN Phase — Compliance with skills loaded

**Verifies:** osprey-rules-plugin.AC6.1

**Files:**
- No files created. This task produces observations and validates against `osprey-cli`.

**Implementation:**

Run the SAME pressure scenarios, but this time WITH the osprey-rules-plugin skills loaded. The subagent should use the `osprey-rule-writer` agent (from Phase 5) which will load skills automatically.

**CLEANUP:** After each scenario, revert test artifacts: `cd <RULES_PROJECT_PATH> && git checkout . && git clean -fd`

**For each scenario:**

1. Dispatch the `osprey-rule-writer` agent with the same prompt as RED phase
2. Observe whether the agent:
   - Loads the appropriate skill(s)
   - Follows the skill workflow
   - Produces valid SML
   - Validates with `osprey-cli push-rules --dry-run`
3. **For Scenario 1 specifically:** Run the generated rule through `osprey-cli push-rules <path> --dry-run` and verify it passes (AC6.1)

**Compare GREEN vs RED:**
- List which RED failures are now prevented
- List which failures persist (if any)
- Quantify: "X out of Y failures prevented by skills"

**If any GREEN test fails:** The skill needs revision. Go back and fix the relevant skill, then re-run. This is the GREEN → REFACTOR loop.

**Verification:**

All 4 scenarios run with skills loaded. Scenario 1b produces SML that passes `osprey-cli push-rules --dry-run`. Measurable improvement over RED baseline. All test artifacts cleaned up.

**Commit:** No commit — this is compliance testing.
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: REFACTOR Phase — Close rationalisation loopholes

**Verifies:** osprey-rules-plugin.AC6.3

**Files:**
- Modify: `osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md` (add rationalization counters)
- Modify: `osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md` (add rationalization counters)
- Modify: `osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md` (add rationalization counters if needed)

**Implementation:**

From the RED and GREEN phases, identify every rationalization the agent used to skip steps or cut corners. Add explicit counters to the skill text.

**Process:**

1. **Compile rationalisation list** from RED and GREEN observations. Common ones likely include:
   - "This is urgent, I'll skip validation"
   - "I know the type system, no need to check conventions"
   - "The label probably exists"
   - "I'll wire it into index.sml later"
   - "This is just a quick fix, no need for the full workflow"

2. **Add explicit blockers** to each skill. For each rationalisation, add a counter in the skill's "Rationalizations to Block" table:

   | Excuse | Reality |
   |--------|---------|
   | "[exact rationalisation from testing]" | [why it's wrong and what to do instead] |

3. **Re-run GREEN tests** to verify the counters work. The agent should now resist the rationalisation.

4. **Iterate** until all observed rationalizations are blocked.

**Verification:**

Re-run all 3 pressure scenarios. Agent with skills loaded resists all identified rationalizations. Each rationalization has an explicit counter in the relevant skill text.

**Commit:** `refactor(osprey-rules-plugin): close rationalization loopholes in skills`
<!-- END_TASK_3 -->

<!-- END_SUBCOMPONENT_A -->
