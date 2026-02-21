# Osprey Rules Plugin Implementation Plan — Phase 6

**Goal:** Create the `/osprey-validate` slash command for running validation against a rules project.

**Architecture:** A Claude Code command file (`commands/osprey-validate.md`) with frontmatter and markdown body. Accepts optional path argument, runs `osprey-cli push-rules <path> --dry-run`, handles success/failure, checks for CLI availability.

**Tech Stack:** Claude Code command system (markdown with YAML frontmatter), `osprey-cli` for validation.

**Scope:** 7 phases from original design (phases 1-7).

**Codebase verified:** 2026-02-21

---

## Acceptance Criteria Coverage

This phase implements and tests:

### osprey-rules-plugin.AC5: Validation command works end-to-end
- **osprey-rules-plugin.AC5.1 Success:** `/osprey-validate <path>` runs `osprey-cli push-rules <path> --dry-run` and reports result
- **osprey-rules-plugin.AC5.2 Success:** Command asks for path when no argument provided
- **osprey-rules-plugin.AC5.3 Failure:** Command reports clear error when `osprey-cli` is not installed, with install instructions
- **osprey-rules-plugin.AC5.4 Failure:** Command reports validation errors from `osprey-cli` output without swallowing them

---

## Phase 6: Command

**Goal:** Create the `/osprey-validate` slash command.

<!-- START_TASK_1 -->
### Task 1: Create osprey-validate command

**Verifies:** osprey-rules-plugin.AC5.1, osprey-rules-plugin.AC5.2, osprey-rules-plugin.AC5.3, osprey-rules-plugin.AC5.4

**Files:**
- Create: `osprey-rules-plugin/commands/osprey-validate.md`

**Implementation:**

Create the command file following established patterns (see `~/.claude/plugins/cache/ed3d-plugins/ed3d-plan-and-execute/1.10.2/commands/execute-implementation-plan.md` for format reference).

The command file must contain:

1. **Frontmatter:**
   ```yaml
   ---
   description: Validate Osprey SML rules via osprey-cli push-rules --dry-run
   argument-hint: [rules-project-path]
   allowed-tools: [Bash, Read, Skill, AskUserQuestion]
   ---
   ```

2. **Path Resolution** section (covers AC5.2):
   - If `$ARGUMENTS` is provided and non-empty, use it as the rules project path
   - If no argument provided, use `AskUserQuestion` to ask: "What is the path to your Osprey rules project?"
   - Validate the path contains `main.sml` (basic sanity check)

3. **Check osprey-cli Availability** section (covers AC5.3):
   - Run `which osprey-cli` to check if it's installed
   - If not found, report a clear error with install instructions:
     ```
     `osprey-cli` is not installed or not on your PATH.

     To install osprey-cli:
       cd /path/to/osprey-for-atproto
       uv pip install -e osprey_worker/

     Or if you use pip:
       cd /path/to/osprey-for-atproto
       pip install -e osprey_worker/

     After installation, verify with: osprey-cli --help
     ```
   - Stop execution if `osprey-cli` is not available

4. **Run Validation** section (covers AC5.1):
   - Run: `osprey-cli push-rules <path> --dry-run`
   - Capture both stdout and stderr
   - Check exit code

5. **Handle Results** section (covers AC5.4):
   - **If exit code 0:** Report success. Output the success message from osprey-cli.
   - **If exit code 1:** Report failure. Output the FULL error output from osprey-cli — do NOT summarize, truncate, or swallow any errors. Then optionally load `debugging-osprey-rules` skill to help fix.
   - **If other exit code:** Report unexpected error with full output.

6. **Optional: Load Debugging Skill on Failure:**
   - After reporting errors, ask user: "Would you like me to help fix these errors?"
   - If yes, load `debugging-osprey-rules` skill using the Skill tool

**Verification:**

Verify the file exists and has correct frontmatter:
```bash
head -5 osprey-rules-plugin/commands/osprey-validate.md
```
Expected: YAML frontmatter with `description:` and `argument-hint:`.

Verify it references osprey-cli:
```bash
grep -c "osprey-cli" osprey-rules-plugin/commands/osprey-validate.md
```
Expected: At least 3 (availability check, run command, install instructions).

Verify it handles missing path:
```bash
grep -c "AskUserQuestion\|no argument\|ARGUMENTS" osprey-rules-plugin/commands/osprey-validate.md
```
Expected: At least 1.

**Commit:** `feat(osprey-rules-plugin): add /osprey-validate command`
<!-- END_TASK_1 -->
