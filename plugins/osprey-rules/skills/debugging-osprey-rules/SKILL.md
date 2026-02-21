---
name: debugging-osprey-rules
description: Use when debugging SML validation errors, osprey-cli failures, rule debugging, type mismatch errors, import cycles, undefined variables, or any validation problem. Not triggered by general debugging tasks unrelated to Osprey SML.
user-invocable: false
---

# Debugging Osprey Rules

This skill helps diagnose and fix validation errors in Osprey SML rule files. When `uv run osprey-cli push-rules` fails, use this guide to identify the error category, understand the root cause, and apply the fix.

## 1. Understanding `osprey-cli` Error Output

The `uv run osprey-cli push-rules` command validates SML files and outputs structured error messages:

```
error: {message}
 --> {file_path}:{line}:{column}
   |
 N | {source line}
   |       ^ {hint}
     | {additional hint lines}
```

**Key elements:**

- **error message:** Clear description of what's wrong (starts lowercase, no period)
- **file path:** Where the error is located (`rules/example.sml`)
- **line and column:** Position of the problematic code (1-indexed)
- **source line:** The actual SML code being validated
- **caret (^):** Points to the exact location of the error
- **hint:** Additional context (expected type, valid arguments, etc.)

**Multiple errors** are numbered: `[1/N]`, `[2/N]`, etc. This indicates N total errors.

**Exit codes:**

- Exit code `1` = validation failed; errors are present
- Exit code `0` = success; no errors

**With `--dry-run` flag:**

```bash
uv run osprey-cli push-rules <project-path> --dry-run
```

Validation runs without pushing to etcd. Useful for testing fixes before deployment.

---

## 2. Error Category: Type Mismatches

**When:** You see `incompatible types in assignment` or `found multiple different types in list literal`

**Error message patterns:**

```
error: incompatible types in assignment
 --> rules/example.sml:10:5
   |
10 | MyRule = Rule(when_all=[SomeBoolCondition, SomeRuleT], ...)
   |         ^ has type RuleT, expected bool
```

```
error: found multiple different types in list literal, unable to infer type
 --> rules/example.sml:10:25
   |
10 | MyRule = Rule(when_all=[SomeBool, SomeRuleT], ...)
   |                         ^ has types [bool, RuleT]
```

**Root cause:** Mixing `RuleT` (rule objects) and `bool` (boolean conditions) in the same `when_all` list.

**Type reference:**

- `RegexMatch(...)` → `bool`
- Variable comparisons (`X < Y`, `Text == "spam"`) → `bool`
- Boolean operations (`or`, `and` on bools) → `bool`
- `Rule(...)` → `RuleT`
- Boolean operations on `RuleT` (e.g., `RuleA or RuleB`) → `RuleT`

**Rule:** All items in `when_all` must be **the same type**. Cannot mix `bool` and `RuleT`.

**Fix options:**

**(a) Wrap bool conditions in `Rule()` to make them `RuleT`:**

```python
# WRONG: mixing types
MyRule = Rule(when_all=[
    RegexMatch(field=Text, pattern='spam'),  # bool
    SomeOtherRule,                            # RuleT ← type mismatch!
], ...)

# FIX: wrap bool in Rule()
MyRule = Rule(when_all=[
    Rule(when_all=[RegexMatch(field=Text, pattern='spam')]),  # RuleT
    SomeOtherRule,                                             # RuleT
], ...)
```

**(b) Keep everything as `bool` by removing `Rule()` references:**

```python
# FIX: keep all items as bool
MyRule = Rule(when_all=[
    RegexMatch(field=Text, pattern='spam'),  # bool
    OtherCondition,                          # bool (not a Rule)
], ...)
```

---

## 3. Error Category: Import Cycles

**When:** You see `import cycle detected here`

**Error message pattern:**

```
error: import cycle detected here
 --> rules/foo.sml:1:1
   |
 1 | Import(rules=['rules/bar.sml'])
   | ^ this import results in a cyclic dependency
     | the import chain is displayed below:
```

The error includes additional spans showing the full cycle path.

**Root cause:** Circular dependency between SML files.

**Example:**

```
foo.sml imports bar.sml
bar.sml imports baz.sml
baz.sml imports foo.sml  ← creates cycle
```

**Fix options:**

**(a) Extract shared features into a common model file:**

```
Create: models/shared_conditions.sml
  - Contains shared conditions/rules

foo.sml imports models/shared_conditions.sml
bar.sml imports models/shared_conditions.sml
```

**(b) Move shared logic to one file, remove the circular import:**

```
Keep: foo.sml with all shared logic
Remove: the import from bar.sml back to foo.sml
```

**(c) Restructure: if A needs something from B and B needs something from A, create C:**

