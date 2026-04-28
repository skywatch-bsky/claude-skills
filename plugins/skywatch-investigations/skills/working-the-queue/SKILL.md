---
name: working-the-queue
description: >-
  Two-pass moderation queue triage methodology — pull subjects, scan and classify
  against policy, present batch recommendations, then act on user decisions.
  Supports multiple entry points (reports, appeals, tags, proactive filtering).
  Use when triaging the Ozone moderation queue or processing moderation reports.
user-invocable: false
---

# Working the Queue

This skill guides moderation queue triage using a two-pass approach: first scan a batch of subjects with lightweight context gathering to produce recommendations, then act on user-confirmed decisions. The goal is efficient batch processing where the analyst reviews AI recommendations rather than raw reports.

## Prerequisites

### Load Reference Skill

Load the `querying-ozone` skill for Ozone tool parameter guidance, filter combinations, and conventions.

### Load Policy Guidance

Check for a `.policies/` directory in the current working directory. Read all files within it — these contain label definitions, enforcement criteria, and policy guidance that inform classification decisions.

If `.policies/` also contains a `precedents/` subdirectory, read those files too. Precedents are prior analyst decisions on ambiguous cases that serve as case law for future classification.

If no `.policies/` directory is found, warn the user: "No .policies/ directory found in the current working directory. Proceeding without policy-specific guidance — classifications will be based on general moderation principles. Consider creating .policies/ with your label definitions and enforcement criteria."

## Input

Two parameters, both provided by the user:

- **Entry point** — what to pull from the queue. Determines the `ozone_query_statuses` filter:

| Entry Point | Query Pattern |
|-------------|--------------|
| Recent reports | `sort_field: "lastReportedAt"`, `sort_direction: "desc"` |
| Appeals | `appealed: true`, `sort_direction: "desc"` |
| By tag | `tags: [user-specified]`, `sort_direction: "desc"` |
| By review state | `review_state: [user-specified]` |
| Proactive (custom filters) | User-specified combination of filters |
| Specific subject | `subject: [DID or AT-URI]` — single-subject mode |

- **Batch size** — how many subjects to pull. No default — ask the user if not specified. The user may say "all appeals" or "20 recent reports" or "everything tagged follow-up."

## Phase 1: Scan & Classify

For each subject in the batch, gather context and produce a classification. This is the first pass — prioritise speed and coverage over depth.

### Per-Subject Data Collection

For each subject, gather three categories of context:

#### 1. Moderation History

