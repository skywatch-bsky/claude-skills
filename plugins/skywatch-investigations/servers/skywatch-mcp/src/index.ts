// pattern: Imperative Shell
// MCP server entry point and runtime initialization

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClickHouseClient, type ClickHouseConnectionConfig } from "./lib/clickhouse-client.ts";
import { registerClickHouseTools } from "./tools/clickhouse.ts";

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

const mode = getEnv("CLICKHOUSE_MODE", "ssh");

const clickhouseConfig: ClickHouseConnectionConfig =
  mode === "ssh"
    ? {
        mode: "ssh",
        database: getEnv("CLICKHOUSE_DATABASE", "default"),
        sshHost: getEnv("SSH_HOST", "localhost"),
        sshUser: getEnv("SSH_USER", "default"),
        dockerContainer: getEnv("SSH_DOCKER_CONTAINER", "clickhouse"),
      }
    : {
        mode: "direct",
        host: getEnv("CLICKHOUSE_HOST", "http://localhost"),
        port: Number(getEnv("CLICKHOUSE_PORT", "8123")),
        username: getEnv("CLICKHOUSE_USER", "default"),
        password: getEnv("CLICKHOUSE_PASSWORD", ""),
        database: getEnv("CLICKHOUSE_DATABASE", "default"),
      };

const client = createClickHouseClient(clickhouseConfig);

const server = new McpServer({
  name: "skywatch-mcp",
  version: "0.1.0",
});

await registerClickHouseTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("skywatch-mcp server started");