```
Create: models/common.sml
  - Features needed by both A and B

foo.sml imports models/common.sml
bar.sml imports models/common.sml
(no foo.sml ↔ bar.sml imports)
```

**Diagnostic steps:**

1. Read the error output carefully — it shows the full import chain
2. Identify which import creates the cycle (the link that closes the loop)
3. Determine what the offending file actually needs from the other
4. Extract that shared piece into a third file that both can import
5. Remove the circular import

---

## 4. Error Category: Undefined Variables

**When:** You see `unknown identifier` or `unknown local variable`

**Error message patterns:**

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

```
error: unknown identifier
 --> rules/example.sml:12:15
   |
12 | Spam = RegexMatch(field=Taxt, pattern='spam')
   |               ^ did you mean `Text`?
```

**Root causes:**

**(a) Missing `Import(rules=[...])` at top of file:**

Variable exists in another file but is not imported.

**Fix:** Add the import at the top:

```python
Import(rules=['models/conditions.sml'])
```

**(b) Trying to use a `_` prefixed variable from another file:**

Variables starting with `_` are local-only. They cannot be imported.

**Fix option 1:** Rename the variable to not start with `_` in the source file:

```python
# In the source file (models/conditions.sml):
# WRONG:
_PostText = JsonData(path='$.text')

# FIX:
PostText = JsonData(path='$.text')
```

**Fix option 2:** Duplicate the definition in the current file:

```python
# In the using file (rules/example.sml):
_PostText = JsonData(path='$.text')  # local copy
_Gate = _PostText != None
```

**(c) Typo in variable name:**

The error may suggest: `did you mean \`{similar_name}\`?`

**Fix:** Correct the typo. Use the suggested name if provided.

---

## 5. Error Category: Function Call Errors

**When:** You see errors about functions, keyword arguments, or function calls

**Error message patterns:**

```
error: unknown function: `BadFunc`
 --> rules/example.sml:5:10
   |
 5 | BadFunc(field=Text)
   |   ^ this function was not found in the registry
```

```
error: unknown keyword argument: `foo`
 --> rules/example.sml:6:15
   |
 6 | JsonData(path='$.text', foo='bar')
   |          ^ `foo` is not a valid keyword argument
     | valid keyword arguments are: [`path`, `type`]
```

```
error: 2 missing keyword argument(s)
 --> rules/example.sml:7:5
   |
 7 | Rule(when_all=[])
   |   ^ the following keyword arguments were not provided: [`description`, `actions`]
```

```
error: invalid argument type: `String`
 --> rules/example.sml:8:30
   |
 8 | Window(count=5, window_size='invalid')
   |                            ^ expected type `int`
```

**Root causes and fixes:**

- **`unknown function`:** Typo in function name or UDF not registered. Check spelling against [osprey-sml-reference skill](osprey-sml-reference).
- **`unknown keyword argument`:** Wrong parameter name. The error shows valid kwargs. Use those instead.
- **`missing keyword argument(s)`:** Required parameters not provided. The error lists which ones are missing. Add them.
- **`invalid argument type`:** Expected different type for parameter. The error shows what type is expected. Convert your argument.

**Fix:** Read the hint carefully — it tells you the valid kwargs and expected types. Correct accordingly.

---

## 6. Error Category: Duplicate Definitions

**When:** You see `features must be unique across all rule files`

**Error message pattern:**

```
error: features must be unique across all rule files
 --> models/foo.sml:5:1
   |
 5 | UserId = JsonData(...)
   | ^ this feature is defined in multiple locations
     | such as:
```

The error includes additional spans pointing to the duplicate locations.

**Root cause:** Same variable name defined in multiple imported files.

**Fix:** Identify which file is the canonical source, remove duplicates from other files, and import from the canonical location instead.

**Example:**

```
models/users.sml defines: UserId = JsonData(...)
models/accounts.sml defines: UserId = JsonData(...)  ← duplicate!
```

**Solution:**

Keep only the definition in `models/users.sml`. In `models/accounts.sml`, remove the duplicate and import instead:

```python
Import(rules=['models/users.sml'])

# Remove: UserId = JsonData(...)
# Use: UserId (from import)
```

---

## 7. Error Category: Rule Constraint Errors

**When:** You see `rules must be stored in non-local features` or `variable interpolation in non-format string`

**Error message pattern:**

```
error: rules must be stored in non-local features
 --> rules/example.sml:3:1
   |
 3 | _MyRule = Rule(when_all=[...], description='...')
   | ^ this rule is being stored in the local variable `_MyRule`
     | rules must be in non-local features (eg that don't start with `_`)
```

**Root cause:** `Rule()` assigned to a variable starting with `_`.

