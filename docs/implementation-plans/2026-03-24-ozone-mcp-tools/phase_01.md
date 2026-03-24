# Ozone MCP Tools Implementation Plan — Phase 1: Shared Infrastructure

**Goal:** Extract reusable helpers from existing `ozone_label` code and refactor `ozone_label` to use them, with zero behaviour change.

**Architecture:** Four helpers (`validateOzoneConfig`, `buildSubjectRef`, `ozoneRequest`, `buildModTool`) extracted from inline patterns in the `ozone_label` handler. The existing handler is refactored to compose these helpers. Session management functions remain untouched. `registerOzoneTool` renamed to `registerOzoneTools`.

**Tech Stack:** TypeScript, Bun, Zod, MCP SDK

**Scope:** 4 phases from original design (phase 1 of 4)

**Codebase verified:** 2026-03-24

---

## Acceptance Criteria Coverage

This phase implements and tests:

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

---

<!-- START_SUBCOMPONENT_A (tasks 1-3) -->

<!-- START_TASK_1 -->
### Task 1: Extract `validateOzoneConfig`, `buildSubjectRef`, and `buildModTool` helpers

**Verifies:** ozone-mcp-tools.AC1.1, ozone-mcp-tools.AC1.2, ozone-mcp-tools.AC1.3, ozone-mcp-tools.AC1.4, ozone-mcp-tools.AC1.5, ozone-mcp-tools.AC1.6, ozone-mcp-tools.AC1.8

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`

**Implementation:**

Extract three new exported functions from the existing inline code in `ozone.ts`. These are pure extractions — the logic already exists, it just needs to be pulled into named functions.

**`validateOzoneConfig`** — Extract the credential check from the handler (current lines 225-235). Returns the MCP error response object if credentials are missing, `null` if valid.

```typescript
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
```

**`buildSubjectRef`** — Extract the subject reference construction from `buildOzoneRequest` (current lines 87-129). Takes a subject string and optional CID, returns a `SubjectRef` or error. This replaces the subject-handling logic inside `buildOzoneRequest`.

```typescript
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
```

**`buildModTool`** — Extract the modTool metadata construction (current lines 79-85 inside `buildOzoneRequest`). Returns a `ModTool` object.

```typescript
export function buildModTool(batchId?: string): ModTool {
  return {
    name: "skywatch-mcp",
    meta: {
      time: new Date().toISOString(),
      batchId: batchId ?? uuidv7(),
    },
  };
}
```

Also export the `SubjectRef` and `ModTool` types so they can be used by consumers:

```typescript
export type { SubjectRef, ModTool };
```

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All existing tests still pass (no behaviour change yet — `buildOzoneRequest` and handler are unchanged at this point).

**Commit:** `refactor: extract validateOzoneConfig, buildSubjectRef, and buildModTool helpers`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Refactor `buildOzoneRequest` and `ozone_label` handler to use new helpers

**Verifies:** ozone-mcp-tools.AC1.9

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`

**Implementation:**

Refactor `buildOzoneRequest` to use `buildSubjectRef` and `buildModTool` internally. The function signature and return type remain identical — this is a pure internal refactor.

The refactored `buildOzoneRequest` should:
1. Call `buildSubjectRef(subject, cid)` instead of inline DID/AT-URI checks
2. Call `buildModTool(batchId)` instead of inline modTool construction
3. Return the same `OzoneEventRequest` shape

Refactor the `ozone_label` handler to:
1. Call `validateOzoneConfig(config)` at the top instead of inline credential checks
2. Return the validation error directly if non-null

The handler's existing calls to `buildOzoneRequest` and the fetch+retry logic remain unchanged for now.

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All existing tests pass identically. The refactored code produces the same outputs as before.

**Commit:** `refactor: wire ozone_label handler through extracted helpers`
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Tests for extracted helpers

**Verifies:** ozone-mcp-tools.AC1.1, ozone-mcp-tools.AC1.2, ozone-mcp-tools.AC1.3, ozone-mcp-tools.AC1.4, ozone-mcp-tools.AC1.5, ozone-mcp-tools.AC1.6, ozone-mcp-tools.AC1.8

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.test.ts` (unit)

**Testing:**

Add new `describe` blocks to the existing test file for the three extracted helpers. Tests must verify each AC listed above:

- **ozone-mcp-tools.AC1.1:** `buildSubjectRef("did:plc:example123")` returns `{ ok: true, ref: { $type: "com.atproto.admin.defs#repoRef", did: "did:plc:example123" } }`
- **ozone-mcp-tools.AC1.2:** `buildSubjectRef("at://did:plc:example/app.bsky.feed.post/abc", "bafyrei123")` returns `{ ok: true, ref: { $type: "com.atproto.repo.strongRef", uri: "at://...", cid: "bafyrei123" } }`
- **ozone-mcp-tools.AC1.3:** `buildSubjectRef("at://did:plc:example/app.bsky.feed.post/abc")` (no CID) returns `{ ok: false }` with error mentioning "cid"
- **ozone-mcp-tools.AC1.4:** `buildSubjectRef("invalid-subject")` returns `{ ok: false }` with error mentioning "DID" or "AT-URI"
- **ozone-mcp-tools.AC1.5:** `validateOzoneConfig` with all fields set returns `null`
- **ozone-mcp-tools.AC1.6:** `validateOzoneConfig` with each field individually set to `null` returns an error response object with `isError: true` and text mentioning "not configured"
- **ozone-mcp-tools.AC1.8:** `buildModTool()` without batchId returns a ModTool with a valid UUIDv7 batchId; `buildModTool("some-uuid")` returns a ModTool with that specific batchId; `name` is always `"skywatch-mcp"`

Follow project testing patterns: `import { describe, it, expect } from "bun:test"`, import helpers from `"./ozone.ts"`.

Update the existing import line to include the new exports: `buildSubjectRef`, `validateOzoneConfig`, `buildModTool`.

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All new and existing tests pass.

**Commit:** `test: add unit tests for extracted ozone helpers`
<!-- END_TASK_3 -->

<!-- END_SUBCOMPONENT_A -->

<!-- START_SUBCOMPONENT_B (tasks 4-6) -->

<!-- START_TASK_4 -->
### Task 4: Extract `ozoneRequest` generic fetch wrapper

**Verifies:** ozone-mcp-tools.AC1.7

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`

