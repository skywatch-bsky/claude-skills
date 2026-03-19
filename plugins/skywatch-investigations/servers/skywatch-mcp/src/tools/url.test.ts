import { describe, it, expect } from "bun:test";
import { registerUrlTool } from "./url";
import { isKnownShortener } from "../lib/url-shorteners";
import { createMockServer } from "../test-utils";

describe("url_expand tool", () => {
  describe("isKnownShortener (AC2.4)", () => {
    it("should identify known shorteners", () => {
      expect(isKnownShortener("bit.ly")).toBe(true);
      expect(isKnownShortener("t.co")).toBe(true);
      expect(isKnownShortener("goo.gl")).toBe(true);
      expect(isKnownShortener("tinyurl.com")).toBe(true);
      expect(isKnownShortener("cutt.ly")).toBe(true);
    });

    it("should reject non-shortener domains", () => {
      expect(isKnownShortener("example.com")).toBe(false);
      expect(isKnownShortener("google.com")).toBe(false);
      expect(isKnownShortener("github.com")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isKnownShortener("BIT.LY")).toBe(true);
      expect(isKnownShortener("T.CO")).toBe(true);
      expect(isKnownShortener("EXAMPLE.COM")).toBe(false);
    });
  });

  describe("AC2.3: Success with redirect chain", () => {
    it("should follow HTTP redirects for http://example.com", async () => {
      const { mockServer, getHandler } = createMockServer();

      await registerUrlTool(mockServer);

      const capturedHandler = getHandler("url_expand");
      expect(capturedHandler).not.toBeNull();

      const result = await (capturedHandler!({
        url: "http://example.com",
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

      if (!resultObj.content[0] || typeof resultObj.content[0].text !== "string") {
        throw new Error("Invalid content structure");
      }

      const parsed = JSON.parse(resultObj.content[0].text) as unknown;

      if (
        !parsed ||
        typeof parsed !== "object" ||
        !("hops" in parsed) ||
        !("hopCount" in parsed)
      ) {
        throw new Error("Invalid parsed result structure");
      }

      const parsedResult = parsed as {
        hops: Array<unknown>;
        hopCount: number;
      };

      expect(parsedResult.hops.length).toBeGreaterThan(0);
      expect(parsedResult.hopCount).toBeGreaterThan(0);
    });
  });

  describe("Tool registration", () => {
    it("should register url_expand tool on server", async () => {
      const { mockServer, getHandler } = createMockServer();

      await registerUrlTool(mockServer);

      const handler = getHandler("url_expand");
      expect(handler).not.toBeNull();
    });
  });
});
