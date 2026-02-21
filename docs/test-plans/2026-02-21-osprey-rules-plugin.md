# Human Test Plan: Osprey Rules Plugin

## Prerequisites

- Plugin installed in a Claude Code session: `/plugin install file:///Users/scarndp/dev/claude-dotfiles/osprey-rules-plugin`
- `osprey-cli` installed and on PATH (`osprey-cli --help` returns successfully)
- A valid Osprey rules project with `main.sml`, `config/`, `models/`, `rules/` directories
- All structural tests passing (22/22 AC criteria verified)

## Phase 1: Skill Trigger Selectivity (AC1.5)

| Step | Action | Expected |
|------|--------|----------|
| 1 | In Claude Code session with plugin, type: "Write a Python function to sort a list" | The `osprey-sml-reference` skill does NOT load. Response is generic Python help. |
| 2 | Type: "Help me with my React component" | The `osprey-sml-reference` skill does NOT load. Response is generic React help. |
| 3 | Type: "What is the AT Protocol?" | The `osprey-sml-reference` skill does NOT load. Response is general AT Protocol information without SML specifics. |
| 4 | Type: "What SML types are available?" | The `osprey-sml-reference` skill loads. Response includes `EntityJson`, `JsonData`, `Entity`, `Optional`. |
| 5 | Type: "How do I write a labeling pattern in Osprey?" | The `osprey-sml-reference` or `writing-osprey-rules` skill loads. Response references labeling patterns from the plugin. |

## Phase 2: Convention Accuracy (AC1.4)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `osprey-rules-plugin/skills/osprey-sml-reference/references/sml-conventions.md` side-by-side with the source Osprey project's `CLAUDE.md` | Files are accessible and comparable |
| 2 | Compare "Variable Naming" section against source | PascalCase convention, underscore prefix for internal variables, Rule suffix -- all match source |
| 3 | Compare "Time Constants" section against source | Constants list (`Second`, `Minute`, `FiveMinute`, `TenMinute`, `ThirtyMinute`, `Hour`, `Day`, `Week`) match source with correct values |
| 4 | Verify no conventions are omitted from source | All SML conventions in source CLAUDE.md have corresponding sections in conventions file |
| 5 | Verify no conventions contradict source | No rules in conventions file that disagree with source material |
| 6 | Verify code examples are syntactically plausible SML | Code blocks use correct syntax: `Rule(when_all=[...])`, `RegexMatch(pattern=, target=)`, `IncrementWindow(key=, window_seconds=, when_all=)` |

## Phase 3: Rule Writing End-to-End (AC2.1, AC2.3, AC2.4, AC2.7)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Dispatch `osprey-rule-writer` agent with prompt: "Write a rule to detect spam posts" -- do NOT provide the project path | Agent asks for the rules project path using `AskUserQuestion` before proceeding |
| 2 | Provide the project path when asked | Agent reads `config/labels.yaml`, reads `models/` directory, and prints a summary of available labels and models |
| 3 | Provide clarifying answers when agent asks about signal type, label name, etc. | Agent confirms the label exists in `config/labels.yaml` before writing |
| 4 | Let agent complete rule writing | Rule file is placed in correct directory (e.g., `rules/record/post/`) and uses `EntityJson` for entity IDs (not `JsonData`) |
| 5 | Check that agent updated the appropriate `index.sml` | A `Require(rule='...')` entry exists for the new rule file |
| 6 | Verify agent runs `osprey-cli push-rules <path> --dry-run` | Validation command is executed; exit code 0 |
| 7 | Check generated rule does not hardcode labels | All label names in `LabelAdd`/`AtprotoLabel` effects exist in `config/labels.yaml` |

## Phase 4: Debugging Skill Behaviour (AC3.1-AC3.5)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Create a deliberately broken SML file with a type mismatch: `Rule(when_all=[SomeRule, PostText != ''])` | File saved in rules project |
| 2 | Run `osprey-cli push-rules <path> --dry-run` and copy the error | Error shows `incompatible types in assignment` or similar |
| 3 | Dispatch agent with: "Fix this validation error: [paste error]" | Agent loads `debugging-osprey-rules` skill; identifies type mismatch; suggests wrapping bool in `Rule()` or separating types |
| 4 | Create a file with an import cycle (A imports B, B imports A) | Two files with circular imports |
| 5 | Dispatch agent with the resulting error | Agent identifies import cycle; suggests extracting shared code to a third file |
| 6 | Create a file with an undefined variable (missing import) | File references variable not imported |
| 7 | Dispatch agent with the resulting error | Agent identifies missing import; suggests adding `Import(rules=[...])` |
| 8 | Create a file with 3+ simultaneous errors | File with multiple independent errors |
| 9 | Dispatch agent with the multi-error output | Agent fixes first error, re-validates, then addresses remaining errors one at a time (not all at once) |

## Phase 5: Validation Command (AC5.1-AC5.4)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Run `/osprey-validate /path/to/valid/rules/project` | Command runs `osprey-cli push-rules /path --dry-run`; reports "Validation successful!" |
| 2 | Run `/osprey-validate` (no argument) | Command asks for the path using `AskUserQuestion` |
| 3 | Temporarily rename `osprey-cli` or use a session without it on PATH, then run `/osprey-validate /path` | Command reports "`osprey-cli` is not installed" with `uv pip install` / `pip install` instructions |
| 4 | Run `/osprey-validate /path/to/broken/rules/project` (a project with known validation errors) | Command shows FULL error output from osprey-cli; errors are NOT summarized or truncated |

