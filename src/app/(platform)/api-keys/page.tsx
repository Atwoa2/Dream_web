import { requireUser } from "@/lib/auth-server";
import { listKeys } from "@/modules/api-keys";
import { KeysPanel, RevokeButton } from "./keys-panel";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toISOString().slice(0, 10);

export default async function ApiKeysPage() {
  const user = await requireUser();
  const keys = await listKeys(user.id);

  return (
    <>
      <h1 className="page-title">API keys</h1>
      <p className="page-sub">
        Keys authenticate requests to the Dream Labs API. Each key is hashed
        with SHA-256 at rest and shown in full exactly once.
      </p>

      <KeysPanel />

      <section className="card">
        <h2>Your keys</h2>
        {keys.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No keys yet.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key</th>
                  <th>Created</th>
                  <th>Last used</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td>{k.name}</td>
                    <td>
                      <code>{k.keyPrefix}…</code>
                    </td>
                    <td className="muted">{fmt(k.createdAt)}</td>
                    <td className="muted">
                      {k.lastUsedAt ? fmt(k.lastUsedAt) : "never"}
                    </td>
                    <td>
                      {k.revokedAt ? (
                        <span className="pill pill-off">revoked</span>
                      ) : (
                        <span className="pill pill-ok">active</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {!k.revokedAt && <RevokeButton keyId={k.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
