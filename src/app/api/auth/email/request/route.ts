import { NextResponse } from "next/server";
import { z } from "zod";
import { requestEmailCode } from "@/modules/auth";
import { validation } from "@/lib/errors";
import { errorResponse, getClientIp } from "@/lib/http";

const Body = z.object({ email: z.string().email().max(254) });

export async function POST(request: Request) {
  try {
    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw validation("A valid email is required");

    await requestEmailCode(parsed.data.email, {
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
