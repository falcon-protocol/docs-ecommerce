---
title: "Google Ad Manager Integration"
---

# Google Ad Manager Integration

## Overview

The Falcon **GAM SDK** (`falcon-gam-sdk.js`) delivers the embedded ad unit as a **Google Ad
Manager Custom HTML creative**. You traffic a single Falcon line item in your GAM account; when
GAM serves it, the creative loads the SDK and Falcon renders the offer unit inside the ad slot.
The unit grows the slot to fit its content, so it is never clipped to the trafficked size.

Use this integration when your pages are managed by GAM and you want Falcon to compete in your
ad server like any other line item. If you can place a script tag directly on the page, use the
[Embedded Web Integration](/integration-guide/embedded) instead — it is simpler and does not
involve your ad server.

This SDK variant collects **no PII**. Its attribute surface is limited to non-personal
transaction metadata (see [Privacy](#privacy-what-runs-what-it-collects)).

## Quick Integration Guide

### Step 1: Get Your SDK Key

Contact your Falcon Labs account manager to obtain your unique SDK key and placement ID.

### Step 2: Create the Custom Creative

In GAM, go to **Delivery → Creatives → New creative → Custom** and paste the following into the
**Code** field:

```html
<div id="falcon-gam-container"></div>
<script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/falcon-gam-sdk.js"></script>
<script>
  FalconGamAds.init({
    apiKey: "YOUR_API_KEY",
    containerId: "falcon-gam-container",
    placementId: "YOUR_FALCON_PLACEMENT_ID",
    attributes: {
      orderId: "%%PATTERN:orderid%%",
      amount: "%%PATTERN:amount%%",
      currency: "%%PATTERN:currency%%",
      language: "%%PATTERN:language%%",
    },
  });
</script>
```

Missing key-values are safe: if a macro is not set on the ad request, the SDK drops the
unexpanded `%%…%%` value instead of sending it.

### Step 3: Uncheck "Serve into a SafeFrame"

On the creative settings, **uncheck "Serve into a SafeFrame"** (it is on by default for custom
creatives). This serves the creative in a friendly iframe, which lets the SDK resize the ad slot
to the unit's real height — precisely, repeatedly, and without a height cap.

This is the standard mechanism for dynamic-height units (Taboola and Outbrain require the same
setting) and Google's documented option for creatives that size their container. Active View
viewability measurement is unaffected.

::: details If your policy requires SafeFrame
Keep the checkbox on and allow push expansion on the slot instead:

```javascript
slot.setConfig({ safeFrame: { allowPushExpansion: true } });
```

Be aware of SafeFrame limitations: expansion is capped at the viewport height (tall units on
small screens cannot fully expand), and repeated height changes cause a brief visible reflow.
:::

### Step 4: Pass the Order ID via Key-Value Targeting

The unit requires `orderId` — an opaque Falcon transaction identifier, not PII. Set it on the ad
request from your page before the slot is displayed:

```javascript
// Page-level:
googletag.pubads().setTargeting("orderid", order.id);
// Or slot-level:
slot.setTargeting("orderid", order.id);
```

GAM substitutes `%%PATTERN:orderid%%` in the creative code at serve time. The same mechanism
works for the optional `amount`, `currency`, `language`, `category`, and `subcategory`
key-values.

Key-value constraints (GAM limits): values up to 40 characters, keys are case-insensitive, and
these characters are not allowed: `" ' = ! + # * ~ ; ^ ( ) < > [ ] , &`. Falcon order IDs fit
these limits.

### Step 5: Traffic the Line Item

Create a line item targeting your slot and attach the creative. Traffic it at a small fixed size
that your layout already reserves (for example 320x250). The SDK grows the slot to the unit's
real height after load.

## Slot Sizing Guidance

- Do not set a fixed height on wrapper elements around the GPT slot div — the resize stops at
  the first fixed-height ancestor.
- Any post-load resize is a layout shift by definition. Prefer below-the-fold placements (order
  confirmation content is ideal) and reserve a sensible `min-height` via CSS where possible.

## API Reference

### `FalconGamAds.init(config): Promise<void>`

Initializes the SDK and displays the unit inside the container.

```javascript
{
  apiKey: string,         // Your Falcon API key (required)
  containerId: string,    // ID of the container div in the creative (required)
  placementId: string,    // Your Falcon placement ID (required)
  attributes: {           // Optional, all fields optional
    orderId: string,      // Opaque Falcon transaction ID (required for full functionality)
    amount: string,
    currency: string,
    language: string,
    category: string,
    subcategory: string,
  },
  onReady: (isReady) => {},   // Optional callbacks, same semantics as the embedded SDK
  onShow: (data) => {},
  onView: (data) => {},
  onClick: (data) => {},
  onClose: (context) => {},
}
```

The callback semantics match the [Embedded SDK callbacks](/integration-guide/embedded-sdk-callbacks).

## Privacy: What Runs, What It Collects

For publisher privacy review:

- The creative loads `falcon-gam-sdk.js`, which renders the Falcon offer unit inside a Falcon
  iframe within the ad slot.
- **No PII is collected, expected, or accepted.** The attribute surface is limited to `orderId`
  (opaque transaction ID), `amount`, `currency`, `language`, `category`, and `subcategory`.
  Fields like email, name, address, or zip code do not exist in this SDK variant. This complies
  with Google Ad Manager's prohibition on passing PII in key-values.
- The unit reports standard ad delivery telemetry to Falcon: impressions, viewability (IAB/MRC
  50%/1s), clicks, and close events, keyed by placement and the opaque orderId.
- The SDK does not read the host page DOM, cookies, or localStorage outside its own frame.

## Verifying the Integration

1. Load a page with the GAM slot and an `orderid` key-value set, and open the browser console.
2. The unit should render inside the slot, and the slot should grow to fit it — no clipping and
   no inner scrollbar.
3. Confirm the ad request contains the key-value (GAM delivery tools or Publisher Console) and
   that no PII appears in any request.

## Differences from the Embedded SDK

| | Embedded SDK | GAM SDK |
| --- | --- | --- |
| Delivery | Script tag on your page | GAM Custom HTML creative |
| Who decides when it shows | Your page code | Your ad server (line item) |
| Attributes | Full attribute set | Non-PII subset only |
| Data ingress | JavaScript variables | GAM key-value targeting |
| Container sizing | Your container, SDK fills it | SDK resizes the GAM slot itself |
