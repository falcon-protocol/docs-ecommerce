---
title: "Google Tag Manager Integration"
---

# Google Tag Manager Integration

## Overview

Install Falcon through Google Tag Manager without editing your theme. The tag loads the SDK on your post-purchase page and passes the order from your dataLayer.

The SDK is the one described in the [General Web Integration](./general) guide.

> **Not for Shopify.** Shopify stores integrate through the [Falcon Shopify app](./shopify).

## What You Need First

- Edit and publish access to the GTM container
- Your Falcon API key and placement ID — contact your Falcon Labs account manager
- A dataLayer that carries the order on your thank-you page
- A place on the page for the offer to render

## Integration

### Step 1: Add the Container Element

Add this to your thank-you page template, where you want the offer to appear:

```html
<div id="falcon-ads-container"></div>
```

Recommended minimum dimensions: **580×260px** desktop, **479×400px** mobile. See [Container Sizing](./embedded#container-sizing).

### Step 2: Create the Data Layer Variables

None of the fields Falcon needs are GTM built-ins. Under **Variables → User-Defined → New → Data Layer Variable**, create one per field, with **Data Layer Version 2**:

| Falcon attribute | Typical dataLayer key | GTM variable name |
| --- | --- | --- |
| `orderId` | `ecommerce.transaction_id` | Transaction ID |
| `amount` | `ecommerce.value` | Order Total |
| `currency` | `ecommerce.currency` | Currency |
| `email` | `customer.email` | Customer Email |

Read your own key names off your dataLayer. Only `orderId` is required; see the [attribute reference](./embedded#attribute-reference) for every field Falcon accepts.

> `orderId` must not contain `#`, `@`, `.` or spaces. Strip a `#1001`-style prefix in the variable or in the tag.

### Step 3: Create the Tag

Create a **Custom HTML** tag and paste this, replacing the credentials and the variable names:

::: v-pre

```html
<script>
  (function () {
    var CONTAINER_ID = "falcon-ads-container";
    var API_KEY = "YOUR_API_KEY";
    var PLACEMENT_ID = "YOUR_PLACEMENT_ID";

    function clean(v) {
      return v === undefined || v === null ? "" : String(v).trim();
    }

    if (!document.getElementById(CONTAINER_ID)) {
      console.warn("[Falcon] container not found:", CONTAINER_ID);
      return;
    }

    var attributes = {};
    var orderId = clean({{Transaction ID}});
    var amount = clean({{Order Total}});
    var currency = clean({{Currency}}).toUpperCase();
    var email = clean({{Customer Email}});

    if (orderId) attributes.orderId = orderId;
    if (amount) attributes.amount = amount;
    if (currency) attributes.currency = currency;
    if (email) attributes.email = email;

    function start() {
      if (window.__falconStarted) return;
      window.__falconStarted = true;
      window.FalconGeneralSDK.init({
        apiKey: API_KEY,
        containerId: CONTAINER_ID,
        placementId: PLACEMENT_ID,
        attributes: attributes,
      });
    }

    if (window.FalconGeneralSDK && typeof window.FalconGeneralSDK.init === "function") {
      return start();
    }

    var s = document.createElement("script");
    s.src = "https://d6y5cd3imay52.cloudfront.net/sdk/v1/falcon-general-sdk.js";
    s.async = true;
    s.onload = function () {
      if (window.FalconGeneralSDK && typeof window.FalconGeneralSDK.init === "function") {
        start();
      } else {
        console.warn("[Falcon] SDK loaded but FalconGeneralSDK is not defined");
      }
    };
    s.onerror = function () {
      console.warn("[Falcon] SDK failed to load");
    };
    (document.head || document.getElementsByTagName("head")[0]).appendChild(s);
  })();
</script>
```

:::

Two settings on the tag:

- Leave **Support document.write** unchecked.
- Under **Advanced Settings → Tag firing options**, choose **Once per page**.

Pass `email` as a plain address — the SDK hashes it in the browser. Do not pass `email` and `hashedEmail` together.

### Step 4: Set the Trigger

The tag needs the container element present and the order in the dataLayer when it fires.

**If your platform pushes an order event**, such as `purchase`, trigger on that.

**Otherwise** use a **DOM Ready** trigger limited to your thank-you page by URL:

- Page Path matches RegEx `^/(checkout/(purchasesucceeded|thank-you)|order-status)/?$`

Do not use Page View — it fires before the container exists.

**On a single-page app**, use **History Change** or a custom event your app pushes, and set tag firing options to **Once per event**.

### Step 5: Preview, Then Publish

Test against staging first: swap `/sdk/v1/` for `/sdk/staging/` in the tag and use your staging API key. See [Staging Environment](./partner-integration/staging-environment). Swap both back before publishing.

Open **Preview**, complete an order, and check:

1. The tag appears under **Tags Fired**
2. The network panel shows `falcon-general-sdk.js` loading from `d6y5cd3imay52.cloudfront.net`
3. An offer renders in your container

Preview only works in the browser you started it from, and needs the GTM container snippet already live on the site.

Nothing reaches visitors until you publish the container.

## Consent

A Custom HTML tag runs no consent checks by default. To gate it, open **Advanced Settings → Consent Settings**, choose **Require additional consent for tag to fire**, and add the consent types you use for advertising — under consent mode v2 that is `ad_storage`, `ad_user_data` and `ad_personalization`.

## Troubleshooting

**The tag does not fire.** Check the trigger against the page you are on. The post-purchase tag only fires on the post-purchase page.

**The tag fires but no script is requested.** The container element was missing when the tag ran. Move the trigger later: DOM Ready, or your platform's order event.

**The script loads but nothing renders.** Check the global name — `falcon-general-sdk.js` defines `FalconGeneralSDK`. If your page also loads RequireJS or another AMD loader, load the SDK outside GTM instead.

**Offers render but revenue is not attributed.** `orderId` was empty when the tag fired. Switch to the order event trigger, and check `orderId` for `#` and spaces.

**It renders once and never again on an SPA.** Set tag firing options to **Once per event**.

**Nothing changed on the live site.** The container was not published, or was published from a different workspace.

## Removing Falcon

Pause the tag, or revert the container from **Admin → Container Versions**. Either takes effect on publish.