**Fix:** Remove the `_` prefix. Rules must be globally accessible:

```python
# WRONG:
_SpamDetector = Rule(when_all=[...], description='...')

# FIX:
SpamDetector = Rule(when_all=[...], description='...')
```

---

**Second constraint pattern:**

```
error: variable interpolation attempted in non-format string
 --> rules/example.sml:5:20
   |
 5 | description='User {UserId} flagged'
   |              ^ this string contains what looks like variable interpolation, but is not an f-string
     | consider prefixing with `f`
```

**Root cause:** String contains `{variable}` syntax but is not an f-string.

**Fix:** Change the string to an f-string by prefixing with `f`:

```python
# WRONG:
description='User {UserId} flagged'

# FIX:
description=f'User {UserId} flagged'
```

---

## 8. Debugging Workflow

**CRITICAL: After EVERY fix, you MUST re-validate. This is not optional.**

Always run:

```bash
uv run osprey-cli push-rules <project-path> --dry-run
```

After applying a fix, immediately re-validate to confirm the fix works and catch any cascading errors.

**Step-by-step workflow:**

1. **Run validation** (if not already done):
   ```bash
   uv run osprey-cli push-rules <project-path> --dry-run
   ```

2. **Read the full error output** carefully. Note error count: `[N/M]` means N errors out of M total.

3. **Start with the FIRST error.** Later errors may be cascading from the first one. Fixing the first may resolve multiple subsequent errors.

4. **Identify the error category** using sections 2–7 above.

5. **Apply the fix** as described in that section.

6. **Re-validate immediately:**
   ```bash
   uv run osprey-cli push-rules <project-path> --dry-run
   ```

7. **Check results:**
   - If exit code is 0: **done!** All errors fixed.
   - If exit code is 1: More errors remain. Go to step 2.

8. **For multiple simultaneous errors** (AC3.5):
   - Errors are numbered `[1/N]`, `[2/N]`, etc.
   - Fix the **first error first** — subsequent errors may be caused by it.
   - After fixing and re-validating, the error count may decrease (if later errors were cascading).
   - Some errors are truly independent — fix them one at a time, re-validating after each.

**Key principle:** Never apply multiple fixes and then validate once. Validate after every single fix. This prevents compounding confusion and makes it easy to see what each fix accomplishes.

---

## 9. Quick Reference Table

| Error message | Likely cause | Fix |
|---------------|-------------|-----|
| `incompatible types in assignment` | Mixed `RuleT`/`bool` in `when_all` | Keep all items same type (either all `RuleT` or all `bool`) |
| `multiple different types in list literal` | Mixed types in list | Wrap bool conditions in `Rule()` or remove `Rule()` references |
| `import cycle detected` | Circular imports between files | Extract shared code to third file; both import from it |
| `unknown identifier` | Missing `Import(rules=[...])` | Add import at top of file |
| `unknown local variable` | `_` var used cross-file | Remove `_` prefix in source or duplicate definition locally |
| `unknown function` | Typo or unregistered UDF | Check spelling against [osprey-sml-reference skill](osprey-sml-reference) |
| `unknown keyword argument` | Wrong parameter name | Read hint for valid kwargs; use suggested names |
| `missing keyword argument(s)` | Required params missing | Add the missing keyword arguments listed in error |
| `invalid argument type` | Wrong type for parameter | Convert argument to expected type (show in error) |
| `rules must be stored in non-local` | Rule in `_` variable | Remove `_` prefix; rules must be globally accessible |
| `variable interpolation in non-format string` | Missing `f` prefix on string | Change `description='...'` to `description=f'...'` |
| `features must be unique` | Duplicate definition across files | Remove duplicate, import from canonical file instead |

---

## 10. Examples: End-to-End Debugging

### Example 1: Type Mismatch Error

**Initial error:**

```
error: incompatible types in assignment
 --> rules/spam_detection.sml:10:5
   |
10 | SpamCheck = Rule(when_all=[
   |            ^ has type RuleT, expected bool
11 |     RegexMatch(field=Text, pattern='spam'),
12 |     ViolentLanguageRule,
13 | ], ...)
   |    ^ has types [bool, RuleT]
```

**Analysis:** Line 10 shows `when_all` contains a `bool` (RegexMatch) and a `RuleT` (ViolentLanguageRule).

**Fix:** Wrap the bool condition in `Rule()`:

```python
SpamCheck = Rule(when_all=[
    Rule(when_all=[RegexMatch(field=Text, pattern='spam')]),
    ViolentLanguageRule,
], ...)
```

**Re-validate:**

```bash
uv run osprey-cli push-rules . --dry-run
```

**Result:** Exit code 0 — error fixed!

---

### Example 2: Import Cycle

**Initial error:**

