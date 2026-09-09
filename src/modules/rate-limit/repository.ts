import { sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

/**
 * Atomic counter increment: a single INSERT ... ON CONFLICT statement, so
 * races between concurrent requests are impossible.
 *
 * When the window has expired, the counter restarts at 1.
 */
export async function increment(
  key: string,
  windowSeconds: number,
): Promise<number> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowSeconds * 1000);

  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStartedAt: now, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStartedAt} < ${cutoff} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${rateLimits.windowStartedAt} < ${cutoff} THEN ${now} ELSE ${rateLimits.windowStartedAt} END`,
      },
    })
    .returning({ count: rateLimits.count });

  return row?.count ?? 1;
}
