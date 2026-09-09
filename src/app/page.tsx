export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>DreamLabs</h1>
      <p style={{ color: "var(--muted)" }}>
        Project skeleton. The landing page goes here — markup will be ported
        from the existing static site.
      </p>
      <p style={{ color: "var(--muted)", marginTop: "2rem", fontSize: "0.9rem" }}>
        Roadmap and architecture: <code>docs/ARCHITECTURE.md</code>.
      </p>
    </main>
  );
}