**Implementation:**

Extract the fetch+auth+retry pattern from the `ozone_label` handler (current lines 254-293) into a reusable `ozoneRequest` function. This function will be used by all tools (read and write) to make authenticated requests to Ozone.

```typescript
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
  return { ok: true, data: responseText ? JSON.parse(responseText) : null };
}
```

Add a try/catch around the `JSON.parse` call to handle unexpected non-JSON responses gracefully:

```typescript
  const responseText = await response.text();
  try {
    return { ok: true, data: responseText ? JSON.parse(responseText) : null };
  } catch {
    return { ok: false, status: response.status, text: `Invalid JSON response: ${responseText.slice(0, 200)}` };
  }
```

Then refactor the `ozone_label` handler to use `ozoneRequest` instead of the inline fetch+retry. The handler should:
1. Build the request body via `buildOzoneRequest`
2. Call `ozoneRequest(config, "POST", "tools.ozone.moderation.emitEvent", request)`
3. Map the result to MCP response format

**IMPORTANT:** The `ozone_label` handler MUST preserve its existing response wrapper shape: `{ success: true, action, subject, label, response: <parsed API response> }`. Do NOT use `emitOzoneEvent` (Phase 3) for `ozone_label` — that helper returns raw API JSON. The `ozone_label` handler should call `ozoneRequest` directly and wrap the result in its existing format.

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All existing tests pass. The `ozone_label` handler produces identical outputs.

**Commit:** `refactor: extract ozoneRequest fetch wrapper, wire into ozone_label`
<!-- END_TASK_4 -->

<!-- START_TASK_6 -->
### Task 6: Tests for `ozoneRequest` token refresh retry

**Verifies:** ozone-mcp-tools.AC1.7

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.test.ts` (unit)

**Implementation:**

Add a `describe("ozoneRequest")` block that tests the token refresh retry behaviour by mocking the global `fetch` function. Bun supports `mock` from `bun:test` for this purpose.

The test strategy:
1. Mock `fetch` to control HTTP responses
2. Mock the session functions indirectly by providing a config that would trigger session creation (the first `fetch` call will be to `createSession`)

Tests must verify:

- **ozone-mcp-tools.AC1.7 (success path):** Mock `fetch` to return a successful response. Verify `ozoneRequest` returns `{ ok: true, data: <parsed JSON> }`.
- **ozone-mcp-tools.AC1.7 (expired token retry):** Mock `fetch` to:
  1. First call (createSession): return `{ accessJwt: "token1", refreshJwt: "refresh1" }`
  2. Second call (the actual request): return 401 with body containing `"ExpiredToken"`
  3. Third call (refreshSession): return `{ accessJwt: "token2", refreshJwt: "refresh2" }`
  4. Fourth call (retry request): return 200 with success body
  Verify `ozoneRequest` returns `{ ok: true }` and that the retry occurred.
- **ozone-mcp-tools.AC1.7 (failure after retry):** Mock `fetch` so the retry also returns an error. Verify `ozoneRequest` returns `{ ok: false }` with the error status and text.
- **JSON.parse safety:** Mock `fetch` to return a 200 with non-JSON body text. Verify `ozoneRequest` returns `{ ok: false }` with text mentioning "Invalid JSON".

Remember to restore the original `fetch` after each test to avoid affecting other tests.

Import `ozoneRequest` from `"./ozone.ts"`.

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All tests pass including the new ozoneRequest tests.

**Commit:** `test: add tests for ozoneRequest token refresh retry`
<!-- END_TASK_6 -->

<!-- START_TASK_5 -->
### Task 5: Rename `registerOzoneTool` to `registerOzoneTools` and update import

**Verifies:** ozone-mcp-tools.AC1.9

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/index.ts`
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.test.ts`

**Implementation:**

Rename the exported function from `registerOzoneTool` to `registerOzoneTools` (plural) in `ozone.ts`.

Update the import in `src/index.ts` (line 13):
```typescript
import { registerOzoneTools, type OzoneConfig } from "./tools/ozone.ts";
```

Update the call site in `src/index.ts` (line 76):
```typescript
await registerOzoneTools(server, ozoneConfig);
```

Update the test file import and usage:
```typescript
import { buildOzoneRequest, buildSubjectRef, validateOzoneConfig, buildModTool, registerOzoneTools } from "./ozone.ts";
```

Update the test's `describe` block name and function call from `registerOzoneTool` to `registerOzoneTools`.

Also fix the existing mock config shape in the credential test — it currently only passes `{ serviceUrl: null, adminPassword: null, did: null }` which is missing `handle` and `pdsHost`. Update to include all `OzoneConfig` fields:

```typescript
await registerOzoneTools(mockServer, {
  serviceUrl: null,
  handle: null,
  adminPassword: null,
  did: null,
  pdsHost: null,
});
```

**Verification:**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test`
Expected: All tests pass with updated function name.

**Commit:** `refactor: rename registerOzoneTool to registerOzoneTools`
<!-- END_TASK_5 -->

<!-- END_SUBCOMPONENT_B -->
