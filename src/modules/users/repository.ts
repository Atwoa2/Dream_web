/**
 * Access to user data. The only place in the module that talks to the store.
 *
 * Firestore layout:
 *   users/{autoId}            — the user document
 *   email_index/{email}       — email → userId, enforces "one email — one
 *                               account" (Firestore has no unique indexes,
 *                               so uniqueness is a doc-ID claim under a
 *                               transaction)
 */
import { store } from "@/lib/firebase-store";
import type { CreateUserInput, User } from "./types";

const USERS = "users";
const EMAIL_INDEX = "email_index";

/** Emails always compare lowercased: Petya@ and petya@ are the same person. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

type UserDoc = {
  email: string;
  emailVerifiedAt: Date | null;
  name: string | null;
  avatarUrl: string | null;
  stripeCustomerId: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toUser(doc: (UserDoc & { id: string }) | null): User | null {
  if (!doc) return null;
  return {
    id: doc.id,
    email: doc.email,
    name: doc.name ?? null,
    avatarUrl: doc.avatarUrl ?? null,
    emailVerifiedAt: doc.emailVerifiedAt ?? null,
    stripeCustomerId: doc.stripeCustomerId ?? null,
    cardBrand: doc.cardBrand ?? null,
    cardLast4: doc.cardLast4 ?? null,
    createdAt: doc.createdAt,
  };
}

export async function findById(id: string): Promise<User | null> {
  return toUser(await store.get<UserDoc>(USERS, id));
}

export async function findByEmail(email: string): Promise<User | null> {
  const index = await store.get<{ userId: string }>(EMAIL_INDEX, normalizeEmail(email));
  if (!index) return null;
  return findById(index.userId);
}

export async function findByStripeCustomerId(customerId: string): Promise<User | null> {
  const rows = await store.query<UserDoc>(
    USERS,
    [["stripeCustomerId", "==", customerId]],
    { limit: 1 },
  );
  return toUser(rows[0] ?? null);
}

/**
 * Race-safe create: claiming email_index/{email} inside a transaction is the
 * uniqueness check. If someone claimed it between our lookup and this call,
 * the existing account is returned instead of creating a duplicate.
 */
export async function create(input: CreateUserInput): Promise<User> {
  const email = normalizeEmail(input.email);
  const now = new Date();

  const userId = await store.transaction(async (tx, db) => {
    const indexRef = db.collection(EMAIL_INDEX).doc(email);
    const existing = await tx.get(indexRef);
    if (existing.exists) {
      return (existing.data() as { userId: string }).userId;
    }

    const userRef = db.collection(USERS).doc();
    tx.create(userRef, {
      email,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      emailVerifiedAt: input.emailVerifiedAt ?? null,
      stripeCustomerId: null,
      cardBrand: null,
      cardLast4: null,
      createdAt: now,
      updatedAt: now,
    });
    tx.create(indexRef, { userId: userRef.id });
    return userRef.id;
  });

  const user = await findById(userId);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  await store.update(USERS, userId, { stripeCustomerId, updatedAt: new Date() });
}

export async function setName(userId: string, name: string | null): Promise<void> {
  await store.update(USERS, userId, { name, updatedAt: new Date() });
}

/** Display data only — never full card numbers (we never see those at all). */
export async function setCardDisplay(
  userId: string,
  brand: string | null,
  last4: string | null,
): Promise<void> {
  await store.update(USERS, userId, {
    cardBrand: brand,
    cardLast4: last4,
    updatedAt: new Date(),
  });
}
