import type { Config } from "drizzle-kit";
import { loadEnvFile } from "node:process";

// drizzle-kit does not load .env.local on its own the way Next.js does.
try {
  loadEnvFile(".env.local");
} catch {
  // no .env.local (CI, fresh clone) — DATABASE_URL comes from the environment
}

export default {
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
