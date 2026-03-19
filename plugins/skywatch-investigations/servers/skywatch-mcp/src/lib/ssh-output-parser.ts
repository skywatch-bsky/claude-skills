// pattern: Functional Core
// Parses ClickHouse JSONCompactEachRowWithNamesAndTypes output

import type { QueryResult } from "./clickhouse-client";

export function parseSshOutput(stdout: string): QueryResult {
  if (!stdout || typeof stdout !== "string") {
    return { columns: [], rows: [] };
  }

  const lines = stdout.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { columns: [], rows: [] };
  }

  let columnNames: string[] = [];
  let columnTypes: string[] = [];

  try {
    const namesLine = JSON.parse(lines[0]);
    const typesLine = JSON.parse(lines[1]);

    if (!Array.isArray(namesLine) || !Array.isArray(typesLine)) {
      return { columns: [], rows: [] };
    }

    columnNames = namesLine.map((name) => String(name));
    columnTypes = typesLine.map((type) => String(type));
  } catch {
    return { columns: [], rows: [] };
  }

  const columns = columnNames.map((name, index) => ({
    name,
    type: columnTypes[index] ?? "",
  }));

  const rows: Array<Record<string, unknown>> = [];

  for (let i = 2; i < lines.length; i++) {
    try {
      const values = JSON.parse(lines[i]);
      if (!Array.isArray(values)) {
        continue;
      }

      const row: Record<string, unknown> = {};
      columnNames.forEach((name, index) => {
        row[name] = values[index];
      });

      rows.push(row);
    } catch {
      continue;
    }
  }

  return { columns, rows };
}
