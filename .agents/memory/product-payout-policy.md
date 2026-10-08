---
name: Product payout policy
description: The agreed earnings policy for purchased stable and activity products.
---

Stable and activity products accrue the configured daily amount for calculation, but pay gains only once at the end of the product period. On homepage cards, stable products show the daily amount under “Gains journaliers”; activity products show the full-period return under “Gains à l’échéance”. This display distinction does not change payout timing. Existing positions remain active and transition to this policy; any gains already credited before the transition count toward the promised total and must be deducted from the maturity payment. Free daily check-in bonuses are separate from product earnings.

**Why:** the user explicitly replaced daily product payouts with a single maturity payout, specified distinct home-card display values for stable and activity products, and chose to preserve existing positions rather than delete them.

**How to apply:** never credit purchased-product earnings through a daily or manual-claim path. On maturity, atomically complete the position, credit only the unpaid remainder, and create at most one final earning transaction.
