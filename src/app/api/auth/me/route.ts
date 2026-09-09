import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/modules/auth";
import { unauthorized } from "@/lib/errors";
import { errorResponse } from "@/lib/http";
import { getSessionToken } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = await getSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) throw unauthorized();

    // Only the fields the UI needs — never the whole DB row.
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