Query `ozone_query_events` for the subject. Look for:
- Prior reports (how many, how recent, what was reported)
- Prior labels (what's already applied)
- Prior actions (acknowledged, escalated, muted, appealed)
- Moderator comments (especially sticky comments from prior reviews)

This reveals whether the subject is a repeat offender, has prior context, or has already been reviewed.

#### 2. Content Context

Dispatch to the data-analyst agent:
"Pull the 20 most recent posts from DID [subject_did] from osprey_execution_results. Return post text, timestamp, and any rules that matched. Also return any rule hits for this DID in the past 30 days grouped by rule name with hit counts."

This reveals what the account actually posts, beyond the single reported item. Pattern of behaviour matters more than any individual post.

#### 3. Report Content

From the `ozone_query_statuses` result, examine the report itself — what was reported, by whom, and what reason was given. Cross-reference the reported content against the broader posting context from step 2.

### Classification

Apply the following schema to each subject. Every field must be populated.

| Field | Type | Description |
|-------|------|-------------|
| `subject` | string | DID or AT-URI |
| `classification` | enum | `label`, `no_action`, `investigate_further`, `escalate`, `defer` |
| `confidence` | enum | `high`, `medium`, `low` |
| `policy_basis` | string | Which policy from `.policies/` supports this decision, or "no applicable policy" |
| `recommended_label` | string | Label to apply (only when classification is `label`) |
| `reasoning` | string | Brief explanation of the decision |
| `key_evidence` | list | Specific posts, signals, or history items that informed the decision |
| `question` | string | Only for `defer` — the specific question for the analyst |

### Classification Criteria

| Classification | When to Use |
|----------------|-------------|
| `label` | Clear policy violation with sufficient evidence. The policy basis is unambiguous and the behaviour matches. High or medium confidence. |
| `no_action` | Report does not describe behaviour that violates any policy, or the reported content is taken out of context and the broader posting pattern is benign. |
| `investigate_further` | Signals suggest problematic behaviour but the quick scan is insufficient. Needs deeper investigation (e.g., via `assess-account` or `conducting-investigations`). |
| `escalate` | Subject requires higher-level review — policy edge case, high-profile account, potential legal issue, or severity beyond normal triage authority. |
| `defer` | Policy is ambiguous on this case, or the content is borderline. **You MUST use this classification when unsure how to interpret a policy.** |

### The `defer` Classification

When the policy text is ambiguous, when the content could reasonably fall on either side of a policy line, or when you lack the context to interpret a policy correctly — classify as `defer` and populate the `question` field with a specific question for the analyst.

Good defer questions are specific and actionable:
- "The account posts satirical content that mimics [policy-violating behaviour]. Does the satire exemption in [policy section] apply here?"
- "This account shares links from [domain] which is state-affiliated media. The policy covers 'state-linked propaganda' but this content is factual reporting. Does the source alone trigger the policy?"
- "Multiple users reported this as [violation type] but the content appears to be [alternative interpretation]. Which reading applies?"

Bad defer questions are vague:
- "Is this a violation?" (too broad — specify what's ambiguous)
- "What should we do?" (the whole point is to narrow the question)

### Recording Precedent Decisions

When the analyst answers a `defer` question, their decision establishes a precedent. Write the decision to `.policies/precedents/` as a markdown file:

**Filename:** `YYYY-MM-DD-[short-description].md` (e.g., `2026-04-28-satire-exemption-state-media.md`)

**Format:**

```markdown
# [Short description of the decision]

**Date:** [YYYY-MM-DD]
**Question:** [The defer question that was asked]
**Decision:** [The analyst's answer]
**Reasoning:** [Why the analyst decided this way, if provided]
**Applies to:** [What category of future cases this precedent covers]
```

Future runs of this skill will read precedents from `.policies/precedents/` and apply them to similar cases rather than re-deferring on the same type of ambiguity.

## Phase 2: Present Batch

Present all subjects as a batch summary. Group by classification for easy scanning.

### Summary Table

```
## Queue Triage: [entry point description]

**Batch Size:** [N] subjects reviewed
**Policy Reference:** [list of .policies/ files loaded]

### Recommended: Label ([n])

| # | Subject | Label | Policy Basis | Confidence | Key Evidence |
|---|---------|-------|-------------|------------|--------------|
| 1 | did:plc:... | [label] | [policy] | high | [one-line summary] |

### Recommended: No Action ([n])

| # | Subject | Reasoning | Confidence |
|---|---------|-----------|------------|
| 1 | did:plc:... | [one-line reasoning] | high |

### Requires Decision ([n])

| # | Subject | Question |
|---|---------|----------|
| 1 | did:plc:... | [specific question from defer classification] |

### Recommended: Investigate Further ([n])

| # | Subject | What's Unclear | Suggested Next Step |
|---|---------|---------------|-------------------|
| 1 | did:plc:... | [ambiguity] | [assess-account / full investigation] |

### Recommended: Escalate ([n])

| # | Subject | Reason |
|---|---------|--------|
| 1 | did:plc:... | [escalation reason] |
```

For each subject classified as `label`, include enough context (key posts, moderation history, rule hits) that the analyst can verify the recommendation without re-querying.

**Then wait for user direction.** Do not proceed to Phase 3 until the user confirms, modifies, or overrides the recommendations.

## Phase 3: Act

Execute the user's confirmed decisions. The user may accept all recommendations, override specific ones, or provide answers to defer questions.

### Step 1: Record Precedents

If the user answered any `defer` questions, write each decision to `.policies/precedents/` before proceeding. This ensures the precedent is recorded even if the session is interrupted during labelling.

### Step 2: Apply Labels

For all subjects confirmed for labelling:

1. Generate a single `batchId` (UUID) for this triage session
2. Apply labels via `ozone_label` for each subject with the confirmed label
3. Add `ozone_comment` with reasoning where the decision was non-obvious or where the analyst provided specific notes

### Step 3: Execute Other Actions

- `ozone_escalate` for subjects the user confirmed for escalation
- `ozone_tag` for subjects that need tagging
- `ozone_mute` for subjects that should be suppressed

### Step 4: Acknowledge All

After all actions are complete, acknowledge ALL processed subjects to close them in the queue:

- Use `ozone_acknowledge` for each subject
- Use `acknowledgeAccountSubjects: true` for account-level subjects to bulk-close all associated reports
- This applies to both labelled subjects AND no-action subjects — acknowledgement is the "done" action that closes the report

### Output

```
## Actions Completed

**Batch ID:** [UUID]

| Action | Count | Details |
|--------|-------|---------|
| Labelled | [n] | [label1] x [n], [label2] x [n] |
| Acknowledged (no action) | [n] | |
| Escalated | [n] | |
| Deferred for investigation | [n] | |
| Precedents recorded | [n] | [filenames written to .policies/precedents/] |
```
