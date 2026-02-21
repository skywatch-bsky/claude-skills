---
name: writing-osprey-rules
description: Use when creating, editing, modifying, or authoring Osprey SML rule files. Not triggered on general coding tasks — only when explicitly working on label detection rules, rule models, or rule execution graphs.
user-invocable: false
---

# Writing Osprey Rules

This workflow guides you through creating valid Osprey SML rules from project discovery through validation.

## 1. Project Discovery

On your first invocation, ask the user for the rules project path.

**Process:**
1. Use `AskUserQuestion` to request the rules project path from the user.
2. Store this path for the duration of the session.
3. Validate the path contains:
   - `main.sml` (entry point)
   - `config/` (labels and config)
   - `models/` (feature definitions)
   - `rules/` (rule execution graph)

**Validation:**
If any required directory or file is missing, report specifically what's missing and ask the user to correct the path.

Example validation check:
```
Checking project at /path/to/rules:
  ✓ main.sml found
  ✓ config/ directory found
  ✓ models/ directory found
  ✓ rules/ directory found
```

## 2. Read Project State

Before writing any rules, read and understand the existing project configuration.

**Read these files:**

### `config/labels.yaml`
- List all available label names
- Record which entity types each label is valid for (`valid_for`)
- Note the connotation (neutral, positive, negative)
- Print a summary table for reference

Example summary:
```
Available Labels in Project:
  Label Name              | Valid For        | Connotation
  ----------------------- | ================ | -----------
  alt-gov                 | UserId           | neutral
  alt-tech                | AtUri            | neutral
  amplifier               | UserId           | neutral
  ...
```

### `models/` directory
- List all model files in `models/` and `models/record/`
- Identify key variables defined in each model
- Note the model hierarchy (base → record type → specific features)

Example:
```
Project Models:
  models/base.sml
    - UserId (Entity[str])
    - Handle (Entity[str])
    - ActionName (str)
    - Second, Minute, Hour, Day, Week (time constants)

  models/record/post.sml
    - (specific post features)

  models/label_guards.sml
    - Pre-computed HasAtprotoLabel checks for common labels
```

### `rules/index.sml`
- Understand the current execution graph
- Identify which event types have rules:
  - `rules/record/index.sml` → event operations on records
  - `rules/identity/index.sml` → identity actions
  - Other event-type-specific directories

Example from project:
```
rules/index.sml wiring:
  - Imports: models/base.sml
  - Conditionally requires rules/record/index.sml when IsOperation=true
  - Conditionally requires rules/identity/index.sml when ActionName='identity'
```

### `models/label_guards.sml` (if exists)
- List pre-computed label guard variables
- These prevent re-labeling by checking if an entity already has a label
- Example: `_HasBeansLabel = HasAtprotoLabel(entity=UserId, label='beans')`

## 3. Understand the Target Behaviour

Before writing any code, understand what the user wants to detect.

**Ask clarifying questions:**
1. **What event type?** (post, follow, identity, repost, etc.)
2. **What signals?** (text patterns, metadata, account age, etc.)
3. **What label to emit?** (must exist in `config/labels.yaml`)
4. **Expiration/validity?** (permanent, expiring, conditional)
5. **Who/what gets labeled?** (the account, the post, both?)

**Map to labeling patterns:**
- Chain to `osprey-sml-reference` skill to look up common labeling patterns if you need naming conventions or syntax examples.
- Document the detection logic in plain English before writing code.

Example user request:
> "I want to detect posts that contain profanity and label them with 'contains-profanity'."

Analysis:
- Event type: record (post)
- Signal: post text content contains profanity
- Label: contains-profanity (check labels.yaml to confirm it exists)
- Target: the post (AtUri)

## 4. Write Models (if needed)

If the rule needs features not already defined in existing models, create or extend a model file.

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
   ```sml
   Import(
     rules=['models/base.sml'],
   )
   ```

3. **Naming conventions:**
   - Variable names: PascalCase for main definitions
   - Private/intermediate variables: `_PascalCase` prefix

4. **Example model extension:**
   ```sml
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
   ```

## 5. Write Rules

Create rule files in the correct directory based on event type.

**Directory structure:**
- Post rules → `rules/record/post/`
- Follow rules → `rules/record/follow/`
- Identity rules → `rules/identity/`
- Repost rules → `rules/record/repost/`
- etc.

