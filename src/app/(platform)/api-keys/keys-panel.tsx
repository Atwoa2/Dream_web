"use client";

/**
 * Key creation and revocation. The freshly created key is rendered exactly
 * once, straight from the POST response — it can never be fetched again.
 */
import { useState } from "react";

export function KeysPanel() {
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => null)) as {
        key?: string;
        error?: { message?: string };
      } | null;
      if (!res.ok || !data?.key) {
        setError(data?.error?.message ?? "Something went wrong");
        return;
      }
      setCreatedKey(data.key);
      setCopied(false);
      setName("");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
  }

  return (
    <section className="card">
      <h2>Create key</h2>
      <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.6rem" }}>
        <input
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="Name, e.g. production"
          value={name}
          maxLength={64}
          required
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" disabled={busy}>
          {busy ? "Creating…" : "Create key"}
        </button>
      </form>

      {createdKey && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.9rem 1.1rem",
            border: "1px solid var(--line)",
            borderRadius: 10,
            background: "var(--paper)",
          }}
        >
          <span className="field-label">Your new key — shown only once</span>
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <code style={{ overflowWrap: "anywhere" }}>{createdKey}</code>
            <button type="button" className="btn-ghost" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="muted" style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
            Store it now. We keep only a SHA-256 hash — a lost key is replaced,
            never recovered.
          </p>
        </div>
      )}

      {error && (
        <p style={{ color: "#b3261e", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}
    </section>
  );
}

export function RevokeButton({ keyId }: { keyId: string }) {
  const [busy, setBusy] = useState(false);

  async function handleRevoke() {
    const sure = window.confirm(
      "Revoke this key? Clients using it will stop working immediately.",
    );
    if (!sure) return;
    setBusy(true);
    await fetch(`/api/keys/${keyId}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <button className="btn-danger" disabled={busy} onClick={handleRevoke}>
      {busy ? "Revoking…" : "Revoke"}
    </button>
  );
}
