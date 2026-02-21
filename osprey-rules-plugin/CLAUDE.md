# Osprey Rules Plugin

Last verified: 2026-02-21

## Purpose

Teaches Claude Code how to write, edit, debug, and validate Osprey SML moderation
rules for the AT Protocol (Bluesky). Packages domain expertise as a Claude Code
plugin so any session can gain SML fluency on demand.

## Contracts

- **Exposes**:
  - Agent: `osprey-rule-writer` -- entry point for all Osprey rule tasks
  - Command: `/osprey-validate [path]` -- runs `uv run osprey-cli push-rules --dry-run`
  - Skills: `writing-osprey-rules`, `osprey-sml-reference`, `debugging-osprey-rules`
- **Guarantees**:
  - Agent delegates ALL SML knowledge to skills (contains no domain knowledge itself)
  - Skills chain: writing -> reference (for syntax), writing -> debugging (on failure)
  - Validation is mandatory after every rule write or edit (never skipped)
  - Labels must exist in `config/labels.yaml` before use in effects
- **Expects**:
  - Access to `osprey-for-atproto` repo (inferred from rules path, or user-provided path/git URL)
  - `uv` installed for running `uv run osprey-cli` and `uv sync`
  - A valid Osprey rules project with `main.sml`, `config/`, `models/`, `rules/`
  - User provides project path on first invocation

## Dependencies

- **Uses**: `osprey-cli` via `uv run` from `osprey-for-atproto` repo (validation via `push-rules --dry-run`)
- **Used by**: Any Claude Code session with this plugin installed
- **Boundary**: Plugin is self-contained; skills reference each other but nothing external

## Key Decisions

- Agent is a thin router, not a knowledge container: prevents staleness, forces
  skill loading so domain knowledge lives in one place
- Three skills split by concern: writing (workflow), reference (syntax/patterns),
  debugging (error diagnosis) -- avoids a single monolithic skill
- `osprey-sml-reference` uses progressive disclosure: core types in SKILL.md,
  detailed patterns in `references/` subdirectory files

## Invariants

- `Rule()` objects must be stored in non-underscore-prefixed variables
- `when_all` lists must contain homogeneous types (all `bool` or all `RuleT`)
- `EntityJson` for label targets, `JsonData` for primitives only
- Time durations use named constants (`Day`, `Hour`) not raw integers
- `WhenRules` uses `rules_any=`, never `rules_all=`

## Key Files

- `.claude-plugin/plugin.json` -- plugin manifest (name, version, metadata)
- `agents/osprey-rule-writer.md` -- agent definition with task routing table
- `commands/osprey-validate.md` -- validation command definition
- `skills/writing-osprey-rules/SKILL.md` -- full rule authoring workflow
- `skills/osprey-sml-reference/SKILL.md` -- SML type system and constructs
- `skills/osprey-sml-reference/references/` -- labeling patterns, naming conventions
- `skills/debugging-osprey-rules/SKILL.md` -- error categories and fix patterns

## Gotchas

- `osprey-cli` is NOT on PATH; must be invoked via `uv run` from within `osprey-for-atproto`
- `osprey-cli` validation catches syntax errors but NOT all logic/convention
  violations; proactive checks (Section 11 of debugging skill) are required
- `_` prefixed variables are file-local in SML; they cannot be imported cross-file
- Skills are not user-invocable (`user-invocable: false`); they load via agent routing
