---
title: "Shopify Ad Unit — Integration Guide"
---

# Shopify Ad Unit (Preact) — Integration Guide

The [plugin guide](./shopify-ad-unit-preact) covers installing the templates and their props. This guide is the code around them.

From your Falcon contact, per environment: a **public key** and **one placement id per surface** (thank-you page and order-status page are separate placements).

| Environment | Base URL                               |
| ----------- | -------------------------------------- |
| Staging     | `https://staging-pr-api.falconlabs.us` |
| Production  | `https://pr-api.falconlabs.us`         |

Develop on staging. Placements start in test mode and serve mock offers until Falcon switches them live.

## 1. Project setup

The thank-you page and the order-status page are two Shopify extensions, each with its own `shopify.extension.toml`, `tsconfig.json` and `shopify.d.ts`. Share `falcon/identity.ts` and `falcon/odata.ts` between them through a path alias or a copy.

Each extension needs:

- `@shopify/ui-extensions` **2026.4** and `api_version = "2026-04"`.
- Dependencies `preact`, `@preact/signals` (used by the templates) and `js-sha256`.
- `network_access = true`. The extension calls `/api/odata` (your code) and `/api/features/evaluate` (the provider).
- **Protected customer data** approved in the Partner Dashboard, including name, email, phone and address. Without it `buyerIdentity`, `billingAddress` and `shippingAddress` are `undefined`.

`shopify.d.ts` types the `shopify` global for the entry file and must be in the tsconfig `include`. Read `shopify.*` in the entry file only.

```ts
// extensions/thank-you/shopify.d.ts
import '@shopify/ui-extensions';

// @ts-ignore
declare module './src/ThankYouBlock.tsx' {
  const shopify: import('@shopify/ui-extensions/purchase.thank-you.block.render').Api;
  const globalThis: { shopify: typeof shopify };
}
```

For the order-status extension use `./src/OrderStatusBlock.tsx` and `@shopify/ui-extensions/customer-account.order-status.block.render`.

## 2. Session id and hashed identifiers

**Session id.** `<shopId>-<orderId>`, numeric ids. The same string goes to the offers request and to `userContext.sessionId`.

**Hashed identifiers.** Email, phone and customer id are sent as SHA-256: **trim → lowercase → hash → 64 lowercase hex characters**. The extension sandbox has no `crypto.subtle`; use `js-sha256`.

```ts
// falcon/identity.ts
import { sha256 } from 'js-sha256';

/** `gid://shopify/Order/123` → `123` */
export function numericId(gid?: string | null): string | undefined {
  return gid?.slice(gid.lastIndexOf('/') + 1) || undefined;
}

export function sessionIdFor(shopId: string, orderId: string): string {
  return `${shopId}-${orderId}`;
}

export function hashIdentifier(value?: string): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}
```

## 3. Offers request

```http
POST {BASE_URL}/api/odata?placementId={placementId}
X-Falcon-Public-Key: {publicKey}
Content-Type: application/json
```

The body is JSON with string values. Call it from the extension, not from your server. Send it once per page view.

### Body

| Key                                                                                                         | Value                                                                                                        |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `sessionId`                                                                                                 | Required. Section 2.                                                                                         |
| `at.orderid`                                                                                                | Required for attribution.                                                                                    |
| `at.email`, `at.hashedEmail`                                                                                | One of them required for attribution; send both when you have the email.                                     |
| `at.hashedPhone`, `at.hashedCustomerShopifyId`                                                              | 64 lowercase hex.                                                                                            |
| `at.firstname`, `at.lastname`, `at.mobile`                                                                  | Plain text.                                                                                                  |
| `at.amount`, `at.shippingAmount`                                                                            | Decimal string, no thousands separators. `at.amount` is `cost.totalAmount`.                                  |
| `at.currency`                                                                                               | ISO 4217.                                                                                                    |
| `at.language`                                                                                               | Lowercase (`de`, `de-de`). The same value goes to `userContext.language` and the Renderer's `language` prop. |
| `at.country`, `at.provinceCode`, `at.city`, `at.billingzipcode`, `at.shippingZipcode`, `at.billingaddress1` | Billing address (`at.shippingZipcode` from the shipping address).                                            |
| `at.lineItems`                                                                                              | JSON string, one entry per line, keys below. Omit when the cart is empty.                                    |

Copy the key casing exactly.

**`at.lineItems` entry keys:** `variantId`, `productId` (numeric ids), `sku`, `variantTitle`, `vendor`, `productType`, `quantity`, `lineTotal` (after line-level discounts), `currency`. Omit keys with no value. Example: `[{"variantId":"41","productId":"7","sku":"TS-BL-M","variantTitle":"Blue / M","vendor":"Acme","productType":"T-Shirt","quantity":2,"lineTotal":39.9,"currency":"EUR"}]`

### Response

| Field                | Use                                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `offers`             | Pass the whole array to `<Renderer offers>`; render one at a time. Do not call `clickUrl` or `beaconUrl` yourself unless you opt into server-side impressions ([plugin guide §8](./shopify-ad-unit-preact#_8-impression-tracking)). |
| `template`           | `<Renderer templateId>` and `userContext.templateId`                                                                                                                                                                                |
| `templateData`       | `<Renderer templateData>`, pass through untouched                                                                                                                                                                                   |
| `siteImages`         | `<Renderer siteImages>`                                                                                                                                                                                                             |
| `withOverlayTrigger` | `<Renderer withOverlayTrigger>`                                                                                                                                                                                                     |
| `siteStatus`         | Render only when `"active"` (except inside the checkout editor, §4)                                                                                                                                                                 |
| `isTestMode`         | `true` while the placement serves mock offers                                                                                                                                                                                       |

### Errors

Render nothing on any non-2xx and log the status with the placement id. Do not retry.

| Status | Meaning                                                             |
| ------ | ------------------------------------------------------------------- |
| `204`  | Request classified as a bot. Empty body, not an error.              |
| `400`  | `placementId` missing.                                              |
| `401`  | Public key does not belong to the placement's publisher.            |
| `403`  | Account inactive; contact Falcon.                                   |
| `404`  | Placement does not exist in the environment the base URL points at. |
| `413`  | Body over 32 KB.                                                    |
| `429`  | Rate limited.                                                       |

```ts
// falcon/odata.ts
import { numericId } from './identity';

