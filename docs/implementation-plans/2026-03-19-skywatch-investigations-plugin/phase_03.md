# Skywatch Investigations Plugin Implementation Plan — Phase 3

**Goal:** Add the remaining 6 MCP tools: content_similarity, domain_check, ip_lookup, url_expand, whois_lookup, and ozone_label.

**Architecture:** Each tool is a separate module in `src/tools/`. Recon tools (domain, IP, URL, whois) use built-in APIs or lightweight external calls. Content similarity queries ClickHouse via the existing client. Ozone labelling uses direct HTTP calls to the Ozone service API.

**Tech Stack:** Bun built-in DNS (`dns/promises`), fetch API (ip-api.com, Ozone, redirect following), `whois` npm package for WHOIS lookups, zod for parameter validation

**Scope:** Phase 3 of 7 from original design

**Codebase verified:** 2026-03-19

---

## Acceptance Criteria Coverage

This phase implements and tests:

### skywatch-investigations-plugin.AC2: Recon Tools
- **skywatch-investigations-plugin.AC2.1 Success:** `domain_check` returns DNS records (A, AAAA, NS, MX, TXT, CNAME, SOA) and HTTP status
- **skywatch-investigations-plugin.AC2.2 Success:** `ip_lookup` returns geo (country, city, lat/lon) and network (ISP, ASN) data
- **skywatch-investigations-plugin.AC2.3 Success:** `url_expand` follows redirect chain and reports each hop with status code
- **skywatch-investigations-plugin.AC2.4 Success:** `url_expand` identifies known URL shorteners (bit.ly, t.co, etc.)
- **skywatch-investigations-plugin.AC2.5 Success:** `whois_lookup` returns registrar, creation/expiration dates, nameservers, domain age
- **skywatch-investigations-plugin.AC2.6 Failure:** `domain_check` with non-resolving domain returns `resolves: false` (not an error)
- **skywatch-investigations-plugin.AC2.7 Failure:** `ip_lookup` with invalid IP format returns clear error

### skywatch-investigations-plugin.AC3: Content & Ozone Tools
- **skywatch-investigations-plugin.AC3.1 Success:** `content_similarity` finds matching posts within threshold, returns user/handle/text/score
- **skywatch-investigations-plugin.AC3.2 Success:** `ozone_label` applies a label to a DID and returns confirmation
- **skywatch-investigations-plugin.AC3.3 Success:** `ozone_label` removes a label from an AT-URI and returns confirmation
- **skywatch-investigations-plugin.AC3.4 Failure:** `ozone_label` without configured credentials returns clear "not configured" error
- **skywatch-investigations-plugin.AC3.5 Edge:** `content_similarity` with very common text returns capped results (respects limit param)

---

<!-- START_TASK_1 -->
### Task 1: Install whois dependency

**Verifies:** None (infrastructure)

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/package.json`

**Step 1: Install whois package**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun add whois`

**Step 2: Check for type declarations**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun add -d @types/whois 2>/dev/null || echo "No @types/whois available"`

If `@types/whois` is not available, create a minimal type declaration file at `plugins/skywatch-investigations/servers/skywatch-mcp/src/types/whois.d.ts`:

```typescript
declare module "whois" {
  function lookup(
    domain: string,
    callback: (err: Error | null, data: string) => void
  ): void;
  export default { lookup };
}
```

**Step 3: Verify**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun run -e "import whois from 'whois'; console.log('whois loaded')"`
Expected: Prints "whois loaded"

**Commit:** `chore: add whois dependency for domain registration lookups`
<!-- END_TASK_1 -->

<!-- START_SUBCOMPONENT_A (tasks 2-3) -->
<!-- START_TASK_2 -->
### Task 2: Domain check tool

**Verifies:** skywatch-investigations-plugin.AC2.1, skywatch-investigations-plugin.AC2.6

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/domain.ts`
- Test: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/domain.test.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/domain.ts` — exports a `registerDomainTool` function.

