# Ozone MCP Tools Implementation Plan — Phase 3: Write Tools

**Goal:** Add 7 write tools that emit moderation events via the Ozone `emitEvent` API.

**Architecture:** All write tools share a common pattern: validate config, build subject ref, construct typed event payload with `$type`, call `ozoneRequest` POST to `tools.ozone.moderation.emitEvent`. Each tool differs only in its `$type` value and event-specific parameters. A shared `emitOzoneEvent` helper encapsulates the common write flow.

**Tech Stack:** TypeScript, Bun, Zod, MCP SDK

**Scope:** 4 phases from original design (phase 3 of 4)

**Codebase verified:** 2026-03-24

---

## Acceptance Criteria Coverage

This phase implements and tests:

### ozone-mcp-tools.AC3: Write tools emit correct events
- **ozone-mcp-tools.AC3.1 Success:** Each write tool sets correct `$type` on event payload
- **ozone-mcp-tools.AC3.2 Success:** `ozone_comment` with `sticky: true` includes sticky flag in payload
- **ozone-mcp-tools.AC3.3 Success:** `ozone_acknowledge` with `acknowledgeAccountSubjects: true` includes flag
- **ozone-mcp-tools.AC3.4 Success:** `ozone_tag` includes `add` and `remove` arrays in payload
- **ozone-mcp-tools.AC3.5 Failure:** `ozone_tag` rejects when both `add` and `remove` are empty
- **ozone-mcp-tools.AC3.6 Success:** `ozone_mute` includes `durationInHours` in payload
- **ozone-mcp-tools.AC3.7 Failure:** `ozone_resolve_appeal` rejects when `comment` is missing
- **ozone-mcp-tools.AC3.8 Success:** All write tools include `modTool` metadata with `skywatch-mcp` name
- **ozone-mcp-tools.AC3.9 Success:** All write tools set `createdBy` to `config.did`
- **ozone-mcp-tools.AC3.10 Failure:** All write tools return credential error when config is incomplete

---

<!-- START_TASK_1 -->
### Task 1: Add shared `emitOzoneEvent` helper for write tools

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`

**Implementation:**

Add a helper function that encapsulates the common write tool flow. All 7 write tools will call this instead of duplicating the same pattern. This is internal — not exported.

```typescript
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

**NOTE:** `emitOzoneEvent` is for the 7 new write tools only. The existing `ozone_label` tool calls `ozoneRequest` directly and preserves its own response wrapper shape — do NOT refactor `ozone_label` to use `emitOzoneEvent`.
```

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All existing tests pass (no behaviour change — helper is not yet called).

**Commit:** `feat: add emitOzoneEvent helper for write tools`
<!-- END_TASK_1 -->

<!-- START_SUBCOMPONENT_A (tasks 2-3) -->

<!-- START_TASK_2 -->
### Task 2: Implement `ozone_comment`, `ozone_acknowledge`, and `ozone_escalate` tools

**Verifies:** ozone-mcp-tools.AC3.1, ozone-mcp-tools.AC3.2, ozone-mcp-tools.AC3.3, ozone-mcp-tools.AC3.8, ozone-mcp-tools.AC3.9, ozone-mcp-tools.AC3.10

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`

**Implementation:**

Add three tool registrations inside `registerOzoneTools`, after the read tools.

**`ozone_comment`** — Adds a comment to a subject's moderation record.

Zod schema:
- `subject` — `z.string().describe("Subject — a DID (did:plc:...) or AT-URI (at://...)")`
- `comment` — `z.string().describe("Comment text to add")`
- `sticky` — `z.boolean().optional().describe("If true, comment is pinned to the top of the subject's moderation history (default: false)")`
- `cid` — `z.string().optional().describe("CID of the record. Required when subject is an AT-URI.")`
- `batchId` — `z.string().uuid().optional().describe("UUID to group related actions into a batch. Auto-generated if omitted.")`

Handler: Call `emitOzoneEvent` with event `{ $type: "tools.ozone.moderation.defs#modEventComment", ...(args.sticky ? { sticky: true } : {}) }`. Note: `comment` is passed via `EmitEventOptions.comment`, not in the event object.

**`ozone_acknowledge`** — Acknowledges a subject, moving it from open to reviewed.

Zod schema:
- `subject` — `z.string().describe("Subject — a DID (did:plc:...) or AT-URI (at://...)")`
- `comment` — `z.string().optional().describe("Optional comment to attach")`
- `acknowledgeAccountSubjects` — `z.boolean().optional().describe("If true, also acknowledge all reported content by this account (default: false)")`
- `cid` — `z.string().optional().describe("CID of the record. Required when subject is an AT-URI.")`
- `batchId` — `z.string().uuid().optional().describe("UUID to group related actions into a batch. Auto-generated if omitted.")`