export const FALCON_API_BASE = 'https://staging-pr-api.falconlabs.us'; // production: https://pr-api.falconlabs.us

export interface ShopperPayload {
  orderId: string;
  shopId: string; // session id only, never sent
  email?: string;
  hashedEmail?: string;
  hashedPhone?: string;
  hashedCustomerShopifyId?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  amount?: string;
  shippingAmount?: string;
  currency?: string;
  language?: string;
  country?: string;
  provinceCode?: string;
  city?: string;
  billingZipcode?: string;
  shippingZipcode?: string;
  billingAddress1?: string;
  lineItems?: string;
}

export interface Offer {
  clickUrl: string;
  beaconUrl: string;
  [key: string]: unknown;
}

export interface OffersResponse {
  offers: Offer[];
  template: number;
  templateData: { hasInspired?: boolean; [key: string]: unknown };
  siteImages: unknown[];
  siteStatus: 'active' | 'pending';
  withOverlayTrigger: boolean;
  isTestMode: boolean;
}

type Line = {
  quantity: number;
  merchandise?: {
    id?: string;
    title?: string;
    sku?: string | null;
    product?: { id?: string; vendor?: string; productType?: string } | null;
  } | null;
  cost?: {
    totalAmount?: { amount: number; currencyCode: string } | null;
  } | null;
};

/** A variant or product deleted after purchase can leave fields empty. */
export function serializeLineItems(
  lines: readonly Line[] | null | undefined,
): string | undefined {
  if (!lines?.length) return undefined;
  return JSON.stringify(
    lines.map(({ merchandise: m, cost, quantity }) => ({
      variantId: numericId(m?.id),
      productId: numericId(m?.product?.id),
      sku: m?.sku || undefined,
      variantTitle: m?.title,
      vendor: m?.product?.vendor,
      productType: m?.product?.productType,
      quantity,
      lineTotal: cost?.totalAmount?.amount,
      currency: cost?.totalAmount?.currencyCode,
    })),
  );
}

