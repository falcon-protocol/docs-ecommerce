# Overlay Web Integration

## Overview

The Falcon SDK **overlay mode** renders a modal dialog over your page with a semi-transparent dark backdrop. Users see a centered card (max-width ~460-560px) with promotional offers (Perks) and can interact with them or close the modal.

The modal can also be minimized to a **floating button** — a small persistent element (bottom-right on desktop, full-width bar on mobile) that lets users re-open the offers later.

Typical use case: show offers on the order confirmation page after a purchase is complete.

---

## Quick Start

Add this to your **order confirmation page** (or any page where you want to show offers). The modal will appear automatically when the page loads:

```html
<head>
  <script src="<https://falconlabs.s3.us-east-2.amazonaws.com/sdk/falcon-sdk.js>"></script>
  <script>
    (async function () {
      try {
        // 1. Initialize SDK
        await FalconSDK.init("YOUR_SDK_KEY");

        // 2. Create a placement instance with user/order data
        const perks = FalconSDK.createPerksInstance("YOUR_PLACEMENT_ID", {
          attributes: {
            email: "user@example.com",
            firstname: "John",
            orderId: "ORDER-123",
            amount: "99.99",
          },
        });

        // 3. Load offers and show immediately if available
        const result = await perks.loadPerks();
        if (result.isReady) {
          perks.show();
        }
      } catch (error) {
        console.error("Falcon SDK error:", error);
      }
    })();
  </script>
</head>
```

That's it. The modal will appear with available offers.

> **Get your credentials:** Contact your Falcon Labs account manager to obtain your SDK key and placement ID.

---

## Framework Examples

### React

Types for the SDK (add once, e.g. in `falcon-sdk.d.ts`):

```tsx
declare const FalconSDK: {
  init(apiKey: string): Promise<void>;
  createPerksInstance(
    placementId: string,
    options?: { attributes?: Record<string, string | undefined> },
  ): PerksInstance;
};

interface PerksInstance {
  loadPerks(): Promise<{ isReady: boolean }>;
  show(options?: { title?: string; subtitle?: string }): void;
  hide(): void;
  minimize(): void;
  expand(): void;
  destroy(): void;
  addClickCallback(
    cb: (data: { index: number; offer: unknown }) => void,
  ): () => void;
  addCloseCallback(cb: () => void): () => void;
  addUIStateCallback(
    cb: (state: "hidden" | "shown" | "minimized") => void,
  ): () => void;
}
```

### Auto-show on page load

Show the modal immediately when the component mounts (e.g. order confirmation page):

```tsx
// Load the SDK script once in your index.html <head>:
// <script src="<https://falconlabs.s3.us-east-2.amazonaws.com/sdk/falcon-sdk.js>"></script>

import { useEffect, useRef } from "react";

export function FalconPerksAutoShow({
  sdkKey,
  placementId,
  userEmail,
  userName,
  orderId,
  amount,
}) {
  const instanceRef = useRef<PerksInstance | null>(null);

  useEffect(() => {
    async function initPerks() {
      try {
        await FalconSDK.init(sdkKey);

        const perks = FalconSDK.createPerksInstance(placementId, {
          attributes: {
            email: userEmail,
            firstname: userName,
            orderId,
            amount,
          },
        });

        instanceRef.current = perks;

        const result = await perks.loadPerks();
        if (result.isReady) {
          perks.show({ subtitle: `Thanks, ${userName}!` });
        }
      } catch (error) {
        console.error("Falcon SDK error:", error);
      }
    }

    initPerks();

    return () => {
      instanceRef.current?.destroy();
    };
  }, [sdkKey, placementId, userEmail, userName, orderId, amount]);

  return null;
}
```

### Show on button click

Initialize the SDK once, then load and show perks each time the user clicks:

```tsx
import { useEffect, useRef, useCallback } from "react";

export function FalconPerksButton({
  sdkKey,
  placementId,
  userEmail,
  userName,
  orderId,
  amount,
}) {
  const instanceRef = useRef<PerksInstance | null>(null);

  useEffect(() => {
    async function initSDK() {
      try {
        await FalconSDK.init(sdkKey);

        instanceRef.current = FalconSDK.createPerksInstance(placementId, {
          attributes: {
            email: userEmail,
            firstname: userName,
            orderId,
            amount,
          },
        });
      } catch (error) {
        console.error("Falcon SDK error:", error);
      }
    }

    initSDK();

    return () => {
      instanceRef.current?.destroy();
    };
  }, [sdkKey, placementId, userEmail, userName, orderId, amount]);

  const handleShowPerks = useCallback(async () => {
    if (!instanceRef.current) return;

    try {
      const result = await instanceRef.current.loadPerks();
      if (result.isReady) {
        instanceRef.current.show({ subtitle: `Hey, ${userName}!` });
      }
    } catch (error) {
      console.error("Falcon SDK error:", error);
    }
  }, [userName]);

  return <button onClick={handleShowPerks}>View Offers</button>;
}
```

### Next.js