**Tool: `domain_check`**
- Description: "Check DNS records and HTTP status for a domain. Returns A, AAAA, NS, MX, TXT, CNAME, SOA records and whether the domain resolves."
- Input schema: `{ domain: z.string().describe("Domain name to check (e.g., example.com)") }`
- Handler:
  1. Use `dns/promises` to resolve all record types via `Promise.allSettled`:
     - `dns.resolve4(domain)` → A records
     - `dns.resolve6(domain)` → AAAA records
     - `dns.resolveNs(domain)` → NS records
     - `dns.resolveMx(domain)` → MX records
     - `dns.resolveTxt(domain)` → TXT records
     - `dns.resolveCname(domain)` → CNAME records
     - `dns.resolveSoa(domain)` → SOA record
  2. Use `Promise.allSettled` so that individual record type failures don't crash the whole lookup
  3. Attempt an HTTP HEAD request to `https://{domain}` with a 5-second timeout to get HTTP status
  4. Return result object:
     ```typescript
     {
       domain: string;
       resolves: boolean; // true if at least one A or AAAA record found
       records: {
         a: Array<string>;
         aaaa: Array<string>;
         ns: Array<string>;
         mx: Array<{ exchange: string; priority: number }>;
         txt: Array<Array<string>>;
         cname: Array<string>;
         soa: { nsname: string; hostmaster: string; serial: number; ... } | null;
       };
       http: { status: number; statusText: string } | null;
     }
     ```
  5. If domain doesn't resolve at all (no A/AAAA), set `resolves: false` — this is NOT an error (AC2.6)

**Testing:**

Tests must verify:
- skywatch-investigations-plugin.AC2.1: Call with a well-known domain (e.g., `example.com`) and assert the response contains `records.a` (non-empty array), `records.ns` (non-empty), and `http.status` (200 range). This is an integration test hitting real DNS.
- skywatch-investigations-plugin.AC2.6: Call with a non-resolving domain (e.g., `this-domain-definitely-does-not-exist-abc123xyz.com`) and assert `resolves` is `false` and no error is thrown.

Use `bun test`.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test src/tools/domain.test.ts`
Expected: All tests pass

**Commit:** `feat: add domain_check MCP tool with DNS and HTTP recon`
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: IP lookup tool

**Verifies:** skywatch-investigations-plugin.AC2.2, skywatch-investigations-plugin.AC2.7

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ip.ts`
- Test: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ip.test.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ip.ts` — exports a `registerIpTool` function.

**Tool: `ip_lookup`**
- Description: "Look up geographic location and network information for an IP address using ip-api.com."
- Input schema: `{ ip: z.string().describe("IPv4 or IPv6 address to look up") }`
- Handler:
  1. Validate IP format: use a proper IPv4 validation that checks each octet is 0-255 (not just digit count), and basic IPv6 validation (contains `:` and valid hex chars). For IPv4, parse each octet as a number and verify `0 <= octet <= 255`. Inputs like `999.999.999.999` or `not-an-ip` must be caught at this stage and return error content (AC2.7), not passed to the API.
  2. Fetch `http://ip-api.com/json/{ip}?fields=status,message,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting`
  3. Check response `status` field — if `"fail"`, return the API's `message` as error content
  4. Return structured result:
     ```typescript
     {
       ip: string;
       geo: { country: string; countryCode: string; region: string; city: string; zip: string; lat: number; lon: number; timezone: string };
       network: { isp: string; org: string; asn: string; asname: string };
       flags: { mobile: boolean; proxy: boolean; hosting: boolean };
     }
     ```
  5. Use 5-second timeout on fetch

**Testing:**

Tests must verify:
- skywatch-investigations-plugin.AC2.2: Call with a known public IP (e.g., `8.8.8.8` — Google DNS) and assert response contains geo fields (country, city) and network fields (isp, asn). Integration test hitting ip-api.com.
- skywatch-investigations-plugin.AC2.7: Call with an obviously invalid IP (e.g., `not-an-ip`, `999.999.999.999`) and assert the tool returns error content, not a thrown exception.

