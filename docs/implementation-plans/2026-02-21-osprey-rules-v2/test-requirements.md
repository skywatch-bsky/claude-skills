# Osprey Rules v2 — Test Requirements

Maps each acceptance criterion from the design plan to a verification approach.
All verification is structural (file existence, content checks via grep/search)
because all deliverables are markdown files with no executable code.

Generated: 2026-02-21

---

## osprey-rules-v2.AC1: Orchestrator Dispatches Subagents

### AC1.1: Full pipeline dispatch sequence

- **Criterion:** Given "write a rule for X", orchestrator dispatches investigator -> planner -> impl -> reviewer in sequence
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Flow 1" section header
  - Grep for the dispatch sequence: "investigator", "planner", "impl", "reviewer" appearing in Flow 1 section
  - Grep for dispatch template references: `osprey-rule-investigator`, `osprey-rule-planner`, `osprey-rule-impl`, `osprey-rule-reviewer`
  - Verify Flow 1 steps are numbered sequentially (1 through 8)
- **Human verification:** Confirm the ordering makes logical sense (investigator before planner, planner before impl, impl before reviewer). Structural checks confirm presence but not semantic ordering within prose.

### AC1.2: Validate-only bypass

- **Criterion:** Given "validate my rules", orchestrator skips planner and impl, dispatches investigator -> reviewer directly
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Flow 2" section header
  - Grep Flow 2 section for "investigator" and "reviewer"
  - Grep the flow routing table row for "Flow 2" and confirm it contains "investigator" and "reviewer" but NOT "planner" or "impl"
  - Verify the routing table row for "validate" maps to Flow 2
- **Human verification:** None required. The routing table is structured enough that grep on the table row confirms the skip.

### AC1.3: Debug entry flow

- **Criterion:** Given "fix this validation error", orchestrator dispatches investigator -> debugger -> reviewer
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Flow 3" section header
  - Grep Flow 3 section for "investigator", "debugger", and "reviewer"
  - Grep the flow routing table row for "Flow 3" and confirm it contains "investigator", "debugger", "reviewer"
  - Verify the routing table row for "fix" or "debugging" maps to Flow 3
- **Human verification:** None required.

### AC1.4: Reference lookup without subagent dispatch

- **Criterion:** Given "what labeling patterns exist?", orchestrator loads `osprey-sml-reference` directly without dispatching subagents
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Flow 4" section header
  - Grep Flow 4 section for "osprey-sml-reference"
  - Grep Flow 4 section for "No subagent dispatch" or "None"
  - Grep the flow routing table row for "Flow 4" and confirm agents column says "None"
  - Verify Flow 4 is the only flow that loads `osprey-sml-reference`
- **Human verification:** None required.

### AC1.5: Ad-hoc review mode

- **Criterion:** Given "review this rule", orchestrator dispatches reviewer in ad-hoc mode
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Flow 5" section header
  - Grep Flow 5 section for "reviewer" and "ad-hoc"
  - Grep the flow routing table row for "Flow 5" and confirm it maps "review" to reviewer
  - Verify Flow 5 does NOT auto-dispatch debugger (grep for "ask" or "AskUserQuestion" in Flow 5)
- **Human verification:** None required.

### AC1.6: Full subagent output printing

- **Criterion:** Orchestrator prints full subagent output after every dispatch (no summarisation)
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "FULL response" or "full subagent output"
  - Grep for "Do NOT summarise" or "No summarisation"
  - Grep Critical Rules section for a rule about printing full output
- **Human verification:** The structural check confirms the instruction exists in the prompt. Whether the agent actually follows it at runtime cannot be verified structurally -- that requires live testing.

### AC1.7: Orchestrator never writes SML

- **Criterion:** Orchestrator never writes SML content to any file directly
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "NEVER write SML"
  - Grep Critical Rules section for the no-SML-writing constraint
  - Verify `allowed-tools` in frontmatter does NOT contain "Edit" or "Write" (only Read, Grep, Glob, Bash, Skill, AskUserQuestion, Task)
- **Human verification:** The `allowed-tools` check is the strongest structural verification. If Edit/Write are absent from allowed-tools, the agent physically cannot write files. This is definitive.

