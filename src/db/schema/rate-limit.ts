/**
 * Rate limiting counters (fixed window).
 *
 * Stored in PostgreSQL rather than Redis: at sign-in and code-request volumes
 * the database is more than enough, and the team gets one less service to
 * operate. If it ever becomes a bottleneck, the rate-limit module swaps to
 * Upstash without touching calling code.
 */
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const rateLimits = pgTable("rate_limits", {
  /** E.g. "otp:email:user@example.com" or "otp:ip:1.2.3.4". */
  key: text("key").primaryKey(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});
