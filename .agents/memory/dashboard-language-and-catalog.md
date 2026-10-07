---
name: Dashboard language and catalog
description: French interface and real FCFA catalog requirements for the home dashboard.
---

Keep the user-facing site in French and do not modify browser tabs or browser chrome. The home dashboard must display real active catalog products and their actual FCFA prices and daily earnings; screenshot examples such as “Robot-1” and “Robot-2” are not product data. The five-tab navigation must remain available across authenticated pages, and its “Produits” tab must lead to the user’s purchased products rather than the available-offers catalog.

**Why:** The user explicitly asked to keep the site in French, leave browser tabs untouched, use real products in FCFA, and keep the five-tab navigation available across pages with purchases under “Produits.”

**How to apply:** Localize dashboard banners, labels, actions, and dialogs. Preserve the live product API and purchase flow when changing the dashboard layout; never replace actual catalog data with visual placeholders. Route “Produits” to the authenticated user-product list while keeping available offers on their separate purchase route.
