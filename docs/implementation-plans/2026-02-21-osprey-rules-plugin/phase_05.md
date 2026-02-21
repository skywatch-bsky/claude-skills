# Osprey Rules Plugin Implementation Plan — Phase 5

**Goal:** Create the specialized osprey-rule-writer subagent that delegates to skills based on task type.

**Architecture:** A Claude Code agent file (`agents/osprey-rule-writer.md`) with frontmatter declaring tools and a prompt body with task routing instructions. Agent loads skills at runtime — does NOT bake skill content into its prompt.

**Tech Stack:** Claude Code agent system (markdown with YAML frontmatter).

**Scope:** 7 phases from original design (phases 1-7).

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase implements and tests:

### osprey-rules-plugin.AC4: Agent correctly delegates to skills
- **osprey-rules-plugin.AC4.1 Success:** Agent loads `writing-osprey-rules` for "write a rule" tasks
- **osprey-rules-plugin.AC4.2 Success:** Agent loads `debugging-osprey-rules` for "fix this error" tasks
- **osprey-rules-plugin.AC4.3 Success:** Agent loads `osprey-sml-reference` for "what patterns exist" tasks
- **osprey-rules-plugin.AC4.4 Failure:** Agent does not bake skill content into its own prompt

---

## Phase 5: Agent

**Goal:** Create the specialized subagent for delegated rule work.

<!-- START_TASK_1 -->
### Task 1: Create osprey-rule-writer agent

**Verifies:** osprey-rules-plugin.AC4.1, osprey-rules-plugin.AC4.2, osprey-rules-plugin.AC4.3, osprey-rules-plugin.AC4.4

**Files:**
- Create: `osprey-rules-plugin/agents/osprey-rule-writer.md`

**Implementation:**

Create the agent file following established patterns (see `~/.claude/plugins/cache/ed3d-plugins/ed3d-plan-and-execute/1.10.2/agents/task-implementor-fast.md` for format reference).

The agent file must contain:

1. **Frontmatter:**
   ```yaml
   ---
   name: osprey-rule-writer
   description: >-
     Use this agent when working with Osprey SML moderation rules for atproto.
     Handles writing new rules, editing existing rules, debugging validation errors,
     and looking up SML syntax or labeling patterns.
     Examples: "write a rule for X", "fix this validation error",
     "what labeling patterns exist", "review this rule".
   color: purple
   allowed-tools: [Read, Edit, Write, Grep, Glob, Bash, Skill, AskUserQuestion]
   ---
   ```

   **Important:** No `model:` field — inherit from parent. The `allowed-tools` field declares the tools the agent can use — this must include `Skill` (for loading skills) and `AskUserQuestion` (used by the writing skill for project discovery). The description must be detailed enough for auto-delegation to work (AC4.1-4.3) but must NOT contain SML reference content (AC4.4).

2. **Identity section:**
   ```
   You are an Osprey Rule Writer — a specialized agent for working with Osprey SML
   moderation rules for the AT Protocol (Bluesky). You create, edit, debug, and
   review SML rules. You do NOT contain domain knowledge in this prompt — you load
   it from skills at runtime.
   ```

3. **Mandatory First Action** section:
   - Before any work, determine the task type and load the appropriate skill(s) using the Skill tool
   - This is the core of AC4.1-4.3

4. **Task Routing Table:**

   | User intent | Skill to load | Actions |
   |-------------|---------------|---------|
   | "Write a rule for X" / creating new rules | `writing-osprey-rules` | Discover project, read models, write rule + effects, validate |
   | "Fix this validation error" / debugging | `debugging-osprey-rules` | Parse error output, identify cause, fix, re-validate |
   | "What labeling patterns exist?" / reference lookup | `osprey-sml-reference` | Read references, present options |
   | "Review this rule" / code review | `osprey-sml-reference` | Read conventions, check rule against them, report issues |

5. **Critical Rules:**
   - **NEVER write SML code without loading a skill first.** Your prompt does not contain SML knowledge.
   - **ALWAYS validate after writing or modifying rules.** Run `osprey-cli push-rules <path> --dry-run`.
   - **If validation fails, load `debugging-osprey-rules`** to diagnose and fix.
   - **Do NOT hardcode label names.** Read `config/labels.yaml` from the user's project.

6. **What this agent does NOT contain:**
   - SML type system reference (load `osprey-sml-reference`)
   - Labeling pattern templates (load `osprey-sml-reference`)
   - Naming conventions (load `osprey-sml-reference`)
   - Error diagnosis patterns (load `debugging-osprey-rules`)
   - Project discovery workflow (load `writing-osprey-rules`)

**Key constraint (AC4.4):** The agent prompt must be SHORT — just routing logic. All domain knowledge lives in skills. If you find yourself putting SML syntax, type system details, or error patterns into the agent file, you're violating AC4.4. The agent file should be ~50-80 lines total, not hundreds.

**Verification:**

Verify the file exists and has correct frontmatter:
```bash
head -8 osprey-rules-plugin/agents/osprey-rule-writer.md
```
Expected: YAML frontmatter with `name: osprey-rule-writer` and multi-line `description`.

Verify it does NOT contain reference-level SML content (AC4.4).
Brief mentions of SML terms in the routing table descriptions (e.g., "write rule + effects") are acceptable — the check is for detailed syntax documentation, code examples, or type system explanations:
```bash
grep -c "EntityJson\|JsonData\|when_all\|IncrementWindow" osprey-rules-plugin/agents/osprey-rule-writer.md
```
Expected: `0` (agent should not contain SML syntax reference).

Verify it references skills by name:
```bash
grep -c "writing-osprey-rules\|debugging-osprey-rules\|osprey-sml-reference" osprey-rules-plugin/agents/osprey-rule-writer.md
```
Expected: At least 6 (each skill mentioned in routing table + critical rules).

**Commit:** `feat(osprey-rules-plugin): add osprey-rule-writer agent`
<!-- END_TASK_1 -->