**Rule file pattern:**

```sml
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
```

**Naming conventions:**
- Intermediate variables: `_PascalCase` prefix
- Rule names: PascalCase, `Rule` suffix (implicit from `Rule()` definition)
- Descriptive: explain what the rule detects

**Rule construction:**
- `Rule(when_all=[...], description=f'...')`
- `when_all` contains a list of conditions that must all be true
- All conditions must be type `bool` or `RuleT` — do not mix types

## 6. Wire Effects

Connect rules to effects via `WhenRules()`.

**Pattern:**
```sml
WhenRules(
  rules_any=[RuleName],
  then=[
    LabelAdd(entity=UserId, label='label-name'),
  ],
)
```

**Critical constraints:**

1. **Only use labels that exist in `config/labels.yaml`.**
   - Before writing an effect, verify the label name in the labels file.
   - If the label doesn't exist, tell the user they must add it to `config/labels.yaml` first.
   - **CRITICAL: Do not hardcode label names not present in the configuration.** (AC2.7)

2. **Choose the right effect type:**
   - `LabelAdd` / `LabelRemove` → internal Osprey labels (most common)
   - `AtprotoLabel` → emit to Bluesky's Ozone
   - `DeclareVerdict` → synchronous decision (emit immediately)

3. **Prevent re-labeling:**
   - Use `HasAtprotoLabel(entity=UserId, label='label-name')` as a guard in the rule's `when_all` to avoid re-labeling.
   - Pattern: `not _HasLabelX` (use negation to skip if already labeled)

4. **Example with guard:**
   ```sml
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
   ```

## 7. Wire into Execution Graph

Update the appropriate `index.sml` to load your new rule file.

**Pattern:**
- Unconditional: `Require(rule='rules/record/post/new_rule.sml')`
- Conditional: `Require(rule='...', require_if=IsOperation)`

**If creating a new event type directory:**
1. Create the directory: `rules/[event-type]/`
2. Create its `index.sml` with imports and local requires
3. Wire the new `index.sml` into the parent `rules/index.sml`

**Example wiring:**
```sml
# rules/record/post/index.sml
Import(
  rules=['models/base.sml'],
)

Require(rule='rules/record/post/profanity_rule.sml')
Require(rule='rules/record/post/spam_rule.sml')
```

Then update `rules/record/index.sml`:
```sml
Require(rule='rules/record/post/index.sml')
```

**Verification checklist:**
- [ ] Rule file created in correct directory
- [ ] Rule file imported/required in appropriate `index.sml`
- [ ] Parent `index.sml` updated if creating new directory
- [ ] All imports point to valid model files

## 8. Validate

**CRITICAL: You MUST validate after writing rules. This is not optional.**

**Validation command:**
```bash
uv run osprey-cli push-rules <project-path> --dry-run
```

**Process:**
1. Run the validation command
2. If validation passes → done, rules are syntactically correct
3. If validation fails → load `debugging-osprey-rules` skill to diagnose errors, fix, and re-validate

**Example validation output:**
```
$ uv run osprey-cli push-rules /path/to/rules --dry-run
Validating rules...
✓ Syntax check passed
✓ Model references valid
✓ All labels exist in config
✓ Execution graph wired correctly
Rules are valid!
```

**What dry-run checks:**
- Syntax correctness (SML parsing)
- Model references (all imports exist)
- Label existence (all labels in effects exist in `config/labels.yaml`)
- Execution graph wiring (all rules are reachable)
- Type safety (all conditions are bool or RuleT)

## 9. Skill Chaining

Load additional skills when you need specialized guidance.

**When to chain to `osprey-sml-reference`:**
- Need SML syntax reference or examples
- Unsure of naming conventions
- Need to look up labeling patterns
- Want to understand how to use list-based matching

Load with: `Skill(skill='osprey-sml-reference')`

**When to chain to `debugging-osprey-rules`:**
- Validation fails (push-rules --dry-run errors)
- Syntax errors in rule files
- Need to diagnose model or wiring issues
- Need to understand error messages

Load with: `Skill(skill='debugging-osprey-rules')`

## 10. Common Mistakes

These are patterns that cause rules to fail validation or not work as intended.

