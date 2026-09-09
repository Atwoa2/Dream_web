import { requireUser } from "@/lib/auth-server";
import { isConfigured, listTanks } from "@/modules/dream-api";

export const dynamic = "force-dynamic";

export default async function FishTankPage() {
  await requireUser();
  const tanks = await listTanks();
  const connected = isConfigured();

  return (
    <>
      <h1 className="page-title">Fish Tank</h1>
      <p className="page-sub">
        Live robot stations. Queue an instruction; the client picks it up on
        its next poll and records the attempt.
      </p>

      {!connected && (
        <div className="notice" style={{ marginBottom: "1rem" }}>
          Robot backend is not connected. Set DREAM_API_URL and
          DREAM_API_TOKEN to see live tanks.
        </div>
      )}

      <section className="card">
        <h2>Tanks</h2>
        {tanks.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No tanks online. Waiting for a robot to check in…
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tank</th>
                  <th>Robot</th>
                  <th>Last seen</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tanks.map((t, i) => (
                  <tr key={t.id ?? i}>
                    <td>{t.name ?? t.id ?? "—"}</td>
                    <td>{t.robot ?? "—"}</td>
                    <td className="muted">{t.last_seen_at ?? "—"}</td>
                    <td>
                      <span className="pill pill-off">{t.status ?? "unknown"}</span>
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
