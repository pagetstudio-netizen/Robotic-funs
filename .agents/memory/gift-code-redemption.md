---
name: Gift-code redemption feedback
description: Keep confirmed gift-code rewards visible even if refreshing account data is slow.
---

After the server confirms a gift-code claim, trigger the chest animation and success message immediately. Refresh the displayed account balance asynchronously so a slow refresh cannot block confirmation of an already-credited reward. Rejected claims must not show success feedback.

**Why:** A user reported that a successful code entry did not open the chest or show its success message; waiting for the follow-up account refresh can delay or suppress that feedback.

**How to apply:** Use this ordering for gift-code claim UX and preserve the distinction between a successful claim response and a failed claim response.
