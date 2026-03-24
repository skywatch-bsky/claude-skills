# Ozone MCP Tools Implementation Plan — Phase 2: Read Tools

**Goal:** Add `ozone_query_statuses` and `ozone_query_events` read tools for querying the Ozone moderation queue and event history.

**Architecture:** Both tools issue GET requests via `ozoneRequest` from Phase 1. Agent-friendly shorthand enums (e.g., `"open"`, `"comment"`) are mapped to full lexicon tokens internally. Query parameters are constructed from zod-validated args and appended as URL search params.

**Tech Stack:** TypeScript, Bun, Zod, MCP SDK

**Scope:** 4 phases from original design (phase 2 of 4)

**Codebase verified:** 2026-03-24

---

## Acceptance Criteria Coverage

This phase implements and tests:

### ozone-mcp-tools.AC2: Read tools return correct data
- **ozone-mcp-tools.AC2.1 Success:** `ozone_query_statuses` returns paginated subject statuses with cursor
- **ozone-mcp-tools.AC2.2 Success:** `reviewState` shorthand `"open"` maps to `"tools.ozone.moderation.defs#reviewOpen"`
- **ozone-mcp-tools.AC2.3 Success:** `ozone_query_events` returns paginated events with cursor
- **ozone-mcp-tools.AC2.4 Success:** `types` shorthand `"comment"` maps to `"tools.ozone.moderation.defs#modEventComment"`
- **ozone-mcp-tools.AC2.5 Failure:** Both query tools return credential error when config is incomplete
- **ozone-mcp-tools.AC2.6 Success:** Optional parameters are omitted from query string when not provided

---

<!-- START_SUBCOMPONENT_A (tasks 1-3) -->

