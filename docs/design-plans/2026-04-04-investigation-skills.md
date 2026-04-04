# Investigation Skills Design

## Summary

This design introduces four investigation skills — `assess-account`, `search-incidents`, `triage-rule-hits`, and `classify-cluster` — that embed Claude's native reasoning directly into structured investigation workflows for AT Protocol network threat analysis. Prior to these skills, analysts had to manually dispatch multiple ClickHouse queries, synthesise results across data dimensions, and write findings from scratch. These skills replace that synthesis loop by defining the data collection questions, classification schemas, and output formats that the investigator agent (or a standalone user) follows to produce consistent, structured assessments.

The approach builds entirely on existing plugin conventions and agent delegation patterns. Each skill is a methodology document — it describes what research questions to send to the `data-analyst` agent, what schema to apply to the returned data, and what the output should look like. No SQL lives in the skills; no new agents are introduced; no MCP server changes are required. The investigator agent is updated to load the relevant skill on-demand when entering the phase where it applies, keeping context window usage lean. A lighter "structured assessment" output mode is introduced alongside the existing B-I-N-D-Ts report format, giving analysts a fast triage path without bypassing the full reporting workflow when it's needed.

## Definition of Done

Four new skills in `skywatch-investigations/skills/` that wrap ClickHouse queries with Claude's native classification layer, replacing manual synthesis workflows: `assess-account`, `search-incidents`, `triage-rule-hits`, and `classify-cluster`. Each skill works standalone (direct invocation for quick triage) and integrates with the existing investigator agent's 6-phase methodology. Default output is structured assessment; B-I-N-D-Ts report available on request. The investigator agent is updated to know when and how to use each skill. No MCP server changes, no new agents, no modifications to existing skills.

**Deliverables:**
- 4 new skills: `assess-account`, `search-incidents`, `triage-rule-hits`, `classify-cluster`
- Each follows existing conventions (SKILL.md with frontmatter, non-user-invocable, reference files where needed)
- Each is usable standalone AND by the investigator agent within the 6-phase methodology
- Updates to the investigator agent to know when/how to use the new skills
- Default output is structured assessment; B-I-N-D-Ts report available on request

**Success criteria:**
- A user can say "assess this account" and get a classified assessment without writing SQL or manually synthesising multiple queries
- A user can search for incidents by topic and get relevance-scored, classified results (not just raw keyword matches)
- Rule hits can be triaged for FP/TP/novel patterns without manual review of each hit
- Cosharing clusters can be narratively classified without manually reading all member content
- All skills integrate with existing MCP tools (clickhouse_query, cosharing_*, content_similarity, etc.)

**Out of scope:**
- MCP server changes (separate repo/effort)
- New agents (skills work with existing investigator + data-analyst)
- Changes to existing skills (accessing-osprey, querying-clickhouse, conducting-investigations, reporting-results)

## Acceptance Criteria

### investigation-skills.AC1: Account Assessment
- **investigation-skills.AC1.1 Success:** Given a DID, assess-account produces a structured assessment with account_type, confidence, signals, topic_breakdown, language_profile, and recommendation
- **investigation-skills.AC1.2 Success:** Given a handle (instead of DID), assess-account resolves to DID and produces the same assessment
- **investigation-skills.AC1.3 Success:** Assessment correctly identifies bot-like accounts using entropy thresholds (hourly_entropy ≥ 3.9, interval_entropy ≤ 1.5)
- **investigation-skills.AC1.4 Success:** Assessment identifies IO signals (single-topic concentration, cluster membership, narrative alignment)
- **investigation-skills.AC1.5 Success:** On request, full B-I-N-D-Ts report is produced following reporting-results conventions
- **investigation-skills.AC1.6 Edge:** Account with no rule hits or minimal history produces assessment with low confidence and "insufficient_data" signals

### investigation-skills.AC2: Incident Search
- **investigation-skills.AC2.1 Success:** Given a topic, search-incidents returns relevance-scored results with content_type and incident_confirmed classifications
- **investigation-skills.AC2.2 Success:** Results are filtered to minimum relevance threshold and sorted by score
- **investigation-skills.AC2.3 Success:** Output includes regional breakdown and top accounts summary
- **investigation-skills.AC2.4 Success:** Incident reports are distinguished from commentary, historical references, and news aggregation
- **investigation-skills.AC2.5 Edge:** Topic with zero results returns empty result set with explanation, not an error

### investigation-skills.AC3: Rule Hit Triage
- **investigation-skills.AC3.1 Success:** Given a rule name, triage-rule-hits samples hits and classifies each as TP/FP/novel/uncertain
- **investigation-skills.AC3.2 Success:** Aggregate output includes counts, FP examples with reasoning, and novel patterns with suggested rule actions
- **investigation-skills.AC3.3 Success:** rule_health assessment produced (healthy/drifting/needs_update/needs_review)
- **investigation-skills.AC3.4 Success:** Novel patterns include concrete description and example posts
- **investigation-skills.AC3.5 Edge:** Rule with no hits in the time window returns "no data" summary, not a classification attempt on empty results

