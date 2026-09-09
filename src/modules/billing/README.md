# billing — этап 3

Всё, что связано с деньгами. Единственный модуль, который обращается к Stripe.

## Главное правило

> Источник правды о доступе — **наша база**, которую обновляют вебхуки.
> Ни одна страница не спрашивает Stripe API при отрисовке.

Иначе кабинет тормозит и падает вместе со Stripe.

## Второе правило

> Доступ выдаёт **только вебхук**, никогда не `success_url`.

`success_url` — это просто адрес, куда браузер вернулся. Его можно открыть
руками, до него можно не дойти. Оплата подтверждается событием от Stripe.

## Планируемый интерфейс

```ts
createCheckoutSession(userId, priceId, mode): Promise<{ url: string }>
createBillingPortalSession(userId): Promise<{ url: string }>
getSubscription(userId): Promise<Subscription | null>
listPayments(userId): Promise<Payment[]>
getPaymentMethod(userId): Promise<{ brand: string; last4: string } | null>
hasActiveAccess(userId): Promise<boolean>
handleWebhookEvent(event: Stripe.Event): Promise<void>
```

## Вебхуки, которые обрабатываем

| Событие | Действие |
|---|---|
| `checkout.session.completed` | создать подписку или зачислить кредиты |
| `customer.subscription.updated` | обновить статус, тариф, дату окончания |
| `customer.subscription.deleted` | закрыть доступ |
| `invoice.paid` | автопродление прошло — сдвинуть `current_period_end` |
| `invoice.payment_failed` | статус `past_due`, письмо пользователю |

Последние два — то, ради чего вебхуки нужны: через месяц Stripe спишет деньги
сам, и узнать об этом больше неоткуда.

## Требования

- Проверка подписи вебхука по **сырому** телу запроса (не распарсенному JSON).
- Идемпотентность: `stripe_event_id` пишется в `processed_events`, повтор
  игнорируется.
- Данные карты у нас не хранятся — только `brand` и `last4` для отображения.
- Суммы в центах, целыми числами. Никаких float.
- `price_id` берётся из переменных окружения: в test и live они разные.
