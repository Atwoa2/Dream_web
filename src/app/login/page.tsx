"use client";

/**
 * Sign-in page: email → code, or Google.
 *
 * The server enforces a 60-second cooldown between code requests; the UI
 * mirrors it with a visible countdown so "resend" is predictable instead of
 * surprising users with "Too many requests".
 */
import { useEffect, useState, type FormEvent } from "react";

type Step = "email" | "code";

const COOLDOWN_SECONDS = 60;

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.8rem",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "#fff",
  color: "var(--fg)",
  fontSize: "1rem",
};

const button: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem",
  borderRadius: 8,
  border: "none",
  background: "var(--accent)",
  color: "#fff",
  fontSize: "1rem",
  cursor: "pointer",
};

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // The Google callback redirects here with ?error=google on any failure.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "google") {
      setError("Google sign-in failed. Try again or use an email code.");
    }
  }, []);

  // Tick the resend countdown once a second.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown > 0]);

  async function post(path: string, body: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { code?: string; message?: string };
        } | null;
        if (data?.error?.code === "RATE_LIMITED") {
          setError("Too many requests — wait a minute and try again.");
          setCooldown(COOLDOWN_SECONDS);
        } else {
          setError(data?.error?.message ?? "Something went wrong");
        }
        return false;
      }
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function sendCode(): Promise<boolean> {
    const ok = await post("/api/auth/email/request", { email });
    if (ok) setCooldown(COOLDOWN_SECONDS);
    return ok;
  }

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    if (await sendCode()) setStep("code");
  }

  async function handleCode(e: FormEvent) {
    e.preventDefault();
    if (await post("/api/auth/email/verify", { email, code })) {
      window.location.href = "/api-keys";
    }
  }

  return (
    <main style={{ maxWidth: 380, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Sign in</h1>

      {step === "email" ? (
        <form onSubmit={handleEmail}>
          <input
            style={field}
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <button
            style={{ ...button, marginTop: "0.75rem" }}
            disabled={busy || cooldown > 0}
          >
            {busy
              ? "Sending…"
              : cooldown > 0
                ? `Send code (${cooldown}s)`
                : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCode}>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            We sent a 6-digit code to <b>{email}</b>
          </p>
          <input
            style={{ ...field, letterSpacing: "0.4em", textAlign: "center" }}
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="······"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
          <button style={{ ...button, marginTop: "0.75rem" }} disabled={busy}>
            {busy ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={busy || cooldown > 0}
            style={{
              ...button,
              marginTop: "0.5rem",
              background: "transparent",
              color: cooldown > 0 ? "var(--muted)" : "var(--accent)",
            }}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            style={{
              ...button,
              marginTop: "0.25rem",
              background: "transparent",
              color: "var(--muted)",
            }}
          >
            Use another email
          </button>
        </form>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          margin: "1.5rem 0",
          color: "var(--muted)",
          fontSize: "0.85rem",
        }}
      >
        <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
        or
        <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
      </div>

      <a
        href="/api/auth/google/start"
        style={{
          ...button,
          display: "block",
          textAlign: "center",
          textDecoration: "none",
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--fg)",
        }}
      >
        Continue with Google
      </a>

      {error && (
        <p style={{ color: "#b3261e", marginTop: "1rem", fontSize: "0.9rem" }}>{error}</p>
      )}
    </main>
  );
}
