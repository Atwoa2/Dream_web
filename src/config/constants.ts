/**
 * Числовые константы приложения в одном месте.
 *
 * Смысл: «почему код живёт 10 минут» — вопрос, на который должен быть один
 * ответ в одном файле, а не пять разных магических чисел по коду.
 */

export const AUTH = {
  /** Длина кода из письма. */
  OTP_LENGTH: 6,
  /** Срок жизни кода. */
  OTP_TTL_MINUTES: 10,
  /** Попыток ввода до сгорания кода — защита от перебора. */
  OTP_MAX_ATTEMPTS: 5,
  /** Запросов кода на один email. */
  OTP_REQUESTS_PER_WINDOW: 3,
  OTP_WINDOW_MINUTES: 15,
  /** Срок жизни сессии. */
  SESSION_TTL_DAYS: 30,
} as const;

export const API_KEYS = {
  PREFIX_LIVE: "dl_live_",
  PREFIX_TEST: "dl_test_",
  /** Байт энтропии в ключе. */
  ENTROPY_BYTES: 32,
  /** Сколько символов ключа показываем в списке. */
  VISIBLE_PREFIX_LENGTH: 12,
} as const;

export const BILLING = {
  DEFAULT_CURRENCY: "usd",
  /** Статусы, при которых доступ к продукту открыт. */
  ACTIVE_STATUSES: ["active", "trialing"] as const,
  /**
   * Сколько дней сохраняем доступ при неудачном списании.
   * Stripe в это время делает повторные попытки (Smart Retries) — отключать
   * клиента сразу означает терять тех, у кого просто перевыпущена карта.
   */
  PAST_DUE_GRACE_DAYS: 7,
} as const;