### AC1.8: Orchestrator never loads domain skills (except Flow 4)

- **Criterion:** Orchestrator never loads domain skills (except `osprey-sml-reference` for Flow 4)
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "NEVER load domain skills" with "except" and "osprey-sml-reference" and "Flow 4"
  - Grep Critical Rules for the no-domain-skills constraint
  - Verify the orchestrator prompt does NOT reference `planning-osprey-rules`, `authoring-osprey-rules`, `reviewing-osprey-rules`, or `fixing-osprey-rules` as skills to load (references in "Out of Scope" section describing what lives where are acceptable)
  - Verify Flow 4 is the only flow section that mentions loading `osprey-sml-reference`
- **Human verification:** None required. The negative grep (absence of skill-loading instructions outside Flow 4) is structurally verifiable.

---

## osprey-rules-v2.AC2: Domain-Specific Agents Exist

### AC2.1: Planner agent definition

- **Criterion:** `osprey-rule-planner` agent exists with AskUserQuestion in allowed-tools, sonnet model, and loads `planning-osprey-rules` skill
- **Verification type:** structural
- **Phase:** 1
- **Verification approach:**
  - Verify file exists: `plugins/osprey-rules/agents/osprey-rule-planner.md`
  - Grep frontmatter for `model: sonnet`
  - Grep frontmatter for `AskUserQuestion` in `allowed-tools`
  - Grep body for `planning-osprey-rules` (skill reference in Mandatory First Action)
- **Human verification:** None required.

### AC2.2: Impl agent definition

- **Criterion:** `osprey-rule-impl` agent exists with Edit/Write in allowed-tools, sonnet model, and loads `authoring-osprey-rules` skill
- **Verification type:** structural
- **Phase:** 1
- **Verification approach:**
  - Verify file exists: `plugins/osprey-rules/agents/osprey-rule-impl.md`
  - Grep frontmatter for `model: sonnet`
  - Grep frontmatter for `Edit` and `Write` in `allowed-tools`
  - Grep body for `authoring-osprey-rules` (skill reference in Mandatory First Action)
- **Human verification:** None required.

### AC2.3: Reviewer agent definition

- **Criterion:** `osprey-rule-reviewer` agent exists with Bash in allowed-tools (for osprey-cli), sonnet model, and loads `reviewing-osprey-rules` skill
- **Verification type:** structural
- **Phase:** 1
- **Verification approach:**
  - Verify file exists: `plugins/osprey-rules/agents/osprey-rule-reviewer.md`
  - Grep frontmatter for `model: sonnet`
  - Grep frontmatter for `Bash` in `allowed-tools`
  - Verify `allowed-tools` does NOT contain `Edit` or `Write` (read-only agent)
  - Grep body for `reviewing-osprey-rules` (skill reference in Mandatory First Action)
- **Human verification:** None required.

### AC2.4: Debugger agent definition

- **Criterion:** `osprey-rule-debugger` agent exists with Edit/Write in allowed-tools, sonnet model, and loads `fixing-osprey-rules` skill
- **Verification type:** structural
- **Phase:** 1
- **Verification approach:**
  - Verify file exists: `plugins/osprey-rules/agents/osprey-rule-debugger.md`
  - Grep frontmatter for `model: sonnet`
  - Grep frontmatter for `Edit` and `Write` in `allowed-tools`
  - Grep body for `fixing-osprey-rules` (skill reference in Mandatory First Action)
- **Human verification:** None required.

### AC2.5: Description format for auto-delegation

- **Criterion:** Each agent's description follows "Use when [triggers] -- [what it does]" format for auto-delegation
- **Verification type:** structural
- **Phase:** 1
- **Verification approach:**
  - Grep each of the four agent files for "Use when" in the `description` frontmatter field:
    - `osprey-rule-planner.md`
    - `osprey-rule-impl.md`
    - `osprey-rule-reviewer.md`
    - `osprey-rule-debugger.md`
- **Human verification:** Confirm the description text after "Use when" actually describes meaningful triggers and actions. Grep confirms the format pattern exists but not that the content is useful for delegation.

### AC2.6: No SML domain knowledge in agent prompts

