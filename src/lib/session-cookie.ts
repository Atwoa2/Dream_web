/**
 * Session cookie handling. Lives in lib/ (the HTTP boundary), not in the auth
 * module — modules know nothing about cookies.
 *
 * httpOnly  — JavaScript cannot read it, XSS cannot steal the session.
 * secure    — HTTPS only (off in local development).
 * sameSite  — Lax: sent on top-level navigation, blocked on cross-site POST.
 */
import { cookies } from "next/headers";
import { env } from "./env";

export const SESSION_COOKIE = "dl_session";
export const OAUTH_STATE_COOKIE = "dl_oauth_state";

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: env.APP_ENV !== "development",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export function stateCookieOptions() {
  return {
    httpOnly: true,
    secure: env.APP_ENV !== "development",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600, // 10 minutes — the OAuth round trip does not take longer
  };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
}

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
