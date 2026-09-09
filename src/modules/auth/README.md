# auth — stage 1

Signing in. Two methods, both resolving to one account when the email matches:

1. **Email code** — 6 digits, 10-minute lifetime, single use.
2. **Google OAuth** — authorization code flow, hand-rolled on fetch
   (three HTTPS requests; no library dictating our session or table format).

There are no passwords in the system: nothing to leak, no reset flow, no
complexity policies.

## Interface

```ts
requestEmailCode(email, meta): Promise<void>
verifyEmailCode(email, code, meta): Promise<IssuedSession>
signInWithGoogle(profile, meta): Promise<IssuedSession>
getUserBySessionToken(token): Promise<User | null>
signOut(token, meta): Promise<void>
```

`IssuedSession.token` is raw and goes into the cookie; the database keeps only
its SHA-256 hash. Cookies themselves are handled in `lib/session-cookie.ts` —
this module knows nothing about HTTP.

## Security decisions (implemented)

- The DB stores a **hash** of the code, never the code.
- Codes come from `crypto.randomInt`, not `Math.random`.
- At most `AUTH.OTP_MAX_ATTEMPTS` verification attempts; the attempt is
  counted **before** comparison, so failures are never free.
- Constant-time hash comparison (`timingSafeEqual`).
- Rate limits: per email and per IP on requests, per IP on verification
  (see `config/constants.ts`).
- "Invalid", "expired" and "missing" code produce one identical answer —
  a distinguishable response reveals whether an email is registered.
- A Google account with an unverified email is rejected: linking by address
  would enable account takeover.
- OAuth `state` is checked in the callback route (CSRF).
- Sensitive actions land in `audit_log`.

## Routes (the HTTP boundary lives in app/)

| Route | Purpose |
|---|---|
| `POST /api/auth/email/request` | send a code |
| `POST /api/auth/email/verify` | verify the code, set the session cookie |
| `GET  /api/auth/google/start` | redirect to Google |
| `GET  /api/auth/google/callback` | finish OAuth, set the session cookie |
| `GET  /api/auth/me` | current user |
| `POST /api/auth/signout` | end the session |

## Local development

Without `RESEND_API_KEY` in `.env.local` the code is printed to the dev
server console (development only). With the key set, real emails go out.
