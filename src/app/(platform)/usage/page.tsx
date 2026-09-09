import { requireUser } from "@/lib/auth-server";
import { getUsageSummary, listRecentUsage } from "@/modules/api-keys";
import { getCreditsBalance } from "@/modules/billing";

export const dynamic = "force-dynamic";

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );

export default async function UsagePage() {
  const user = await requireUser();
  const [summary, recent, creditsCents] = await Promise.all([
    getUsageSummary(user.id),
    listRecentUsage(user.id),
    getCreditsBalance(user.id),
  ]);

  return (
    <>
      <h1 className="page-title">Usage</h1>
      <p className="page-sub">
        Metering is per API key on the server; this view aggregates your
        account. Calls are billed from your prepaid credit balance.
      </p>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Requests</div>
          <div className="stat-value">{summary.requests.toLocaleString("en-US")}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Tokens in</div>
          <div className="stat-value">{summary.tokensIn.toLocaleString("en-US")}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Tokens out</div>
          <div className="stat-value">{summary.tokensOut.toLocaleString("en-US")}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Spent</div>
          <div className="stat-value">{money(summary.costCents)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Credits left</div>
          <div className="stat-value">{money(creditsCents)}</div>
        </div>
      </div>

      <section className="card">
        <h2>Recent requests</h2>
        {recent.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No API calls yet. Usage appears here once the gateway starts
            serving your keys.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Model</th>
                  <th>Tokens in</th>
                  <th>Tokens out</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((u) => (
                  <tr key={u.id}>
                    <td className="muted">
                      {u.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                    </td>
                    <td>
                      <code>{u.model}</code>
                    </td>
                    <td>{u.tokensIn.toLocaleString("en-US")}</td>
                    <td>{u.tokensOut.toLocaleString("en-US")}</td>
                    <td>{money(u.costCents)}</td>
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
