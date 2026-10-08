---
name: Toast notification appearance
description: User-specified toast style for John Deere routes and the RobotPay exception.
---

On John Deere routes, notifications should look like the supplied Android toast reference: a compact, centered, translucent charcoal popup, one large white exclamation mark, and centered white text. Use the same surface and icon for standard and destructive notifications. Keep the popup about 220 px wide, with a one-line title and at most three visible description lines so long messages do not make it excessively tall. Show standard and destructive toasts for 2.5 seconds; keep invitation-tab toasts at 3 seconds. Keep RobotPay's existing toast appearance unchanged.

**Why:** The user rejected an earlier light, branded card because it did not match the reference, said notifications should use consistent colors, and later specified brief toast display times (2.5 seconds generally, 3 seconds on the invitation tab) and shorter wrapping.

**How to apply:** When changing shared toast components, preserve the compact centered treatment, line limits, short entrance/exit animation, and reduced-motion support on John Deere routes. Keep the full text in the accessibility tree and keep the RobotPay route-specific legacy branch isolated unless the user explicitly expands the scope.