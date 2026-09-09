/**
 * Store access for the auth module: one-time codes, sessions, provider
 * accounts.
 *
 * Firestore layout — natural keys as document IDs do the uniqueness work:
 *   email_otp/{email}                     — one live code per address
 *   sessions/{tokenHash}                  — token hash IS the id
 *   accounts/{provider__providerAccountId}
 */
import { store } from "@/lib/firebase-store";
import { findById } from "@/modules/users/repository";
import type { User } from "@/modules/users";

const OTP = "email_otp";
const SESSIONS = "sessions";
const ACCOUNTS = "accounts";

// --- one-time codes ---------------------------------------------------------

/** A new code replaces any previous one for the address — same doc id. */
export async function replaceOtp(
  email: string,
  codeHash: string,
  expiresAt: Date,
): Promise<void> {
  await store.set(OTP, email, {
    codeHash,
    expiresAt,
    attempts: 0,
    consumedAt: null,
    createdAt: new Date(),
  });
}

export type OtpRow = {
  id: string;
  codeHash: string;
  attempts: number;
};

type OtpDoc = {
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
};

export async function findActiveOtp(email: string): Promise<OtpRow | null> {
  const doc = await store.get<OtpDoc>(OTP, email);
  if (!doc) return null;
  if (doc.consumedAt !== null) return null;
  if (doc.expiresAt.getTime() <= Date.now()) return null;
  return { id: doc.id, codeHash: doc.codeHash, attempts: doc.attempts };
}

/** Returns the new attempt count. Counted under a transaction — never free. */
export async function incrementOtpAttempts(id: string): Promise<number> {
  return store.transaction(async (tx, db) => {
    const ref = db.collection(OTP).doc(id);
    const doc = await tx.get(ref);
    if (!doc.exists) return Number.MAX_SAFE_INTEGER;
    const attempts = ((doc.data() as { attempts?: number }).attempts ?? 0) + 1;
    tx.update(ref, { attempts });
    return attempts;
  });
}

export async function consumeOtp(id: string): Promise<void> {
  await store.update(OTP, id, { consumedAt: new Date() });
}

// --- sessions ---------------------------------------------------------------

type SessionDoc = {
  userId: string;
  expiresAt: Date;
};

export async function createSession(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await store.set(SESSIONS, tokenHash, {
    userId,
    expiresAt,
    createdAt: new Date(),
  });
}

/** Session lookup then user lookup; expired sessions never match. */
export async function findUserByTokenHash(tokenHash: string): Promise<User | null> {
  const session = await store.get<SessionDoc>(SESSIONS, tokenHash);
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  return findById(session.userId);
}

export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await store.remove(SESSIONS, tokenHash);
}

/** Housekeeping: purge expired sessions. Safe to call from any cron. */
export async function deleteExpiredSessions(): Promise<void> {
  const expired = await store.query<SessionDoc>(
    SESSIONS,
    [["expiresAt", "<", new Date()]],
    { limit: 500 },
  );
  await Promise.all(expired.map((s) => store.remove(SESSIONS, s.id)));
}

// --- provider accounts ------------------------------------------------------

const accountId = (provider: string, providerAccountId: string) =>
  `${provider}__${providerAccountId}`;

export async function findAccountUserId(
  provider: string,
  providerAccountId: string,
): Promise<string | null> {
  const doc = await store.get<{ userId: string }>(
    ACCOUNTS,
    accountId(provider, providerAccountId),
  );
  return doc?.userId ?? null;
}

export async function createAccount(
  userId: string,
  provider: string,
  providerAccountId: string,
): Promise<void> {
  await store.set(ACCOUNTS, accountId(provider, providerAccountId), {
    userId,
    provider,
    providerAccountId,
    createdAt: new Date(),
  });
}
