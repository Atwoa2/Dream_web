import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-server";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>DreamLabs</h1>
      <p style={{ color: "var(--muted)" }}>
        Project skeleton. The landing page goes here — markup will be ported
        from the existing static site.
      </p>
      <p style={{ marginTop: "2rem" }}>
        {user ? (
          <Link href="/account">Go to your account →</Link>
        ) : (
          <Link href="/login">Sign in →</Link>
        )}
      </p>
    </main>
  );
}
