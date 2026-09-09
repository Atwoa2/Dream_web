/**
 * Fixed-window counters in Firestore: rate_limits/{key}.
 *
 * The read-check-write runs inside a transaction, so concurrent requests
 * cannot race the counter — the same guarantee the SQL upsert used to give.
 */
import { store } from "@/lib/firebase-store";

const RATE_LIMITS = "rate_limits";

/**
 * Atomic counter increment. When the window has expired, the counter
 * restarts at 1. Returns the count within the current window.
 */
export async function increment(
  key: string,
  windowSeconds: number,
): Promise<number> {
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;

  return store.transaction(async (tx, db) => {
    const ref = db.collection(RATE_LIMITS).doc(key);
    const doc = await tx.get(ref);

    if (!doc.exists) {
      tx.set(ref, { windowStartedAt: new Date(now), count: 1 });
      return 1;
    }

    const data = doc.data() as {
      windowStartedAt?: { toMillis(): number };
      count?: number;
    };
    const startedAt = data.windowStartedAt?.toMillis() ?? 0;

    if (startedAt < cutoff) {
      tx.set(ref, { windowStartedAt: new Date(now), count: 1 });
      return 1;
    }

    const count = (data.count ?? 0) + 1;
    tx.update(ref, { count });
    return count;
  });
}
