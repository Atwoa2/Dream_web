import { store } from "@/lib/firebase-store";

const AUDIT_LOG = "audit_log";

export async function insert(
  action: string,
  meta: { userId?: string | null; ip?: string | null; userAgent?: string | null },
): Promise<void> {
  await store.add(AUDIT_LOG, {
    action,
    userId: meta.userId ?? null,
    ip: meta.ip ?? null,
    userAgent: meta.userAgent ?? null,
    createdAt: new Date(),
  });
}
