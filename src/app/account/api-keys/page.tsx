/**
 * API keys tab — stage 4 fills this with real data.
 * Will list keys (prefix, name, last used), a create dialog that shows the
 * full key exactly once, and instant revocation.
 */
export default function ApiKeysPage() {
  return (
    <section className="card">
      <h2>API keys</h2>
      <p className="muted" style={{ margin: 0 }}>
        API access to the model arrives in stage 4. Keys created here will be
        shown once and stored only as hashes.
      </p>
    </section>
  );
}
