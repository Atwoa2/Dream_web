# Dream_web

DreamLabs web platform: user account area, Stripe payments, and API access to
our model.

**Status:** stage 0 — project skeleton. The app boots, the database schema is
defined; authentication and payments are not implemented yet.

## Stack

Next.js 15 (App Router) · TypeScript · Firebase Firestore · Stripe

## Up and running in 15 minutes

Requires **Node.js 20+** and a Firebase service-account key (ask the team
for `FIREBASE_SERVICE_ACCOUNT`, or generate your own key in the Firebase
Console if you have project access).

```bash
git clone git@github.com:Atwoa2/Dream_web.git
cd Dream_web
npm install
```

Environment variables:

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

- `FIREBASE_SERVICE_ACCOUNT` — base64 of the service-account JSON:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("firebase-key.json"))
  ```
- `APP_URL` — keep `http://localhost:3000`

The remaining variables belong to later stages and can be left empty for now.

Startup:

```bash
npm run dev
```

No migrations: Firestore collections are created on first write.

Check: <http://localhost:3000/api/health> should respond with
`{"status":"ok","database":"up"}`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | development mode |
| `npm run build` | production build |
| `npm run typecheck` | type checking |
| `npm run lint` | linter |

## Documentation

Read before your first commit:

| Document | Covers |
|---|---|
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | where code lives, the layer rule, where new code goes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | how the system works as a whole and why |
| [docs/SECURITY.md](docs/SECURITY.md) | secrets, keys, security requirements |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | branches, reviews, environments, Stripe in a team |

## The two rules that matter most

1. **Never commit secrets.** Not ever, in any form. Details:
   [docs/SECURITY.md](docs/SECURITY.md).
2. **Business logic lives in `src/modules/`.** Pages and API routes never touch
   the database directly. Details: [docs/STRUCTURE.md](docs/STRUCTURE.md).