/** `null` on 204. Throws on any other non-2xx. */
export async function fetchOffers(
  publicKey: string,
  placementId: string,
  sessionId: string,
  p: ShopperPayload,
): Promise<OffersResponse | null> {
  const fields: Record<string, string | undefined> = {
    sessionId,
    'at.orderid': p.orderId,
    'at.email': p.email,
    'at.hashedEmail': p.hashedEmail,
    'at.hashedPhone': p.hashedPhone,
    'at.hashedCustomerShopifyId': p.hashedCustomerShopifyId,
    'at.firstname': p.firstName,
    'at.lastname': p.lastName,
    'at.mobile': p.phoneNumber,
    'at.amount': p.amount,
    'at.shippingAmount': p.shippingAmount,
    'at.currency': p.currency,
    'at.language': p.language,
    'at.country': p.country,
    'at.provinceCode': p.provinceCode,
    'at.city': p.city,
    'at.billingzipcode': p.billingZipcode,
    'at.shippingZipcode': p.shippingZipcode,
    'at.billingaddress1': p.billingAddress1,
    'at.lineItems': p.lineItems,
  };
  const response = await fetch(
    `${FALCON_API_BASE}/api/odata?placementId=${encodeURIComponent(placementId)}`,
    {
      method: 'POST',
      headers: {
        'X-Falcon-Public-Key': publicKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        Object.fromEntries(Object.entries(fields).filter(([, v]) => v)),
      ),
    },
  );
  if (response.status === 204) return null;
  if (!response.ok)
    throw new Error(
      `Falcon offers: HTTP ${response.status} placement ${placementId}`,
    );
  return response.json();
}
```

## 4. Render

Rules:

- Render nothing until the order id is known.
- Mount `FeatureManagementProvider` only after the offers response is in, with the complete `userContext`. Do not change its values afterwards.
- `<Renderer>` goes inside `<s-query-container>`, as a child of the provider (it throws outside it).
- Inside the checkout editor (`useExtensionEditor()`) render even when `siteStatus` is not `active`.
- `sessionId`, `hashedEmail`, `hashedPhone`, `hashedCustomerShopifyId`, `language`, `orderId`, `amount` and `templateId` in `userContext` must equal what the offers request sent. Other accepted keys: [plugin guide](./shopify-ad-unit-preact#featuremanagementusercontext).
- `clickOffer` and `handleNoThanks` follow [Offer Navigation](./shopify-ad-unit-preact#_6-offer-navigation) and [Inspired Offer Behavior](./shopify-ad-unit-preact#_7-inspired-offer-behavior). When `onOverlayDismissed` fires, set `reachedEndOfOffers` to `true` and keep rendering; the Renderer ends the unit itself. `onRestartOffers` puts the carousel back on the first offer.

```tsx
// src/ThankYouBlock.tsx
import '@shopify/ui-extensions/preact';

import {
  useExtensionEditor,
  useStorage,
} from '@shopify/ui-extensions/checkout/preact';

import { hashIdentifier, numericId, sessionIdFor } from '../falcon/identity';
import {
  FALCON_API_BASE,
  fetchOffers,
  serializeLineItems,
} from '../falcon/odata';
import { FeatureManagementProvider } from '<your-preferred-path>/preact/provider';
import { Renderer } from '<your-preferred-path>/preact/renderer';
import { TemplateDefaultLoader } from '<your-preferred-path>/preact/skeleton';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import type { OffersResponse, ShopperPayload } from '../falcon/odata';

const TARGET = 'purchase.thank-you.block.render';
// Or read these from your app's settings.
const PUBLIC_KEY = '<public key>';
const PLACEMENT_ID = '<thank-you placement id>';

export default function () {
  render(<Extension />, document.body);
}

function Extension() {
  // The order hydrates asynchronously; keep the optional chaining.
  const orderId = numericId(shopify.orderConfirmation?.value?.order?.id);
  const shopId = numericId(shopify.shop.id);
  if (!orderId || !shopId) return null;
  return <AdUnit orderId={orderId} shopId={shopId} />;
}

function readPayload(orderId: string, shopId: string): ShopperPayload {
  const customer = shopify.buyerIdentity?.customer.value;
  const billing = shopify.billingAddress?.value;
  const shipping = shopify.shippingAddress?.value;
  const email = shopify.buyerIdentity?.email.value;
  const phone = shopify.buyerIdentity?.phone.value;
  return {
    orderId,
    shopId,
    email,
    hashedEmail: hashIdentifier(email),
    hashedPhone: hashIdentifier(phone),
    hashedCustomerShopifyId: hashIdentifier(numericId(customer?.id)),
    firstName: customer?.firstName ?? billing?.firstName ?? shipping?.firstName,
    lastName: customer?.lastName ?? billing?.lastName ?? shipping?.lastName,
    phoneNumber: phone,
    amount: String(shopify.cost.totalAmount.value.amount),
    shippingAmount: shopify.cost.totalShippingAmount.value?.amount.toString(),
    currency: shopify.localization.currency.value.isoCode,
    language: shopify.localization.language.value.isoCode.toLowerCase(), // localization.language, not extensionLanguage
    country: billing?.countryCode,
    provinceCode: billing?.provinceCode,
    city: billing?.city,
    billingZipcode: billing?.zip,
    shippingZipcode: shipping?.zip,
    billingAddress1: billing?.address1,
    lineItems: serializeLineItems(shopify.lines.value),
  };
}

