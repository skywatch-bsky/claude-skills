// pattern: Imperative Shell
// MCP tool handler for URL redirect chain following and shortener detection

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { isKnownShortener } from "../lib/url-shorteners.js";

type RedirectHop = {
  readonly url: string;
  readonly statusCode: number;
  readonly location: string | null;
  readonly isShortener: boolean;
};

type UrlExpandResult = {
  readonly originalUrl: string;
  readonly finalUrl: string;
  readonly hops: Array<RedirectHop>;
  readonly hopCount: number;
  readonly error?: string;
};

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

  const result: UrlExpandResult =
    hops.length >= maxHops
      ? {
          originalUrl: startUrl,
          finalUrl,
          hops,
          hopCount: hops.length,
          error: "Max redirects exceeded",
        }
      : {
          originalUrl: startUrl,
          finalUrl,
          hops,
          hopCount: hops.length,
        };

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
      const { url } = args;

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
