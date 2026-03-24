# Human Test Plan: Ozone MCP Tools

## Prerequisites

- Bun runtime installed (`bun --version` >= 1.0)
- `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test src/tools/ozone.test.ts` passes (75/75)
- Ozone credentials available (OZONE_HANDLE, OZONE_ADMIN_PASSWORD, OZONE_DID, OZONE_PDS) for live verification phases
- Access to the Ozone moderation dashboard for result verification

## Phase 1: Documentation Accuracy (AC4.1)

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open `plugins/skywatch-investigations/CLAUDE.md` | File exists and is readable |
| 1.2 | Count all tool entries under "MCP Tools" in the "Exposes" section | Exactly 20 tools listed |
| 1.3 | Verify each Ozone tool name matches its registration string in `ozone.ts` (ozone_label, ozone_query_statuses, ozone_query_events, ozone_comment, ozone_acknowledge, ozone_escalate, ozone_tag, ozone_mute, ozone_unmute, ozone_resolve_appeal) | All 10 Ozone tool names match source code |
| 1.4 | For each Ozone tool description in CLAUDE.md, compare against the `description` string in the `server.tool()` call in `ozone.ts` | Descriptions accurately summarize the tool's behaviour (semantic accuracy, not verbatim) |
| 1.5 | Check "When to Use" table includes entries for: ozone_label, ozone_comment, ozone_acknowledge, ozone_escalate, ozone_tag, ozone_mute, ozone_unmute, ozone_resolve_appeal, ozone_query_statuses, ozone_query_events | All 10 Ozone tools have "When to Use" entries |
| 1.6 | Verify "Guarantees" section includes statements about write tool metadata (modTool, createdBy) and credential validation | Guarantees section covers Phase 3 write tool contracts |

## Phase 2: Live Ozone Integration (requires credentials)

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Call `ozone_query_statuses` with `reviewState: "open"`, `limit: 5` via the MCP server | Returns JSON with `subjectStatuses` array (up to 5 items) and a `cursor` field |
| 2.2 | Take the `cursor` from step 2.1 and call `ozone_query_statuses` again with it | Returns a different page of results (or empty if no more) |
| 2.3 | Call `ozone_query_events` with `types: ["comment"]`, `limit: 3` | Returns JSON with `events` array filtered to comment events only |
| 2.4 | Call `ozone_query_events` with `types: ["comment"]`, `createdAfter: "2026-01-01T00:00:00Z"` | Returns only events created after the specified date |
| 2.5 | Call `ozone_comment` with a known test DID (`subject: "did:plc:<test-account>"`, `comment: "manual test"`, `sticky: false`) | Returns success JSON from Ozone API; verify in Ozone dashboard that comment appears |
| 2.6 | Call `ozone_comment` with `sticky: true` on the same test DID | Returns success; verify in dashboard the comment is pinned |
| 2.7 | Call `ozone_tag` with `add: ["manual-test-tag"]` on the test DID | Returns success; verify tag appears in Ozone dashboard |
| 2.8 | Call `ozone_tag` with `remove: ["manual-test-tag"]` on the same DID | Returns success; verify tag is removed |
| 2.9 | Call `ozone_mute` with `durationInHours: 1` on the test DID | Returns success; verify mute status in dashboard |
| 2.10 | Call `ozone_unmute` on the same DID | Returns success; verify mute is cleared |
| 2.11 | Call `ozone_acknowledge` on a test DID that has an open review state | Returns success; verify review state changes to acknowledged |
| 2.12 | Call `ozone_escalate` on a test DID | Returns success; verify escalation appears in event history |

## End-to-End: Full Moderation Workflow

**Purpose:** Validate that a complete investigation-to-resolution workflow works end-to-end with consistent batchId tracking.

