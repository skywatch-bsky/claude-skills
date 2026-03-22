# osprey_execution_results Schema

The `osprey_execution_results` table in ClickHouse stores the execution history of Osprey moderation rules. Each row represents a single rule evaluation against a post or account on the AT Protocol.

<!-- TODO: populate from live ClickHouse — Run DESCRIBE TABLE default.osprey_execution_results and enumerate all columns below with actual ClickHouse types -->

> **⚠ Inferred Columns**
>
> The columns listed below are inferred from exploratory queries and sample data. They should be verified against the actual schema using `DESCRIBE TABLE default.osprey_execution_results` in ClickHouse. Column types, presence, and semantics may differ from what's documented here. Always validate the live schema before relying on this reference for query optimization or data interpretation.

## Core Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | String | Unique identifier for the execution record |
| `created_at` | DateTime | UTC timestamp when the rule was evaluated |
| `rule_name` | String | Name of the Osprey rule that was executed |
| `rule_id` | String | Unique identifier for the rule definition |

## AT Protocol Identifier Columns

| Column | Type | Description |
|--------|------|-------------|
| `did` | String | DID (Decentralized Identifier) of the AT Protocol account being evaluated. Format: `did:plc:xxxxx...` |
| `handle` | String | Human-readable username of the account. Format: `username.bsky.social` or custom domain |
| `uri` | String | AT-URI of the content being evaluated. Format: `at://did:plc:xxxxx/app.bsky.feed.post/rkey` |

## Content Columns

| Column | Type | Description |
|--------|------|-------------|
| `content` | String | Full text content of the post or record being evaluated |
| `content_hash` | String | Hash of the content for deduplication and matching |

## Evaluation Result Columns

| Column | Type | Description |
|--------|------|-------------|
| `matched` | Boolean | Whether the rule matched (true) or not (false) |
| `score` | Float | Numeric score output by the rule (0-1 range typically, but rule-dependent) |
| `confidence` | Float | Confidence score for the match (0-1 range) |

## Account Metadata Columns

| Column | Type | Description |
|--------|------|-------------|
| `account_age_days` | Int32 | Age of the account in days at time of evaluation |
| `follower_count` | Int64 | Number of followers the account had at evaluation time |
| `post_count` | Int64 | Number of posts the account had made at evaluation time |

## Infrastructure Columns

| Column | Type | Description |
|--------|------|-------------|
| `pds_host` | String | Personal Data Server (PDS) host where the account is hosted. Format: `example.com` |
| `pds_instance_id` | String | Internal identifier for the PDS instance |

## Execution Context Columns

| Column | Type | Description |
|--------|------|-------------|
| `event_type` | String | Type of AT Protocol event triggered evaluation: `post`, `profile`, `follow`, etc. |
| `rule_category` | String | Categorization of the rule: `spam`, `abuse`, `policy`, `quality`, etc. |

## Common Filter Columns

These columns are frequently used in WHERE clauses for investigation queries:

- **`created_at`** — Filter by date range (most critical for performance)
- **`rule_name`** — Filter by specific rule
- **`did`** — Filter by account DID
- **`handle`** — Filter by account handle
- **`matched`** — Filter for actual matches (true) vs. non-matches (false)
- **`pds_host`** — Filter by PDS host for infrastructure analysis

## AT Protocol Identifier Formats

### DID (Decentralized Identifier)

Format: `did:plc:` followed by base32-encoded identifier

Example: `did:plc:x4jwkycm6wq3yvlq4xxd7zxdx`

Use for exact account matching and cross-table joins.

### Handle

Format: `username.domain` or `username.bsky.social`

Examples:
- `alice.bsky.social`
- `custom.example.com`

Handles are user-facing but can change; DIDs are permanent.

### AT-URI

Format: `at://` + DID + `/` + collection + `/` + record key

Example: `at://did:plc:xxx/app.bsky.feed.post/abc123xyz`

Uniquely identifies a post or other AT Protocol record.

## Performance Notes

<!-- TODO: populate from live ClickHouse — Add actual data volume, time range, and query performance characteristics -->

- **Data volume**: [TODO: total row count]
- **Time range covered**: [TODO: min/max created_at values]
- **Table size on disk**: [TODO: estimated size in MB/GB]

## Query Optimization

ClickHouse is column-oriented, so query performance depends on:

1. **Time filtering** — Always include a `created_at` range in WHERE clauses. This is the primary partitioning key.
2. **Column selection** — SELECT only columns you need. Avoid SELECT *.
3. **LIMIT** — Always include LIMIT to cap result set size.
4. **Index columns** — `did`, `handle`, and `rule_name` are frequently indexed. Use them in WHERE clauses when possible.

## Example Queries

See `querying-clickhouse` skill for 15+ proven query patterns.

## Notes on Data Semantics