- **Criterion:** No agent contains SML domain knowledge in its prompt (all knowledge lives in skills)
- **Verification type:** structural
- **Phase:** 1
- **Verification approach:**
  - **Positive check:** Grep each agent file for phrases indicating knowledge comes from skills: "from.*skill", "skill.*runtime", "load.*skill"
  - **Negative check:** Grep each agent file for SML construct literals that would indicate embedded domain knowledge: `when_all`, `WhenRules`, `EntityJson`, `JsonData`, `RegexMatch`, `IncrementWindow`, `LabelAdd`, `AtprotoLabel`. These should NOT appear in agent files.
  - Verify each agent's Mandatory First Action section instructs loading a skill before proceeding
- **Human verification:** The negative grep catches obvious SML constructs. However, domain knowledge could be embedded as prose descriptions without using literal SML keywords. A human should scan each agent prompt to confirm it contains only routing/coordination logic and constraints, not SML authoring guidance.

---

## osprey-rules-v2.AC3: Skills Restructured to Agent Boundaries

### AC3.1: Planning skill covers requirements gathering

- **Criterion:** `planning-osprey-rules` skill covers requirements gathering and rule spec output (from writing Steps 1-3)
- **Verification type:** structural
- **Phase:** 2
- **Verification approach:**
  - Verify file exists: `plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md`
  - Grep for frontmatter field `name: planning-osprey-rules`
  - Grep for key workflow sections: "Validate Input Context", "Understand the Target", "Produce Rule Specification"
  - Grep for required spec output fields: "Target behaviour", "Event type", "Signals", "Labels to apply", "Target entity"
  - Grep for investigator report dependency: "investigator report"
  - Grep for clarifying questions methodology: "clarifying questions"
- **Human verification:** None required. The section headers and key terms are specific enough to confirm content coverage.

### AC3.2: Authoring skill covers SML authoring without validation

- **Criterion:** `authoring-osprey-rules` skill covers SML authoring workflow (from writing Steps 4-7) with no validation or debugging steps
- **Verification type:** structural
- **Phase:** 2
- **Verification approach:**
  - Verify file exists: `plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md`
  - Grep for frontmatter field `name: authoring-osprey-rules`
  - Grep for key workflow sections: "Write Models", "Write Rules", "Wire Effects", "Wire into Execution Graph"
  - Grep for SML constructs covered: `EntityJson`, `WhenRules`, `Import`, `Require`
  - **Negative check:** Grep for validation/debugging terms that should NOT be present as workflow steps: verify the skill does NOT contain "osprey-cli push-rules" as a step to execute, "three-layer", or "error categories"
  - Confirm the skill tells the agent NOT to validate: grep for "NOT run validation" or "reviewer handles that"
- **Human verification:** None required.

### AC3.3: Reviewing skill defines three-layer verification

- **Criterion:** `reviewing-osprey-rules` skill defines three-layer verification (osprey-cli, proactive checks, convention review) with severity classification
- **Verification type:** structural
- **Phase:** 3
- **Verification approach:**
  - Verify file exists: `plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md`
  - Grep for frontmatter field `name: reviewing-osprey-rules`
  - Grep for "Layer 1" and "osprey-cli"
  - Grep for "Layer 2" and "Proactive Checks"
  - Grep for "Layer 3" and "Convention Review"
  - Grep for severity terms: "Critical", "Important", "Minor"
  - Grep for structured output format: "Critical Issues", "Important Issues", "Minor Issues", "Total"
  - Count `Layer [123]` occurrences (expect >= 6 for methodology + output format)
- **Human verification:** None required.

### AC3.4: Fixing skill contains error categories without proactive checks

- **Criterion:** `fixing-osprey-rules` skill contains error categories and fix patterns (from debugging skill) without proactive checks
- **Verification type:** structural
- **Phase:** 3
- **Verification approach:**
  - Verify file exists: `plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md`
  - Grep for frontmatter field `name: fixing-osprey-rules`
  - Grep for error categories: "Type Mismatch", "Import Cycle", "Undefined Variable", "Function Call Error", "Duplicate Definition", "Rule Constraint"
  - Grep for debugging workflow: "Debugging Workflow", "Quick Reference"
  - Count numbered sections (`^## [0-9]`) to verify 10 sections present
  - **Negative check:** Grep for proactive check terms that should NOT be present: "proactive check", "Layer 2", "convention review", "Layer 3". These belong in the reviewing skill.
