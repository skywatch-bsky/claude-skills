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
  const firstToken = tokens[0].toUpperCase();

  if (firstToken !== "SELECT") {
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

  const fromMatch = upperNormalized.match(/\bFROM\s+(\S+)/);
  if (!fromMatch) {
    return {
      valid: false,
      reason: "Query must contain a FROM clause",
    };
  }

  const tableRef = fromMatch[1];
  const validTables = ["OSPREY_EXECUTION_RESULTS", "DEFAULT.OSPREY_EXECUTION_RESULTS"];

  if (!validTables.includes(tableRef)) {
    return {
      valid: false,
      reason: `Query can only target 'osprey_execution_results' or 'default.osprey_execution_results', but targets '${tableRef}'`,
    };
  }

  return { valid: true, normalized };
}
