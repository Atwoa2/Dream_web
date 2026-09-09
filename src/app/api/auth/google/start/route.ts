import { NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/modules/auth";
import { generateToken } from "@/lib/crypto";
import { errorResponse } from "@/lib/http";
import { OAUTH_STATE_COOKIE, stateCookieOptions } from "@/lib/session-cookie";

export async function GET() {
  try {
    const state = generateToken(16);
    const response = NextResponse.redirect(buildAuthorizationUrl(state));
    response.cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
