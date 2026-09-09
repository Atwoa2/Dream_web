/**
 * Store access for API keys and usage events.
 *
 * Firestore layout:
 *   api_keys/{autoId}       — keyHash field is queried on gateway auth
 *   usage_events/{autoId}   — aggregated server-side for the Usage page
 */
import { store } from "@/lib/firebase-store";
import type { ApiKeyInfo, UsageEventInfo, UsageSummary } from "./types";

const API_KEYS = "api_keys";
const USAGE_EVENTS = "usage_events";

type ApiKeyDoc = {
  userId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

function toInfo(doc: ApiKeyDoc & { id: string }): ApiKeyInfo {
  return {
    id: doc.id,
    name: doc.name,
    keyPrefix: doc.keyPrefix,
    lastUsedAt: doc.lastUsedAt ?? null,
    revokedAt: doc.revokedAt ?? null,
    createdAt: doc.createdAt,
  };
}

export async function insertKey(input: {
  userId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
}): Promise<ApiKeyInfo> {
  const createdAt = new Date();
  const id = await store.add(API_KEYS, {
    ...input,
    lastUsedAt: null,
    revokedAt: null,
    createdAt,
  });
  return {
    id,
    name: input.name,
    keyPrefix: input.keyPrefix,
    lastUsedAt: null,
    revokedAt: null,
    createdAt,
  };
}

export async function listKeysForUser(userId: string): Promise<ApiKeyInfo[]> {
  const rows = await store.query<ApiKeyDoc>(API_KEYS, [["userId", "==", userId]]);
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.map(toInfo);
}

/**
 * Revokes only when the key belongs to the user — the ownership check and
 * the write happen inside one transaction, so there is no window to exploit
 * between them.
 */
export async function revokeKeyOwnedBy(userId: string, keyId: string): Promise<boolean> {
  return store.transaction(async (tx, db) => {
    const ref = db.collection(API_KEYS).doc(keyId);
    const doc = await tx.get(ref);
    if (!doc.exists) return false;
    const data = doc.data() as { userId: string; revokedAt: unknown };
    if (data.userId !== userId || data.revokedAt !== null) return false;
    tx.update(ref, { revokedAt: new Date() });
    return true;
  });
}

/** For the API gateway: hash lookup of a live key. */
export async function findActiveKeyByHash(
  keyHash: string,
): Promise<{ id: string; userId: string } | null> {
  const rows = await store.query<ApiKeyDoc>(API_KEYS, [["keyHash", "==", keyHash]], {
    limit: 1,
  });
  const row = rows[0];
  if (!row || row.revokedAt !== null) return null;
  return { id: row.id, userId: row.userId };
}

export async function touchKey(keyId: string): Promise<void> {
  await store.update(API_KEYS, keyId, { lastUsedAt: new Date() });
}

// --- usage ------------------------------------------------------------------

type UsageDoc = {
  apiKeyId: string;
  userId: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  createdAt: Date;
};

export async function summarizeUsageForUser(userId: string): Promise<UsageSummary> {
  const { count, sums } = await store.aggregate(
    USAGE_EVENTS,
    [["userId", "==", userId]],
    ["tokensIn", "tokensOut", "costCents"],
  );
  return {
    requests: count,
    tokensIn: sums.tokensIn ?? 0,
    tokensOut: sums.tokensOut ?? 0,
    costCents: sums.costCents ?? 0,
  };
}

export async function listRecentUsageForUser(
  userId: string,
  limit = 50,
): Promise<UsageEventInfo[]> {
  const rows = await store.query<UsageDoc>(USAGE_EVENTS, [["userId", "==", userId]], {
    limit: 500,
  });
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.slice(0, limit).map((row) => ({
    id: row.id,
    model: row.model,
    tokensIn: row.tokensIn,
    tokensOut: row.tokensOut,
    costCents: row.costCents,
    createdAt: row.createdAt,
  }));
}
