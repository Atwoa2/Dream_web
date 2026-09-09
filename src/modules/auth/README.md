# auth — этап 1

Вход в систему. Кода пока нет, здесь зафиксирован контракт, чтобы тот, кто
возьмёт этап 1, не изобретал структуру заново.

## Способы входа

1. **Код на email** — 6 цифр, живёт 10 минут, одноразовый.
2. **Google OAuth** — через Auth.js.

Паролей в системе нет вообще: нечего утекать, не нужны сброс и политики сложности.

## Планируемый интерфейс

```ts
requestEmailCode(email: string, ip: string): Promise<void>
verifyEmailCode(email: string, code: string): Promise<Session>
signInWithGoogle(profile: GoogleProfile): Promise<Session>
getCurrentUser(): Promise<User | null>
signOut(sessionId: string): Promise<void>
```

## Обязательные требования безопасности

- В `email_otp` хранится **хэш** кода, не сам код.
- Код генерируется `crypto.randomInt`, не `Math.random`.
- Не больше `AUTH.OTP_MAX_ATTEMPTS` попыток ввода, дальше код сгорает.
- Rate limit на запрос кода: по email И по IP (см. `config/constants.ts`).
- Ответ «код неверный» и «код истёк» — одинаковый по времени и тексту, чтобы
  нельзя было по ответу определить, зарегистрирован ли такой email.
- Сессионная кука: `httpOnly`, `Secure`, `SameSite=Lax`.
- Токен сессии в БД лежит хэшем.
