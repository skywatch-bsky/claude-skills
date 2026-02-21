# Osprey Rules v2 Implementation Plan — Phase 4: osprey-sml-reference Updates

**Goal:** Minor restructuring of `osprey-sml-reference` to support multi-agent consumption. Add a structured checklist section to `sml-conventions.md` so the reviewer agent can consume it as checkable criteria rather than prose-only guidance.

**Architecture:** The SKILL.md stays mostly unchanged — it already works for planner, impl, and reviewer via progressive disclosure. The main change is adding a "Reviewer Checklist" section to `sml-conventions.md` that distills the prose conventions into machine-parseable check items with IDs, alongside the existing prose (which planner and impl agents still need for context/examples).

**Tech Stack:** Markdown reference documents

**Scope:** 6 phases from original design (phase 4 of 6)

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase implements:

### osprey-rules-v2.AC3: Skills Restructured to Agent Boundaries
- **osprey-rules-v2.AC3.5 Success:** `osprey-sml-reference` remains consumable by planner, impl, and reviewer agents

**Verifies: None** — infrastructure phase. Verification is structural (conventions file has checkable criteria format).

---

<!-- START_TASK_1 -->
### Task 1: Add reviewer checklist section to sml-conventions.md

**Files:**
- Modify: `plugins/osprey-rules/skills/osprey-sml-reference/references/sml-conventions.md` (append new section at end)

**Step 1: Append the reviewer checklist**

Add the following section to the end of `plugins/osprey-rules/skills/osprey-sml-reference/references/sml-conventions.md`, after the existing "Anti-Patterns" section. This provides structured, checkable criteria that the reviewer agent can systematically verify. Each check has an ID for reference in reviewer output.

Append this content after line 416 (end of file):

```markdown

---

## Reviewer Checklist

Structured checklist for the `osprey-rule-reviewer` agent. Each check has an ID
for use in review reports. Checks reference the prose sections above for details.

### Naming Checks

- **CONV-N1:** All variables use PascalCase (see: Variable Naming)
- **CONV-N2:** Internal/intermediate variables use `_PascalCase` prefix (see: Variable Naming)
- **CONV-N3:** Rule variables have `Rule` suffix (see: Variable Naming)
- **CONV-N4:** IncrementWindow variable names describe what is counted (see: Variable Naming)

### Time Checks

- **CONV-T1:** No hardcoded time values — all use named constants from `models/base.sml` (see: Time Constants)
- **CONV-T2:** `window_seconds` parameters use time constants (see: IncrementWindow Conventions)
- **CONV-T3:** Account age comparisons use time constants (see: General)

### RegexMatch Checks

- **CONV-R1:** `case_insensitive=True` parameter used instead of `(?i)` in pattern (see: RegexMatch Conventions)
- **CONV-R2:** RegexMatch used inline unless pattern is reused across multiple rules (see: RegexMatch Conventions, Anti-Pattern 10)

### IncrementWindow Checks

- **CONV-IW1:** Key strings use f-strings with kebab-case prefix and `{UserId}` suffix (see: IncrementWindow Conventions)
- **CONV-IW2:** No duplicate IncrementWindows with identical `when_all` (see: IncrementWindow Conventions, Anti-Pattern 8)
- **CONV-IW3:** Key names are descriptive of what is counted (see: Anti-Pattern 9)

### Rule Checks

- **CONV-RU1:** Every `Rule` is referenced by a `WhenRules`, another rule's `when_all`, or an `IncrementWindow`'s `when_all` — no dead rules (see: Rule Conventions, Anti-Pattern 6)
- **CONV-RU2:** Rule descriptions use f-strings with `{Handle}` or `{UserId}` where applicable (see: Rule Conventions)
- **CONV-RU3:** Uses infix `or` (`A or B or C`), not function-call `or(A, B, C)` (see: Rule Conventions, Anti-Pattern 7)

### Type Checks

- **CONV-TY1:** All items in `when_all` are the same type — all `bool` or all `RuleT`, no mixing (see: Type Rules in when_all, Anti-Pattern 2)
- **CONV-TY2:** Entity IDs use `EntityJson`, not `JsonData` (see: Anti-Pattern 1)

### WhenRules Checks

- **CONV-WR1:** Uses `rules_any=`, never `rules_all=` (see: WhenRules, Anti-Pattern 5)
- **CONV-WR2:** Every actionable rule has a `WhenRules` block (see: WhenRules)

### Structure Checks

- **CONV-S1:** No unused variables (see: General)
- **CONV-S2:** Rule files in correct event-type directories (see: General)
- **CONV-S3:** No hardcoded label names — labels verified against `config/labels.yaml` (see: General)
- **CONV-S4:** Every rule file is `Require()`d in an `index.sml` reachable from root
```

**Step 2: Verify the checklist was added**

Run:
```bash
grep -c "CONV-" plugins/osprey-rules/skills/osprey-sml-reference/references/sml-conventions.md
```
Expected: 23 (the number of CONV- check IDs)

**Step 3: Verify existing prose content is unchanged**

Run:
```bash
grep -q "## Variable Naming" plugins/osprey-rules/skills/osprey-sml-reference/references/sml-conventions.md && \
grep -q "## Anti-Patterns" plugins/osprey-rules/skills/osprey-sml-reference/references/sml-conventions.md && \
grep -q "## Time Constants" plugins/osprey-rules/skills/osprey-sml-reference/references/sml-conventions.md && \
echo "Prose sections intact" || echo "FAIL: prose sections missing"
```
Expected: `Prose sections intact`

**Commit:** `feat(osprey-rules): add reviewer checklist to sml-conventions.md`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Update SKILL.md progressive disclosure to mention reviewer checklist

**Files:**
- Modify: `plugins/osprey-rules/skills/osprey-sml-reference/SKILL.md:154-160` (progressive disclosure section)

**Step 1: Update the progressive disclosure section**

In `plugins/osprey-rules/skills/osprey-sml-reference/SKILL.md`, update the Progressive Disclosure section (lines 154-160) to mention the reviewer checklist alongside the existing guidance. Change:

```markdown
## Progressive Disclosure

For detailed patterns and implementation examples, see:

- **24 Labeling Patterns** — `references/labeling-patterns.md`. Covers all common use cases: content matching, rate limiting, strike systems, ML scoring, cross-entity labeling, caching, and more.
- **Naming Conventions & Anti-Patterns** — `references/sml-conventions.md`. Variable naming, time constants, RegexMatch rules, IncrementWindow keys, type system pitfalls, and what NOT to do.
```

To:

```markdown
## Progressive Disclosure

For detailed patterns and implementation examples, see:

- **24 Labeling Patterns** — `references/labeling-patterns.md`. Covers all common use cases: content matching, rate limiting, strike systems, ML scoring, cross-entity labeling, caching, and more.
- **Naming Conventions & Anti-Patterns** — `references/sml-conventions.md`. Variable naming, time constants, RegexMatch rules, IncrementWindow keys, type system pitfalls, and what NOT to do. Also includes a **Reviewer Checklist** section with structured CONV-prefixed check IDs for systematic convention review.
```

**Step 2: Verify the update**

Run:
```bash
grep -q "Reviewer Checklist" plugins/osprey-rules/skills/osprey-sml-reference/SKILL.md && \
echo "SKILL.md updated" || echo "FAIL: SKILL.md not updated"
```
Expected: `SKILL.md updated`

**Commit:** `docs(osprey-rules): update osprey-sml-reference progressive disclosure for reviewer checklist`
<!-- END_TASK_2 -->
