---
name: Withdrawal product eligibility
description: Stable-product requirement for user withdrawals.
---

A user must have at least one active stable-product position to request a withdrawal. An activity-only position or a completed stable position does not qualify.

**Why:** the user requires withdrawals to depend specifically on an active stable product, rather than any historical or activity-product purchase.

**How to apply:** enforce this condition on the server before changing the user's balance or creating a withdrawal, and keep the withdrawal UI's eligibility message consistent.
