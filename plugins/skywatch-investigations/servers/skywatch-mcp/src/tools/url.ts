// pattern: Imperative Shell
// MCP tool handler for URL redirect chain following and shortener detection

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { isKnownShortener } from "../lib/url-shorteners.js";

interface RedirectHop {
  url: string;
  statusCode: number;
  location: string | null;
  isShortener: boolean;
}

interface UrlExpandResult {
  originalUrl: string;
  finalUrl: string;
  hops: Array<RedirectHop>;
  hopCount: number;
  error?: string;
}

async function followRedirects(
  startUrl: string,
  maxHops: number = 15
): Promise<UrlExpandResult> {
  const hops: Array<RedirectHop> = [];
  let currentUrl = startUrl;
  let finalUrl = startUrl;

  for (let i = 0; i < maxHops; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const currentHostname = new URL(currentUrl).hostname;
      const isShortener = isKnownShortener(currentHostname);

      const locationHeader = response.headers.get("location");
      let nextUrl: string | null = null;

      if (locationHeader && response.status >= 300 && response.status < 400) {
        try {
          nextUrl = new URL(locationHeader, currentUrl).href;
        } catch {
          // If URL construction fails, treat as non-redirect
          nextUrl = null;
        }
      }

      hops.push({
        url: currentUrl,
        statusCode: response.status,
        location: nextUrl,
        isShortener,
      });

      // If no redirect location or non-3xx status, stop following
      if (!nextUrl || response.status < 300 || response.status >= 400) {
        finalUrl = currentUrl;
        break;
      }

      currentUrl = nextUrl;
      finalUrl = nextUrl;
    } catch (error) {
      // On error (timeout, network, etc.), record what we have and stop
      const currentHostname = new URL(currentUrl).hostname;
      const isShortener = isKnownShortener(currentHostname);

      hops.push({
        url: currentUrl,
        statusCode: 0,
        location: null,
        isShortener,
      });

      break;
    }
  }

  const result: UrlExpandResult = {
    originalUrl: startUrl,
    finalUrl,
    hops,
    hopCount: hops.length,
  };

  if (hops.length >= maxHops) {
    result.error = "Max redirects exceeded";
  }

  return result;
}

export async function registerUrlTool(server: McpServer): Promise<void> {
  server.tool(
    "url_expand",
    "Follow a URL's redirect chain and report each hop with status code. Identifies known URL shorteners.",
    {
      url: z
        .string()
        .url()
        .describe("URL to expand (follow redirects)"),
    },
    async (args) => {
      const { url } = args as { url: string };

      try {
        const result = await followRedirects(url);

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
