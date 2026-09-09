# billing — stage 3

Everything money-related. The only module that talks to Stripe.

## Rule one

> The source of truth for access is **our database**, kept current by
> webhooks. No page queries the Stripe API to render.

Otherwise the account area is slow and goes down together with Stripe.

## Rule two

> Access is granted **only by a webhook**, never by `success_url`.

`success_url` is just the address the browser returned to. It can be opened by
hand; it can also never be reached. Payment is confirmed by the Stripe event.

## Planned interface

```ts
createCheckoutSession(userId, priceId, mode): Promise<{ url: string }>
createBillingPortalSession(userId): Promise<{ url: string }>
getSubscription(userId): Promise<Subscription | null>
listPayments(userId): Promise<Payment[]>
getPaymentMethod(userId): Promise<{ brand: string; last4: string } | null>
hasActiveAccess(userId): Promise<boolean>
handleWebhookEvent(event: Stripe.Event): Promise<void>
```

## Webhooks we handle

| Event | Action |
|---|---|
| `checkout.session.completed` | create the subscription or add credits |
| `customer.subscription.updated` | update status, plan, period end |
| `customer.subscription.deleted` | close access |
| `invoice.paid` | renewal succeeded — advance `current_period_end` |
| `invoice.payment_failed` | mark `past_due`, email the user |

The last two are what webhooks exist for: a month from now Stripe charges the
card on its own, and there is no other way to learn about it.

## Requirements

- Webhook signature verified against the **raw** request body (not parsed JSON).
- Idempotency: `stripe_event_id` goes into `processed_events`, duplicates are
  ignored.
- Card data is never stored — only `brand` and `last4` for display.
- Amounts in cents, integers. No floats.
- `price_id` comes from environment variables: test and live differ.
