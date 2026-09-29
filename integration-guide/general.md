---
title: "General Web Integration"
---

# General Web Integration

## Overview

The Falcon General SDK serves both ad formats — **overlay** and **embedded** — from one bundle. You write one integration; Falcon selects the format per user.

This is the recommended Web SDK for new integrations. Moving from Unified? See [Migrating from the Unified SDK](#migrating-from-the-unified-sdk).

## Integration

### Step 1: Add the SDK Script

```html
<script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/falcon-general-sdk.js"></script>
```

> **Staging:** Use `https://d6y5cd3imay52.cloudfront.net/sdk/staging/falcon-general-sdk.js` and your staging API key while testing. See [Staging Environment](./partner-integration/staging-environment) for the full URL reference across the Web SDKs.

### Step 2: Add a Container Element

A container is required in both modes, and must exist in the DOM before `init()` is called.

```html
<div id="falcon-ads-container" style="width: 580px; height: 260px;"></div>
```

Recommended minimum dimensions: **580×260px** desktop, **479×400px** mobile.

> **Note:** In embedded mode the offer's height adjusts to its own content rather than filling the container. See [Container Sizing](./embedded#container-sizing).
>
> For overlay, keep the container out of any ancestor with `transform`, `filter` or `contain` — on older browsers the offer stays trapped inside it.

### Step 3: Initialize

```javascript
FalconGeneralSDK.init({
  apiKey: "YOUR_API_KEY",
  containerId: "falcon-ads-container",
  placementId: "YOUR_PLACEMENT_ID",
});
```

### With Order Attributes

Pass order and customer data via `attributes` for revenue attribution and offer targeting — see the [Embedded guide's attribute reference](./embedded#attribute-reference) for the full field list:

```javascript
FalconGeneralSDK.init({
  apiKey: "YOUR_API_KEY",
  containerId: "falcon-ads-container",
  placementId: "YOUR_PLACEMENT_ID",
  attributes: {
    orderId: "ORD-123456",
    hashedEmail: "SHA256_HEX_OF_EMAIL_LOWERCASE",
    category: "Electronics",
    subcategory: "Headphones",
    amount: "99.99",
    currency: "USD",
  },
});
```

## Fetch First, Render Later

By default `init()` fetches and renders in one step, so the container has to be on the page before you know whether there is an offer. If you need to know first, split it into two steps. This is common when the offer lives in UI you only open when there is something to show, such as a modal after an RSVP, a sign-up or any other confirmation. It works for checkout and non-checkout flows alike.

1. **Fetch.** Call [`/api/odata`](./partner-integration/odata-api) with `isPreview=true` and a `sessionId` you generate. No SDK and no container are needed. If `offers` is non-empty, an offer is available.
2. **Decide.** Show it or not. If you don't, do nothing else.
3. **Render.** Mount your container, then call `init()` with the **same `placementId` and `sessionId`** plus `hasPreview: true`. The SDK replays the exact offer from step 1 instead of selecting a new one, so it comes back fast, and renders it in your container.

```javascript
// 1. Fetch (from the browser, so the shopper's IP and user agent are sent automatically)
const sessionId = crypto.randomUUID();

const res = await fetch(
  `https://pr-api.falconlabs.us/api/odata?placementId=YOUR_PLACEMENT_ID&sessionId=${sessionId}&isPreview=true`,
  {
    method: "POST",
    headers: {
      Authorization: "Bearer YOUR_API_KEY",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ "at.email": "guest@example.com" }),
  },
);
const { offers } = await res.json();
const hasOffer = Array.isArray(offers) && offers.length > 0;

// 2. Decide. Only open your modal when hasOffer is true and you want to show it.

