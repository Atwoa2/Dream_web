/**
 * Аудит чувствительных действий.
 *
 * Нужен, чтобы после инцидента можно было ответить на вопрос «кто и когда».
 * Пишем сюда: вход, выход, выпуск и отзыв API-ключа, смену email,
 * изменения подписки.
 */
import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** null допустим: неудачная попытка входа не привязана к пользователю. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_user_created_idx").on(t.userId, t.createdAt)],
);
