# Ozone MCP Tools Design

## Summary

This design adds 9 new MCP tools to the `skywatch-mcp` server for interacting with Ozone, the AT Protocol's moderation service. The new tools cover two read operations (querying subject statuses and moderation event history) and seven write operations (comment, acknowledge, escalate, tag, mute, unmute, and resolve appeal). Together with the existing `ozone_label` tool, this brings the total Ozone tool count to 10.

The approach is deliberately narrow in scope: rather than introducing new patterns, the work extracts four reusable helpers (`validateOzoneConfig`, `buildSubjectRef`, `ozoneRequest`, `buildModTool`) from the logic already embedded in `ozone_label`, then wires all new tools through those helpers. The read tools expose a curated subset of the full Ozone query surface — shorthand enum values are mapped to full lexicon tokens internally so agents don't need to know AT Protocol namespace strings. The write tools all funnel through a single `emitEvent` endpoint, differing only in their typed `$type` payload.

## Definition of Done

- 9 new MCP tools registered on skywatch-mcp server: 2 read tools (`ozone_query_statuses`, `ozone_query_events`) and 7 write tools (`ozone_comment`, `ozone_acknowledge`, `ozone_escalate`, `ozone_tag`, `ozone_mute`, `ozone_unmute`, `ozone_resolve_appeal`)
- Shared auth/request infrastructure extracted from existing ozone.ts (session management, proxy headers, retry-on-expired-token pattern)
- Each write tool follows the existing pattern: zod schema, clear descriptions, error handling, modTool metadata with `skywatch-mcp` name
- Read tools support an agent-friendly subset of query parameters (not the full lexicon surface)
- Tests for request building, parameter mapping, and credential validation
- Plugin CLAUDE.md updated with new tool listings

## Acceptance Criteria

### ozone-mcp-tools.AC1: Shared infrastructure works correctly
- **ozone-mcp-tools.AC1.1 Success:** `buildSubjectRef` returns `repoRef` for valid DID input
- **ozone-mcp-tools.AC1.2 Success:** `buildSubjectRef` returns `strongRef` for valid AT-URI with CID
- **ozone-mcp-tools.AC1.3 Failure:** `buildSubjectRef` returns error for AT-URI without CID
- **ozone-mcp-tools.AC1.4 Failure:** `buildSubjectRef` returns error for invalid subject format
- **ozone-mcp-tools.AC1.5 Success:** `validateOzoneConfig` returns null when all credentials present
- **ozone-mcp-tools.AC1.6 Failure:** `validateOzoneConfig` returns error response when any credential missing
- **ozone-mcp-tools.AC1.7 Success:** `ozoneRequest` retries with refreshed token on expired token response
- **ozone-mcp-tools.AC1.8 Success:** `buildModTool` auto-generates batchId when omitted
- **ozone-mcp-tools.AC1.9 Success:** Existing `ozone_label` tool works identically after refactor

### ozone-mcp-tools.AC2: Read tools return correct data
- **ozone-mcp-tools.AC2.1 Success:** `ozone_query_statuses` returns paginated subject statuses with cursor
- **ozone-mcp-tools.AC2.2 Success:** `reviewState` shorthand `"open"` maps to `"tools.ozone.moderation.defs#reviewOpen"`
- **ozone-mcp-tools.AC2.3 Success:** `ozone_query_events` returns paginated events with cursor
- **ozone-mcp-tools.AC2.4 Success:** `types` shorthand `"comment"` maps to `"tools.ozone.moderation.defs#modEventComment"`
- **ozone-mcp-tools.AC2.5 Failure:** Both query tools return credential error when config is incomplete
- **ozone-mcp-tools.AC2.6 Success:** Optional parameters are omitted from query string when not provided

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

### ozone-mcp-tools.AC4: Documentation is accurate
- **ozone-mcp-tools.AC4.1 Success:** Plugin CLAUDE.md lists all 20 MCP tools with correct descriptions

## Glossary