| Step | Action | Expected |
|------|--------|----------|
| E2E.1 | Generate a batchId (any valid UUID, e.g. `550e8400-e29b-41d4-a716-446655440000`) | UUID ready for use |
| E2E.2 | Call `ozone_query_statuses` with `reviewState: "open"` to find a subject | At least one open subject returned |
| E2E.3 | Call `ozone_comment` on that subject with `comment: "investigating -- batch test"` and the batchId from E2E.1 | Success; comment attached |
| E2E.4 | Call `ozone_tag` with `add: ["under-investigation"]` and same batchId | Success; tag applied |
| E2E.5 | Call `ozone_label` with `label: "spam"`, `action: "apply"` and same batchId | Success; label applied |
| E2E.6 | Call `ozone_query_events` with `subject` set to the DID from E2E.2 | All three events (comment, tag, label) appear with the same batchId in their modTool metadata |
| E2E.7 | Call `ozone_acknowledge` on the subject with same batchId | Success; subject moves to acknowledged state |
| E2E.8 | Verify in Ozone dashboard that all events share the same batchId | Consistent batchId across the entire workflow |

## End-to-End: Credential Failure Graceful Degradation

**Purpose:** Validate all tools fail cleanly without credentials.

| Step | Action | Expected |
|------|--------|----------|
| E2E.9 | Start MCP server without OZONE_HANDLE, OZONE_ADMIN_PASSWORD, OZONE_DID, OZONE_PDS env vars | Server starts successfully |
| E2E.10 | Call each Ozone tool (all 10) with valid-looking arguments | Each returns `isError: true` with message containing "not configured" and listing the required env vars |
| E2E.11 | Verify no network requests were made (no fetch calls to any PDS host) | No outbound traffic — credential check happens before any API call |

## Traceability

| Acceptance Criterion | Automated Test | Manual Step |
|----------------------|----------------|-------------|
| AC1.1 | `buildSubjectRef` > "AC1.1: should return repoRef..." | — |
| AC1.2 | `buildSubjectRef` > "AC1.2: should return strongRef..." | — |
| AC1.3 | `buildSubjectRef` > "AC1.3: should return error..." | — |
| AC1.4 | `buildSubjectRef` > "AC1.4: should return error..." | — |
| AC1.5 | `validateOzoneConfig` > "AC1.5: should return null..." | — |
| AC1.6 | `validateOzoneConfig` > "AC1.6: ..." (x4) | E2E.9-E2E.11 |
| AC1.7 | `ozoneRequest` > "AC1.7: ..." (x3) | — |
| AC1.8 | `buildModTool` > "AC1.8: ..." (x2) | E2E.6, E2E.8 |
| AC1.9 | `registerOzoneTools handler` + `buildOzoneRequest` suite | Phase 2 step 2.5 |
| AC2.1 | `ozone_query_statuses tool` > registration + credential check | Phase 2 steps 2.1-2.2 |
| AC2.2 | `REVIEW_STATE_MAP` > (x4) | Phase 2 step 2.1 |
| AC2.3 | `ozone_query_events tool` > registration + credential check | Phase 2 steps 2.3-2.4 |
| AC2.4 | `EVENT_TYPE_MAP` > (x6) | Phase 2 step 2.3 |
| AC2.5 | `ozone_query_statuses` + `ozone_query_events` credential tests | E2E.10 |
| AC2.6 | `buildQueryString` > (x6) | — |
| AC3.1 | Registration + `$type` tests for all 7 tools | Phase 2 steps 2.5-2.12 |
| AC3.2 | `ozone_comment` > "AC3.2: sticky flag..." | Phase 2 step 2.6 |
| AC3.3 | `ozone_acknowledge` > "AC3.3: acknowledgeAccountSubjects..." | Phase 2 step 2.11 |
| AC3.4 | `ozone_tag` > "AC3.4: add and remove arrays..." | Phase 2 steps 2.7-2.8 |
| AC3.5 | `ozone_tag` > "AC3.5: reject when both empty" | — |
| AC3.6 | `ozone_mute` > "AC3.6: durationInHours..." | Phase 2 step 2.9 |
| AC3.7 | `ozone_resolve_appeal` > "AC3.7: required comment..." | — |
| AC3.8 | `ozone_comment` + `ozone_tag` > modTool.name tests | E2E.6, E2E.8 |
| AC3.9 | `ozone_comment` + `ozone_tag` > createdBy tests | E2E.6 |
| AC3.10 | All 7 write tools credential tests | E2E.10 |
| AC4.1 | — | Phase 1 steps 1.1-1.6 |
