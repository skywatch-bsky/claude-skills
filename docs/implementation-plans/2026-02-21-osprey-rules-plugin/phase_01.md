# Osprey Rules Plugin Implementation Plan

**Goal:** Create a Claude Code plugin that teaches Claude how to write, edit, and validate Osprey SML moderation rules for atproto.

**Architecture:** A Claude Code plugin with three skills (writing, reference, debugging), one specialized agent, and one slash command. Skills use progressive disclosure. The agent delegates to skills at runtime. Validation wraps `osprey-cli push-rules --dry-run`.

**Tech Stack:** Claude Code plugin system (markdown-based skills, agents, commands), `osprey-cli` for validation.

**Scope:** 7 phases from original design (phases 1-7).

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase is infrastructure scaffolding. **Verifies: None** — operational verification only (plugin installs without errors).

---

## Phase Dependency Graph

```
Phase 1: Plugin Scaffolding (no deps)
  └─> Phase 2: SML Reference Skill (depends on Phase 1)
       └─> Phase 3: Writing Skill (depends on Phase 2)
            └─> Phase 6: Command (depends on Phase 3)
  └─> Phase 4: Debugging Skill (depends on Phase 1)
  └─> Phase 5: Agent (depends on Phases 2, 3, 4)
  └─> Phase 7: Integration Testing & TDD (depends on Phases 1-6)
```

Phases 2 and 4 can run in parallel after Phase 1. Phase 5 needs all three skills. Phase 7 needs everything.

---

## Phase 1: Plugin Scaffolding

**Goal:** Create the plugin directory structure with valid `plugin.json` and empty component directories.

<!-- START_TASK_1 -->
### Task 1: Create plugin directory structure and manifest

**Files:**
- Create: `osprey-rules-plugin/.claude-plugin/plugin.json`
- Create: `osprey-rules-plugin/skills/writing-osprey-rules/` (empty directory)
- Create: `osprey-rules-plugin/skills/osprey-sml-reference/` (empty directory)
- Create: `osprey-rules-plugin/skills/osprey-sml-reference/references/` (empty directory)
- Create: `osprey-rules-plugin/skills/debugging-osprey-rules/` (empty directory)
- Create: `osprey-rules-plugin/agents/` (empty directory)
- Create: `osprey-rules-plugin/commands/` (empty directory)

**Step 1: Create directory structure**

```bash
mkdir -p osprey-rules-plugin/.claude-plugin
mkdir -p osprey-rules-plugin/skills/writing-osprey-rules
mkdir -p osprey-rules-plugin/skills/osprey-sml-reference/references
mkdir -p osprey-rules-plugin/skills/debugging-osprey-rules
mkdir -p osprey-rules-plugin/agents
mkdir -p osprey-rules-plugin/commands
```

**Step 2: Create plugin.json**

Write `osprey-rules-plugin/.claude-plugin/plugin.json`:

```json
{
  "name": "osprey-rules-plugin",
  "description": "Teaches Claude Code how to write, edit, and validate Osprey SML moderation rules for atproto.",
  "version": "0.1.0",
  "author": {
    "name": "scarndp"
  },
  "keywords": [
    "osprey",
    "sml",
    "moderation",
    "atproto",
    "bluesky",
    "rules"
  ]
}
```

**Step 3: Verify plugin installs**

```bash
# Verify the directory structure is correct (run from the repo root):
find osprey-rules-plugin -type f -o -type d | sort
```

Expected output:
```
osprey-rules-plugin
osprey-rules-plugin/.claude-plugin
osprey-rules-plugin/.claude-plugin/plugin.json
osprey-rules-plugin/agents
osprey-rules-plugin/commands
osprey-rules-plugin/skills
osprey-rules-plugin/skills/debugging-osprey-rules
osprey-rules-plugin/skills/osprey-sml-reference
osprey-rules-plugin/skills/osprey-sml-reference/references
osprey-rules-plugin/skills/writing-osprey-rules
```

**Step 4: Commit**

```bash
git add osprey-rules-plugin/
git commit -m "chore: scaffold osprey-rules-plugin directory structure"
```
<!-- END_TASK_1 -->
