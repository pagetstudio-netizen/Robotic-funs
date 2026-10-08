---
name: Activity product purchase rules
description: Per-launch buyer restrictions and global activity-product stock limits.
---

Users must first complete a paid purchase of a stable product before buying any activity product. An activity product may cost no more than the highest-priced single stable product the user has paid for; lower-priced activity products and an equal price are allowed. Do not display this eligibility warning or disable activity purchase buttons in advance; show the rejection message only when an ineligible user confirms an attempted purchase. For each scheduled activity launch, a user may buy only one activity product, even when several products share that launch. A later launch means a different scheduled local date/time. Each product’s optional stock limit is a cap on distinct users who buy that product; admin-assigned positions do not consume places. Keep sold-out products visible, but block further purchases. Store the launch schedule on each purchased position so later product edits do not rewrite its purchase cohort.

**Why:** the user requires a paid stable purchase as a prerequisite and capped the activity purchase at the highest amount of any single paid stable product, with the restriction disclosed only during an attempted purchase; they also require one activity purchase per user per launch and an administrator-set number of places per product, with sold-out offers remaining visible.

**How to apply:** enforce the stable-purchase prerequisite, single-purchase amount ceiling, and per-launch restriction on the server within the purchase transaction; show server rejection through the purchase flow only, count distinct non-admin purchasers against stock, and keep the schedule check consistent with the country-specific local launch clock.
