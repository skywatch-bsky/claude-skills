// pattern: Imperative Shell
// SSH + docker exec ClickHouse client abstraction

import { validateQuery } from "./sql-validation";
import { parseSshOutput } from "./ssh-output-parser";
import type { QueryResult } from "./clickhouse-client";

export type SshClientConfig = {
  readonly sshHost: string;
  readonly sshUser: string;
  readonly dockerContainer: string;
  readonly database: string;
};

type SshClient = {
  query(sql: string): Promise<QueryResult>;
  getSchema(): Promise<QueryResult>;
};

export function createSshClient(config: SshClientConfig): SshClient {
  function escapeShellArg(str: string): string {
    return str.replace(/[\\"$`]/g, "\\$&");
  }

  async function executeCommand(sql: string): Promise<QueryResult> {
    const escapedSql = escapeShellArg(sql);
    const escapedContainer = escapeShellArg(config.dockerContainer);
    const escapedDatabase = escapeShellArg(config.database);
    const remoteCommand = `docker exec ${escapedContainer} clickhouse-client --database ${escapedDatabase} --format JSONCompactEachRowWithNamesAndTypes --query "${escapedSql}"`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const proc = Bun.spawn(
        ["ssh", `${config.sshUser}@${config.sshHost}`, remoteCommand],
        {
          stdout: "pipe",
          stderr: "pipe",
          signal: controller.signal,
        }
      );

      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        throw new Error(`SSH command failed with exit code ${exitCode}: ${stderr}`);
      }

      const stdout = await new Response(proc.stdout).text();
      const parseResult = parseSshOutput(stdout);

      if (parseResult.success === false) {
        throw new Error(`Failed to parse SSH output: ${parseResult.reason}`);
      }

      return parseResult.data;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async query(sql: string): Promise<QueryResult> {
      const validation = validateQuery(sql);
      if (validation.valid === false) {
        throw new Error(`Query validation failed: ${validation.reason}`);
      }

      return executeCommand(validation.normalized);
    },

    async getSchema(): Promise<QueryResult> {
      const describeQuery = "DESCRIBE TABLE default.osprey_execution_results";
      return executeCommand(describeQuery);
    },
  };
}
