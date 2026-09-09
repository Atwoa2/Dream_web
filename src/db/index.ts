import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * PostgreSQL connection.
 *
 * In development Next.js reloads modules on every file change; without
 * caching on globalThis this spawns dozens of connections until the database
 * hits its limit. In production one pool per instance is created.
 */
const globalForDb = globalThis as unknown as {
  connection: ReturnType<typeof postgres> | undefined;
};

const connection =
  globalForDb.connection ?? postgres(env.DATABASE_URL, { max: 10 });

if (env.APP_ENV !== "production") globalForDb.connection = connection;

export const db = drizzle(connection, { schema });
export { schema };
