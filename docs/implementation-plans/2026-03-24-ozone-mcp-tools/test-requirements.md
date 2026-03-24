# Ozone MCP Tools — Test Requirements

Generated from acceptance criteria in the design plan.

## Automated Tests

| AC ID | Description | Test Type | Expected Test Location | Phase |
|-------|-------------|-----------|----------------------|-------|
| ozone-mcp-tools.AC1.1 | `buildSubjectRef` returns `repoRef` for valid DID input | unit | src/tools/ozone.test.ts | 1 |
| ozone-mcp-tools.AC1.2 | `buildSubjectRef` returns `strongRef` for valid AT-URI with CID | unit | src/tools/ozone.test.ts | 1 |
| ozone-mcp-tools.AC1.3 | `buildSubjectRef` returns error for AT-URI without CID | unit | src/tools/ozone.test.ts | 1 |
| ozone-mcp-tools.AC1.4 | `buildSubjectRef` returns error for invalid subject format | unit | src/tools/ozone.test.ts | 1 |
| ozone-mcp-tools.AC1.5 | `validateOzoneConfig` returns null when all credentials present | unit | src/tools/ozone.test.ts | 1 |
| ozone-mcp-tools.AC1.6 | `validateOzoneConfig` returns error response when any credential missing | unit | src/tools/ozone.test.ts | 1 |
| ozone-mcp-tools.AC1.7 | `ozoneRequest` retries with refreshed token on expired token response | unit | src/tools/ozone.test.ts | 1 |
| ozone-mcp-tools.AC1.8 | `buildModTool` auto-generates batchId when omitted | unit | src/tools/ozone.test.ts | 1 |
| ozone-mcp-tools.AC1.9 | Existing `ozone_label` tool works identically after refactor | integration | src/tools/ozone.test.ts | 1 |
| ozone-mcp-tools.AC2.1 | `ozone_query_statuses` returns paginated subject statuses with cursor | unit | src/tools/ozone.test.ts | 2 |
| ozone-mcp-tools.AC2.2 | `reviewState` shorthand `"open"` maps to `"tools.ozone.moderation.defs#reviewOpen"` | unit | src/tools/ozone.test.ts | 2 |
| ozone-mcp-tools.AC2.3 | `ozone_query_events` returns paginated events with cursor | unit | src/tools/ozone.test.ts | 2 |
| ozone-mcp-tools.AC2.4 | `types` shorthand `"comment"` maps to `"tools.ozone.moderation.defs#modEventComment"` | unit | src/tools/ozone.test.ts | 2 |
| ozone-mcp-tools.AC2.5 | Both query tools return credential error when config is incomplete | unit | src/tools/ozone.test.ts | 2 |
| ozone-mcp-tools.AC2.6 | Optional parameters are omitted from query string when not provided | unit | src/tools/ozone.test.ts | 2 |
| ozone-mcp-tools.AC3.1 | Each write tool sets correct `$type` on event payload | unit | src/tools/ozone.test.ts | 3 |
| ozone-mcp-tools.AC3.2 | `ozone_comment` with `sticky: true` includes sticky flag in payload | unit | src/tools/ozone.test.ts | 3 |
| ozone-mcp-tools.AC3.3 | `ozone_acknowledge` with `acknowledgeAccountSubjects: true` includes flag | unit | src/tools/ozone.test.ts | 3 |
| ozone-mcp-tools.AC3.4 | `ozone_tag` includes `add` and `remove` arrays in payload | unit | src/tools/ozone.test.ts | 3 |
| ozone-mcp-tools.AC3.5 | `ozone_tag` rejects when both `add` and `remove` are empty | unit | src/tools/ozone.test.ts | 3 |
| ozone-mcp-tools.AC3.6 | `ozone_mute` includes `durationInHours` in payload | unit | src/tools/ozone.test.ts | 3 |
| ozone-mcp-tools.AC3.7 | `ozone_resolve_appeal` rejects when `comment` is missing | unit | src/tools/ozone.test.ts | 3 |
| ozone-mcp-tools.AC3.8 | All write tools include `modTool` metadata with `skywatch-mcp` name | unit | src/tools/ozone.test.ts | 3 |
| ozone-mcp-tools.AC3.9 | All write tools set `createdBy` to `config.did` | unit | src/tools/ozone.test.ts | 3 |
| ozone-mcp-tools.AC3.10 | All write tools return credential error when config is incomplete | unit | src/tools/ozone.test.ts | 3 |

## Human Verification

| AC ID | Description | Why Not Automated | Verification Approach |
|-------|-------------|-------------------|----------------------|
| ozone-mcp-tools.AC4.1 | Plugin CLAUDE.md lists all 20 MCP tools with correct descriptions | Documentation correctness requires semantic review of descriptions against actual tool behaviour; a count check is automatable but description accuracy is not | Manually count tool entries in `plugins/skywatch-investigations/CLAUDE.md` under the MCP Tools list (expect exactly 20). Cross-reference each description against the tool's zod schema and handler to confirm accuracy. Verify the "When to Use" table includes entries for all new Ozone tools. |

## Test Strategy Notes

### All test locations are relative to `plugins/skywatch-investigations/servers/skywatch-mcp/`

All tests live in a single file (`src/tools/ozone.test.ts`) because all Ozone tool code lives in `src/tools/ozone.ts`. Tests are organized by `describe` blocks per helper or tool.

### Test patterns by AC group

**AC1 (Shared Infrastructure):** Direct function calls on exported helpers (`buildSubjectRef`, `validateOzoneConfig`, `buildModTool`). AC1.7 uses `fetch` mocking to simulate expired token responses and verify retry behaviour. AC1.9 runs the existing `ozone_label` test suite unchanged to confirm refactor is behaviour-preserving.

**AC2 (Read Tools):** Constant lookups on exported `REVIEW_STATE_MAP` and `EVENT_TYPE_MAP` objects for enum mapping tests. `buildQueryString` called directly with various param shapes. Credential validation via `createMockServer()` with null config. AC2.1 and AC2.3 (pagination) are verified at the unit level by confirming tool registration and credential gating; full pagination behaviour depends on the live Ozone API.

**AC3 (Write Tools):** Fetch mocking to capture the POST body sent to `emitEvent`, then asserting on `event.$type`, event-specific fields (`sticky`, `acknowledgeAccountSubjects`, `add`/`remove`, `durationInHours`), `modTool.name`, and `createdBy`. AC3.5 and AC3.7 test validation logic that runs before any API call. AC3.10 uses the same null-config credential check pattern as AC2.5.

**AC4 (Documentation):** Manual review only. The single AC in this group is inherently a documentation quality check.
