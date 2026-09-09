/**
 * Billing tab — stage 3 fills this with real data.
 *
 * The layout is final on purpose: plan card, payment method, payment history.
 * Stage 3 only swaps the placeholders for rows from our own tables
 * (populated by Stripe webhooks — see src/modules/billing/README.md).
 */
export default function BillingPage() {
  return (
    <>
      <section className="card">
        <h2>Plan</h2>
        <p className="muted" style={{ margin: 0 }}>
          No active subscription. Plans become available when payments launch
          (stage 3).
        </p>
      </section>

      <section className="card">
        <h2>Payment method</h2>
        <p className="muted" style={{ margin: 0 }}>
          No card on file. Cards are added during the first checkout and
          managed via the Stripe Billing Portal.
        </p>
      </section>

      <section className="card">
        <h2>Payment history</h2>
        <p className="muted" style={{ margin: 0 }}>
          No payments yet.
        </p>
      </section>
    </>
  );
}