- **Human verification:** None required.

### AC3.5: osprey-sml-reference remains multi-agent consumable

- **Criterion:** `osprey-sml-reference` remains consumable by planner, impl, and reviewer agents
- **Verification type:** structural
- **Phase:** 4
- **Verification approach:**
  - Verify file exists: `plugins/osprey-rules/skills/osprey-sml-reference/SKILL.md`
  - Verify file exists: `plugins/osprey-rules/skills/osprey-sml-reference/references/sml-conventions.md`
  - Grep `sml-conventions.md` for "Reviewer Checklist" section (new structured checklist for reviewer)
  - Count `CONV-` prefixed check IDs in `sml-conventions.md` (expect 23)
  - Verify existing prose sections preserved: grep for "Variable Naming", "Anti-Patterns", "Time Constants"
  - Grep `SKILL.md` for "Reviewer Checklist" mention in progressive disclosure section
  - Verify each consuming agent references `osprey-sml-reference` by name:
    - Grep `osprey-rule-planner.md` for `osprey-sml-reference`
    - Grep `osprey-rule-impl.md` for `osprey-sml-reference`
    - Grep `osprey-rule-reviewer.md` for `osprey-sml-reference` or `sml-conventions`
- **Human verification:** None required.

### AC3.6: No domain knowledge lost during restructuring

- **Criterion:** No domain knowledge from `writing-osprey-rules` or `debugging-osprey-rules` is lost during restructuring -- all content accounted for in new skills
- **Verification type:** structural
- **Phase:** 2 (writing skill) and 3 (debugging skill)
- **Verification approach:**

  **From writing-osprey-rules (verified in Phase 2):**
  - Planning skill contains requirements gathering concepts: "Validate Input Context", "Understand the Target", "Produce Rule Specification", "investigator report", "clarifying questions"
  - Authoring skill contains Steps 4-7 concepts: "Write Models", "Write Rules", "Wire Effects", "Wire into Execution Graph", `EntityJson`, `WhenRules`
  - Common mistakes distributed: `JsonData`/`EntityJson` confusion in authoring, `rules_all`/`rules_any` in authoring, `labels.yaml` check in planning, dead rules in authoring, type mixing in authoring
  - Rationalizations distributed: "validate later" in authoring, "label probably exists" in planning, "86400" in authoring, "investigator report looks fine" in planning

  **From debugging-osprey-rules (verified in Phase 3):**
  - Fixing skill contains Sections 1-10: "osprey-cli Error Output", "Type Mismatch", "Import Cycle", "Undefined Variable", "Function Call Error", "Duplicate Definition", "Rule Constraint", "Debugging Workflow", "Quick Reference", "End-to-End"
  - Reviewing skill contains Section 11 proactive checks: "Type mixing", "Hardcoded time", `rules_all=`, `JsonData` for entities, "Dead rules", `(?i)`
  - Reviewing skill contains severity classification: "Critical", "Important", "Minor", "PASS" with "zero"

- **Human verification:** The structural checks verify that key section headers and domain terms are present in the new skills. However, confirming that ALL content was migrated (not just section headers) requires a human to compare the old skills against the new ones line by line. This is the one criterion where structural checks are necessary but not sufficient. Justification: individual paragraphs of guidance could be dropped without changing section headers, and grep cannot detect missing paragraphs it doesn't know to search for.

### AC3.7: Old skills deleted after redistribution

- **Criterion:** Old skills (`writing-osprey-rules`, `debugging-osprey-rules`) are deleted after content is redistributed
- **Verification type:** structural
- **Phase:** 2 (writing deleted) and 3 (debugging deleted)
- **Verification approach:**
  - Verify directory does NOT exist: `plugins/osprey-rules/skills/writing-osprey-rules/`
  - Verify directory does NOT exist: `plugins/osprey-rules/skills/debugging-osprey-rules/`
  - Verify new skills still exist after deletion:
    - `plugins/osprey-rules/skills/planning-osprey-rules/SKILL.md`
    - `plugins/osprey-rules/skills/authoring-osprey-rules/SKILL.md`
    - `plugins/osprey-rules/skills/reviewing-osprey-rules/SKILL.md`
    - `plugins/osprey-rules/skills/fixing-osprey-rules/SKILL.md`
