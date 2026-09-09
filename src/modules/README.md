# Modules — all business logic lives here

## The layer rule

```
app/  →  modules/  →  FirebaseStore
```

The arrow works **left to right only**:

- `app/` (pages and API routes) — accepts the request, checks permissions,
  calls a module, returns the response. No logic inside.
- `modules/` — business logic. Knows nothing about HTTP, `Request`,
  `Response` or cookies.
- `lib/firebase-store.ts` — the FirebaseStore class: every read and write
  goes through it. Repositories are its only callers.

**Forbidden:** touching the store directly from `app/`. Once a page queries
Firestore itself, logic spreads across routes and within a month nobody can
find where user access is decided. That is exactly the chaos we are avoiding.

## Module layout

Each module is one domain. The files are always the same:

| File | Responsibility |
|---|---|
| `README.md` | why the module exists, responsibility boundaries |
| `types.ts` | types the module exposes |
| `repository.ts` | data access — **the only place** that touches FirebaseStore |
| `service.ts` | business rules; calls the repository, returns public types |
| `index.ts` | public interface: what the module exports |

Import another module **only through its `index.ts`**. Reaching into
`other-module/repository.ts` directly erases the responsibility boundary and
makes the module impossible to change without breaking half the project.

## Current modules

| Module | Stage | State |
|---|---|---|
| `users` | 0 | basic CRUD ready |
| `auth` | 1 | ready: email-code + Google, sessions, audit |
| `rate-limit` | 1 | action rate limiting |
| `billing` | 3 | ready: Checkout, Portal, webhooks, credits |
| `api-keys` | 4 | keys + usage live; gateway auth ready, GPU gateway pending |
| `audit` | 1 | ready: shared sensitive-action journal |
| `dream-api` | — | ready: server-side proxy to the robot backend |
