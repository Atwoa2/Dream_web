/**
 * DB access for API keys and usage events.
 */
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, usageEvents } from "@/db/schema";
import type { ApiKeyInfo, UsageEventInfo, UsageSummary } from "./types";

const keyInfoColumns = {
  id: apiKeys.id,
  name: apiKeys.name,
  keyPrefix: apiKeys.keyPrefix,
  lastUsedAt: apiKeys.lastUsedAt,
  revokedAt: apiKeys.revokedAt,
  createdAt: apiKeys.createdAt,
};

export async function insertKey(input: {
  userId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
}): Promise<ApiKeyInfo> {
  const [row] = await db.insert(apiKeys).values(input).returning(keyInfoColumns);
  if (!row) throw new Error("Failed to create API key");
  return row;
}

export async function listKeysForUser(userId: string): Promise<ApiKeyInfo[]> {
  return db
    .select(keyInfoColumns)
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

/**
 * Revokes only when the key belongs to the user — the ownership check and the
 * write are one statement, so there is no window to exploit between them.
 */
export async function revokeKeyOwnedBy(userId: string, keyId: string): Promise<boolean> {
  const rows = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id });
  return rows.length > 0;
}

/** For the API gateway: hash lookup of a live key. */
export async function findActiveKeyByHash(
  keyHash: string,
): Promise<{ id: string; userId: string } | null> {
  const [row] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1);
  return row ?? null;
}

export async function touchKey(keyId: string): Promise<void> {
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyId));
}

// --- usage ------------------------------------------------------------------

export async function summarizeUsageForUser(userId: string): Promise<UsageSummary> {
  const [row] = await db
    .select({
      requests: sql<number>`count(*)::int`,
      tokensIn: sql<number>`coalesce(sum(${usageEvents.tokensIn}), 0)::int`,
      tokensOut: sql<number>`coalesce(sum(${usageEvents.tokensOut}), 0)::int`,
      costCents: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int`,
    })
    .from(usageEvents)
    .where(eq(usageEvents.userId, userId));
  return row ?? { requests: 0, tokensIn: 0, tokensOut: 0, costCents: 0 };
}

export async function listRecentUsageForUser(
  userId: string,
  limit = 50,
): Promise<UsageEventInfo[]> {
  return db
    .select({
      id: usageEvents.id,
      model: usageEvents.model,
      tokensIn: usageEvents.tokensIn,
      tokensOut: usageEvents.tokensOut,
      costCents: usageEvents.costCents,
      createdAt: usageEvents.createdAt,
    })
    .from(usageEvents)
    .where(eq(usageEvents.userId, userId))
    .orderBy(desc(usageEvents.createdAt))
    .limit(limit);
}
