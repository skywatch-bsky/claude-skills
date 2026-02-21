# Osprey Rules Plugin — Test Requirements

Maps every acceptance criterion from the design to a concrete verification method. This is a Claude Code plugin (markdown files, not traditional code), so verification falls into three categories:

1. **Structural verification** — file exists, frontmatter correct, content patterns present. Automated via shell commands.
2. **Subagent pressure testing** — RED-GREEN-REFACTOR per Phase 7. Requires human-driven session with subagent dispatch.
3. **CLI validation** — `osprey-cli push-rules --dry-run` against a real rules project.

There are no unit tests, no test runner, no build system. "Automated" here means a shell one-liner that exits 0 on pass, non-zero on fail.

---

## Summary Table

| AC | Description | Verification Type | Method | Phase |
|----|-------------|-------------------|--------|-------|
| AC1.1 | SKILL.md contains correct SML type system with examples | Structural | Grep for type names + code block | 2 |
| AC1.2 | Reference file links resolve to existing files | Structural | Extract links, test -f each | 2 |
| AC1.3 | All 24 labeling patterns represented with template code | Structural | Count h3 headings + grep code blocks | 2 |
| AC1.4 | Conventions match existing CLAUDE.md | Structural + Human | Grep key sections; human diff against source | 2 |
| AC1.5 | Skill does not load on unrelated queries | Human / Subagent | Trigger skill with unrelated prompt, verify no load | 7 |
| AC2.1 | Skill asks for rules project path on first invocation | Subagent | RED phase Scenario 1a (no path given) | 7 |
| AC2.2 | Skill reads config/labels.yaml and models/ | Structural + Subagent | Grep for file paths in SKILL.md; GREEN phase observation | 3, 7 |
| AC2.3 | Generated rules follow project structure conventions | Subagent + CLI | GREEN phase output + osprey-cli validation | 7 |
| AC2.4 | Generated rules use EntityJson for ID values | Structural + Subagent | Grep CRITICAL in SKILL.md; GREEN phase observation | 3, 7 |
| AC2.5 | Skill chains to osprey-sml-reference | Structural | Grep for skill name in writing SKILL.md | 3 |
| AC2.6 | Skill mandates validation via osprey-cli | Structural | Grep for push-rules mandate in SKILL.md | 3 |
| AC2.7 | No hardcoded labels not in config/labels.yaml | Structural + Subagent | Grep for label guard in SKILL.md; GREEN phase observation | 3, 7 |
| AC3.1 | Identifies type mismatch errors | Structural | Grep for type mismatch section in debugging SKILL.md | 4 |
| AC3.2 | Identifies import cycle errors | Structural | Grep for import cycle section in debugging SKILL.md | 4 |
| AC3.3 | Identifies undefined variable errors | Structural | Grep for undefined variable section in debugging SKILL.md | 4 |
| AC3.4 | Mandates re-validation after fixes | Structural | Grep for re-validate mandate in debugging SKILL.md | 4 |
| AC3.5 | Handles multiple simultaneous errors | Structural + Subagent | Grep for multi-error handling; Scenario 2 in Phase 7 | 4, 7 |
| AC4.1 | Agent loads writing-osprey-rules for write tasks | Structural + Subagent | Grep routing table; GREEN Scenario 1 | 5, 7 |
| AC4.2 | Agent loads debugging-osprey-rules for fix tasks | Structural + Subagent | Grep routing table; GREEN Scenario 2 | 5, 7 |
| AC4.3 | Agent loads osprey-sml-reference for pattern queries | Structural + Subagent | Grep routing table; GREEN Scenario 3 | 5, 7 |
| AC4.4 | Agent does NOT bake skill content into prompt | Structural | Grep for SML syntax terms — must return 0 matches | 5 |
| AC5.1 | /osprey-validate runs push-rules --dry-run | Structural + CLI | Grep command body; manual run against real project | 6 |
| AC5.2 | Command asks for path when no argument | Structural | Grep for AskUserQuestion / ARGUMENTS in command | 6 |
| AC5.3 | Reports error when osprey-cli not installed | Structural | Grep for install instructions in command | 6 |
| AC5.4 | Reports validation errors without swallowing | Structural | Grep for error handling / full output instructions | 6 |
| AC6.1 | Subagent with skills produces passing rules | Subagent + CLI | GREEN phase: osprey-cli push-rules --dry-run passes | 7 |
| AC6.2 | Baseline without skills shows degradation | Subagent | RED phase: document failures vs GREEN comparison | 7 |
| AC6.3 | Known rationalizations blocked in skill text | Structural + Subagent | Grep rationalization tables; REFACTOR phase testing | 7 |

