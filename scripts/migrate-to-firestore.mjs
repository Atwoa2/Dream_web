/**
 * One-shot migration: PostgreSQL → Firestore.
 *
 * Reads every table from the given Postgres database and writes the
 * corresponding Firestore documents using the same layout the application
 * uses (see module repositories). Safe to re-run: writes are keyed, so a
 * second pass overwrites the same docs instead of duplicating.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." FIREBASE_SERVICE_ACCOUNT="<base64>" \
 *     node scripts/migrate-to-firestore.mjs
 */
import postgres from "postgres";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const { DATABASE_URL, FIREBASE_SERVICE_ACCOUNT } = process.env;
if (!DATABASE_URL || !FIREBASE_SERVICE_ACCOUNT) {
  console.error("Set DATABASE_URL and FIREBASE_SERVICE_ACCOUNT (base64 JSON).");
  process.exit(1);
}

const sa = JSON.parse(Buffer.from(FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf8"));
initializeApp({
  credential: cert({
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    privateKey: sa.private_key,
  }),
});
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const needsSsl = !DATABASE_URL.includes("localhost") && !DATABASE_URL.includes("127.0.0.1");
const sql = postgres(DATABASE_URL, { max: 1, ...(needsSsl ? { ssl: "require" } : {}) });

let written = 0;
async function put(collection, id, data) {
  await db.collection(collection).doc(id).set(data);
  written += 1;
}

// --- users + email index ----------------------------------------------------
const users = await sql`SELECT * FROM users`;
for (const u of users) {
  await put("users", u.id, {
    email: u.email,
    emailVerifiedAt: u.email_verified_at,
    name: u.name,
    avatarUrl: u.avatar_url,
    stripeCustomerId: u.stripe_customer_id,
    cardBrand: u.card_brand,
    cardLast4: u.card_last4,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  });
  await put("email_index", u.email, { userId: u.id });
}
console.log(`users: ${users.length}`);

// --- accounts ----------------------------------------------------------------
const accounts = await sql`SELECT * FROM accounts`;
for (const a of accounts) {
  await put("accounts", `${a.provider}__${a.provider_account_id}`, {
    userId: a.user_id,
    provider: a.provider,
    providerAccountId: a.provider_account_id,
    createdAt: a.created_at,
  });
}
console.log(`accounts: ${accounts.length}`);

// --- sessions (only live ones) ----------------------------------------------
const sessions = await sql`SELECT * FROM sessions WHERE expires_at > now()`;
for (const s of sessions) {
  await put("sessions", s.token_hash, {
    userId: s.user_id,
    expiresAt: s.expires_at,
    createdAt: s.created_at,
  });
}
console.log(`sessions: ${sessions.length}`);

// --- billing -----------------------------------------------------------------
const subscriptions = await sql`SELECT * FROM subscriptions`;
for (const s of subscriptions) {
  await put("subscriptions", s.stripe_subscription_id, {
    userId: s.user_id,
    status: s.status,
    priceId: s.price_id,
    currentPeriodEnd: s.current_period_end,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  });
}
console.log(`subscriptions: ${subscriptions.length}`);

const payments = await sql`SELECT * FROM payments`;
for (const p of payments) {
  await put("payments", p.stripe_payment_intent_id, {
    userId: p.user_id,
    amountCents: p.amount_cents,
    currency: p.currency,
    status: p.status,
    description: p.description,
    invoiceUrl: p.invoice_url,
    createdAt: p.created_at,
  });
}
console.log(`payments: ${payments.length}`);

const credits = await sql`SELECT * FROM credits`;
for (const c of credits) {
  await put("credits", c.user_id, {
    balanceCents: c.balance_cents,
    updatedAt: c.updated_at,
  });
}
console.log(`credits: ${credits.length}`);

const events = await sql`SELECT * FROM processed_events`;
for (const e of events) {
  await put("processed_events", e.stripe_event_id, {
    type: e.type,
    processedAt: e.processed_at,
  });
}
console.log(`processed_events: ${events.length}`);

// --- api keys + usage ---------------------------------------------------------
const keys = await sql`SELECT * FROM api_keys`;
for (const k of keys) {
  await put("api_keys", k.id, {
    userId: k.user_id,
    keyHash: k.key_hash,
    keyPrefix: k.key_prefix,
    name: k.name,
    lastUsedAt: k.last_used_at,
    revokedAt: k.revoked_at,
    createdAt: k.created_at,
  });
}
console.log(`api_keys: ${keys.length}`);

const usage = await sql`SELECT * FROM usage_events`;
for (const u of usage) {
  await put("usage_events", u.id, {
    apiKeyId: u.api_key_id,
    userId: u.user_id,
    model: u.model,
    tokensIn: u.tokens_in,
    tokensOut: u.tokens_out,
    costCents: u.cost_cents,
    createdAt: u.created_at,
  });
}
console.log(`usage_events: ${usage.length}`);

// --- audit --------------------------------------------------------------------
const audit = await sql`SELECT * FROM audit_log`;
for (const a of audit) {
  await put("audit_log", a.id, {
    userId: a.user_id,
    action: a.action,
    ip: a.ip,
    userAgent: a.user_agent,
    createdAt: a.created_at,
  });
}
console.log(`audit_log: ${audit.length}`);

await sql.end();
console.log(`\nDone. ${written} documents written to Firestore.`);
