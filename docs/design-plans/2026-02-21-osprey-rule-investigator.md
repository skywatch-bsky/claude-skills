# Osprey Rule Investigator Design

## Summary

The Osprey Rule Investigator is a new Claude Code plugin that performs structured, read-only analysis of an Osprey SML rules project and reports everything a rule-writing agent needs to know: what labels exist, what models define which features, how the execution graph is wired, and what UDFs are available to call. This separates project intelligence gathering from rule authoring — the investigator is a cheap, fast haiku-model subagent that reads files and produces a structured text report, so the rule-writing agent can skip the tedious discovery work and get directly to writing.

The approach follows the established `codebase-investigator` pattern: a thin agent with a single required skill, no file writes, and read-only tool access. UDF discovery is dynamic-first (reads Python source from the `osprey-for-atproto` repo at runtime) with a static fallback if that repo is inaccessible. The existing `osprey-rule-writer` agent is updated to spawn the investigator as a subagent and use its output as project context, replacing the manual project-state reading that currently lives in Step 2 of the `writing-osprey-rules` skill.

## Definition of Done

1. A new `osprey-rule-investigator` plugin exists as a sibling to `osprey-rules` in this repo, containing an agent and skill that can systematically investigate an Osprey SML rules project — discovering available UDFs (dynamically from Python source with static fallback), mapping the full execution graph, and cataloguing rules, models, labels, and effects.

2. The osprey-rule-writer agent in the osprey-rules plugin knows how to invoke this new agent as a subagent for project investigation.

3. The writing-osprey-rules skill's Step 2 (Read Project State) is replaced with a delegation to the investigator agent, while Step 1 (path discovery + structure validation) remains.

## Acceptance Criteria

### osprey-rule-investigator.AC1: Project Structure Investigation
- **osprey-rule-investigator.AC1.1 Success:** Given a valid rules project path, investigator lists all `.sml` files with their locations
- **osprey-rule-investigator.AC1.2 Success:** Investigator reads `config/labels.yaml` and produces a table of label names, valid entity types, and connotations
- **osprey-rule-investigator.AC1.3 Success:** Investigator lists model files and the key variables each defines (entities, primitives, time constants)
- **osprey-rule-investigator.AC1.4 Failure:** Given an invalid project path (missing `main.sml`), investigator reports specifically what's missing
- **osprey-rule-investigator.AC1.5 Failure:** Given a path with partial structure (e.g. missing `models/`), investigator reports which directories/files are present and which are absent

### osprey-rule-investigator.AC2: UDF Discovery
- **osprey-rule-investigator.AC2.1 Success:** Given osprey-for-atproto repo path, investigator reads `register_plugins.py` and extracts UDF class names from `register_udfs()`
- **osprey-rule-investigator.AC2.2 Success:** For each UDF, investigator locates class implementation and extracts parameter names, types, defaults, and return type into a signature table
- **osprey-rule-investigator.AC2.3 Success:** When osprey-for-atproto path is inaccessible, investigator falls back to static `references/udf-signatures.md` with a staleness caveat
- **osprey-rule-investigator.AC2.4 Success:** Report indicates whether dynamic or static discovery was used (confidence level)
- **osprey-rule-investigator.AC2.5 Failure:** Given a path that doesn't contain `register_plugins.py`, investigator falls back to static reference rather than erroring

### osprey-rule-investigator.AC3: Execution Graph Mapping
- **osprey-rule-investigator.AC3.1 Success:** Investigator traces from `main.sml` through all `Import` and `Require` statements
- **osprey-rule-investigator.AC3.2 Success:** For each rule file, investigator catalogues `Rule()` definitions with their `when_all` conditions
- **osprey-rule-investigator.AC3.3 Success:** For each `WhenRules()`, investigator catalogues which rules trigger it and what effects fire
- **osprey-rule-investigator.AC3.4 Success:** Investigator produces a rule → conditions → effect → label summary
- **osprey-rule-investigator.AC3.5 Success:** Conditional requires (e.g. `require_if=IsOperation`) are noted in the graph mapping

