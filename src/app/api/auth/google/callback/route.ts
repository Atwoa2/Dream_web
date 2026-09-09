import { NextResponse, type NextRequest } from "next/server";
import { fetchGoogleProfile, signInWithGoogle } from "@/modules/auth";
import { env } from "@/lib/env";
import { getClientIp } from "@/lib/http";
import { logger } from "@/lib/logger";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session-cookie";

/** On any failure the user lands back on /login with a generic error flag. */
function failureRedirect(): NextResponse {
  const response = NextResponse.redirect(new URL("/login?error=google", env.APP_URL));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  // CSRF check: the state we sent must come back, and match the cookie that
  // only our own browser session can hold.
  if (!code || !state || !stateCookie || state !== stateCookie) {
    return failureRedirect();
  }

  try {
    const profile = await fetchGoogleProfile(code);
    const session = await signInWithGoogle(profile, {
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    const response = NextResponse.redirect(new URL("/api-keys", env.APP_URL));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.set(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions(session.expiresAt),
    );
    return response;
  } catch (error) {
    logger.warn("google callback failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return failureRedirect();
  }
}
