import { NextResponse } from "next/server";
import { createBillingPortalSession } from "@/modules/billing";
import { getCurrentUser } from "@/lib/auth-server";
import { unauthorized } from "@/lib/errors";
import { errorResponse } from "@/lib/http";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) throw unauthorized();

    const { url } = await createBillingPortalSession(user.id);
    return NextResponse.json({ url });
  } catch (error) {
    return errorResponse(error);
  }
}
