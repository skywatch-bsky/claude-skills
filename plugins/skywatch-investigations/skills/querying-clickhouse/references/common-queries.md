# Common Investigation Queries

This reference provides 20 proven query patterns for investigating rule hits and account behavior on the Osprey platform. Use these as starting points for your own investigations.

---

## 1. All Rule Hits for a Specific DID

**Purpose:** Find every rule that matched for a particular account. Use when investigating a specific account's violations.

**SQL:**
```sql
SELECT
  rule_name,
  created_at,
  matched,
  score,
  content_hash
FROM default.osprey_execution_results
WHERE did = 'did:plc:xxx...'
  AND created_at > now() - interval 7 day
ORDER BY created_at DESC
LIMIT 100
```

**Output:** Rows are ordered newest-first. `matched = true` indicates actual rule matches. `score` shows the severity.

**Notes:** Replace `did:plc:xxx...` with the target DID. Adjust the time range (7 day) as needed. For very active accounts, reduce the time window to avoid hitting LIMIT.

---

## 2. All Rule Hits for a Specific Handle

**Purpose:** Find all rule hits for an account identified by handle (username). Similar to query 1, but using the human-readable handle.

**SQL:**
```sql
SELECT
  rule_name,
  created_at,
  matched,
  score,
  account_age_days,
  follower_count,
  post_count
FROM default.osprey_execution_results
WHERE handle = 'alice.bsky.social'
  AND created_at > now() - interval 7 day
ORDER BY created_at DESC
LIMIT 100
```

**Output:** Shows rule hits plus account metadata (age, followers, posts). Metadata helps assess account legitimacy.

**Notes:** Replace `alice.bsky.social` with the target handle. Handles can change; prefer DID for permanent account tracking.

---

## 3. Accounts Triggering a Specific Rule (Recent)

**Purpose:** Find all accounts that triggered a particular rule in the last N days. Use when a rule is firing too much or when investigating a specific violation type.

**SQL:**
```sql
SELECT DISTINCT
  did,
  handle,
  count() as hit_count,
  max(created_at) as latest_hit
FROM default.osprey_execution_results
WHERE rule_name = 'spam-bot-pattern'
  AND matched = true
  AND created_at > now() - interval 1 day
GROUP BY did, handle
ORDER BY hit_count DESC
LIMIT 50
```

**Output:** Aggregated view of accounts. `hit_count` shows how many times each account triggered the rule. `latest_hit` shows the most recent trigger.

**Notes:** Replace `spam-bot-pattern` with the rule name. Adjust time window (1 day) to match investigation scope.

---

## 4. Top Offenders by Total Rule Hits

**Purpose:** Identify accounts with the most rule matches across all rules. Useful for finding repeat violators.

**SQL:**
```sql
SELECT
  did,
  handle,
  count() as total_hits,
  count(DISTINCT rule_name) as unique_rules_triggered,
  max(created_at) as latest_hit
FROM default.osprey_execution_results
WHERE matched = true
  AND created_at > now() - interval 7 day
GROUP BY did, handle
ORDER BY total_hits DESC
LIMIT 100
```

**Output:** Ranked by total rule hits. `unique_rules_triggered` shows diversity of violations (1 rule vs. many rules).

**Notes:** Time window defaults to 7 days; adjust for longer-term analysis. High `unique_rules_triggered` suggests systematic abuse.

---

## 5. Rule Hit Volume by Hour (Last 24 Hours)

**Purpose:** Detect activity spikes or temporal patterns. Use when investigating coordinated or bot-like activity.

**SQL:**
```sql
SELECT
  toStartOfHour(created_at) as hour,
  rule_name,
  count() as hits,
  count(DISTINCT did) as unique_accounts
FROM default.osprey_execution_results
WHERE created_at > now() - interval 1 day
  AND matched = true
GROUP BY hour, rule_name
ORDER BY hour DESC
LIMIT 100
```

**Output:** Rows grouped by hour. Shows both total hits and unique accounts per hour, revealing spikes and concentration.

**Notes:** Use `toStartOfDay()` for daily buckets, `toStartOfWeek()` for weekly. Adjust time range as needed.

---

