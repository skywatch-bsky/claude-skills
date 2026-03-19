# Skywatch Investigations Plugin Implementation Plan — Phase 1

**Goal:** Create the plugin scaffold and a working MCP server with ClickHouse tools (direct mode only).

**Architecture:** Single Claude Code plugin at `plugins/skywatch-investigations/` following established patterns from osprey-rules/osprey-rule-investigator. Introduces an MCP server (new pattern for this repo) at `servers/skywatch-mcp/` using Bun + TypeScript with stdio transport.

**Tech Stack:** Bun runtime, TypeScript, @modelcontextprotocol/sdk (stdio transport), @clickhouse/client (HTTP), zod (parameter validation)

**Scope:** Phase 1 of 7 from original design

**Codebase verified:** 2026-03-19

---

## Acceptance Criteria Coverage

This phase implements and tests:

### skywatch-investigations-plugin.AC1: MCP Server & ClickHouse Tools
- **skywatch-investigations-plugin.AC1.1 Success:** `clickhouse_query` with valid SELECT + LIMIT returns `{columns, rows}` via direct mode
- **skywatch-investigations-plugin.AC1.3 Success:** `clickhouse_schema` returns column names and types for `osprey_execution_results`
- **skywatch-investigations-plugin.AC1.4 Failure:** `clickhouse_query` rejects INSERT/UPDATE/DELETE statements with clear error
- **skywatch-investigations-plugin.AC1.5 Failure:** `clickhouse_query` rejects queries without LIMIT clause
- **skywatch-investigations-plugin.AC1.6 Failure:** `clickhouse_query` rejects queries targeting tables other than `osprey_execution_results`

### skywatch-investigations-plugin.AC6: Plugin Integration (partial)
- **skywatch-investigations-plugin.AC6.3 Success:** `.mcp.json` configures server with all env vars and sensible defaults (SSH mode default) — direct mode env vars only in this phase

---

<!-- START_TASK_1 -->
### Task 1: Plugin directory scaffold

**Verifies:** None (infrastructure)

**Files:**
- Create: `plugins/skywatch-investigations/.claude-plugin/plugin.json`
- Create: `plugins/skywatch-investigations/CLAUDE.md` (placeholder — finalized in Phase 7)
- Create: `plugins/skywatch-investigations/agents/.gitkeep`
- Create: `plugins/skywatch-investigations/skills/.gitkeep`

**Step 1: Create plugin manifest**

Create `plugins/skywatch-investigations/.claude-plugin/plugin.json`:

```json
{
  "name": "skywatch-investigations",
  "description": "Investigation toolkit for AT Protocol network analysis — bundles MCP tools for ClickHouse data access, domain/IP/URL reconnaissance, content similarity detection, and Ozone moderation labelling, alongside skills codifying investigation methodology and agents orchestrating the full workflow.",
  "version": "0.1.0",
  "author": {
    "name": "Skywatch Blue"
  },
  "keywords": ["skywatch", "investigations", "atproto", "clickhouse", "recon", "ozone", "moderation"]
}
```

**Step 2: Create placeholder CLAUDE.md**

Create `plugins/skywatch-investigations/CLAUDE.md`:

```markdown
# Skywatch Investigations Plugin

Last verified: 2026-03-19

## Purpose

Investigation toolkit for AT Protocol network analysis. Provides MCP tools for data access and reconnaissance, skills codifying investigation methodology, and agents orchestrating investigation workflows.

## Status

Under construction. See docs/design-plans/2026-03-19-skywatch-investigations-plugin.md for full design.
```

**Step 3: Create directory placeholders**

Create `plugins/skywatch-investigations/agents/.gitkeep` and `plugins/skywatch-investigations/skills/.gitkeep` as empty files.

**Step 4: Verify**

Run: `ls -la plugins/skywatch-investigations/.claude-plugin/plugin.json plugins/skywatch-investigations/CLAUDE.md plugins/skywatch-investigations/agents/.gitkeep plugins/skywatch-investigations/skills/.gitkeep`
Expected: All four files exist.

**Commit:** `chore: scaffold skywatch-investigations plugin directory`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: MCP server project initialization

**Verifies:** None (infrastructure)

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/package.json`
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/tsconfig.json`