Use `bun test`.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test src/tools/ip.test.ts`
Expected: All tests pass

**Commit:** `feat: add ip_lookup MCP tool with GeoIP and ASN data`
<!-- END_TASK_3 -->
<!-- END_SUBCOMPONENT_A -->

<!-- START_SUBCOMPONENT_B (tasks 4-5) -->
<!-- START_TASK_4 -->
### Task 4: URL expand tool

**Verifies:** skywatch-investigations-plugin.AC2.3, skywatch-investigations-plugin.AC2.4

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/url-shorteners.ts`
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/url.ts`
- Test: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/url.test.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/url-shorteners.ts` — a Functional Core module exporting a set of known URL shortener domains and a `isKnownShortener(hostname: string): boolean` function:

```typescript
const KNOWN_SHORTENERS = new Set([
  "bit.ly", "bitly.com",
  "t.co",
  "goo.gl",
  "tinyurl.com",
  "ow.ly",
  "is.gd", "v.gd",
  "buff.ly",
  "amzn.to",
  "youtu.be",
  "rb.gy",
  "shorturl.at",
  "tiny.cc",
  "cutt.ly",
]);
```

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/url.ts` — exports a `registerUrlTool` function.

**Tool: `url_expand`**
- Description: "Follow a URL's redirect chain and report each hop with status code. Identifies known URL shorteners."
- Input schema: `{ url: z.string().url().describe("URL to expand (follow redirects)") }`
- Handler:
  1. Follow redirects manually using `fetch` with `redirect: "manual"`
  2. At each hop, record: `{ url, statusCode, location (next URL), isShortener (boolean) }`
  3. Continue following `Location` headers until a non-3xx response or max 15 hops
  4. Resolve relative Location headers to absolute URLs using `new URL(location, currentUrl)`
  5. Check each URL's hostname against `isKnownShortener()`
  6. Return:
     ```typescript
     {
       originalUrl: string;
       finalUrl: string;
       hops: Array<{ url: string; statusCode: number; location: string | null; isShortener: boolean }>;
       hopCount: number;
     }
     ```
  7. Use 5-second timeout per fetch request
  8. If max hops exceeded, still return the chain collected so far with an `error: "Max redirects exceeded"` field

**Testing:**

Tests must verify:
- skywatch-investigations-plugin.AC2.3: Call with a URL known to redirect (e.g., `http://example.com` redirects to `https://example.com` or use a reliable redirect). Assert hops array is non-empty and each hop has url and statusCode. Integration test.
- skywatch-investigations-plugin.AC2.4: Unit test `isKnownShortener` from url-shorteners.ts — assert `bit.ly`, `t.co`, `goo.gl` return true; `example.com`, `google.com` return false.

Use `bun test`.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test src/tools/url.test.ts`
Expected: All tests pass

**Commit:** `feat: add url_expand MCP tool with redirect chain following`
<!-- END_TASK_4 -->

<!-- START_TASK_5 -->
### Task 5: WHOIS lookup tool

**Verifies:** skywatch-investigations-plugin.AC2.5

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/whois-parser.ts`
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/whois.ts`
- Test: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/whois.test.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/whois-parser.ts` — a Functional Core module that parses raw WHOIS text output into structured data.

Export a `parseWhoisResponse(rawText: string): WhoisResult` function:
- Extract registrar: match `/Registrar:\s*(.+)/i`
- Extract creation date: match `/Creation Date:\s*(.+)/i` or `/Created:\s*(.+)/i` or `/created:\s*(.+)/i`
- Extract expiration date: match `/Registry Expiry Date:\s*(.+)/i` or `/Expiration Date:\s*(.+)/i` or `/expires:\s*(.+)/i`
- Extract nameservers: match all `/Name Server:\s*(.+)/gi`
- Calculate domain age from creation date to current date (in days)
- Return:
  ```typescript
  type WhoisResult = {
    registrar: string | null;
    creationDate: string | null;
    expirationDate: string | null;
    nameservers: Array<string>;
    domainAge: number | null; // days since creation
    rawText: string;
  };
  ```

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/whois.ts` — exports a `registerWhoisTool` function.

**Tool: `whois_lookup`**
- Description: "Look up WHOIS registration data for a domain. Returns registrar, creation/expiration dates, nameservers, and domain age."
- Input schema: `{ domain: z.string().describe("Domain name to look up (e.g., example.com)") }`
- Handler:
  1. Call `whois.lookup(domain)` (wrapped in a Promise since the library uses callbacks)
  2. Pass raw text to `parseWhoisResponse()`
  3. Return the parsed result as JSON text content
  4. Handle errors (timeouts, unreachable WHOIS servers) gracefully with error content

**Testing:**

Tests must verify:
- skywatch-investigations-plugin.AC2.5: Call with a well-known domain (e.g., `google.com`) and assert response contains registrar (non-null string), creationDate (non-null), nameservers (non-empty array). Integration test hitting real WHOIS servers.
- Unit test `parseWhoisResponse` with sample WHOIS text to verify field extraction and domain age calculation. Pure function test — no network needed.

Use `bun test`.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test src/tools/whois.test.ts`
Expected: All tests pass