### investigation-skills.AC4: Cluster Classification
- **investigation-skills.AC4.1 Success:** Given a cluster ID or set of DIDs, classify-cluster produces narrative analysis with dominant_narratives, coordination_signals, and likely_origin
- **investigation-skills.AC4.2 Success:** Classification distinguishes IO from organic coordination (coordination ≠ inauthentic)
- **investigation-skills.AC4.3 Success:** Output includes "cluster at a glance" summary (size, age range, language mix, dominant narrative, confidence)
- **investigation-skills.AC4.4 Success:** Shared sources (domains/URLs) are identified across cluster members
- **investigation-skills.AC4.5 Edge:** Cluster with single member or very small membership produces assessment with low confidence flag

### investigation-skills.AC5: Investigator Integration
- **investigation-skills.AC5.1 Success:** Investigator agent loads assess-account when entering Phase 2 (Characterization)
- **investigation-skills.AC5.2 Success:** Investigator agent loads search-incidents when investigation starts from a topic (Phase 1 Discovery)
- **investigation-skills.AC5.3 Success:** Investigator agent loads classify-cluster when cosharing cluster is identified (Phase 3/4)
- **investigation-skills.AC5.4 Success:** Investigator agent loads triage-rule-hits when evaluating rule coverage (Phase 5)
- **investigation-skills.AC5.5 Success:** Skills are loaded on-demand, not pre-loaded at investigation start
- **investigation-skills.AC5.6 Success:** CLAUDE.md Exposes section lists all 4 new skills

## Glossary

- **AT Protocol (atproto)**: The open, federated social networking protocol underpinning Bluesky. Accounts are identified by DIDs; content is published to a personal data server (PDS) and indexed by relays and app views.
- **DID**: Decentralised Identifier. The stable, portable unique identifier for an AT Protocol account (e.g. `did:plc:xyz`). Persists even when a handle changes.
- **Handle**: The human-readable username on AT Protocol (e.g. `@alice.bsky.social`). Resolved to a DID for data lookups.
- **ClickHouse**: A column-oriented OLAP database used to store and query platform activity data — posts, rule hits, engagement signals, etc.
- **MCP (Model Context Protocol)**: The tool-calling protocol used by Claude Code plugins. MCP tools (`clickhouse_query`, `cosharing_*`, etc.) are the mechanism by which agents interact with external data sources.
- **Ozone**: The AT Protocol moderation infrastructure. Labels, escalations, and queue actions are applied through Ozone.
- **Osprey**: Skywatch's SML-based rule engine that detects content matching defined patterns and produces rule hits.
- **Skill**: A methodology document (`SKILL.md`) loaded into Claude's context via the `Skill` tool. Defines how to approach a task; not executable code.
- **Agent**: A specialised Claude instance (`agents/investigator.md`, `agents/data-analyst.md`) with a defined role, tool access, and methodology. Distinct from skills.
- **data-analyst agent**: The agent responsible for all ClickHouse data access. Accepts natural language research questions, formulates SQL using `querying-clickhouse` patterns, and returns results as markdown tables.
- **investigator agent**: The primary analyst agent that owns the 6-phase investigation methodology. Delegates data work to `data-analyst` and applies classification via loaded skills.
- **6-phase methodology**: The investigation structure defined in `conducting-investigations`: Discovery → Characterisation → Linkage → Amplification → Rule Validation → Reporting.
- **B-I-N-D-Ts**: The structured report format used by `reporting-results`: Bottom line, Impact, Next steps, Details, Timestamps.
- **Cosharing**: A coordination signal where multiple accounts share the same URLs or domains in close temporal proximity. Detected via `cosharing_*` MCP tools.
- **Cosharing cluster**: A group of accounts identified as coordinated via cosharing analysis. The unit of analysis for `classify-cluster`.
- **IO (Information Operation)**: A coordinated inauthentic behaviour campaign, typically state- or politically-motivated, using multiple accounts to push a unified narrative.
- **TP / FP / novel**: True positive, false positive, and a newly-observed pattern not matching the rule's original design intent — the three primary classifications in rule hit triage.
- **Rule hit**: A content match produced by an Osprey rule. A hit records which rule fired, on which content, and when.
- **rule_health**: An aggregate assessment of a rule's current performance: `healthy`, `drifting`, `needs_update`, or `needs_review`.
- **Entropy thresholds**: Statistical measures used to flag bot-like posting behaviour. `hourly_entropy ≥ 3.9` indicates unnaturally even distribution across hours; `interval_entropy ≤ 1.5` indicates suspiciously regular posting intervals.
- **Content similarity**: A measure (via the `content_similarity` MCP tool) of how closely posts across accounts resemble each other — a coordination signal.
- **`user-invocable: false`**: A frontmatter flag in `SKILL.md` indicating the skill is intended for agent use, not direct user invocation.
- **Structured assessment**: A lighter output format introduced by this design — key fields and classification result — as opposed to a full B-I-N-D-Ts narrative report.

