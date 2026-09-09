import { requireUser } from "@/lib/auth-server";
import { isConfigured, listDatasets } from "@/modules/dream-api";

export const dynamic = "force-dynamic";

const cams = (value: number | string[] | undefined) =>
  Array.isArray(value) ? value.join(", ") : value ?? "—";

export default async function DatasetsPage() {
  await requireUser();
  const datasets = await listDatasets();
  const connected = isConfigured();

  return (
    <>
      <h1 className="page-title">Datasets</h1>
      <p className="page-sub">
        Recorded episodes for fine-tuning. Only datasets that passed validation
        can be used in a job.
      </p>

      {!connected && (
        <div className="notice" style={{ marginBottom: "1rem" }}>
          Robot backend is not connected. Set DREAM_API_URL and
          DREAM_API_TOKEN to see live datasets.
        </div>
      )}

      <section className="card">
        <h2>Datasets</h2>
        {datasets.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No datasets yet.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Episodes</th>
                  <th>Proprio dim</th>
                  <th>Action dim</th>
                  <th>Cameras</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d, i) => (
                  <tr key={d.id ?? i}>
                    <td>{d.name ?? d.id ?? "—"}</td>
                    <td>{d.episodes ?? "—"}</td>
                    <td>{d.proprio_dim ?? "—"}</td>
                    <td>{d.action_dim ?? "—"}</td>
                    <td>{cams(d.cameras)}</td>
                    <td>
                      <span className="pill pill-off">{d.status ?? "unknown"}</span>
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
