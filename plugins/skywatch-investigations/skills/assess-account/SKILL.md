---
name: assess-account
description: >-
  Structured account assessment for AT Protocol investigations. Replaces manual
  account profiling by defining data collection questions, classification schema,
  and output format. Produces account_type, confidence, signals, and recommendation.
  Use when profiling an account of interest during Phase 2 (Characterization) or
  as a standalone quick assessment.
user-invocable: false
---

# Assess Account

This skill guides structured assessment of AT Protocol accounts. It defines what data to collect, how to classify the account, and what output to produce. The result is a consistent, repeatable assessment that replaces ad-hoc manual profiling.

Use this skill when you need to determine what type of account you're looking at (genuine, bot, IO, scam, spam) and what to do about it.

## Input

The skill accepts either a DID (`did:plc:...`) or a handle (`@user.bsky.social` or `user.bsky.social`). If a handle is provided, resolve it to a DID before proceeding — dispatch the data-analyst with: "Resolve this handle to a DID: [handle]". Use the resolved DID for all subsequent queries.

## Phase 1: Data Collection

Dispatch each of the following research questions to the data-analyst agent. Include the target DID and any relevant time constraints. The data-analyst formulates and executes the queries, returning results as markdown tables.

### 1. Rule Hit Profile

**Dispatch to data-analyst:**
"Find all rule hits for DID [target_did] over the past 90 days. Group by rule name and show: rule name, hit count, earliest hit, latest hit, and sample content (first 3 hits). Also show the total distinct rules triggered."

**What this reveals:** Which rules trigger on this account, how frequently, and over what time range. High-volume single-rule hits suggest targeted behaviour. Hits across many rules suggest broad problematic activity.

### 2. Posting Patterns

**Dispatch to data-analyst:**
"Show posting patterns for DID [target_did] over the past 30 days. Include: total post count, posts per day distribution, posting hours (UTC) distribution as a histogram, average inter-post interval, and day-of-week distribution."

**What this reveals:** Temporal regularity or irregularity. Bots post at consistent intervals; genuine accounts show natural variation. Around-the-clock posting without gaps suggests automation.

### 3. Entropy Analysis

**Dispatch to data-analyst:**
"Query account_entropy_results for DID [target_did]. Return: hourly_entropy, interval_entropy, is_bot_like flag, and the evaluation timestamp. If no results, state that explicitly."

**What this reveals:** Statistical measures of posting regularity. See Classification section for threshold interpretation.

### 4. Content Themes

**Dispatch to data-analyst:**
"Sample the 50 most recent posts from DID [target_did] from osprey_execution_results (use the content field). Return the post text, timestamp, and any rule that matched. Focus on distinct content — skip exact duplicates."

**What this reveals:** What the account talks about, content diversity, and whether posts are templated or varied.

### 5. Network Signals

**Dispatch to data-analyst:**
"Check if DID [target_did] appears in any URL co-sharing clusters. Return cluster IDs, cluster sizes, and evolution types. Also check quote co-sharing clusters."

Additionally, use the `cosharing_pairs` MCP tool directly to check raw co-sharing edges for the target DID.

**What this reveals:** Whether the account participates in coordinated URL or quote sharing networks.

### 6. Infrastructure

**Dispatch to data-analyst:**
"Query account metadata for DID [target_did]: account creation date, PDS host, and any signup anomaly flags from pds_signup_anomalies (check if the PDS host appears with anomalous signup rates)."

Use `domain_check` directly on any unusual PDS hosts identified.

**What this reveals:** Account age, hosting infrastructure, and whether the account was created on a PDS with anomalous signup patterns (mass-registration signal).

### 7. Engagement Context

**Dispatch to data-analyst:**
"For DID [target_did], check url_overdispersion_results to see if any domains shared by this account are flagged as anomalous. Return the domain, is_anomaly flag, and sample_dids if the target appears."

**What this reveals:** Whether the account shares domains that are being pushed by coordinated networks.

### Handling Missing Data

Some queries may return no results (new accounts, accounts with no rule hits, accounts not in entropy results). This is expected — proceed with available data and flag gaps in the Classification phase. An account with minimal data produces a low-confidence assessment, not an error.