```
error: import cycle detected here
 --> rules/toxicity.sml:1:1
   |
 1 | Import(rules=['rules/patterns.sml'])
   | ^ this import results in a cyclic dependency
     | the import chain is displayed below:
     | toxicity.sml → patterns.sml → toxicity.sml
```

**Analysis:** `toxicity.sml` imports `patterns.sml`, which imports `toxicity.sml` back.

**Fix:** Create a shared file:

1. **Create `rules/common_conditions.sml`:**

   ```python
   # Shared conditions
   TextExists = Text != None
   ```

2. **Update `rules/toxicity.sml`:**

   ```python
   Import(rules=['rules/common_conditions.sml'])
   # Remove: Import(rules=['rules/patterns.sml'])
   ```

3. **Update `rules/patterns.sml`:**

   ```python
   Import(rules=['rules/common_conditions.sml'])
   # Remove: Import(rules=['rules/toxicity.sml'])
   ```

**Re-validate:**

```bash
uv run osprey-cli push-rules . --dry-run
```

**Result:** Exit code 0 — cycle resolved!

---

### Example 3: Multiple Errors, Cascading Fix

**Initial output:**

```
error: unknown identifier [1/3]
 --> rules/main.sml:5:10
   |
 5 | _Gate = PostText != None
   |         ^ this identifier was not imported into this file

error: unknown identifier [2/3]
 --> rules/main.sml:8:15
   |
 8 | Spam = RegexMatch(field=PostText, ...)
   |                   ^ this identifier was not imported into this file

error: unknown identifier [3/3]
 --> rules/main.sml:12:20
   |
12 | Violence = RegexMatch(field=PostText, ...)
   |                       ^ this identifier was not imported into this file
```

**Analysis:** All three errors reference `PostText`, which is undefined. Likely missing import. (Note: errors 2 and 3 are cascading from error 1.)

**Fix:** Add the import at top of `rules/main.sml`:

```python
Import(rules=['models/extraction.sml'])

_Gate = PostText != None
...
```

**Re-validate:**

```bash
uv run osprey-cli push-rules . --dry-run
```

**Result:**

```
✓ All validations passed
Exit code: 0
```

All three errors disappeared because they all stemmed from the same missing import!

---

## 11. Proactive Checks (Beyond Validation)

`osprey-cli` catches syntax and structural errors, but NOT all logic or convention violations. After fixing all validation errors and getting exit code 0, you MUST manually check for these:

### Check 1: Type mixing in `when_all`

Look at every `Rule(when_all=[...])` in the file. All items must be the same type.

- `RegexMatch(...)`, comparisons (`X < Y`), `or`/`and` on bools → `bool`
- `Rule(...)` → `RuleT`; `RuleT or RuleT` → `RuleT`
- `not Rule(...)` → `RuleT`; `not bool_val` → `bool`

**CRITICAL: `osprey-cli` may not catch type mixing if a prior error prevents type analysis.** You must check this yourself after all errors are resolved.

```python
# WRONG — mixing RuleT (SomeRule) and bool (_IsSpam) in when_all
BadRule = Rule(
  when_all=[
    SomeRule,      # RuleT
    _IsSpam,       # bool ← type mismatch!
  ],
)

# FIX — keep all items as bool
GoodRule = Rule(
  when_all=[
    _SomeCondition,  # bool
    _IsSpam,         # bool
  ],
)
```

### Check 2: Hardcoded time values

Search the file for raw numbers that look like time durations: `86400`, `3600`, `604800`, `600`, `300`, `60`.

Replace with constants from `models/base.sml`: `Second`, `Minute`, `FiveMinute`, `TenMinute`, `ThirtyMinute`, `Hour`, `Day`, `Week`.

```python
# WRONG
AccountAgeSeconds < 86400

# CORRECT
AccountAgeSeconds < Day
```

### Check 3: Convention violations

After validation passes, scan the file for:
- `rules_all=` → should be `rules_any=`
- `(?i)` in regex patterns → should use `case_insensitive=True`
- `JsonData` for entity IDs → should be `EntityJson`
- Dead rules (rules not referenced by any `WhenRules` or other construct)

---

## Rationalizations to Block

| Excuse | Reality |
|--------|---------|
| "osprey-cli passed, so the rule is correct" | Validation catches syntax, not all logic. Run proactive checks. |
| "Type mixing might work at runtime" | It won't. SML has strict typing. Fix it now. |
| "86400 is clearer than Day" | It's not. Use the constants. The conventions exist for a reason. |
| "This is just a quick fix, I'll clean up later" | No. Fix it now. Every time. |
| "The error is in someone else's file, not mine" | If you introduced it, fix it. If it's pre-existing, leave it. |