The React examples above work in Next.js. The only difference is loading the SDK script — use `next/script` instead of a `<script>` tag in `index.html`:

```tsx
import Script from "next/script";

<Script
  src="<https://falconlabs.s3.us-east-2.amazonaws.com/sdk/falcon-sdk.js>"
  strategy="afterInteractive"
/>;
```

Make sure to add `"use client"` to components that use the SDK.

---

## Custom Attributes

Pass user and order data for personalized offer targeting. The more attributes you provide, the better the targeting.

```tsx
interface CustomAttributes {
  // Customer email address.
  // Used for offer personalization and deduplication.
  email?: string;

  // Customer first name.
  firstname?: string;

  // Customer last name.
  lastname?: string;

  // Unique order or transaction identifier.
  // Links the offer impression to a specific purchase.
  orderId?: string;

  // Total transaction amount as a string (e.g. "99.99").
  // Used for offer eligibility rules based on order value.
  amount?: string;

  // ISO country code (e.g. "US", "GB", "DE").
  // Determines which offers are available in the user's region.
  country?: string;

  // ISO language code (e.g. "en", "fr", "de").
  // Used to serve offers in the user's language.
  language?: string;

  // ISO currency code (e.g. "USD", "EUR", "GBP").
  currency?: string;

  // Seller or merchant name (e.g. "BestBuyCanada").
  // Displayed in the modal headline: "Your offers from {confirmationref}".
  // Useful when a store has multiple sellers.
  confirmationref?: string;

  // Billing ZIP or postal code.
  billingzipcode?: string;

  // Payment method type (e.g. "credit_card", "paypal").
  paymenttype?: string;

  // First 6 digits of the credit card number (BIN).
  // Used for card-based offer targeting.
  ccbin?: string;

  // Customer mobile phone number.
  mobile?: string;

  // Billing address line 1.
  billingaddress1?: string;

  // Billing address line 2.
  billingaddress2?: string;

  // Customer age as a string.
  age?: string;

  // Customer gender.
  gender?: string;

  // Cart items as a JSON string.
  // Used for product-based offer targeting.
  cartItems?: string;
}
```

---

## Show Options

Customize the modal header when calling `show()`:

```jsx
perks.show({
  title: "Exclusive Offers", // Custom modal title
  subtitle: "Thanks, John!", // Personalized subtitle
});
```

Both fields are optional.

---

## Callbacks

### loadPerks

Loads offers for the placement. Returns a promise with `{ isReady: boolean }`. Must be called before `show()` — and again after each `hide()` cycle.

```jsx
const result = await perks.loadPerks();
if (result.isReady) {
  perks.show();
}
```

### addClickCallback

Fires when a user clicks an offer. Use for analytics or custom redirect logic.

```jsx
perks.addClickCallback((data) => {
  console.log("Clicked offer index:", data.index);
  console.log("Offer data:", data.offer);
});
```

### addCloseCallback

Fires when the modal is closed (X button, backdrop click, etc.).

```jsx
perks.addCloseCallback(() => {
  console.log("Modal closed");
});
```

### addUIStateCallback

Fires when the modal transitions between states: `'hidden'`, `'shown'`, or `'minimized'`. Useful for syncing your own UI (e.g. dimming page content while the modal is open).

```jsx
perks.addUIStateCallback((state) => {
  console.log("UI state:", state); // 'hidden' | 'shown' | 'minimized'
});
```

---

## Error Handling

The SDK throws on invalid operations. Common errors you may encounter:

| Error                             | Cause                                                                      |
| --------------------------------- | -------------------------------------------------------------------------- |
| `SDK not initialized`             | `FalconSDK.init()` was not called before creating instances                |
| `Placement "{id}" already in use` | Another instance with the same placement ID exists. Call `destroy()` first |
| `Perks not ready`                 | `show()` was called before `loadPerks()` completed or after TTL expired    |
| `Perks already shown`             | `show()` or `loadPerks()` was called while the modal is visible            |
| `Perks loading`                   | `loadPerks()` was called while a previous load is still in progress        |

---

## Best Practices

1. **Initialize once** — call `FalconSDK.init()` a single time when your page loads, not on every interaction
2. **Pass attributes** — the more user/order data you provide, the more relevant the offers will be
3. **Check `isReady`** — always check `result.isReady` before calling `show()`, as there may not be offers available for this user
4. **Clean up in SPAs** — call `destroy()` when navigating away from the page to avoid `"Placement already in use"` errors
5. **One placement = one instance** — don't create multiple instances with the same placement ID

---

## Troubleshooting

**Modal doesn't appear:**

- Check the browser console for errors
- Make sure `loadPerks()` returned `{ isReady: true }` — if `false`, there are no offers for this user/placement
- Verify your SDK key and placement ID with your account manager

**`loadPerks()` returns `{ isReady: false }`:**

- This is normal — it means no offers matched this user. No action needed

**Script doesn't load:**

- Check for ad blockers or CSP rules blocking `falconlabs.s3.us-east-2.amazonaws.com`

**Need help?** Contact your Falcon Labs account manager.
