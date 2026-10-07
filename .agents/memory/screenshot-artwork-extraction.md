---
name: Screenshot artwork extraction
description: Reusing distinctive artwork embedded in full-resolution mobile references.
---

When a reference screenshot contains distinctive artwork but no separate source asset, crop it from the original-resolution capture and isolate its silhouette. Keep animation on separate layers so the recovered artwork remains unchanged.

**Why:** The treasure chest existed only inside the supplied screenshot; extracting it retained its original appearance while CSS animated the light rays around it.

**How to apply:** Use full-resolution source pixels with the measured screenshot scale, then verify alpha edges against the intended page background.