- **AT Protocol (atproto)**: A federated social networking protocol developed by Bluesky. Defines the lexicon, identity, and data structures this codebase interacts with.
- **Ozone**: The AT Protocol moderation service. Provides APIs for querying and acting on reported content and accounts.
- **MCP (Model Context Protocol)**: Anthropic's protocol for exposing structured tools to AI agents. This server registers tools that agents can call.
- **Lexicon**: AT Protocol's schema definition system. Namespaced identifiers like `tools.ozone.moderation.defs#reviewOpen` define valid types and values.
- **DID (Decentralised Identifier)**: A globally unique identifier for an AT Protocol account (e.g., `did:plc:abc123`). One of the two valid subject reference formats.
- **AT-URI**: A URI scheme for referencing specific records in the AT Protocol network (e.g., `at://did:plc:abc123/app.bsky.feed.post/xyz`). The other valid subject reference format.
- **CID (Content Identifier)**: A content-addressed hash that uniquely identifies a specific version of a record. Required alongside an AT-URI to form a `strongRef`.
- **strongRef**: An AT Protocol reference that pairs an AT-URI with a CID, uniquely identifying a specific record version.
- **repoRef**: An AT Protocol reference that identifies a repository (account) by DID alone, without pointing to a specific record.
- **SubjectRef**: Union type in this codebase representing either a `repoRef` or `strongRef`, depending on whether the subject is an account or a specific post.
- **PDS (Personal Data Server)**: The server that hosts a user's AT Protocol data and issues auth sessions. Used here as the auth endpoint before proxying requests to Ozone.
- **atproto-proxy header**: An HTTP header used to route an authenticated request through a PDS to a downstream service (like Ozone) without re-authenticating directly against it.
- **modTool metadata**: A structured block attached to write events identifying the tool that created them (`name: "skywatch-mcp"`, timestamp, batchId). Used for traceability.
- **batchId**: A UUID attached to moderation events to group related actions together. Auto-generated when not supplied.
- **emitEvent**: The Ozone API endpoint (`tools.ozone.moderation.emitEvent`) that all write tools call to record a moderation action.
- **modEventView**: The response shape returned by `emitEvent` — a structured record of the created moderation event.
- **Zod**: A TypeScript-first schema validation library. Used here to define and validate MCP tool input parameters.
- **JWT (JSON Web Token)**: The token format used for AT Protocol session auth. Cached and refreshed on expiry by `ozoneRequest`.
- **cursor**: A pagination token returned by Ozone query endpoints. Pass it back in the next request to fetch the following page of results.
- **reviewState**: Ozone's classification of where a moderation subject sits in the review queue (e.g., open, escalated, closed).

## Architecture

All 9 new tools live in the existing `src/tools/ozone.ts` file alongside the current `ozone_label` tool. Shared infrastructure is extracted within the same file.

### Shared Infrastructure

Four helpers extracted from the existing inline patterns:

- **`validateOzoneConfig(config)`** — credential check returning an MCP error response if creds are missing, `null` if valid. Every tool calls this first.
- **`buildSubjectRef(subject, cid?)`** — takes a DID or AT-URI, returns a typed `SubjectRef` or error. Extracted from `buildOzoneRequest`.
- **`ozoneRequest(config, method, path, body?)`** — generic fetch wrapper with auth retry. Gets access token, makes request with `atproto-proxy` header, retries once on expired token. Replaces the inline fetch+retry in `ozone_label`.
- **`buildModTool(batchId?)`** — builds the `modTool` metadata block with `name: "skywatch-mcp"`, timestamp, and batchId (auto-generated if omitted).

Session management functions (`createSession`, `refreshSession`, `getAccessToken`, cached session state) remain as-is.

The existing `ozone_label` handler is refactored to use `ozoneRequest` and `buildSubjectRef` internally. No behaviour change — just using the shared helpers.

### Read Tools

**`ozone_query_statuses`** — report queue view. Calls `tools.ozone.moderation.queryStatuses` via GET.

Curated parameters: `subject`, `reviewState` (enum: `open`/`escalated`/`closed`/`none` — mapped to full lexicon tokens internally), `sortField` (enum: `lastReportedAt`/`lastReviewedAt`/`priorityScore`), `sortDirection`, `tags`, `excludeTags`, `appealed`, `takendown`, `limit`, `cursor`.

Excluded: `queueCount`/`queueIndex`/`queueSeed` (load-balancing), `hostingDeleted*` (niche), min-count filters, `ageAssuranceState`.

**`ozone_query_events`** — moderation event history. Calls `tools.ozone.moderation.queryEvents` via GET.

Curated parameters: `subject`, `types` (array of shorthand names like `"comment"` — mapped to `tools.ozone.moderation.defs#modEventComment` internally), `createdBy`, `createdAfter`, `createdBefore`, `sortDirection`, `hasComment`, `addedLabels`, `limit`, `cursor`.

Excluded: `removedLabels`/`removedTags`/`addedTags`, `reportTypes`, `policies`, `modTool`, `batchId`, `ageAssuranceState`, `withStrike`.

### Write Tools

All write tools call `tools.ozone.moderation.emitEvent` via POST. Each shares common parameters (`subject`, `cid`, `comment`, `batchId`) and adds event-specific fields.

| Tool | Event Type | Extra Parameters |
|------|-----------|-----------------|
| `ozone_comment` | `#modEventComment` | `sticky` (boolean, optional) |
| `ozone_acknowledge` | `#modEventAcknowledge` | `acknowledgeAccountSubjects` (boolean, optional) |
| `ozone_escalate` | `#modEventEscalate` | none |
| `ozone_tag` | `#modEventTag` | `add` (string[], required), `remove` (string[], required) |
| `ozone_mute` | `#modEventMute` | `durationInHours` (number, required) |
| `ozone_unmute` | `#modEventUnmute` | none |
| `ozone_resolve_appeal` | `#modEventResolveAppeal` | `comment` becomes required |

Every write tool sets `createdBy` to `config.did` and includes `modTool` metadata via `buildModTool`. Response is the raw `modEventView` JSON from the API.