**Step 1: Create package.json**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/package.json`:

```json
{
  "name": "skywatch-mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "bun run src/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "@clickhouse/client": "^1.18.0",
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/bun": "^1.2.0"
  }
}
```

**Step 2: Create tsconfig.json**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

**Step 3: Install dependencies**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun install`
Expected: Dependencies install without errors. `bun.lockb` is created.

**Step 4: Verify**

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun run -e "import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'; console.log('SDK loaded')"`
Expected: Prints "SDK loaded" without errors.

**Commit:** `chore: initialize skywatch-mcp server project with Bun`
<!-- END_TASK_2 -->

<!-- START_SUBCOMPONENT_A (tasks 3-6) -->
<!-- START_TASK_3 -->
### Task 3: SQL validation module (Functional Core)

**Verifies:** skywatch-investigations-plugin.AC1.4, skywatch-investigations-plugin.AC1.5, skywatch-investigations-plugin.AC1.6

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/sql-validation.ts`
- Test: `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/sql-validation.test.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/sql-validation.ts` — a pure Functional Core module that validates SQL strings against the security constraints:

1. Must be a SELECT statement (reject INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE)
2. Must contain a LIMIT clause
3. Must target only `default.osprey_execution_results` or `osprey_execution_results` table

The module exports a `validateQuery` function that returns a discriminated union result:
- `{ valid: true; normalized: string }` on success
- `{ valid: false; reason: string }` on failure

Validation approach:
- Trim and normalize whitespace
- Check first token is SELECT (case-insensitive)
- Regex check for LIMIT clause presence (case-insensitive): `/\bLIMIT\s+\d+/i`
- Check that the FROM clause references only `osprey_execution_results` or `default.osprey_execution_results`
- Return descriptive error messages for each failure case

**Testing:**

Tests must verify each AC listed above:
- skywatch-investigations-plugin.AC1.4: Validate that INSERT, UPDATE, DELETE, DROP statements return `{ valid: false }` with clear reason strings
- skywatch-investigations-plugin.AC1.5: Validate that a SELECT without LIMIT returns `{ valid: false }` with reason mentioning LIMIT requirement
- skywatch-investigations-plugin.AC1.6: Validate that queries targeting other tables (e.g., `SELECT * FROM users LIMIT 10`) return `{ valid: false }` with reason mentioning allowed table
- Also test: valid SELECT with LIMIT against osprey_execution_results returns `{ valid: true }`
- Also test: case-insensitive handling (e.g., `select`, `SELECT`, `Select`)

Use `bun test` — no mocking needed since this is a pure function.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test src/lib/sql-validation.test.ts`
Expected: All tests pass

**Commit:** `feat: add SQL validation for ClickHouse query security constraints`
<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: ClickHouse client abstraction (Imperative Shell — direct mode)

**Verifies:** skywatch-investigations-plugin.AC1.1 (partial — client layer only, tool integration in Task 5)

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/clickhouse-client.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/clickhouse-client.ts` — an Imperative Shell module that abstracts ClickHouse connectivity.

Define a `QueryResult` type:
```typescript
type QueryResult = {
  readonly columns: ReadonlyArray<{ name: string; type: string }>;
  readonly rows: ReadonlyArray<Record<string, unknown>>;
};
```

Define a `ClickHouseClientConfig` type for configuration:
```typescript
type ClickHouseClientConfig = {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
};
```

Export a `createClickHouseClient` factory function that:
1. Creates a `@clickhouse/client` instance with the provided config
2. Returns an object with:
   - `query(sql: string): Promise<QueryResult>` — executes validated SQL, returns columns and rows. Uses `JSONCompactColumnsWithNames` format or similar to extract column metadata alongside row data. Sets a 60-second timeout via `clickhouse_settings: { max_execution_time: 60 }`.
   - `getSchema(): Promise<QueryResult>` — executes `DESCRIBE TABLE default.osprey_execution_results` and returns column names and types.

The `query` function must call `validateQuery` from the SQL validation module before executing. If validation fails, throw an error with the validation reason.

