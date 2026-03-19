---
name: querying-clickhouse
description: Query patterns, safety rules, and performance tips for ClickHouse investigation queries against osprey_execution_results. Use when writing or reviewing ClickHouse queries for investigations.
user-invocable: false
---

# Querying ClickHouse

This skill provides essential knowledge for writing safe, efficient queries against Osprey rule execution data. Use this when you need to investigate account behavior, analyze rule performance, or detect patterns.

## Safety Rules

The ClickHouse MCP server enforces strict safety constraints on all queries:

**SELECT Only**

All queries must be SELECT statements. No INSERT, UPDATE, DELETE, or DDL operations are permitted.

**LIMIT Required**

Every query must include a LIMIT clause. This prevents accidental runaway queries and caps result set sizes.

```sql
-- Good
SELECT ... FROM default.osprey_execution_results WHERE ... LIMIT 100

-- Bad (will be rejected)
SELECT ... FROM default.osprey_execution_results WHERE ...
```

**Table Restriction**

Only the `default.osprey_execution_results` table may be queried. Joins, subqueries targeting other tables, and cross-database queries are blocked.

```sql
-- Good
SELECT * FROM default.osprey_execution_results WHERE ...

-- Bad (will be rejected)
SELECT * FROM default.osprey_execution_results o
JOIN users u ON o.did = u.did WHERE ...
```

**60-Second Timeout**

Queries running longer than 60 seconds are automatically cancelled. This encourages efficient query design and prevents resource exhaustion.

**Constraint Enforcement**

These constraints are enforced at the MCP layer *before* queries reach ClickHouse, so policy violations are caught early.

## Query Structure Best Practices

Follow this pattern for reliable, performant queries:

### 1. Filter by Time Range First

ClickHouse tables are time-partitioned. Always include a `created_at` filter to dramatically improve performance.

```sql
SELECT rule_name, count() as hits
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day
GROUP BY rule_name
LIMIT 100
```

Without time filtering, queries may scan the entire table and timeout.

### 2. Select Specific Columns

Avoid `SELECT *`. ClickHouse is column-oriented, so selecting only needed columns significantly improves query speed.

```sql
-- Good (fast)
SELECT did, handle, rule_name, created_at
FROM default.osprey_execution_results
WHERE created_at > now() - interval 1 day
LIMIT 100

-- Bad (slow)
SELECT *
FROM default.osprey_execution_results
WHERE created_at > now() - interval 1 day
LIMIT 100
```

### 3. Use LIMIT Generously

Start with conservative LIMIT values (10-100) for exploratory queries, and increase only if needed.

```sql
-- Safe for exploration
SELECT ...
LIMIT 50

-- For comprehensive analysis, still cap results
SELECT ...
LIMIT 10000
```

### 4. Filter Indexed Columns When Possible

The following columns are indexed and filter efficiently:
- `created_at` — Timestamp (most important)
- `did` — Account DID
- `handle` — Account handle
- `rule_name` — Rule name

Use these in WHERE clauses whenever possible.

```sql
SELECT * FROM default.osprey_execution_results
WHERE rule_name = 'spam-bot-pattern'
  AND created_at > now() - interval 1 day
LIMIT 100
```

## Performance Tips

### Content Search Is Expensive

The `ngramDistance()` function searches for similar text by n-gram comparison. It's powerful but slow.

Always pair `ngramDistance()` with other filters:

```sql
-- Good: narrow context with time + ngramDistance
SELECT did, handle, content
FROM default.osprey_execution_results
WHERE created_at > now() - interval 1 day
  AND ngramDistance(content, 'target phrase') > 0.5
LIMIT 50

-- Bad: ngramDistance alone scans all content
SELECT ...
WHERE ngramDistance(content, 'target phrase') > 0.5
LIMIT 100
```

### Aggregate Queries Are Fast

GROUP BY queries are typically faster than raw row selection, because aggregation reduces result set size.

