import { describe, it, expect } from "bun:test";
import { buildOzoneRequest, registerOzoneTool } from "./ozone.ts";
import { createMockServer } from "../test-utils";

describe("registerOzoneTool handler", () => {
  it("AC3.4: should return not configured error when credentials are null", async () => {
    const { mockServer, getHandler } = createMockServer();

    await registerOzoneTool(mockServer, {
      serviceUrl: null,
      adminPassword: null,
      did: null,
    });

    const capturedHandler = getHandler("ozone_label");
    expect(capturedHandler).not.toBeNull();

    const result = await (capturedHandler!({
      subject: "did:plc:example123",
      label: "spam",
      action: "apply",
    }) as Promise<unknown>);

    expect(result).toEqual(
      expect.objectContaining({
        isError: true,
        content: expect.arrayContaining([
          expect.objectContaining({
            type: "text",
            text: expect.stringContaining("not configured"),
          }),
        ]),
      })
    );
  });
});

describe("buildOzoneRequest", () => {
  it("should build request for DID subject with apply action", () => {
    const result = buildOzoneRequest(
      "did:plc:example123",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    if (!result.ok) {
      throw new Error("Should not have error");
    }

    expect(result.request.subject).toEqual({
      $type: "com.atproto.admin.defs#repoRef",
      did: "did:plc:example123",
    });
    expect(result.request.event.createLabelVals).toEqual(["spam"]);
    expect(result.request.event.negateLabelVals).toEqual([]);
    expect(result.request.createdBy).toBe("did:plc:moderator456");
  });

  it("should build request for AT-URI subject with remove action", () => {
    const result = buildOzoneRequest(
      "at://did:plc:example/app.bsky.feed.post/abc123",
      "spam",
      "remove",
      "did:plc:moderator456"
    );

    if (!result.ok) {
      throw new Error("Should not have error");
    }

    expect(result.request.subject).toEqual({
      $type: "com.atproto.repo.strongRef",
      uri: "at://did:plc:example/app.bsky.feed.post/abc123",
    });
    expect(result.request.event.createLabelVals).toEqual([]);
    expect(result.request.event.negateLabelVals).toEqual(["spam"]);
  });

  it("should reject invalid subject format", () => {
    const result = buildOzoneRequest(
      "invalid-subject",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    if (result.ok) {
      throw new Error("Should have error");
    }

    expect(result.error).toContain("Subject must be a DID");
  });

  it("should set correct event type", () => {
    const result = buildOzoneRequest(
      "did:plc:example123",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    if (!result.ok) {
      throw new Error("Should not have error");
    }

    expect(result.request.event.$type).toBe(
      "tools.ozone.moderation.defs#modEventLabel"
    );
  });

  it("should handle different label values", () => {
    const result = buildOzoneRequest(
      "did:plc:example123",
      "nsfw",
      "apply",
      "did:plc:moderator456"
    );

    if (!result.ok) {
      throw new Error("Should not have error");
    }

    expect(result.request.event.createLabelVals).toEqual(["nsfw"]);
  });

  it("should use provided createdBy value", () => {
    const did = "did:plc:different-mod";
    const result = buildOzoneRequest(
      "did:plc:example123",
      "spam",
      "apply",
      did
    );

    if (!result.ok) {
      throw new Error("Should not have error");
    }

    expect(result.request.createdBy).toBe(did);
  });
});
