# Embedded SDK — Event Callbacks (Advanced)

> **Advanced / optional.** Most embedded integrations only need the standard `FalconAds.init()` call. These callbacks are for integrations that want to hook the ad lifecycle into their own analytics or app logic. They require writing custom JavaScript and are **not** needed for the ad unit to function.

## Overview

`FalconAds.init()` accepts five optional event callbacks across the ad lifecycle: `onShow`, `onView`, `onClick`, `onClose`, and `onReady`.

They are **client-side JS callbacks** — you pass plain functions, and the SDK invokes them in the visitor's browser. There is no endpoint, webhook, or server-to-server call involved.

## When to use it

Use these callbacks only if you need to:

- Forward lifecycle events to your own analytics (e.g. GA4, Segment, an internal pipeline).
- Gate host-page behavior on the ad unit's readiness or visibility.
- Correlate shows, views, and clicks for a single offer.

To simply render the ad, you don't need any of this — the standard `FalconAds.init()` call is enough.

## Quick start

```html
<div id="falcon-ads-container"></div>
<script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/embedded-sdk.js"></script>
<script>
  FalconAds.init({
    apiKey: "YOUR_API_KEY",
    containerId: "falcon-ads-container",
    placementId: "YOUR_PLACEMENT_ID",
    onShow: (data) => myAnalytics.track("falcon_show", data),
    onView: (data) => myAnalytics.track("falcon_view", data),
    onClick: (data) => myAnalytics.track("falcon_click", data),
    onClose: (ctx) => myAnalytics.track("falcon_close", ctx),
    onReady: (isReady) => console.log("falcon ready:", isReady),
  });
</script>
```

## Callback reference

| Callback  | Fires when                                              | Payload                                                          |
| --------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `onShow`  | Offer rendered (impression), once per offer             | `{ index, offer }`                                              |
| `onView`  | Offer viewable (IAB/MRC: ≥50% for ≥1s), once per offer  | `{ index, offer, viewedAt, timeToView, viewabilityMethod }`    |
| `onClick` | Visitor clicks an offer                                 | `{ index, offer }`                                              |
| `onClose` | Ad unit closed                                          | `{ offer, closeType }`                                          |
| `onReady` | Ready state changes                                     | `boolean`                                                       |

`index` and `offer` are shared across `onShow` / `onView` / `onClick` so you can correlate them for a single offer. Think of **show** as "we rendered it" and **view** as "the visitor could actually see it."

## TypeScript

These callbacks extend the [`FalconAdsConfig`](/integration-guide/embedded#configuration) interface. All five are optional:

```typescript
interface FalconAdsConfig {
  // ...existing required fields (apiKey, containerId, placementId)

  /** Fires when an offer is rendered (impression), once per offer. */
  onShow?: (data: OfferEvent) => void;
  /** Fires when an offer becomes viewable (IAB/MRC), once per offer. */
  onView?: (data: ViewEvent) => void;
  /** Fires when the visitor clicks an offer. */
  onClick?: (data: OfferEvent) => void;
  /** Fires when the ad unit is closed. In the embedded integration the
   *  context is always populated; `null` only occurs in other SDK modes. */
  onClose?: (ctx: CloseContext | null) => void;
  /** Fires whenever the ready state changes. Not one-shot. */
  onReady?: (isReady: boolean) => void;
}

interface OfferEvent {
  /** Zero-based position of the offer within the ad unit. */
  index: number;
  /** The offer that triggered the event. */
  offer: Offer;
}

interface ViewEvent extends OfferEvent {
  /** Timestamp (ms epoch) when the offer became viewable. */
  viewedAt: number;
  /** Time from render to viewable, in ms. May be null. */
  timeToView: number | null;
  /** How viewability was measured (e.g. "IntersectionObserver"). */
  viewabilityMethod: string;
}
```

## Requirements & ordering

- The container element must exist **before** the script tag; call `init()` after the script loads.
- The page must be served over `http`/`https`, not `file://`.
- Requires the embedded bundle at `sdk/v1/embedded-sdk.js` (the global `FalconAds`). Stale cached copies of an older bundle won't expose these callbacks.

## Behavior notes

- **`onClose` identifies the closed offer** — its context carries `{ offer, closeType }`: which offer was closed and why. (TypeScript users will see the type `CloseContext | null` — the `null` is a shared-SDK artifact that the embedded integration never produces, so optional chaining like `ctx?.offer` is fine if you prefer it, but isn't required.)
- **`onReady` reflects the unit's ready state** and may toggle more than once over the lifecycle — treat it as "ready changed," not a one-time "initialized" signal.
- **Exceptions thrown from your callback aren't caught by the SDK** — they surface in the console — but they don't affect the ad or its tracking.
- **`timeToView` may be `null`** — treat it as optional.