## End-to-End: RED-GREEN-REFACTOR (AC6.1, AC6.2, AC6.3)

### RED Phase (baseline without skills)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Dispatch a subagent WITHOUT the plugin skills, prompt: "Write an Osprey SML rule to detect new accounts posting spam" | Agent attempts to write rules without domain knowledge |
| 2 | Record: Did the agent ask for the project path? | Expected: No (no skill instructs it to) |
| 3 | Record: Did the agent use `EntityJson` for entity IDs? | Expected: Likely used `JsonData` or raw strings |
| 4 | Record: Did the agent run validation? | Expected: Likely skipped validation |
| 5 | Run `osprey-cli push-rules <path> --dry-run` on the output | Expected: Validation fails; document specific errors |
| 6 | Repeat with 3 more scenarios: debugging errors, looking up patterns, reviewing a rule | Document all failures observed |

### GREEN Phase (with skills)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Dispatch `osprey-rule-writer` agent WITH skills, same prompt as RED Step 1 | Agent loads `writing-osprey-rules`, follows full workflow |
| 2 | Record: Did the agent ask for the project path? | Expected: Yes |
| 3 | Record: Did the agent use `EntityJson` for entity IDs? | Expected: Yes |
| 4 | Record: Did the agent run validation? | Expected: Yes |
| 5 | Run `osprey-cli push-rules <path> --dry-run` independently on the output | Expected: Exit code 0 |
| 6 | Compare RED vs GREEN results | Expected: Measurably fewer failures in GREEN; all RED failure types prevented |

### REFACTOR Phase (rationalization hardening)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Compile all rationalizations observed during RED phase | List of observed rationalizations |
| 2 | Verify each rationalization has a counter in `writing-osprey-rules/SKILL.md` Section 11 | Every observed rationalization has a matching table row |
| 3 | Re-dispatch agent with a prompt designed to trigger a specific rationalization (e.g., "Just write the rule quickly, don't worry about validation") | Agent resists rationalization and follows full workflow anyway |
| 4 | Repeat step 3 for each observed rationalization | Agent blocks all previously observed rationalizations |

## Human Verification Required

| Criterion | Why Manual | Steps |
|-----------|------------|-------|
| AC1.4 | Semantic accuracy of conventions vs source CLAUDE.md cannot be pattern-matched | Side-by-side diff of `sml-conventions.md` against source Osprey project CLAUDE.md |
| AC1.5 | Skill trigger selectivity depends on Claude Code's internal skill-matching system | Test 5 prompts in a live session: 3 unrelated (should NOT trigger) and 2 related (should trigger) |
| AC5.1 (e2e) | The command file contains the right instructions, but whether it actually works requires a live session | Install plugin, run `/osprey-validate <path>`, confirm `osprey-cli push-rules --dry-run` actually executes |
| AC2.1, AC2.3 | Whether the agent actually asks for the path and generates correctly structured rules | Dispatch agent without path, observe AskUserQuestion |
| AC6.1, AC6.2 | Gold-standard integration tests requiring live subagent dispatch | Full RED-GREEN comparison as documented above |

## Traceability

| Acceptance Criterion | Automated | Manual Step |
|----------------------|-----------|-------------|
| AC1.1 | Grep for 4 core types + code blocks | -- |
| AC1.2 | Extract links, `test -f` each | -- |
| AC1.3 | Count 24 h3 headings + 24 code blocks | -- |
| AC1.4 | Grep 5 convention topics + count >= 9 sections | Phase 2 |
| AC1.5 | Grep "Use when" prefix in frontmatter | Phase 1 |
| AC2.1 | Grep `AskUserQuestion` | Phase 3 Step 1 |
| AC2.2 | Grep `config/labels.yaml` + `models/` | Phase 3 Step 2 |
| AC2.3 | -- | Phase 3 Steps 4-5 |
| AC2.4 | Grep `CRITICAL` + `EntityJson` | Phase 3 Step 4 |
| AC2.5 | Count `osprey-sml-reference` references | -- |
| AC2.6 | Grep `osprey-cli push-rules` + `--dry-run` | Phase 3 Step 6 |
| AC2.7 | Grep hardcoding warning | Phase 3 Step 7 |
| AC3.1 | Grep type mismatch section | Phase 4 Steps 2-3 |
| AC3.2 | Grep import cycle section | Phase 4 Steps 4-5 |
| AC3.3 | Grep undefined variable section | Phase 4 Steps 6-7 |
| AC3.4 | Grep re-validation mandate (6 matches) | Phase 4 Step 9 |
| AC3.5 | Grep multi-error handling | Phase 4 Steps 8-9 |
| AC4.1 | Grep routing table | Phase 3 Step 4 |
| AC4.2 | Grep routing table | Phase 4 Step 3 |
| AC4.3 | Grep routing table | -- |
| AC4.4 | 0 SML terms + 52 lines | -- |
| AC5.1 | Grep `push-rules` + `--dry-run` | Phase 5 Step 1 |
| AC5.2 | Grep `ARGUMENTS` + `AskUserQuestion` | Phase 5 Step 2 |
| AC5.3 | Grep install error + instructions | Phase 5 Step 3 |
| AC5.4 | Grep "FULL error output" | Phase 5 Step 4 |
| AC6.1 | -- | E2E GREEN Phase |
| AC6.2 | -- | E2E RED vs GREEN |
| AC6.3 | Grep rationalization counters | E2E REFACTOR Phase |
