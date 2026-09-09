# Security

## Secrets: the main rule

**No secret ever reaches git.**

The repository contains only `.env.example` — variable names without values.

| Where | What lives there | Who has access |
|---|---|---|
| `.env.local` on a developer machine | test keys, local database | that developer |
| Team password manager (1Password / Bitwarden) | shared test keys, service logins | the dev team |
| Vercel Environment Variables (Production) | `sk_live_`, production DB, production webhooks | 1–2 people |

Production keys are **not handed to developers at all**. Not "handed out
carefully" — not handed out. Development runs on Stripe test keys, where the
money is not real.

The mistake is guarded against in code: `lib/env.ts` fails at startup if an
`sk_live_` key is detected outside production.

CI runs **gitleaks** — it blocks a pull request when the diff contains
something that looks like a secret. Cheap insurance against the most expensive
mistake.

## If a secret does leak

In exactly this order:

1. **Revoke the key** in the service dashboard (Stripe → Roll key). This comes
   first: while the key is valid, nothing else matters.
2. Issue a new one and update the environment variables.
3. Only then clean up git history.

Deleting the commit is not enough — bots index GitHub in real time, and leaked
Stripe keys are exploited within minutes.

## Authentication

- No passwords: sign-in via one-time code or Google. Nothing to steal.
- Codes come from `crypto.randomInt`, never `Math.random`.
- The database stores a **hash** of the code, not the code.
- At most 5 verification attempts; otherwise 6 digits fall to brute force in
  minutes.
- Rate limit on code requests: per email AND per IP. Without it, a stranger's
  inbox gets flooded and the email bill is yours.
- "Wrong code" and "expired code" responses are indistinguishable — otherwise
  they reveal whether an email is registered.

## Sessions

- Cookie is `httpOnly` + `Secure` + `SameSite=Lax`: JavaScript cannot reach
  it, so XSS cannot steal the session.
- The session token is stored in the DB as a hash.
- CSRF protection on every mutating request.

## User API keys

- Shown **once**, at creation time.
- The DB stores only a SHA-256 hash and a display prefix.
- A lost key is not recoverable — a new one is issued.
- Revocation is instant, via `revoked_at`.

## Data access boundaries

The most common vulnerability in this kind of product is a forgotten
`user_id` filter in a single endpoint, after which any user can read someone
else's payments.

Therefore:

- Every query for user data is filtered by the `user_id` from the session.
- An object ID from the URL is **never** sufficient grounds for access:
  `/api/keys/<id>` must verify the key belongs to the current user.
- This is an explicit code review checklist item.

## Stripe

- Webhook signatures are verified against the **raw** request body.
- Processing is idempotent: `stripe_event_id` goes into `processed_events`.
- Card data is never stored — only `brand` and `last4` for display.
- Product access is granted only by webhook, not by `success_url`.
- Developers get the `Developer` role in the Stripe Dashboard: keys and logs,
  but no payouts or bank details.

## Infrastructure

- HTTPS everywhere, HSTS enabled.
- Security headers configured in `next.config.ts`.
- Input validation with zod at the application boundary.
- Parameterized queries only (Drizzle) — SQL injection is closed off.
- Mandatory 2FA on GitHub and Stripe for every member.
- Regular database backups with restore drills.
