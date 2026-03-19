import { describe, it, expect } from "bun:test";
import { parseSshOutput } from "./ssh-output-parser";

describe("parseSshOutput", () => {
  it("parses well-formed JSONCompactEachRowWithNamesAndTypes output with multiple rows", () => {
    const output = `["id","name","type"]
["UInt64","String","String"]
[1,"foo","bar"]
[2,"baz","qux"]`;

    const result = parseSshOutput(output);

    expect(result.columns).toEqual([
      { name: "id", type: "UInt64" },
      { name: "name", type: "String" },
      { name: "type", type: "String" },
    ]);

    expect(result.rows).toEqual([
      { id: 1, name: "foo", type: "bar" },
      { id: 2, name: "baz", type: "qux" },
    ]);
  });

  it("handles empty result set (only 2 header lines)", () => {
    const output = `["id","name"]
["UInt64","String"]`;

    const result = parseSshOutput(output);

    expect(result.columns).toEqual([
      { name: "id", type: "UInt64" },
      { name: "name", type: "String" },
    ]);

    expect(result.rows).toEqual([]);
  });

  it("returns empty result for empty string", () => {
    const result = parseSshOutput("");

    expect(result).toEqual({ columns: [], rows: [] });
  });

  it("returns empty result for single line", () => {
    const output = `["id","name"]`;

    const result = parseSshOutput(output);

    expect(result).toEqual({ columns: [], rows: [] });
  });

  it("parses single row correctly", () => {
    const output = `["id","value"]
["UInt64","String"]
[42,"hello"]`;

    const result = parseSshOutput(output);

    expect(result.columns).toEqual([
      { name: "id", type: "UInt64" },
      { name: "value", type: "String" },
    ]);

    expect(result.rows).toEqual([{ id: 42, value: "hello" }]);
  });

  it("preserves column types in columns array", () => {
    const output = `["col1","col2","col3"]
["Int32","Float64","DateTime"]
[1,3.14,"2026-03-19 12:00:00"]`;

    const result = parseSshOutput(output);

    expect(result.columns[0]).toEqual({ name: "col1", type: "Int32" });
    expect(result.columns[1]).toEqual({ name: "col2", type: "Float64" });
    expect(result.columns[2]).toEqual({ name: "col3", type: "DateTime" });
  });

  it("handles rows with null values", () => {
    const output = `["id","value"]
["UInt64","Nullable(String)"]
[1,null]
[2,"foo"]`;

    const result = parseSshOutput(output);

    expect(result.rows).toEqual([
      { id: 1, value: null },
      { id: 2, value: "foo" },
    ]);
  });

  it("handles rows with complex JSON values", () => {
    const output = `["id","data"]
["UInt64","String"]
[1,"{\\"nested\\":\\"value\\"}"]
[2,"array"]`;

    const result = parseSshOutput(output);

    expect(result.rows).toEqual([
      { id: 1, data: '{"nested":"value"}' },
      { id: 2, data: "array" },
    ]);
  });

  it("skips lines with blank lines in output", () => {
    const output = `["id","name"]
["UInt64","String"]

[1,"foo"]
[2,"bar"]`;

    const result = parseSshOutput(output);

    expect(result.rows).toEqual([
      { id: 1, name: "foo" },
      { id: 2, name: "bar" },
    ]);
  });

  it("handles malformed JSON in data rows gracefully", () => {
    const output = `["id","name"]
["UInt64","String"]
[1,"foo"]
{invalid json}
[2,"bar"]`;

    const result = parseSshOutput(output);

    // Should parse the valid rows and skip the invalid one
    expect(result.rows).toEqual([
      { id: 1, name: "foo" },
      { id: 2, name: "bar" },
    ]);
  });

  it("returns empty columns for malformed header", () => {
    const output = `not json
not json
[1,"foo"]`;

    const result = parseSshOutput(output);

    expect(result.columns).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("handles columns with mismatched data count", () => {
    const output = `["id","name","extra"]
["UInt64","String","String"]
[1,"foo"]`;

    const result = parseSshOutput(output);

    expect(result.columns).toEqual([
      { name: "id", type: "UInt64" },
      { name: "name", type: "String" },
      { name: "extra", type: "String" },
    ]);

    expect(result.rows).toEqual([{ id: 1, name: "foo", extra: undefined }]);
  });
});
