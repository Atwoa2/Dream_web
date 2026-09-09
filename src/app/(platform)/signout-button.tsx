"use client";

export function SignOutButton() {
  async function handleClick() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button className="btn-ghost" style={{ width: "100%" }} onClick={handleClick}>
      Sign out
    </button>
  );
}
