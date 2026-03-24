// pattern: Imperative Shell
// MCP tool handler for Ozone moderation label management

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function uuidv7(): string {
  const now = Date.now();
  const bytes = randomBytes(16);

  // Timestamp: 48 bits in bytes 0-5
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;

  // Version 7
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  // Variant 10xx
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type OzoneConfig = {
  readonly serviceUrl: string | null;
  readonly handle: string | null;
  readonly adminPassword: string | null;
  readonly did: string | null;
  readonly pdsHost: string | null;
};

export type SubjectRef =
  | { $type: "com.atproto.admin.defs#repoRef"; did: string }
  | { $type: "com.atproto.repo.strongRef"; uri: string; cid: string };

export type ModTool = {
  readonly name: string;
  readonly meta: {
    readonly time: string;
    readonly batchId: string;
  };
};

type OzoneEventRequest = {
  readonly event: {
    readonly $type: "tools.ozone.moderation.defs#modEventLabel";
    readonly comment?: string;
    readonly createLabelVals: ReadonlyArray<string>;
    readonly negateLabelVals: ReadonlyArray<string>;
  };
  readonly subject: SubjectRef;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly modTool: ModTool;
};

export function validateOzoneConfig(
  config: OzoneConfig,
): { isError: true; content: Array<{ type: string; text: string }> } | null {
  if (!config.handle || !config.adminPassword || !config.did || !config.pdsHost) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: "Ozone is not configured. Set OZONE_HANDLE, OZONE_PDS, OZONE_ADMIN_PASSWORD, and OZONE_DID environment variables.",
        },
      ],
    };
  }
  return null;
}

export function buildSubjectRef(
  subject: string,
  cid?: string,
): { ok: true; ref: SubjectRef } | { ok: false; error: string } {
  if (subject.startsWith("did:")) {
    return {
      ok: true,
      ref: { $type: "com.atproto.admin.defs#repoRef", did: subject },
    };
  }
  if (subject.startsWith("at://")) {
    if (!cid) {
      return {
        ok: false,
        error:
          "AT-URI subjects require a cid parameter. Use com.atproto.repo.getRecord to resolve the CID for the record.",
      };
    }
    return {
      ok: true,
      ref: { $type: "com.atproto.repo.strongRef", uri: subject, cid },
    };
  }
  return {
    ok: false,
    error:
      'Subject must be a DID (did:plc:...) or AT-URI (at://...). Got: ' +
      subject,
  };
}

export function buildModTool(batchId?: string): ModTool {
  return {
    name: "skywatch-mcp",
    meta: {
      time: new Date().toISOString(),
      batchId: batchId ?? uuidv7(),
    },
  };
}

export function buildOzoneRequest(
  subject: string,
  label: string,
  action: "apply" | "remove",
  createdBy: string,
  comment?: string,
  batchId?: string,
  cid?: string
): { ok: true; request: OzoneEventRequest } | { ok: false; error: string } {
  const subjectRefResult = buildSubjectRef(subject, cid);
  if (!subjectRefResult.ok) {
    return { ok: false, error: subjectRefResult.error };
  }

  const event = {
    $type: "tools.ozone.moderation.defs#modEventLabel" as const,
    ...(comment ? { comment } : {}),
    createLabelVals: action === "apply" ? [label] : [],
    negateLabelVals: action === "remove" ? [label] : [],
  };

  const now = new Date().toISOString();
  const modTool = buildModTool(batchId);

  return {
    ok: true,
    request: {
      event,
      subject: subjectRefResult.ref,
      createdBy,
      createdAt: now,
      modTool,
    },
  };
}

type SessionTokens = {
  accessJwt: string;
  refreshJwt: string;
};

let cachedSession: SessionTokens | null = null;

export function __resetSessionCache(): void {
  cachedSession = null;
}

