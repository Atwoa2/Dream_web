import { requireUser } from "@/lib/auth-server";
import { isConfigured, listEmbodiments } from "@/modules/dream-api";

export const dynamic = "force-dynamic";

const cams = (value: number | string[] | undefined) =>
  Array.isArray(value) ? value.join(", ") : value ?? "—";

export default async function EmbodimentsPage() {
  await requireUser();
  const embodiments = await listEmbodiments();
  const connected = isConfigured();

  return (
    <>
      <h1 className="page-title">Embodiments</h1>
      <p className="page-sub">
        Robot bodies the model can drive: their proprioception and action
        spaces, and camera setups.
      </p>

      {!connected && (
        <div className="notice" style={{ marginBottom: "1rem" }}>
          Robot backend is not connected. Set DREAM_API_URL and
          DREAM_API_TOKEN to see live embodiments.
        </div>
      )}

      <section className="card">
        <h2>Embodiments</h2>
        {embodiments.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No embodiments yet.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Proprio dim</th>
                  <th>Action dim</th>
                  <th>Cameras</th>
                </tr>
              </thead>
              <tbody>
                {embodiments.map((e, i) => (
                  <tr key={e.id ?? i}>
                    <td>{e.name ?? e.id ?? "—"}</td>
                    <td className="muted">{e.description ?? "—"}</td>
                    <td>{e.proprio_dim ?? "—"}</td>
                    <td>{e.action_dim ?? "—"}</td>
                    <td>{cams(e.cameras)}</td>
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
