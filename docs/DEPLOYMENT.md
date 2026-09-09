# Deployment & infrastructure

Current state of the environments and how to operate them. Secrets themselves
live in the team password manager and Vercel env vars — never here.

## Services in use

| Service | What | Identifier |
|---|---|---|
| GitHub | repository | `Atwoa2/Dream_web` |
| Neon | production PostgreSQL 18 | project `blue-pine-01504359` (aws-us-west-2) |
| Vercel | hosting | project `dream-web` |
| Stripe | payments | claimable sandbox `acct_1UDqqnElr7TdOV7Z` (see below) |

## Environment variables

The full list with comments is in `.env.example`. Production values are set in
Vercel → Project → Settings → Environment Variables.

Set in production so far: `DATABASE_URL` (Neon), `APP_ENV`, `APP_URL`.

Still missing in production (features degrade gracefully until set):

| Variable | Unlocks | Where to get it |
|---|---|---|
| `RESEND_API_KEY`, `EMAIL_FROM` | email-code sign-in | resend.com + domain DNS verification |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google sign-in | Google Cloud Console OAuth client |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | payments | Stripe dashboard after claiming the sandbox |
| `DREAM_API_URL`, `DREAM_API_TOKEN` | fine-tuning / fish-tank pages | robot backend operator |

Without email or Google configured, production sign-in is impossible — that is
the current state, deliberate until Resend or Google OAuth is set up.

## Deploying

Manual deploy from a checkout:

```bash
vercel deploy --prod --yes
```

Recommended: connect the GitHub repo in Vercel (Project → Settings → Git) so
every push to `main` deploys automatically and every PR gets a preview URL.

Migrations are applied from a developer machine for now:

```bash
DATABASE_URL="<neon connection string>" npx drizzle-kit migrate
```

## Stripe sandbox (temporary!)

Payments currently run against a **claimable sandbox** created without an
account. It EXPIRES 2026-09-16 unless claimed:

1. Open the claim URL (saved by ops; also recoverable via `stripe sandbox claim`).
2. Sign in with the company Stripe account (create one if needed).
3. The sandbox — products, prices, portal config, test data — attaches to
   that account. Keys stay valid.

After claiming, for production payments: activate the account, create live
prices, set the live keys + a dashboard webhook endpoint
(`https://<domain>/api/stripe/webhook`) and its `whsec_` in Vercel env.

## Local development quick reference

- Local Postgres (portable, no service): `c:\DreamLabs\claudecode\.local-pg`,
  port 5433. Start it with
  `.local-pg\node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl -D .local-pg\data -o "-p 5433" start`
- Webhooks: `stripe listen --api-key <key> --forward-to localhost:3000/api/stripe/webhook`
  (the printed `whsec_` goes into your `.env.local`).
- Email codes print to the dev-server console when `RESEND_API_KEY` is unset.

## Security TODO (tracked)

- [ ] Make the GitHub repository private
- [ ] Rotate the robot backend gate token (the old one is public inside the
      legacy SPA bundle on GitHub Pages)
- [ ] Claim the Stripe sandbox before 2026-09-16
- [ ] Enforce 2FA + branch protection on `main` once collaborators join
