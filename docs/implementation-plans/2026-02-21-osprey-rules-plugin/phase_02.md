# Osprey Rules Plugin Implementation Plan — Phase 2

**Goal:** Create the SML Reference Skill with core type system documentation and progressive-disclosure reference files.

**Architecture:** A pure-reference skill (`osprey-sml-reference`) with main SKILL.md containing core SML concepts, linking to `references/labeling-patterns.md` (24 patterns) and `references/sml-conventions.md` (naming, time constants, anti-patterns).

**Tech Stack:** Claude Code skill system (SKILL.md with frontmatter), markdown reference files.

**Scope:** 7 phases from original design (phases 1-7).

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase implements and tests:

### osprey-rules-plugin.AC1: SML reference material is accurate and discoverable
- **osprey-rules-plugin.AC1.1 Success:** SKILL.md contains correct SML type system (`JsonData`, `EntityJson`, `Entity`, `Optional`) with usage examples
- **osprey-rules-plugin.AC1.2 Success:** Reference file links in SKILL.md resolve to existing files with content
- **osprey-rules-plugin.AC1.3 Success:** All 24 labeling patterns from existing `labeling-patterns.md` are represented with template code
- **osprey-rules-plugin.AC1.4 Success:** Conventions match those in existing CLAUDE.md (naming, time constants, IncrementWindow keys, RegexMatch rules)
- **osprey-rules-plugin.AC1.5 Failure:** Skill does not load when triggered by unrelated queries

---

## Phase 2: SML Reference Skill

**Goal:** Create the pure-reference skill with core SML syntax and progressive-disclosure reference files.

<!-- START_SUBCOMPONENT_A (tasks 1-3) -->

<!-- START_TASK_1 -->
### Task 1: Create osprey-sml-reference SKILL.md

**Verifies:** osprey-rules-plugin.AC1.1, osprey-rules-plugin.AC1.2, osprey-rules-plugin.AC1.5

**Files:**
- Create: `osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md`

**Implementation:**

Create the main skill file with YAML frontmatter and core SML reference content. The frontmatter `description` field must use narrow trigger language (SML syntax, conventions, labeling patterns) to prevent loading on unrelated queries (AC1.5).

The SKILL.md must contain:

1. **Frontmatter** with:
   - `name: osprey-sml-reference`
   - `description:` starting with "Use when" and listing specific SML triggers (syntax questions, naming conventions, labeling patterns, type system queries). Must NOT trigger on general coding questions.
   - `user-invocable: false`

2. **Core Type System** section covering these four types with usage examples:
   - `JsonData(path, required, coerce_type)` — extracts primitive values from event JSON. Returns `str`, `int`, `float`, `bool`, `Optional[T]`, or `List[T]`.
   - `EntityJson(type, path, required)` — extracts entity identifiers (things labels attach to). Returns `Entity[str]` or `Entity[int]`. **Use for ID values** (`UserId`, `Handle`, `AtUri`, `PdsHost`). Common mistake: using `JsonData` where `EntityJson` is needed.
   - `Entity(type, id)` — constructs entity from known values (e.g., computed AT-URI). Returns `Entity[T]`.
   - `Optional[T]` — nullable type. Use `ResolveOptional(optional_value=X, default_value=Y)` to unwrap.

   Include this critical distinction:
   ```
   # CORRECT — UserId is an entity, labels attach to it
   UserId: Entity[str] = EntityJson(type='UserId', path='$.did', required=False)

   # WRONG — JsonData produces str, not Entity[str]. Labels can't attach to str.
   UserId: str = JsonData(path='$.did')
   ```

3. **Core Constructs** section:
   - `Rule(when_all=[...], description=f'...')` — AND of all conditions, produces `RuleT`
   - `WhenRules(rules_any=[...], then=[...])` — OR trigger, always use `rules_any=` never `rules_all=`
   - `Import(rules=['path/to/file.sml'])` — load models/rules from other files
   - `Require(rule='path/to/file.sml', require_if=condition)` — conditional inclusion

4. **Operators** section:
   - `when_all` items must be same type — don't mix `RuleT` and `bool`
   - `RegexMatch(...)`, comparisons (`X < Y`), `or`/`and` on bools → `bool`
   - `Rule(...)` → `RuleT`; `RuleT or RuleT` → `RuleT`
   - Use infix `or` (`A or B or C`), NOT function-call `or(A, B, C)`
   - `not` works on both `bool` and `RuleT`

5. **Effects** section:
   - `LabelAdd(entity, label, apply_if?, expires_after?, delay_action_by?)` — add label
   - `LabelRemove(entity, label, ...)` — remove label
   - `AtprotoLabel(entity, label, comment, expiration_in_hours)` — emit to Bluesky Ozone
   - `DeclareVerdict(verdict)` — for synchronous callers
   - `HasLabel(entity, label, manual?, status?, min_label_age?)` — check existing label

