# audit

Write-only journal of sensitive actions (sign-ins, key issuance/revocation,
email changes). Answers "who and when" after an incident.

Cross-domain by nature, so it is its own tiny module — any service may call
`recordAudit`, and the table has exactly one writer path.
