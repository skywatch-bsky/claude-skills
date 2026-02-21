---
name: investigating-osprey-rules
description: >-
  Systematic investigation methodology for Osprey SML rules projects.
  Produces structured text reports on project structure, labels, models,
  UDFs, and execution graphs.
user-invocable: false
---

# Investigating Osprey Rules

## Overview

You are investigating an Osprey SML rules project to produce a structured report.
Your caller has provided a rules project path and an osprey-for-atproto repo path.

**Output rules:**
- Return ALL findings as text in your response. NEVER write files.
- Include exact file paths and line numbers for every finding.
- If something is missing or unexpected, report it explicitly — do not silently skip.
- Structure your report with the section headings defined below.

**Investigation order:**
1. Project Structure Inventory (this section)
2. UDF Discovery (Section 2)
3. Execution Graph Mapping (Section 3)

Produce each section in order. If a section cannot be completed (e.g., path
inaccessible), report what's missing and continue to the next section.

---

## Section 1: Project Structure Inventory

Validate the project directory structure, catalogue all SML files, extract the
labels table from `config/labels.yaml`, and list model files with their key
variable definitions.

### Step 1.1: Validate Required Structure

Use Glob and Read to check for the required project components. Report each as
present or absent.

**Required components (check in this order):**

| Component | Check | Required |
|-----------|-------|----------|
| `main.sml` | File exists at project root | Yes |
| `config/` | Directory exists | Yes |
| `config/labels.yaml` | File exists | Yes |
| `models/` | Directory exists | Yes |
| `rules/` | Directory exists | Yes |
| `rules/index.sml` | File exists | Expected but not fatal if absent |

**Report format:**

```
## 1. Project Structure Inventory

### 1.1 Structure Validation

Project path: /path/to/rules-project

  ✓ main.sml
  ✓ config/
  ✓ config/labels.yaml
  ✓ models/
  ✓ rules/
  ✓ rules/index.sml
```

**If ANY required component is missing:**

```
  ✗ models/ — MISSING (required)
  ✓ rules/
```

Report ALL missing components — do not stop at the first failure. Continue
investigation with whatever IS present.

### Step 1.2: List All SML Files

Use Glob to find all `.sml` files in the project.

```
Glob pattern: **/*.sml
```

**Report format:**

```
### 1.2 SML File Inventory

Found N .sml files:

  main.sml
  models/base.sml
  models/record/post.sml
  models/record/follow.sml
  models/label_guards.sml
  rules/index.sml
  rules/record/index.sml
  rules/record/post/index.sml
  rules/record/post/spam_detection.sml
  ...
```

List paths relative to the project root. Sort alphabetically.

### Step 1.3: Extract Labels Table

Read `config/labels.yaml` and produce a table of all defined labels.

**What to extract for each label:**
- Label name (the YAML key)
- `valid_for` values (entity types: UserId, AtUri, PdsHost, Handle, etc.)
- `connotation` value (neutral, positive, or negative)

**Report format:**

```
### 1.3 Labels

Source: config/labels.yaml

  Label Name              | Valid For              | Connotation
  ----------------------- | ====================== | -----------
  alt-gov                 | UserId                 | neutral
  alt-tech                | AtUri                  | neutral
  amplifier               | UserId                 | neutral
  spam-post               | UserId, AtUri          | negative
  ...

Total: N labels defined
```

If `config/labels.yaml` does not exist, report:

```
### 1.3 Labels

  ✗ config/labels.yaml not found — cannot extract labels table
```

### Step 1.4: Catalogue Model Files

Read each file in `models/` (and subdirectories). For each file, extract the key
variable definitions.

**Variable types to identify:**

| Variable Pattern | Type | Purpose |
|-----------------|------|---------|
| `EntityJson(type='X', path='...')` | Entity definition | Label target — used in LabelAdd/LabelRemove entity= |
| `JsonData(path='...')` | Primitive extraction | Data values used in rule conditions |
| `Second = 1`, `Minute = 60`, etc. | Time constant | Duration values for windows and deltas |
| `HasAtprotoLabel(entity=X, label='Y')` | Label guard | Pre-computed check preventing re-labeling |

**For each model file, report:**

```
### 1.4 Models

#### models/base.sml

  Line  | Variable            | Type           | Details
  ----- | =================== | ============== | -------
  3     | UserId              | EntityJson     | type='UserId', path='$.did'
  5     | Handle              | EntityJson     | type='Handle', path='$.handle'
  8     | ActionName          | JsonData       | path='$.action', type=str
  12    | Second              | Time constant  | = 1
  13    | Minute              | Time constant  | = 60
  14    | Hour                | Time constant  | = 3600
  15    | Day                 | Time constant  | = 86400
  16    | Week                | Time constant  | = 604800

#### models/record/post.sml

  Line  | Variable            | Type           | Details
  ----- | =================== | ============== | -------
  5     | PostText            | JsonData       | path='$.record.text', type=str
  7     | PostUri             | EntityJson     | type='AtUri', path='$.uri'
  ...

#### models/label_guards.sml

  Line  | Variable            | Type           | Details
  ----- | =================== | ============== | -------
  4     | HasSpamLabel        | Label guard    | entity=UserId, label='spam'
  5     | HasBotLabel         | Label guard    | entity=UserId, label='bot'
  ...
```

Include line numbers for every variable definition. If `models/` does not exist,
report it as missing and skip this step.