---

## Detailed Verification by AC Group

### AC1.x — SML Reference Material Accuracy

#### AC1.1: SKILL.md contains correct SML type system with usage examples

**Type:** Structural (automated)

**Test commands:**
```bash
# Verify all four core types are documented
for type in JsonData EntityJson Entity Optional; do
  grep -q "$type" osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md \
    || { echo "FAIL: missing $type"; exit 1; }
done
echo "PASS: all four core types present"

# Verify code examples exist (at least one fenced code block)
grep -c '```' osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md | \
  awk '{ if ($1 >= 2) print "PASS: code blocks present"; else { print "FAIL: no code examples"; exit 1 } }'

# Verify the EntityJson vs JsonData distinction is documented
grep -q "EntityJson" osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md \
  && grep -q "JsonData" osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md \
  && echo "PASS: EntityJson/JsonData distinction present" \
  || { echo "FAIL: missing type distinction"; exit 1; }
```

**Expected file:** `osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md`

---

#### AC1.2: Reference file links resolve to existing files

**Type:** Structural (automated)

**Test commands:**
```bash
# Extract markdown links from SKILL.md that point to references/ and verify each exists
grep -oE 'references/[a-zA-Z0-9_-]+\.md' \
  osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md | \
  sort -u | while read ref; do
    path="osprey-rules-plugin/skills/osprey-sml-reference/$ref"
    if [ ! -f "$path" ]; then
      echo "FAIL: broken link: $ref -> $path does not exist"
      exit 1
    fi
    # Verify the file has content (not empty)
    if [ ! -s "$path" ]; then
      echo "FAIL: empty file: $path"
      exit 1
    fi
  done && echo "PASS: all reference links resolve to non-empty files"
```

**Expected files:**
- `osprey-rules-plugin/skills/osprey-sml-reference/references/labeling-patterns.md`
- `osprey-rules-plugin/skills/osprey-sml-reference/references/sml-conventions.md`

---

#### AC1.3: All 24 labeling patterns represented with template code

**Type:** Structural (automated)

**Test commands:**
```bash
# Count h3 pattern headings
count=$(grep -c "^### " osprey-rules-plugin/skills/osprey-sml-reference/references/labeling-patterns.md)
if [ "$count" -eq 24 ]; then
  echo "PASS: exactly 24 pattern headings"
elif [ "$count" -gt 24 ]; then
  echo "WARN: $count headings found (expected 24) — may have extra sections"
else
  echo "FAIL: only $count pattern headings (expected 24)"
  exit 1
fi

# Verify each pattern has a code block (template code)
# Count fenced code blocks — should be at least 24 (one per pattern)
code_blocks=$(grep -c '```' osprey-rules-plugin/skills/osprey-sml-reference/references/labeling-patterns.md)
# Each code block has open + close = 2 lines, so divide by 2
actual_blocks=$((code_blocks / 2))
if [ "$actual_blocks" -ge 24 ]; then
  echo "PASS: at least 24 code blocks (template code)"
else
  echo "FAIL: only $actual_blocks code blocks (expected >= 24)"
  exit 1
