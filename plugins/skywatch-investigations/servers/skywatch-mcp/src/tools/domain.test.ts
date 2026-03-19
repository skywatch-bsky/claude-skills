import { describe, it, expect } from "bun:test";
import { registerDomainTool } from "./domain";
import { createMockServer } from "../test-utils";

describe("domain_check tool", () => {
  describe("AC2.1: Success with well-known domain", () => {
    it("should return DNS records and HTTP status for example.com", async () => {
      const { mockServer, getHandler } = createMockServer();

      await registerDomainTool(mockServer);

      const capturedHandler = getHandler("domain_check");
      expect(capturedHandler).not.toBeNull();

      const result = await (capturedHandler!({ domain: "example.com" }) as Promise<unknown>);
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

      const contentArray = (result as { content: Array<{ type: string; text: string }> }).content;
      const textContent = contentArray[0];
      if (!textContent) {
        throw new Error("No text content in response");
      }
      const parsed = JSON.parse(textContent.text);

      expect(parsed).toEqual(
        expect.objectContaining({
          domain: "example.com",
          resolves: true,
          records: expect.objectContaining({
            a: expect.any(Array),
            aaaa: expect.any(Array),
            ns: expect.any(Array),
            mx: expect.any(Array),
            txt: expect.any(Array),
            cname: expect.any(Array),
            soa: expect.any(Object),
          }),
          http: expect.any(Object),
        })
      );

      // Verify A records are not empty for a well-known domain
      expect(parsed.records.a.length).toBeGreaterThan(0);
      expect(parsed.records.ns.length).toBeGreaterThan(0);
    });
  });

  describe("AC2.6: Graceful handling of non-resolving domain", () => {
    it("should return resolves: false for non-existent domain without throwing", async () => {
      const { mockServer, getHandler } = createMockServer();

      await registerDomainTool(mockServer);

      const capturedHandler = getHandler("domain_check");
      expect(capturedHandler).not.toBeNull();

      const result = await (capturedHandler!({
        domain: "this-domain-definitely-does-not-exist-abc123xyz.com",
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

      const contentArray = (result as { content: Array<{ type: string; text: string }> }).content;
      const textContent = contentArray[0];
      if (!textContent) {
        throw new Error("No text content in response");
      }
      const parsed = JSON.parse(textContent.text);

      expect(parsed).toEqual(
        expect.objectContaining({
          domain: "this-domain-definitely-does-not-exist-abc123xyz.com",
          resolves: false,
        })
      );

      // Should not have isError flag - this is not an error
      const resultObj = result as Record<string, unknown>;
      expect(resultObj["isError"]).not.toBe(true);
    });
  });
});
