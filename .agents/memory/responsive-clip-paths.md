---
name: Responsive clip paths
description: Browser compatibility for percentage coordinates in CSS path() and responsive SVG clipping.
---

Chromium rejects percentage coordinates inside CSS `clip-path: path(...)` strings. For responsive curves, use an SVG `<clipPath clipPathUnits="objectBoundingBox">` with normalized coordinates as the rendered shape. If exact source syntax is required, keep the requested `path()` declaration but do not rely on it for rendering.

**Why:** The share-page banner specification used percentages in `path()`. Chromium ignored that value, which would have left the card rectangular without a responsive SVG fallback.

**How to apply:** Check support with `CSS.supports()` for the exact value. Use a normalized SVG clip path for the actual responsive shape whenever the CSS path contains percentages.
