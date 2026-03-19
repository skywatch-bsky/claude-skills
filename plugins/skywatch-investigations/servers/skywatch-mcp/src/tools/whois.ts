// pattern: Imperative Shell
// MCP tool handler for WHOIS domain registration lookups

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as whoisModule from "whois";
import { parseWhoisResponse } from "../lib/whois-parser.js";

const whois = whoisModule as {
  lookup: (
    domain: string,
    callback: (err: Error | null, data: string) => void
  ) => void;
};

function whoisLookup(domain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, (err: Error | null, data: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export async function registerWhoisTool(server: McpServer): Promise<void> {
  server.tool(
    "whois_lookup",
    "Look up WHOIS registration data for a domain. Returns registrar, creation/expiration dates, nameservers, and domain age.",
    {
      domain: z
        .string()
        .describe("Domain name to look up (e.g., example.com)"),
    },
    async (args) => {
      const { domain } = args;

      try {
        const rawText = await whoisLookup(domain);
        const result = parseWhoisResponse(rawText);

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
          isError: true,
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
        };
      }
    }
  );
}