Handler: Call `emitOzoneEvent` with event `{ $type: "tools.ozone.moderation.defs#modEventAcknowledge", ...(args.acknowledgeAccountSubjects ? { acknowledgeAccountSubjects: true } : {}) }`.

**`ozone_escalate`** — Escalates a subject for higher-level review.

Zod schema:
- `subject` — `z.string().describe("Subject — a DID (did:plc:...) or AT-URI (at://...)")`
- `comment` — `z.string().optional().describe("Optional comment explaining the escalation")`
- `cid` — `z.string().optional().describe("CID of the record. Required when subject is an AT-URI.")`
- `batchId` — `z.string().uuid().optional().describe("UUID to group related actions into a batch. Auto-generated if omitted.")`

Handler: Call `emitOzoneEvent` with event `{ $type: "tools.ozone.moderation.defs#modEventEscalate" }`.

Tool descriptions should be concise but informative, following the style of the existing `ozone_label` description.

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All existing tests pass. New tools are registered.

**Commit:** `feat: add ozone_comment, ozone_acknowledge, ozone_escalate write tools`
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Tests for comment, acknowledge, and escalate tools

**Verifies:** ozone-mcp-tools.AC3.1, ozone-mcp-tools.AC3.2, ozone-mcp-tools.AC3.3, ozone-mcp-tools.AC3.10

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.test.ts` (unit)

**Testing:**

Add `describe` blocks for the three new write tools. Tests must verify:

- **ozone-mcp-tools.AC3.10:** Using `createMockServer()` with null credentials, call each handler — verify `{ isError: true }` with "not configured" text. (This pattern is already established for `ozone_label`.)
- **ozone-mcp-tools.AC3.1:** Verify each tool's handler is registered with the expected tool name (`"ozone_comment"`, `"ozone_acknowledge"`, `"ozone_escalate"`).
- **ozone-mcp-tools.AC3.2:** Mock `fetch` to capture the request body, then call the `ozone_comment` handler with `sticky: true`. Verify the captured body includes `event.sticky === true` and `event.$type === "tools.ozone.moderation.defs#modEventComment"`. Use the same fetch mocking strategy established in Phase 1 Task 6. Register with valid (non-null) config so the handler reaches the API call.
- **ozone-mcp-tools.AC3.3:** Mock `fetch` to capture the request body, then call `ozone_acknowledge` with `acknowledgeAccountSubjects: true`. Verify the captured body includes the flag and correct `$type`.

The credential validation test pattern:
```
registerOzoneTools(mockServer, nullConfig) → getHandler("ozone_comment") → call with minimal args → expect isError: true
```

The payload verification test pattern (using fetch mock):
```
registerOzoneTools(mockServer, validConfig) → mock fetch to capture body → getHandler("ozone_comment") → call with sticky: true → verify captured body has event.sticky === true
```

Remember to mock fetch to first respond to createSession (returning JWT tokens), then capture the emitEvent request body for assertion. Restore original fetch after each test.

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All tests pass.

**Commit:** `test: add tests for comment, acknowledge, escalate tools`
<!-- END_TASK_3 -->

<!-- END_SUBCOMPONENT_A -->

<!-- START_SUBCOMPONENT_B (tasks 4-5) -->

<!-- START_TASK_4 -->
### Task 4: Implement `ozone_tag`, `ozone_mute`, `ozone_unmute`, and `ozone_resolve_appeal` tools

**Verifies:** ozone-mcp-tools.AC3.1, ozone-mcp-tools.AC3.4, ozone-mcp-tools.AC3.5, ozone-mcp-tools.AC3.6, ozone-mcp-tools.AC3.7, ozone-mcp-tools.AC3.8, ozone-mcp-tools.AC3.9, ozone-mcp-tools.AC3.10

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`

**Implementation:**

Add four tool registrations inside `registerOzoneTools`.

**`ozone_tag`** — Adds and/or removes tags from a subject.

Zod schema:
- `subject` — `z.string().describe("Subject — a DID (did:plc:...) or AT-URI (at://...)")`
- `add` — `z.array(z.string()).default([]).describe("Tags to add")`
- `remove` — `z.array(z.string()).default([]).describe("Tags to remove")`
- `comment` — `z.string().optional().describe("Optional comment")`
- `cid` — `z.string().optional().describe("CID of the record. Required when subject is an AT-URI.")`
- `batchId` — `z.string().uuid().optional().describe("UUID to group related actions into a batch. Auto-generated if omitted.")`

Handler: **Before** calling `emitOzoneEvent`, validate that at least one of `add` or `remove` is non-empty. If both are empty arrays, return error:
```typescript
if (args.add.length === 0 && args.remove.length === 0) {
  return {
    isError: true,
    content: [{ type: "text", text: "At least one of 'add' or 'remove' must be non-empty." }],
  };
}
```

Then call `emitOzoneEvent` with event `{ $type: "tools.ozone.moderation.defs#modEventTag", add: args.add, remove: args.remove }`.

