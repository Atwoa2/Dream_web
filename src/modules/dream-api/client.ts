/**
 * Server-side client for the Dream Labs robot backend (/v1/*).
 *
 * The legacy SPA shipped the gate token inside its public JS bundle, which
 * means anyone could read it and call the backend directly. Here the token
 * lives in server env vars only and never reaches the browser — pages proxy
 * through this module after our own session check.
 */
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export function isConfigured(): boolean {
  return Boolean(env.DREAM_API_URL && env.DREAM_API_TOKEN);
}

export async function apiGet<T>(path: string): Promise<T | null> {
  if (!env.DREAM_API_URL || !env.DREAM_API_TOKEN) return null;

  try {
    const response = await fetch(`${env.DREAM_API_URL}${path}`, {
      headers: { "X-Gate-Token": env.DREAM_API_TOKEN },
      // Robot state changes constantly; never serve a cached copy.
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      logger.warn("dream-api request failed", { path, status: response.status });
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    logger.warn("dream-api unreachable", {
      path,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
