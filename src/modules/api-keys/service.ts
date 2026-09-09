/**
 * API key business rules.
 *
 * The raw key exists in exactly two places, briefly: this process's memory at
 * creation, and the response that shows it to the user once. The database
 * only ever sees the SHA-256 hash.
 */
import { API_KEYS } from "@/config/constants";
import { generateToken, sha256 } from "@/lib/crypto";
import { notFound, validation } from "@/lib/errors";
import { recordAudit } from "@/modules/audit";
import * as repo from "./repository";
import type { ApiKeyInfo, CreatedApiKey, UsageEventInfo, UsageSummary } from "./types";

export async function createKey(userId: string, rawName: string): Promise<CreatedApiKey> {
  const name = rawName.trim();
  if (!name || name.length > 64) {
    throw validation("Key name must be 1–64 characters");
  }

  const key = `${API_KEYS.PREFIX_LIVE}${generateToken(API_KEYS.ENTROPY_BYTES)}`;
  const created = await repo.insertKey({
    userId,
    keyHash: sha256(key),
    keyPrefix: key.slice(0, API_KEYS.VISIBLE_PREFIX_LENGTH),
    name,
  });

  await recordAudit("api_key.created", { userId });
  return { id: created.id, key };
}

export async function listKeys(userId: string): Promise<ApiKeyInfo[]> {
  return repo.listKeysForUser(userId);
}

export async function revokeKey(userId: string, keyId: string): Promise<void> {
  const revoked = await repo.revokeKeyOwnedBy(userId, keyId);
  if (!revoked) throw notFound("API key not found");
  await recordAudit("api_key.revoked", { userId });
}

/**
 * For the API gateway (stage 4): resolves a presented key to its owner.
 * Returns null instead of throwing — the gateway turns that into a 401.
 */
export async function authenticateKey(
  rawKey: string,
): Promise<{ userId: string; keyId: string } | null> {
  if (!rawKey.startsWith(API_KEYS.PREFIX_LIVE) && !rawKey.startsWith(API_KEYS.PREFIX_TEST)) {
    return null;
  }
  const found = await repo.findActiveKeyByHash(sha256(rawKey));
  if (!found) return null;
  await repo.touchKey(found.id);
  return { userId: found.userId, keyId: found.id };
}

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  return repo.summarizeUsageForUser(userId);
}

export async function listRecentUsage(userId: string): Promise<UsageEventInfo[]> {
  return repo.listRecentUsageForUser(userId);
}
