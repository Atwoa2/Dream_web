import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-server";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Dream Labs Platform</h1>
      <p className="muted">
        API access to our model, fine-tuning on your datasets, and live robot
        stations in the Fish Tank.
      </p>
      <p style={{ marginTop: "2rem" }}>
        {user ? (
          <Link href="/api-keys">Open the platform →</Link>
        ) : (
          <Link href="/login">Sign in →</Link>
        )}
      </p>
    </main>
  );
}
