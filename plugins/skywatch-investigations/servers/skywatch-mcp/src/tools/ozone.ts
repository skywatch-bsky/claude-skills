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

export const REVIEW_STATE_MAP: Record<"open" | "escalated" | "closed" | "none", string> = {
  open: "tools.ozone.moderation.defs#reviewOpen",
  escalated: "tools.ozone.moderation.defs#reviewEscalated",
  closed: "tools.ozone.moderation.defs#reviewClosed",
  none: "tools.ozone.moderation.defs#reviewNone",
};

export const EVENT_TYPE_MAP: Record<"takedown" | "reverseTakedown" | "comment" | "report" | "label" | "acknowledge" | "escalate" | "mute" | "unmute" | "muteReporter" | "unmuteReporter" | "email" | "resolveAppeal" | "divert" | "tag" | "accountEvent" | "identityEvent" | "recordEvent", string> = {
  takedown: "tools.ozone.moderation.defs#modEventTakedown",
  reverseTakedown: "tools.ozone.moderation.defs#modEventReverseTakedown",
  comment: "tools.ozone.moderation.defs#modEventComment",
  report: "tools.ozone.moderation.defs#modEventReport",
  label: "tools.ozone.moderation.defs#modEventLabel",
  acknowledge: "tools.ozone.moderation.defs#modEventAcknowledge",
  escalate: "tools.ozone.moderation.defs#modEventEscalate",
  mute: "tools.ozone.moderation.defs#modEventMute",
  unmute: "tools.ozone.moderation.defs#modEventUnmute",
  muteReporter: "tools.ozone.moderation.defs#modEventMuteReporter",
  unmuteReporter: "tools.ozone.moderation.defs#modEventUnmuteReporter",
  email: "tools.ozone.moderation.defs#modEventEmail",
  resolveAppeal: "tools.ozone.moderation.defs#modEventResolveAppeal",
  divert: "tools.ozone.moderation.defs#modEventDivert",
  tag: "tools.ozone.moderation.defs#modEventTag",
  accountEvent: "tools.ozone.moderation.defs#accountEvent",
  identityEvent: "tools.ozone.moderation.defs#identityEvent",
  recordEvent: "tools.ozone.moderation.defs#recordEvent",
};

