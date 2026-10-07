---
name: Mobile screenshot scale
description: Deriving CSS viewport dimensions from original mobile captures during RoboticsFund UI matching.
---

For full-resolution mobile screenshots, inspect the original attachment dimensions and estimate its device-pixel ratio before measuring layout. An 864px-wide phone capture may represent a 432px CSS viewport at DPR 2; the chat-rendered thumbnail is not a CSS measurement. Check the inferred scale against several fixed landmarks, such as the card width, top inset, and bottom navigation boundary. Do not assume every screenshot uses DPR 2.

**Why:** Measuring the account reference from its displayed thumbnail initially made the CSS card about 18.5% too large; original image dimensions and multiple layout anchors showed the 2× capture scale.

**How to apply:** For future screenshot recreation, inspect the source image dimensions, infer the CSS viewport from device scale and screen boundaries, then compare key geometry in an isolated preview at that viewport.