## 6. Activity Timeline for a Specific Account

**Purpose:** See when an account was active and what rules it triggered. Useful for temporal correlation with external events.

**SQL:**
```sql
SELECT
  toStartOfDay(created_at) as day,
  rule_name,
  count() as hits,
  avg(score) as avg_score
FROM default.osprey_execution_results
WHERE did = 'did:plc:xxx...'
  AND created_at > now() - interval 30 day
GROUP BY day, rule_name
ORDER BY day DESC
LIMIT 100
```

**Output:** Daily aggregation showing when the account was most active and which rules triggered. Patterns suggest activity cycles.

**Notes:** Replace DID. For very active accounts, reduce time range. This query reveals whether activity is consistent or episodic.

---

## 7. Burst Detection (High-Frequency Activity)

**Purpose:** Find accounts posting at abnormally high frequency, which suggests bots or coordinated behavior.

**SQL:**
```sql
SELECT
  did,
  handle,
  toStartOfDay(created_at) as day,
  count() as daily_hits,
  count(DISTINCT toHour(created_at)) as hours_active
FROM default.osprey_execution_results
WHERE event_type = 'post'
  AND created_at > now() - interval 7 day
GROUP BY did, handle, day
HAVING daily_hits > 50
ORDER BY daily_hits DESC
LIMIT 100
```

**Output:** Accounts with >50 hits/day. `hours_active` shows how spread the activity was (1 hour = concentrated burst; 24 hours = sustained).

**Notes:** Adjust the HAVING threshold (>50) based on network norms. Higher thresholds catch more extreme behavior.

---

## 8. Content Similarity Search (Copypasta Detection)

**Purpose:** Find posts similar to a target text (copypasta, mass-produced content, etc.). Uses n-gram distance.

**SQL:**
```sql
SELECT
  did,
  handle,
  content,
  created_at,
  ngramDistance(content, 'target content phrase') as similarity
FROM default.osprey_execution_results
WHERE created_at > now() - interval 1 day
  AND ngramDistance(content, 'target content phrase') > 0.5
ORDER BY similarity DESC
LIMIT 50
```

**Output:** Ranked by similarity (higher = more similar). `similarity` is a score from 0 (no match) to 1 (identical).

**Notes:** Replace `target content phrase` with actual text. The threshold (>0.5) can be adjusted: 0.7+ for near-exact matches, 0.3-0.5 for loose similarity. Time-narrow for performance.

---

## 9. Most Common Content Pattern for a Rule

**Purpose:** Identify what content most commonly triggers a rule. Useful for understanding false positives or rule precision.

**SQL:**
```sql
SELECT
  content,
  count() as occurrences,
  count(DISTINCT did) as unique_accounts,
  avg(score) as avg_score
FROM default.osprey_execution_results
WHERE rule_name = 'hate-speech-detector'
  AND matched = true
  AND created_at > now() - interval 7 day
GROUP BY content
ORDER BY occurrences DESC
LIMIT 50
```

**Output:** Content ranked by frequency. Shows exact text strings and how many accounts posted them.

**Notes:** Replace rule name. For high-frequency content (retweets, etc.), this reveals coordinated behavior. For low-frequency, helps identify novel patterns.

---

## 10. Content Clustering by Similarity

**Purpose:** Group similar content together to identify thematic patterns or coordinated messaging.

**SQL:**
```sql
SELECT
  rule_name,
  content,
  count() as count,
  count(DISTINCT did) as unique_accounts
FROM default.osprey_execution_results
WHERE rule_name = 'spam-promotion'
  AND matched = true
  AND created_at > now() - interval 1 day
  AND length(content) > 50
GROUP BY rule_name, content
HAVING count > 2
ORDER BY count DESC
LIMIT 100
```

**Output:** Grouped by exact content. HAVING filter (>2 occurrences) shows duplicated/clustered messages only.

**Notes:** Adjust `length(content) > 50` to filter by message length. Small HAVING thresholds (>1) reveal even minor duplication.

---

## 11. Accounts Sharing the Same PDS Host

**Purpose:** Identify accounts on the same Personal Data Server. Can reveal coordinated networks (same provider used for bot armies).

