/**
 * Helpers for the HTTP boundary (app/api routes).
 */
import { NextResponse } from "next/server";
import { AppError } from "./errors";
import { logger } from "./logger";

/**
 * Converts any thrown value into a safe JSON response.
 * AppError → its code and message. Anything else → generic 500: internal
 * details are logged, never sent to the client.
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  logger.error("unhandled error", {
    error: error instanceof Error ? error.message : String(error),
  });
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Internal server error" } },
    { status: 500 },
  );
}

/** Client IP for rate limiting and audit. Vercel sets x-forwarded-for. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
