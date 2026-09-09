/**
 * Sign-in code delivery via Resend (plain REST, no SDK dependency).
 */
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (env.APP_ENV === "development") {
      // DEV-ONLY exception to the "no codes in logs" rule: without a Resend
      // key there is no other way to sign in locally. Never reached outside
      // development.
      console.log(`[DEV ONLY] sign-in code for ${to}: ${code}`);
      return;
    }
    throw new AppError("INTERNAL", "Email delivery is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to,
      subject: `${code} is your DreamLabs sign-in code`,
      text:
        `Your DreamLabs sign-in code: ${code}\n\n` +
        `It expires in 10 minutes. If you did not request it, ignore this email.`,
    }),
  });

  if (!response.ok) {
    // Log the status, never the code.
    logger.error("failed to send sign-in email", { status: response.status });
    throw new AppError("INTERNAL", "Failed to send the sign-in email");
  }
}
