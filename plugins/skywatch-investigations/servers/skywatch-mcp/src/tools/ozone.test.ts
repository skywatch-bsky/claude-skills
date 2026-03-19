import { describe, it, expect } from "bun:test";
import { buildOzoneRequest } from "./ozone.ts";

describe("buildOzoneRequest", () => {
  it("should build request for DID subject with apply action", () => {
    const result = buildOzoneRequest(
      "did:plc:example123",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    if ("error" in result) {
      throw new Error("Should not have error");
    }

    expect(result.subject).toEqual({
      $type: "com.atproto.admin.defs#repoRef",
      did: "did:plc:example123",
    });
    expect(result.event.createLabelVals).toEqual(["spam"]);
    expect(result.event.negateLabelVals).toEqual([]);
    expect(result.createdBy).toBe("did:plc:moderator456");
  });

  it("should build request for AT-URI subject with remove action", () => {
    const result = buildOzoneRequest(
      "at://did:plc:example/app.bsky.feed.post/abc123",
      "spam",
      "remove",
      "did:plc:moderator456"
    );

    if ("error" in result) {
      throw new Error("Should not have error");
    }

    expect(result.subject).toEqual({
      $type: "com.atproto.repo.strongRef",
      uri: "at://did:plc:example/app.bsky.feed.post/abc123",
    });
    expect(result.event.createLabelVals).toEqual([]);
    expect(result.event.negateLabelVals).toEqual(["spam"]);
  });

  it("should reject invalid subject format", () => {
    const result = buildOzoneRequest(
      "invalid-subject",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    if (!("error" in result)) {
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

    if ("error" in result) {
      throw new Error("Should not have error");
    }

    expect(result.event.$type).toBe(
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

    if ("error" in result) {
      throw new Error("Should not have error");
    }

    expect(result.event.createLabelVals).toEqual(["nsfw"]);
  });

  it("should use provided createdBy value", () => {
    const did = "did:plc:different-mod";
    const result = buildOzoneRequest(
      "did:plc:example123",
      "spam",
      "apply",
      did
    );

    if ("error" in result) {
      throw new Error("Should not have error");
    }

    expect(result.createdBy).toBe(did);
  });
});