**SQL:**
```sql
SELECT
  pds_host,
  count(DISTINCT did) as unique_accounts,
  count() as total_hits,
  avg(account_age_days) as avg_age_days
FROM default.osprey_execution_results
WHERE matched = true
  AND created_at > now() - interval 7 day
GROUP BY pds_host
ORDER BY unique_accounts DESC
LIMIT 50
```

**Output:** Ranked by account count per host. `avg_age_days` shows if this host is favoured by new accounts (indicator of bot networks).

**Notes:** PDS hosts like `bsky.social`, `mostr.pub`, etc. High concentrations on non-mainstream hosts are suspicious.

---

## 12. Accounts Created in the Same Time Window

**Purpose:** Detect potential bot armies or coordinated account creation campaigns.

**SQL:**
```sql
SELECT
  toStartOfDay(created_at) as creation_day,
  count(DISTINCT did) as new_accounts,
  count() as rule_hits
FROM default.osprey_execution_results
WHERE account_age_days < 7
  AND created_at > now() - interval 30 day
GROUP BY creation_day
ORDER BY new_accounts DESC
LIMIT 50
```

**Output:** Days when many new accounts triggered rules. Spikes indicate coordinated creation campaigns.

**Notes:** Adjust `account_age_days < 7` to control age window (e.g., `< 1` for accounts created today). This helps spot waves of bot activity.

---

## 13. Cross-Signal Correlation (Same Content + PDS + Time)

**Purpose:** Identify highly coordinated activity by correlating multiple signals: same content, same PDS, similar timestamps.

**SQL:**
```sql
SELECT
  content_hash,
  pds_host,
  toStartOfHour(created_at) as hour,
  count(DISTINCT did) as unique_accounts,
  count() as total_hits
FROM default.osprey_execution_results
WHERE content_hash IS NOT NULL
  AND created_at > now() - interval 1 day
  AND matched = true
GROUP BY content_hash, pds_host, hour
HAVING unique_accounts > 3
ORDER BY unique_accounts DESC
LIMIT 100
```

**Output:** Clusters of identical or very similar content from the same PDS in the same hour window.

**Notes:** HAVING filter (>3 accounts) identifies suspicious coordination. Adjust threshold to sensitivity.

---

## 14. Hit Rate and Coverage per Rule

**Purpose:** Understand how often each rule fires and how much of the network it covers. Informs rule tuning and prioritization.

**SQL:**
```sql
SELECT
  rule_name,
  count() as total_evaluations,
  count() FILTER (WHERE matched = true) as matches,
  round(100.0 * count() FILTER (WHERE matched = true) / count(), 2) as match_rate,
  count(DISTINCT did) as unique_accounts_hit,
  avg(score) as avg_score
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day
GROUP BY rule_name
ORDER BY match_rate DESC
LIMIT 50
```

**Output:** Rules ranked by match rate (%). Shows how selective each rule is and how many accounts it affects.

**Notes:** Rules with high match rates (20%+) may be too permissive. Rules with very low rates (<1%) may be too strict.

---

## 15. False Positive Candidates (Rule Hits on Established Accounts)

**Purpose:** Identify accounts that are old and established (high follower count, many posts) but still trigger rules. These are likely false positives.

**SQL:**
```sql
SELECT
  did,
  handle,
  rule_name,
  account_age_days,
  follower_count,
  post_count,
  created_at,
  score
FROM default.osprey_execution_results
WHERE matched = true
  AND account_age_days > 365
  AND follower_count > 1000
  AND post_count > 1000
  AND created_at > now() - interval 7 day
ORDER BY follower_count DESC
LIMIT 100
```

**Output:** Rule hits on old, popular accounts. High follower/post counts suggest legitimate users, making rule matches suspicious.

**Notes:** Adjust thresholds (`account_age_days > 365`, `follower_count > 1000`) based on your network. Results here should be reviewed manually.

---

## 16. New Rule Coverage Analysis

**Purpose:** See how a newly deployed rule is performing and what it's catching.

