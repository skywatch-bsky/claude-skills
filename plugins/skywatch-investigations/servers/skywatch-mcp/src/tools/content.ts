// pattern: Imperative Shell
// MCP tool handler for content similarity detection using ClickHouse ngramDistance

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClickHouseClient } from "../lib/clickhouse-client.ts";

interface ContentSimilarityResult {
  user: string;
  handle: string;
  text: string;
  score: number;
  created_at: string;
}

export function escapeClickhouseSql(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function buildSimilarityQuery(
  escapedText: string,
  threshold: number,
  limit: number
): string {
  return `SELECT
    did as user,
    handle,
    content as text,
    ngramDistance(content, '${escapedText}') as score,
    created_at
  FROM default.osprey_execution_results
  WHERE ngramDistance(content, '${escapedText}') < ${threshold}
  ORDER BY score ASC
  LIMIT ${limit}`;
}

export async function registerContentTool(
  server: McpServer,
  client: ClickHouseClient
): Promise<void> {
  server.tool(
    "content_similarity",
    "Find posts with similar text content using ClickHouse ngramDistance. Useful for detecting copypasta and coordinated posting.",
    {
      text: z
        .string()
        .describe("Text to search for similar content"),
      threshold: z
        .number()
        .min(0)
        .max(1)
        .default(0.4)
        .describe(
          "Similarity threshold (0=identical, 1=completely different). Default 0.4"
        ),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Maximum number of results. Default 20"),
    },
    async (args) => {
      try {
        const { text, threshold, limit } = args as {
          text: string;
          threshold: number;
          limit: number;
        };

        const escapedText = escapeClickhouseSql(text);
        const query = buildSimilarityQuery(escapedText, threshold, limit);

        const result = await client.query(query);

        const results: ContentSimilarityResult[] = result.rows.map((row) => ({
          user: String(row["user"] ?? ""),
          handle: String(row["handle"] ?? ""),
          text: String(row["text"] ?? ""),
          score: Number(row["score"] ?? 0),
          created_at: String(row["created_at"] ?? ""),
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
        };
      }
    }
  );
}
