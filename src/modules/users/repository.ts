/**
 * Доступ к таблице users. Единственное место в модуле, где есть запросы к БД.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { CreateUserInput, User } from "./types";

/** Email всегда сравниваем в нижнем регистре: Petya@ и petya@ — один человек. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function findById(id: string): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function findByEmail(email: string): Promise<User | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return row ?? null;
}

export async function create(input: CreateUserInput): Promise<User> {
  const [row] = await db
    .insert(users)
    .values({
      email: normalizeEmail(input.email),
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      emailVerifiedAt: input.emailVerifiedAt ?? null,
    })
    .returning();

  if (!row) throw new Error("Не удалось создать пользователя");
  return row;
}

export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  await db
    .update(users)
    .set({ stripeCustomerId, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
