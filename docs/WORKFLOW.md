# Team workflow

## Branches

- `main` — always deployable. Production deploys from it. Direct pushes are
  disabled.
- Task → branch → pull request → review → merge.

Naming: `feature/email-auth`, `fix/webhook-duplicate`, `chore/ci`.

## Pull requests

A PR merges only when:

1. CI is green (types, lint, build, gitleaks).
2. A second developer has approved.

Review priorities:

- no direct `db` access from `app/` bypassing a module;
- a `user_id` filter present in every query for user data;
- no secret in code or logs.

## Environments

| Environment | Used by | Database | Stripe keys |
|---|---|---|---|
| local | each developer | their own | test |
| preview | automatic, per PR | shared test | test |
| production | users | production | **live** |

Vercel creates a preview deploy for every PR — the reviewer clicks through a
live version instead of reading diffs.

## Developer databases

Everyone gets their own copy. A shared dev database works right up to the
first migration conflict: one person changes the schema, everyone else breaks.

Options: local PostgreSQL in Docker, or Neon database branches.

Migrations live in git and are applied with `npm run db:migrate`.
Rule: migrations are forward-only. A migration merged into `main` is never
edited — others have already applied it.

## Stripe in a team

- One account. Developers are invited via Dashboard → Settings → Team with
  the `Developer` role.
- Test keys are shared and may be given to the whole team.
- **The webhook secret is personal.**
  `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  prints a personal `whsec_...` that works only on that machine. A value from
  someone else's config will not work — a regular source of confusion.
- `price_id` values differ between test and live, so they live in environment
  variables, not in code.
