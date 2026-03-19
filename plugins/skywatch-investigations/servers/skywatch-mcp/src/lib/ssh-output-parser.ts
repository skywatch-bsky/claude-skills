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
    const firstLine = lines[0];
    const secondLine = lines[1];

    if (!firstLine || !secondLine) {
      return { columns: [], rows: [] };
    }

    const namesLine = JSON.parse(firstLine);
    const typesLine = JSON.parse(secondLine);

    if (!Array.isArray(namesLine) || !Array.isArray(typesLine)) {
      return { columns: [], rows: [] };
    }

    columnNames = namesLine.map((name) => String(name));
    columnTypes = typesLine.map((type) => String(type));
  } catch {
    return { columns: [], rows: [] };
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
      columnNames.forEach((name, index) => {
        const value = values[index];
        row[name] = value;
      });

      rows.push(row);
    } catch {
      continue;
    }
  }

  return { columns, rows };
}