function AdUnit({ orderId, shopId }: { orderId: string; shopId: string }) {
  const storage = useStorage();
  const isEditor = !!useExtensionEditor();
  const sessionId = sessionIdFor(shopId, orderId);
  const [result, setResult] = useState<{
    payload: ShopperPayload;
    response: OffersResponse | null;
  } | null>(null);
  const [done, setDone] = useState(false);
  const [nav, setNav] = useState({
    activeOfferIndex: 0,
    reachedEndOfOffers: false,
  });

  useEffect(() => {
    // One request per page view, one tick after mount so the shopper signals have hydrated.
    queueMicrotask(() => {
      const payload = readPayload(orderId, shopId);
      fetchOffers(PUBLIC_KEY, PLACEMENT_ID, sessionId, payload)
        .then(
          (response) => setResult({ payload, response }),
          (error) => console.error('[Falcon]', error),
        )
        .finally(() => setDone(true));
    });
  }, []);

  if (!done) return <TemplateDefaultLoader />;
  const response = result?.response;
  if (
    !result ||
    !response?.offers.length ||
    (response.siteStatus !== 'active' && !isEditor)
  ) {
    return null;
  }
  const { payload } = result;
  const { offers, template, templateData, siteImages, withOverlayTrigger } =
    response;
  const activeOffer = offers[nav.activeOfferIndex];
  // No guard on `reachedEndOfOffers`: the Renderer ends the unit itself.
  if (!activeOffer) return null;

  const end = () => setNav((prev) => ({ ...prev, reachedEndOfOffers: true }));
  const restart = () =>
    setNav({ activeOfferIndex: 0, reachedEndOfOffers: false });
  const handleNoThanks = () =>
    setNav((prev) =>
      prev.activeOfferIndex >= offers.length - 1
        ? { ...prev, reachedEndOfOffers: true }
        : { ...prev, activeOfferIndex: prev.activeOfferIndex + 1 },
    );
  const clickOffer = () =>
    setNav((prev) => {
      const last = offers.length - 1;
      if (prev.activeOfferIndex >= last)
        return { ...prev, reachedEndOfOffers: true };
      return {
        ...prev,
        activeOfferIndex: templateData.hasInspired
          ? last
          : prev.activeOfferIndex + 1,
      };
    });

  return (
    <FeatureManagementProvider
      publicKey={PUBLIC_KEY}
      apiEndpoint={`${FALCON_API_BASE}/api/features/evaluate`}
      userContext={{
        placementId: PLACEMENT_ID,
        sessionId,
        hashedEmail: payload.hashedEmail,
        hashedPhone: payload.hashedPhone,
        hashedCustomerShopifyId: payload.hashedCustomerShopifyId,
        language: payload.language,
        templateId: template,
        orderId: payload.orderId,
        amount: payload.amount ? Number(payload.amount) : undefined,
      }}
      extensionTarget={TARGET}
      loadingElement={<TemplateDefaultLoader />}
      storage={storage}
    >
      <s-query-container>
        <Renderer
          templateId={template}
          templateData={templateData}
          siteImages={siteImages}
          withOverlayTrigger={withOverlayTrigger}
          onOverlayDismissed={end}
          onRestartOffers={restart}
          offers={offers}
          activeOffer={activeOffer}
          activeOfferIndex={nav.activeOfferIndex}
          reachedEndOfOffers={nav.reachedEndOfOffers}
          clickOffer={clickOffer}
          handleNoThanks={handleNoThanks}
          extensionTarget={TARGET}
          firstName={payload.firstName}
          email={payload.email}
          language={payload.language}
        />
      </s-query-container>
    </FeatureManagementProvider>
  );
}
```

Order-status extension: same file with these changes.

```ts
// src/OrderStatusBlock.tsx
import { useExtensionEditor, useStorage } from '@shopify/ui-extensions/customer-account/preact';
const TARGET = 'customer-account.order-status.block.render';
const PLACEMENT_ID = '<order-status placement id>';

// Extension(), orderId line only:
const orderId = numericId(shopify.order.value?.id);

// readPayload():
hashedCustomerShopifyId: hashIdentifier(
  numericId(shopify.authenticatedAccount.customer.value?.id ?? customer?.id),
),
```

## 5. Verify on staging

1. Place a test order on your dev store and open the thank-you page.
2. Network tab: one `POST /api/odata`, status 200, `isTestMode: true` in the response, `at.orderid`, `at.hashedEmail`, `at.language` and `at.lineItems` in the body.
3. One `POST /api/features/evaluate` with the same `sessionId`.
4. A `GET` to `beaconUrl` for the first offer, then one more for each decline or CTA.
5. Decline through every offer: the unit disappears after the last one.
6. Repeat on the order-status page.
7. Production build: production base URL, key and placement ids; CI can fetch the templates ([plugin guide §10](./shopify-ad-unit-preact#_10-ci-cd-setup)).
