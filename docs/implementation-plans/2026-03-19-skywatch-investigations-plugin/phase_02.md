# Skywatch Investigations Plugin Implementation Plan — Phase 2

**Goal:** Add SSH connection mode so the MCP server works with the current sys2 + docker exec operational pattern.

**Architecture:** Adds an `ssh-client.ts` module that executes ClickHouse queries via `ssh user@host "docker exec container clickhouse-client ..."` using `Bun.spawn`. The existing `clickhouse-client.ts` is refactored into a strategy pattern that selects direct or SSH mode based on `CLICKHOUSE_MODE` env var.

**Tech Stack:** Bun.spawn (subprocess), SSH + docker exec, clickhouse-client CLI with JSONCompactEachRowWithNamesAndTypes format

**Scope:** Phase 2 of 7 from original design

**Codebase verified:** 2026-03-19

---

## Acceptance Criteria Coverage

This phase implements and tests:

### skywatch-investigations-plugin.AC1: MCP Server & ClickHouse Tools
- **skywatch-investigations-plugin.AC1.2 Success:** `clickhouse_query` with valid SELECT + LIMIT returns same shape via SSH mode
- **skywatch-investigations-plugin.AC1.7 Edge:** Switching `CLICKHOUSE_MODE` between direct/ssh requires only env var change, no code changes

---

<!-- START_SUBCOMPONENT_A (tasks 1-3) -->
<!-- START_TASK_1 -->
### Task 1: SSH output parser (Functional Core)

**Verifies:** skywatch-investigations-plugin.AC1.2 (partial — parsing layer)

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/ssh-output-parser.ts`
- Test: `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/ssh-output-parser.test.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/ssh-output-parser.ts` — a pure Functional Core module that parses the stdout output from `clickhouse-client --format JSONCompactEachRowWithNamesAndTypes`.

The output format is newline-delimited JSON arrays:
- Line 1: column names (e.g., `["id","name","type"]`)
- Line 2: column types (e.g., `["UInt64","String","String"]`)
- Lines 3+: data rows (e.g., `[1,"foo","bar"]`)

Export a `parseSshOutput` function:
- Input: `stdout: string` (raw output from SSH command)
- Output: `QueryResult` type (same `{ columns, rows }` shape as direct mode from Phase 1)
- Parses each line as JSON
- Constructs `columns` array from lines 1+2: `[{ name: "id", type: "UInt64" }, ...]`
- Constructs `rows` array from lines 3+ by zipping column names with values: `[{ id: 1, name: "foo", type: "bar" }, ...]`
- Handles empty result sets (only 2 header lines, no data lines)
- Returns error result if stdout is empty or has fewer than 2 lines

Import the `QueryResult` type from `clickhouse-client.ts` (Phase 1).

**Testing:**

Tests must verify:
- skywatch-investigations-plugin.AC1.2 (parser aspect): Given well-formed JSONCompactEachRowWithNamesAndTypes output, returns `{ columns, rows }` matching the direct mode shape
- Empty result set (2 header lines only) returns `{ columns: [...], rows: [] }`
- Malformed output (empty string, single line) returns appropriate error
- Multi-row result set parses all rows correctly
- Column types are preserved in the columns array

Use `bun test` — no mocking needed, pure function.

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun test src/lib/ssh-output-parser.test.ts`
Expected: All tests pass

**Commit:** `feat: add SSH output parser for ClickHouse JSONCompactEachRowWithNamesAndTypes format`
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: SSH client module (Imperative Shell)

**Verifies:** skywatch-investigations-plugin.AC1.2 (partial — execution layer)

**Files:**
- Create: `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/ssh-client.ts`

**Implementation:**

Create `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/ssh-client.ts` — an Imperative Shell module that executes ClickHouse queries via SSH + docker exec.

Define an `SshClientConfig` type:
```typescript
type SshClientConfig = {
  readonly sshHost: string;
  readonly sshUser: string;
  readonly dockerContainer: string;
  readonly database: string;
};
```

Export a `createSshClient` factory function that returns an object with the same interface as the direct client from Phase 1:
- `query(sql: string): Promise<QueryResult>`
- `getSchema(): Promise<QueryResult>`

