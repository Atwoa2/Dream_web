import { NextResponse } from "next/server";
import { z } from "zod";
import { createKey, listKeys } from "@/modules/api-keys";
import { getCurrentUser } from "@/lib/auth-server";
import { unauthorized, validation } from "@/lib/errors";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw unauthorized();
    return NextResponse.json({ keys: await listKeys(user.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

const Body = z.object({ name: z.string().min(1).max(64) });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw unauthorized();

    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw validation("Key name must be 1–64 characters");

    // The raw key appears in this response and never again.
    const created = await createKey(user.id, parsed.data.name);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
