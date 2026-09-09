/** Public interface of the rate-limit module. */
import { rateLimited } from "@/lib/errors";
import * as repo from "./repository";

/**
 * Checks the limit and throws AppError(RATE_LIMITED) when it is exceeded.
 *
 *   await enforceLimit(`otp:email:${email}`, 3, 15 * 60);
 */
export async function enforceLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const count = await repo.increment(key, windowSeconds);
  if (count > limit) throw rateLimited();
}
