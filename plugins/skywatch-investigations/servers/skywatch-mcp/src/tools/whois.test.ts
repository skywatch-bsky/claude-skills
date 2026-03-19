import { describe, it, expect } from "bun:test";
import { registerWhoisTool } from "./whois";
import { parseWhoisResponse } from "../lib/whois-parser";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("whois_lookup tool", () => {
  describe("parseWhoisResponse (unit test)", () => {
    it("should extract registrar from WHOIS text", () => {
      const sampleWhoisText = `
Domain Name: EXAMPLE.COM
Registrar: GoDaddy.com, LLC
Creation Date: 1995-08-14T04:12:00Z
Registry Expiry Date: 2024-08-13T04:12:00Z
Name Server: NS1.EXAMPLE.COM
Name Server: NS2.EXAMPLE.COM
`;

      const result = parseWhoisResponse(sampleWhoisText);

      expect(result.registrar).not.toBeNull();
      expect(result.registrar).toContain("GoDaddy");
    });

    it("should extract creation and expiration dates", () => {
      const sampleWhoisText = `
Creation Date: 1995-08-14T04:12:00Z
Registry Expiry Date: 2024-08-13T04:12:00Z
`;

      const result = parseWhoisResponse(sampleWhoisText);

      expect(result.creationDate).not.toBeNull();
      expect(result.expirationDate).not.toBeNull();
      expect(result.creationDate).toContain("1995");
      expect(result.expirationDate).toContain("2024");
    });

    it("should extract nameservers", () => {
      const sampleWhoisText = `
Name Server: NS1.EXAMPLE.COM
Name Server: NS2.EXAMPLE.COM
Name Server: NS3.EXAMPLE.COM
`;

      const result = parseWhoisResponse(sampleWhoisText);

      expect(result.nameservers.length).toBe(3);
      expect(result.nameservers).toContain("NS1.EXAMPLE.COM");
      expect(result.nameservers).toContain("NS2.EXAMPLE.COM");
      expect(result.nameservers).toContain("NS3.EXAMPLE.COM");
    });

    it("should calculate domain age from creation date", () => {
      // Using a fixed past date for testing
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 100);
      const pastDateStr = pastDate.toISOString();

      const sampleWhoisText = `
Creation Date: ${pastDateStr}
`;

      const result = parseWhoisResponse(sampleWhoisText);

      expect(result.domainAge).not.toBeNull();
      if (typeof result.domainAge === "number") {
        // Allow some variance due to exact timing
        expect(result.domainAge).toBeGreaterThanOrEqual(99);
        expect(result.domainAge).toBeLessThanOrEqual(101);
      }
    });

    it("should return null for missing fields", () => {
      const sampleWhoisText = "No WHOIS data found";

      const result = parseWhoisResponse(sampleWhoisText);

      expect(result.registrar).toBeNull();
      expect(result.creationDate).toBeNull();
      expect(result.expirationDate).toBeNull();
      expect(result.nameservers.length).toBe(0);
      expect(result.domainAge).toBeNull();
    });

    it("should handle alternative date field names", () => {
      const sampleWhoisText = `
Created: 1995-08-14
expires: 2024-08-13
`;

      const result = parseWhoisResponse(sampleWhoisText);

      expect(result.creationDate).not.toBeNull();
      expect(result.expirationDate).not.toBeNull();
    });

    it("should preserve raw text in result", () => {
      const sampleText = "This is raw WHOIS data";
      const result = parseWhoisResponse(sampleText);

      expect(result.rawText).toBe(sampleText);
    });
  });

  describe("AC2.5: Success with real domain lookup", () => {
    it("should return WHOIS data for google.com", async () => {
      let capturedHandler: ((args: unknown) => unknown) | null = null;

      const mockServer = {
        tool: (
          name: string,
          description: string,
          schema: object,
          handler: (args: unknown) => unknown
        ) => {
          if (name === "whois_lookup") {
            capturedHandler = handler;
          }
        },
      } as unknown as McpServer;

      await registerWhoisTool(mockServer);

      expect(capturedHandler).not.toBeNull();

      const result = await (capturedHandler!({
        domain: "google.com",
      }) as Promise<unknown>);

      expect(result).toEqual(
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.any(String),
            }),
          ]),
        })
      );

      if (
        !result ||
        typeof result !== "object" ||
        !("content" in result)
      ) {
        throw new Error("Invalid result structure");
      }

      const resultObj = result as {
        content: Array<{ type: string; text: string }>;
      };

      if (
        !resultObj.content[0] ||
        typeof resultObj.content[0].text !== "string"
      ) {
        throw new Error("Invalid content structure");
      }

      const parsed = JSON.parse(resultObj.content[0].text) as unknown;

      if (
        !parsed ||
        typeof parsed !== "object" ||
        !("registrar" in parsed) ||
        !("creationDate" in parsed)
      ) {
        throw new Error("Invalid parsed result structure");
      }

      const parsedResult = parsed as {
        registrar: string | null;
        creationDate: string | null;
        nameservers: Array<unknown>;
      };

      expect(parsedResult.registrar).not.toBeNull();
      expect(parsedResult.creationDate).not.toBeNull();
      expect(parsedResult.nameservers.length).toBeGreaterThan(0);
    });
  });

  describe("Tool registration", () => {
    it("should register whois_lookup tool on server", async () => {
      let registerCalled = false;

      const mockServer = {
        tool: (
          name: string,
          description: string,
          schema: object,
          handler: (args: unknown) => unknown
        ) => {
          if (name === "whois_lookup") {
            registerCalled = true;
          }
        },
      } as unknown as McpServer;

      await registerWhoisTool(mockServer);

      expect(registerCalled).toBe(true);
    });
  });
});
