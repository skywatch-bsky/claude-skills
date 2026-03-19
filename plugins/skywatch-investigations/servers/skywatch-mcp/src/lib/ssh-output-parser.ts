// pattern: Functional Core
// Parses ClickHouse JSONCompactEachRowWithNamesAndTypes output

import type { QueryResult } from "./clickhouse-client";

export type ParseSshOutputResult =
  | { success: true; data: QueryResult }
  | { success: false; reason: string };

export function parseSshOutput(stdout: string): ParseSshOutputResult {
  if (!stdout || typeof stdout !== "string") {
    return { success: false, reason: "Output is empty or not a string" };
  }

  const lines = stdout.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      reason: "Output must have at least 2 lines (column names and types)",
    };
  }

  const columnNames: Array<string> = [];
  const columnTypes: Array<string> = [];

  try {
    const firstLine = lines[0];
    const secondLine = lines[1];

    if (!firstLine || !secondLine) {
      return {
        success: false,
        reason: "Column headers are missing or malformed",
      };
    }

    const namesLine = JSON.parse(firstLine);
    const typesLine = JSON.parse(secondLine);

    if (!Array.isArray(namesLine) || !Array.isArray(typesLine)) {
      return {
        success: false,
        reason: "Column headers must be JSON arrays",
      };
    }

    columnNames.push(...namesLine.map((name) => String(name)));
    columnTypes.push(...typesLine.map((type) => String(type)));
  } catch (error) {
    return {
      success: false,
      reason: `Failed to parse column headers: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const columns = columnNames.map((name, index) => {
    const colType = columnTypes[index];
    return {
      name,
      type: colType ? String(colType) : "",
    };
  });

  const rows: Array<Record<string, unknown>> = [];

  for (let i = 2; i < lines.length; i++) {
    const currentLine = lines[i];
    if (!currentLine) continue;

    try {
      const values = JSON.parse(currentLine);
      if (!Array.isArray(values)) {
        continue;
      }

      const row: Record<string, unknown> = {};
      for (const [index, name] of columnNames.entries()) {
        const value = values[index];
        row[name] = value;
      }

      rows.push(row);
    } catch {
      continue;
    }
  }

  return { success: true, data: { columns, rows } };
}
