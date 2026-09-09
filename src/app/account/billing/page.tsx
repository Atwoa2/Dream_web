/**
 * Billing tab. Reads OUR tables only (filled by Stripe webhooks) — the page
 * stays fast and up even when Stripe is not.
 */
import { requireUser } from "@/lib/auth-server";
import {
  getCreditsBalance,
  getPaymentMethod,
  getSubscription,
  listPayments,
} from "@/modules/billing";
import { BillingActions } from "./billing-actions";

function money(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amountCents / 100,
  );
}

export default async function BillingPage() {
  const user = await requireUser();
  const [subscription, payments, card, creditsCents] = await Promise.all([
    getSubscription(user.id),
    listPayments(user.id),
    getPaymentMethod(user.id),
    getCreditsBalance(user.id),
  ]);

  return (
    <>
      <section className="card">
        <h2>Plan</h2>
        {subscription ? (
          <>
            <div className="row">
              <span className="muted">Status</span>
              <span>{subscription.status}</span>
            </div>
            <div className="row">
              <span className="muted">
                {subscription.cancelAtPeriodEnd ? "Access until" : "Renews on"}
              </span>
              <span>{subscription.currentPeriodEnd.toISOString().slice(0, 10)}</span>
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            No active subscription.
          </p>
        )}
        <BillingActions hasSubscription={subscription !== null} />
      </section>

      <section className="card">
        <h2>Credits</h2>
        <div className="row">
          <span className="muted">Balance</span>
          <span>{money(creditsCents, "usd")}</span>
        </div>
      </section>

      <section className="card">
        <h2>Payment method</h2>
        {card ? (
          <div className="row">
            <span className="muted">Card</span>
            <span style={{ textTransform: "capitalize" }}>
              {card.brand} •••• {card.last4}
            </span>
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            No card on file. It is saved during your first checkout and managed
            in the billing portal.
          </p>
        )}
      </section>

      <section className="card">
        <h2>Payment history</h2>
        {payments.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No payments yet.
          </p>
        ) : (
          payments.map((p) => (
            <div className="row" key={p.id}>
              <span className="muted">
                {p.createdAt.toISOString().slice(0, 10)} — {p.description ?? "Payment"}
              </span>
              <span>
                {money(p.amountCents, p.currency)}{" "}
                {p.invoiceUrl && (
                  <a href={p.invoiceUrl} target="_blank" rel="noreferrer">
                    invoice
                  </a>
                )}
              </span>
            </div>
          ))
        )}
      </section>
    </>
  );
}
