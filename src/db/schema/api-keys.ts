/**
 * API-ключи пользователей и учёт расхода.
 *
 * Используется этапом 4 (доступ к модели по API). Схема заложена сразу,
 * чтобы потом не переделывать структуру таблиц на живой базе.
 */
import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Ключ выдаётся пользователю ОДИН раз при создании и больше нигде не
 * показывается. В базе — только SHA-256 хэш и префикс для отображения
 * в интерфейсе (`dl_live_a1b2…`). Потерянный ключ не восстанавливается,
 * вместо него выпускается новый.
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(),
    /** Первые символы ключа — чтобы пользователь узнал его в списке. */
    keyPrefix: text("key_prefix").notNull(),
    /** Человекочитаемое имя: «продакшен», «тесты», «ноутбук Пети». */
    name: text("name").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    /** Отзыв вместо удаления — история вызовов должна остаться. */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("api_keys_hash_key").on(t.keyHash),
    index("api_keys_user_idx").on(t.userId),
  ],
);

/** Один вызов API = одна строка. Основа для списания кредитов и статистики. */
export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiKeyId: uuid("api_key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    /** Списанная стоимость в центах. */
    costCents: integer("cost_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("usage_user_created_idx").on(t.userId, t.createdAt)],
);
