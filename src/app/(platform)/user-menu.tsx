"use client";

/**
 * Top-right account control: prepaid balance next to an avatar button that
 * opens a dropdown (Settings, Add money, Sign out).
 *
 * The balance is passed in from the server (read once per navigation) so the
 * header renders correct on first paint without a client fetch.
 */
import { useEffect, useRef, useState } from "react";

function initials(email: string, name: string | null): string {
  const source = (name?.trim() || email).trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const chars = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (chars || source[0] || "?").toUpperCase();
}

export function UserMenu({
  email,
  name,
  balanceCents,
}: {
  email: string;
  name: string | null;
  balanceCents: number;
}) {
  const [open, setOpen] = useState(false);
  const [addingMoney, setAddingMoney] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const balance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(balanceCents / 100);

  async function addMoney() {
    setAddingMoney(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "credits" }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setAddingMoney(false);
      }
    } catch {
      setAddingMoney(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="user-menu" ref={wrapRef}>
      <span className="user-menu-balance" title="Credit balance">
        {balance}
      </span>

      <button
        className="user-menu-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        {initials(email, name)}
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-head">
            <div className="user-menu-name">{name?.trim() || "Account"}</div>
            <div className="user-menu-email">{email}</div>
          </div>

          <a className="user-menu-item" href="/settings" role="menuitem">
            Settings
          </a>

          <button
            className="user-menu-item"
            role="menuitem"
            disabled={addingMoney}
            onClick={addMoney}
          >
            {addingMoney ? "Redirecting…" : "Add money"}
          </button>

          <div className="user-menu-sep" />

          <button className="user-menu-item danger" role="menuitem" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
