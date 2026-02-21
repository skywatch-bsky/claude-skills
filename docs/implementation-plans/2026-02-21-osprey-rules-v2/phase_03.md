# Osprey Rules v2 Implementation Plan — Phase 3: Skill Restructuring — Reviewing & Fixing

**Goal:** Create `reviewing-osprey-rules` skill (three-layer verification) and restructure `debugging-osprey-rules` into `fixing-osprey-rules` (error categories and fix patterns without proactive checks). Delete old debugging skill after redistribution.

**Architecture:** Reviewing skill defines the three-layer verification gate (osprey-cli, proactive checks from debugging Section 11, convention review against sml-conventions.md). Fixing skill retains error categories and fix patterns (Sections 1-10 of debugging) without the proactive checks that moved to the reviewer.

**Tech Stack:** Claude Code skill definitions (markdown with YAML frontmatter)

**Scope:** 6 phases from original design (phase 3 of 6)

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase implements:

### osprey-rules-v2.AC3: Skills Restructured to Agent Boundaries
- **osprey-rules-v2.AC3.3 Success:** `reviewing-osprey-rules` skill defines three-layer verification (osprey-cli, proactive checks, convention review) with severity classification
- **osprey-rules-v2.AC3.4 Success:** `fixing-osprey-rules` skill contains error categories and fix patterns (from debugging skill) without proactive checks
- **osprey-rules-v2.AC3.6 Failure:** No domain knowledge from `writing-osprey-rules` or `debugging-osprey-rules` is lost during restructuring — all content accounted for in new skills
- **osprey-rules-v2.AC3.7 Success:** Old skills (`writing-osprey-rules`, `debugging-osprey-rules`) are deleted after content is redistributed

### osprey-rules-v2.AC4: Verification Is a Hard Gate
- **osprey-rules-v2.AC4.1 Success:** Reviewer runs `osprey-cli push-rules --dry-run` as Layer 1 — any non-zero exit code is Critical severity
- **osprey-rules-v2.AC4.2 Success:** Reviewer performs proactive checks as Layer 2 — type mixing, hardcoded times, `rules_all=`, `JsonData` for entities, dead rules, `(?i)` regex
- **osprey-rules-v2.AC4.3 Success:** Reviewer checks conventions as Layer 3 — naming (PascalCase, Rule suffix), descriptions (f-strings), structure (no orphans), label existence in `config/labels.yaml`
- **osprey-rules-v2.AC4.4 Success:** Reviewer output is structured with severity sections (Critical/Important/Minor) and total issue count
- **osprey-rules-v2.AC4.5 Success:** PASS requires zero issues across ALL severity levels (Minor issues are not optional)
- **osprey-rules-v2.AC4.6 Failure:** Reviewer never modifies rule files — read-only analysis only

**Note:** AC3.7 completes here (debugging-osprey-rules deleted). The writing-osprey-rules deletion was done in Phase 2.

**Verifies: None** — infrastructure phase. Verification is structural.

