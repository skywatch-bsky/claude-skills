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
  const client = createClient({
    host: config.host,
    port: config.port,
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
        format: "JSONCompactColumnsWithNames",
        clickhouse_settings: {
          max_execution_time: 60,
        },
      });

      const text = await response.text();
      const parsed = JSON.parse(text);

      const columns = Array.isArray(parsed.meta)
        ? parsed.meta.map(
            (col: { name: string; type: string }) => ({
              name: col.name,
              type: col.type,
            })
          )
        : [];

      const rows = Array.isArray(parsed.data) ? parsed.data : [];

      return {
        columns,
        rows,
      };
    },

    async getSchema(): Promise<QueryResult> {
      const response = await client.query({
        query: "DESCRIBE TABLE default.osprey_execution_results",
        format: "JSONCompactColumnsWithNames",
      });

      const text = await response.text();
      const parsed = JSON.parse(text);

      const rows = Array.isArray(parsed.data) ? parsed.data : [];

      const columns = rows.map((row: Record<string, unknown>) => ({
        name: String(row.name || ""),
        type: String(row.type || ""),
      }));

      return {
        columns: [
          { name: "name", type: "String" },
          { name: "type", type: "String" },
        ],
        rows: rows as ReadonlyArray<Record<string, unknown>>,
      };
    },
  };
}