6. **Key UDFs Quick Reference** — table of commonly used UDFs:
   - `RegexMatch(pattern, target, case_insensitive?)` → `bool`
   - `IncrementWindow(key, window_seconds, when_all)` → `int`
   - `GetWindowCount(key, window_seconds, when_all)` → `int`
   - `ListContains(list, phrases, case_sensitive?, word_boundaries?)` → `Optional[str]`
   - `CensorizedListContains(list, phrases, plurals?, must_be_censorized?)` → `Optional[str]`
   - `HasAtprotoLabel(entity, label)` → `bool`
   - `TimeDelta(weeks?, days?, hours?, minutes?, seconds?)` → `TimeDeltaT`
   - `AnalyzeToxicity(text, when_all)` → `Optional[float]`
   - `AnalyzeSentiment(text, when_all)` → `Optional[float]`

**Size constraint:** The SKILL.md should be ~100-150 lines. If it exceeds this, move the detailed UDF parameter documentation (section 6) into a separate `references/udf-reference.md` file and link to it from SKILL.md. The core type system and constructs should stay in SKILL.md; the UDF quick reference table can move to a reference file if needed.

7. **Progressive Disclosure Links** — at end of each major section, link to reference files:
   - "For all 24 labeling patterns with template code, read `references/labeling-patterns.md`"
   - "For complete naming conventions, time constants, and anti-patterns, read `references/sml-conventions.md`"

**Source material (do NOT copy verbatim — adapt for skill format):**
- Type system: `/Users/scarndp/dev/osprey-for-atproto/example_rules/models/base.sml` (actual type usage)
- UDF reference: `/Users/scarndp/dev/osprey-for-atproto/example_rules/labeling-patterns.md` (Primitives section, lines 48-127)
- Writing guide: `/Users/scarndp/dev/osprey-for-atproto/docs/v2/rules/WRITING_RULES.md` (model/rule structure)

**Verification:**

Verify the file exists and has correct frontmatter:
```bash
head -5 osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md
```
Expected: YAML frontmatter with `name: osprey-sml-reference` and `description:` starting with "Use when".

**Commit:** `feat(osprey-rules-plugin): add SML reference skill core SKILL.md`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create references/labeling-patterns.md

**Verifies:** osprey-rules-plugin.AC1.3

**Files:**
- Create: `osprey-rules-plugin/skills/osprey-sml-reference/references/labeling-patterns.md`

**Implementation:**

Create the progressive-disclosure reference file containing all 24 labeling patterns. Each pattern must include:
- Pattern name and number (matching the source)
- "When to use" — 1-2 sentence description of the use case
- Template code — a minimal, working SML code example

The 24 patterns (from `/Users/scarndp/dev/osprey-for-atproto/example_rules/labeling-patterns.md`):

1. **Simple Content Match** — label when post content matches a word list
2. **Identity-Based Labeling** — label a specific account by DID
3. **Account Metadata Gating** — use account age, post count, follower count as gates
4. **Temporal Expiration** — labels that auto-expire via `expires_after=TimeDelta(...)`
5. **Conditional Escalation (Label Chaining)** — apply label only if entity already has prior label
6. **Sliding Window Rate Limiting** — `IncrementWindow` for N violations in M time
7. **Strike System** — discrete escalation tiers using `apply_if` with `HasLabel`
8. **Manual Override Protection** — respect `MANUALLY_REMOVED` status
9. **Label Maturity Check** — act on labels that have existed for minimum duration
10. **Multi-Signal Composite** — combine multiple independent signals
11. **ML-Scored Labeling** — `AnalyzeToxicity`/`AnalyzeSentiment` as rule conditions
12. **Domain/Link-Based Labeling** — `ListContains` with `PostAllDomains`
13. **Cross-Entity Labeling** — label both post and user in single `WhenRules`
14. **Regex Pattern Matching** — `RegexMatch` for content patterns
15. **List-Based Matching** — `ListContains`, `ListContainsCount`, `RegexListContains`
16. **Censorized (Lookalike) Detection** — `CensorizedListContains` for obfuscated text
17. **AT Protocol Label Emission** — `AtprotoLabel` to Bluesky Ozone
18. **AT Protocol List Management** — `AtprotoList` for list membership
19. **Verdict Declaration** — `DeclareVerdict` for synchronous decisions
20. **Bulk Labeling** — `BulkLabelSink` for batch operations (note: operator-initiated, not rule-driven)
21. **Cooldown / Debounce** — `CacheSetStr`/`CacheGetStr` to prevent repeated labeling
22. **Cached State Tracking** — Redis cache for arbitrary cross-event state
23. **Label Removal on Condition** — `LabelRemove` when conditions change
24. **Multi-Rule OR Trigger** — multiple rules in single `WhenRules.rules_any`