fi
```

**Expected file:** `osprey-rules-plugin/skills/osprey-sml-reference/references/labeling-patterns.md`

---

#### AC1.4: Conventions match existing CLAUDE.md

**Type:** Structural (automated) + Human (manual diff)

**Automated test — verify key convention sections exist:**
```bash
# Check that critical convention topics are covered
for topic in "PascalCase" "Time Constants" "RegexMatch" "IncrementWindow" "Anti-Pattern"; do
  grep -qi "$topic" osprey-rules-plugin/skills/osprey-sml-reference/references/sml-conventions.md \
    || { echo "FAIL: missing convention topic: $topic"; exit 1; }
done
echo "PASS: all key convention topics present"

# Verify minimum section count (design specifies 9 sections)
sections=$(grep -c "^## " osprey-rules-plugin/skills/osprey-sml-reference/references/sml-conventions.md)
if [ "$sections" -ge 9 ]; then
  echo "PASS: $sections sections (>= 9)"
else
  echo "FAIL: only $sections sections (expected >= 9)"
  exit 1
fi
```

**Human verification required:**

**Justification:** Content accuracy cannot be verified structurally. The convention file must match the source material from the Osprey project's CLAUDE.md. A structural grep confirms topics exist but cannot confirm they are _correct_.

**Verification approach:**
1. Open `osprey-rules-plugin/skills/osprey-sml-reference/references/sml-conventions.md` side-by-side with the source CLAUDE.md from the Osprey rules project
2. Confirm: no conventions omitted from the source
3. Confirm: no conventions added that contradict the source
4. Confirm: code examples are syntactically valid SML

---

#### AC1.5: Skill does not load on unrelated queries

**Type:** Human / Subagent (not automatable)

**Justification:** Skill trigger behaviour depends on the Claude Code skill-matching system interpreting the `description` field in frontmatter. This cannot be tested structurally — it requires observing whether the skill actually loads in a live session.

**Verification approach:**
1. Verify the frontmatter `description` starts with "Use when" and contains narrow trigger language (structural pre-check):
   ```bash
   head -10 osprey-rules-plugin/skills/osprey-sml-reference/SKILL.md | grep -q "Use when" \
     && echo "PASS: description uses 'Use when' prefix" \
     || echo "FAIL: description missing 'Use when' prefix"
   ```
2. In a live Claude Code session with the plugin installed, test these prompts and verify the skill does NOT load:
   - "Write a Python function to sort a list"
   - "Help me with my React component"
   - "What is the AT Protocol?"
3. Verify the skill DOES load for:
   - "What SML types are available?"
   - "How do I write a labeling pattern in Osprey?"

---

### AC2.x — Rule Authoring Workflow

#### AC2.1: Skill asks for rules project path on first invocation

**Type:** Structural (pre-check) + Subagent (Phase 7 RED/GREEN)

**Structural pre-check:**
```bash
# Verify the writing skill mentions project discovery and AskUserQuestion
grep -q "AskUserQuestion" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: AskUserQuestion referenced in skill" \
  || echo "FAIL: AskUserQuestion not found in skill"

grep -qi "project.*path\|rules.*path\|discover" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: project discovery mentioned" \
  || echo "FAIL: project discovery not mentioned"
```

**Subagent verification (Phase 7, Scenario 1a):**

**Justification:** Whether the skill _actually causes_ Claude to ask for the path can only be observed in a live subagent run. The structural check confirms the instruction exists; the subagent test confirms it works.

**Verification approach:**
- RED phase Scenario 1a: dispatch subagent WITHOUT skills, omit the project path. Observe whether it asks (expected: it does not).
- GREEN phase Scenario 1a: dispatch agent WITH skills, omit the path. Observe whether it asks (expected: it does).
- Compare: if RED does not ask and GREEN does, AC2.1 is satisfied.

---

#### AC2.2: Skill reads config/labels.yaml and models/

**Type:** Structural (automated)

**Test commands:**
```bash
# Verify the writing skill references both discovery targets
grep -q "config/labels.yaml" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: config/labels.yaml referenced" \
  || { echo "FAIL: config/labels.yaml not referenced"; exit 1; }

grep -q "models/" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: models/ directory referenced" \
  || { echo "FAIL: models/ not referenced"; exit 1; }
