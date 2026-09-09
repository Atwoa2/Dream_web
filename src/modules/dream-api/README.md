# dream-api

Server-side proxy to the Dream Labs robot backend (`/v1/*`): datasets,
embodiments, fine-tuning jobs, fish tanks and their requests.

## Why a proxy

The legacy SPA shipped `VITE_GATE_TOKEN` inside its public JS bundle — anyone
could extract it and call the backend directly. In this app the token lives in
server environment variables (`DREAM_API_URL`, `DREAM_API_TOKEN`), requests
are made after our own session check, and the browser never sees the token.

## Behavior

- Not configured or unreachable → every list returns `[]` and the page shows
  an honest empty state. The account area never goes down with the backend.
- 10-second timeout per request, no caching (robot state is live).
- Accepts both `[...]` and `{ data: [...] }` response shapes.

## Env

| Variable | Meaning |
|---|---|
| `DREAM_API_URL` | backend base URL (currently a Cloudflare tunnel) |
| `DREAM_API_TOKEN` | gate token, sent as `X-Gate-Token` |