**Source material:** Adapt directly from `/Users/scarndp/dev/osprey-for-atproto/example_rules/labeling-patterns.md`. Each pattern has a code example in the source — use those as the template code. Adjust variable names to be generic where appropriate (the source patterns are already well-structured).

**Verification:**

Count patterns (each pattern must use an h3 `### N. Pattern Name` heading to match the source format):
```bash
grep -c "^### " osprey-rules-plugin/skills/osprey-sml-reference/references/labeling-patterns.md
```
Expected: `24`

Verify the link from SKILL.md resolves:
```bash
test -f osprey-rules-plugin/skills/osprey-sml-reference/references/labeling-patterns.md && echo "exists"
```
Expected: `exists`

**Commit:** `feat(osprey-rules-plugin): add labeling patterns reference (24 patterns)`
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Create references/sml-conventions.md

**Verifies:** osprey-rules-plugin.AC1.4

**Files:**
- Create: `osprey-rules-plugin/skills/osprey-sml-reference/references/sml-conventions.md`

**Implementation:**

Create the conventions reference file. This must accurately reflect the conventions from `/Users/scarndp/dev/osprey-for-atproto/example_rules/CLAUDE.md`.

Sections to include:

1. **Variable Naming**
   - PascalCase for all variables
   - `_` prefix for intermediate/internal variables (e.g., `_IsNewAccount`, `_Gate`)
   - `Rule` suffix for rule variables (e.g., `MassFollowingMidRule`)
   - IncrementWindow variables describe what's counted (e.g., `_NumericHandleFollowCount10m`)

2. **Time Constants**
   - Always use constants from `models/base.sml`: `Second`, `Minute`, `FiveMinute`, `TenMinute`, `ThirtyMinute`, `Hour`, `Day`, `Week`
   - Use `Day` not `24 * Hour`; use `Hour` not `60 * Minute`
   - `AccountAgeSecondsUnwrapped` comparisons use time constants (e.g., `< Day`, `<= 7 * Day`)

3. **RegexMatch Conventions**
   - Use inline inside `when_all` blocks — don't assign to variable unless pattern reused
   - Use `case_insensitive=True` parameter, NOT `(?i)` in pattern
   - Parameters: `target=` and `pattern=`

4. **IncrementWindow Conventions**
   - Key strings: f-strings with kebab-case prefix and `{UserId}` suffix: `f'descriptive-name-{UserId}'`
   - Include time window in key when multiple windows: `f'name-10m-{UserId}'`
   - `window_seconds` must use time constants (e.g., `10 * Minute`, `Day`)
   - Don't create duplicate IncrementWindows with identical `when_all` — use one counter with multiple threshold rules

5. **Rule Conventions**
   - Every `Rule` must be referenced somewhere (in `WhenRules`, another rule's `when_all`, or `IncrementWindow`'s `when_all`). No dead rules.
   - `description` uses f-strings with `{Handle}` or `{UserId}`
   - `or` inside `when_all`: use infix `A or B or C`, NOT `or(A, B, C)`

6. **Type Rules in `when_all`**
   - All items must be same type — do NOT mix `RuleT` and `bool`
   - `RegexMatch(...)`, variable comparisons, `or`/`and` on bools → `bool`
   - `Rule(...)` → `RuleT`; `RuleT or RuleT` → `RuleT`
   - In `IncrementWindow` `when_all`, prefer inline `RegexMatch` (bool) with bool gates

7. **WhenRules**
   - Always `rules_any=`, never `rules_all=`
   - Every actionable rule needs a `WhenRules` connecting it to an effect

8. **General**
   - No unused variables
   - Rule files in `rules/record/follow/` only handle follow events; post logic in `rules/record/post/`
   - No hardcoded label names — read from `config/labels.yaml`

9. **Anti-Patterns** — explicit list of what NOT to do:
   - Using `JsonData` for entity IDs (use `EntityJson`)
   - Mixing `RuleT` and `bool` in `when_all`
   - Using `(?i)` in regex patterns (use `case_insensitive=True`)
   - Hardcoding time values instead of constants
   - Using `rules_all=` in `WhenRules`
   - Creating dead rules not referenced by any `WhenRules` or other construct
   - Using function-call `or(A, B, C)` instead of infix `A or B or C`

**Source material:** Adapt directly from `/Users/scarndp/dev/osprey-for-atproto/example_rules/CLAUDE.md`. The conventions file must match exactly — do not add conventions not present in the source, and do not omit any.

**Verification:**

Check key sections exist:
```bash
grep -c "^##" osprey-rules-plugin/skills/osprey-sml-reference/references/sml-conventions.md
```
Expected: At least 9 section headers.

Verify the link from SKILL.md resolves:
```bash
test -f osprey-rules-plugin/skills/osprey-sml-reference/references/sml-conventions.md && echo "exists"
```
Expected: `exists`

**Commit:** `feat(osprey-rules-plugin): add SML conventions reference`
<!-- END_TASK_3 -->

<!-- END_SUBCOMPONENT_A -->
