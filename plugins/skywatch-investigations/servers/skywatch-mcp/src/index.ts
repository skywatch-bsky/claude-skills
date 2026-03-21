// pattern: Imperative Shell
// MCP server entry point and runtime initialization

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClickHouseClient, type ClickHouseConnectionConfig } from "./lib/clickhouse-client.ts";
import { registerClickHouseTools } from "./tools/clickhouse.ts";
import { registerDomainTool } from "./tools/domain.ts";
import { registerIpTool } from "./tools/ip.ts";
import { registerUrlTool } from "./tools/url.ts";
import { registerWhoisTool } from "./tools/whois.ts";
import { registerContentTool } from "./tools/content.ts";
import { registerOzoneTool, type OzoneConfig } from "./tools/ozone.ts";

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

const tailnetIp = process.env["CLICKHOUSE_TAILNET_IP"];
const mode = tailnetIp ? "direct" : getEnv("CLICKHOUSE_MODE", "ssh");

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
        host: tailnetIp ? `http://${tailnetIp}` : getEnv("CLICKHOUSE_HOST", "http://localhost"),
        port: Number(getEnv("CLICKHOUSE_PORT", "8123")),
        username: getEnv("CLICKHOUSE_USER", "default"),
        password: getEnv("CLICKHOUSE_PASSWORD", ""),
        database: getEnv("CLICKHOUSE_DATABASE", "default"),
      };

let _client: ReturnType<typeof createClickHouseClient> | null = null;
function getClient() {
  if (!_client) {
    _client = createClickHouseClient(clickhouseConfig);
  }
  return _client;
}

const lazyClient = {
  query: (sql: string) => getClient().query(sql),
  getSchema: () => getClient().getSchema(),
};

const server = new McpServer({
  name: "skywatch-mcp",
  version: "0.1.0",
});

await registerClickHouseTools(server, lazyClient);

await registerDomainTool(server);
await registerIpTool(server);
await registerUrlTool(server);
await registerWhoisTool(server);
await registerContentTool(server, lazyClient);

const ozoneConfig: OzoneConfig = {
  serviceUrl: process.env["OZONE_SERVICE_URL"] ?? null,
  handle: process.env["OZONE_HANDLE"] ?? null,
  adminPassword: process.env["OZONE_ADMIN_PASSWORD"] ?? null,
  did: process.env["OZONE_DID"] ?? null,
  pdsHost: process.env["OZONE_PDS"] ?? null,
};
await registerOzoneTool(server, ozoneConfig);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("skywatch-mcp server started");
