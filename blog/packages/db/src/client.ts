import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString, max: 5 });

export const db = drizzle(pool, { schema });
export * from "./schema";
