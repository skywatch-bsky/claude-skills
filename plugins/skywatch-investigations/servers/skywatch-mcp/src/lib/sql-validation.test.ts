import { describe, it, expect } from "bun:test";
import { validateQuery } from "./sql-validation";

describe("validateQuery", () => {
  describe("AC1.4: Reject non-SELECT statements", () => {
    it("should reject INSERT statements", () => {
      const result = validateQuery(
        "INSERT INTO osprey_execution_results (id) VALUES (1)"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Only SELECT queries are allowed");
      }
    });

    it("should reject UPDATE statements", () => {
      const result = validateQuery(
        "UPDATE osprey_execution_results SET id = 1 LIMIT 10"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Only SELECT queries are allowed");
      }
    });

    it("should reject DELETE statements", () => {
      const result = validateQuery(
        "DELETE FROM osprey_execution_results LIMIT 10"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Only SELECT queries are allowed");
      }
    });

    it("should reject DROP statements", () => {
      const result = validateQuery("DROP TABLE osprey_execution_results");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Only SELECT queries are allowed");
      }
    });

    it("should reject ALTER statements", () => {
      const result = validateQuery(
        "ALTER TABLE osprey_execution_results ADD COLUMN foo INT"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Only SELECT queries are allowed");
      }
    });

    it("should reject CREATE statements", () => {
      const result = validateQuery(
        "CREATE TABLE osprey_execution_results (id INT)"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Only SELECT queries are allowed");
      }
    });

    it("should reject TRUNCATE statements", () => {
      const result = validateQuery("TRUNCATE TABLE osprey_execution_results");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("Only SELECT queries are allowed");
      }
    });
  });

  describe("AC1.5: Require LIMIT clause", () => {
    it("should reject SELECT without LIMIT", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("LIMIT");
      }
    });

    it("should reject SELECT with LIMIT but no numeric value", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results LIMIT"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("LIMIT");
      }
    });

    it("should accept SELECT with valid LIMIT clause", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results LIMIT 10"
      );
      expect(result.valid).toBe(true);
    });

    it("should accept SELECT with large LIMIT value", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results LIMIT 999999"
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("AC1.6: Restrict table access", () => {
    it("should reject queries targeting other tables", () => {
      const result = validateQuery("SELECT * FROM users LIMIT 10");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("osprey_execution_results");
      }
    });

    it("should reject queries with different table names", () => {
      const result = validateQuery("SELECT * FROM events LIMIT 10");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("osprey_execution_results");
      }
    });

    it("should accept queries targeting osprey_execution_results", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results LIMIT 10"
      );
      expect(result.valid).toBe(true);
    });

    it("should accept queries targeting default.osprey_execution_results", () => {
      const result = validateQuery(
        "SELECT * FROM default.osprey_execution_results LIMIT 10"
      );
      expect(result.valid).toBe(true);
    });

    it("should accept queries targeting pds_signup_anomalies", () => {
      const result = validateQuery(
        "SELECT * FROM pds_signup_anomalies LIMIT 10"
      );
      expect(result.valid).toBe(true);
    });

    it("should accept queries targeting default.pds_signup_anomalies", () => {
      const result = validateQuery(
        "SELECT * FROM default.pds_signup_anomalies LIMIT 10"
      );
      expect(result.valid).toBe(true);
    });

    it("should accept case-insensitive pds_signup_anomalies", () => {
      const result = validateQuery(
        "SELECT * FROM PDS_SIGNUP_ANOMALIES LIMIT 10"
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("Case-insensitive handling", () => {
    it("should accept lowercase select", () => {
      const result = validateQuery(
        "select * from osprey_execution_results limit 10"
      );
      expect(result.valid).toBe(true);
    });

    it("should accept mixed case SELECT", () => {
      const result = validateQuery(
        "Select * From osprey_execution_results Limit 10"
      );
      expect(result.valid).toBe(true);
    });

    it("should accept uppercase SELECT", () => {
      const result = validateQuery(
        "SELECT * FROM OSPREY_EXECUTION_RESULTS LIMIT 10"
      );
      expect(result.valid).toBe(true);
    });

    it("should accept mixed case default.osprey_execution_results", () => {
      const result = validateQuery(
        "SELECT * FROM Default.Osprey_Execution_Results LIMIT 10"
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("Whitespace normalization", () => {
    it("should accept query with extra spaces", () => {
      const result = validateQuery(
        "SELECT  *  FROM   osprey_execution_results   LIMIT   10"
      );
      expect(result.valid).toBe(true);
    });

    it("should accept query with tabs and newlines", () => {
      const result = validateQuery(
        "SELECT\n\t*\n\tFROM\n\tosprey_execution_results\n\tLIMIT\n\t10"
      );
      expect(result.valid).toBe(true);
    });

    it("should return normalized query on success", () => {
      const result = validateQuery(
        "SELECT  *  FROM   osprey_execution_results   LIMIT   10"
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.normalized).toBe(
          "SELECT * FROM osprey_execution_results LIMIT 10"
        );
      }
    });
  });

  describe("Edge cases", () => {
    it("should reject empty query", () => {
      const result = validateQuery("");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("empty");
      }
    });

    it("should reject whitespace-only query", () => {
      const result = validateQuery("   \n\t  ");
      expect(result.valid).toBe(false);
    });

    it("should reject query without FROM clause", () => {
      const result = validateQuery("SELECT 1 LIMIT 10");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("FROM");
      }
    });

    it("should accept complex valid query", () => {
      const result = validateQuery(
        "SELECT col1, col2, COUNT(*) as cnt FROM osprey_execution_results WHERE col1 > 5 GROUP BY col1, col2 LIMIT 100"
      );
      expect(result.valid).toBe(true);
    });

    it("should reject query with LIMIT but non-numeric value", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results LIMIT foo"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("LIMIT");
      }
    });
  });

  describe("SQL injection prevention", () => {
    it("should reject UNION queries", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results UNION SELECT * FROM users LIMIT 10"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("UNION");
      }
    });

    it("should reject UNION ALL queries", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results UNION ALL SELECT * FROM users LIMIT 10"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("UNION");
      }
    });

    it("should reject queries with semicolon (multi-statement)", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results LIMIT 10; DROP TABLE users"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("semicolon");
      }
    });

    it("should reject queries with semicolon at end", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results LIMIT 10;"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("semicolon");
      }
    });

    it("should reject JOIN queries", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results JOIN users ON 1=1 LIMIT 10"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("JOIN");
      }
    });

    it("should reject LEFT JOIN queries", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results LEFT JOIN users LIMIT 10"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("JOIN");
      }
    });

    it("should reject INTO OUTFILE queries", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results INTO OUTFILE '/tmp/data' LIMIT 10"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("INTO");
      }
    });

    it("should reject INTO DUMPFILE queries", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results INTO DUMPFILE '/tmp/data' LIMIT 10"
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain("INTO");
      }
    });

    it("should accept query with comment without semicolon", () => {
      const result = validateQuery(
        "SELECT * FROM osprey_execution_results LIMIT 10 -- this is a comment"
      );
      expect(result.valid).toBe(true);
    });
  });
});
