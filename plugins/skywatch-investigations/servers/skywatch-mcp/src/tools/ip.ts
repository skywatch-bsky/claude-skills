// pattern: Imperative Shell
// MCP tool handler for IP geolocation and network information lookup

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

type IpLookupResult = {
  readonly ip: string;
  readonly geo: {
    readonly country: string;
    readonly countryCode: string;
    readonly region: string;
    readonly city: string;
    readonly zip: string;
    readonly lat: number;
    readonly lon: number;
    readonly timezone: string;
  };
  readonly network: {
    readonly isp: string;
    readonly org: string;
    readonly asn: string;
    readonly asname: string;
  };
  readonly flags: {
    readonly mobile: boolean;
    readonly proxy: boolean;
    readonly hosting: boolean;
  };
};

export function validateIpAddress(ip: string): boolean {
  const ipv4Regex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
  const ipv4Match = ip.match(ipv4Regex);

  if (ipv4Match && ipv4Match[1] && ipv4Match[2] && ipv4Match[3] && ipv4Match[4]) {
    const octets = [ipv4Match[1], ipv4Match[2], ipv4Match[3], ipv4Match[4]];
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        return false;
      }
    }
    return true;
  }

  // Basic IPv6 validation: must have colons, only valid hex chars, colons, and dots (for IPv4-in-IPv6)
  if (!ip.includes(":")) {
    return false;
  }

  const colonCount = (ip.split("") as Array<string>).filter((c: string) => c === ":").length;
  if (colonCount < 2) {
    return false;
  }

  // Check for three or more consecutive colons (invalid except for ::)
  if (ip.includes(":::")) {
    return false;
  }

  // Check only valid chars: hex digits, colons, and dots (for IPv4 suffix)
  if (!/^[0-9a-fA-F:.]+$/.test(ip)) {
    return false;
  }

  return true;
}

export async function registerIpTool(server: McpServer): Promise<void> {
  server.tool(
    "ip_lookup",
    "Look up geographic location and network information for an IP address using ip-api.com.",
    {
      ip: z
        .string()
        .describe("IPv4 or IPv6 address to look up"),
    },
    async (args) => {
      const { ip } = args as { ip: string };

      if (!validateIpAddress(ip)) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Invalid IP address format: ${ip}`,
            },
          ],
        };
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,message,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting`,
          {
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        const data = await response.json() as Record<string, unknown>;

        if (data["status"] === "fail") {
          const message =
            typeof data["message"] === "string"
              ? data["message"]
              : "Unknown API error";
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: message,
              },
            ],
          };
        }

        const result: IpLookupResult = {
          ip: typeof data["query"] === "string" ? data["query"] : ip,
          geo: {
            country: String(data["country"] ?? ""),
            countryCode: String(data["countryCode"] ?? ""),
            region: String(data["region"] ?? ""),
            city: String(data["city"] ?? ""),
            zip: String(data["zip"] ?? ""),
            lat: Number(data["lat"] ?? 0),
            lon: Number(data["lon"] ?? 0),
            timezone: String(data["timezone"] ?? ""),
          },
          network: {
            isp: String(data["isp"] ?? ""),
            org: String(data["org"] ?? ""),
            asn: String(data["as"] ?? ""),
            asname: String(data["asname"] ?? ""),
          },
          flags: {
            mobile: Boolean(data["mobile"]),
            proxy: Boolean(data["proxy"]),
            hosting: Boolean(data["hosting"]),
          },
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
