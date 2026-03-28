// pattern: Imperative Shell
// MCP tool handlers for co-sharing cluster investigation (URL and quote-post)

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClickHouseClient } from "../lib/clickhouse-client.ts";

type CosharingType = "url" | "quote";

type TableNames = {
  pairs: string;
  clusters: string;
  membership: string;
  sharedColumn: string;
  uniqueColumn: string;
  sampleColumn: string;
};

function tablesFor(type: CosharingType): TableNames {
  if (type === "quote") {
    return {
      pairs: "quote_cosharing_pairs",
      clusters: "quote_cosharing_clusters",
      membership: "quote_cosharing_membership",
      sharedColumn: "shared_uris",
      uniqueColumn: "unique_uris",
      sampleColumn: "sample_uris",
    };
  }
  return {
    pairs: "url_cosharing_pairs",
    clusters: "url_cosharing_clusters",
    membership: "url_cosharing_membership",
    sharedColumn: "shared_urls",
    uniqueColumn: "unique_urls",
    sampleColumn: "sample_urls",
  };
}

function sanitizeDid(did: string): string {
  return did.replace(/[^a-z0-9:.]/g, "");
}

function sanitizeClusterId(id: string): string {
  return id.replace(/[^a-z0-9-]/g, "");
}

function buildClustersQuery(params: {
  type: CosharingType;
  did?: string;
  cluster_id?: string;
  date?: string;
  min_members?: number;
  limit: number;
}): string {
  const { type, did, cluster_id, date, min_members, limit } = params;
  const t = tablesFor(type);

  if (did) {
    const safeDid = sanitizeDid(did);
    const dateFilter = date ? `AND m.run_date = '${date}'` : `AND m.run_date = yesterday()`;
    return `SELECT m.cluster_id, m.run_date, c.member_count, c.total_edges,
       c.total_weight, c.${t.uniqueColumn}, c.temporal_spread_hours,
       c.mean_posting_interval_seconds, c.evolution_type,
       c.predecessor_cluster_ids, c.jaccard_score,
       c.sample_dids, c.${t.sampleColumn}
FROM ${t.membership} m
JOIN ${t.clusters} c
  ON m.cluster_id = c.cluster_id AND m.run_date = c.run_date
WHERE m.did = '${safeDid}' ${dateFilter}
ORDER BY m.run_date DESC
LIMIT ${limit}`;
  }

  if (cluster_id) {
    const safeId = sanitizeClusterId(cluster_id);
    const dateFilter = date ? `AND run_date = '${date}'` : "";
    return `SELECT cluster_id, run_date, member_count, total_edges,
       total_weight, ${t.uniqueColumn}, temporal_spread_hours,
       mean_posting_interval_seconds, evolution_type,
       predecessor_cluster_ids, jaccard_score,
       sample_dids, ${t.sampleColumn}
FROM ${t.clusters}
WHERE cluster_id = '${safeId}' ${dateFilter}
ORDER BY run_date DESC
LIMIT ${limit}`;
  }

  const dateFilter = date ? `run_date = '${date}'` : `run_date = yesterday()`;
  const memberFilter = min_members ? `AND member_count >= ${min_members}` : "";
  return `SELECT cluster_id, run_date, member_count, total_edges,
       total_weight, ${t.uniqueColumn}, temporal_spread_hours,
       mean_posting_interval_seconds, evolution_type,
       predecessor_cluster_ids, jaccard_score,
       sample_dids, ${t.sampleColumn}
FROM ${t.clusters}
WHERE ${dateFilter} ${memberFilter}
ORDER BY member_count DESC
LIMIT ${limit}`;
}

function buildPairsQuery(params: {
  type: CosharingType;
  did: string;
  date?: string;
  min_weight?: number;
  limit: number;
}): string {
  const { type, did, date, min_weight, limit } = params;
  const t = tablesFor(type);
  const safeDid = sanitizeDid(did);
  const dateFilter = date ? `AND date = '${date}'` : `AND date = yesterday()`;
  const weightFilter = min_weight ? `AND weight >= ${min_weight}` : "";

  return `SELECT date, account_a, account_b, weight, ${t.sharedColumn}
FROM ${t.pairs}
WHERE (account_a = '${safeDid}' OR account_b = '${safeDid}')
  ${dateFilter} ${weightFilter}
ORDER BY weight DESC
LIMIT ${limit}`;
}