### Registration

The existing `registerOzoneTool` function is renamed to `registerOzoneTools` (plural). It registers all 10 tools. Single import change in `src/index.ts`.

## Existing Patterns

This design follows the patterns established by the existing `ozone_label` tool in `src/tools/ozone.ts`:

- **Tool registration**: `server.tool(name, description, zodSchema, handler)` pattern used by all tools in the server
- **Auth flow**: PDS-based session creation with JWT caching and refresh-on-expiry, proxied to the labeler service via `atproto-proxy` header
- **Error handling**: `{ isError: true, content: [{ type: "text", text }] }` for errors, `{ content: [{ type: "text", text: JSON.stringify(result) }] }` for success
- **Credential validation**: Early return with clear error message if env vars are missing
- **modTool metadata**: `name: "skywatch-mcp"` with timestamp and batchId for traceability
- **Zod schemas**: `.describe()` on every parameter, `.optional()` with sensible defaults

No new patterns introduced. The shared helpers are extractions of existing inline code, not new abstractions.

## Implementation Phases

<!-- START_PHASE_1 -->
### Phase 1: Shared Infrastructure

**Goal:** Extract reusable helpers from existing `ozone_label` code and refactor `ozone_label` to use them.

**Components:**
- `validateOzoneConfig` — extracted from inline credential check in `ozone_label` handler
- `buildSubjectRef` — extracted from `buildOzoneRequest`, returns `SubjectRef` or error
- `ozoneRequest` — new generic fetch-with-auth-retry wrapper
- `buildModTool` — extracted modTool construction
- Refactored `ozone_label` handler using new helpers
- `registerOzoneTool` renamed to `registerOzoneTools`

All in `src/tools/ozone.ts`. Single import update in `src/index.ts`.

**Dependencies:** None

**Done when:** Existing `ozone_label` tool works identically using the new shared helpers. All existing tests pass. New unit tests cover `buildSubjectRef`, `validateOzoneConfig`, and `buildModTool`.
<!-- END_PHASE_1 -->

<!-- START_PHASE_2 -->
### Phase 2: Read Tools

**Goal:** Add `ozone_query_statuses` and `ozone_query_events` tools.

**Components:**
- `ozone_query_statuses` tool — zod schema with curated params, handler using `ozoneRequest` for GET request, `reviewState` enum mapping
- `ozone_query_events` tool — zod schema with curated params, handler using `ozoneRequest` for GET request, `types` shorthand-to-full-namespace mapping
- Query parameter construction (building URL search params from zod-validated args)

All in `src/tools/ozone.ts`.

**Dependencies:** Phase 1 (shared infrastructure)

**Done when:** Both query tools register, validate credentials, map shorthand enums to full lexicon tokens, and construct correct API requests. Tests cover parameter mapping (`"comment"` -> `"tools.ozone.moderation.defs#modEventComment"`, `"open"` -> `"tools.ozone.moderation.defs#reviewOpen"`), credential validation, and schema registration.
<!-- END_PHASE_2 -->

<!-- START_PHASE_3 -->
### Phase 3: Write Tools

**Goal:** Add all 7 write tools (`ozone_comment`, `ozone_acknowledge`, `ozone_escalate`, `ozone_tag`, `ozone_mute`, `ozone_unmute`, `ozone_resolve_appeal`).

**Components:**
- 7 tool registrations with zod schemas and handlers
- Each handler: validates config, builds subject ref, constructs typed event payload, calls `ozoneRequest`
- `ozone_tag` validation: at least one of `add`/`remove` must be non-empty
- `ozone_resolve_appeal`: `comment` parameter is required (not optional)

All in `src/tools/ozone.ts`.

**Dependencies:** Phase 1 (shared infrastructure)

**Done when:** All 7 write tools register with correct schemas, construct correct event payloads with proper `$type` values, validate required fields per event type, and include modTool metadata. Tests cover event payload construction for each tool, required-field validation, and the `ozone_tag` non-empty constraint.
<!-- END_PHASE_3 -->

<!-- START_PHASE_4 -->
### Phase 4: Documentation Update

**Goal:** Update plugin CLAUDE.md to reflect the expanded tool set.

**Components:**
- `plugins/skywatch-investigations/CLAUDE.md` — update MCP Tools list (11 -> 20 tools), add new tool descriptions, update tool count references

**Dependencies:** Phases 2 and 3 (all tools implemented)

**Done when:** CLAUDE.md accurately lists all 20 MCP tools with correct descriptions. Contracts section reflects the full tool set.
<!-- END_PHASE_4 -->

## Additional Considerations

**Parameter expansion:** Read tools expose a curated subset of query parameters. Additional parameters (min-count filters, hosting status filters, etc.) can be added individually without architectural changes — just extend the zod schema and include the param in the query string construction.

**Rate limiting:** Ozone API doesn't document rate limits for authenticated service accounts. If rate limiting becomes an issue, `ozoneRequest` is the single point where retry/backoff logic would be added.
