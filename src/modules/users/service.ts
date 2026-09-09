/**
 * Бизнес-правила работы с пользователями.
 */
import { notFound } from "@/lib/errors";
import * as repo from "./repository";
import type { User } from "./types";

export async function getUser(id: string): Promise<User> {
  const user = await repo.findById(id);
  if (!user) throw notFound("Пользователь не найден");
  return user;
}

/**
 * Находит пользователя по email или создаёт нового.
 *
 * Нужен для обоих способов входа: и код на почту, и Google приводят к одному
 * аккаунту, если адрес совпадает. Дублей пользователей быть не должно.
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