**IMPORTANT — Triple Backtick Escaping:** All code blocks in the skill content below use `` ` ` ` `` (spaced backticks) to avoid markdown rendering conflicts in this plan document. When creating the actual SKILL.md files, replace ALL `` ` ` ` `` sequences with real triple backticks (`` ``` ``).

---

<!-- START_SUBCOMPONENT_A (tasks 1-2) -->

<!-- START_TASK_1 -->
### Task 1: Create reviewing-osprey-rules skill

**Files:**
- Create: `plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md`

**Step 1: Create the skill directory**

Run: `mkdir -p plugins/osprey-rules/skills/reviewing-osprey-rules`

**Step 2: Create the skill file**

Write the following to `plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md`. This combines three sources: (1) osprey-cli validation as Layer 1, (2) proactive checks from debugging-osprey-rules Section 11 as Layer 2, (3) convention review against sml-conventions.md as Layer 3.

```markdown
---
name: reviewing-osprey-rules
description: Use when validating or reviewing Osprey SML rules. Defines three-layer verification (osprey-cli, proactive checks, convention review) with severity classification. Not triggered on general coding tasks.
user-invocable: false
---

# Reviewing Osprey Rules

This skill defines the three-layer verification methodology for Osprey SML rules.
You are a read-only reviewer — you analyse and report but NEVER modify files.

## Input Expectations

Before starting, you should have received:
1. **Rules project path** — path to the Osprey rules project directory
2. **osprey-for-atproto repo path** — for running osprey-cli
3. **Review mode** (optional) — "full" (default) or "ad-hoc" (single file focus)

## Verification Methodology

Run ALL three layers in order. Do not skip layers even if earlier layers pass.

### Layer 1: osprey-cli Validation (Critical)

Run the osprey-cli dry-run validator.

**Command:**
` ` `bash
cd {osprey_for_atproto_path} && uv run osprey-cli push-rules {rules_project_path} --dry-run
` ` `

**Classification:**
- Exit code 0 → Layer 1 PASS
- Non-zero exit code → Every error line is **Critical** severity

**Report each error with:**
- File path and line number (from error output)
- Error message (verbatim from osprey-cli)
- Severity: Critical

### Layer 2: Proactive Checks (Critical/Important)

These are patterns that osprey-cli does NOT catch. Check every rule file in the
project for these issues.

**Check 2.1: Type mixing in `when_all`**

Examine every `Rule(when_all=[...])` block. All items must be the same type:
- `RegexMatch(...)`, comparisons (`>`, `<`, `==`, `!=`), `or`/`and` on bools → `bool`
- `Rule(...)` produces `RuleT`; `RuleT or RuleT` is also `RuleT`
- Mixing `bool` and `RuleT` items in the same `when_all` list is a type error

**Severity:** Critical (causes runtime type errors that osprey-cli may not catch
if a prior error prevents type analysis)

**Check 2.2: Hardcoded time values**

Search all `.sml` files for raw numeric time values:
- `86400` → should be `Day`
- `604800` → should be `Week`
- `3600` → should be `Hour`
- `1800` → should be `ThirtyMinute`
- `600` → should be `TenMinute`
- `300` → should be `FiveMinute`
- `60` → should be `Minute`

Do NOT flag numbers that appear in non-time contexts (e.g., threshold counts).
Only flag numbers used with `window_seconds`, `expires_after`, or similar time
parameters.

**Severity:** Important

**Check 2.3: `rules_all=` usage**

Search for `rules_all=` in `WhenRules()` calls. Should always be `rules_any=`.

**Severity:** Critical

**Check 2.4: `JsonData` for entity identifiers**

Check model files for entity ID variables using `JsonData` instead of `EntityJson`.
Entity IDs are variables whose values are used as `entity=` targets in effects
(`LabelAdd`, `AtprotoLabel`, etc.).

**Severity:** Critical

**Check 2.5: Dead rules**

Find `Rule(...)` definitions that are not referenced by any:
- `WhenRules()` block (via `rules_any=`)
- Another rule's `when_all` list
- An `IncrementWindow`'s `when_all` list

A rule that exists but is never consumed is dead code.

**Severity:** Important

**Check 2.6: `(?i)` in regex patterns**

Search for `(?i)` inside `RegexMatch` pattern strings. Should use
`case_insensitive=True` parameter instead.

**Severity:** Important

### Layer 3: Convention Review (Important/Minor)

Check rules against the conventions defined in `osprey-sml-reference`
(`references/sml-conventions.md`). Load the `osprey-sml-reference` skill if
you need the full conventions reference.

**Check 3.1: Variable naming**

- All variables must use PascalCase
- Internal/intermediate variables must use `_PascalCase` (underscore prefix)
- Rule variables should have `Rule` suffix

**Severity:** Minor

**Check 3.2: Rule descriptions**

- `Rule()` descriptions must use f-strings: `description=f'...'`
- Descriptions should reference `{Handle}` or `{UserId}` where applicable

**Severity:** Minor

**Check 3.3: No orphaned rules (structural)**

- Every rule file must be `Require()`d in an `index.sml`
- Every `index.sml` must be reachable from the root execution graph
- No files exist that are not part of the execution graph

**Severity:** Important

**Check 3.4: Label existence**

- Every label used in effects (`LabelAdd`, `AtprotoLabel`, etc.) must exist in
  `config/labels.yaml`
- Cross-reference effect label names against the labels config file

**Severity:** Critical (this is also caught by osprey-cli, but double-check here)

**Check 3.5: RegexMatch usage**

- Use inline inside `when_all` blocks, don't assign to variables unless reused
- Use `case_insensitive=True` parameter, not `(?i)` in pattern
- Parameters use `target=` and `pattern=`

**Severity:** Minor

**Check 3.6: IncrementWindow conventions**

- Key format: `f'descriptive-name-{UserId}'` or `f'name-{window}-{UserId}'` (kebab-case)
- `window_seconds` must use time constants
- No duplicate IncrementWindows with identical `when_all`

**Severity:** Minor (naming), Important (duplicates)

**Check 3.7: WhenRules conventions**

- Always use `rules_any=`, never `rules_all=` (also checked in Layer 2)
- Every actionable rule needs a `WhenRules` block

**Severity:** Important

**Check 3.8: General conventions**

- No unused variables
- Rule files in correct event-type directories
- No hardcoded label names
- Account age comparisons use time constants
- Use infix `or` (`A or B or C`), not function-call `or(A, B, C)`

**Severity:** Minor (style), Important (correctness)

## Output Format

Structure your report as follows:

` ` `
## Review Report

### Layer 1: osprey-cli Validation
[Exit code and any errors]

### Layer 2: Proactive Checks
[Issues found, or "No issues found"]

### Layer 3: Convention Review
[Issues found, or "No issues found"]

---

### Critical Issues
1. [file:line] Description (Layer N, Check N.N)
2. ...

### Important Issues
1. [file:line] Description (Layer N, Check N.N)
2. ...

### Minor Issues
1. [file:line] Description (Layer N, Check N.N)
2. ...

---

**Total: X Critical, Y Important, Z Minor**
**Result: PASS / FAIL**
` ` `

## Gate Definition

- **PASS** requires zero issues across ALL severity levels
- Minor issues are NOT optional — they block the gate
- The orchestrator uses this report to decide whether to dispatch the debugger

## Critical Rules

- **NEVER modify any files.** You are read-only.
- **ALWAYS run all three layers.** Partial review is not acceptable.
- **ALWAYS include severity for every issue.** Issues without severity are useless.
- **ALWAYS include file path and line number** for every issue found.
- **Report what you find, not what you expect.** If a file has no issues, say so.

## Rationalizations to Block

| Rationalization | Reality | Action |
| --- | --- | --- |
| "Minor issues aren't worth reporting" | Minor issues block the gate. All severities must be zero to PASS. | Report every issue, regardless of severity. |
| "osprey-cli passed, so the rules are fine" | osprey-cli catches syntax errors, not logic or convention violations. Layers 2 and 3 exist because osprey-cli is insufficient. | Run all three layers. Always. |
| "I'll just fix this small thing" | You are read-only. Fixing is the debugger's job. | Report the issue. Do not modify files. |
| "This convention seems optional" | All conventions in sml-conventions.md are mandatory for PASS. | Check against every convention. Report violations. |
| "The rule works, so the naming is fine" | Naming conventions prevent maintenance problems. They are not optional. | Report naming violations as Minor severity. |
```

**Note:** The `` ` ` ` `` notation represents real triple backticks in the actual file.

**Step 3: Verify the file was created**

Run: `test -f plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && echo "OK" || echo "FAIL"`
Expected: `OK`

**Step 4: Verify three-layer structure**

Run:
```bash
grep -c "Layer [123]" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md
```
Expected: At least 6 (each layer appears in methodology + output format sections)

**Commit:** `feat(osprey-rules): add reviewing-osprey-rules skill (three-layer verification gate)`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create fixing-osprey-rules skill

**Files:**
- Create: `plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md`

**Step 1: Create the skill directory**

Run: `mkdir -p plugins/osprey-rules/skills/fixing-osprey-rules`

**Step 2: Create the skill file**

Write the following to `plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md`. This retains Sections 1-10 from `debugging-osprey-rules` (error categories, fix patterns, debugging workflow, quick reference, examples) WITHOUT the proactive checks from Section 11 (those moved to the reviewer).

```markdown
---
name: fixing-osprey-rules
description: Use when fixing Osprey SML validation errors or reviewer-identified issues. Contains error categories, fix patterns, and debugging workflow. Not triggered on general coding tasks — only when resolving specific SML errors.
user-invocable: false
---

# Fixing Osprey Rules

This skill provides error categories, diagnosis patterns, and fix workflows for
resolving Osprey SML validation errors and reviewer-identified issues.

## Input Expectations

You receive a structured issue report from the reviewer. Each issue has:
- File path and line number
- Error description
- Severity (Critical, Important, Minor)
- Layer and check reference

Fix ALL issues in one pass. Do not fix one, re-review, fix another.

## 1. Understanding osprey-cli Error Output

osprey-cli reports errors in this format:
` ` `
Error at <file>:<line>:<column>: <message>
` ` `

**Key elements:**
- File path is relative to the rules project root
- Line and column numbers are 1-indexed
- Error messages describe the validation failure

**Exit codes:**
- 0: validation passed
- Non-zero: one or more errors found

**The `--dry-run` flag** validates without pushing. Always use it during development.

## 2. Type Mismatches

**Error patterns:**
- `incompatible types in assignment`
- `found multiple different types in list literal`

**Root cause:** Mixing `RuleT` and `bool` in `when_all` lists.

**Type rules:**
- `RegexMatch(...)`, comparisons (`>`, `<`, `==`, `!=`), `or`/`and` on bools → `bool`
- `Rule(...)` produces `RuleT`
- `RuleT or RuleT` is also `RuleT`
- All items in `when_all` must be the SAME type

**Fix option (a):** If most items are `RuleT`, wrap booleans in `Rule()`:
` ` `sml
# Before (mixed types - wrong):
Rule(when_all=[RuleA, SomeBool > 5, RuleB])

# After (all RuleT):
_ThresholdRule = Rule(when_all=[SomeBool > 5])
Rule(when_all=[RuleA, _ThresholdRule, RuleB])
` ` `

**Fix option (b):** If most items are `bool`, keep everything as bool:
` ` `sml
# Before (mixed types - wrong):
Rule(when_all=[RuleA, SomeBool, AnotherBool])

# After (all bool - if RuleA can be decomposed):
Rule(when_all=[SomeBool, AnotherBool, SomeOtherBool])
` ` `

## 3. Import Cycles

**Error:** `import cycle detected here`

**Root cause:** File A imports file B, which imports file A (directly or transitively).

**Fix option (a):** Extract shared definitions to a new file imported by both:
` ` `
# Before: A imports B, B imports A
# After:
# shared.sml ← common definitions
# A imports shared.sml
# B imports shared.sml
` ` `

**Fix option (b):** Move the definition causing the cycle to the file that needs it.

**Fix option (c):** Re-evaluate whether the import is actually needed.

## 4. Undefined Variables

**Error patterns:**
- `unknown identifier '<name>'`
- `unknown local variable '<name>'`

**Root cause (a):** Missing import — the file defining the variable is not imported.
**Fix:** Add the missing `Import(rules=['path/to/file.sml'])`.

**Root cause (b):** Underscore-prefixed variable used cross-file — `_PascalCase`
variables are file-local and cannot be imported.
**Fix:** Rename without underscore prefix if it needs to be imported, or duplicate
the definition in the consuming file.

**Root cause (c):** Typo in variable name.
**Fix:** Correct the spelling to match the definition.

## 5. Function Call Errors

**Error patterns:**
- `unknown function '<name>'`
- `unknown keyword argument '<name>'`
- `missing keyword argument(s) '<name>'`
- `invalid argument type for '<name>'`

**Fixes:**
- Unknown function: Check UDF signatures (from investigator report or reference).
  The function may not exist or may have a different name.
- Unknown keyword: Check the function's accepted parameters. Remove or rename.
- Missing keyword: Add the required parameter.
- Invalid type: Check the expected type and convert.

## 6. Duplicate Definitions

**Error:** `features must be unique across all rule files`

**Root cause:** Same variable name defined in multiple files that are both imported.

**Fix:**
1. Identify which file is the canonical source for the variable
2. Remove the duplicate definition from the other file
3. Import the canonical source instead

## 7. Rule Constraint Errors

**Error patterns:**
- `rules must be stored in non-local features` — Rule assigned to `_` prefixed variable
- `variable interpolation in non-format string` — description missing `f` prefix

**Fixes:**
- Non-local features: Remove `_` prefix from Rule variable names. Rules must be
  importable (non-local) so they can be used in `WhenRules` and `when_all`.
- Non-format string: Add `f` prefix to Rule description: `description=f'...'`

## 8. Debugging Workflow

When you receive issues to fix, follow this process:

1. **Categorise issues by root cause.** Multiple issues may share the same root cause.
   Fix the root cause once rather than fixing each symptom individually.

2. **Fix in dependency order.** If fixing issue A would also fix issue B (cascading
   error), fix A first. Cascading errors are common with import cycles and type
   mismatches.

3. **Re-validate after EVERY fix.** Run `uv run osprey-cli push-rules <path> --dry-run`
   after each change to confirm the fix worked and didn't introduce new errors.
   This is a self-check, not the formal gate.

4. **Handle cascading errors.** When osprey-cli reports many errors, often only 1-3
   are root causes and the rest are cascading effects. Fix the earliest/deepest
   error first and re-validate — many other errors may disappear.

5. **If a fix introduces new errors,** revert and try a different approach.

## 9. Quick Reference Table

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `incompatible types` | Mixed bool/RuleT in when_all | Wrap bools in Rule() or decompose RuleT |
| `import cycle` | Circular imports | Extract shared defs to new file |
| `unknown identifier` | Missing import or _ prefix | Add import or rename variable |
| `unknown function` | Nonexistent UDF | Check UDF reference |
| `features must be unique` | Duplicate variable names | Remove dupe, import canonical |
| `non-local features` | Rule in _ prefixed var | Remove _ prefix |
| `non-format string` | Missing f prefix | Add f to description string |

## 10. Examples — End-to-End Debugging

### Example A: Type Mismatch

**Error:**
` ` `
Error at rules/record/post/spam.sml:15:3: found multiple different types in list literal
` ` `

**Diagnosis:**
1. Open the file, look at line 15
2. Find the `when_all` list
3. Identify which items are `bool` and which are `RuleT`
4. Choose fix option (a) or (b) based on majority type

**Fix:** Wrap the boolean in a Rule:
` ` `sml
_IsNewAccount = Rule(when_all=[AccountAge < Day * 7])
Rule(when_all=[_IsNewAccount, SpamPatternRule])
` ` `

### Example B: Import Cycle

**Error:**
` ` `
Error at rules/record/post/index.sml:3:1: import cycle detected here
` ` `

**Diagnosis:**
1. Trace the import chain from the error file
2. Find where the cycle closes
3. Identify the shared definition causing the cycle

**Fix:** Extract shared definition:
` ` `sml
# New file: models/shared_post_features.sml
Import(rules=['models/base.sml'])
PostText: str = JsonData(path='$.record.text', required=False)
` ` `

### Example C: Multiple Cascading Errors

**Errors:**
` ` `
Error at models/record/post.sml:5:1: unknown identifier 'BaseModel'
Error at rules/record/post/spam.sml:8:1: unknown identifier 'PostText'
Error at rules/record/post/spam.sml:12:3: incompatible types in assignment
` ` `

**Diagnosis:**
1. First error is the root cause — missing import in model file
2. Second error cascades — PostText can't resolve because model failed
3. Third error cascades — type inference fails because PostText is unknown

**Fix:** Fix only the first error (add missing import), re-validate. The other
two errors will likely disappear.

## Rationalizations to Block

| Rationalization | Reality | Action |
| --- | --- | --- |
| "I'll fix them one at a time" | Multiple issues may share a root cause. Fixing individually wastes cycles. | Categorise by root cause, fix all in one pass. |
| "This error doesn't matter" | All errors block the gate. There is no "doesn't matter." | Fix every issue you received. |
| "I'll skip the self-check" | Self-checking confirms your fix worked before the formal review. | Always run osprey-cli after fixing. |
| "I'll fix extra issues I found" | You fix what you're given. The reviewer identifies issues, not you. | Only fix the issues in your report. Don't expand scope. |
| "The cascading errors are separate issues" | They're almost always symptoms of one root cause. | Fix the deepest error first, re-validate, then check if others resolved. |

---

**Output:** Report which issues were fixed and how. The orchestrator will dispatch
the reviewer to formally re-verify.
```

**Note:** Same triple backtick convention as above.

**Step 3: Verify the file was created**

Run: `test -f plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && echo "OK" || echo "FAIL"`
Expected: `OK`

**Step 4: Verify error categories are present**

Run:
```bash
grep -c "^## [0-9]" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md
```
Expected: 10 (sections 1 through 10)

**Commit:** `feat(osprey-rules): add fixing-osprey-rules skill (error categories and fix patterns)`
<!-- END_TASK_2 -->

<!-- END_SUBCOMPONENT_A -->

<!-- START_TASK_3 -->
### Task 3: Verify content coverage — no knowledge lost from debugging skill

Before deleting the old skill, verify that ALL content from `debugging-osprey-rules` is accounted for in the new skills.

**Step 1: Verify Sections 1-10 content is in fixing skill**

Run:
```bash
grep -q "osprey-cli Error Output" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
grep -q "Type Mismatch" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
grep -q "Import Cycle" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
grep -q "Undefined Variable" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
grep -q "Function Call Error" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
grep -q "Duplicate Definition" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
grep -q "Rule Constraint" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
grep -q "Debugging Workflow" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
grep -q "Quick Reference" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
grep -q "End-to-End" plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
echo "Sections 1-10 coverage OK" || echo "Sections 1-10 coverage FAIL"
```

**Step 2: Verify Section 11 proactive checks are in reviewing skill**

Run:
```bash
grep -q "Type mixing" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
grep -q "Hardcoded time" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
grep -q "rules_all=" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
grep -q "JsonData.*entity" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
grep -q "Dead rules" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
grep -q "(?i)" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
echo "Section 11 coverage OK" || echo "Section 11 coverage FAIL"
```

**Step 3: Verify severity classification in reviewing skill**

Run:
```bash
grep -q "Critical" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
grep -q "Important" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
grep -q "Minor" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
grep -q "PASS.*zero" plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
echo "Severity classification OK" || echo "Severity classification FAIL"
```

Expected: All checks pass.

<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: Delete old debugging-osprey-rules skill

**Files:**
- Delete: `plugins/osprey-rules/skills/debugging-osprey-rules/SKILL.md`
- Delete: `plugins/osprey-rules/skills/debugging-osprey-rules/.gitkeep`
- Delete: `plugins/osprey-rules/skills/debugging-osprey-rules/` (directory)

**Step 1: Delete the old skill directory**

Run:
```bash
rm -rf plugins/osprey-rules/skills/debugging-osprey-rules
```

**Step 2: Verify deletion**

Run: `test -d plugins/osprey-rules/skills/debugging-osprey-rules && echo "FAIL: still exists" || echo "OK: deleted"`
Expected: `OK: deleted`

**Step 3: Verify new skills still exist**

Run:
```bash
test -f plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md && \
test -f plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md && \
echo "New skills intact" || echo "FAIL: new skills missing"
```
Expected: `New skills intact`

**Commit:** `refactor(osprey-rules): delete debugging-osprey-rules (replaced by reviewing + fixing skills)`
<!-- END_TASK_4 -->
