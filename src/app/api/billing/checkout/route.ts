import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/modules/billing";
import { getCurrentUser } from "@/lib/auth-server";
import { unauthorized, validation } from "@/lib/errors";
import { errorResponse } from "@/lib/http";

const Body = z.object({ product: z.enum(["subscription", "credits"]) });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw unauthorized();

    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw validation("Unknown product");

    const { url } = await createCheckoutSession(user.id, parsed.data.product);
    return NextResponse.json({ url });
  } catch (error) {
    return errorResponse(error);
  }
}
