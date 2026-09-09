/**
 * Every numeric constant of the application in one place.
 *
 * The point: "why does a code live 10 minutes" must have one answer in one
 * file — not five different magic numbers across the codebase.
 */

export const AUTH = {
  /** Digits in the emailed code. */
  OTP_LENGTH: 6,
  /** Code lifetime. */
  OTP_TTL_MINUTES: 10,
  /** Verification attempts before the code burns — brute-force guard. */
  OTP_MAX_ATTEMPTS: 5,
  /** Seconds between two code requests for the same address. */
  OTP_RESEND_COOLDOWN_SECONDS: 60,
  /** Code requests allowed per email per window. */
  OTP_REQUESTS_PER_WINDOW: 3,
  OTP_WINDOW_MINUTES: 15,
  /** Code requests allowed per IP per window (many emails, one attacker). */
  OTP_REQUESTS_PER_IP: 10,
  /** Session lifetime. */
  SESSION_TTL_DAYS: 30,
} as const;

export const API_KEYS = {
  PREFIX_LIVE: "dl_live_",
  PREFIX_TEST: "dl_test_",
  /** Bytes of entropy in a key. */
  ENTROPY_BYTES: 32,
  /** How many leading characters of a key are shown in lists. */
  VISIBLE_PREFIX_LENGTH: 12,
} as const;

export const BILLING = {
  DEFAULT_CURRENCY: "usd",
  /** Statuses that grant product access. */
  ACTIVE_STATUSES: ["active", "trialing"] as const,
  /**
   * Days of access kept after a failed charge.
   * Stripe retries the charge during this window (Smart Retries) — cutting
   * the client off instantly means losing people whose card was merely
   * reissued.
   */
  PAST_DUE_GRACE_DAYS: 7,
} as const;
