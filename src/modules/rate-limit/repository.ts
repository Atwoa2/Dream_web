import { sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

/**
 * Atomic counter increment: a single INSERT ... ON CONFLICT statement, so
 * races between concurrent requests are impossible.
 *
 * The window comparison happens entirely in SQL (now() minus an interval) —
 * passing JS Dates into raw sql fragments serializes them in a format
 * Postgres rejects, and it would also trust the app server's clock over the
 * database's.
 */
export async function increment(
  key: string,
  windowSeconds: number,
): Promise<number> {
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStartedAt: new Date(), count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStartedAt} < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${rateLimits.windowStartedAt} < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE ${rateLimits.windowStartedAt} END`,
      },
    })
    .returning({ count: rateLimits.count });

  return row?.count ?? 1;
}