async function createSession(config: OzoneConfig): Promise<string> {
  const response = await fetch(
    `https://${config.pdsHost}/xrpc/com.atproto.server.createSession`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: config.handle,
        password: config.adminPassword,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create session (${response.status}): ${body}`);
  }

  const session = (await response.json()) as SessionTokens;
  cachedSession = session;
  return session.accessJwt;
}

async function refreshSession(config: OzoneConfig): Promise<string> {
  if (!cachedSession) {
    return createSession(config);
  }

  const response = await fetch(
    `https://${config.pdsHost}/xrpc/com.atproto.server.refreshSession`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cachedSession.refreshJwt}`,
      },
    }
  );

  if (!response.ok) {
    cachedSession = null;
    return createSession(config);
  }

  const session = (await response.json()) as SessionTokens;
  cachedSession = session;
  return session.accessJwt;
}

async function getAccessToken(config: OzoneConfig): Promise<string> {
  if (cachedSession) {
    return cachedSession.accessJwt;
  }
  return createSession(config);
}

export async function ozoneRequest(
  config: OzoneConfig,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; text: string }> {
  const makeRequest = async (jwt: string): Promise<Response> =>
    fetch(`https://${config.pdsHost}/xrpc/${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${jwt}`,
        "atproto-proxy": `${config.did}#atproto_labeler`,
        "atproto-accept-labelers": "did:plc:ar7c4by46qjdydhdevvrndac;redact",
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

  let accessJwt = await getAccessToken(config);
  let response = await makeRequest(accessJwt);

  if (!response.ok) {
    const responseBody = await response.text();
    const isExpired = responseBody.includes("ExpiredToken");

    if (isExpired) {
      accessJwt = await refreshSession(config);
      response = await makeRequest(accessJwt);
    }

    if (!response.ok) {
      const retryBody = isExpired ? await response.text() : responseBody;
      return { ok: false, status: response.status, text: retryBody };
    }
  }

  const responseText = await response.text();
  try {
    return { ok: true, data: responseText ? JSON.parse(responseText) : null };
  } catch {
    return {
      ok: false,
      status: response.status,
      text: `Invalid JSON response: ${responseText.slice(0, 200)}`,
    };
  }
}

export async function registerOzoneTools(
  server: McpServer,
  config: OzoneConfig
): Promise<void> {
  server.tool(
    "ozone_label",
    "Apply or remove a moderation label on a subject via the Ozone moderation service. For account labels, pass a DID. For post/record labels, pass an AT-URI with its CID (resolve via com.atproto.repo.getRecord).",
    {
      subject: z
        .string()
        .describe("Subject to label — a DID (did:plc:...) or AT-URI (at://...)"),
      label: z.string().describe("Label value to apply or remove"),
      action: z
        .enum(["apply", "remove"])
        .describe("Whether to apply or remove the label"),
      comment: z
        .string()
        .optional()
        .describe("Optional comment to attach to the label event"),
      cid: z
        .string()
        .optional()
        .describe("CID (content hash) of the record. Required when subject is an AT-URI for post-level labelling. Not needed for account-level labels (DID subjects). Resolve via com.atproto.repo.getRecord."),
      batchId: z
        .string()
        .uuid()
        .optional()
        .describe("UUID to group related label operations into a batch. All labels applied as part of the same investigation action should share one batchId. If omitted, a new UUID is generated per call."),
    },
    async (args) => {
      try {
        const configError = validateOzoneConfig(config);
        if (configError) {
          return configError;
        }

        const { subject, label, action, comment, cid, batchId } = args;

        const result = buildOzoneRequest(subject, label, action, config.did, comment, batchId, cid);
        if (!result.ok) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: result.error,
              },
            ],
          };
        }

        const request = result.request;

        const ozoneResult = await ozoneRequest(config, "POST", "tools.ozone.moderation.emitEvent", request);

        if (!ozoneResult.ok) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Ozone API error (${ozoneResult.status}): ${ozoneResult.text}`,
              },
            ],
          };
        }

        const responseResult = {
          success: true,
          action,
          subject,
          label,
          response: ozoneResult.data,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(responseResult, null, 2),
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
