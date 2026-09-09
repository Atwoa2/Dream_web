/**
 * Audit of sensitive actions.
 *
 * Exists so that after an incident the question "who and when" has an answer.
 * Recorded here: sign-in, sign-out, API key issuance and revocation, email
 * changes, subscription changes.
 */
import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** null is allowed: a failed sign-in attempt has no user attached. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_user_created_idx").on(t.userId, t.createdAt)],
);
