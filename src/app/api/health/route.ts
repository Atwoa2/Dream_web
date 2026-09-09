import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { logger } from "@/lib/logger";

/**
 * Liveness check: does the app respond and is the database reachable.
 * Used by monitoring and during deploys.
 *
 * Only "ok / degraded" leaves the server — a DB error message contains host
 * and user names and must not appear on a public endpoint.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok", database: "up" });
  } catch (error) {
    logger.error("healthcheck: database unreachable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ status: "degraded", database: "down" }, { status: 503 });
  }
}
