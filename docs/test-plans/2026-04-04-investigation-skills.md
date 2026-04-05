# Human Test Plan: Investigation Skills

## Prerequisites

- Claude Code environment with the `skywatch-investigations` plugin installed
- ClickHouse access configured (`CLICKHOUSE_HOST`, `CLICKHOUSE_PORT`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DATABASE`)
- Ozone credentials set (`OZONE_HANDLE`, `OZONE_ADMIN_PASSWORD`, `OZONE_DID`, `OZONE_PDS`)
- MCP server running (verify with a simple `clickhouse_schema` call)
- At least one known DID with rule hits (for assess-account and triage tests)
- At least one known co-sharing cluster ID (for classify-cluster tests)
- At least one known rule name with recent hits (for triage-rule-hits tests)

## Phase 1: Assess Account (AC1)

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Ask the investigator agent: "Assess account did:plc:[known-DID-with-rule-hits]" | Agent loads `assess-account` skill. Dispatches 7 data collection queries to data-analyst. Produces structured assessment with all fields: account_type, confidence, signals, topic_breakdown, language_profile, recommendation. |
| 1.2 | Ask the investigator agent: "Assess account @[known-handle].bsky.social" | Agent resolves the handle to a DID before proceeding. Assessment output is identical in structure to step 1.1. |
| 1.3 | After step 1.1 completes, inspect the signals section of the output | Bot signals reference entropy thresholds (hourly_entropy >= 3.9, interval_entropy <= 1.5) when applicable. IO signals reference single-topic concentration, cluster membership, narrative alignment when applicable. |
| 1.4 | Ask: "Now produce a full B-I-N-D-Ts report for this account" | Agent loads `reporting-results` skill. Output follows B-I-N-D-Ts format with Bottom Line, Impact, Next Steps, Details, Timestamps sections. Report type is "memo". |
| 1.5 | Ask: "Assess account did:plc:[brand-new-or-empty-DID]" | Assessment completes (no error). account_type is `insufficient_data` or similar low-confidence classification. Confidence is `low`. Data Gaps section lists which queries returned no results. |

## Phase 2: Search Incidents (AC2)

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Ask the investigator agent: "Search for incidents related to [well-known recent topic]" | Agent loads `search-incidents` skill. Produces keyword strategy first. Each result carries relevance score (1-10), content_type enum, and incident_confirmed enum. |
| 2.2 | Inspect the output ordering and filtering | Results with relevance < 5 are excluded. Remaining results are ordered by relevance score (highest first). Excluded count is noted. |
| 2.3 | Inspect the output structure | Results are grouped under "Results by Region" headers. "Top Accounts" table and "Regional Breakdown" summary table are present. |
| 2.4 | Inspect content_type values across results | incident_report, commentary, news_aggregation, and historical_reference are used appropriately. Check at least one of each (if present) for correct classification logic. |
| 2.5 | Ask: "Search for incidents related to [extremely obscure invented topic]" | Returns empty result set with explanation message suggesting broadening. No classification is attempted on empty results. No error thrown. |

## Phase 3: Triage Rule Hits (AC3)

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Ask the investigator agent: "Triage rule hits for rule [known-rule-with-hits]" | Agent loads `triage-rule-hits` skill. Samples hits. Each hit gets a classification: true_positive, false_positive, novel, or uncertain. |
| 3.2 | Inspect the aggregate output | Classification Summary table shows counts for each category. False Positive Patterns subsection includes example and reasoning. Novel Patterns subsection includes suggested rule action. |
| 3.3 | Check for rule_health assessment | Output includes rule health: one of healthy, drifting, needs_update, needs_review. Health assessment cites TP rate. |
| 3.4 | Inspect novel patterns section (if any exist) | Each novel pattern has a concrete Description and Example Posts with DID and date. |
| 3.5 | Ask: "Triage rule hits for rule [rule-with-no-recent-hits]" (or use very narrow time window) | Returns "no data" summary. No classification is attempted. Suggests expanding time window or checking rule status. |

## Phase 4: Classify Cluster (AC4)

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Ask the investigator agent: "Classify cluster [known-cluster-id]" | Agent loads `classify-cluster` skill. Output contains dominant_narratives, coordination_signals, and likely_origin fields. |
| 4.2 | Inspect the classification reasoning | Assessment section explicitly addresses whether coordination is IO or organic. References specific diagnostic questions (narrative diversity, source diversity, account authenticity, temporal pattern). |
| 4.3 | Inspect "Cluster at a Glance" table | Contains all 5 fields: Size, Age Range, Language Mix, Dominant Narrative, Classification (with confidence). |
| 4.4 | Inspect "Shared Sources" table | Contains domain, member count, total shares, and anomalous flag columns. |
| 4.5 | Ask: "Classify cluster containing only did:plc:[single-DID]" (or provide a single-member group) | Classification completes. Confidence is `low` regardless of other signals. Output explicitly notes small cluster size. |

## Phase 5: Investigator Integration (AC5)

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Start a new investigation: "Investigate did:plc:[DID]" and observe Phase 2 | When the investigator enters Phase 2 (Characterization), it loads `assess-account` via the Skill tool. Not loaded before Phase 2. |
| 5.2 | Start a topic-based investigation: "Investigate incidents of [topic]" | `search-incidents` skill is loaded during Phase 1 (Discovery). |
| 5.3 | Continue an investigation where a co-sharing cluster is found | When the investigator reaches Phase 3 (Linkage) or Phase 4 (Amplification) and identifies a cluster, it loads `classify-cluster`. |
| 5.4 | Continue an investigation into Phase 5 | When the investigator reaches Phase 5 (Rule Validation), it loads `triage-rule-hits`. |
| 5.5 | At investigation start, inspect which skills are loaded | Only `conducting-investigations` and `reporting-results` are loaded initially (required skills). None of the 4 optional skills appear until their phase is reached. |

## End-to-End: Full Investigation Lifecycle

| Step | Action | Expected |
|------|--------|----------|
| E2E.1 | Start investigation: "Investigate [topic] -- find the key accounts and determine if there's coordinated activity" | Investigator loads required skills. Begins Phase 1 Discovery. Loads `search-incidents` for topic search. |
| E2E.2 | When top accounts are identified, watch Phase 2 | Investigator loads `assess-account` and profiles key accounts. Assessment follows the skill's methodology (7 data collection questions, classification schema, structured output). |
| E2E.3 | When cluster membership is found, watch Phase 3/4 | Investigator loads `classify-cluster`. Produces cluster classification with IO/organic distinction. |
| E2E.4 | Watch Phase 5 | Investigator loads `triage-rule-hits` for relevant rules. Produces rule health assessment. |
| E2E.5 | Request final report | Report follows B-I-N-D-Ts format. Incorporates findings from all phases. Evidence trail is complete. |

## Traceability

| Acceptance Criterion | Content Verification | Manual Step |
|----------------------|---------------------|-------------|
| AC1.1 | Output template has all 6 fields | Step 1.1 |
| AC1.2 | Input section has handle resolution | Step 1.2 |
| AC1.3 | Bot Signals has both thresholds | Step 1.3 |
| AC1.4 | IO Signals has all 3 items | Step 1.3 |
| AC1.5 | B-I-N-D-Ts subsection exists | Step 1.4 |
| AC1.6 | Handling Missing Data section | Step 1.5 |
| AC2.1 | Schema table has all 3 fields | Step 2.1 |
| AC2.2 | Minimum threshold section | Step 2.2 |
| AC2.3 | Output has regions + top accounts + breakdown | Step 2.3 |
| AC2.4 | Content Type Criteria table | Step 2.4 |
| AC2.5 | Handling Zero Results | Step 2.5 |
| AC3.1 | Per-Hit Schema table | Step 3.1 |
| AC3.2 | Output has counts + FP + novel sections | Step 3.2 |
| AC3.3 | Rule Health table | Step 3.3 |
| AC3.4 | Novel template has description + examples | Step 3.4 |
| AC3.5 | Hit Volume Check | Step 3.5 |
| AC4.1 | Schema table has 3 fields | Step 4.1 |
| AC4.2 | IO/Organic indicators + 4 diagnostic questions | Step 4.2 |
| AC4.3 | Cluster at a Glance table | Step 4.3 |
| AC4.4 | Shared Sources table | Step 4.4 |
| AC4.5 | Small Cluster Check | Step 4.5 |
| AC5.1 | Optional Skills table: assess-account -> Phase 2 | Step 5.1 |
| AC5.2 | Optional Skills table: search-incidents -> Phase 1 | Step 5.2 |
| AC5.3 | Optional Skills table: classify-cluster -> Phase 3/4 | Step 5.3 |
| AC5.4 | Optional Skills table: triage-rule-hits -> Phase 5 | Step 5.4 |
| AC5.5 | "do not pre-load" guidance | Step 5.5 |
| AC5.6 | CLAUDE.md Exposes, When to Use, Key Files | Content verified (structural) |
