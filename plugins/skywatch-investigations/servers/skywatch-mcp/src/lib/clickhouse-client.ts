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
