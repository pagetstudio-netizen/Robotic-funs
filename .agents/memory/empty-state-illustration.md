---
name: Empty-state illustration
description: Use the user-supplied illustration for genuine empty results while preserving loading, error, and payment-progress states.
---

Use the latest user-supplied illustration for genuine no-data and no-results states across customer pages, Admin, Banker, the standard deposit flow, and RobotPay’s empty-operator list. Preserve each state’s existing message and helper text.

**Why:** On 2026-10-08, the user supplied a new empty-state illustration and asked to show it on all pages with no content, replacing the previously selected artwork.

**How to apply:** Use the shared empty-state component whenever a data/result list is empty. Do not show it during loading, API errors, disabled states, or payment progress; do not change RobotPay colors or layout.