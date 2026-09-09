import { NextResponse } from "next/server";
import { revokeKey } from "@/modules/api-keys";
import { getCurrentUser } from "@/lib/auth-server";
import { unauthorized } from "@/lib/errors";
import { errorResponse } from "@/lib/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) throw unauthorized();

    // Ownership is enforced inside revokeKey — the id alone grants nothing.
    const { id } = await params;
    await revokeKey(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