**`ozone_mute`** — Mutes a subject for a specified duration.

Zod schema:
- `subject` — `z.string().describe("Subject — a DID (did:plc:...) or AT-URI (at://...)")`
- `durationInHours` — `z.number().positive().describe("How long to mute (in hours)")`
- `comment` — `z.string().optional().describe("Optional comment")`
- `cid` — `z.string().optional().describe("CID of the record. Required when subject is an AT-URI.")`
- `batchId` — `z.string().uuid().optional().describe("UUID to group related actions into a batch. Auto-generated if omitted.")`

Handler: Call `emitOzoneEvent` with event `{ $type: "tools.ozone.moderation.defs#modEventMute", durationInHours: args.durationInHours }`.

**`ozone_unmute`** — Unmutes a previously muted subject.

Zod schema:
- `subject` — `z.string().describe("Subject — a DID (did:plc:...) or AT-URI (at://...)")`
- `comment` — `z.string().optional().describe("Optional comment")`
- `cid` — `z.string().optional().describe("CID of the record. Required when subject is an AT-URI.")`
- `batchId` — `z.string().uuid().optional().describe("UUID to group related actions into a batch. Auto-generated if omitted.")`

Handler: Call `emitOzoneEvent` with event `{ $type: "tools.ozone.moderation.defs#modEventUnmute" }`.

**`ozone_resolve_appeal`** — Resolves an appeal on a subject. Comment is **required** for this tool.

Zod schema:
- `subject` — `z.string().describe("Subject — a DID (did:plc:...) or AT-URI (at://...)")`
- `comment` — `z.string().describe("Required comment explaining the appeal resolution")`
- `cid` — `z.string().optional().describe("CID of the record. Required when subject is an AT-URI.")`
- `batchId` — `z.string().uuid().optional().describe("UUID to group related actions into a batch. Auto-generated if omitted.")`

Note: `comment` is **not optional** here — it's `z.string()` without `.optional()`. This enforces AC3.7 at the schema level.

Handler: Call `emitOzoneEvent` with event `{ $type: "tools.ozone.moderation.defs#modEventResolveAppeal" }`. The comment is passed through `EmitEventOptions.comment`.

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All existing tests pass. New tools are registered.

**Commit:** `feat: add ozone_tag, ozone_mute, ozone_unmute, ozone_resolve_appeal write tools`
<!-- END_TASK_4 -->

<!-- START_TASK_5 -->
### Task 5: Tests for tag, mute, unmute, and resolve_appeal tools

**Verifies:** ozone-mcp-tools.AC3.1, ozone-mcp-tools.AC3.4, ozone-mcp-tools.AC3.5, ozone-mcp-tools.AC3.6, ozone-mcp-tools.AC3.7, ozone-mcp-tools.AC3.10

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.test.ts` (unit)

**Testing:**

Add `describe` blocks for the remaining write tools. Tests must verify:

- **ozone-mcp-tools.AC3.10:** Credential validation for all four tools — register with null config, call each handler, expect `isError: true` with "not configured".
- **ozone-mcp-tools.AC3.5:** `ozone_tag` with both `add: []` and `remove: []` should return `isError: true` with text mentioning "non-empty". Test with configured credentials (all fields set to non-null strings) so the handler reaches the validation check before `emitOzoneEvent` is called.
- **ozone-mcp-tools.AC3.4:** Mock `fetch` to capture the request body, then call `ozone_tag` with `add: ["spam"]` and `remove: ["bot"]`. Verify the captured body includes `event.add: ["spam"]`, `event.remove: ["bot"]`, and `event.$type === "tools.ozone.moderation.defs#modEventTag"`.
- **ozone-mcp-tools.AC3.6:** Mock `fetch` to capture the request body, then call `ozone_mute` with `durationInHours: 24`. Verify the captured body includes `event.durationInHours === 24` and correct `$type`.
- **ozone-mcp-tools.AC3.1:** Verify all four tool handlers are registered with correct names (`"ozone_tag"`, `"ozone_mute"`, `"ozone_unmute"`, `"ozone_resolve_appeal"`).
- **ozone-mcp-tools.AC3.7:** `ozone_resolve_appeal` enforces required comment at the zod schema level. To test: verify the handler exists and is registered. Schema-level validation is handled by the MCP SDK.
- **ozone-mcp-tools.AC3.8, AC3.9:** Mock `fetch` and call any write tool handler. Verify the captured request body includes `modTool.name === "skywatch-mcp"` and `createdBy` matches `config.did`.

Use the same fetch mocking pattern established in Phase 1 Task 6 and used in Phase 3 Task 3.

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All tests pass.

**Commit:** `test: add tests for tag, mute, unmute, resolve_appeal tools`
<!-- END_TASK_5 -->

<!-- END_SUBCOMPONENT_B -->