```sql
-- Fast: aggregates reduce data volume
SELECT rule_name, count() as hits, avg(score) as avg_score
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day
GROUP BY rule_name
LIMIT 50

-- Slower: full row enumeration
SELECT rule_name, score
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day
LIMIT 1000
```

### Avoid Expensive Operations

- **String concatenation** in WHERE clauses
- **Function calls** on large datasets (e.g., `LOWER(content)` for every row)
- **Subqueries** (use JOIN patterns instead if possible, though joins are limited to the same table)

## Common Query Patterns Overview

Investigation queries typically fall into five categories:

### Account Queries

Find all rule hits for a specific account, or identify accounts triggering specific rules.

See `references/common-queries.md` for patterns:
- All rule hits for a DID
- All rule hits for a handle
- Accounts triggering a rule in a time window
- Top offenders by rule hits

### Temporal Queries

Analyze rule hit volume and account activity over time. Useful for spike detection and trend analysis.

See `references/common-queries.md` for patterns:
- Rule hit volume bucketed by hour/day
- Account activity timeline
- Burst detection (high-frequency posting)

### Content Queries

Use n-gram distance to detect similar content (copypasta detection), find common patterns, and cluster content by similarity.

See `references/common-queries.md` for patterns:
- Content similarity search
- Most common content for a rule
- Content clustering

### Infrastructure Queries

Correlate accounts by shared infrastructure: PDS host, account creation time, etc.

See `references/common-queries.md` for patterns:
- Accounts sharing a PDS host
- Accounts created in the same time window
- Cross-signal correlation

### Rule Performance Queries

Analyze rule hit rates, false positive candidates, and coverage across the network.

See `references/common-queries.md` for patterns:
- Hit rate per rule
- False positive candidates
- Rule coverage analysis

## Column Quick Reference

Most-used columns for investigation queries. See `accessing-osprey` skill's schema reference for the complete listing.

| Column | Type | Use Case |
|--------|------|----------|
| `created_at` | DateTime | Filter by date range (always include for performance) |
| `did` | String | Filter by account DID |
| `handle` | String | Filter by account handle |
| `rule_name` | String | Filter by rule name |
| `matched` | Boolean | Filter for actual matches (true) or non-matches (false) |
| `score` | Float | Aggregate (avg, max) to analyze rule sensitivity |
| `content` | String | Text search with ngramDistance() |
| `content_hash` | String | Deduplication and content matching |
| `pds_host` | String | Infrastructure correlation |
| `account_age_days` | Int32 | Filter by account age |
| `follower_count` | Int64 | Identify established vs. new accounts |
| `post_count` | Int64 | Identify prolific accounts |
| `event_type` | String | Filter by content type (post, profile, etc.) |
| `rule_category` | String | Filter by rule category (spam, abuse, policy, etc.) |

## Output Interpretation

### Understanding Matched vs. Score

Rules can output either a boolean (matched: true/false) or a numeric score (0-1 or rule-specific range).

**Boolean-output rules:**
- `matched = true` means the rule fired
- `matched = false` means it didn't
- `score` will be 0 or 1

**Numeric-output rules:**
- `score` is a continuous value
- `matched = true` if score exceeded the rule's threshold
- `matched = false` if score was below threshold
- Compare scores across accounts to identify degrees of severity

### Confidence Scores

The `confidence` column (0-1) indicates how sure the rule is. High confidence (>0.8) is more reliable.

### Interpreting NULL Values

NULL values in columns like `follower_count` or `post_count` indicate data was unavailable at evaluation time (account deleted, suspended, etc.).

## Next Steps

- Review `references/common-queries.md` for 15+ proven query patterns
- Start with Account investigation queries to understand your targets
- Use Temporal queries to identify trends
- Use Content queries for copypasta and similarity detection
- Use Infrastructure queries for network analysis
- Use Rule Performance queries to optimize rule definitions
