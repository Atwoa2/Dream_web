"use client";

/**
 * Buttons that start Stripe flows. Each POSTs to our API, gets a Stripe URL
 * back and navigates there — no Stripe.js needed for these flows.
 */
import { useState } from "react";

export function BillingActions({
  hasSubscription,
}: {
  hasSubscription: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(path: string, body?: unknown) {
    setBusy(path);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: { message?: string };
      } | null;
      if (!res.ok || !data?.url) {
        setError(data?.error?.message ?? "Something went wrong");
        return;
      }
      window.location.href = data.url;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
      {!hasSubscription && (
        <button
          className="btn-ghost"
          disabled={busy !== null}
          onClick={() => go("/api/billing/checkout", { product: "subscription" })}
        >
          {busy ? "Redirecting…" : "Subscribe"}
        </button>
      )}
      <button
        className="btn-ghost"
        disabled={busy !== null}
        onClick={() => go("/api/billing/checkout", { product: "credits" })}
      >
        Buy credits
      </button>
      <button
        className="btn-ghost"
        disabled={busy !== null}
        onClick={() => go("/api/billing/portal")}
      >
        Manage billing
      </button>
      {error && (
        <p style={{ color: "#ff6b6b", width: "100%", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
