## Falcon-Sponsored Offers

### Overview

This supports adding an extra, Falcon-sponsored offer that we can append to an ad response to lift the overall offer performance of every offer in the unit. When one applies, it arrives as an additional offer on top of the normal offer count requested or returned.

Supporting it is **additive**. If you already render offers from [`GET /api/odata`](/integration-guide/publisher-integration/odata-api), the sponsored offer itself renders like any other offer. The one piece of real integration work is the **tease bar**: when a sponsored offer is present, you display a teaser on every preceding offer so the customer knows the free gift is coming.

> This guide is for **publishers and partners that render OData offers directly via the API**. If you use a Falcon SDK or one of the pre-built ad units — [Shopify Ad Unit (Preact)](/integration-guide/partner-integration/shopify-ad-unit-preact) or the [Android](/integration-guide/android) / [iOS](/integration-guide/ios/integration) SDK — this is already handled for you and there's nothing to do here.

### Detect that a sponsored offer is present

The `/api/odata` response is `{ offers: [...], templateData: {...}, template, ... }`. Read `templateData`:

```json
"templateData": {
  "hasInspired": true,
  "teaseMessage": "A free $10 donation gift to the cause of your choice is included when you claim this offer"
}
```

- `hasInspired === true` → a sponsored offer is present. It is always the **last** element of `offers` — `offers[offers.length - 1]`.
- `teaseMessage` → the exact copy for the tease bar. Render it **verbatim**; don't write your own.
- `hasInspired` absent or `false` → nothing extra to do; render offers exactly as you do today.

> **It adds one offer beyond the count you requested.** The sponsored offer is appended on top of your requested offers, so if you request the default of `4` you'll get `5`; request `10`, you'll get `11`. Always size your UI and loops off the actual `offers.length`, **not** the `count` you asked for.

### The main task: show the tease bar on every offer except the sponsored one

This is the part that's different from a normal integration. When `hasInspired` is `true`, show a tease bar carrying `templateData.teaseMessage` on **every offer except the sponsored one** — that is, on `offers[0]` through `offers[offers.length - 2]`. The bar teases the upcoming free gift while the customer moves through the ranked offers; once they reach the sponsored offer itself (the last one), it disappears because the gift is now shown directly.

Offers are typically presented one at a time in a carousel, and you already track which offer is active. **Tease-bar visibility is just derived state off that index** — there's no separate API call, nothing to re-fetch, and no per-offer request. Recompute one boolean whenever the active offer changes:

```js
const isInspired   = !!templateData.hasInspired && !!templateData.teaseMessage;
const isLastOffer  = currentIndex === offers.length - 1;
const showTeaseBar = isInspired && !isLastOffer;

// when showTeaseBar, render templateData.teaseMessage in the footer
```

This mirrors Falcon's own ad-unit implementation. (If your placement instead renders all offers at once as a list, the rule is identical — show the bar on every offer whose index isn't `offers.length - 1`.)

**Placement:** the tease bar lives in the offer's **footer**, at the bottom — below the offer body and the redeem / "No thanks" (decline) actions, grouped with the terms / privacy-policy links. Render `teaseMessage` **verbatim**; Falcon's templates pair it with a small gift icon.

### Render the sponsored offer — like any other offer

Nothing special here. The sponsored offer follows the standard offer contract, so render it from its own `title`, `description`, and `ctaText` just as you render every other offer. Two small things to be aware of:

- Some fields (`header`, `shortDescription`, `disclaimer`, `value`, `termsUrl`) may be empty or `null` — render what's present and let `title` stand as the heading.
- For the banner image, grab the **first `icon`-type image** from the `images` array — the same array you already use for every offer:

```js
const bannerUrl = offer.images.find((img) => img.type === 'icon')?.publicUrl;
```

```json
{
  "bannerId": "FAL_1",
  "title": "Here's a free $10 donation gift",
  "description": "Send this $10 donation gift to a cause you love, at no cost to you. Powered by Inspired.",
  "ctaText": "Select your cause",
  "clickUrl": "https://pr-api.falconlabs.us/click?...",
  "beaconUrl": "https://pr-api.falconlabs.us/vdata?...",
  "closeUrl": "https://pr-api.falconlabs.us/close?...",
  "images": [
    { "publicUrl": "https://images.falconlabs.us/demand/.../icon-d48829ca7a9a.jpg", "type": "icon", "tags": [] },
    { "publicUrl": "https://images.falconlabs.us/demand/.../icon-b7fe552349e5.png", "type": "icon", "tags": ["INSPIRED", "SPECIAL"] }
  ]
}
```

### Tracking beacons — same as any offer

Every offer, sponsored or not, ships with the same pre-built tracking URLs. Fire them with a plain `GET`; do **not** construct or modify them.

| Field | When to fire |
| --- | --- |
| `beaconUrl` | when the offer becomes visible (impression / view) — see [Impression API](/integration-guide/publisher-integration/impression-api) |
| `clickUrl` | when the user claims / clicks it — this is also the navigation target — see [Click API](/integration-guide/publisher-integration/click-api) |
| `closeUrl` | when the user dismisses it |

### Summary

1. Call [`GET /api/odata`](/integration-guide/publisher-integration/odata-api) — unchanged.
2. Read `templateData.hasInspired`. If `false`/absent, you're done — render offers as today.
3. If `true`, render `templateData.teaseMessage` as a tease bar on **every offer except the last**, and hide it on the sponsored (last) offer.
4. Expect **one more offer** than you requested — drive off `offers.length`.
5. Render the sponsored offer like any other offer, and fire its `beaconUrl` / `clickUrl` / `closeUrl` as usual.
