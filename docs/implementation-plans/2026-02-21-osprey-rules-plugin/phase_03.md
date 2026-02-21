# Osprey Rules Plugin Implementation Plan — Phase 3

**Goal:** Create the writing workflow skill that orchestrates rule creation from project discovery through validation.

**Architecture:** A workflow skill (`writing-osprey-rules`) with SKILL.md containing the discovery → models → rules → effects → validate pipeline. Chains to `osprey-sml-reference` for conventions and `debugging-osprey-rules` when validation fails.

**Tech Stack:** Claude Code skill system (SKILL.md with frontmatter).

**Scope:** 7 phases from original design (phases 1-7).

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase implements and tests:

### osprey-rules-plugin.AC2: Rule authoring workflow produces valid rules
- **osprey-rules-plugin.AC2.1 Success:** Skill asks user for rules project path on first invocation
- **osprey-rules-plugin.AC2.2 Success:** Skill reads `config/labels.yaml` and `models/` from discovered project
- **osprey-rules-plugin.AC2.3 Success:** Generated rules follow project structure conventions (correct directory, index.sml wiring)
- **osprey-rules-plugin.AC2.4 Success:** Generated rules use `EntityJson` for ID values, not `JsonData`
- **osprey-rules-plugin.AC2.5 Success:** Skill chains to `osprey-sml-reference` when conventions are needed
- **osprey-rules-plugin.AC2.6 Success:** Skill mandates validation via `osprey-cli push-rules --dry-run` after writing
- **osprey-rules-plugin.AC2.7 Failure:** Skill does not generate rules with hardcoded label names not present in `config/labels.yaml`

---

## Phase 3: Writing Skill

**Goal:** Create the workflow skill that orchestrates rule creation from discovery through validation.

<!-- START_TASK_1 -->
### Task 1: Create writing-osprey-rules SKILL.md

**Verifies:** osprey-rules-plugin.AC2.1, osprey-rules-plugin.AC2.2, osprey-rules-plugin.AC2.3, osprey-rules-plugin.AC2.4, osprey-rules-plugin.AC2.5, osprey-rules-plugin.AC2.6, osprey-rules-plugin.AC2.7

**Files:**
- Create: `osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md`

**Implementation:**

Create the workflow skill file with YAML frontmatter and rule-writing workflow content. This is the primary skill that orchestrates the entire rule authoring process.

The SKILL.md must contain:

1. **Frontmatter** with:
   - `name: writing-osprey-rules`
   - `description:` starting with "Use when" — triggered by creating, editing, modifying, or adding Osprey SML rules. Must be specific enough to NOT trigger on general coding tasks.
   - `user-invocable: false`

2. **Project Discovery** section (covers AC2.1):
   - On first invocation, use `AskUserQuestion` to ask for the rules project path
   - Store the path for the duration of the session
   - Validate the path contains `main.sml`, `config/`, and `models/` directories
   - If path is invalid, report what's missing and ask again

3. **Read Project State** section (covers AC2.2):
   - Read `config/labels.yaml` to discover available labels — list the label names, `valid_for` entity types, and connotation
   - Read `models/` directory to discover available features — list model files and key variables they define
   - Read `rules/index.sml` to understand the current execution graph (which event types have rules)
   - Read `models/label_guards.sml` if it exists to see pre-computed label checks

4. **Understand the Target Behaviour** section:
   - Before writing any code, understand what the user wants to detect
   - Ask clarifying questions: What event type? What signals? What label to emit? Expiration?
   - Map the desired behaviour to one or more labeling patterns (chain to `osprey-sml-reference` for pattern lookup)

5. **Write Models (if needed)** section:
   - If the rule needs features not already defined in existing models, create or extend a model file
   - Follow model hierarchy: base → record type → specific features
   - Use `EntityJson` for entity identifiers (things labels attach to), `JsonData` for primitive values (AC2.4)
   - **CRITICAL: Never use `JsonData` for IDs that labels will attach to. Use `EntityJson` instead.**
   - Import base models: `Import(rules=['models/base.sml'])`