### osprey-rule-investigator.AC4: Integration with osprey-rules
- **osprey-rule-investigator.AC4.1 Success:** osprey-rule-writer agent has `Task` in its allowed-tools and can spawn the investigator as a subagent
- **osprey-rule-investigator.AC4.2 Success:** writing-osprey-rules Step 2 delegates to investigator agent via Task tool, using the investigator's report as project context
- **osprey-rule-investigator.AC4.3 Success:** writing-osprey-rules Step 1 asks for osprey-for-atproto repo path alongside the rules project path
- **osprey-rule-investigator.AC4.4 Success:** osprey-rules CLAUDE.md documents dependency on osprey-rule-investigator plugin

### osprey-rule-investigator.AC5: Output Constraints
- **osprey-rule-investigator.AC5.1 Success:** Investigator returns findings as text-only response (no file writes)
- **osprey-rule-investigator.AC5.2 Success:** All findings include exact file paths and line numbers
- **osprey-rule-investigator.AC5.3 Success:** Report is structured with clear sections for each investigation area

## Glossary

- **Osprey**: The moderation rules engine used internally. Evaluates SML rule files against incoming AT Protocol events and emits labeling decisions.
- **SML (Osprey's rule language)**: A domain-specific declarative language for writing moderation rules. Not Standard ML — Osprey's own format using constructs like `Rule()`, `WhenRules()`, `Import()`, and `Require()`.
- **osprey-for-atproto**: The external repository containing the Osprey engine, `osprey-cli`, and UDF implementations. Separate from this claude-skills repo.
- **osprey-cli**: The CLI tool from the `osprey-for-atproto` repo used to validate and push rule sets. Must be invoked via `uv run`, not directly.
- **UDF (User-Defined Function)**: Custom callable functions available in SML rules (e.g. `ContainsAnyPattern`). Implemented as Python classes in `osprey-for-atproto/udfs/`. The investigator extracts their signatures from source.
- **`register_plugins.py`**: File in `osprey-for-atproto` that registers all active UDF classes via `register_udfs()`. Used as the entry point for dynamic UDF discovery.
- **`ArgumentsClass`**: Python inner class on each UDF that declares parameter names, types, and defaults. The investigator reads these to build the signature table.
- **Execution graph**: The dependency graph of SML files produced by following `Import()` and `Require()` statements from `main.sml`. Determines which rules are evaluated for a given event.
- **`Rule()`**: SML construct that defines a named boolean condition (a detection rule) from a `when_all` list of sub-conditions.
- **`WhenRules()`**: SML construct that fires effects (labels, verdicts) when one or more `Rule()` definitions match.
- **`Import()` / `Require()`**: SML file-loading constructs. `Import` makes variables available in scope; `Require` loads a rule file into the execution graph. `Require` supports conditional loading via `require_if=`.
- **`LabelAdd` / `LabelRemove` / `AtprotoLabel`**: SML effect types. `LabelAdd`/`LabelRemove` operate on internal Osprey labels; `AtprotoLabel` emits to Bluesky's Ozone moderation service.
- **`EntityJson` / `JsonData`**: SML model primitives. `EntityJson` defines a typed entity that labels can attach to; `JsonData` extracts primitive values. Using the wrong one causes validation failures.
- **`config/labels.yaml`**: Project-level configuration file declaring all valid label names, their target entity types, and connotations. Only labels defined here can be used in effects.
- **`models/label_guards.sml`**: Convention file that pre-computes `HasAtprotoLabel` checks to prevent re-labeling an already-labeled entity.
- **haiku model**: Refers to Claude Haiku — the fast, low-cost Claude model used for the investigator agent since it only reads and reports, never reasons about complex authoring decisions.
- **subagent**: An agent spawned by another agent using the `Task` tool to perform a focused subtask. The investigator runs as a subagent of `osprey-rule-writer`.
- **`codebase-investigator` pattern**: Established plugin pattern (from `ed3d-research-agents`) for read-only analysis agents: thin agent definition, single required skill as methodology document, haiku model, text-only output.
- **static fallback / dynamic discovery**: The two UDF discovery modes. Dynamic reads live Python source; static reads a checked-in `references/udf-signatures.md` snapshot. The report flags which was used as a confidence indicator.
- **AT Protocol / atproto**: The decentralised social networking protocol underlying Bluesky. Osprey is purpose-built to evaluate moderation rules against atproto events.
- **Ozone**: Bluesky's moderation service. `AtprotoLabel` effects in SML rules emit labels to Ozone.

## Architecture

A new `osprey-rule-investigator` plugin (`plugins/osprey-rule-investigator/`) containing one agent and one skill, modelled after the `codebase-investigator` pattern from `ed3d-research-agents`.

**Agent: `osprey-rule-investigator`**
- Model: haiku (cheap, fast read-only subagent)
- Single required skill: `investigating-osprey-rules`
- Allowed tools: Read, Grep, Glob, Bash, Skill
- Output: text-only responses — no file writes unless caller explicitly requests it
- Caller provides two paths in prompt: rules project path (required) and osprey-for-atproto repo path (required for dynamic UDF discovery, static fallback if inaccessible)

**Skill: `investigating-osprey-rules`**
- `user-invocable: false` — loaded by agent, not invoked directly
- Single SKILL.md with all investigation methodology
- `references/udf-signatures.md` — static UDF signature catalogue as fallback

The investigation covers four areas in order:

1. **Project Structure Inventory** — validate directory structure, catalogue `.sml` files, read `config/labels.yaml` to produce a labels table, list model files and key variables
2. **UDF Discovery** — dynamic-first: read `register_plugins.py` from osprey-for-atproto, locate each UDF class in `udfs/`, extract `ArgumentsClass` (parameter names, types, defaults) and return type. Static fallback: read `references/udf-signatures.md` with a staleness caveat
3. **Execution Graph Mapping** — trace from `main.sml` through all `Import` and `Require` statements, map `index.sml` wiring, catalogue each `Rule()` definition with its `when_all` conditions, catalogue each `WhenRules()` with its triggers and effects (`LabelAdd`, `LabelRemove`, `AtprotoLabel`, etc.), produce rule → conditions → effect → label summary
4. **Structured Report** — text output with sections for each area, exact file paths and line numbers for every finding, indication of whether dynamic or static UDF discovery was used

**Integration with osprey-rules plugin:**
- `osprey-rule-writer` agent gains `Task` in its `allowed-tools` list
- Agent routing table gains a new investigation row: spawn `osprey-rule-investigator` as subagent
- `writing-osprey-rules` skill: Step 1 (ask for path, validate structure) remains; Step 2 (Read Project State) replaced with delegation to investigator agent; Step 1 also asks for osprey-for-atproto repo path early
- `osprey-rules` CLAUDE.md updated to list `osprey-rule-investigator` as a dependency

## Existing Patterns

**codebase-investigator pattern (ed3d-research-agents):**
This design directly follows the established pattern: thin agent definition with a single required skill, haiku model, text-only output rule, no file writes. The skill is a methodology document teaching the agent to use Glob/Grep/Read systematically with domain-specific guidance.

**osprey-rules plugin structure:**
The new plugin mirrors the `osprey-rules` directory layout (`.claude-plugin/plugin.json`, `agents/`, `skills/`) for consistency. The agent prompt follows the same structure as `osprey-rule-writer.md`: identity, required skill, critical rules, output constraints.

**writing-osprey-rules Steps 1-2:**
Step 1's path discovery pattern (AskUserQuestion for path, validate presence of `main.sml`, `config/`, `models/`, `rules/`) is retained in the writing skill. Step 2's project state reading (labels table, model hierarchy, execution graph wiring) moves entirely into the investigator — the writing skill's Step 2 becomes a single delegation call.

## Implementation Phases

<!-- START_PHASE_1 -->
### Phase 1: Plugin Scaffold
**Goal:** Create the `osprey-rule-investigator` plugin directory structure with manifest and empty agent/skill files

**Components:**
- `plugins/osprey-rule-investigator/.claude-plugin/plugin.json` — plugin manifest
- `plugins/osprey-rule-investigator/CLAUDE.md` — plugin documentation
- `plugins/osprey-rule-investigator/agents/osprey-rule-investigator.md` — agent definition (empty body initially)
- `plugins/osprey-rule-investigator/skills/investigating-osprey-rules/SKILL.md` — skill placeholder
- `plugins/osprey-rule-investigator/skills/investigating-osprey-rules/references/udf-signatures.md` — static UDF fallback placeholder

**Dependencies:** None

**Done when:** Plugin directory structure exists with valid `plugin.json`, all files present
<!-- END_PHASE_1 -->

<!-- START_PHASE_2 -->
### Phase 2: Agent Definition
**Goal:** Write the osprey-rule-investigator agent prompt

**Components:**
- `plugins/osprey-rule-investigator/agents/osprey-rule-investigator.md` — agent frontmatter (name, model: haiku, color, description with trigger examples, allowed-tools) and body (identity, required skill, output rules, input expectations for paths)

**Dependencies:** Phase 1

**Done when:** Agent definition follows codebase-investigator pattern, specifies required skill, defines output constraints, documents expected prompt inputs (rules project path, osprey-for-atproto path)
<!-- END_PHASE_2 -->

<!-- START_PHASE_3 -->
### Phase 3: Investigation Skill — Project Structure & Labels
**Goal:** Write the first section of the investigating-osprey-rules skill covering project structure inventory

**Components:**
- `plugins/osprey-rule-investigator/skills/investigating-osprey-rules/SKILL.md` — skill frontmatter, overview, project structure investigation methodology (validate directories, list `.sml` files, read `config/labels.yaml`, list model files with key variables), reporting format for this section

**Dependencies:** Phase 2

**Done when:** Skill teaches the agent to systematically inventory an Osprey rules project structure and produce a structured text report with labels table, model catalogue, and file listing. Covers `osprey-rule-investigator.AC1.*`
<!-- END_PHASE_3 -->

<!-- START_PHASE_4 -->
### Phase 4: Investigation Skill — UDF Discovery
**Goal:** Add UDF discovery section to the skill with dynamic-first, static-fallback approach

**Components:**
- `plugins/osprey-rule-investigator/skills/investigating-osprey-rules/SKILL.md` — UDF discovery section: dynamic discovery methodology (read `register_plugins.py`, locate UDF classes, extract `ArgumentsClass`, extract return types, produce signature table), static fallback methodology (read `references/udf-signatures.md`), confidence reporting
- `plugins/osprey-rule-investigator/skills/investigating-osprey-rules/references/udf-signatures.md` — populated with current UDF signatures from osprey-for-atproto (generated by reading the actual source once)

**Dependencies:** Phase 3

**Done when:** Skill teaches dynamic UDF extraction from Python source with static fallback. Static reference file is populated with current signatures. Report includes confidence indicator (dynamic vs static). Covers `osprey-rule-investigator.AC2.*`
<!-- END_PHASE_4 -->

<!-- START_PHASE_5 -->
### Phase 5: Investigation Skill — Execution Graph Mapping
**Goal:** Add execution graph tracing section to the skill

**Components:**
- `plugins/osprey-rule-investigator/skills/investigating-osprey-rules/SKILL.md` — execution graph mapping section: tracing methodology (start from `main.sml`, follow `Import`/`Require`, map `index.sml` wiring, catalogue `Rule()` definitions with conditions, catalogue `WhenRules()` with triggers and effects), summary format (rule → conditions → effect → label)

**Dependencies:** Phase 4

**Done when:** Skill teaches systematic execution graph tracing from `main.sml` to leaf rule files, producing a complete map of rules, their conditions, and their effects. Covers `osprey-rule-investigator.AC3.*`
<!-- END_PHASE_5 -->

<!-- START_PHASE_6 -->
### Phase 6: Integration — osprey-rules Plugin Updates
**Goal:** Update the osprey-rules plugin to use the investigator agent

**Components:**
- `plugins/osprey-rules/agents/osprey-rule-writer.md` — add `Task` to `allowed-tools`, add investigation routing row to task routing table
- `plugins/osprey-rules/skills/writing-osprey-rules/SKILL.md` — Step 1 updated to also ask for osprey-for-atproto path, Step 2 replaced with delegation to `osprey-rule-investigator` agent via Task tool
- `plugins/osprey-rules/CLAUDE.md` — updated "Expects" and "Dependencies" sections

**Dependencies:** Phase 5

**Done when:** osprey-rule-writer can spawn investigator as subagent, writing-osprey-rules delegates project state reading to investigator, CLAUDE.md documents the dependency. Covers `osprey-rule-investigator.AC4.*`
<!-- END_PHASE_6 -->

## Additional Considerations

**Static reference maintenance:** The `references/udf-signatures.md` file should be regenerated whenever the osprey-for-atproto UDF set changes. The investigator's report indicates whether dynamic or static discovery was used, so the caller knows the confidence level.

**Distinction from osprey-sml-reference:** The investigator's UDF catalogue is exhaustive signatures (what's available). The osprey-sml-reference's UDF table is curated guidance (how to use key UDFs). They serve different purposes and audiences — the investigator feeds the orchestrating agent, the reference feeds the rule writer during authoring.