<!-- START_TASK_1 -->
### Task 1: Add enum mapping constants and query param builder

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`

**Implementation:**

Add two mapping objects for translating shorthand enum values to full Ozone lexicon tokens. Place these near the top of the file alongside the existing type definitions.

**Review state mapping** (for `ozone_query_statuses`):

```typescript
const REVIEW_STATE_MAP: Record<string, string> = {
  open: "tools.ozone.moderation.defs#reviewOpen",
  escalated: "tools.ozone.moderation.defs#reviewEscalated",
  closed: "tools.ozone.moderation.defs#reviewClosed",
  none: "tools.ozone.moderation.defs#reviewNone",
};
```

**Event type mapping** (for `ozone_query_events`):

```typescript
const EVENT_TYPE_MAP: Record<string, string> = {
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
```

Also add an exported helper to build query strings from optional params, omitting undefined values:

```typescript
export function buildQueryString(params: Record<string, string | ReadonlyArray<string> | undefined>): string {
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
```

Export the mapping objects for testing:

```typescript
export { REVIEW_STATE_MAP, EVENT_TYPE_MAP };
```

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All existing tests still pass (no behaviour change).

**Commit:** `feat: add enum mappings and query string builder for read tools`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Implement `ozone_query_statuses` and `ozone_query_events` tools

**Verifies:** ozone-mcp-tools.AC2.1, ozone-mcp-tools.AC2.2, ozone-mcp-tools.AC2.3, ozone-mcp-tools.AC2.4, ozone-mcp-tools.AC2.5, ozone-mcp-tools.AC2.6

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`

**Implementation:**

Add both tool registrations inside the existing `registerOzoneTools` function, after the `ozone_label` registration.

**`ozone_query_statuses`** — Queries `tools.ozone.moderation.queryStatuses` via GET.

Zod schema parameters:
- `subject` — `z.string().optional().describe("Filter by subject — a DID or AT-URI")`
- `reviewState` — `z.enum(["open", "escalated", "closed", "none"]).optional().describe("Filter by review state")`
- `sortField` — `z.enum(["lastReportedAt", "lastReviewedAt", "priorityScore"]).optional().describe("Field to sort by (default: lastReportedAt)")`
- `sortDirection` — `z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)")`
- `tags` — `z.array(z.string()).optional().describe("Filter to subjects with ALL of these tags")`
- `excludeTags` — `z.array(z.string()).optional().describe("Exclude subjects with ANY of these tags")`
- `appealed` — `z.boolean().optional().describe("Filter by appeal status")`
- `takendown` — `z.boolean().optional().describe("Filter by takedown status")`
- `limit` — `z.number().int().min(1).max(100).optional().describe("Number of results to return (default: 50, max: 100)")`
- `cursor` — `z.string().optional().describe("Pagination cursor from previous response")`

Handler logic:
1. Call `validateOzoneConfig(config)` — return error if non-null
2. Map `reviewState` shorthand to full lexicon token via `REVIEW_STATE_MAP`
3. Build query string from all provided params, omitting undefined ones
4. Call `ozoneRequest(config, "GET", "tools.ozone.moderation.queryStatuses" + queryString)`
5. Return `data` on success, error on failure

**`ozone_query_events`** — Queries `tools.ozone.moderation.queryEvents` via GET.

Zod schema parameters:
- `subject` — `z.string().optional().describe("Filter by subject — a DID or AT-URI")`
- `types` — `z.array(z.enum(["takedown", "reverseTakedown", "comment", "report", "label", "acknowledge", "escalate", "mute", "unmute", "muteReporter", "unmuteReporter", "email", "resolveAppeal", "divert", "tag", "accountEvent", "identityEvent", "recordEvent"])).optional().describe("Filter by event types (shorthand names)")`
- `createdBy` — `z.string().optional().describe("Filter by the DID of the moderator who created the event")`
- `createdAfter` — `z.string().optional().describe("Filter to events created after this ISO 8601 datetime")`
- `createdBefore` — `z.string().optional().describe("Filter to events created before this ISO 8601 datetime")`
- `sortDirection` — `z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)")`
- `hasComment` — `z.boolean().optional().describe("Filter to events that have a comment")`
- `addedLabels` — `z.array(z.string()).optional().describe("Filter to events that added these labels")`
- `limit` — `z.number().int().min(1).max(100).optional().describe("Number of results to return (default: 50, max: 100)")`
- `cursor` — `z.string().optional().describe("Pagination cursor from previous response")`

Handler logic:
1. Call `validateOzoneConfig(config)` — return error if non-null
2. Map `types` array from shorthands to full lexicon tokens via `EVENT_TYPE_MAP`
3. Build query string, omitting undefined params
4. Call `ozoneRequest(config, "GET", "tools.ozone.moderation.queryEvents" + queryString)`
5. Return `data` on success, error on failure

Both tools should format success responses the same way as `ozone_label`: `{ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }`.

For boolean params (`appealed`, `takendown`, `hasComment`), convert to string `"true"` or `"false"` for the query string.

For array params (`tags`, `excludeTags`, `addedLabels`, `types`), append each value separately (multiple query params with the same key).

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All existing tests pass. New tools are registered (verifiable by adding tests in next task).

**Commit:** `feat: add ozone_query_statuses and ozone_query_events read tools`
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Tests for read tools

**Verifies:** ozone-mcp-tools.AC2.1, ozone-mcp-tools.AC2.2, ozone-mcp-tools.AC2.3, ozone-mcp-tools.AC2.4, ozone-mcp-tools.AC2.5, ozone-mcp-tools.AC2.6

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.test.ts` (unit)

**Testing:**

Add new `describe` blocks for the read tools and enum mappings. Tests must verify each AC listed above:

- **ozone-mcp-tools.AC2.2:** Test that `REVIEW_STATE_MAP["open"]` equals `"tools.ozone.moderation.defs#reviewOpen"`, and similarly for `"escalated"`, `"closed"`, `"none"`
- **ozone-mcp-tools.AC2.4:** Test that `EVENT_TYPE_MAP["comment"]` equals `"tools.ozone.moderation.defs#modEventComment"`, and similarly for other key event types (`"takedown"`, `"label"`, `"acknowledge"`, `"escalate"`, `"tag"`)
- **ozone-mcp-tools.AC2.5:** Using `createMockServer()`, register tools with null credentials config, call both `ozone_query_statuses` and `ozone_query_events` handlers, verify they return `{ isError: true }` with text mentioning "not configured"
- **ozone-mcp-tools.AC2.1, AC2.3:** These verify the tools register and respond — the handler registration test (credential check) confirms the tools are wired up and callable. Full API response testing requires live Ozone which is outside unit test scope.
- **ozone-mcp-tools.AC2.6:** Test that `buildQueryString` omits undefined values — `buildQueryString({ a: "1", b: undefined, c: "3" })` produces `"?a=1&c=3"`. Also test that array values produce multiple params with the same key, and empty params object produces `""`.

Update imports to include `REVIEW_STATE_MAP`, `EVENT_TYPE_MAP`, `buildQueryString`, `registerOzoneTools`.

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All new and existing tests pass.

**Commit:** `test: add tests for read tools and enum mappings`
<!-- END_TASK_3 -->

<!-- END_SUBCOMPONENT_A -->
