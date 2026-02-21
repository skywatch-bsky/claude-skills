# Osprey Rules v2 Implementation Plan — Phase 2: Skill Restructuring — Planning & Authoring

**Goal:** Split `writing-osprey-rules` into two new skills: `planning-osprey-rules` (requirements gathering) and `authoring-osprey-rules` (SML authoring, Steps 4-7). Delete old skill after redistribution.

**Architecture:** Each skill is a SKILL.md file in its own directory under `plugins/osprey-rules/skills/`. Planning skill covers requirements gathering and rule spec production — it receives project context from the orchestrator (which dispatches the investigator separately). Authoring skill covers model writing, rule writing, effect wiring, and execution graph wiring. Cross-cutting content (common mistakes, rationalizations) is distributed to the skill where it's most relevant.

**Tech Stack:** Claude Code skill definitions (markdown with YAML frontmatter)

**Scope:** 6 phases from original design (phase 2 of 6)

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase implements:

### osprey-rules-v2.AC3: Skills Restructured to Agent Boundaries
- **osprey-rules-v2.AC3.1 Success:** `planning-osprey-rules` skill covers requirements gathering and rule spec output (from writing Steps 1-3)
- **osprey-rules-v2.AC3.2 Success:** `authoring-osprey-rules` skill covers SML authoring workflow (from writing Steps 4-7) with no validation or debugging steps
- **osprey-rules-v2.AC3.6 Failure:** No domain knowledge from `writing-osprey-rules` or `debugging-osprey-rules` is lost during restructuring — all content accounted for in new skills
- **osprey-rules-v2.AC3.7 Success:** Old skills (`writing-osprey-rules`, `debugging-osprey-rules`) are deleted after content is redistributed

**Note:** AC3.7 is partially addressed here (writing-osprey-rules deleted). The debugging skill deletion happens in Phase 3.

**Verifies: None** — infrastructure phase. Verification is structural (skills exist with correct content, old skill deleted).