- **Null values**: Columns may contain NULL if data was not available at evaluation time
- **Timestamps**: All `created_at` values are in UTC
- **Scores**: Rule-specific and can vary widely (0-1, 0-100, or other ranges depending on the rule)

---

# url_overdispersion_results Schema

The `url_overdispersion_results` table stores output from the URL overdispersion sidecar. Each row represents a domain's sharing statistics within a time bucket, scored against its baseline.

## Columns

| Column | Type | Description |
|--------|------|-------------|
| `run_timestamp` | DateTime64(3) | When the sidecar analysis cycle ran |
| `granularity` | Enum8('hourly'=1, 'daily'=2) | Time bucket granularity |
| `domain` | String | The domain being shared (e.g., `example.com`) |
| `bucket_start` | DateTime64(3) | Start of the time bucket being analysed |
| `total_shares` | UInt64 | Total number of shares of this domain in the bucket |
| `unique_sharers` | UInt64 | Number of distinct accounts that shared this domain |
| `sharer_density` | Float64 | Ratio of unique_sharers to total_shares (high = many one-time sharers) |
| `expected_volume_lambda` | Float64 | Baseline expected share rate (Poisson lambda) |
| `expected_density_lambda` | Float64 | Baseline expected sharer density |
| `volume_p_value` | Float64 | p-value for volume anomaly (low = statistically surprising volume) |
| `density_p_value` | Float64 | p-value for density anomaly (low = statistically surprising density) |
| `is_anomaly` | UInt8 | 1 if either volume or density p-value crossed the threshold |
| `baseline_source` | Enum8('entity'=1, 'population'=2) | Whether baseline comes from domain's own history or population median |
| `baseline_days_available` | UInt16 | Days of historical data used for baseline |
| `sample_dids` | Array(String) | Sample DIDs of accounts that shared this domain |
| `sample_urls` | Array(String) | Sample full URLs shared |
| `on_watchlist` | UInt8 | 1 if domain is on the configured watchlist |

## Ordering Key

`(run_timestamp, granularity, domain)` — filter by run_timestamp for performance.

## Common Filters

- `is_anomaly = 1` — only anomalous domains
- `granularity = 'hourly'` or `granularity = 'daily'` — select time resolution
- `volume_p_value < 0.01` — volume-only anomalies
- `density_p_value < 0.01` — density-only anomalies
- `baseline_source = 'entity'` — domains with established baselines (more reliable)
- `on_watchlist = 1` — pre-identified domains of interest

---

# account_entropy_results Schema

The `account_entropy_results` table stores output from the account entropy sidecar. Each row represents an account's temporal posting pattern analysis over a time window.

## Columns

| Column | Type | Description |
|--------|------|-------------|
| `run_timestamp` | DateTime64(3) | When the sidecar analysis cycle ran |
| `user_id` | String | DID of the AT Protocol account being analysed |
| `window_start` | DateTime64(3) | Start of the analysis time window |
| `window_end` | DateTime64(3) | End of the analysis time window |
| `post_count` | UInt64 | Number of posts in the window |
| `hourly_entropy` | Float64 | Shannon entropy over hour-of-day distribution (0–4.585 bits; high = uniform across hours = bot-like) |
| `interval_entropy` | Float64 | Shannon entropy over inter-post interval distribution (0–2.81 bits; low = regular spacing = bot-like) |
| `mean_interval_seconds` | Float64 | Average gap between consecutive posts in seconds |
| `stddev_interval_seconds` | Float64 | Standard deviation of inter-post intervals in seconds |
| `is_bot_like` | UInt8 | 1 only when both hourly_flag AND interval_flag are set (conjunction) |
| `hourly_flag` | UInt8 | 1 if hourly_entropy >= threshold (default 3.9) |
| `interval_flag` | UInt8 | 1 if interval_entropy <= threshold (default 1.5) |
| `sample_rkeys` | Array(String) | Sample AT Protocol record keys for manual review |

## Ordering Key

`(run_timestamp, user_id)` — filter by run_timestamp for performance.

## Common Filters

- `is_bot_like = 1` — accounts flagged by both signals (highest confidence)
- `hourly_flag = 1` — accounts with uniform hour-of-day posting (may include shift workers)
- `interval_flag = 1` — accounts with mechanically regular posting intervals
- `post_count > 50` — focus on high-volume accounts

## Interpreting Entropy Values

| Metric | Human-like | Bot-like |
|--------|-----------|----------|
| `hourly_entropy` | 1.5–2.5 bits (concentrated in a few hours) | ≥ 3.9 bits (spread across 15+ hours) |
| `interval_entropy` | 2.0–2.8 bits (varied gaps) | ≤ 1.5 bits (regular gaps) |

The conjunction requirement (`is_bot_like` = both flags) substantially reduces false positives. Individual flags are useful for softer screening.
