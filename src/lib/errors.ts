/**
 * Typed application errors.
 *
 * Rule: only `message` and `code` ever reach the user. No stack traces, SQL
 * queries or internal details — those are hints for an attacker.
 */

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "PAYMENT_REQUIRED"
  | "CONFLICT"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  RATE_LIMITED: 429,
  PAYMENT_REQUIRED: 402,
  CONFLICT: 409,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
  }
}

export const unauthorized = (m = "Sign-in required") => new AppError("UNAUTHORIZED", m);
export const forbidden = (m = "Access denied") => new AppError("FORBIDDEN", m);
export const notFound = (m = "Not found") => new AppError("NOT_FOUND", m);
export const validation = (m: string) => new AppError("VALIDATION", m);
export const rateLimited = (m = "Too many requests") => new AppError("RATE_LIMITED", m);
