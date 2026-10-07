---
name: Brand theme isolation
description: Route-scoped RoboticsFund palette and RobotPay visual exclusion.
---

Apply RoboticsFund branding throughout the application except `/robotpay`. Keep RobotPay's existing appearance isolated from the new brand scope.

**Why:** The user requested RoboticsFund branding while the existing project instruction preserves `/robotpay` as a visually separate route.

**How to apply:** Keep brand styles scoped to non-RobotPay routes. Preserve RobotPay's legacy theme and avoid generic CSS or shared visual changes that leak into that route.