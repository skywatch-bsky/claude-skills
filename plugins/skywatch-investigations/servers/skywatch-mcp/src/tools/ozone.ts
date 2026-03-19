// pattern: Imperative Shell
// MCP tool handler for Ozone moderation label management

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type OzoneConfig = {
  readonly serviceUrl: string | null;
  readonly adminPassword: string | null;
  readonly did: string | null;
};

type SubjectRef =
  | { $type: "com.atproto.admin.defs#repoRef"; did: string }
  | { $type: "com.atproto.repo.strongRef"; uri: string };

type OzoneEventRequest = {
  readonly event: {
    readonly $type: "tools.ozone.moderation.defs#modEventLabel";
    readonly createLabelVals: ReadonlyArray<string>;
    readonly negateLabelVals: ReadonlyArray<string>;
  };
  readonly subject: SubjectRef;
  readonly createdBy: string;
};

export function buildOzoneRequest(
  subject: string,
  label: string,
  action: "apply" | "remove",
  createdBy: string
): { ok: true; request: OzoneEventRequest } | { ok: false; error: string } {
  if (subject.startsWith("did:")) {
    const subjectRef: SubjectRef = {
      $type: "com.atproto.admin.defs#repoRef",
      did: subject,
    };
    return {
      ok: true,
      request: {
        event: {
          $type: "tools.ozone.moderation.defs#modEventLabel",
          createLabelVals: action === "apply" ? [label] : [],
          negateLabelVals: action === "remove" ? [label] : [],
        },
        subject: subjectRef,
        createdBy,
      },
    };
  } else if (subject.startsWith("at://")) {
    const subjectRef: SubjectRef = {
      $type: "com.atproto.repo.strongRef",
      uri: subject,
    };
    return {
      ok: true,
      request: {
        event: {
          $type: "tools.ozone.moderation.defs#modEventLabel",
          createLabelVals: action === "apply" ? [label] : [],
          negateLabelVals: action === "remove" ? [label] : [],
        },
        subject: subjectRef,
        createdBy,
      },
    };
  } else {
    return {
      ok: false,
      error:
        'Subject must be a DID (did:plc:...) or AT-URI (at://...). Got: ' +
        subject,
    };
  }
}

function encodeBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString("base64");
}

export async function registerOzoneTool(
  server: McpServer,
  config: OzoneConfig
): Promise<void> {
  server.tool(
    "ozone_label",
    "Apply or remove a moderation label on a subject (DID or AT-URI) via the Ozone moderation service.",
    {
      subject: z
        .string()
        .describe("Subject to label — a DID (did:plc:...) or AT-URI (at://...)"),
      label: z.string().describe("Label value to apply or remove"),
      action: z
        .enum(["apply", "remove"])
        .describe("Whether to apply or remove the label"),
    },
    async (args) => {
      try {
        if (!config.serviceUrl || !config.adminPassword || !config.did) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Ozone is not configured. Set OZONE_SERVICE_URL, OZONE_ADMIN_PASSWORD, and OZONE_DID environment variables.",
              },
            ],
          };
        }

        const { subject, label, action } = args as {
          subject: string;
          label: string;
          action: "apply" | "remove";
        };

        const result = buildOzoneRequest(subject, label, action, config.did);
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
        const authHeader = encodeBasicAuth("admin", config.adminPassword);

        const response = await fetch(
          `${config.serviceUrl}/xrpc/tools.ozone.moderation.emitEvent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authHeader}`,
            },
            body: JSON.stringify(request),
          }
        );

        const responseBody = await response.text();

        if (!response.ok) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Ozone API error (${response.status}): ${responseBody}`,
              },
            ],
          };
        }

        const responseResult = {
          success: true,
          action,
          subject,
          label,
          response: responseBody ? JSON.parse(responseBody) : null,
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