**IMPORTANT — Triple Backtick Escaping:** All code blocks in the skill content below use `` ` ` ` `` (spaced backticks) to avoid markdown rendering conflicts in this plan document. When creating the actual SKILL.md files, replace ALL `` ` ` ` `` sequences with real triple backticks (`` ``` ``).

---

<!-- START_SUBCOMPONENT_A (tasks 1-2) -->

<!-- START_TASK_1 -->
### Task 1: Create planning-osprey-rules skill

**Files:**
- Create: `plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md`

**Step 1: Create the skill directory**

Run: `mkdir -p plugins/osprey-rules/skills/planning-osprey-rules`

**Step 2: Create the skill file**

Write the following to `plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md`. This content is derived from the current `writing-osprey-rules` requirements gathering workflow (Step 3), adapted for the v2 architecture where the orchestrator handles path collection and investigator dispatch.

**IMPORTANT: When writing this file, replace all `` ` ` ` `` (spaced backtick) sequences with real triple backticks. The spacing is used in this plan document only to avoid markdown rendering conflicts.**

```markdown
---
name: planning-osprey-rules
description: Use when gathering requirements for a new Osprey SML rule before any code is written. Not triggered on general coding tasks — only when planning what a rule should detect, which labels to apply, and what signals to use.
user-invocable: false
---

# Planning Osprey Rules

This workflow guides you through gathering requirements and producing a structured
rule specification before any SML code is written.

## 1. Validate Input Context

The orchestrator provides you with context before you begin. Verify you have
everything you need.

**Required inputs (provided by orchestrator in your prompt):**
1. **Investigator report** — structured text report from `osprey-rule-investigator`
   containing project structure, labels table, model catalogue, UDF signatures,
   and execution graph map.
2. **User request** — what the user wants a rule for.

**Validate the investigator report contains:**
- Labels table (label names, valid_for, connotation)
- Model catalogue (variable names, types)
- UDF signatures (available functions)
- Execution graph map (Import/Require chains)

**If the investigator report is missing or incomplete:** Report what's missing and
ask the orchestrator to re-dispatch the investigator. Do NOT proceed without
project context.

## 2. Understand the Target Behaviour

Before writing any code, understand what the user wants to detect.

**Ask clarifying questions:**
1. **What event type?** (post, follow, identity, repost, etc.)
2. **What signals?** (text patterns, metadata, account age, etc.)
3. **What label to emit?** (must exist in `config/labels.yaml`)
4. **Expiration/validity?** (permanent, expiring, conditional)
5. **Who/what gets labeled?** (the account, the post, both?)

**Map to labeling patterns:**
- Chain to `osprey-sml-reference` skill to look up common labeling patterns if you
  need naming conventions or syntax examples.
- Document the detection logic in plain English before writing code.

Example user request:
> "I want to detect posts that contain profanity and label them with 'contains-profanity'."

Analysis:
- Event type: record (post)
- Signal: post text content contains profanity
- Label: contains-profanity (check labels.yaml to confirm it exists)
- Target: the post (AtUri)

## 3. Produce Rule Specification

After gathering requirements, produce a structured plain-text specification that the
implementation agent can use to write SML.

**Rule specification format:**

` ` `
## Rule Specification: [Rule Name]

**Target behaviour:** [What the rule detects]
**Event type:** [Which AT Protocol event triggers the rule]
**Signals:** [What data points the rule examines]
**Models needed:** [ML models or UDFs required, referencing available ones from investigator report]
**Labels to apply:** [Which labels from config/labels.yaml to use]
**Target entity:** [What gets labeled — account, record, etc.]
**Effect type:** [LabelAdd, AtprotoLabel, DeclareVerdict, etc.]
**Expiration:** [Duration if applicable, using named constants: Day, Hour, Week]
**Guard conditions:** [Re-labeling prevention if needed]

**Detection logic (plain English):**
[Step-by-step description of what conditions trigger the rule]

**Examples:**
- Should catch: [content examples]
- Should NOT catch: [counter-examples]

**Edge cases:**
- [Boundary conditions discussed with the user]
` ` `

**Confirm with user:** Present the specification and get explicit confirmation before
handing off to the implementation agent.

## 4. Skill Chaining

Load additional skills when you need specialized guidance during planning.

**When to chain to `osprey-sml-reference`:**
- Need to look up available labeling patterns
- Unsure of naming conventions for the planned rule
- Need to understand what effect types are available
- Want to verify a UDF exists or understand its signature

Load with: `Skill(skill='osprey-sml-reference')`

## 5. Common Mistakes

These are planning-phase mistakes that lead to problems downstream.

1. **Hardcoding label names not in `config/labels.yaml`**
   - Wrong: Plan a rule using a label without checking if it exists
   - Right: Check `config/labels.yaml` using the investigator report first
   - Impact: Validation fails when implementation agent writes the effect

2. **Not asking about the target entity**
   - Wrong: Assume every rule labels the account
   - Right: Ask whether the account, the post, or both should be labeled
   - Impact: Wrong entity type in models, must rewrite

3. **Skipping UDF availability check**
   - Wrong: Plan a rule assuming a UDF exists
   - Right: Check the investigator's UDF catalogue for available functions
   - Impact: Implementation agent discovers missing UDF mid-authoring

## 6. Rationalizations to Block

| Rationalization | Reality | Action |
| --- | --- | --- |
| "This label probably exists" | No. Labels must be explicitly configured. | Check the investigator report's labels table and confirm the label exists before including it in the spec. |
| "I know the type system" | No. SML type rules are strict. | Load `osprey-sml-reference` if uncertain about EntityJson vs JsonData. |
| "The investigator report looks fine" | No. Incomplete context causes downstream failures. | Validate every required section of the investigator report before proceeding. |
| "I'll figure out the entity type later" | No. Entity type determines model structure. | Ask the user what gets labeled (account, record, both) during requirements gathering. |
| "The user knows what they want" | Requirements need refinement. | Always ask clarifying questions even if the request seems clear. |

---

**Output:** A confirmed rule specification in plain text. Hand this to the
orchestrator, which passes it to `osprey-rule-impl` with the investigator report.
```

**Note:** The triple backticks in the code blocks above must be actual backticks in the file. The `` ` ` ` `` notation is used here to avoid markdown rendering issues in this plan document. When creating the file, use real triple backticks.

**Step 3: Verify the file was created**

Run: `test -f plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && echo "OK" || echo "FAIL"`
Expected: `OK`

**Step 4: Verify frontmatter**

Run: `head -5 plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md`
Expected: YAML frontmatter with name: planning-osprey-rules, user-invocable: false

**Commit:** `feat(osprey-rules): add planning-osprey-rules skill (requirements gathering from writing-osprey-rules)`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create authoring-osprey-rules skill

**Files:**
- Create: `plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md`

**Step 1: Create the skill directory**

Run: `mkdir -p plugins/osprey-rules/skills/authoring-osprey-rules`

**Step 2: Create the skill file**

Write the following to `plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md`. This content is derived from the current `writing-osprey-rules` Steps 4-7, with relevant common mistakes and rationalizations redistributed here. The authoring skill covers writing only — validation is the reviewer's responsibility (dispatched by the orchestrator after authoring completes).

```markdown
---
name: authoring-osprey-rules
description: Use when writing or modifying Osprey SML rule files from a validated rule specification. Covers model writing, rule writing, effect wiring, and execution graph wiring. Not triggered on general coding tasks.
user-invocable: false
---

# Authoring Osprey Rules

This workflow guides you through writing valid Osprey SML from a rule specification.
You receive a confirmed rule spec from the planner and project context from the
investigator. Your job is to write the SML files.

## Input Expectations

Before starting, you should have received:
1. **Rule specification** — plain-text spec from the planner describing what to build
2. **Investigator report** — project context with labels, models, UDFs, execution graph
3. **Project paths** — rules project directory and osprey-for-atproto repo path

If any of these are missing, report what's missing and stop.

## 1. Write Models (if needed)

If the rule needs features not already defined in existing models, create or extend
a model file.

**Model hierarchy:**
- `models/base.sml` → global definitions (UserId, Handle, ActionName, time constants)
- `models/record/base.sml` → features available on all record types
- `models/record/post.sml` → post-specific features (text, URLs, mentions)
- etc.

**Rules for model writing:**

1. **EntityJson vs JsonData:**
   - Use `EntityJson` for entity identifiers (things that labels attach to)
   - Use `JsonData` for primitive values (strings, ints, booleans)
   - **CRITICAL: Never use `JsonData` for IDs that labels will attach to. Use `EntityJson` instead.**

2. **Import base models:**
   ` ` `sml
   Import(
     rules=['models/base.sml'],
   )
   ` ` `

3. **Naming conventions:**
   - Variable names: PascalCase for main definitions
   - Private/intermediate variables: `_PascalCase` prefix

4. **Example model extension:**
   ` ` `sml
   Import(
     rules=['models/base.sml'],
   )

   _PostText: str = JsonData(
     path='$.record.text',
     required=False,
   )

   _PostUrl: Optional[str] = JsonData(
     path='$.record.facets[*].features[*].uri',
     required=False,
   )
   ` ` `

## 2. Write Rules

Create rule files in the correct directory based on event type.

**Directory structure:**
- Post rules → `rules/record/post/`
- Follow rules → `rules/record/follow/`
- Identity rules → `rules/identity/`
- Repost rules → `rules/record/repost/`
- etc.

**Rule file pattern:**

` ` `sml
Import(
  rules=[
    'models/base.sml',
    'models/record/post.sml',  # or appropriate model file
  ],
)

_IsProfanity = ContainsAnyPattern(
  text=PostText,
  patterns=ProfanityList,
)

Rule(
  when_all=[
    _IsProfanity,
    UserId != None,
  ],
  description=f'Post contains profanity',
)
` ` `

**Naming conventions:**
- Intermediate variables: `_PascalCase` prefix
- Rule names: PascalCase, `Rule` suffix (implicit from `Rule()` definition)
- Descriptive: explain what the rule detects

**Rule construction:**
- `Rule(when_all=[...], description=f'...')`
- `when_all` contains a list of conditions that must all be true
- All conditions must be type `bool` or `RuleT` — do not mix types

## 3. Wire Effects

Connect rules to effects via `WhenRules()`.

**Pattern:**
` ` `sml
WhenRules(
  rules_any=[RuleName],
  then=[
    LabelAdd(entity=UserId, label='label-name'),
  ],
)
` ` `

**Critical constraints:**

1. **Only use labels that exist in `config/labels.yaml`.**
   - Before writing an effect, verify the label name in the labels file.
   - If the label doesn't exist, tell the user they must add it to `config/labels.yaml` first.
   - **CRITICAL: Do not hardcode label names not present in the configuration.**

2. **Choose the right effect type:**
   - `LabelAdd` / `LabelRemove` → internal Osprey labels (most common)
   - `AtprotoLabel` → emit to Bluesky's Ozone
   - `DeclareVerdict` → synchronous decision (emit immediately)

3. **Prevent re-labeling:**
   - Use `HasAtprotoLabel(entity=UserId, label='label-name')` as a guard in the rule's `when_all` to avoid re-labeling.
   - Pattern: `not _HasLabelX` (use negation to skip if already labeled)

4. **Example with guard:**
   ` ` `sml
   Import(
     rules=['models/label_guards.sml'],
   )

   WhenRules(
     rules_any=[ProfanityRule],
     then=[
       LabelAdd(
         entity=UserId,
         label='contains-profanity',
         expires_after=Day * 30,
       ),
     ],
   )
   ` ` `

## 4. Wire into Execution Graph

Update the appropriate `index.sml` to load your new rule file.

**Pattern:**
- Unconditional: `Require(rule='rules/record/post/new_rule.sml')`
- Conditional: `Require(rule='...', require_if=IsOperation)`

**If creating a new event type directory:**
1. Create the directory: `rules/[event-type]/`
2. Create its `index.sml` with imports and local requires
3. Wire the new `index.sml` into the parent `rules/index.sml`

**Example wiring:**
` ` `sml
# rules/record/post/index.sml
Import(
  rules=['models/base.sml'],
)

Require(rule='rules/record/post/profanity_rule.sml')
Require(rule='rules/record/post/spam_rule.sml')
` ` `

Then update `rules/record/index.sml`:
` ` `sml
Require(rule='rules/record/post/index.sml')
` ` `

**Verification checklist:**
- [ ] Rule file created in correct directory
- [ ] Rule file imported/required in appropriate `index.sml`
- [ ] Parent `index.sml` updated if creating new directory
- [ ] All imports point to valid model files

## 5. Report Files Written

After completing all authoring steps, report to the orchestrator:
- Which files were created
- Which files were modified
- What the rule does (brief summary)

Do NOT run validation yourself — the orchestrator dispatches the reviewer for that.

## 6. Skill Chaining

Load additional skills when you need specialized guidance during authoring.

**When to chain to `osprey-sml-reference`:**
- Need SML syntax reference or examples
- Unsure of naming conventions
- Need to look up labeling patterns
- Want to understand how to use list-based matching

Load with: `Skill(skill='osprey-sml-reference')`

## 7. Common Mistakes

These are authoring mistakes that cause rules to fail validation or not work as intended.

1. **Using `JsonData` where `EntityJson` is required**
   - Wrong: `UserId: str = JsonData(path='$.did')`
   - Right: `UserId: Entity[str] = EntityJson(type='UserId', path='$.did')`
   - Impact: Labels cannot attach to non-Entity types

2. **Mixing `RuleT` and `bool` in `when_all` lists**
   - Wrong: `when_all=[RuleA, SomeBoolean, RuleB]`
   - Right: Keep all conditions as `RuleT` or all as `bool`, don't mix
   - Impact: Type error, validation fails

3. **Forgetting to wire new rule into `index.sml`**
   - Wrong: Create `rules/record/post/new_rule.sml` but don't `Require` it
   - Right: Add `Require(rule='rules/record/post/new_rule.sml')` to the appropriate index
   - Impact: Rule is never executed

4. **Forgetting to run validation after writing**
   - Wrong: Assuming the rules work without validation
   - Right: The orchestrator dispatches the reviewer after authoring completes
   - Impact: Silent failures, invalid rules in production

5. **Using `rules_all=` instead of `rules_any=` in `WhenRules`**
   - Wrong: `WhenRules(rules_all=[RuleA], then=[...])`
   - Right: `WhenRules(rules_any=[RuleA], then=[...])`
   - Impact: Effects don't trigger, validation may fail

6. **Creating dead rules not referenced by any `WhenRules`**
   - Wrong: Define `Rule(...)` but never use it in a `WhenRules(...)`
   - Right: Every `Rule` must be referenced by at least one `WhenRules`
   - Impact: Dead code, no effect on labeling

## 8. Rationalizations to Block

| Rationalization | Reality | Action |
| --- | --- | --- |
| "I'll validate later" | No. The orchestrator runs validation immediately after authoring. Do not skip steps hoping validation will catch them. | Write correct SML the first time. Follow the skill steps in order. |
| "I'll skip the index wiring" | No. Rules not in the execution graph don't run. | Update `index.sml` to require the new rule. Verify the wiring is correct. |
| "I don't need to check labels.yaml" | No. Using undefined labels is a validation error. | Every effect must reference a label that exists in `config/labels.yaml`. |
| "The model file is correct, I'll ship it" | No. Models are compile-time dependencies. | Double-check EntityJson vs JsonData usage. Verify imports are correct. |
| "I'll use JsonData for this entity ID" | No. Entity IDs must be EntityJson. | Use `EntityJson` for anything that will be labeled. Use `JsonData` only for primitive values. |
| "osprey-cli will catch it" | Validation catches syntax errors, not all logic or convention violations. | Follow the authoring steps carefully. Don't rely on validation as your only safety net. |
| "86400 is clearer than Day" | It's not. Time constants from `models/base.sml` are the convention. | Replace all hardcoded time values: `86400` → `Day`, `3600` → `Hour`, `604800` → `Week`, etc. |
| "I'll just run osprey-cli directly" | It's not on PATH. It must be invoked via `uv run` from the osprey-for-atproto repo. | Always use `uv run osprey-cli push-rules <path> --dry-run` from the osprey repo. |
| "This is urgent, skip validation" | Urgency doesn't excuse broken rules. The orchestrator validates after you're done — your job is to write correct SML. | Follow every step. Correct SML is faster than debugging broken SML. |

---

**Output:** SML files written to the rules project. Report which files were created
or modified back to the orchestrator.
```

**Note:** Same as Task 1 — the `` ` ` ` `` notation represents real triple backticks in the actual file.

**Step 3: Verify the file was created**

Run: `test -f plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && echo "OK" || echo "FAIL"`
Expected: `OK`

**Step 4: Verify frontmatter**

Run: `head -5 plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md`
Expected: YAML frontmatter with name: authoring-osprey-rules, user-invocable: false

**Commit:** `feat(osprey-rules): add authoring-osprey-rules skill (Steps 4-7 from writing-osprey-rules)`
<!-- END_TASK_2 -->

<!-- END_SUBCOMPONENT_A -->

<!-- START_TASK_3 -->
### Task 3: Verify content coverage — no knowledge lost

Before deleting the old skill, verify that ALL content from `writing-osprey-rules` is accounted for in the two new skills.

**Step 1: Verify planning skill content covers requirements gathering**

Run:
```bash
# Check key concepts from planning workflow are present
grep -q "Validate Input Context" plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && \
grep -q "Understand the Target" plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && \
grep -q "Produce Rule Specification" plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && \
grep -q "investigator report" plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && \
grep -q "clarifying questions" plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && \
echo "Planning skill coverage OK" || echo "Planning skill coverage FAIL"
```

**Step 2: Verify Steps 4-7 content is in authoring skill**

Run:
```bash
# Check key concepts from Steps 4-7 are present
grep -q "Write Models" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "Write Rules" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "Wire Effects" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "Wire into Execution Graph" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "EntityJson" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "WhenRules" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
echo "Steps 4-7 coverage OK" || echo "Steps 4-7 coverage FAIL"
```

**Step 3: Verify common mistakes are distributed**

Run:
```bash
# Check mistake patterns are present in at least one new skill
grep -q "JsonData.*EntityJson\|EntityJson.*JsonData" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "rules_all.*rules_any\|rules_any.*rules_all" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "labels.yaml" plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && \
grep -q "dead rules\|Dead rules\|never.*WhenRules\|WhenRules.*never" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "RuleT.*bool\|bool.*RuleT\|when_all.*type" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
echo "Mistakes coverage OK" || echo "Mistakes coverage FAIL"
```

**Step 4: Verify rationalizations are distributed**

Run:
```bash
# Check key rationalizations are present in at least one new skill
grep -q "validate later" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "label probably exists" plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && \
grep -q "86400" plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
grep -q "investigator report looks fine" plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && \
echo "Rationalizations coverage OK" || echo "Rationalizations coverage FAIL"
```

Expected: All checks pass.

<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: Delete old writing-osprey-rules skill

**Files:**
- Delete: `plugins/osprey-rules/skills/writing-osprey-rules/SKILL.md`
- Delete: `plugins/osprey-rules/skills/writing-osprey-rules/.gitkeep`
- Delete: `plugins/osprey-rules/skills/writing-osprey-rules/` (directory)

**Step 1: Delete the old skill directory**

Run:
```bash
rm -rf plugins/osprey-rules/skills/writing-osprey-rules
```

**Step 2: Verify deletion**

Run: `test -d plugins/osprey-rules/skills/writing-osprey-rules && echo "FAIL: still exists" || echo "OK: deleted"`
Expected: `OK: deleted`

**Step 3: Verify new skills still exist**

Run:
```bash
test -f plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md && \
test -f plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md && \
echo "New skills intact" || echo "FAIL: new skills missing"
```
Expected: `New skills intact`

**Commit:** `refactor(osprey-rules): delete writing-osprey-rules (replaced by planning + authoring skills)`
<!-- END_TASK_4 -->