6. **Write Rules** section (covers AC2.3):
   - Create rule file in correct directory based on event type:
     - Post rules → `rules/record/post/`
     - Follow rules → `rules/record/follow/`
     - Identity rules → `rules/identity/`
     - etc.
   - Import required models at top of file
   - Define intermediate variables with `_` prefix (PascalCase)
   - Define rule with `Rule(when_all=[...], description=f'...')`
   - Follow naming: PascalCase, `Rule` suffix, descriptive

7. **Wire Effects** section:
   - Connect rules to effects via `WhenRules(rules_any=[...], then=[...])`
   - **CRITICAL: Only use label names that exist in `config/labels.yaml`.** (AC2.7)
   - If the label doesn't exist yet, tell the user they need to add it to `config/labels.yaml` before the rule will work
   - Choose the right effect:
     - `LabelAdd` / `LabelRemove` for internal Osprey labels
     - `AtprotoLabel` for emitting to Bluesky's Ozone
     - `DeclareVerdict` for synchronous decisions
   - Use `HasAtprotoLabel(entity=UserId, label='label-name')` as a guard to prevent re-labeling

8. **Wire into Execution Graph** section (covers AC2.3):
   - Update the appropriate `index.sml` to `Require` the new rule file
   - If a new event type directory is needed, create the directory, its `index.sml`, and wire it into the parent `index.sml`
   - Pattern: `Require(rule='rules/record/post/new_rule.sml')` for unconditional, `Require(rule='...', require_if=condition)` for conditional

9. **Validate** section (covers AC2.6):
   - **CRITICAL: You MUST validate after writing rules. This is not optional.**
   - Run: `osprey-cli push-rules <project-path> --dry-run`
   - If validation passes: done
   - If validation fails: load `debugging-osprey-rules` skill to diagnose and fix errors, then re-validate

10. **Skill Chaining** section (covers AC2.5):
    - "When you need SML syntax reference, naming conventions, or labeling patterns: load the `osprey-sml-reference` skill using the Skill tool."
    - "When validation fails or you encounter errors: load the `debugging-osprey-rules` skill using the Skill tool."

11. **Common Mistakes** section:
    - Using `JsonData` where `EntityJson` is required (for entity identifiers)
    - Mixing `RuleT` and `bool` in `when_all` lists
    - Hardcoding label names not in `config/labels.yaml`
    - Forgetting to wire new rule into `index.sml`
    - Forgetting to run validation after writing
    - Using `rules_all=` instead of `rules_any=` in `WhenRules`
    - Creating dead rules not referenced by any `WhenRules`

12. **Rationalizations to Block** table:
    - "I'll validate later" → No. Validate now. Every time.
    - "This label probably exists" → No. Read `config/labels.yaml` and confirm.
    - "I know the type system" → No. Load `osprey-sml-reference` if uncertain.
    - "The project path is obvious" → No. Ask the user.
    - "I'll skip the index wiring" → No. Rules not in the execution graph don't run.

**Source material for workflow structure:**
- Project hierarchy: `/Users/scarndp/dev/osprey-for-atproto/example_rules/` (verified directory tree)
- Index wiring pattern: `rules/index.sml` → `rules/record/index.sml` → `rules/record/post/index.sml`
- Labels: `config/labels.yaml` (26+ labels with valid_for, connotation, description)
- Model hierarchy: `models/base.sml` → `models/record/base.sml` → `models/record/post.sml`
- Label guards: `models/label_guards.sml` (pre-computed HasAtprotoLabel checks)

**Verification:**

Verify the file exists and has correct frontmatter:
```bash
head -5 osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md
```
Expected: YAML frontmatter with `name: writing-osprey-rules`.

Verify key sections exist:
```bash
grep -c "CRITICAL" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md
```
Expected: At least 3 (EntityJson, label validation, push-rules mandate).

**Commit:** `feat(osprey-rules-plugin): add writing-osprey-rules workflow skill`
<!-- END_TASK_1 -->
