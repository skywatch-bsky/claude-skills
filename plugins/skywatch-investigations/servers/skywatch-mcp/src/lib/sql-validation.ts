// pattern: Functional Core
// Pure validation logic for SQL query constraints
// Enforces read-only access: SELECT-only, LIMIT required, no semicolons, no INTO

export type ValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; reason: string };

export function validateQuery(sql: string): ValidationResult {
  const trimmed = sql.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: "Query cannot be empty" };
  }

  const normalized = trimmed.replace(/\s+/g, " ");
  const tokens = normalized.split(/\s+/);
  const firstToken = tokens[0];
  if (!firstToken) {
    return { valid: false, reason: "Query cannot be empty" };
  }

  const upperFirst = firstToken.toUpperCase();
  if (upperFirst !== "SELECT" && upperFirst !== "WITH") {
    return {
      valid: false,
      reason: `Only SELECT queries are allowed. Query starts with '${firstToken}'`,
    };
  }

  const upperNormalized = normalized.toUpperCase();

  if (!/\bLIMIT\s+\d+\b/.test(upperNormalized)) {
    return {
      valid: false,
      reason: "Query must contain a LIMIT clause with a numeric value (e.g., LIMIT 10)",
    };
  }

  if (/;/.test(upperNormalized)) {
    return {
      valid: false,
      reason: "Query cannot contain semicolons (multi-statement execution not allowed)",
    };
  }

  if (/\bINTO\b/i.test(upperNormalized)) {
    return {
      valid: false,
      reason: "Query cannot contain INTO keyword (data export not allowed)",
    };
  }

  return { valid: true, normalized };
}
