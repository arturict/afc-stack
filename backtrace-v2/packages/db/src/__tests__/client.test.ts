import { describe, it, expect, beforeAll } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

/**
 * Example database test
 * Run with DATABASE_URL set to test database
 */

describe("Database Connection", () => {
    it("should create a db instance", () => {
        const client = new pg.Client({
            connectionString: process.env.DATABASE_URL || "postgres://test:test@localhost:5432/test"
        });
        const db = drizzle(client);
        expect(db).toBeDefined();
    });
});
