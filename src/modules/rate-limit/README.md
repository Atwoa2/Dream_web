# rate-limit

Limits how often actions happen: email code requests, sign-in attempts, API
calls.

Algorithm — fixed window, counters in PostgreSQL. Redis is deliberately not
used: at our volumes the database copes fine and the team gets one less
service to run. The interface (`enforceLimit`) does not depend on the store —
if we ever hit a wall, the implementation swaps to Upstash without touching
calling code.
