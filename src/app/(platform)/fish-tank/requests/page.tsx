import { requireUser } from "@/lib/auth-server";
import { isConfigured, listTankRequests } from "@/modules/dream-api";

export const dynamic = "force-dynamic";

export default async function FishTankRequestsPage() {
  await requireUser();
  const requests = await listTankRequests();
  const connected = isConfigured();

  return (
    <>
      <h1 className="page-title">Fish Tank requests</h1>
      <p className="page-sub">
        Everything queued across the tanks, newest first. Done requests link to
        the recorded attempt.
      </p>

      {!connected && (
        <div className="notice" style={{ marginBottom: "1rem" }}>
          Robot backend is not connected. Set DREAM_API_URL and
          DREAM_API_TOKEN to see live requests.
        </div>
      )}

      <section className="card">
        <h2>Requests</h2>
        {requests.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Nothing queued.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Tank</th>
                  <th>Instruction</th>
                  <th>Status</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr key={r.id ?? i}>
                    <td className="muted">{r.created_at ?? "—"}</td>
                    <td>{r.tank ?? r.tank_id ?? "—"}</td>
                    <td>{r.instruction ?? "—"}</td>
                    <td>
                      <span className="pill pill-off">{r.status ?? "unknown"}</span>
                    </td>
                    <td>
                      {r.result_url ? (
                        <a href={r.result_url} target="_blank" rel="noreferrer">
                          recording
                        </a>
                      ) : (
                        "—"
                      )}
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
