import { NextResponse } from "next/server";
import { z } from "zod";
import { updateName } from "@/modules/users";
import { getCurrentUser } from "@/lib/auth-server";
import { unauthorized, validation } from "@/lib/errors";
import { errorResponse } from "@/lib/http";

const Body = z.object({ name: z.string().max(80) });

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw unauthorized();

    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw validation("Name must be at most 80 characters");

    const name = parsed.data.name.trim();
    await updateName(user.id, name.length > 0 ? name : null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
