import { describe, it, expect } from "bun:test";
import { registerIpTool, validateIpAddress } from "./ip";
import { createMockServer } from "../test-utils";

describe("ip_lookup tool", () => {
  describe("validateIpAddress", () => {
    it("should accept valid IPv4 addresses", () => {
      expect(validateIpAddress("8.8.8.8")).toBe(true);
      expect(validateIpAddress("192.168.1.1")).toBe(true);
      expect(validateIpAddress("255.255.255.255")).toBe(true);
      expect(validateIpAddress("0.0.0.0")).toBe(true);
    });

    it("should reject invalid IPv4 addresses", () => {
      expect(validateIpAddress("999.999.999.999")).toBe(false);
      expect(validateIpAddress("256.256.256.256")).toBe(false);
      expect(validateIpAddress("192.168.1")).toBe(false);
      expect(validateIpAddress("192.168.1.1.1")).toBe(false);
      expect(validateIpAddress("not-an-ip")).toBe(false);
      expect(validateIpAddress("192.168.1.a")).toBe(false);
    });

    it("should accept valid IPv6 addresses", () => {
      expect(validateIpAddress("::1")).toBe(true);
      expect(validateIpAddress("2001:4860:4860::8888")).toBe(true);
      expect(validateIpAddress("::ffff:192.0.2.1")).toBe(true);
    });

    it("should reject invalid IPv6 addresses", () => {
      expect(validateIpAddress("gggg::1")).toBe(false);
      expect(validateIpAddress(":::1")).toBe(false);
    });
  });

  describe("AC2.2: Success with known public IP", () => {
    it("should return geo and network data for 8.8.8.8", async () => {
      const { mockServer, getHandler } = createMockServer();

      await registerIpTool(mockServer);

      const capturedHandler = getHandler("ip_lookup");
      expect(capturedHandler).not.toBeNull();

      const result = await (capturedHandler!({ ip: "8.8.8.8" }) as Promise<unknown>);

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
          ip: "8.8.8.8",
          geo: expect.objectContaining({
            country: expect.any(String),
            city: expect.any(String),
            lat: expect.any(Number),
            lon: expect.any(Number),
          }),
          network: expect.objectContaining({
            isp: expect.any(String),
            asn: expect.any(String),
          }),
          flags: expect.objectContaining({
            mobile: expect.any(Boolean),
            proxy: expect.any(Boolean),
            hosting: expect.any(Boolean),
          }),
        })
      );
    });
  });

  describe("AC2.7: Failure with invalid IP format", () => {
    it("should return error for obviously invalid IP like 'not-an-ip'", async () => {
      const { mockServer, getHandler } = createMockServer();

      await registerIpTool(mockServer);

      const capturedHandler = getHandler("ip_lookup");
      expect(capturedHandler).not.toBeNull();

      const result = await (capturedHandler!({ ip: "not-an-ip" }) as Promise<unknown>);

      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.any(String),
            }),
          ]),
        })
      );
    });

    it("should return error for out-of-range IPv4 address like 999.999.999.999", async () => {
      const { mockServer, getHandler } = createMockServer();

      await registerIpTool(mockServer);

      const capturedHandler = getHandler("ip_lookup");
      expect(capturedHandler).not.toBeNull();

      const result = await (capturedHandler!({ ip: "999.999.999.999" }) as Promise<unknown>);

      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.any(String),
            }),
          ]),
        })
      );
    });
  });
});