## Architecture

### Skill Pattern

Each skill follows a 3-phase internal structure that mirrors the existing skill conventions:

1. **Data Collection** — describes what to dispatch to `data-analyst` as natural language research questions (not SQL). The data-analyst formulates and executes queries using `querying-clickhouse` patterns.
2. **Classification** — defines the schema and criteria the investigator (or standalone user) applies to the returned data. Claude's native reasoning is the classification layer — no external LLM calls.
3. **Output** — defines the structured assessment format (default) and escalation path to B-I-N-D-Ts reports via `reporting-results`.

### Integration Model

Skills are loaded on-demand by the investigator agent when entering the relevant investigation phase:

| Skill | Investigation Phase | Trigger |
|-------|-------------------|---------|
| `search-incidents` | Phase 1 (Discovery) | Investigation starts from a topic rather than a specific account |
| `assess-account` | Phase 2 (Characterization) | Profiling an account of interest |
| `classify-cluster` | Phase 3 (Linkage) or Phase 4 (Amplification) | Cosharing cluster identified |
| `triage-rule-hits` | Phase 5 (Rule Validation) | Evaluating rule coverage and health |

For standalone use, a user loads the skill directly and follows its methodology without the full 6-phase investigation wrapper.

### Data Flow

```
User request (e.g., "assess did:plc:xyz")
  → Investigator loads relevant skill via Skill tool
  → Skill's Data Collection phase → dispatch to data-analyst
    → data-analyst formulates SQL using querying-clickhouse
    → data-analyst executes via clickhouse_query MCP tool
    → data-analyst returns raw results + SQL used
  → Skill's Classification phase → investigator applies schema to results
  → Skill's Output phase → structured assessment or B-I-N-D-Ts report
```

### Investigator Agent Update

A new "Optional Skills" section is added to `agents/investigator.md` after the existing Required Skills section. This section maps each skill to the phase where it's relevant and provides loading guidance:

- Load skills with the `Skill` tool when entering the relevant phase
- Only load what's needed — don't pre-load all four
- Skills supplement the existing methodology; the 6-phase structure is unchanged

No changes to `data-analyst.md` — it already handles arbitrary research questions.

## Existing Patterns

### Skill Conventions (from investigation)

All existing skills follow the same structure:
- `skills/{skill-name}/SKILL.md` with YAML frontmatter (`name`, `description`, `user-invocable: false`)
- Optional `references/` subdirectory for supporting material
- Skills are auto-discovered by directory convention — no registration in plugin.json
- Skills reference MCP tools but describe methodology, not SQL

The new skills follow this convention exactly.

### Agent Delegation Pattern

The investigator agent never touches ClickHouse directly. All data queries are dispatched to `data-analyst` as natural language research questions including relevant context (DIDs, handles, time ranges). The data-analyst returns results as markdown tables with the SQL used. This pattern is preserved — new skills describe what to ask the data-analyst, not what SQL to run.

### Output Conventions

Existing investigation output uses B-I-N-D-Ts format (Bottom line, Impact, Next steps, Details, Timestamps) via the `reporting-results` skill. The new skills default to a lighter structured assessment format for quick triage, with B-I-N-D-Ts available on request. This is a new pattern — existing skills don't have a "quick output" mode — but it doesn't conflict with existing conventions since the full report format remains available.

## Implementation Phases

<!-- START_PHASE_1 -->
### Phase 1: assess-account Skill

**Goal:** Replace manual account profiling with a structured assessment workflow.

**Components:**
- `plugins/skywatch-investigations/skills/assess-account/SKILL.md` — methodology covering data collection (7 query categories), classification schema (account_type, confidence, signals, topic_breakdown, language_profile, narrative_alignment, recommendation), and output format
- Classification criteria for: bot signals (entropy thresholds), IO signals (topic concentration, cluster membership, coordinated timing), scam signals (fundraising patterns, urgency framing), genuine signals (varied topics, organic engagement)

**Dependencies:** None (first phase, no inter-skill dependencies)

**Done when:** Skill file exists, follows plugin conventions, investigator agent can load it during Phase 2 (Characterization), and a standalone invocation produces a structured assessment for a test DID

**Covers:** `investigation-skills.AC1.*`
<!-- END_PHASE_1 -->

<!-- START_PHASE_2 -->
### Phase 2: search-incidents Skill

