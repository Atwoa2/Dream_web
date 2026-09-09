/** A key as shown in lists — the secret itself never appears here. */
export type ApiKeyInfo = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

/** Returned exactly once, at creation. */
export type CreatedApiKey = {
  id: string;
  key: string;
};

export type UsageSummary = {
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
};

export type UsageEventInfo = {
  id: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  createdAt: Date;
};
