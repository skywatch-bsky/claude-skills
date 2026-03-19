// pattern: Imperative Shell
// MCP tool handler for DNS record lookup and HTTP status checking

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { promises as dns } from "dns";

type DnsRecord = {
  readonly a: Array<string>;
  readonly aaaa: Array<string>;
  readonly ns: Array<string>;
  readonly mx: Array<{ exchange: string; priority: number }>;
  readonly txt: Array<Array<string>>;
  readonly cname: Array<string>;
  readonly soa: {
    nsname: string;
    hostmaster: string;
    serial: number;
    refresh: number;
    retry: number;
    expire: number;
    minttl: number;
  } | null;
};

type DomainCheckResult = {
  readonly domain: string;
  readonly resolves: boolean;
  readonly records: DnsRecord;
  readonly http: { status: number; statusText: string } | null;
};

async function resolveDnsRecords(domain: string): Promise<DnsRecord> {
  const results = await Promise.allSettled([
    dns.resolve4(domain),
    dns.resolve6(domain),
    dns.resolveNs(domain),
    dns.resolveMx(domain),
    dns.resolveTxt(domain),
    dns.resolveCname(domain),
    dns.resolveSoa(domain),
  ]);

  const a =
    results[0].status === "fulfilled"
      ? (results[0].value as Array<string>)
      : [];
  const aaaa =
    results[1].status === "fulfilled"
      ? (results[1].value as Array<string>)
      : [];
  const ns =
    results[2].status === "fulfilled"
      ? (results[2].value as Array<string>)
      : [];
  const mx =
    results[3].status === "fulfilled"
      ? (results[3].value as Array<{ exchange: string; priority: number }>)
      : [];
  const txt =
    results[4].status === "fulfilled"
      ? (results[4].value as Array<Array<string>>)
      : [];
  const cname =
    results[5].status === "fulfilled"
      ? (results[5].value as Array<string>)
      : [];

  const soa: DnsRecord["soa"] =
    results[6].status === "fulfilled"
      ? (results[6].value as {
          nsname: string;
          hostmaster: string;
          serial: number;
          refresh: number;
          retry: number;
          expire: number;
          minttl: number;
        })
      : null;

  return {
    a,
    aaaa,
    ns,
    mx,
    txt,
    cname,
    soa,
  };
}

async function checkHttpStatus(
  domain: string
): Promise<{ status: number; statusText: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (!response) {
      return null;
    }

    return {
      status: response.status,
      statusText: response.statusText,
    };
  } catch {
    return null;
  }
}

export async function registerDomainTool(server: McpServer): Promise<void> {
  server.tool(
    "domain_check",
    "Check DNS records and HTTP status for a domain. Returns A, AAAA, NS, MX, TXT, CNAME, SOA records and whether the domain resolves.",
    {
      domain: z
        .string()
        .describe("Domain name to check (e.g., example.com)"),
    },
    async (args) => {
      const { domain } = args as { domain: string };

      try {
        const records = await resolveDnsRecords(domain);
        const http = await checkHttpStatus(domain);

        const resolves = records.a.length > 0 || records.aaaa.length > 0;

        const result: DomainCheckResult = {
          domain,
          resolves,
          records,
          http,
        };

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