**Commit:** `feat: add whois_lookup MCP tool with registration data parsing`
<!-- END_TASK_5 -->
<!-- END_SUBCOMPONENT_B -->

<!-- START_SUBCOMPONENT_C (tasks 6-7) -->
<!-- START_TASK_6 -->
### Task 6: Content similarity tool

**Verifies:** skywatch-investigations-plugin.AC3.1, skywatch-investigations-plugin.AC3.5

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/content.ts`
- Test: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/content.test.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/content.ts` — exports a `registerContentTool` function that takes `McpServer` and `ClickHouseClient`.

**Tool: `content_similarity`**
- Description: "Find posts with similar text content using ClickHouse ngramDistance. Useful for detecting copypasta and coordinated posting."
- Input schema:
  ```
  {
    text: z.string().describe("Text to search for similar content"),
    threshold: z.number().min(0).max(1).default(0.4).describe("Similarity threshold (0=identical, 1=completely different). Default 0.4"),
    limit: z.number().min(1).max(100).default(20).describe("Maximum number of results. Default 20")
  }
  ```
- Handler:
  1. Build a ClickHouse query using `ngramDistance`:
     ```sql
     SELECT
       did as user,
       handle,
       content as text,
       ngramDistance(content, '{escapedText}') as score,
       created_at
     FROM default.osprey_execution_results
     WHERE ngramDistance(content, '{escapedText}') < {threshold}
     ORDER BY score ASC
     LIMIT {limit}
     ```
     **Note:** The column names (`did`, `handle`, `content`, `created_at`) used above are assumed from the design plan but have NOT been verified against the actual schema yet (schema extraction happens in Phase 4). During execution of this phase, verify these column names against the actual table schema using `clickhouse_schema`. If column names differ, adjust the SQL accordingly.
  2. Escape the text parameter for SQL safety: replace single quotes with `\'`, backslashes with `\\`. Note: parameterised queries are not feasible here because `ngramDistance()` requires the search text inline in the SQL function call — ClickHouse does not support parameters inside function arguments. This is a deliberate trade-off: the query is read-only against a single table, limiting the blast radius.
  3. Execute via the ClickHouse client's query method — BUT the SQL validation in Phase 1 will need to allow this query pattern. The content column and ngramDistance function operate on `osprey_execution_results`, so table validation passes.
  4. Note: the `validateQuery` function from Phase 1 checks for `osprey_execution_results` in the FROM clause, which this query satisfies.
  5. Return results as JSON array of `{ user, handle, text, score, created_at }`
  6. The `limit` parameter in the zod schema ensures results are capped (AC3.5)

**Testing:**

Tests must verify:
- skywatch-investigations-plugin.AC3.1: This is an integration test requiring a ClickHouse instance. Test that the tool registers and the query builds correctly. Unit test the SQL construction logic.
- skywatch-investigations-plugin.AC3.5: Verify the limit parameter is respected in the generated SQL. Unit test that passing `limit: 5` produces SQL with `LIMIT 5`.

Extract the SQL-building logic into a pure function for unit testing.

