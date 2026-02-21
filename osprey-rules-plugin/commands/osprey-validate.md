---
description: Validate Osprey SML rules via osprey-cli push-rules --dry-run
argument-hint: [rules-project-path]
allowed-tools: [Bash, Read, Skill, AskUserQuestion]
---

# Osprey Validate

Validates an Osprey SML rules project by running `osprey-cli push-rules <path> --dry-run`.

## Path Resolution

First, determine the path to the Osprey rules project.

If `$ARGUMENTS` is provided and non-empty, use it as the rules project path:

```bash
RULES_PATH="$ARGUMENTS"
```

If no argument is provided, ask the user for the path:

```bash
# Use AskUserQuestion to prompt for the path
```

After obtaining the path, validate it contains `main.sml`:

```bash
if [ ! -f "$RULES_PATH/main.sml" ]; then
  echo "Error: '$RULES_PATH' does not contain main.sml. Please verify the path."
  exit 1
fi
```

## Check osprey-cli Availability

Verify that `osprey-cli` is installed and available on the PATH:

```bash
if ! command -v osprey-cli &> /dev/null; then
  echo "\`osprey-cli\` is not installed or not on your PATH.

To install osprey-cli:
  cd /path/to/osprey-for-atproto
  uv pip install -e osprey_worker/

Or if you use pip:
  cd /path/to/osprey-for-atproto
  pip install -e osprey_worker/

After installation, verify with: osprey-cli --help"
  exit 1
fi
```

## Run Validation

Execute the validation command, capturing both stdout and stderr:

```bash
osprey-cli push-rules "$RULES_PATH" --dry-run
EXIT_CODE=$?
```

## Handle Results

Check the exit code and report results accordingly.

**If exit code is 0 (success):**
```bash
if [ $EXIT_CODE -eq 0 ]; then
  echo "Validation successful! Your Osprey rules project is valid."
fi
```

**If exit code is 1 (validation failure):**
```bash
if [ $EXIT_CODE -eq 1 ]; then
  echo "Validation failed. Please review the errors above and fix your rules project."
fi
```

**If exit code is anything else (unexpected error):**
```bash
if [ $EXIT_CODE -ne 0 ] && [ $EXIT_CODE -ne 1 ]; then
  echo "Unexpected error (exit code $EXIT_CODE). Please check your osprey-cli installation."
fi
```

**CRITICAL: Report the FULL error output from osprey-cli. Do NOT summarize, truncate, or omit any errors.** Display all output from the osprey-cli command exactly as it was produced.

## Optional: Load Debugging Skill on Failure

If validation failed (exit code 1), offer to help the user fix the errors. Load the `debugging-osprey-rules` skill using the Skill tool to provide detailed debugging assistance.
