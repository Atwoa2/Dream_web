/**
 * Access to the users table. The only place in the module with DB queries.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { CreateUserInput, User } from "./types";

/** Emails always compare lowercased: Petya@ and petya@ are the same person. */
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

export async function findByStripeCustomerId(customerId: string): Promise<User | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
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

  if (!row) throw new Error("Failed to create user");
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

export async function setName(userId: string, name: string | null): Promise<void> {
  await db
    .update(users)
    .set({ name, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/** Display data only — never full card numbers (we never see those at all). */
export async function setCardDisplay(
  userId: string,
  brand: string | null,
  last4: string | null,
): Promise<void> {
  await db
    .update(users)
    .set({ cardBrand: brand, cardLast4: last4, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
