import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { logger } from "@/lib/logger";

/**
 * Liveness check: does the app respond and is the data store reachable.
 * Used by monitoring and during deploys.
 *
 * Only "ok / degraded" leaves the server — error details can contain
 * project identifiers and must not appear on a public endpoint.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // A read of a known-missing doc is the cheapest authenticated round trip.
    await firestore().collection("health").doc("ping").get();
    return NextResponse.json({ status: "ok", database: "up" });
  } catch (error) {
    logger.error("healthcheck: data store unreachable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ status: "degraded", database: "down" }, { status: 503 });
  }
}
