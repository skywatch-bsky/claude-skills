// pattern: Imperative Shell
// ClickHouse client abstraction with strategy pattern for direct/SSH modes

import { createClient } from "@clickhouse/client";
import { validateQuery } from "./sql-validation";
import { createSshClient } from "./ssh-client";

export type QueryResult = {
  readonly columns: ReadonlyArray<{ name: string; type: string }>;
  readonly rows: ReadonlyArray<Record<string, unknown>>;
};

export type ClickHouseClient = {
  query(sql: string): Promise<QueryResult>;
  queryTrusted(sql: string): Promise<QueryResult>;
  getSchema(): Promise<QueryResult>;
};

type DirectClientConfig = {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
};

export type ClickHouseMode = "direct" | "ssh";

export type ClickHouseConnectionConfig = {
  readonly mode: ClickHouseMode;
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
  readonly sshHost?: string;
  readonly sshUser?: string;
  readonly dockerContainer?: string;
};

function createDirectClient(config: DirectClientConfig): ClickHouseClient {
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

      const response = await client.query({
        query: validation.normalized,
        format: "JSON",
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

    async queryTrusted(sql: string): Promise<QueryResult> {
      const response = await client.query({
        query: sql,
        format: "JSON",
        clickhouse_settings: {
          max_execution_time: 120,
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
      const tables = [
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
      ];

      const allRows: Array<Record<string, unknown>> = [];
      let schemaColumns: Array<{ name: string; type: string }> = [];

      for (const table of tables) {
        try {
          const response = await client.query({
            query: `DESCRIBE TABLE ${table}`,
            format: "JSON",
          });

          const text = await response.text();
          const parsed = JSON.parse(text) as unknown;

          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, unknown>;
            if (Array.isArray(obj["data"])) {
              const tableRows = (obj["data"] as Array<Record<string, unknown>>).map(
                (row) => ({ ...row, table })
              );
              allRows.push(...tableRows);
            }
            if (schemaColumns.length === 0 && Array.isArray(obj["meta"])) {
              schemaColumns = (obj["meta"] as unknown[]).map((col: unknown) => {
                if (typeof col === "object" && col !== null && "name" in col && "type" in col) {
                  return {
                    name: String((col as Record<string, unknown>)["name"]),
                    type: String((col as Record<string, unknown>)["type"]),
                  };
                }
                return { name: "", type: "" };
              });
              schemaColumns.push({ name: "table", type: "String" });
            }
          }
        } catch {
          // Table may not exist in this environment — skip
        }
      }

      return {
        columns: schemaColumns,
        rows: allRows,
      };
    },
  };
}

export function createClickHouseClient(
  config: ClickHouseConnectionConfig
): ClickHouseClient {
  switch (config.mode) {
    case "direct":
      if (!config.host || !config.database || config.port === undefined) {
        throw new Error(
          "Direct mode requires host, port, and database configuration"
        );
      }
      return createDirectClient({
        host: config.host,
        port: config.port,
        username: config.username ?? "default",
        password: config.password ?? "",
        database: config.database,
      });

    case "ssh":
      if (!config.sshHost || !config.dockerContainer || !config.database) {
        throw new Error(
          "SSH mode requires sshHost, dockerContainer, and database configuration"
        );
      }
      return createSshClient({
        sshHost: config.sshHost,
        sshUser: config.sshUser || undefined,
        dockerContainer: config.dockerContainer,
        database: config.database,
      });

    default:
      const exhaustiveCheck: never = config.mode;
      throw new Error(`Unknown ClickHouse mode: ${exhaustiveCheck}`);
  }
}
