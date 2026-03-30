// pattern: Imperative Shell
// ClickHouse client abstraction using @clickhouse/client with JSON format

import { createClient, type ClickHouseClient as NativeClient } from "@clickhouse/client";
import type { ResponseJSON } from "@clickhouse/client-common";
import { validateQuery } from "./sql-validation";

export type QueryResult = {
  readonly columns: ReadonlyArray<{ name: string; type: string }>;
  readonly rows: ReadonlyArray<Record<string, unknown>>;
};

export type ClickHouseClient = {
  query(sql: string): Promise<QueryResult>;
  queryTrusted(sql: string): Promise<QueryResult>;
  getSchema(): Promise<QueryResult>;
};

export type ClickHouseClientConfig = {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
};

const SCHEMA_TABLES = [
  "default.osprey_execution_results",
  "default.pds_signup_anomalies",
  "default.url_overdispersion_results",
  "default.account_entropy_results",
  "default.url_cosharing_pairs",
  "default.url_cosharing_clusters",
  "default.url_cosharing_membership",
  "default.quote_cosharing_pairs",
  "default.quote_cosharing_clusters",
  "default.quote_cosharing_membership",
  "default.quote_overdispersion_results",
] as const;

function toQueryResult(response: ResponseJSON): QueryResult {
  return {
    columns: response.meta ?? [],
    rows: response.data as Array<Record<string, unknown>>,
  };
}

async function executeQuery(
  client: NativeClient,
  sql: string,
  maxExecutionTime: number,
): Promise<QueryResult> {
  const resultSet = await client.query({
    query: sql,
    format: "JSON",
    clickhouse_settings: {
      max_execution_time: maxExecutionTime,
    },
  });

  const response = await resultSet.json();
  return toQueryResult(response);
}

export function createClickHouseClient(
  config: ClickHouseClientConfig,
): ClickHouseClient {
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
      if (validation.valid === false) {
        throw new Error(`Query validation failed: ${validation.reason}`);
      }

      return executeQuery(client, validation.normalized, 60);
    },

    async queryTrusted(sql: string): Promise<QueryResult> {
      return executeQuery(client, sql, 120);
    },

    async getSchema(): Promise<QueryResult> {
      const allRows: Array<Record<string, unknown>> = [];
      let schemaColumns: ReadonlyArray<{ name: string; type: string }> = [];

      for (const table of SCHEMA_TABLES) {
        try {
          const result = await executeQuery(client, `DESCRIBE TABLE ${table}`, 60);
          const taggedRows = result.rows.map((row) => ({ ...row, table }));
          allRows.push(...taggedRows);

          if (schemaColumns.length === 0) {
            schemaColumns = [...result.columns, { name: "table", type: "String" }];
          }
        } catch {
          // Table may not exist in this environment — skip
        }
      }

      return { columns: schemaColumns, rows: allRows };
    },
  };
}
