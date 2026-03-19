---
name: accessing-osprey
description: Understanding the Osprey moderation infrastructure — system architecture, ClickHouse data access, schema reference, and relationship to Ozone labelling. Use when investigating AT Protocol accounts or reviewing rule execution data.
user-invocable: false
---

# Accessing Osprey

This skill provides foundational knowledge for accessing, understanding, and querying Osprey rule execution data in ClickHouse. Use this when you need to investigate rule matches, account behavior, or rule performance.

## What Is Osprey

Osprey is a moderation rule engine for the AT Protocol (Bluesky). It runs continuously, evaluates user-defined rules against the global firehose of posts and other events, and records the results in a ClickHouse table called `osprey_execution_results`.

Rules in Osprey are written in SML (a Python-like domain-specific language). Each rule is a predicate that returns true/false or a numeric score indicating whether a piece of content or an account matches the rule criteria.

Key point: Osprey **detects**. It does not label or enforce policy directly. Its output informs human moderators and automated systems (like Ozone) about which accounts or posts match which rules.

## System Topology

```
AT Protocol Firehose
    ↓
Osprey Rule Engine (runs continuously)
    ├─ Reads: All posts, profiles, follows, other events
    ├─ Applies: User-defined rules (SML)
    ├─ Records: Execution results in ClickHouse
    └─ Outputs: osprey_execution_results table
        ↓
Investigation / Analysis / Labelling Decisions
```

### How It Works

1. **Event Stream**: The AT Protocol firehose emits events (new posts, profile updates, follows, etc.)
2. **Rule Evaluation**: Osprey evaluates each rule against each event
3. **Result Recording**: If a rule matches (or scores above a threshold), Osprey writes a row to `osprey_execution_results`
4. **Data Availability**: Investigators and moderators query ClickHouse to understand which accounts are triggering which rules

## ClickHouse Data Access

### Connection Modes

The MCP server supports two modes for accessing ClickHouse:

**Mode 1: Direct Connection**

Connect directly to a ClickHouse server. Requires:
- Host and port of the ClickHouse server
- Username and password (read-only)
- Network access to the server

**Mode 2: SSH Tunnel**

Connect via SSH to a remote host running Docker, then query ClickHouse inside the container. Requires:
- SSH credentials (username, password or key)
- Remote host with ClickHouse in Docker
- Docker container name and database name

Both modes use the same query interface and return identical results.

### Table to Query

All investigation queries target the single table:

```
default.osprey_execution_results
```

This is a read-only table. The MCP server enforces:
- **SELECT only** — No INSERT, UPDATE, DELETE
- **LIMIT required** — All queries must have a LIMIT clause
- **Table restriction** — Only `osprey_execution_results` may be queried
- **Timeout** — Queries that run longer than 60 seconds are cancelled

These constraints are enforced at the MCP layer before queries reach ClickHouse.

### Query Tool

Use the `clickhouse_schema` MCP tool to get column metadata:

```
Tool: clickhouse_schema
Purpose: Return column names and types for osprey_execution_results
```

Use the `clickhouse_query` MCP tool to execute SELECT queries:

```
Tool: clickhouse_query
Parameters:
  query: SELECT ... FROM default.osprey_execution_results WHERE ... LIMIT ...
Purpose: Execute read-only queries, return results as JSON
```

## Relationship to Ozone

Ozone is the labelling system for the AT Protocol. It allows moderators to apply labels to accounts, posts, and other objects.

**Osprey → Ozone flow:**

1. Osprey rule detects problematic content (rule matches)
2. Investigator reviews Osprey data via ClickHouse queries
3. Investigator uses the `ozone_label` MCP tool to apply a label
4. Ozone records the label, which may affect visibility/filtering of that content

Osprey data informs labelling decisions, but the two are separate systems:
- Osprey is **automated** detection
- Ozone is **manual** labelling (though it can be automated via orchestration)

## Relationship to osprey-rules Plugin

The `osprey-rules` plugin is for **writing** rules (authoring SML).

This skill is for **accessing** and **querying** rule execution data (understanding results).

If you need to:
- Write a new rule → Use `osprey-rules` plugin and `authoring-osprey-rules` skill
- Review/debug a rule → Use `osprey-rules` plugin and `reviewing-osprey-rules` skill
- Query rule results → Use this skill and `querying-clickhouse` skill

## Schema Reference

For the complete column listing, column types, and semantic descriptions, see:

**`references/osprey-schema.md`** — Full schema documentation

Key columns for investigations:
- `created_at` — When the rule was evaluated (UTC)
- `rule_name` — Which rule matched
- `did` — AT Protocol account DID
- `handle` — AT Protocol username
- `content` — Text that was evaluated
- `matched` — Whether the rule matched (true/false)
- `score` — Numeric output from the rule
- `pds_host` — Which PDS the account uses

## Common Investigation Patterns

Investigation queries usually follow these patterns:

**Find all rule matches for a specific account:**
```sql
SELECT rule_name, created_at, score
FROM default.osprey_execution_results
WHERE did = 'did:plc:xxx...' AND created_at > now() - interval 7 day
LIMIT 100
```

**Find accounts triggering a specific rule:**
```sql
SELECT DISTINCT did, handle
FROM default.osprey_execution_results
WHERE rule_name = 'spam-bot-pattern' AND matched = true AND created_at > now() - interval 1 day
LIMIT 50
```

**Analyze rule performance:**
```sql
SELECT rule_name, count() as hits, avg(score) as avg_score
FROM default.osprey_execution_results
WHERE created_at > now() - interval 7 day
GROUP BY rule_name
LIMIT 100
```

For 15+ proven query patterns, see the `querying-clickhouse` skill.

## Performance Tips

1. **Always filter by time** — `created_at` filtering is critical for performance
2. **Use LIMIT** — Results can be large; always limit rows
3. **Select specific columns** — Avoid SELECT *; ClickHouse is column-oriented, so fewer columns = faster queries
4. **Index awareness** — Common filters like `did`, `handle`, and `rule_name` are indexed
5. **Content search is expensive** — If searching by `content` or using ngramDistance, narrow the time range and/or add other filters

## Next Steps

- Read `references/osprey-schema.md` to understand all available columns
- Load the `querying-clickhouse` skill to learn 15+ proven query patterns
- Use the `clickhouse_query` MCP tool to execute exploratory queries