**Goal:** Generalise the incident search pattern (proven by the drone casualties query) into a reusable skill.

**Components:**
- `plugins/skywatch-investigations/skills/search-incidents/SKILL.md` — methodology covering topic-based keyword expansion guidance, data collection via data-analyst, per-result classification schema (relevance 1-10, content_type, incident_confirmed, geographic_focus, key_details, source_type), and output format (filtered list sorted by relevance, grouped by geography, with top accounts and regional breakdown)
- Classification criteria for distinguishing: incident reports (specific location/time/casualties, present tense) vs commentary (general statements, opinion language) vs news aggregation (reposted headlines) vs historical references

**Dependencies:** None (parallel with Phase 1)

**Done when:** Skill file exists, follows plugin conventions, investigator agent can load it during Phase 1 (Discovery), and a standalone invocation for a test topic produces classified, relevance-scored results

**Covers:** `investigation-skills.AC2.*`
<!-- END_PHASE_2 -->

<!-- START_PHASE_3 -->
### Phase 3: triage-rule-hits Skill

**Goal:** Automate the rule maintenance loop — classify rule hits as TP/FP/novel to surface what needs human attention.

**Components:**
- `plugins/skywatch-investigations/skills/triage-rule-hits/SKILL.md` — methodology covering rule hit sampling via data-analyst, per-hit classification schema (classification, confidence, reasoning, pattern_group), aggregate output schema (counts, FP examples, novel patterns with suggested rule actions, rule_health assessment, recommendation), and output format
- Classification criteria for: true positives (content matches intended detection target), false positives (satire, historical reference, meta-discussion), novel patterns (problematic content caught via broad matching, uses different pattern than rule design), uncertain (insufficient context)

**Dependencies:** None (parallel with Phases 1-2)

**Done when:** Skill file exists, follows plugin conventions, investigator agent can load it during Phase 5 (Rule Validation), and a standalone invocation for a test rule produces a triage summary with classified hits

**Covers:** `investigation-skills.AC3.*`
<!-- END_PHASE_3 -->

<!-- START_PHASE_4 -->
### Phase 4: classify-cluster Skill

**Goal:** Turn cosharing cluster membership into an actionable narrative brief — what the cluster is pushing, where it's coming from, confidence it's an operation.

**Components:**
- `plugins/skywatch-investigations/skills/classify-cluster/SKILL.md` — methodology covering multi-round data collection (cluster metadata + member content), classification schema (dominant_narratives with prevalence, coordination_signals, language_distribution, shared_sources, likely_origin, confidence, member_roles), and output format including "cluster at a glance" summary
- Classification criteria for: IO indicators (single narrative dominance, high content similarity, temporal clustering, state-aligned sources, bot-like entropy, new accounts), spam indicators (commercial URLs, affiliate patterns, templates), organic indicators (varied topics within theme, genuine engagement, established accounts, diverse sources)
- Explicit guidance that coordination ≠ inauthentic — narrative and source analysis distinguishes IO from genuine shared interest

**Dependencies:** None (parallel with Phases 1-3)

**Done when:** Skill file exists, follows plugin conventions, investigator agent can load it during Phase 3/4 (Linkage/Amplification), and a standalone invocation for a test cluster produces a narrative classification

**Covers:** `investigation-skills.AC4.*`
<!-- END_PHASE_4 -->

<!-- START_PHASE_5 -->
### Phase 5: Investigator Agent Integration

**Goal:** Update the investigator agent to know about the new skills and when to load them.

**Components:**
- `plugins/skywatch-investigations/agents/investigator.md` — add "Optional Skills" section after Required Skills, mapping each skill to its relevant investigation phase with loading guidance
- `plugins/skywatch-investigations/CLAUDE.md` — update the Exposes section to list the 4 new skills

**Dependencies:** Phases 1-4 (all skills must exist before integration)

**Done when:** Investigator agent markdown references all 4 skills with phase-appropriate loading guidance, CLAUDE.md lists the new skills, and the plugin's skill discovery picks up all 4 new skills

**Covers:** `investigation-skills.AC5.*`
<!-- END_PHASE_5 -->

## Additional Considerations

**Output format evolution:** The structured assessment format is new to this plugin — existing skills only produce B-I-N-D-Ts reports. If the structured format proves useful, future work could add it as an output mode to `reporting-results` rather than having each skill define its own. This is explicitly out of scope for this design.

**Classification calibration:** Classification quality depends on the criteria defined in each skill. These will need iteration based on real investigation results. The skill files are markdown — easy to update classification criteria without code changes.

**Context window pressure:** Each skill is a methodology document loaded into the investigator's context. On-demand loading mitigates this, but if all 4 are loaded in a single investigation, context pressure may be significant. Skills should be concise — methodology and classification criteria only, no verbose explanations.
