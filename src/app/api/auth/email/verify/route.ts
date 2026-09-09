import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailCode } from "@/modules/auth";
import { validation } from "@/lib/errors";
import { errorResponse, getClientIp } from "@/lib/http";
import { setSessionCookie } from "@/lib/session-cookie";

const Body = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, "The code is 6 digits"),
});

export async function POST(request: Request) {
  try {
    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw validation("Email and a 6-digit code are required");

    const session = await verifyEmailCode(parsed.data.email, parsed.data.code, {
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    await setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
