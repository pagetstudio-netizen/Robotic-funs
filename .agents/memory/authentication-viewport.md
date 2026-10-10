---
name: Authentication viewport
description: Persistent layout and field-icon requirements for login and registration.
---

The login and registration pages must stay fixed to the viewport without page scrolling. Keep the supplied phone icon on the phone field, lock icon on both password fields, and account icon on the invitation-code field. Keep the selected phone-country prefix visibly rendered: the base auth redesign hides it, so the screenshot/auth override must explicitly restore its display with sufficient specificity.

**Why:** The user explicitly repeated that the authentication page must be fixed and provided these field icons. The country value was being updated correctly but remained invisible because stylesheet chunk order allowed the base hidden rule to win.

**How to apply:** When changing login or registration layouts, fit the controls within the viewport at mobile sizes instead of enabling page-level scrolling, retain the user-provided field-icon assignments, and verify the country prefix after selecting another country.