function buildEvolutionQuery(params: {
  type: CosharingType;
  cluster_id: string;
  limit: number;
}): string {
  const { type } = params;
  const t = tablesFor(type);
  const safeId = sanitizeClusterId(params.cluster_id);

  return `SELECT run_date, cluster_id, member_count, total_edges,
       total_weight, ${t.uniqueColumn}, evolution_type,
       predecessor_cluster_ids, jaccard_score,
       sample_dids
FROM ${t.clusters}
WHERE cluster_id = '${safeId}'
   OR has(predecessor_cluster_ids, '${safeId}')
ORDER BY run_date
LIMIT ${params.limit}`;
}

const cosharingTypeParam = z
  .enum(["url", "quote"])
  .default("url")
  .describe("Type of co-sharing analysis: 'url' for URL sharing, 'quote' for quote-post sharing. Default: url");

export async function registerCosharingTools(
  server: McpServer,
  client: ClickHouseClient
): Promise<void> {
  server.tool(
    "cosharing_clusters",
    "Find co-sharing clusters — groups of accounts that repeatedly share the same URLs or quote the same posts on the same day. Use type='url' for URL co-sharing, type='quote' for quote-post co-sharing. Filter by DID (find clusters containing an account), cluster_id (look up a specific cluster), date, or minimum member count. Returns cluster metadata, coordination metrics, evolution info, and sample members.",
    {
      type: cosharingTypeParam,
      did: z
        .string()
        .optional()
        .describe("Find clusters containing this account DID"),
      cluster_id: z
        .string()
        .optional()
        .describe("Look up a specific cluster by ID (format: YYYY-MM-DD-NNNN)"),
      date: z
        .string()
        .optional()
        .describe("Filter to a specific date (YYYY-MM-DD). Defaults to yesterday"),
      min_members: z
        .number()
        .min(1)
        .optional()
        .describe("Minimum cluster size to return"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Maximum results to return. Default 20"),
    },
    async (args) => {
      try {
        const query = buildClustersQuery(args);
        const result = await client.queryTrusted(query);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { query, rows: result.rows, count: result.rows.length },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [{ type: "text", text: errorMessage }],
        };
      }
    }
  );

  server.tool(
    "cosharing_pairs",
    "Get raw co-sharing pairs for a specific account — which other accounts share the same URLs or quote the same posts on the same day. Use type='url' for URL co-sharing, type='quote' for quote-post co-sharing. Returns paired accounts, edge weights, and the actual shared URLs/URIs.",
    {
      type: cosharingTypeParam,
      did: z
        .string()
        .describe("Account DID to look up co-sharing pairs for (required)"),
      date: z
        .string()
        .optional()
        .describe("Filter to a specific date (YYYY-MM-DD). Defaults to yesterday"),
      min_weight: z
        .number()
        .min(1)
        .optional()
        .describe("Minimum co-share count per pair"),
      limit: z
        .number()
        .min(1)
        .max(200)
        .default(50)
        .describe("Maximum results to return. Default 50"),
    },
    async (args) => {
      try {
        const query = buildPairsQuery(args);
        const result = await client.queryTrusted(query);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { query, rows: result.rows, count: result.rows.length },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [{ type: "text", text: errorMessage }],
        };
      }
    }
  );

  server.tool(
    "cosharing_evolution",
    "Trace the evolution history of a co-sharing cluster over time. Use type='url' for URL co-sharing clusters, type='quote' for quote-post co-sharing clusters. Shows how a cluster was born, continued, merged, split, or died across days.",
    {
      type: cosharingTypeParam,
      cluster_id: z
        .string()
        .describe("Cluster ID to trace (format: YYYY-MM-DD-NNNN)"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(30)
        .describe("Maximum results to return. Default 30"),
    },
    async (args) => {
      try {
        const query = buildEvolutionQuery(args);
        const result = await client.queryTrusted(query);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { query, rows: result.rows, count: result.rows.length },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [{ type: "text", text: errorMessage }],
        };
      }
    }
  );
}