Use `bun test`.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test src/tools/content.test.ts`
Expected: All tests pass

**Commit:** `feat: add content_similarity MCP tool for copypasta detection`
<!-- END_TASK_6 -->

<!-- START_TASK_7 -->
### Task 7: Ozone label tool

**Verifies:** skywatch-investigations-plugin.AC3.2, skywatch-investigations-plugin.AC3.3, skywatch-investigations-plugin.AC3.4

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts`
- Test: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.test.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/ozone.ts` — exports a `registerOzoneTool` function that takes `McpServer` and an `OzoneConfig` object.

Define `OzoneConfig`:
```typescript
type OzoneConfig = {
  readonly serviceUrl: string | null;
  readonly adminPassword: string | null;
  readonly did: string | null;
};
```

**Tool: `ozone_label`**
- Description: "Apply or remove a moderation label on a subject (DID or AT-URI) via the Ozone moderation service."
- Input schema:
  ```
  {
    subject: z.string().describe("Subject to label — a DID (did:plc:...) or AT-URI (at://...)"),
    label: z.string().describe("Label value to apply or remove"),
    action: z.enum(["apply", "remove"]).describe("Whether to apply or remove the label")
  }
  ```
- Handler:
  1. Check if Ozone is configured: if `serviceUrl`, `adminPassword`, or `did` is null/empty, return error content: "Ozone is not configured. Set OZONE_SERVICE_URL, OZONE_ADMIN_PASSWORD, and OZONE_DID environment variables." (AC3.4)
  2. Determine subject type:
     - If subject starts with `did:` → `com.atproto.admin.defs#repoRef` with `did` field
     - If subject starts with `at://` → `com.atproto.repo.strongRef` with `uri` field
     - Otherwise → return error content with clear message
  3. Build the XRPC request body for `tools.ozone.moderation.emitEvent`:
     ```typescript
     {
       event: {
         $type: "tools.ozone.moderation.defs#modEventLabel",
         createLabelVals: action === "apply" ? [label] : [],
         negateLabelVals: action === "remove" ? [label] : [],
       },
       subject: subjectObject,
       createdBy: config.did,
     }
     ```
  4. Make HTTP POST to `{serviceUrl}/xrpc/tools.ozone.moderation.emitEvent` with:
     - `Content-Type: application/json`
     - `Authorization: Basic {base64(admin:{adminPassword})}`
     - Body: JSON stringified request
  5. Return confirmation: `{ success: true, action, subject, label, response: responseData }`
  6. On HTTP error, return error content with status code and response body

**Testing:**

Tests must verify:
- skywatch-investigations-plugin.AC3.4: Unit test — create tool with null config values, call handler, assert it returns error content containing "not configured". No network needed.
- skywatch-investigations-plugin.AC3.2 and AC3.3: These require a real Ozone instance. Document as human verification tests. Unit test that the request body is constructed correctly for apply vs remove actions by extracting the body-building logic into a pure function.

Use `bun test`.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test src/tools/ozone.test.ts`
Expected: All tests pass

**Commit:** `feat: add ozone_label MCP tool for moderation label management`
<!-- END_TASK_7 -->
<!-- END_SUBCOMPONENT_C -->

<!-- START_TASK_8 -->
### Task 8: Register all tools in server entry point

**Verifies:** None (wiring — integration verified by server startup)

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/index.ts`

**Implementation:**

Update `src/index.ts` to import and register all new tools:

1. Import `registerDomainTool` from `./tools/domain.ts`
2. Import `registerIpTool` from `./tools/ip.ts`
3. Import `registerUrlTool` from `./tools/url.ts`
4. Import `registerWhoisTool` from `./tools/whois.ts`
5. Import `registerContentTool` from `./tools/content.ts`
6. Import `registerOzoneTool` from `./tools/ozone.ts`
7. Read Ozone env vars: `OZONE_SERVICE_URL`, `OZONE_ADMIN_PASSWORD`, `OZONE_DID`
8. After `registerClickHouseTools(server, client)`, call:
   - `registerDomainTool(server)`
   - `registerIpTool(server)`
   - `registerUrlTool(server)`
   - `registerWhoisTool(server)`
   - `registerContentTool(server, client)`
   - `registerOzoneTool(server, { serviceUrl, adminPassword, did })`

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && CLICKHOUSE_MODE=direct timeout 3 bun run src/index.ts 2>&1 || true`
Expected: Server starts without import/registration errors.

**Commit:** `feat: register all 8 MCP tools in server entry point`
<!-- END_TASK_8 -->
