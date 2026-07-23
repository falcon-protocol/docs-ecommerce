---
title: "Unified Web Integration"
---

# Unified Web Integration

## Overview

The Falcon Unified SDK automatically selects the right ad format — **overlay** or **embedded** — for each user based on your Falcon experiment configuration. You write one integration; Falcon handles the routing.

Use this when you want Falcon to dynamically switch or A/B test formats without requiring code changes on your end. If you need a fixed format, use the [Overlay](./overlay) or [Embedded](./embedded) guides instead.

## How It Works

On each `init()` call the SDK:

1. Calls the Falcon experiment API to determine which template is assigned to this user
2. Creates an overlay or embedded instance accordingly
3. Falls back to overlay if the experiment call fails for any reason

## Integration

### Step 1: Add the SDK Script

```html
<script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/unified-sdk.js"></script>
```

### Step 2: Add a Container Element

A container is required regardless of which mode Falcon selects — it's the render target for embedded mode and must exist in the DOM before `init()` is called.

```html
<div id="falcon-ads-container" style="width: 580px; height: 260px;"></div>
```

Recommended minimum dimensions: **580×260px** desktop, **479×400px** mobile.

> **Note:** When Falcon assigns embedded mode, the offer's height automatically adjusts to match its own content rather than stretching to fill the container. See [Container Sizing](./embedded#1-container-sizing) in the Embedded guide for how to avoid empty space below the offer.

### Step 3: Initialize

```javascript
FalconUnifiedAds.init({
  apiKey: "YOUR_API_KEY",
  containerId: "falcon-ads-container",
  placementId: "YOUR_PLACEMENT_ID",
});
```

That's it. The SDK loads and displays offers in whichever format Falcon assigns to this user.

## API Reference

### `FalconUnifiedAds.init(config)`

```typescript
FalconUnifiedAds.init({
  apiKey: string;       // Required
  containerId: string;  // Required — must exist in DOM before calling init()
  placementId: string;  // Required
  attributes?: object;  // Optional — see Overlay or Embedded guides for full reference
});
```

The method is fire-and-forget (`Promise<void>`). All errors are caught internally and logged to the console — it will never break your page.

**Console prefixes:**

- `[FalconUnifiedAds] Container not found: "{id}"`
- `[FalconUnifiedAds] Authentication failed`
- `[FalconUnifiedAds] Connection failed`
- `[FalconUnifiedAds] Init failed`

## TypeScript

```typescript
declare const FalconUnifiedAds: {
  init(config: FalconUnifiedAdsConfig): Promise<void>;
};

interface FalconUnifiedAdsConfig {
  apiKey: string;
  containerId: string;
  placementId: string;
  attributes?: FalconUnifiedAdsAttributes;
}
```

For the full `FalconUnifiedAdsAttributes` type, see the [Embedded guide](./embedded#typescript).
