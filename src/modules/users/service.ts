/**
 * Business rules for working with users.
 */
import { notFound } from "@/lib/errors";
import * as repo from "./repository";
import type { User } from "./types";

export async function getUser(id: string): Promise<User> {
  const user = await repo.findById(id);
  if (!user) throw notFound("User not found");
  return user;
}

/**
 * Finds a user by email or creates a new one.
 *
 * Needed by both sign-in methods: the email code and Google both lead to the
 * same account when the address matches. Duplicate users must not exist.
 */
export async function findOrCreateByEmail(input: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
}): Promise<User> {
  const existing = await repo.findByEmail(input.email);
  if (existing) return existing;

  return repo.create({
    email: input.email,
    name: input.name,
    avatarUrl: input.avatarUrl,
    emailVerifiedAt: input.emailVerified ? new Date() : null,
  });
}

export async function linkStripeCustomer(userId: string, customerId: string): Promise<void> {
  await repo.setStripeCustomerId(userId, customerId);
}