- **Human verification:** None required.

---

## osprey-rules-v2.AC4: Verification Is a Hard Gate

### AC4.1: Layer 1 -- osprey-cli validation

- **Criterion:** Reviewer runs `osprey-cli push-rules --dry-run` as Layer 1 -- any non-zero exit code is Critical severity
- **Verification type:** structural
- **Phase:** 3
- **Verification approach:**
  - Grep `reviewing-osprey-rules/SKILL.md` for "Layer 1" section
  - Grep for the command: `osprey-cli push-rules` and `--dry-run`
  - Grep for "Non-zero exit code" and "Critical"
  - Grep for the `uv run` invocation pattern
- **Human verification:** None required.

### AC4.2: Layer 2 -- proactive checks

- **Criterion:** Reviewer performs proactive checks as Layer 2 -- type mixing, hardcoded times, `rules_all=`, `JsonData` for entities, dead rules, `(?i)` regex
- **Verification type:** structural
- **Phase:** 3
- **Verification approach:**
  - Grep `reviewing-osprey-rules/SKILL.md` for "Layer 2" section
  - Grep for each specific check:
    - "Type mixing" or "when_all" (Check 2.1)
    - "Hardcoded time" or "86400" (Check 2.2)
    - `rules_all=` (Check 2.3)
    - `JsonData` and "entity" (Check 2.4)
    - "Dead rules" (Check 2.5)
    - `(?i)` (Check 2.6)
  - Count Check 2.N references (expect 6 checks: 2.1 through 2.6)
- **Human verification:** None required.

### AC4.3: Layer 3 -- convention review

- **Criterion:** Reviewer checks conventions as Layer 3 -- naming (PascalCase, Rule suffix), descriptions (f-strings), structure (no orphans), label existence in `config/labels.yaml`
- **Verification type:** structural
- **Phase:** 3
- **Verification approach:**
  - Grep `reviewing-osprey-rules/SKILL.md` for "Layer 3" section
  - Grep for each specific check:
    - "PascalCase" (Check 3.1)
    - "f-string" or `f'` (Check 3.2)
    - "orphan" or "Require" in index context (Check 3.3)
    - `labels.yaml` (Check 3.4)
  - Count Check 3.N references (expect 8 checks: 3.1 through 3.8)
- **Human verification:** None required.

### AC4.4: Structured output with severity sections

- **Criterion:** Reviewer output is structured with severity sections (Critical/Important/Minor) and total issue count
- **Verification type:** structural
- **Phase:** 3
- **Verification approach:**
  - Grep `reviewing-osprey-rules/SKILL.md` for "Output Format" section
  - Grep for severity section headers in the output template: "Critical Issues", "Important Issues", "Minor Issues"
  - Grep for total count format: "Total" with "Critical" and "Important" and "Minor"
  - Grep for "PASS" and "FAIL" result indicator
- **Human verification:** None required.

### AC4.5: PASS requires zero issues across ALL severities

- **Criterion:** PASS requires zero issues across ALL severity levels (Minor issues are not optional)
- **Verification type:** structural
- **Phase:** 3
- **Verification approach:**
  - Grep `reviewing-osprey-rules/SKILL.md` for "zero issues across ALL severity"
  - Grep for "Minor issues are NOT optional" or "Minor.*block"
  - Grep the Gate Definition section for the PASS definition
  - Grep Critical Rules for the zero-issues requirement
- **Human verification:** None required.

### AC4.6: Reviewer never modifies rule files

- **Criterion:** Reviewer never modifies rule files -- read-only analysis only
- **Verification type:** structural
- **Phase:** 1 (agent definition) and 3 (skill definition)
- **Verification approach:**
  - **Agent level:** Verify `osprey-rule-reviewer.md` frontmatter `allowed-tools` does NOT contain "Edit" or "Write"
  - **Skill level:** Grep `reviewing-osprey-rules/SKILL.md` for "NEVER modify" or "read-only"
  - **Skill level:** Grep Critical Rules section for read-only constraint
  - **Skill level:** Grep Rationalizations section for "I'll just fix this small thing" → blocked
