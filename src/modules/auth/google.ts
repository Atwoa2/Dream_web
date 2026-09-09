/**
 * Google OAuth 2.0, authorization code flow — hand-rolled on fetch.
 *
 * Why not a library: the flow is three HTTPS requests, and owning it means no
 * dependency dictates our session or table format. The profile is taken from
 * Google's userinfo endpoint over TLS, so no local JWT verification is needed.
 */
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";
import type { GoogleProfile } from "./types";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

function requireConfig(): { clientId: string; clientSecret: string } {
  if (!env.AUTH_GOOGLE_ID || !env.AUTH_GOOGLE_SECRET) {
    throw new AppError("INTERNAL", "Google sign-in is not configured");
  }
  return { clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET };
}

export function redirectUri(): string {
  return `${env.APP_URL}/api/auth/google/callback`;
}

/** The `state` parameter is our CSRF token; the callback must echo it. */
export function buildAuthorizationUrl(state: string): string {
  const { clientId } = requireConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${AUTHORIZE_URL}?${params}`;
}

/** Exchanges the authorization code and fetches the user's profile. */
export async function fetchGoogleProfile(code: string): Promise<GoogleProfile> {
  const { clientId, clientSecret } = requireConfig();

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    logger.warn("google token exchange failed", { status: tokenResponse.status });
    throw new AppError("UNAUTHORIZED", "Google sign-in failed");
  }

  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new AppError("UNAUTHORIZED", "Google sign-in failed");
  }

  const profileResponse = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileResponse.ok) {
    logger.warn("google userinfo failed", { status: profileResponse.status });
    throw new AppError("UNAUTHORIZED", "Google sign-in failed");
  }

  const info = (await profileResponse.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!info.sub || !info.email) {
    throw new AppError("UNAUTHORIZED", "Google returned an incomplete profile");
  }

  return {
    sub: info.sub,
    email: info.email,
    emailVerified: info.email_verified === true,
    name: info.name ?? null,
    avatarUrl: info.picture ?? null,
  };
}
