/**
 * Account area frame: sign-in gate, header, tab navigation.
 * Every page under /account is only reachable with a valid session.
 */
import Link from "next/link";
import { requireUser } from "@/lib/auth-server";
import { SignOutButton } from "./signout-button";

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="account-shell">
      <header className="account-header">
        <div>
          <h1 style={{ fontSize: "1.4rem", margin: 0 }}>Account</h1>
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            {user.email}
          </span>
        </div>
        <SignOutButton />
      </header>

      <nav className="account-nav">
        <Link href="/account">Profile</Link>
        <Link href="/account/billing">Billing</Link>
        <Link href="/account/api-keys">API keys</Link>
      </nav>

      {children}
    </div>
  );
}
