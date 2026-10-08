---
name: Toast notification appearance
description: User-specified toast style for John Deere routes and the RobotPay exception.
---

On John Deere routes, notifications should look like the supplied Android toast reference: a compact, centered, translucent charcoal popup, one large white exclamation mark, and centered white text. Use the same surface and icon for standard and destructive notifications. Keep the popup about 220 px wide, let its height fit short content, and limit it to a one-line title and at most three visible description lines. Show all toasts for 2.5 seconds on every route. Keep RobotPay's existing toast appearance unchanged while using the same duration.

**Why:** The user rejected an earlier light, branded card because it did not match the reference, asked for a smaller popup, consistent colors, and a 2.5-second duration everywhere.

**How to apply:** When changing shared toast components, preserve the compact centered treatment, line limits, short entrance/exit animation, and reduced-motion support on John Deere routes. Remove dismissed toasts promptly after the exit animation so they do not linger visibly. Keep the full text in the accessibility tree and keep the RobotPay route-specific legacy branch isolated unless the user explicitly expands the scope.