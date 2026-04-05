---
name: triage-rule-hits
description: >-
  Rule hit triage methodology for Osprey rules. Samples recent hits, classifies
  each as TP/FP/novel/uncertain, and produces aggregate rule health assessment
  with actionable recommendations. Use when evaluating rule performance during
  Phase 5 (Rule Validation) or as a standalone rule maintenance check.
user-invocable: false
---

# Triage Rule Hits

This skill guides the triage of Osprey rule hits — sampling recent hits for a given rule, classifying each as true positive, false positive, novel pattern, or uncertain, and producing an aggregate assessment of rule health. The goal is to surface what needs human attention: false positives that indicate rule drift, novel patterns worth adding to rule design, and overall rule performance.

Use this skill when you need to evaluate whether a rule is performing as intended, during Phase 5 (Rule Validation) of an investigation, or as a standalone rule maintenance workflow.

## Input

The skill accepts:
- **Rule name** (required): The Osprey rule to triage (e.g., `election_misinfo_en`)
- **Time window** (optional): How far back to look. Default: 30 days.
- **Sample size** (optional): How many hits to classify. Default: 50.

## Phase 1: Data Collection

### 1. Rule Hit Sample

**Dispatch to data-analyst:**
"Sample [sample_size] rule hits for rule [rule_name] from osprey_execution_results over the past [time_window] days. Return: hit timestamp, author DID, content text, any other rules that also matched this content, and the rule's output score/value. Use a stratified sample — take hits evenly distributed across the time window rather than just the most recent."

**Why stratified sampling:** Recent hits may not represent the rule's full behaviour. A rule might work well on current content but have drifted over time, or vice versa.

### 2. Rule Context

**Dispatch to data-analyst:**
"For rule [rule_name], show aggregate statistics over the past [time_window] days: total hit count, hits per day (average and range), unique authors hit, and a daily hit count trend (date, count)."

### 3. Hit Volume Check

If the rule hit sample returns zero results:
1. Report: "Rule [rule_name] produced no hits in the past [time_window] days."
2. Suggest: Check if the rule is still active, or expand the time window.
3. Do NOT proceed with classification — return a "no data" summary immediately.

If fewer than 10 hits are returned, proceed with classification but note the small sample size and its effect on confidence.
