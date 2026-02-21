# Osprey Rules Plugin Implementation Plan — Phase 4

**Goal:** Create the debugging skill for resolving Osprey SML validation errors.

**Architecture:** A self-contained troubleshooting skill (`debugging-osprey-rules`) with SKILL.md covering error categories, diagnostic patterns, and fixes. Mandates re-validation after every fix.

**Tech Stack:** Claude Code skill system (SKILL.md with frontmatter).

**Scope:** 7 phases from original design (phases 1-7).

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase implements and tests:

### osprey-rules-plugin.AC3: Debugging skill resolves common validation errors
- **osprey-rules-plugin.AC3.1 Success:** Skill identifies type mismatch errors (mixing `RuleT` and `bool` in `when_all`)
- **osprey-rules-plugin.AC3.2 Success:** Skill identifies import cycle errors and suggests resolution
- **osprey-rules-plugin.AC3.3 Success:** Skill identifies undefined variable errors
- **osprey-rules-plugin.AC3.4 Success:** Skill mandates re-validation after applying fixes
- **osprey-rules-plugin.AC3.5 Edge:** Skill handles multiple simultaneous validation errors

---

## Phase 4: Debugging Skill

**Goal:** Create the troubleshooting skill for validation errors and rule misbehaviour.

<!-- START_TASK_1 -->
### Task 1: Create debugging-osprey-rules SKILL.md

**Verifies:** osprey-rules-plugin.AC3.1, osprey-rules-plugin.AC3.2, osprey-rules-plugin.AC3.3, osprey-rules-plugin.AC3.4, osprey-rules-plugin.AC3.5

**Files:**
- Create: `osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md`

**Implementation:**

Create the debugging skill file with YAML frontmatter and troubleshooting content. This skill is self-contained — it does not chain to other skills.

The SKILL.md must contain:

1. **Frontmatter** with:
   - `name: debugging-osprey-rules`
   - `description:` starting with "Use when" — triggered by SML validation errors, `osprey-cli` failures, rule debugging, type mismatch errors. Must NOT trigger on general debugging tasks.
   - `user-invocable: false`

2. **Understanding `osprey-cli` Error Output** section:
   - Error format explanation:
     ```
     error: {message}
      --> {file_path}:{line}:{column}
        |
      N | {source line}
        |       ^ {hint}
            | {additional hint lines}
     ```
   - Multiple errors are numbered: `[1/N]`, `[2/N]`, etc. (AC3.5)
   - Exit code 1 = validation failed; exit code 0 = success
   - With `--dry-run`: validates without pushing to etcd

3. **Error Category: Type Mismatches** section (covers AC3.1):

   Error message pattern:
   ```
   error: incompatible types in assignment
    --> rules/example.sml:10:5
      |
   10 | MyRule = Rule(when_all=[SomeBoolCondition, SomeRuleT], ...)
      |         ^ has type RuleT, expected bool
   ```

   Also:
   ```
   error: found multiple different types in list literal, unable to infer type
    --> rules/example.sml:10:25
      |
   10 | MyRule = Rule(when_all=[SomeBool, SomeRuleT], ...)
      |                         ^ has types [bool, RuleT]
   ```

   **Root cause:** Mixing `RuleT` and `bool` in `when_all` lists.
   - `RegexMatch(...)`, variable comparisons (`X < Y`), `or`/`and` on bools → `bool`
   - `Rule(...)` → `RuleT`; `RuleT or RuleT` → `RuleT`
   - All items in `when_all` must be the same type

   **Fix:** Either:
   - (a) Wrap bool conditions in a `Rule()` to make them `RuleT`, OR
   - (b) Keep everything as `bool` (no `Rule()` references in the list)

   **Example fix:**
   ```python
   # WRONG: mixing types
   MyRule = Rule(when_all=[
       SomeBoolCondition,       # bool
       SomeOtherRule,           # RuleT ← type mismatch!
   ], ...)

   # FIX: keep all items as bool
   MyRule = Rule(when_all=[
       SomeBoolCondition,       # bool
       SomeOtherBoolCondition,  # bool
   ], ...)
   ```

4. **Error Category: Import Cycles** section (covers AC3.2):

   Error message pattern:
   ```
   error: import cycle detected here
    --> rules/foo.sml:1:1
      |
    1 | Import(rules=['rules/bar.sml'])
      | ^ this import results in a cyclic dependency
          | the import chain is displayed below:
   ```

   **Root cause:** Circular dependency between SML files. Example: `foo.sml` imports `bar.sml`, `bar.sml` imports `foo.sml`.

   **Fix options:**
   - (a) Extract shared features into a common model file both can import
   - (b) Move the shared logic to one file and remove the circular import
   - (c) Restructure: if A needs something from B and B needs something from A, create C that both import

   **Diagnostic steps:**
   1. Read the error output — it shows the full import chain
   2. Identify which import creates the cycle
   3. Determine what the offending file actually needs from the other
   4. Extract that shared piece into a third file