```

**Subagent confirmation:** GREEN phase Scenarios 1a/1b — observe whether the agent reads these files after discovering the project.

---

#### AC2.3: Generated rules follow project structure conventions

**Type:** Subagent + CLI (Phase 7 only)

**Justification:** Whether generated rules land in the correct directory and get wired into `index.sml` can only be verified by examining the actual output of a rule-writing session. No structural check on the skill file can guarantee this — only the skill's _effect_ on Claude's behaviour proves it.

**Verification approach:**
1. GREEN phase Scenario 1b: agent writes a rule
2. Check the rule was placed in the correct directory (e.g., `rules/identity/` for identity rules)
3. Check the relevant `index.sml` was updated with a `Require` entry
4. Run `osprey-cli push-rules <path> --dry-run` — if it passes, the wiring is correct

---

#### AC2.4: Generated rules use EntityJson for ID values

**Type:** Structural (pre-check) + Subagent (Phase 7)

**Structural pre-check:**
```bash
# Verify the CRITICAL warning about EntityJson exists in the writing skill
grep -c "CRITICAL" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md | \
  awk '{ if ($1 >= 1) print "PASS: CRITICAL warnings present"; else { print "FAIL: no CRITICAL warnings"; exit 1 } }'

grep -q "EntityJson" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: EntityJson mentioned in writing skill" \
  || { echo "FAIL: EntityJson not in writing skill"; exit 1; }
```

**Subagent verification:** GREEN phase — inspect generated rules for `EntityJson` usage on entity identifiers. Cross-reference RED phase to confirm this was a common failure without skills.

---

#### AC2.5: Skill chains to osprey-sml-reference

**Type:** Structural (automated)

**Test commands:**
```bash
grep -c "osprey-sml-reference" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md | \
  awk '{ if ($1 >= 1) print "PASS: chains to osprey-sml-reference ("$1" references)"; else { print "FAIL: no reference to osprey-sml-reference"; exit 1 } }'
```

**Expected file:** `osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md`

---

#### AC2.6: Skill mandates validation via osprey-cli

**Type:** Structural (automated)

**Test commands:**
```bash
grep -q "osprey-cli push-rules" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: osprey-cli push-rules command present" \
  || { echo "FAIL: validation command not found"; exit 1; }

grep -q "\-\-dry-run" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: --dry-run flag present" \
  || { echo "FAIL: --dry-run not found"; exit 1; }

# Check for mandatory language
grep -qi "MUST\|CRITICAL\|not optional" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: mandatory validation language present" \
  || echo "WARN: no strong mandate language found"
```

---

#### AC2.7: No hardcoded labels not in config/labels.yaml

**Type:** Structural (pre-check) + Subagent (Phase 7)

**Structural pre-check:**
```bash
# Verify the skill warns against hardcoded labels
grep -qi "hardcod\|config/labels.yaml" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: label hardcoding warning present" \
  || { echo "FAIL: no hardcoding warning"; exit 1; }
```

**Subagent verification:** GREEN phase — check whether generated rules reference labels that exist in the project's `config/labels.yaml`. RED phase should show hardcoded labels as a common failure.

---

### AC3.x — Debugging Skill Error Resolution

#### AC3.1: Identifies type mismatch errors

**Type:** Structural (automated)

**Test commands:**
```bash
# Verify the debugging skill covers type mismatch
grep -qi "type mismatch\|incompatible types\|RuleT.*bool\|bool.*RuleT" \
  osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md \
  && echo "PASS: type mismatch coverage present" \
  || { echo "FAIL: type mismatch not covered"; exit 1; }

# Verify it includes the error message pattern
grep -q "incompatible types in assignment" \
  osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md \
  && echo "PASS: error message pattern documented" \
  || echo "WARN: exact error message not found"
```

---

#### AC3.2: Identifies import cycle errors

**Type:** Structural (automated)

**Test commands:**
```bash
grep -qi "import cycle\|cyclic dependency\|circular" \
  osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md \
  && echo "PASS: import cycle coverage present" \
  || { echo "FAIL: import cycle not covered"; exit 1; }

