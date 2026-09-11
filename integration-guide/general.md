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
  hasPreview?: boolean; // Optional — preview replay
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
