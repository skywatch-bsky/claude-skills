import { describe, it, expect, mock, afterEach } from "bun:test";
import {
  buildOzoneRequest,
  buildSubjectRef,
  validateOzoneConfig,
  buildModTool,
  registerOzoneTools,
  ozoneRequest,
  __resetSessionCache,
  REVIEW_STATE_MAP,
  EVENT_TYPE_MAP,
  buildQueryString,
} from "./ozone.ts";
import { createMockServer } from "../test-utils";

describe("registerOzoneTools handler", () => {
  it("AC3.4: should return not configured error when credentials are null", async () => {
    const { mockServer, getHandler } = createMockServer();

    await registerOzoneTools(mockServer, {
      serviceUrl: null,
      handle: null,
      adminPassword: null,
      did: null,
      pdsHost: null,
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

  it("should build request for AT-URI subject with remove action and cid", () => {
    const result = buildOzoneRequest(
      "at://did:plc:example/app.bsky.feed.post/abc123",
      "spam",
      "remove",
      "did:plc:moderator456",
      undefined,
      undefined,
      "bafyreiexample123"
    );

    if (!result.ok) {
      throw new Error("Should not have error");
    }

    expect(result.request.subject).toEqual({
      $type: "com.atproto.repo.strongRef",
      uri: "at://did:plc:example/app.bsky.feed.post/abc123",
      cid: "bafyreiexample123",
    });
    expect(result.request.event.createLabelVals).toEqual([]);
    expect(result.request.event.negateLabelVals).toEqual(["spam"]);
  });

  it("should reject AT-URI subject without cid", () => {
    const result = buildOzoneRequest(
      "at://did:plc:example/app.bsky.feed.post/abc123",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    if (result.ok) {
      throw new Error("Should have error");
    }

    expect(result.error).toContain("cid");
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

  it("should generate a UUID batchId when none provided", () => {
    const result = buildOzoneRequest(
      "did:plc:example123",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    if (!result.ok) {
      throw new Error("Should not have error");
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(result.request.modTool.meta.batchId).toMatch(uuidRegex);
  });

  it("should use provided batchId across multiple calls", () => {
    const batchId = "550e8400-e29b-41d4-a716-446655440000";

    const result1 = buildOzoneRequest(
      "did:plc:account1",
      "spam",
      "apply",
      "did:plc:moderator456",
      undefined,
      batchId
    );

    const result2 = buildOzoneRequest(
      "did:plc:account2",
      "spam",
      "apply",
      "did:plc:moderator456",
      undefined,
      batchId
    );

    if (!result1.ok || !result2.ok) {
      throw new Error("Should not have error");
    }

    expect(result1.request.modTool.meta.batchId).toBe(batchId);
    expect(result2.request.modTool.meta.batchId).toBe(batchId);
  });

  it("should generate UUIDv7 (sortable by time) when none provided", () => {
    const result = buildOzoneRequest(
      "did:plc:example123",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    if (!result.ok) {
      throw new Error("Should not have error");
    }

    const batchId = result.request.modTool.meta.batchId;
    const versionNibble = batchId.charAt(14);
    expect(versionNibble).toBe("7");
  });

  it("should generate different batchIds for separate calls without batchId", () => {
    const result1 = buildOzoneRequest(
      "did:plc:account1",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    const result2 = buildOzoneRequest(
      "did:plc:account2",
      "spam",
      "apply",
      "did:plc:moderator456"
    );

    if (!result1.ok || !result2.ok) {
      throw new Error("Should not have error");
    }

    expect(result1.request.modTool.meta.batchId).not.toBe(
      result2.request.modTool.meta.batchId
    );
  });
});

describe("buildSubjectRef", () => {
  it("AC1.1: should return repoRef for valid DID input", () => {
    const result = buildSubjectRef("did:plc:example123");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Should not have error");
    }

    expect(result.ref).toEqual({
      $type: "com.atproto.admin.defs#repoRef",
      did: "did:plc:example123",
    });
  });

  it("AC1.2: should return strongRef for valid AT-URI with CID", () => {
    const result = buildSubjectRef(
      "at://did:plc:example/app.bsky.feed.post/abc",
      "bafyrei123"
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Should not have error");
    }

    expect(result.ref).toEqual({
      $type: "com.atproto.repo.strongRef",
      uri: "at://did:plc:example/app.bsky.feed.post/abc",
      cid: "bafyrei123",
    });
  });

  it("AC1.3: should return error for AT-URI without CID", () => {
    const result = buildSubjectRef("at://did:plc:example/app.bsky.feed.post/abc");

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Should have error");
    }

    expect(result.error).toContain("cid");
  });

  it("AC1.4: should return error for invalid subject format", () => {
    const result = buildSubjectRef("invalid-subject");

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Should have error");
    }

    expect(result.error).toContain("DID");
    expect(result.error).toContain("AT-URI");
  });
});

describe("validateOzoneConfig", () => {
  it("AC1.5: should return null when all credentials present", () => {
    const config = {
      serviceUrl: "https://example.com",
      handle: "admin.example",
      adminPassword: "password123",
      did: "did:plc:example",
      pdsHost: "bsky.social",
    };

    const result = validateOzoneConfig(config);

    expect(result).toBeNull();
  });

  it("AC1.6: should return error when handle is null", () => {
    const config = {
      serviceUrl: "https://example.com",
      handle: null,
      adminPassword: "password123",
      did: "did:plc:example",
      pdsHost: "bsky.social",
    };

    const result = validateOzoneConfig(config);

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("Should have error");
    }

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not configured");
  });

  it("AC1.6: should return error when adminPassword is null", () => {
    const config = {
      serviceUrl: "https://example.com",
      handle: "admin.example",
      adminPassword: null,
      did: "did:plc:example",
      pdsHost: "bsky.social",
    };

    const result = validateOzoneConfig(config);

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("Should have error");
    }

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not configured");
  });

  it("AC1.6: should return error when did is null", () => {
    const config = {
      serviceUrl: "https://example.com",
      handle: "admin.example",
      adminPassword: "password123",
      did: null,
      pdsHost: "bsky.social",
    };

    const result = validateOzoneConfig(config);

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("Should have error");
    }

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not configured");
  });

  it("AC1.6: should return error when pdsHost is null", () => {
    const config = {
      serviceUrl: "https://example.com",
      handle: "admin.example",
      adminPassword: "password123",
      did: "did:plc:example",
      pdsHost: null,
    };

    const result = validateOzoneConfig(config);

    expect(result).not.toBeNull();
    if (result === null) {
      throw new Error("Should have error");
    }

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not configured");
  });
});

describe("buildModTool", () => {
  it("AC1.8: should generate valid UUIDv7 batchId when omitted", () => {
    const result = buildModTool();

    expect(result.name).toBe("skywatch-mcp");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(result.meta.batchId).toMatch(uuidRegex);

    const versionNibble = result.meta.batchId.charAt(14);
    expect(versionNibble).toBe("7");
  });

  it("AC1.8: should use provided batchId", () => {
    const customBatchId = "550e8400-e29b-41d4-a716-446655440000";
    const result = buildModTool(customBatchId);

    expect(result.name).toBe("skywatch-mcp");
    expect(result.meta.batchId).toBe(customBatchId);
  });

  it("should always have name 'skywatch-mcp'", () => {
    const result1 = buildModTool();
    const result2 = buildModTool("some-uuid");

    expect(result1.name).toBe("skywatch-mcp");
    expect(result2.name).toBe("skywatch-mcp");
  });

  it("should set time to current ISO string", () => {
    const beforeTime = new Date();
    const result = buildModTool();
    const afterTime = new Date();
    const resultTime = new Date(result.meta.time);

    expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(resultTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});

describe("ozoneRequest", () => {
  afterEach(() => {
    __resetSessionCache();
  });

  it("AC1.7: should return success with parsed JSON on 200 response", async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;

    (globalThis as any).fetch = mock(async () => {
      callCount++;

      if (callCount === 1) {
        return new Response(
          JSON.stringify({ accessJwt: "token1", refreshJwt: "refresh1" }),
          { status: 200 }
        );
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    try {
      const config: any = {
        pdsHost: "example.com",
        handle: "admin",
        adminPassword: "pass",
        did: "did:plc:example",
        serviceUrl: null,
      };

      const result = await ozoneRequest(config, "POST", "test.endpoint", { test: true });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ success: true });
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("AC1.7: should handle expired token and retry with refreshed token", async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;

    (globalThis as any).fetch = mock(async () => {
      callCount++;

      if (callCount === 1) {
        return new Response(
          JSON.stringify({ accessJwt: "token1", refreshJwt: "refresh1" }),
          { status: 200 }
        );
      } else if (callCount === 2) {
        return new Response('{"error":"ExpiredToken"}', { status: 401 });
      } else if (callCount === 3) {
        return new Response(
          JSON.stringify({ accessJwt: "token2", refreshJwt: "refresh2" }),
          { status: 200 }
        );
      } else if (callCount === 4) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      return new Response('{"error":"Unexpected call"}', { status: 500 });
    });

    try {
      const config: any = {
        pdsHost: "example.com",
        handle: "admin",
        adminPassword: "pass",
        did: "did:plc:example",
        serviceUrl: null,
      };

      const result = await ozoneRequest(config, "POST", "test.endpoint", { test: true });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ success: true });
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("AC1.7: should return failure when retry also fails", async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;

    (globalThis as any).fetch = mock(async () => {
      callCount++;

      if (callCount === 1) {
        return new Response(
          JSON.stringify({ accessJwt: "token1", refreshJwt: "refresh1" }),
          { status: 200 }
        );
      } else if (callCount === 2) {
        return new Response('{"error":"ExpiredToken"}', { status: 401 });
      } else if (callCount === 3) {
        return new Response(
          JSON.stringify({ accessJwt: "token2", refreshJwt: "refresh2" }),
          { status: 200 }
        );
      } else if (callCount === 4) {
        return new Response('{"error":"Still failed"}', { status: 401 });
      }

      return new Response('{"error":"Unexpected call"}', { status: 500 });
    });

    try {
      const config: any = {
        pdsHost: "example.com",
        handle: "admin",
        adminPassword: "pass",
        did: "did:plc:example",
        serviceUrl: null,
      };

      const result = await ozoneRequest(config, "POST", "test.endpoint", { test: true });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
        expect(result.text).toContain("Still failed");
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should handle non-JSON response gracefully", async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;

    (globalThis as any).fetch = mock(async () => {
      callCount++;

      if (callCount === 1) {
        return new Response(
          JSON.stringify({ accessJwt: "token1", refreshJwt: "refresh1" }),
          { status: 200 }
        );
      }

      return new Response("Not valid JSON", { status: 200 });
    });

    try {
      const config: any = {
        pdsHost: "example.com",
        handle: "admin",
        adminPassword: "pass",
        did: "did:plc:example",
        serviceUrl: null,
      };

      const result = await ozoneRequest(config, "POST", "test.endpoint", { test: true });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.text).toContain("Invalid JSON");
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("REVIEW_STATE_MAP", () => {
  it("AC2.2: should map 'open' to tools.ozone.moderation.defs#reviewOpen", () => {
    expect(REVIEW_STATE_MAP["open"]).toBe("tools.ozone.moderation.defs#reviewOpen");
  });

  it("AC2.2: should map 'escalated' to tools.ozone.moderation.defs#reviewEscalated", () => {
    expect(REVIEW_STATE_MAP["escalated"]).toBe("tools.ozone.moderation.defs#reviewEscalated");
  });

  it("AC2.2: should map 'closed' to tools.ozone.moderation.defs#reviewClosed", () => {
    expect(REVIEW_STATE_MAP["closed"]).toBe("tools.ozone.moderation.defs#reviewClosed");
  });

  it("AC2.2: should map 'none' to tools.ozone.moderation.defs#reviewNone", () => {
    expect(REVIEW_STATE_MAP["none"]).toBe("tools.ozone.moderation.defs#reviewNone");
  });
});

describe("EVENT_TYPE_MAP", () => {
  it("AC2.4: should map 'comment' to tools.ozone.moderation.defs#modEventComment", () => {
    expect(EVENT_TYPE_MAP["comment"]).toBe("tools.ozone.moderation.defs#modEventComment");
  });

  it("AC2.4: should map 'takedown' to tools.ozone.moderation.defs#modEventTakedown", () => {
    expect(EVENT_TYPE_MAP["takedown"]).toBe("tools.ozone.moderation.defs#modEventTakedown");
  });

  it("AC2.4: should map 'label' to tools.ozone.moderation.defs#modEventLabel", () => {
    expect(EVENT_TYPE_MAP["label"]).toBe("tools.ozone.moderation.defs#modEventLabel");
  });

  it("AC2.4: should map 'acknowledge' to tools.ozone.moderation.defs#modEventAcknowledge", () => {
    expect(EVENT_TYPE_MAP["acknowledge"]).toBe("tools.ozone.moderation.defs#modEventAcknowledge");
  });

  it("AC2.4: should map 'escalate' to tools.ozone.moderation.defs#modEventEscalate", () => {
    expect(EVENT_TYPE_MAP["escalate"]).toBe("tools.ozone.moderation.defs#modEventEscalate");
  });

  it("AC2.4: should map 'tag' to tools.ozone.moderation.defs#modEventTag", () => {
    expect(EVENT_TYPE_MAP["tag"]).toBe("tools.ozone.moderation.defs#modEventTag");
  });
});

describe("buildQueryString", () => {
  it("AC2.6: should omit undefined values", () => {
    const result = buildQueryString({
      a: "1",
      b: undefined,
      c: "3",
    });

    expect(result).toBe("?a=1&c=3");
  });

  it("AC2.6: should return empty string when no params", () => {
    const result = buildQueryString({});

    expect(result).toBe("");
  });

  it("AC2.6: should return empty string when all params are undefined", () => {
    const result = buildQueryString({
      a: undefined,
      b: undefined,
    });

    expect(result).toBe("");
  });

  it("AC2.6: should handle array values with multiple query params", () => {
    const result = buildQueryString({
      tags: ["tag1", "tag2"],
      subject: "did:plc:example",
    });

    expect(result).toContain("tags=tag1");
    expect(result).toContain("tags=tag2");
    expect(result).toContain("subject=did%3Aplc%3Aexample");
  });

  it("AC2.6: should handle empty arrays as undefined", () => {
    const result = buildQueryString({
      a: "1",
      tags: [],
      b: "2",
    });

    expect(result).toContain("a=1");
    expect(result).toContain("b=2");
  });

  it("AC2.6: should handle boolean values as strings", () => {
    const result = buildQueryString({
      appealed: "true",
      takendown: "false",
    });

    expect(result).toContain("appealed=true");
    expect(result).toContain("takendown=false");
  });
});

describe("ozone_query_statuses tool", () => {
  it("AC2.5: should return not configured error when credentials are null", async () => {
    const { mockServer, getHandler } = createMockServer();

    await registerOzoneTools(mockServer, {
      serviceUrl: null,
      handle: null,
      adminPassword: null,
      did: null,
      pdsHost: null,
    });

    const capturedHandler = getHandler("ozone_query_statuses");
    expect(capturedHandler).not.toBeNull();

    const result = await (capturedHandler!({
      subject: "did:plc:example123",
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

  it("should register ozone_query_statuses tool", async () => {
    const { mockServer, getHandler } = createMockServer();

    await registerOzoneTools(mockServer, {
      serviceUrl: "https://example.com",
      handle: "admin.example",
      adminPassword: "password123",
      did: "did:plc:example",
      pdsHost: "bsky.social",
    });

    const handler = getHandler("ozone_query_statuses");
    expect(handler).not.toBeNull();
  });
});

describe("ozone_query_events tool", () => {
  it("AC2.5: should return not configured error when credentials are null", async () => {
    const { mockServer, getHandler } = createMockServer();

    await registerOzoneTools(mockServer, {
      serviceUrl: null,
      handle: null,
      adminPassword: null,
      did: null,
      pdsHost: null,
    });

    const capturedHandler = getHandler("ozone_query_events");
    expect(capturedHandler).not.toBeNull();

    const result = await (capturedHandler!({
      subject: "did:plc:example123",
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

  it("should register ozone_query_events tool", async () => {
    const { mockServer, getHandler } = createMockServer();

    await registerOzoneTools(mockServer, {
      serviceUrl: "https://example.com",
      handle: "admin.example",
      adminPassword: "password123",
      did: "did:plc:example",
      pdsHost: "bsky.social",
    });

    const handler = getHandler("ozone_query_events");
    expect(handler).not.toBeNull();
  });
});
