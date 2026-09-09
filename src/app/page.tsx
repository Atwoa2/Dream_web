export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>DreamLabs</h1>
      <p style={{ color: "var(--muted)" }}>
        Каркас проекта. Здесь будет посадочная страница — вёрстку переносим из
        существующего статического сайта.
      </p>
      <p style={{ color: "var(--muted)", marginTop: "2rem", fontSize: "0.9rem" }}>
        Порядок работ и архитектура — в <code>docs/ARCHITECTURE.md</code>.
      </p>
    </main>
  );
}