The `query` function:
1. Calls `validateQuery(sql)` from the SQL validation module (same as direct mode)
2. If validation fails, throws an error with the reason
3. Builds the SSH command using `Bun.spawn`:
   - Executable: `ssh`
   - Args: `[config.sshHost, remoteCommand]` where `remoteCommand` is `docker exec {container} clickhouse-client --database {database} --format JSONCompactEachRowWithNamesAndTypes --query "{escapedSql}"`
   - SQL escaping: since the SQL passes through multiple shell layers (SSH → remote shell → docker exec → container shell → clickhouse-client), use `Bun.spawn` with array args to avoid local shell interpolation. For the remote command string, escape `"` → `\"`, `$` → `\$`, and `` ` `` → `` \` `` in the SQL. Alternatively, pipe the SQL via stdin to avoid shell escaping entirely: `ssh user@host "docker exec -i container clickhouse-client --format ... "` and write the SQL to the process's stdin.
   - Configure: `{ stdout: "pipe", stderr: "pipe" }`
4. Awaits `proc.exited` for the exit code
5. If exit code !== 0, throws error with stderr content
6. Passes stdout to `parseSshOutput()` and returns the result
7. Timeout: use `AbortSignal.timeout(60_000)` or equivalent to kill the process after 60 seconds

The `getSchema` function:
- Constructs and executes the SSH command directly for `DESCRIBE TABLE default.osprey_execution_results`, bypassing `validateQuery`. DESCRIBE is not a SELECT statement and will not pass validation — this is intentional. The direct mode client (Phase 1) also uses a separate code path for `getSchema` that doesn't go through validation.
- Uses the same `Bun.spawn` + `parseSshOutput` pattern as `query`, but with the DESCRIBE SQL hardcoded (not user-supplied, so no validation needed).

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && bun run -e "import { createSshClient } from './src/lib/ssh-client.ts'; console.log('SSH client module loads')"`
Expected: Prints "SSH client module loads"

**Commit:** `feat: add SSH + docker exec ClickHouse client`
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Refactor clickhouse-client.ts to strategy pattern

**Verifies:** skywatch-investigations-plugin.AC1.7

**Files:**
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/lib/clickhouse-client.ts`
- Modify: `plugins/skywatch-investigations/servers/skywatch-mcp/src/index.ts`

**Implementation:**

Refactor `clickhouse-client.ts` to export a unified factory that selects the strategy based on config:

1. Define a `ClickHouseClient` type representing the shared interface:
   ```typescript
   type ClickHouseClient = {
     query(sql: string): Promise<QueryResult>;
     getSchema(): Promise<QueryResult>;
   };
   ```

2. Export this type for use by tool handlers.

3. Rename the existing `createClickHouseClient` to `createDirectClient` (internal, not exported).

4. Export a new `createClickHouseClient` factory function:
   ```typescript
   type ClickHouseMode = "direct" | "ssh";

   type ClickHouseConnectionConfig = {
     readonly mode: ClickHouseMode;
     // Direct mode config
     readonly host?: string;
     readonly port?: number;
     readonly username?: string;
     readonly password?: string;
     readonly database?: string;
     // SSH mode config
     readonly sshHost?: string;
     readonly sshUser?: string;
     readonly dockerContainer?: string;
   };
   ```

5. The factory reads `mode` and creates the appropriate client:
   - `mode === "direct"` → calls `createDirectClient` with host/port/username/password/database
   - `mode === "ssh"` → calls `createSshClient` with sshHost/sshUser/dockerContainer/database
   - Unknown mode → throws descriptive error

6. Update `src/index.ts` to:
   - Read `CLICKHOUSE_MODE` env var (default: `"ssh"`)
   - Read SSH-specific env vars: `SSH_HOST`, `SSH_USER`, `SSH_DOCKER_CONTAINER`
   - Pass all config to the unified `createClickHouseClient` factory
   - No changes to tool registration — tools receive the same `ClickHouseClient` interface regardless of mode

**Verification:**
Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && CLICKHOUSE_MODE=direct timeout 3 bun run src/index.ts 2>&1 || true`
Expected: Server starts (prints startup message). Switching to `CLICKHOUSE_MODE=ssh` should also start without errors.

Run: `cd plugins/skywatch-investigations/servers/skywatch-mcp && CLICKHOUSE_MODE=ssh timeout 3 bun run src/index.ts 2>&1 || true`
Expected: Server starts (prints startup message).

**Commit:** `refactor: unify ClickHouse client with strategy pattern for direct/ssh modes`
<!-- END_TASK_3 -->
<!-- END_SUBCOMPONENT_A -->