- **Human verification:** The `allowed-tools` check is definitive at the agent level -- without Edit/Write tools, the agent physically cannot modify files. No human verification needed.

---

## osprey-rules-v2.AC5: Orchestrator Follows ed3d Dispatch Pattern

### AC5.1: Baseline capture before impl writes

- **Criterion:** Baseline capture runs before impl writes anything; baseline is reused across all review cycles
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Baseline Capture" section
  - Grep for "Before the implementor" or "before writing"
  - Grep for "baseline is captured ONCE" or "reused"
  - Grep for "never shifts"
  - Verify Flow 1 step ordering: baseline capture step number < impl dispatch step number
  - Verify Flow 3 has baseline capture before debugger dispatch
- **Human verification:** None required. The explicit "captured ONCE" and "never shifts" statements are unambiguous.

### AC5.2: Post-write diff against baseline

- **Criterion:** Post-write reviewer report is diffed against baseline -- only new issues block
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Baseline Diffing" section
  - Grep for "post-write" and "baseline"
  - Grep for the diffing categories: "pre-existing", "new", "resolved"
  - Grep for "only new issues" or "new.*block"
- **Human verification:** None required.

### AC5.3: Pre-existing issues reported but non-blocking

- **Criterion:** Pre-existing issues (in baseline) are reported to human but don't block the gate
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` Baseline Diffing section for "pre-existing"
  - Grep for "Report to user" or "report to human" alongside "do NOT block"
  - Grep for "do NOT send to debugger" regarding pre-existing issues
- **Human verification:** None required.

### AC5.4: Cross-file breakage is blocking

- **Criterion:** New issues in unmodified files (cross-file breakage) are treated as blocking
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Cross-file breakage" or "cross-file"
  - Grep for "unmodified files" alongside "blocking" or "your responsibility"
  - Grep for tracking which files were modified: "Track which files"
- **Human verification:** None required.

### AC5.5: Debugger receives only new issues

- **Criterion:** Review-fix loop dispatches debugger with only new issues, not pre-existing ones
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` Review-Fix Loop section for "ONLY the new issues"
  - Grep for "not pre-existing" in the debugger dispatch context
  - Grep the debugger dispatch template for "new_issues_only" or "NOT pre-existing"
  - Grep Critical Rules for "NEVER send pre-existing issues to the debugger"
- **Human verification:** None required.

### AC5.6: Loop exit conditions (zero issues or max 5 cycles)

- **Criterion:** Loop exits at zero new issues OR after max 5 cycles (escalate to human)
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Maximum 5" or "max 5"
  - Grep for "zero new issues" as exit condition
  - Grep for "escalate" and "human" as the max-cycle outcome
  - Grep Critical Rules for "NEVER exceed 5 review-fix cycles"
- **Human verification:** None required.

### AC5.7: Issue count increase flagging

- **Criterion:** If issue count increases between cycles, orchestrator flags this to the human
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Issue count tracking"
  - Grep for "count goes UP" or "increases"
  - Grep for "flag" in the context of count increase
- **Human verification:** None required.

### AC5.8: Silent issue disappearance flagging

- **Criterion:** Issues from prior cycles that silently disappear from reviewer output are flagged (silence != fixed)
- **Verification type:** structural
- **Phase:** 5
- **Verification approach:**
  - Grep `osprey-rule-writer.md` for "Issue persistence tracking"
  - Grep for "silently disappear" or "silence"
  - Grep for "silence" and "fixed" (the "silence != fixed" principle)
  - Grep Critical Rules for "NEVER assume silence = fixed"
- **Human verification:** None required.

---

## Cross-Cutting Verification

These checks span multiple acceptance criteria and verify architectural integrity
after all phases are complete.

### XC1: Plugin manifest reflects v2 architecture

- **Phase:** 6
- **Verification approach:**
  - Parse `plugin.json` and verify `version` is `0.2.0`
  - Verify `description` contains "orchestrator"
  - Verify `keywords` contains "orchestrator"

