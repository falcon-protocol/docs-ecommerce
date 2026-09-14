## Falcon Rewarded Perks

### Overview

Falcon Rewarded Perks are offers that unlock an additional reward once the user claims them. The user claims the perk, and a second gift is unlocked on top of it.

Example: the user claims a 60-day free trial, which is the first perk shown in the unit, and that unlocks a free $10 donation gift for a cause of their choice. The donation gift is one reward type; other reward types are also available.

**Why turn this on**

- Higher user engagement with the offers in the unit, since there is a reason to claim rather than skip.
- A better experience for the user, who gets something back for engaging.
- Stronger monetization performance across every offer in the unit, not just the perk itself.

**What the integration involves**

This supports adding an extra, Falcon-funded perk that we append to an ad response. When one applies, it arrives as an additional offer on top of the normal offer count requested or returned.

Supporting it is **additive**. If you already render offers from [`POST /api/odata`](/integration-guide/publisher-integration/odata-api), the perk itself renders like any other offer. The one piece of real integration work is the **tease bar**: when a perk is present, you display a teaser on every preceding offer so the customer knows the reward is coming.

> This guide is for **publishers and partners that render OData offers directly via the API**. If you use a Falcon SDK or one of the pre-built ad units, [Shopify Ad Unit (Preact)](/integration-guide/partner-integration/shopify-ad-unit-preact) or the [Android](/integration-guide/android) / [iOS](/integration-guide/ios/integration) SDK, this is already handled for you and there's nothing to do here.

### What it looks like

<!-- IMAGE PENDING: mockup from Nati. Do not capture the live demo as-is, the return-from-click state still shows the wrong message. -->

*One example of a Rewarded Perk. The reward shown here is a donation gift; other reward types are available.*

### Detect that a perk is present

The `/api/odata` response is `{ offers: [...], templateData: {...}, template, ... }`. Read `templateData`:

```json
"templateData": {
  "hasInspired": true,
  "teaseMessage": "A free $10 donation gift to the cause of your choice is included when you claim this offer"
}
```

- `hasInspired === true` means a perk is present. It is always the **last** element of `offers`, `offers[offers.length - 1]`.
- `teaseMessage` is the exact copy for the tease bar. Render it **verbatim**, don't write your own.
- `hasInspired` absent or `false` means nothing extra to do, render offers exactly as you do today.

> **It adds one offer beyond the count you requested.** The perk is appended on top of your requested offers, so if you request the default of `4` you'll get `5`; request `10`, you'll get `11`. Always size your UI and loops off the actual `offers.length`, **not** the `count` you asked for.

### The main task: show the tease bar on every offer except the perk

This is the part that's different from a normal integration. When a perk is present, show a tease bar carrying `templateData.teaseMessage` on **every offer except the perk itself**, that is, on `offers[0]` through `offers[offers.length - 2]`. The bar teases the upcoming reward while the customer moves through the ranked offers. Once they reach the perk (the last one), it disappears because the reward is now shown directly.

Offers are typically presented one at a time in a carousel, and you already track which offer is active. **Tease-bar visibility is just derived state off that index.** There's no separate API call, nothing to re-fetch, and no per-offer request. Recompute one boolean whenever the active offer changes:

```js
const hasRewardedPerk = !!templateData.hasInspired && !!templateData.teaseMessage;
const isLastOffer     = currentIndex === offers.length - 1;
const showTeaseBar    = hasRewardedPerk && !isLastOffer;

// when showTeaseBar, render templateData.teaseMessage in the footer
```

This mirrors Falcon's own ad-unit implementation. If your placement instead renders all offers at once as a list, the rule is identical: show the bar on every offer whose index isn't `offers.length - 1`.

**Placement:** the tease bar lives in the offer's **footer**, at the bottom, below the offer body and the redeem / "No thanks" (decline) actions, grouped with the terms / privacy-policy links. Render `teaseMessage` **verbatim**. Falcon's templates pair it with a small gift icon.

### On click, jump straight to the perk

The tease bar promises a reward, so a click has to deliver it, otherwise the tease doesn't make sense. Implement this in your click handler: when a perk is present and the customer **claims an offer that showed the tease bar** (any offer before the last), don't advance to the next offer in sequence. **Skip the intermediate offers and jump directly to the perk** (`offers.length - 1`) so they can claim the reward.

Only the redeem / claim action jumps. "No thanks" (decline) still advances sequentially to the next offer as usual, and once the customer is already on the perk there's nowhere left to jump.

```js
function onClickOffer() {
  // ... your normal click tracking (fire clickUrl) ...

  const lastIndex = offers.length - 1;

  // Already on the perk (last offer) — end of the flow.
  if (currentIndex >= lastIndex) {
    onEndOfOffers();
    return;
  }

  // Teased offer was claimed → jump straight to the reward.
  if (templateData.hasInspired) {
    setCurrentIndex(lastIndex);
    return;
  }

  // Default: advance one offer.
  setCurrentIndex(currentIndex + 1);
}
```

This mirrors Falcon's own ad-unit flow. Without it, a customer who claims a teased offer would never reach the reward you promised.

### Render the perk like any other offer

Nothing special here. The perk follows the standard offer contract, so render it from its own `title`, `description`, and `ctaText` just as you render every other offer. Two small things to be aware of:

- Some fields (`header`, `shortDescription`, `disclaimer`, `value`, `termsUrl`) may be empty or `null`. Render what's present and let `title` stand as the heading.
- For the banner image, grab the **first `icon`-type image** from the `images` array, the same array you already use for every offer:

```js
const bannerUrl = offer.images.find((img) => img.type === 'icon')?.publicUrl;
```

```json
{
  "bannerId": "FAL_1",
  "title": "Here's a free $10 donation gift",
  "description": "Send this $10 donation gift to a cause you love, at no cost to you.",
  "ctaText": "Select your cause",
  "clickUrl": "https://pr-api.falconlabs.us/click?...",
  "beaconUrl": "https://pr-api.falconlabs.us/vdata?...",
  "closeUrl": "https://pr-api.falconlabs.us/close?...",
  "images": [
    { "publicUrl": "https://images.falconlabs.us/demand/.../icon-d48829ca7a9a.jpg", "type": "icon", "tags": [] },
    { "publicUrl": "https://images.falconlabs.us/demand/.../icon-b7fe552349e5.png", "type": "icon", "tags": ["SPECIAL"] }
  ]
}
```

### Tracking beacons, same as any offer

Every offer, perk or not, ships with the same pre-built tracking URLs. Fire them with a plain `GET`. Do **not** construct or modify them.

| Field | When to fire |
| --- | --- |
| `beaconUrl` | when the offer becomes visible (impression / view), see [Impression API](/integration-guide/publisher-integration/impression-api) |
| `clickUrl` | when the user claims / clicks it, this is also the navigation target, see [Click API](/integration-guide/publisher-integration/click-api) |
| `closeUrl` | when the user dismisses it |

### Summary

1. Call [`POST /api/odata`](/integration-guide/publisher-integration/odata-api), unchanged.
2. Read the perk flag on `templateData`. If `false` or absent, you're done, render offers as today.
3. If `true`, render `templateData.teaseMessage` as a tease bar on **every offer except the last**, and hide it on the perk itself.
4. When a customer **claims a teased offer**, jump straight to the perk (`offers.length - 1`) instead of advancing one step.
5. Expect **one more offer** than you requested, drive off `offers.length`.
6. Render the perk like any other offer, and fire its `beaconUrl` / `clickUrl` / `closeUrl` as usual.
