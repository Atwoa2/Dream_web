/**
 * DB access for the auth module: one-time codes, sessions, provider accounts,
 * audit records.
 */
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, emailOtp, sessions, users } from "@/db/schema";
import type { User } from "@/modules/users";

// --- one-time codes ---------------------------------------------------------

/** A new code invalidates all previous ones for the address. */
export async function replaceOtp(
  email: string,
  codeHash: string,
  expiresAt: Date,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(emailOtp).where(eq(emailOtp.email, email));
    await tx.insert(emailOtp).values({ email, codeHash, expiresAt });
  });
}

export type OtpRow = {
  id: string;
  codeHash: string;
  attempts: number;
};

export async function findActiveOtp(email: string): Promise<OtpRow | null> {
  const [row] = await db
    .select({
      id: emailOtp.id,
      codeHash: emailOtp.codeHash,
      attempts: emailOtp.attempts,
    })
    .from(emailOtp)
    .where(
      and(
        eq(emailOtp.email, email),
        isNull(emailOtp.consumedAt),
        gt(emailOtp.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Returns the new attempt count. */
export async function incrementOtpAttempts(id: string): Promise<number> {
  const [row] = await db
    .update(emailOtp)
    .set({ attempts: sql`${emailOtp.attempts} + 1` })
    .where(eq(emailOtp.id, id))
    .returning({ attempts: emailOtp.attempts });
  return row?.attempts ?? Number.MAX_SAFE_INTEGER;
}

export async function consumeOtp(id: string): Promise<void> {
  await db.update(emailOtp).set({ consumedAt: new Date() }).where(eq(emailOtp.id, id));
}

// --- sessions ---------------------------------------------------------------

export async function createSession(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await db.insert(sessions).values({ userId, tokenHash, expiresAt });
}

/** Session lookup joined with the user; expired sessions never match. */
export async function findUserByTokenHash(tokenHash: string): Promise<User | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      emailVerifiedAt: users.emailVerifiedAt,
      stripeCustomerId: users.stripeCustomerId,
      cardBrand: users.cardBrand,
      cardLast4: users.cardLast4,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

/** Housekeeping: purge expired sessions. Safe to call from any cron. */
export async function deleteExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

// --- provider accounts ------------------------------------------------------

export async function findAccountUserId(
  provider: string,
  providerAccountId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(
      and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)),
    )
    .limit(1);
  return row?.userId ?? null;
}

export async function createAccount(
  userId: string,
  provider: string,
  providerAccountId: string,
): Promise<void> {
  await db.insert(accounts).values({ userId, provider, providerAccountId });
}

