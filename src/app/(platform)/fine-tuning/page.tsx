import { requireUser } from "@/lib/auth-server";
import { isConfigured, listFineTuningJobs } from "@/modules/dream-api";

export const dynamic = "force-dynamic";

export default async function FineTuningPage() {
  await requireUser();
  const jobs = await listFineTuningJobs();
  const connected = isConfigured();

  return (
    <>
      <h1 className="page-title">Fine-tuning</h1>
      <p className="page-sub">
        Pick a ready dataset, name the output model, set hyperparameters. The
        job queues on our cluster. Billed as GPU hours per job, plus hosting of
        the resulting model.
      </p>

      {!connected && (
        <div className="notice" style={{ marginBottom: "1rem" }}>
          Robot backend is not connected. Set DREAM_API_URL and
          DREAM_API_TOKEN to see live jobs.
        </div>
      )}

      <section className="card">
        <h2>Jobs</h2>
        {jobs.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No jobs yet.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Dataset</th>
                  <th>Output model</th>
                  <th>GPU hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => (
                  <tr key={job.id ?? i}>
                    <td>
                      <code>{job.id ?? "—"}</code>
                    </td>
                    <td>{job.dataset ?? job.dataset_id ?? "—"}</td>
                    <td>{job.output_model ?? "—"}</td>
                    <td>{job.gpu_hours ?? "—"}</td>
                    <td>
                      <span className="pill pill-off">{job.status ?? "unknown"}</span>
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
