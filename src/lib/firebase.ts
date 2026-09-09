/**
 * Firebase Admin SDK initialization — server-side only.
 *
 * Credentials come from FIREBASE_SERVICE_ACCOUNT: the service-account JSON,
 * base64-encoded so it survives env-var storage (Vercel, .env.local). The
 * browser API key is NOT used anywhere: all reads and writes go through this
 * server, after our own session checks, with Firestore locked to the Admin
 * SDK. Security rules can stay "deny all" for clients.
 */
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { env } from "./env";

function loadApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  if (!env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set. Base64-encode the service-account " +
        "JSON (Firebase Console → Project settings → Service accounts → " +
        "Generate new private key) and put it in the environment.",
    );
  }

  const json = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf8");
  const serviceAccount = JSON.parse(json) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });
}

/**
 * The Firestore handle, cached on globalThis: Next.js dev reloads modules on
 * every change, and without caching each reload would spawn another app.
 */
const globalForFirebase = globalThis as unknown as { firestore?: Firestore };

export function firestore(): Firestore {
  if (!globalForFirebase.firestore) {
    const db = getFirestore(loadApp());
    db.settings({ ignoreUndefinedProperties: true });
    globalForFirebase.firestore = db;
  }
  return globalForFirebase.firestore;
}
