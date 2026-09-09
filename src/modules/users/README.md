# users

User profile: creation, lookup, Stripe Customer linkage.

**Responsible for:** the `users` table, the "one email — one account" rule.

**Not responsible for:** signing in and sessions (that is `auth`), money
(that is `billing`).

The key function is `findOrCreateByEmail`. Email-code sign-in and Google
sign-in both land in the same account when the address matches.
