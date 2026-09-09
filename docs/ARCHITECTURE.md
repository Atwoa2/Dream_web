# Architecture

## What we are building

The DreamLabs web platform: user account area, Stripe payments, and API access
to our own model.

## Services

```
                    ┌─────────────────────┐
   browser ────────►│  Next.js (Vercel)   │  site, account area, billing,
                    │                     │  API key management
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   PostgreSQL        │ ◄──── shared database
                    └──────────▲──────────┘
                               │
   API client ────────►┌───────┴──────────┐
   (X-API-Key)         │  API gateway     │  validates keys,
                       │  (GPU, our model)│  records usage
                       └──────────────────┘
```

Two services, one database. The site writes keys and limits; the gateway reads
them and records usage. The model runs elsewhere: Next.js on Vercel is no
place for a GPU.

## Technology

| What | With | Why |
|---|---|---|
| Frontend + backend | Next.js 15 (App Router), TypeScript | one project and one deploy instead of two coupled services |
| Database | PostgreSQL + Drizzle ORM | type-safe queries, migrations in git |
| Authentication | hand-rolled: email codes + Google OAuth (plain fetch), sessions in the DB | full control over our schema, no extra dependencies; passwords do not exist in the system |
| Email | Resend | verification code delivery |
| Payments | Stripe Checkout + Billing Portal | card data never touches our servers |
| Rate limiting | PostgreSQL counters | no extra service to operate; swappable for Redis behind the same interface |
| Hosting | Vercel | preview deploy on every PR |

## Authentication

Two sign-in methods; both resolve to the same account when the email matches:

1. **Email code** — 6 digits, 10-minute lifetime, single use.
2. **Google OAuth** — authorization code flow.

There are no passwords in the system at all: nothing to steal, no reset flow,
no credential-stuffing surface.

## Billing

**Rule one:** the source of truth for access is OUR database, kept up to date
by webhooks. Pages never call the Stripe API to render.

**Rule two:** access is granted only by a webhook, never by `success_url`.

Payment flow:

```
browser            our server               Stripe
   │ "Pay"             │                      │
   ├──────────────────►│                      │
   │                   ├─ create session ────►│
   │                   │◄──── url ────────────┤
   │◄─── redirect ─────┤                      │
   ├──────── payment happens on Stripe ──────►│
   │◄─── back to success_url ─────────────────┤
   │                   │◄── webhook ──────────┤
   │                   ├─ grant access        │
```

The Billing tab shows: current plan, payment history, card
(`Visa •••• 4242`), and a "Manage" button → Stripe Billing Portal. Card
changes, cancellation and upgrades happen on Stripe's side — we do not build
that UI.

API usage is paid with prepaid credits, not postpaid metering: otherwise a
client can run up a huge bill and never pay, while the GPU time is already
spent.

## Stages

| Stage | Scope | Status |
|---|---|---|
| **0** | repository, skeleton, DB schema, CI, documentation | done |
| **1** | email-code and Google sign-in, sessions, rate limiting | done (backend + minimal UI) |
| **2** | account area: profile, navigation | done (skeleton) |
| **3** | Stripe: payments, subscription, Billing tab, webhooks | |
| **4** | API keys, gateway, usage metering, credits | |

Stripe comes after the account area not because it is hard, but because it
needs a user to attach the Customer to.

## Related documents

- [STRUCTURE.md](STRUCTURE.md) — where code lives and why
- [SECURITY.md](SECURITY.md) — secrets handling and security requirements
- [WORKFLOW.md](WORKFLOW.md) — how the team works with this repository
