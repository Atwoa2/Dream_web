/**
 * Типизированные ошибки приложения.
 *
 * Правило: наружу пользователю уходит только `message` и `code`. Никаких
 * стек-трейсов, SQL-запросов и внутренних деталей — это подсказки для атакующего.
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

export const unauthorized = (m = "Требуется вход") => new AppError("UNAUTHORIZED", m);
export const forbidden = (m = "Нет доступа") => new AppError("FORBIDDEN", m);
export const notFound = (m = "Не найдено") => new AppError("NOT_FOUND", m);
export const validation = (m: string) => new AppError("VALIDATION", m);
export const rateLimited = (m = "Слишком много запросов") => new AppError("RATE_LIMITED", m);
