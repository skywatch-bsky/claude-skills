---
name: classify-cluster
description: >-
  Narrative classification of co-sharing clusters on AT Protocol. Analyses cluster
  member content, identifies dominant narratives, coordination signals, shared
  sources, and likely origin. Distinguishes information operations from organic
  coordination. Use when a co-sharing cluster is identified during Phase 3
  (Linkage) or Phase 4 (Amplification), or as a standalone cluster assessment.
user-invocable: false
---

# Classify Cluster

This skill guides narrative classification of co-sharing clusters — groups of accounts identified as sharing the same URLs or quoting the same posts in coordinated patterns. The goal is to determine what the cluster is pushing, how coordinated it is, and whether the coordination is authentic (shared interest) or inauthentic (information operation).

**Coordination does not equal inauthenticity.** Accounts sharing URLs about a niche hobby, a local news event, or a shared professional interest will form clusters. The classification must distinguish genuine shared interest from manufactured coordination. This skill provides the framework for that distinction.

## Input

The skill accepts either:
- **Cluster ID**: A co-sharing cluster identifier (from `cosharing_clusters` tool output)
- **Set of DIDs**: A list of accounts to analyse as a group (when cluster ID is not available)

## Phase 1: Data Collection

Data collection happens in two rounds — first cluster-level metadata, then member-level content.

### Round 1: Cluster Metadata

#### 1a. Cluster Membership

**If cluster ID provided:** Use `cosharing_clusters` MCP tool directly with the cluster_id to get: member DIDs, cluster size, evolution type, and cluster metrics.

**If DIDs provided:** Use `cosharing_clusters` MCP tool with each DID to check if they share a common cluster. If they do, use the cluster ID for further analysis. If not, proceed with the DID list as an ad-hoc group.

#### 1b. Cluster Evolution

**Use `cosharing_evolution` MCP tool** with the cluster ID to get: cluster birth date, merge/split history, size over time. This reveals whether the cluster is stable, growing, or fragmenting.

#### 1c. Co-sharing Pairs

**Use `cosharing_pairs` MCP tool** for each member DID (or a sample of 10 if cluster is large). This returns the actual URLs shared between account pairs — the raw evidence of what's being coordinated.

#### Small Cluster Check

If the cluster has 1 member or fewer than 3 members:
1. Proceed with data collection but flag: "Small cluster — classification confidence will be low."
2. In the output, set confidence to `low` regardless of signal strength.

### Round 2: Member Content

#### 2a. Member Content Sample

**Dispatch to data-analyst:**
"For these DIDs: [member list, or top 20 members if cluster is large], sample the 30 most recent posts per account from osprey_execution_results. Return: author DID, content, timestamp, rules matched."

#### 2b. Member Entropy

**Dispatch to data-analyst:**
"Query account_entropy_results for these DIDs: [member list]. Return: DID, hourly_entropy, interval_entropy, is_bot_like."

#### 2c. Member Account Age

**Dispatch to data-analyst:**
"For these DIDs: [member list], find the earliest post timestamp in osprey_execution_results as a proxy for account age. Return: DID, earliest_post, days_active."

#### 2d. Shared Domains

**Dispatch to data-analyst:**
"From the co-sharing pairs data, extract all unique domains/URLs shared across cluster members. Group by domain and show: domain, number of members sharing it, total share count, and whether it appears in url_overdispersion_results."
