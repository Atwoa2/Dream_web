# Project structure

This document answers "where does new code go" so the project does not turn
into a junk drawer six months from now.

## Tree

```
src/
  app/                    Next.js: pages and HTTP routes
    api/
      health/             service liveness check
  modules/                ALL business logic
    users/                profile, Stripe Customer linkage
    auth/                 email-code and Google sign-in
    billing/              Stripe: subscriptions, payments, webhooks
    api-keys/             keys, usage metering, credits
    rate-limit/           action rate limiting
    audit/                sensitive-action journal
    dream-api/            server-side proxy to the robot backend
  lib/                    infrastructure, no business logic
    firebase.ts           Firebase Admin initialization
    firebase-store.ts     FirebaseStore — all Firestore reads/writes
    env.ts                environment variable validation
    errors.ts             typed errors
    logger.ts             JSON logs
  config/
    constants.ts          every numeric constant in the app
docs/                     documentation
```

## The main rule — layers

```
app/  →  modules/  →  FirebaseStore
```

Left to right only.

| Layer | Does | Is forbidden to |
|---|---|---|
| `app/` | accept the request, check permissions, call a module, return the response | contain business logic, touch `db` directly |
| `modules/` | business rules | know about HTTP, `Request`, cookies |
| `FirebaseStore` | Firestore reads/writes, Timestamp↔Date conversion | contain business rules |

Why this matters: the moment a page starts querying the database itself, the
rule "does this user have access" gets smeared across ten files. Then one
developer edits it in one place, another in a different place, and nobody can
say how the system actually behaves.

## Module layout

Identical in every module, so nothing has to be figured out twice:

```
modules/<name>/
  README.md        purpose and responsibility boundaries
  types.ts         types exposed to the outside
  repository.ts    database queries — the ONLY place with SQL
  service.ts       business rules
  index.ts         public interface
```

Import another module **only through its `index.ts`**:

```ts
import { getUser } from "@/modules/users";              // yes
import { findById } from "@/modules/users/repository";  // no
```

## Conventions

- **Imports** — via the `@/` alias, never `../../../`.
- **Money** — integers in cents. Never `float`.
- **Dates** — always `timestamptz`, UTC in code. Local time only at display.
- **Store naming** — collections `snake_case`, fields `camelCase` (they map
  1:1 to TypeScript).
- **Errors** — via `AppError` from `lib/errors.ts`. Only `code` and `message`
  leave the server; never stack traces.
- **Logs** — via `logger`, not `console.log`. No secrets, email codes, or API
  keys in logs, ever.

## Where new code goes

| Task | Location |
|---|---|
| New page | `app/<path>/page.tsx` |
| New HTTP endpoint | `app/api/<path>/route.ts` |
| New business rule | `modules/<domain>/service.ts` |
| New store query | `modules/<domain>/repository.ts` |
| New collection | document it in the module README |
| Utility without business logic | `lib/` |
| Constant or limit | `config/constants.ts` |
