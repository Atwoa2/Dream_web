# api-keys — stage 4

Model access over API: key issuance, usage metering, credit deduction.

## Key anatomy

Format: `dl_live_<32 bytes of entropy, base62>`.

- Shown to the user **once**, at creation.
- The DB stores only a SHA-256 hash and a display prefix.
- A lost key is not recovered — a new one is issued.
- Revocation is instant, via `revoked_at` (not deletion: history must survive).

## Planned interface

```ts
createKey(userId, name): Promise<{ key: string; id: string }>  // key appears here only
listKeys(userId): Promise<ApiKeyInfo[]>
revokeKey(userId, keyId): Promise<void>
authenticateKey(rawKey): Promise<{ userId; keyId } | null>     // for the gateway
recordUsage(keyId, usage): Promise<void>
```

## Payment model

Prepaid credits. A call deducts from the balance; an empty balance returns
`402`.

Postpaid metering is not used: a client could run up a bill worth thousands
and never pay, while the GPU time is already spent.

## Architecture note

The model itself does **not** run here — Next.js on Vercel is no place for a
GPU. It is a separate gateway service that reads the same database: keys and
limits in, `usage_events` out.