1. **Using `JsonData` where `EntityJson` is required**
   - Wrong: `UserId: str = JsonData(path='$.did')`
   - Right: `UserId: Entity[str] = EntityJson(type='UserId', path='$.did')`
   - Impact: Labels cannot attach to non-Entity types

2. **Mixing `RuleT` and `bool` in `when_all` lists**
   - Wrong: `when_all=[RuleA, SomeBoolean, RuleB]`
   - Right: Keep all conditions as `RuleT` or all as `bool`, don't mix
   - Impact: Type error, validation fails

3. **Hardcoding label names not in `config/labels.yaml`**
   - Wrong: `LabelAdd(entity=UserId, label='unknown-label')`
   - Right: Check `config/labels.yaml` first, only use labels that exist
   - Impact: Validation fails, label cannot be applied

4. **Forgetting to wire new rule into `index.sml`**
   - Wrong: Create `rules/record/post/new_rule.sml` but don't `Require` it
   - Right: Add `Require(rule='rules/record/post/new_rule.sml')` to the appropriate index
   - Impact: Rule is never executed

5. **Forgetting to run validation after writing**
   - Wrong: Assuming the rules work without running `uv run osprey-cli push-rules --dry-run`
   - Right: Run validation every time, fix errors, re-validate
   - Impact: Silent failures, invalid rules in production

6. **Using `rules_all=` instead of `rules_any=` in `WhenRules`**
   - Wrong: `WhenRules(rules_all=[RuleA], then=[...])`
   - Right: `WhenRules(rules_any=[RuleA], then=[...])`
   - Impact: Effects don't trigger, validation may fail

7. **Creating dead rules not referenced by any `WhenRules`**
   - Wrong: Define `Rule(...)` but never use it in a `WhenRules(...)`
   - Right: Every `Rule` must be referenced by at least one `WhenRules`
   - Impact: Dead code, no effect on labeling

## 11. Rationalizations to Block

These are common shortcuts that lead to broken rules. Reject them explicitly.

| Rationalization | Reality | Action |
| --- | --- | --- |
| "I'll validate later" | No. Every change requires validation. | Validate now. Every time. Run `uv run osprey-cli push-rules --dry-run` before finishing. |
| "This label probably exists" | No. Labels must be explicitly configured. | Read `config/labels.yaml` and confirm the label exists before using it. |
| "I know the type system" | No. SML type rules are strict. | Load `osprey-sml-reference` if uncertain about EntityJson vs JsonData. |
| "The project path is obvious" | No. Paths vary by deployment. | Always ask the user for the rules project path on first invocation. |
| "I'll skip the index wiring" | No. Rules not in the execution graph don't run. | Update `index.sml` to require the new rule. Verify the wiring is correct. |
| "I don't need to check labels.yaml" | No. Using undefined labels is a validation error. | Every effect must reference a label that exists in `config/labels.yaml`. |
| "The model file is correct, I'll ship it" | No. Models are compile-time dependencies. | Validate with `uv run osprey-cli push-rules --dry-run` after every model change. |
| "I'll use JsonData for this entity ID" | No. Entity IDs must be EntityJson. | Use `EntityJson` for anything that will be labeled (AC2.4). Use `JsonData` only for primitive values. |
| "osprey-cli passed, so the rule is correct" | Validation catches syntax errors, not logic or convention violations. | After validation passes, manually check for type mixing in `when_all`, hardcoded time values, and convention violations. Load `debugging-osprey-rules` Section 11 for the full checklist. |
| "I'll just run osprey-cli directly" | It's not on PATH. It must be invoked via `uv run` from the osprey-for-atproto repo. | Always use `uv run osprey-cli push-rules <path> --dry-run` from the osprey repo. |
| "86400 is clearer than Day" | It's not. Time constants from `models/base.sml` are the convention. | Replace all hardcoded time values: `86400` → `Day`, `3600` → `Hour`, `604800` → `Week`, etc. |
| "This is urgent, skip validation" | Urgency is exactly when mistakes happen. | Follow the full workflow. Every time. Skipping steps under pressure is how broken rules ship. |

---

**Next steps after completing rule writing:**
1. Run validation: `uv run osprey-cli push-rules <project-path> --dry-run`
2. If errors: load `debugging-osprey-rules` and fix
3. If success: confirm with user and document the rules created