// 3. Render, once the container is in the DOM
FalconGeneralSDK.init({
  apiKey: "YOUR_API_KEY",
  containerId: "falcon-ads-container",
  placementId: "YOUR_PLACEMENT_ID", // same placement as step 1
  sessionId,                        // same sessionId as step 1
  hasPreview: true,
  onReady: (isReady) => {
    // false if nothing could be rendered, e.g. the replay window expired
  },
});
```

**Things to know:**

- **One-time setup.** Ask the Falcon team to enable server-side preview replay for your publisher. Without it, the render step comes back empty.
- **Fetching without rendering is free.** A fetched offer that is never rendered records no order and no impression, so it does not affect your reporting.
- **Replay window.** The fetched offer is held server-side for a window configured for your publisher. Render within it. After it expires, the render step requests a fresh offer instead, which may differ from the one you fetched or be empty, so handle `onReady(false)`.
- **Render speed.** The render step reuses the offer you already fetched, so it is fast, but it still loads the ad frame. Add the SDK `<script>` when the page loads rather than when you open your modal, and reveal the ad area on `onReady(true)`.
- **Rendering inside your own UI.** If the offer must render inside your container (for example in a modal) rather than as an overlay, tell the Falcon team so your placement is configured as embedded.
- **Calling from your server instead.** Send the shopper's IP and user agent as `at.clientIp` and `at.userAgent` in the body. Otherwise the request looks like it comes from your server and bot detection returns `204 No Content`.
- **`isPreview` is enough.** You don't need `isCheckout` or `count`.
- **`sessionId` rules.** Required on both calls (a missing one returns `400`). Use any opaque string under 128 characters that doesn't contain `'` `"` `;` `\` `` ` `` or `--`.

## Migrating from the Unified SDK

| | Unified | General |
| --- | --- | --- |
| Script URL | `.../sdk/v1/unified-sdk.js` | `.../sdk/v1/falcon-general-sdk.js` |
| Global | `FalconUnifiedAds` | `FalconGeneralSDK` |
| Container element | Required for embedded only | Always required |

Attribute names are identical. The config object gains the optional callbacks below.

> **Change the global everywhere it appears** — usually in the load guard as well as the `init()` call. Miss one and the SDK loads but never starts.
>
> **Add a container if your placement is overlay.** Unified renders overlay without one; General does not, and logs `Container not found`.

## API Reference

### `FalconGeneralSDK.init(config)`

```typescript
FalconGeneralSDK.init({
  apiKey: string;       // Required
  containerId: string;  // Required — must exist in DOM before calling init()
  placementId: string;  // Required
  attributes?: object;  // Optional — see Overlay or Embedded guides for full reference
  sessionId?: string;   // Optional — supply your own to keep one session across pages
  isPreview?: boolean;  // Optional — preview generate-and-pin
  hasPreview?: boolean; // Optional — replay an offer fetched earlier, see Fetch First, Render Later
  onShow?: (data: { index: number; offer: unknown }) => void;
  onView?: (data: { index: number; offer: unknown; viewedAt: number; timeToView: number | null; viewabilityMethod: string }) => void;
  onClick?: (data: { index: number; offer: unknown }) => void;
  onClose?: (context: object | null) => void;
  onReady?: (isReady: boolean) => void;
});
```

The method is fire-and-forget (`Promise<void>`). Errors are caught and logged to the console; it will never break your page. Every callback is accepted in both modes.

**Console prefixes:**

- `[FalconGeneralSDK] Container not found: "{id}"`
- `[FalconGeneralSDK] Authentication failed`
- `[FalconGeneralSDK] Connection failed`
- `[FalconGeneralSDK] Init failed`

### `sessionId`

Supply your own session id to keep one session across a funnel that spans pages, such as an email, a landing page and a thank-you page. Omit it and the SDK generates one per `init()` call.

It is also required for [Fetch First, Render Later](#fetch-first-render-later), where the render call must reuse the `sessionId` from the fetch.

## TypeScript

```typescript
declare const FalconGeneralSDK: {
  init(config: FalconGeneralSDKConfig): Promise<void>;
};

interface FalconGeneralSDKConfig {
  apiKey: string;
  containerId: string;
  placementId: string;
  attributes?: FalconGeneralSDKAttributes;
  sessionId?: string;
  isPreview?: boolean;
  hasPreview?: boolean;
  onShow?: (data: { index: number; offer: unknown }) => void;
  onView?: (data: {
    index: number;
    offer: unknown;
    viewedAt: number;
    timeToView: number | null;
    viewabilityMethod: string;
  }) => void;
  onClick?: (data: { index: number; offer: unknown }) => void;
  onClose?: (context: unknown) => void;
  onReady?: (isReady: boolean) => void;
}
```

For the full attributes type, see the [Embedded guide](./embedded#typescript).

## Deploying Through a Tag Manager

To install through Google Tag Manager rather than editing your theme, see the [Google Tag Manager guide](./gtm).
