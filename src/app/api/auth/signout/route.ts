import { NextResponse } from "next/server";
import { signOut } from "@/modules/auth";
import { errorResponse, getClientIp } from "@/lib/http";
import { clearSessionCookie, getSessionToken } from "@/lib/session-cookie";

export async function POST(request: Request) {
  try {
    const token = await getSessionToken();
    if (token) {
      await signOut(token, {
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      });
    }
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
