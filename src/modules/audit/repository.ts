import { db } from "@/db";
import { auditLog } from "@/db/schema";

export async function insert(
  action: string,
  meta: { userId?: string | null; ip?: string | null; userAgent?: string | null },
): Promise<void> {
  await db.insert(auditLog).values({
    action,
    userId: meta.userId ?? null,
    ip: meta.ip ?? null,
    userAgent: meta.userAgent ?? null,
  });
}