export function buildQueryString(
  params: Record<string, string | ReadonlyArray<string> | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    } else {
      searchParams.set(key, value);
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function validateOzoneConfig(
  config: OzoneConfig,
): { isError: true; content: Array<{ type: "text"; text: string }> } | null {
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

type EmitEventOptions = {
  readonly config: OzoneConfig;
  readonly subject: string;
  readonly cid?: string;
  readonly comment?: string;
  readonly batchId?: string;
  readonly event: Record<string, unknown>;
};

async function emitOzoneEvent(
  options: EmitEventOptions,
): Promise<{ isError?: true; content: Array<{ type: string; text: string }> }> {
  try {
    const configError = validateOzoneConfig(options.config);
    if (configError) return configError;

    const subjectResult = buildSubjectRef(options.subject, options.cid);
    if (!subjectResult.ok) {
      return {
        isError: true,
        content: [{ type: "text", text: subjectResult.error }],
      };
    }

    const body = {
      event: {
        ...options.event,
        ...(options.comment ? { comment: options.comment } : {}),
      },
      subject: subjectResult.ref,
      createdBy: options.config.did,
      createdAt: new Date().toISOString(),
      modTool: buildModTool(options.batchId),
    };

    const result = await ozoneRequest(
      options.config,
      "POST",
      "tools.ozone.moderation.emitEvent",
      body,
    );

    if (!result.ok) {
      return {
        isError: true,
        content: [{ type: "text", text: `Ozone API error (${result.status}): ${result.text}` }],
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: "text", text: errorMessage }],
    };
  }
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

  server.tool(
    "ozone_query_statuses",
    "Query subject statuses from the Ozone moderation queue with optional filtering and pagination.",
    {
      subject: z.string().optional().describe("Filter by subject — a DID or AT-URI"),
      reviewState: z
        .enum(["open", "escalated", "closed", "none"])
        .optional()
        .describe("Filter by review state"),
      sortField: z
        .enum(["lastReportedAt", "lastReviewedAt", "priorityScore"])
        .optional()
        .describe("Field to sort by (default: lastReportedAt)"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction (default: desc)"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Filter to subjects with ALL of these tags"),
      excludeTags: z
        .array(z.string())
        .optional()
        .describe("Exclude subjects with ANY of these tags"),
      appealed: z.boolean().optional().describe("Filter by appeal status"),
      takendown: z.boolean().optional().describe("Filter by takedown status"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results to return (default: 50, max: 100)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
    },
    async (args) => {
      try {
        const configError = validateOzoneConfig(config);
        if (configError) {
          return configError;
        }

        const {
          subject,
          reviewState,
          sortField,
          sortDirection,
          tags,
          excludeTags,
          appealed,
          takendown,
          limit,
          cursor,
        } = args;

        const mappedReviewState = reviewState ? REVIEW_STATE_MAP[reviewState] : undefined;

        const queryParams: Record<string, string | ReadonlyArray<string> | undefined> = {
          subject,
          reviewState: mappedReviewState,
          sortField,
          sortDirection,
          tags,
          excludeTags,
          appealed: appealed !== undefined ? String(appealed) : undefined,
          takendown: takendown !== undefined ? String(takendown) : undefined,
          limit: limit !== undefined ? String(limit) : undefined,
          cursor,
        };

        const queryString = buildQueryString(queryParams);
        const ozoneResult = await ozoneRequest(
          config,
          "GET",
          `tools.ozone.moderation.queryStatuses${queryString}`,
        );

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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(ozoneResult.data, null, 2),
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

  server.tool(
    "ozone_query_events",
    "Query moderation events from Ozone with optional filtering and pagination.",
    {
      subject: z.string().optional().describe("Filter by subject — a DID or AT-URI"),
      types: z
        .array(
          z.enum([
            "takedown",
            "reverseTakedown",
            "comment",
            "report",
            "label",
            "acknowledge",
            "escalate",
            "mute",
            "unmute",
            "muteReporter",
            "unmuteReporter",
            "email",
            "resolveAppeal",
            "divert",
            "tag",
            "accountEvent",
            "identityEvent",
            "recordEvent",
          ]),
        )
        .optional()
        .describe("Filter by event types (shorthand names)"),
      createdBy: z
        .string()
        .optional()
        .describe("Filter by the DID of the moderator who created the event"),
      createdAfter: z
        .string()
        .optional()
        .describe("Filter to events created after this ISO 8601 datetime"),
      createdBefore: z
        .string()
        .optional()
        .describe("Filter to events created before this ISO 8601 datetime"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction (default: desc)"),
      hasComment: z.boolean().optional().describe("Filter to events that have a comment"),
      addedLabels: z
        .array(z.string())
        .optional()
        .describe("Filter to events that added these labels"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results to return (default: 50, max: 100)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
    },
    async (args) => {
      try {
        const configError = validateOzoneConfig(config);
        if (configError) {
          return configError;
        }

        const {
          subject,
          types,
          createdBy,
          createdAfter,
          createdBefore,
          sortDirection,
          hasComment,
          addedLabels,
          limit,
          cursor,
        } = args;

        const mappedTypes = types
          ? types.map((t) => {
              const mapped = EVENT_TYPE_MAP[t as keyof typeof EVENT_TYPE_MAP];
              if (!mapped) {
                throw new Error(`Unknown event type: ${t}`);
              }
              return mapped;
            })
          : undefined;

        const queryParams: Record<string, string | ReadonlyArray<string> | undefined> = {
          subject,
          types: mappedTypes,
          createdBy,
          createdAfter,
          createdBefore,
          sortDirection,
          hasComment: hasComment !== undefined ? String(hasComment) : undefined,
          addedLabels,
          limit: limit !== undefined ? String(limit) : undefined,
          cursor,
        };

        const queryString = buildQueryString(queryParams);
        const ozoneResult = await ozoneRequest(
          config,
          "GET",
          `tools.ozone.moderation.queryEvents${queryString}`,
        );

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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(ozoneResult.data, null, 2),
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
