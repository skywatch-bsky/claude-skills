# osprey_execution_results Schema

The `osprey_execution_results` table in ClickHouse stores the execution history of Osprey moderation rules. Each row represents a single rule evaluation against a post or account on the AT Protocol.

<!-- TODO: populate from live ClickHouse — Run DESCRIBE TABLE default.osprey_execution_results and enumerate all columns below with actual ClickHouse types -->

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
