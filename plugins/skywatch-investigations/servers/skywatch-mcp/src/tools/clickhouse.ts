import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClickHouseClientInterface } from "../lib/clickhouse-client.ts";

export async function registerClickHouseTools(
  server: McpServer,
  client: ClickHouseClientInterface
): Promise<void> {
  server.tool(
    "clickhouse_query",
    "Execute a read-only SQL query against the Osprey ClickHouse database. Only SELECT queries with LIMIT against osprey_execution_results are allowed.",
    {
      sql: z
        .string()
        .describe("SQL SELECT query with LIMIT clause"),
    },
    async (args) => {
      try {
        const result = await client.query(args.sql);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: errorMessage,
              isError: true,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "clickhouse_schema",
    "Get the column definitions (names and types) for the osprey_execution_results table.",
    {
    },
    async () => {
      try {
        const result = await client.getSchema();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: errorMessage,
              isError: true,
            },
          ],
        };
      }
    }
  );
}

type ClickHouseClientInterface = {
  query(sql: string): Promise<any>;
  getSchema(): Promise<any>;
};