grep -q "import cycle detected" \
  osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md \
  && echo "PASS: error message pattern documented" \
  || echo "WARN: exact error message not found"
```

---

#### AC3.3: Identifies undefined variable errors

**Type:** Structural (automated)

**Test commands:**
```bash
grep -qi "undefined variable\|unknown identifier\|unknown local variable" \
  osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md \
  && echo "PASS: undefined variable coverage present" \
  || { echo "FAIL: undefined variable not covered"; exit 1; }
```

---

#### AC3.4: Mandates re-validation after fixes

**Type:** Structural (automated)

**Test commands:**
```bash
grep -ci "re-validate\|MUST.*validate\|CRITICAL.*validate\|not optional" \
  osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md | \
  awk '{ if ($1 >= 1) print "PASS: re-validation mandate present ("$1" matches)"; else { print "FAIL: no re-validation mandate"; exit 1 } }'
```

---

#### AC3.5: Handles multiple simultaneous errors

**Type:** Structural (pre-check) + Subagent (Phase 7)

**Structural pre-check:**
```bash
grep -qi "multiple.*error\|\[1/N\]\|\[2/N\]\|simultaneous\|first error" \
  osprey-rules-plugin/skills/debugging-osprey-rules/SKILL.md \
  && echo "PASS: multi-error handling documented" \
  || { echo "FAIL: multi-error handling not covered"; exit 1; }
```

**Subagent verification (Phase 7, Scenario 2):** Create a deliberately broken SML file with multiple errors, dispatch agent with debugging skill, observe whether it handles them sequentially and re-validates after each fix.

---

### AC4.x — Agent Delegation

#### AC4.1: Agent loads writing-osprey-rules for write tasks

**Type:** Structural (automated)

**Test commands:**
```bash
# Verify routing table maps write tasks to writing skill
grep -A2 "write.*rule\|creating.*rules" osprey-rules-plugin/agents/osprey-rule-writer.md | \
  grep -q "writing-osprey-rules" \
  && echo "PASS: write tasks routed to writing-osprey-rules" \
  || { echo "FAIL: write task routing missing"; exit 1; }
```

**Subagent confirmation:** GREEN phase Scenario 1 — observe that agent loads `writing-osprey-rules` first.

---

#### AC4.2: Agent loads debugging-osprey-rules for fix tasks

**Type:** Structural (automated)

**Test commands:**
```bash
grep -A2 "fix.*error\|debugging" osprey-rules-plugin/agents/osprey-rule-writer.md | \
  grep -q "debugging-osprey-rules" \
  && echo "PASS: fix tasks routed to debugging-osprey-rules" \
  || { echo "FAIL: fix task routing missing"; exit 1; }
```

**Subagent confirmation:** GREEN phase Scenario 2 — observe that agent loads `debugging-osprey-rules`.

---

#### AC4.3: Agent loads osprey-sml-reference for pattern queries

**Type:** Structural (automated)

**Test commands:**
```bash
grep -A2 "pattern\|reference\|review" osprey-rules-plugin/agents/osprey-rule-writer.md | \
  grep -q "osprey-sml-reference" \
  && echo "PASS: reference tasks routed to osprey-sml-reference" \
  || { echo "FAIL: reference task routing missing"; exit 1; }
```

**Subagent confirmation:** GREEN phase Scenario 3 — observe that agent loads `osprey-sml-reference`.

---

#### AC4.4: Agent does NOT bake skill content into prompt

**Type:** Structural (automated)

**Test commands:**
```bash
# Agent file must NOT contain detailed SML syntax/reference content
# Brief mentions in routing descriptions are OK; detailed code examples are not
count=$(grep -c "EntityJson\|JsonData\|when_all\|IncrementWindow" \
  osprey-rules-plugin/agents/osprey-rule-writer.md)
