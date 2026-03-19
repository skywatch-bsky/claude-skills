// pattern: Imperative Shell
// ClickHouse HTTP client abstraction for query execution

import { createClient } from "@clickhouse/client";
import { validateQuery } from "./sql-validation";

export type QueryResult = {
  readonly columns: ReadonlyArray<{ name: string; type: string }>;
  readonly rows: ReadonlyArray<Record<string, unknown>>;
};

type ClickHouseClientConfig = {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
};

type ClickHouseClientInterface = {
  query(sql: string): Promise<QueryResult>;
  getSchema(): Promise<QueryResult>;
};

export function createClickHouseClient(
  config: ClickHouseClientConfig
): ClickHouseClientInterface {
  const url = `${config.host}:${config.port}`;

  const client = createClient({
    url,
    username: config.username,
    password: config.password,
    database: config.database,
  });

  return {
    async query(sql: string): Promise<QueryResult> {
      const validation = validateQuery(sql);
      if (!validation.valid) {
        throw new Error(`Query validation failed: ${validation.reason}`);
      }

      const response = await client.query({
        query: validation.normalized,
        format: "JSONEachRow",
        clickhouse_settings: {
          max_execution_time: 60,
        },
      });

      const text = await response.text();
      const parsed = JSON.parse(text) as unknown;

      let columns: Array<{ name: string; type: string }> = [];
      let rows: Array<Record<string, unknown>> = [];

      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj["meta"])) {
          columns = (obj["meta"] as unknown[]).map((col: unknown) => {
            if (
              typeof col === "object" &&
              col !== null &&
              "name" in col &&
              "type" in col
            ) {
              return {
                name: String((col as Record<string, unknown>)["name"]),
                type: String((col as Record<string, unknown>)["type"]),
              };
            }
            return { name: "", type: "" };
          });
        }
        if (Array.isArray(obj["data"])) {
          rows = obj["data"] as Array<Record<string, unknown>>;
        }
      }

      return { columns, rows };
    },

    async getSchema(): Promise<QueryResult> {
      const response = await client.query({
        query: "DESCRIBE TABLE default.osprey_execution_results",
        format: "JSONEachRow",
      });

      const text = await response.text();
      const parsed = JSON.parse(text) as unknown;

      let rows: Array<Record<string, unknown>> = [];

      if (Array.isArray(parsed)) {
        rows = parsed;
      }

      const schemaColumns = rows.map((row: unknown) => {
        if (typeof row === "object" && row !== null) {
          const r = row as Record<string, unknown>;
          return {
            name: String(r["name"] || ""),
            type: String(r["type"] || ""),
          };
        }
        return { name: "", type: "" };
      });

      return {
        columns: schemaColumns,
        rows,
      };
    },
  };
}
