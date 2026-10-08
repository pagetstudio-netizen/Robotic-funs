---
name: Fortune wheel turns
description: Eligibility and wallet rules for free fortune-wheel turns and prizes.
---

The wheel is not a daily check-in reward. A referred user receives one free turn for each paid stable-product purchase; their sponsor receives one turn only when that user makes their first paid stable-product purchase. Free products, admin-assigned products, and activity products do not earn turns. Administrators can grant turns to an individual user. Each play consumes one turn, and the server selects the prize and credits it to the deposit balance.

The wheel page should display these exact informational messages without changing the eligibility rules:

> Chaque investissement réussi vous donne droit à une participation au tirage au sort.
>
> Si vous parvenez à inviter un utilisateur à s'inscrire, vous gagnez un tour de roue chanceux

The home-page button label is “Wheel of Fortune”.

The wheel must keep showing all nine labels from 100 to 35,000 FCFA, but never award more than 500 FCFA. Twenty percent of turns lose; the wheel stops on a divider, not a labeled amount, and no balance is credited. The remaining 80% are wins split 45/30/20/5 across 100/200/300/500 FCFA. Higher labels are display-only.

**Why:** the user specified referral- and purchase-earned turns, excluded offered products, assigned wheel prizes to the deposit balance, confirmed the newer wheel copy is informational only, set a hard 500 FCFA maximum while retaining the larger labels, and chose a 20% losing chance with losses landing between amounts. A 5% chance of 500 FCFA among winning turns keeps it rare. The home button label is “Wheel of Fortune.”

**How to apply:** enforce spin eligibility in the paid stable-purchase transaction regardless of the displayed copy; consume each win or loss atomically, credit only winning amounts from the capped payout pool, and animate losses to a segment divider. Keep administrative grants protected and auditable.
