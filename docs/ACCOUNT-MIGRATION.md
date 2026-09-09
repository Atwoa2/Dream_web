# Account migration — personal → company

Everything was set up on **personal accounts** during the initial build. This
document lists what lives where and how to move each to **company ownership**.

No secrets appear here — only resource identifiers.

## Current ownership (all personal)

| Service | Resource | Owner now | Holds |
|---|---|---|---|
| GitHub | repo `Atwoa2/Dream_web` | personal GitHub `Atwoa2` | all source code |
| Vercel | project `dream-web` (team `dream-team-f80d`) | personal Vercel | production hosting + all env vars |
| Firebase / GCP | project `dream-labs-platform-9ac0c` | personal Google `atwoa2@gmail.com` | **all user data, balances, API keys (Firestore)** |
| Google OAuth | OAuth client in that GCP project | same personal Google | "Sign in with Google" |
| Stripe | claimable sandbox `acct_1UDqqnElr7TdOV7Z` | unclaimed (expires **2026-09-16**) | billing / payments |
| Resend | personal account | personal | sign-in code emails |
| Neon | project `blue-pine-01504359` | personal | retired Postgres (rollback only, ~1 week) |

Production URL: https://dream-web-seven.vercel.app

## Guiding principle

For most services, **transfer ownership — do not recreate**. Transferring keeps
all data, URLs and integrations intact. Recreating means migrating data (e.g.
the Firestore balances) and rewiring everything. Recreate only where transfer
is not practical (Resend).

## Per-service migration

### 1. GitHub — transfer the repo
- Company creates/uses a GitHub **organization**.
- `Atwoa2/Dream_web` → **Settings → Transfer ownership** → company org.
- History, branches and issues are preserved. The URL becomes
  `<org>/Dream_web`; the local `git remote` and the Vercel Git connection must
  be re-pointed afterward (small, done on our side).

### 2. Vercel — move the project
- Company creates a Vercel **team**.
- Move project `dream-web` into it (Vercel supports project transfer), or
  re-import the repo under the company team.
- Environment variables are re-added on our side; the production domain
  follows.

### 3. Firebase / GCP — add company as Owner
- Add the company Google account as **Owner** of GCP project
  `dream-labs-platform-9ac0c` (IAM & Admin → Grant access).
- Firestore data and the OAuth client stay exactly where they are — **no data
  migration**.
- We then generate a **new service-account key** owned by the company and
  **revoke the personal one** (`firebase-key.json`).
- Alternatively, if the company wants a brand-new Firebase project, we export
  Firestore and re-import — more work, avoid unless required.

### 4. Google OAuth — follows the GCP project
- If we keep the same GCP project (step 3), the OAuth client is unchanged;
  just add the company account as owner.
- If a new project is used, create a new OAuth client and swap
  `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, keeping the same redirect URIs.

### 5. Stripe — claim the sandbox (deadline 2026-09-16)
- Company registers/uses its Stripe account.
- Open the sandbox **claim URL** (saved by ops) → sign in as the company →
  the sandbox (products, prices, portal, webhook) attaches to it.
- For real payments later: activate the account, create **live** prices, set
  live keys + a dashboard webhook to
  `https://<domain>/api/stripe/webhook`, and put them in Vercel.

### 6. Resend — recreate under company
- Company creates a Resend account, new API key.
- Verify the `dreamlabs.ai` domain (DNS records) so emails send to everyone,
  not just the account owner.
- Swap `RESEND_API_KEY` / `EMAIL_FROM` (→ `noreply@dreamlabs.ai`) in Vercel.

## Credentials to rotate after the move

Once each service is company-owned, rotate what was issued personally:
- Firebase service-account key (revoke personal, issue company)
- Stripe keys (sandbox → company keys, then live)
- Resend API key
- Google OAuth secret (only if a new client is created)
- Vercel env vars are re-entered from the company side

## Recommended order

GitHub → Vercel → Firebase/GCP → Stripe → Resend.
From lowest to highest risk; each step is verified before the next.

## What is intentionally NOT in git (never transferred via the repo)
- `firebase-key.json` (service-account private key) — lives outside the repo
- `.env.local` — secrets, git-ignored
- `.local-pg/` — local Postgres, git-ignored
