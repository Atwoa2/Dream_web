"use client";

import { useState } from "react";

export function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(data?.error?.message ?? "Something went wrong");
        return;
      }
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
      <input
        className="input"
        style={{ maxWidth: 320 }}
        placeholder="Your name"
        value={name}
        maxLength={80}
        onChange={(e) => {
          setName(e.target.value);
          setSaved(false);
        }}
      />
      <button className="btn" disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
      {saved && <span className="muted">Saved</span>}
      {error && <span style={{ color: "#b3261e", fontSize: "0.9rem" }}>{error}</span>}
    </form>
  );
}
