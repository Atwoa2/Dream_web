/**
 * FirebaseStore — the single class through which the application adds,
 * reads, updates and removes data in Firestore.
 *
 * Module repositories use this class instead of touching the SDK directly,
 * so Firestore idioms (Timestamps, FieldValue, transactions) stay in one
 * file. Guarantees the app relies on and how this class provides them:
 *
 * - UNIQUENESS: natural keys become document IDs (a session's token hash,
 *   a Stripe event id, a payment id). `create()` refuses to overwrite an
 *   existing doc — that is the idempotency primitive.
 * - MONEY: `increment()` uses FieldValue.increment — atomic on the server,
 *   no read-modify-write race.
 * - COUNTERS WITH RULES (rate limiting, attempt counts): `transaction()`.
 *
 * Dates: JS Date in, JS Date out. Firestore stores Timestamps internally;
 * every read converts them back so the rest of the code never sees them.
 */
import {
  AggregateField,
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
  type Transaction,
} from "firebase-admin/firestore";
import { firestore } from "./firebase";

export type Row = Record<string, unknown>;
export type Where = [field: string, op: FirebaseFirestore.WhereFilterOp, value: unknown];

/** Recursively convert Firestore Timestamps back into JS Dates. */
function fromFirestore<T>(data: Row): T {
  const out: Row = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) out[key] = value.toDate();
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = fromFirestore(value as Row);
    } else out[key] = value;
  }
  return out as T;
}

function snap<T>(doc: DocumentSnapshot): (T & { id: string }) | null {
  const data = doc.data();
  if (!data) return null;
  return { ...fromFirestore<T>(data), id: doc.id };
}

export class FirebaseStore {
  private get db() {
    return firestore();
  }

  /** Read one document. Returns null when it does not exist. */
  async get<T>(collection: string, id: string): Promise<(T & { id: string }) | null> {
    const doc = await this.db.collection(collection).doc(id).get();
    return snap<T>(doc);
  }

  /**
   * Create a document with a chosen id, refusing to overwrite.
   * Returns false when the id already exists — the idempotency primitive
   * (duplicate Stripe events, duplicate payments).
   */
  async create(collection: string, id: string, data: Row): Promise<boolean> {
    try {
      await this.db.collection(collection).doc(id).create(data);
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === 6 /* ALREADY_EXISTS */) return false;
      throw error;
    }
  }

  /** Add a document with an auto-generated id. Returns the id. */
  async add(collection: string, data: Row): Promise<string> {
    const ref = await this.db.collection(collection).add(data);
    return ref.id;
  }

  /** Write a document, creating or fully replacing it. */
  async set(collection: string, id: string, data: Row): Promise<void> {
    await this.db.collection(collection).doc(id).set(data);
  }

  /** Merge fields into a document, creating it when missing. */
  async merge(collection: string, id: string, data: Row): Promise<void> {
    await this.db.collection(collection).doc(id).set(data, { merge: true });
  }

  /** Update an existing document. Missing document is a silent no-op. */
  async update(collection: string, id: string, data: Row): Promise<void> {
    try {
      await this.db.collection(collection).doc(id).update(data);
    } catch (error) {
      if ((error as { code?: number }).code === 5 /* NOT_FOUND */) return;
      throw error;
    }
  }

  /** Remove a document. Removing a missing document is fine. */
  async remove(collection: string, id: string): Promise<void> {
    await this.db.collection(collection).doc(id).delete();
  }

  /**
   * Query a collection with equality/range filters.
   * Sorting happens in memory to avoid Firestore composite-index management;
   * cap result sets with `limit` where collections can grow.
   */
  async query<T>(
    collection: string,
    where: Where[],
    opts: { limit?: number } = {},
  ): Promise<(T & { id: string })[]> {
    let q: FirebaseFirestore.Query = this.db.collection(collection);
    for (const [field, op, value] of where) q = q.where(field, op, value);
    if (opts.limit) q = q.limit(opts.limit);
    const result = await q.get();
    return result.docs
      .map((d) => snap<T>(d))
      .filter((d): d is T & { id: string } => d !== null);
  }

  /** Atomically add `delta` to a numeric field, creating the doc if needed. */
  async increment(
    collection: string,
    id: string,
    field: string,
    delta: number,
    extra: Row = {},
  ): Promise<void> {
    await this.db
      .collection(collection)
      .doc(id)
      .set({ [field]: FieldValue.increment(delta), ...extra }, { merge: true });
  }

  /**
   * Read-check-write under a transaction, for counters with rules
   * (rate-limit windows, OTP attempt counts).
   */
  async transaction<T>(
    fn: (tx: Transaction, db: FirebaseFirestore.Firestore) => Promise<T>,
  ): Promise<T> {
    return this.db.runTransaction((tx) => fn(tx, this.db));
  }

  /** Server-side aggregates: count plus sums of the given numeric fields. */
  async aggregate(
    collection: string,
    where: Where[],
    sums: string[],
  ): Promise<{ count: number; sums: Record<string, number> }> {
    let q: FirebaseFirestore.Query = this.db.collection(collection);
    for (const [field, op, value] of where) q = q.where(field, op, value);

    const spec: Record<string, FirebaseFirestore.AggregateField<number>> = {
      count: AggregateField.count(),
    };
    for (const field of sums) {
      spec[`sum_${field}`] = AggregateField.sum(field);
    }

    const result = await q.aggregate(spec).get();
    const data = result.data() as Record<string, number>;
    const out: Record<string, number> = {};
    for (const field of sums) out[field] = data[`sum_${field}`] ?? 0;
    return { count: data.count ?? 0, sums: out };
  }

  /** Convert Timestamps in a raw doc — exposed for transaction callbacks. */
  fromDoc<T>(doc: DocumentSnapshot): (T & { id: string }) | null {
    return snap<T>(doc);
  }
}

/** The application-wide store instance. */
export const store = new FirebaseStore();