**SQL:**
```sql
SELECT
  rule_name,
  matched,
  count() as hits,
  count(DISTINCT did) as unique_accounts,
  min(created_at) as first_hit,
  max(created_at) as latest_hit,
  avg(score) as avg_score,
  percentile(0.95)(score) as p95_score
FROM default.osprey_execution_results
WHERE rule_name IN ('new-rule-v1', 'new-rule-v2')
GROUP BY rule_name, matched
ORDER BY rule_name, matched DESC
LIMIT 50
```

**Output:** Coverage stats for new rules. `percentile(0.95)(score)` shows the 95th percentile score (helps tune thresholds).

**Notes:** Use for monitoring newly deployed rules during their first week. Adjust rule names as needed.

---

## 17. Rule Sensitivity Analysis (Score Distribution)

**Purpose:** Analyze the distribution of scores for a rule to inform threshold tuning.

**SQL:**
```sql
SELECT
  rule_name,
  count() as total,
  min(score) as min_score,
  percentile(0.25)(score) as p25,
  percentile(0.50)(score) as p50_median,
  percentile(0.75)(score) as p75,
  max(score) as max_score,
  avg(score) as avg_score,
  stddevPop(score) as std_dev
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day
GROUP BY rule_name
LIMIT 100
```

**Output:** Score distribution (quartiles, mean, std dev). Helps identify whether scores cluster or spread widely.

**Notes:** Rules with bimodal distributions (gaps in quartiles) may have two distinct populations (true positives vs. false positives).

---

## 18. Event Type Distribution (Content Types Evaluated)

**Purpose:** Understand what types of content the Osprey platform evaluates. Useful for rule scope validation.

**SQL:**
```sql
SELECT
  event_type,
  rule_category,
  count() as evaluations,
  count() FILTER (WHERE matched = true) as matches,
  count(DISTINCT rule_name) as unique_rules
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day
GROUP BY event_type, rule_category
ORDER BY evaluations DESC
LIMIT 50
```

**Output:** Breakdown of evaluated content types (post, profile, follow, etc.) and which rule categories match them.

**Notes:** Helps confirm that rules are being applied to the intended content types.

---

## 19. Recent Query Diagnostics (Last 100 Evaluations)

**Purpose:** Quick diagnostic to spot unusual recent activity or rule behavior anomalies.

**SQL:**
```sql
SELECT
  created_at,
  rule_name,
  did,
  handle,
  matched,
  score,
  event_type
FROM default.osprey_execution_results
WHERE created_at > now() - interval 1 hour
ORDER BY created_at DESC
LIMIT 100
```

**Output:** Raw recent evaluations. Use for real-time monitoring and quick sanity checks.

**Notes:** Useful for verifying that rules are running and data is flowing. Check if expected rules appear.

---

## 20. Query Metadata Completeness Check

**Purpose:** Validate data quality by checking for NULL values in critical columns.

**SQL:**
```sql
SELECT
  'created_at' as column_name,
  count() FILTER (WHERE created_at IS NULL) as null_count,
  count() as total_rows
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day

UNION ALL

SELECT
  'did',
  count() FILTER (WHERE did IS NULL),
  count()
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day

UNION ALL

SELECT
  'rule_name',
  count() FILTER (WHERE rule_name IS NULL),
  count()
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day

UNION ALL

SELECT
  'matched',
  count() FILTER (WHERE matched IS NULL),
  count()
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day

LIMIT 100
```

**Output:** NULL value counts per critical column. High NULLs indicate data quality issues.

**Notes:** Run periodically to monitor data integrity. NULLs in `did`, `rule_name`, or `matched` suggest upstream problems.

---

## Notes on Query Adaptation

These queries are templates. Adapt them by:

1. **Replacing filter values**: DID, handle, rule name, time ranges
2. **Adjusting aggregation levels**: Use `GROUP BY` to slice data different ways
3. **Changing time windows**: `now() - interval 1 day` to `7 day`, `30 day`, etc.
4. **Adding filters**: Combine multiple WHERE conditions for more specific investigations
5. **Tuning LIMIT**: Start with 50-100, increase if needed for comprehensive analysis

Always start with a conservative LIMIT and expand if results are useful. Remember the 60-second timeout: overly broad queries will fail. Time-narrow and filter aggressively.