if [ "$count" -eq 0 ]; then
  echo "PASS: agent does not contain SML reference content"
else
  echo "FAIL: agent contains $count SML reference terms (should be 0)"
  exit 1
fi

# Agent file should be relatively short (50-80 lines per design)
lines=$(wc -l < osprey-rules-plugin/agents/osprey-rule-writer.md)
if [ "$lines" -le 100 ]; then
  echo "PASS: agent file is $lines lines (compact)"
else
  echo "WARN: agent file is $lines lines (expected <= 100)"
fi
```

---

### AC5.x — Validation Command

#### AC5.1: /osprey-validate runs push-rules --dry-run

**Type:** Structural (automated) + CLI (manual)

**Structural test:**
```bash
grep -q "osprey-cli push-rules" osprey-rules-plugin/commands/osprey-validate.md \
  && echo "PASS: push-rules command in command file" \
  || { echo "FAIL: push-rules not found"; exit 1; }

grep -q "\-\-dry-run" osprey-rules-plugin/commands/osprey-validate.md \
  && echo "PASS: --dry-run flag present" \
  || { echo "FAIL: --dry-run not found"; exit 1; }
```

**Manual CLI verification:**

**Justification:** The command executes in a live Claude Code session. Structural checks confirm the instructions exist; only a manual run confirms the command actually works end-to-end.

**Verification approach:**
1. Install the plugin: `/plugin install file:///path/to/osprey-rules-plugin`
2. Run: `/osprey-validate <path-to-rules-project>`
3. Confirm it runs `osprey-cli push-rules <path> --dry-run`
4. Confirm it reports the result (pass or fail with errors)

---

#### AC5.2: Command asks for path when no argument

**Type:** Structural (automated)

**Test commands:**
```bash
grep -qi "AskUserQuestion\|ARGUMENTS\|no argument\|not provided" \
  osprey-rules-plugin/commands/osprey-validate.md \
  && echo "PASS: path prompt logic present" \
  || { echo "FAIL: no argument handling missing"; exit 1; }
```

---

#### AC5.3: Reports error when osprey-cli not installed

**Type:** Structural (automated)

**Test commands:**
```bash
grep -qi "not installed\|not found\|not on.*PATH\|install" \
  osprey-rules-plugin/commands/osprey-validate.md \
  && echo "PASS: install error handling present" \
  || { echo "FAIL: osprey-cli missing handling not found"; exit 1; }

# Verify install instructions are included
grep -qi "uv pip install\|pip install" \
  osprey-rules-plugin/commands/osprey-validate.md \
  && echo "PASS: install instructions present" \
  || { echo "FAIL: install instructions missing"; exit 1; }
```

---

#### AC5.4: Reports validation errors without swallowing

**Type:** Structural (automated)

**Test commands:**
```bash
# Verify the command instructs to output full errors, not summarize
grep -qi "full.*error\|do not summarize\|do not truncate\|without swallowing\|FULL.*output" \
  osprey-rules-plugin/commands/osprey-validate.md \
  && echo "PASS: full error output instruction present" \
  || echo "WARN: no explicit 'show full errors' instruction (check manually)"

# Verify exit code handling
grep -qi "exit code\|exit.*0\|exit.*1" \
  osprey-rules-plugin/commands/osprey-validate.md \
  && echo "PASS: exit code handling present" \
  || echo "WARN: exit code handling not found"
```

---

### AC6.x — End-to-End Quality Under TDD

#### AC6.1: Subagent with skills produces rules that pass osprey-cli

**Type:** Subagent + CLI (Phase 7 only — not automatable without live session)

**Justification:** This is the gold-standard integration test. It requires dispatching a live subagent with skills loaded, having it write rules against a real Osprey project, and running `osprey-cli push-rules --dry-run`. No structural check can substitute for this.

**Verification approach:**
1. GREEN phase Scenario 1b (Phase 7, Task 2)
2. Dispatch `osprey-rule-writer` agent with a rule-writing prompt
3. Let the agent complete the full workflow (discover, read, write, wire, validate)
4. Independently run `osprey-cli push-rules <path> --dry-run` on the result
5. **Pass criterion:** exit code 0

