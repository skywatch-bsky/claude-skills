// pattern: Test Utility
// Shared mock server creation for tool testing

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createMockServer(): {
  mockServer: McpServer;
  getHandler: (toolName: string) => ((args: unknown) => unknown) | null;
} {
  const handlers = new Map<string, (args: unknown) => unknown>();

  const mockServer = {
    tool: (
      name: string,
      description: string,
      schema: object,
      handler: (args: unknown) => unknown
    ) => {
      handlers.set(name, handler);
    },
  } as unknown as McpServer;

  return {
    mockServer,
    getHandler: (toolName: string) => handlers.get(toolName) ?? null,
  };
}
