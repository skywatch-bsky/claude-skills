import { describe, it, expect } from "bun:test";
import { buildSimilarityQuery, escapeClickhouseSql } from "./content.ts";

describe("buildSimilarityQuery", () => {
  it("should build correct SQL with default parameters", () => {
    const query = buildSimilarityQuery("hello world", 0.4, 20);
    expect(query).toContain("ngramDistance(content, 'hello world')");
    expect(query).toContain("WHERE ngramDistance(content, 'hello world') < 0.4");
    expect(query).toContain("LIMIT 20");
    expect(query).toContain("FROM default.osprey_execution_results");
  });

  it("should respect custom threshold", () => {
    const query = buildSimilarityQuery("test", 0.5, 20);
    expect(query).toContain("< 0.5");
  });

  it("should respect custom limit", () => {
    const query = buildSimilarityQuery("test", 0.4, 50);
    expect(query).toContain("LIMIT 50");
  });

  it("should escape special characters in text", () => {
    const escaped = escapeClickhouseSql("test'quote");
    expect(escaped).toBe("test\\'quote");
  });

  it("should escape backslashes in text", () => {
    const escaped = escapeClickhouseSql("test\\path");
    expect(escaped).toBe("test\\\\path");
  });

  it("should escape both quotes and backslashes", () => {
    const escaped = escapeClickhouseSql("path\\to'file");
    expect(escaped).toBe("path\\\\to\\'file");
  });

  it("should select correct columns", () => {
    const query = buildSimilarityQuery("test", 0.4, 20);
    expect(query).toContain("SELECT");
    expect(query).toContain("did as user");
    expect(query).toContain("handle");
    expect(query).toContain("content as text");
    expect(query).toContain("created_at");
  });

  it("should order by score ascending", () => {
    const query = buildSimilarityQuery("test", 0.4, 20);
    expect(query).toContain("ORDER BY score ASC");
  });
});