**Cleanup:** `cd <RULES_PROJECT_PATH> && git checkout . && git clean -fd`

---

#### AC6.2: Baseline without skills shows measurable quality degradation

**Type:** Subagent (Phase 7 only — not automatable)

**Justification:** This is a comparative test between two subagent runs (with and without skills). The degradation must be observable and documented, not inferred from structure.

**Verification approach:**
1. RED phase (Phase 7, Task 1): run all 4 scenarios WITHOUT skills
2. GREEN phase (Phase 7, Task 2): run all 4 scenarios WITH skills
3. Compare results and document:
   - Number of failures in RED vs GREEN
   - Types of failures prevented by skills
   - Quantified: "X out of Y RED failures prevented in GREEN"
4. **Pass criterion:** GREEN shows measurably fewer failures than RED. At minimum, GREEN Scenario 1b must produce passing SML where RED Scenario 1b does not.

---

#### AC6.3: Known rationalizations blocked in skill text

**Type:** Structural (automated) + Subagent (Phase 7 REFACTOR)

**Structural pre-check:**
```bash
# Verify the writing skill has a rationalizations table
grep -qi "rationali[sz]ation" osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md \
  && echo "PASS: rationalization section present in writing skill" \
  || { echo "FAIL: no rationalization section in writing skill"; exit 1; }

# Count rationalization entries (expect at least 4 from design)
count=$(grep -ci "I'll\|I know\|probably\|skip\|obvious" \
  osprey-rules-plugin/skills/writing-osprey-rules/SKILL.md)
if [ "$count" -ge 4 ]; then
  echo "PASS: at least 4 rationalization counters ($count matches)"
else
  echo "WARN: only $count rationalization-related terms (expected >= 4)"
fi
```

**Subagent verification (Phase 7, Task 3 — REFACTOR):**
1. Compile all rationalizations observed during RED and GREEN phases
2. Verify each has an explicit counter in the relevant skill file
3. Re-run pressure scenarios with skills loaded
4. **Pass criterion:** Agent resists all previously observed rationalizations

---

## Verification Execution Order

Run structural checks first (fast, deterministic), then subagent tests (slow, interactive).

### Pass 1: Structural Verification (all phases)

Run after each phase completes. These are the "did you write the file correctly" checks.

| Phase | ACs verified structurally |
|-------|--------------------------|
| 1 | None (scaffold only — verify directory structure) |
| 2 | AC1.1, AC1.2, AC1.3, AC1.4 (partial) |
| 3 | AC2.2, AC2.4 (partial), AC2.5, AC2.6, AC2.7 (partial) |
| 4 | AC3.1, AC3.2, AC3.3, AC3.4, AC3.5 (partial) |
| 5 | AC4.1, AC4.2, AC4.3, AC4.4 |
| 6 | AC5.1 (partial), AC5.2, AC5.3, AC5.4 |

### Pass 2: Subagent Pressure Testing (Phase 7)

Run after all phases complete. These verify _behavioural_ outcomes.

| Task | ACs verified | Method |
|------|-------------|--------|
| RED (Task 1) | AC6.2, AC2.1 (negative) | 4 scenarios without skills |
| GREEN (Task 2) | AC6.1, AC2.1, AC2.3, AC2.4, AC2.7, AC3.5, AC4.1-4.3 | 4 scenarios with skills |
| REFACTOR (Task 3) | AC6.3 | Rationalization blocking |

### Pass 3: Manual / Human Verification

Items that resist both structural and subagent automation.

| AC | What to verify | Why it can't be automated |
|----|---------------|--------------------------|
| AC1.4 | Convention accuracy vs source CLAUDE.md | Semantic accuracy, not pattern matching |
| AC1.5 | Skill trigger selectivity | Depends on Claude Code skill-matching internals |
| AC5.1 | Command end-to-end in live session | Requires installed plugin + real CLI |