Export the `QueryResult` type for use by tool handlers.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun run -e "import { createClickHouseClient } from './src/lib/clickhouse-client.ts'; console.log('Module loads')"`
Expected: Prints "Module loads" (compile check — actual ClickHouse connectivity tested via human verification)

**Commit:** `feat: add ClickHouse client abstraction with direct HTTP mode`
<!-- END_TASK_4 -->

<!-- START_TASK_5 -->
### Task 5: ClickHouse MCP tool handlers

**Verifies:** skywatch-investigations-plugin.AC1.1, skywatch-investigations-plugin.AC1.3

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/clickhouse.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/tools/clickhouse.ts` — exports a `registerClickHouseTools` function that takes an `McpServer` instance and a ClickHouse client, and registers two tools:

**Tool 1: `clickhouse_query`**
- Description: "Execute a read-only SQL query against the Osprey ClickHouse database. Only SELECT queries with LIMIT against osprey_execution_results are allowed."
- Input schema (zod): `{ sql: z.string().describe("SQL SELECT query with LIMIT clause") }`
- Handler: calls `client.query(args.sql)`, formats result as JSON text content
- Error handling: catches validation errors and ClickHouse errors, returns them as text content with `isError: true`

**Tool 2: `clickhouse_schema`**
- Description: "Get the column definitions (names and types) for the osprey_execution_results table."
- Input schema (zod): no parameters (empty object)
- Handler: calls `client.getSchema()`, formats columns as JSON text content

Both handlers return `{ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }`.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun run -e "import { registerClickHouseTools } from './src/tools/clickhouse.ts'; console.log('Tools module loads')"`
Expected: Prints "Tools module loads"

**Commit:** `feat: add clickhouse_query and clickhouse_schema MCP tool handlers`
<!-- END_TASK_5 -->

<!-- START_TASK_6 -->
### Task 6: MCP server entry point and .mcp.json

**Verifies:** skywatch-investigations-plugin.AC6.3 (partial — direct mode env vars)

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/index.ts`
- Create: `plugins/skywatch-investigations/.mcp.json`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/index.ts` — the MCP server entry point:

1. Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
2. Import `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
3. Import `createClickHouseClient` from `./lib/clickhouse-client.ts`
4. Import `registerClickHouseTools` from `./tools/clickhouse.ts`
5. Read environment variables for ClickHouse config:
   - `CLICKHOUSE_HOST` (default: `http://localhost`)
   - `CLICKHOUSE_PORT` (default: `8123`)
   - `CLICKHOUSE_USER` (default: `default`)
   - `CLICKHOUSE_PASSWORD` (default: empty string)
   - `CLICKHOUSE_DATABASE` (default: `default`)
6. Create the ClickHouse client with config from env vars
7. Create McpServer with `{ name: "skywatch-mcp", version: "0.1.0" }`
8. Call `registerClickHouseTools(server, client)`
9. Create `StdioServerTransport` and call `server.connect(transport)`
10. Log startup to stderr: `console.error("skywatch-mcp server started")`

Create `plugins/skywatch-investigations/.mcp.json`:

```json
{
  "mcpServers": {
    "skywatch-mcp": {
      "command": "bun",
      "args": ["run", "servers/skywatch-mcp/src/index.ts"],
      "cwd": ".",
      "env": {
        "CLICKHOUSE_MODE": "ssh",
        "CLICKHOUSE_HOST": "http://localhost",
        "CLICKHOUSE_PORT": "8123",
        "CLICKHOUSE_USER": "default",
        "CLICKHOUSE_PASSWORD": "",
        "CLICKHOUSE_DATABASE": "default",
        "SSH_HOST": "",
        "SSH_USER": "",
        "SSH_DOCKER_CONTAINER": "",
        "OZONE_SERVICE_URL": "",
        "OZONE_ADMIN_PASSWORD": "",
        "OZONE_DID": ""
      }
    }
  }
}
```

Note: `CLICKHOUSE_MODE` defaults to `ssh` per design. SSH-specific env vars and OZONE vars are included but empty — they'll be implemented in later phases. The `cwd: "."` is resolved by Claude Code relative to the `.mcp.json` file's location (i.e., the plugin root `plugins/skywatch-investigations/`), so the `args` path `servers/skywatch-mcp/src/index.ts` is relative to that directory.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && timeout 3 bun run src/index.ts 2>&1 || true`
Expected: Should print "skywatch-mcp server started" to stderr before timeout (server starts and waits for stdio input).

**Commit:** `feat: add MCP server entry point with stdio transport and .mcp.json`
<!-- END_TASK_6 -->
<!-- END_SUBCOMPONENT_A -->
