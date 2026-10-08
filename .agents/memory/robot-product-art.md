---
name: Robot product artwork
description: Product image source and assignment rules for stable and activity products.
---

Use the ten product images supplied by the user as the built-in image set for both stable and activity products. Administrators should not need to upload an image for each activity product. Assign by a `Robot-N` product name when present; otherwise use the product ID for a stable fallback.

On homepage product cards, display the matching `Robot-N` alias instead of the configured product name. Derive it from an existing `Robot-N` name first, or from the same product-ID mapping used for the fallback image. Do not rename stored product records or change product names in administration.

**Why:** The user provided these as the real product images for every product type and specifically asked homepage cards to show `Robot-N` instead of the configured product names.

**How to apply:** Keep product image selection centralized and make sure product lists, details, orders, and administration all use the same image mapping; limit the visible `Robot-N` label requirement to homepage cards.