### XC2: CLAUDE.md documents all agents and skills

- **Phase:** 6
- **Verification approach:**
  - Grep `CLAUDE.md` for all five agents: `osprey-rule-writer`, `osprey-rule-planner`, `osprey-rule-impl`, `osprey-rule-reviewer`, `osprey-rule-debugger`
  - Grep for all four new skills: `planning-osprey-rules`, `authoring-osprey-rules`, `reviewing-osprey-rules`, `fixing-osprey-rules`
  - Grep for `osprey-sml-reference`
  - Verify old skill names are NOT referenced as current: `writing-osprey-rules`, `debugging-osprey-rules`
  - Grep for key sections: "Architecture", "Contracts", "Dependencies", "Key Decisions", "Skill Ownership", "Key Files", "Gotchas"

### XC3: Skill ownership table is consistent

- **Phase:** 6
- **Verification approach:**
  - Grep `CLAUDE.md` Skill Ownership table for each agent-skill mapping
  - Cross-reference against each agent's Mandatory First Action section to confirm the agent loads the skill listed in the ownership table
  - Verify `osprey-rule-writer` only lists `osprey-sml-reference` with "Flow 4 only" qualifier

### XC4: No orphaned file references

- **Phase:** 6
- **Verification approach:**
  - Verify every agent file listed in CLAUDE.md Key Files actually exists
  - Verify every skill directory listed in CLAUDE.md Key Files actually exists
  - Verify no agent references a skill that doesn't exist
  - Verify no deleted skills (`writing-osprey-rules`, `debugging-osprey-rules`) are referenced in active agent prompts

---

## Summary Matrix

| Criterion | Phase | Verification Type | Human Review Required |
|-----------|-------|-------------------|----------------------|
| AC1.1 | 5 | structural | Yes (semantic ordering) |
| AC1.2 | 5 | structural | No |
| AC1.3 | 5 | structural | No |
| AC1.4 | 5 | structural | No |
| AC1.5 | 5 | structural | No |
| AC1.6 | 5 | structural | Yes (runtime behaviour) |
| AC1.7 | 5 | structural | No |
| AC1.8 | 5 | structural | No |
| AC2.1 | 1 | structural | No |
| AC2.2 | 1 | structural | No |
| AC2.3 | 1 | structural | No |
| AC2.4 | 1 | structural | No |
| AC2.5 | 1 | structural | Yes (description quality) |
| AC2.6 | 1 | structural | Yes (prose domain knowledge) |
| AC3.1 | 2 | structural | No |
| AC3.2 | 2 | structural | No |
| AC3.3 | 3 | structural | No |
| AC3.4 | 3 | structural | No |
| AC3.5 | 4 | structural | No |
| AC3.6 | 2, 3 | structural | Yes (full content migration) |
| AC3.7 | 2, 3 | structural | No |
| AC4.1 | 3 | structural | No |
| AC4.2 | 3 | structural | No |
| AC4.3 | 3 | structural | No |
| AC4.4 | 3 | structural | No |
| AC4.5 | 3 | structural | No |
| AC4.6 | 1, 3 | structural | No |
| AC5.1 | 5 | structural | No |
| AC5.2 | 5 | structural | No |
| AC5.3 | 5 | structural | No |
| AC5.4 | 5 | structural | No |
| AC5.5 | 5 | structural | No |
| AC5.6 | 5 | structural | No |
| AC5.7 | 5 | structural | No |
| AC5.8 | 5 | structural | No |

**Total criteria:** 34
**Fully structural:** 29 (85%)
**Requires human verification:** 5 (15%)

Human verification is required where:
- **AC1.1:** Semantic ordering of dispatch sequence in prose (structural checks confirm presence but not order within paragraphs)
- **AC1.6:** Runtime agent behaviour cannot be verified from prompt text alone
- **AC2.5:** Description quality for auto-delegation requires judgement beyond format pattern matching
- **AC2.6:** Domain knowledge could be embedded as prose without using literal SML keywords
- **AC3.6:** Full content migration completeness cannot be verified by spot-checking key terms alone