5. **Error Category: Undefined Variables** section (covers AC3.3):

   Error message patterns:

   ```
   error: unknown identifier
    --> rules/example.sml:5:10
      |
    5 | _Gate = PostText != None
      |         ^ this identifier was not imported into this file
          | however, it was found here:
   ```

   ```
   error: unknown local variable
    --> rules/example.sml:8:5
      |
    8 | _Result = _InternalVar + 1
      |           ^ `_InternalVar` does not exist in this file
          | variables that start with `_` can only be used in the file they're declared in
   ```

   **Root causes:**
   - (a) Missing `Import(rules=['models/....sml'])` at top of file
   - (b) Trying to use a `_` prefixed variable from another file (local-only scope)
   - (c) Typo in variable name (error may suggest: `did you mean \`{similar_name}\`?`)

   **Fix for (a):** Add the missing import.
   **Fix for (b):** Rename the variable to not start with `_` in the source file, OR duplicate the definition in the current file.
   **Fix for (c):** Correct the typo.

6. **Error Category: Function Call Errors** section:

   Patterns:
   - `error: unknown function: \`BadFunc\`` → typo or UDF not registered
   - `error: unknown keyword argument: \`foo\`` → wrong parameter name; error shows valid kwargs
   - `error: N missing keyword argument(s)` → required params not provided
   - `error: invalid argument type: \`str\`` → expected different type for param

   **Fix:** Read the hint carefully — it tells you the valid kwargs and expected types.

7. **Error Category: Duplicate Definitions** section:

   ```
   error: features must be unique across all rule files
    --> models/foo.sml:5:1
      |
    5 | UserId = JsonData(...)
      | ^ this feature is defined in multiple locations
          | such as:
   ```

   **Root cause:** Same variable name defined in multiple imported files.
   **Fix:** Remove the duplicate. Import from the canonical location instead.

8. **Error Category: Rule Constraint Errors** section:

   ```
   error: rules must be stored in non-local features
    --> rules/example.sml:3:1
      |
    3 | _MyRule = Rule(when_all=[...], description='...')
      | ^ this rule is being stored in the local variable `_MyRule`
          | rules must be in non-local features (eg that don't start with `_`)
   ```

   **Root cause:** `Rule()` assigned to a `_` prefixed variable.
   **Fix:** Remove the `_` prefix. Rules must be globally accessible.

   Also:
   ```
   error: variable interpolation attempted in non-format string
    --> rules/example.sml:5:20
      |
    5 | description='User {UserId} flagged'
      |              ^ this string contains what looks like variable interpolation, but is not an f-string
          | consider prefixing with `f`
   ```

   **Fix:** Change `description='...'` to `description=f'...'`.

9. **Debugging Workflow** section:

   **CRITICAL: After EVERY fix, you MUST re-validate. This is not optional.**

   ```
   osprey-cli push-rules <project-path> --dry-run
   ```

   Workflow:
   1. Read the full error output — note error count `[N/M]`
   2. Start with the FIRST error (later errors may be cascading from the first)
   3. Identify the error category from sections above
   4. Apply the fix
   5. Re-validate
   6. If more errors remain, repeat from step 1
   7. Done when exit code is 0

   **For multiple simultaneous errors (AC3.5):**
   - Errors numbered `[1/N]`, `[2/N]`, etc.
   - Fix the first error first — subsequent errors may be caused by it
   - After fixing and re-validating, the error count may decrease
   - Some errors are truly independent — fix them one at a time, re-validating after each

10. **Quick Reference Table** — error message → likely cause → fix:

    | Error message | Likely cause | Fix |
    |---------------|-------------|-----|
    | `incompatible types in assignment` | Mixed `RuleT`/`bool` in `when_all` | Keep all items same type |
    | `multiple different types in list literal` | Mixed types in list | Separate by type |
    | `import cycle detected` | Circular imports | Extract shared code to third file |
    | `unknown identifier` | Missing import | Add `Import(rules=[...])` |
    | `unknown local variable` | `_` var used cross-file | Remove `_` prefix or duplicate locally |
    | `unknown function` | Typo or unregistered UDF | Check spelling |
    | `unknown keyword argument` | Wrong param name | Read hint for valid kwargs |
    | `missing keyword argument(s)` | Required params missing | Add missing params |
    | `rules must be stored in non-local` | Rule in `_` variable | Remove `_` prefix |
    | `variable interpolation in non-format string` | Missing `f` prefix | Change to f-string |
    | `features must be unique` | Duplicate definition | Remove duplicate, import from source |

**Source material for error patterns:**
- Error formatting: `/Users/scarndp/dev/osprey-for-atproto/osprey_worker/src/osprey/engine/ast/error_utils.py`
- Import cycle validator: `validators/imports_must_not_have_cycles.py`
- Undefined variable validator: `validators/variables_must_be_defined.py`
- Type validator: `validators/validate_static_types.py`
- Function call validator: `validators/validate_call_kwargs.py`
- Duplicate validator: `validators/unique_stored_names.py`
- Rule constraints: `osprey/engine/stdlib/udfs/rules.py`
- CLI entry: `osprey/worker/lib/cli.py`

**Verification:**

Verify the file exists and has correct frontmatter:
```bash
head -5 osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md
```
Expected: YAML frontmatter with `name: debugging-osprey-rules`.

Verify key error categories are covered:
```bash
grep -c "Error Category:" osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md
```
Expected: At least 6 categories.

Verify re-validation mandate:
```bash
grep -c "MUST re-validate\|CRITICAL.*re-validate\|CRITICAL.*not optional" osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md
```
Expected: At least 1.

**Commit:** `feat(osprey-rules-plugin): add debugging-osprey-rules troubleshooting skill`
<!-- END_TASK_1 -->
