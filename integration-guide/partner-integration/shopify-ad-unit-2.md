---
title: "Shopify Ad Unit (2.0)"
---

# Shopify Ad Unit (2.0)

Add the Falcon offers unit to your Shopify app using Preact and Shopify's web components (API version 2026-04). You mount one component, `FalconOffers`, and pass it two required props. It reads the order and the shopper from Shopify, requests offers, and renders them. You pull updates with one command. Two builds ship, `full/` and `lite/`; [§4](#4-what-is-in-the-templates-folder) says which to pick.

From your Falcon contact you need, per environment: a **public key** and **one placement id per surface** (the thank-you page and the order-status page are separate placements).

| Environment | Base URL                               |
| ----------- | -------------------------------------- |
| Staging     | `https://staging-pr-api.falconlabs.us` |
| Production  | `https://pr-api.falconlabs.us`         |

Develop on staging. Placements start in test mode and serve mock offers until Falcon switches them live. The `environment` prop picks the API.

Already running a 1.x integration? Read [Migrating to Shopify Ad Unit 2.0](./shopify-ad-unit-migration) first, then come back here.

## 1. Repository access

The templates folder is distributed through a private GitHub repository: [falcon-partners/shopify-templates](https://github.com/falcon-partners/shopify-templates). Access runs on SSH deploy keys, so no individual GitHub accounts need to be added.

1. Request a **deploy key** from your Falcon contact. You will receive a private key file.
2. Save the file as `falcon_deploy_key` in your project root.
3. Add `falcon_deploy_key` to your `.gitignore`:

   ```text
   falcon_deploy_key
   ```

4. Share the key with every developer on the project. Each of them needs the file in their own project root, and a copy belongs in your secret manager, since the link you received it from expires.

## 2. Prerequisites

Each extension needs:

- **Protected customer data** approved in the Partner Dashboard, including name, email, phone and address. Shopify reviews this, so request it first. Without it `buyerIdentity`, `billingAddress` and `shippingAddress` come back undefined. The unit then has less to work with, and the offers it shows are less relevant.
- `@shopify/ui-extensions` **2026.4** and `api_version = "2026-04"`.
- Dependencies `preact` and `@preact/signals`.
- `network_access = true`. The unit calls `/api/odata` and `/api/features/evaluate` on the base URL above, and fires tracking requests for each offer it shows.

The thank-you page and the order-status page are two Shopify extensions, each with its own `shopify.extension.toml` and `tsconfig.json`. Both import the same build folder, `full/` or `lite/` (see [§4](#4-what-is-in-the-templates-folder)).

The unit reads the `shopify` global itself, so your entry file does not need to read it and needs no `shopify.d.ts` for the unit's sake.

## 3. Installation

Create two helper scripts in your project root.

> **Important:** In both scripts, replace `<your-preferred-path>` with the actual path where you want the templates folder (e.g. `falcon-templates`). Use that same path everywhere: both scripts, `.prettierignore`, and every import.

**`falcon-init.sh`** — adds the submodule:

```bash
#!/bin/bash
set -e

# Change this to your preferred submodule path
SUBMODULE_PATH="<your-preferred-path>"

DEPLOY_KEY="$(pwd)/falcon_deploy_key"

if [ ! -f "$DEPLOY_KEY" ]; then
  echo "Error: falcon_deploy_key not found in project root"
  exit 1
fi

chmod 600 "$DEPLOY_KEY"
GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" \
  git submodule add git@github.com:falcon-partners/shopify-templates.git "$SUBMODULE_PATH"

echo "Submodule added at $SUBMODULE_PATH"
```

**`falcon-sync.sh`** — pulls a newer version:

```bash
#!/bin/bash
set -e

# Change this to your preferred submodule path
SUBMODULE_PATH="<your-preferred-path>"

DEPLOY_KEY="$(pwd)/falcon_deploy_key"

if [ ! -f "$DEPLOY_KEY" ]; then
  echo "Error: falcon_deploy_key not found in project root"
  exit 1
fi

chmod 600 "$DEPLOY_KEY"
GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" \
  git submodule update --remote --merge "$SUBMODULE_PATH"

echo "Templates synced"
```

Add to your `package.json`:

```json
{
  "scripts": {
    "falcon:init": "bash ./falcon-init.sh",
    "falcon:sync": "bash ./falcon-sync.sh"
  }
}
```

Then add the submodule:

```bash
npm run falcon:init
```

> **Note:** Do not create the folder yourself first. `falcon-init.sh` creates it, and `git submodule add` fails if the path already exists.
> **Recommended:** add the templates folder to `.prettierignore`.

## 4. What is in the templates folder

Two builds ship, side by side. They take the same props and emit the same events, so moving between them is the import path.

| Folder  | What it is                                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `full/` | Everything: Template 15 and 17, the offer overlay, the countdown and redeem card, social proof, experiments. ~11.3 KB. |
| `lite/` | One self-contained file for integrators with a few kilobytes to spare. Template 15, the carousel, tracking. ~4.0 KB.   |

The `full/` folder contains:

| File              | Description                                   |
| ----------------- | --------------------------------------------- |
| `offers.tsx`      | `FalconOffers` — the only file you import     |
| `renderer.tsx`    | Template routing, overlay, redeem card (int.) |
| `provider.tsx`    | Configuration (internal)                      |
| `fallback.tsx`    | Template 15 (internal)                        |
| `brandcollab.tsx` | Template 17 (internal)                        |
| `attributes.tsx`  | Shopper-attributes context (internal)         |
| `configs.tsx`     | Shared constants (internal)                   |
| `utils.tsx`       | Shared utils, hooks and UI (internal)         |

Import `offers.tsx` and nothing else. The other files reference each other by relative path, so sync the whole folder — copying individual files breaks them.

### The lite build

`lite/offers.tsx` is one file with no imports of its own, so you can copy it alone. It makes the offers request and nothing else: no feature-evaluation request, and therefore none of what that request decides. Pick it when your extension bundle is near Shopify's script limit.

What you give up against `full/`: Template 17, the offer overlay, the countdown strip and redeem card, social proof and badges, sitelinks, and every experiment Falcon runs. Template 15 is drawn by hand from the full build's markup, so the unit looks the same. What you keep: the labels in the shopper's language, the attribution row, the final template choice and the first-name greeting, because the server decides those and sends them with the offers. `onError` never fires `features_failed` in this build.

```tsx
import { FalconOffers } from '<your-preferred-path>/lite/offers';
```

`CHANGELOG.md` at the root of the folder is the record of what changed in each version. Read it before every sync.

## 5. `FalconOffers`

```tsx
import { FalconOffers } from '<your-preferred-path>/full/offers';

<FalconOffers
  publicKey={publicKey}
  placementId={placementId}
  identity={identity}
  onEvent={track}
  onError={logFalconError}
/>;
```

### Props

```typescript
interface FalconOffersProps {
  publicKey: string; // Falcon API public key, per environment
  placementId: string; // The placement for this surface (thank-you and order-status are separate placements)
  identity?: Identity; // Optional. Hashes you computed — see below
  environment?: 'production' | 'staging'; // Which Falcon API to call; default 'production'
  deny?: DeniableField[]; // Shopper fields Falcon must not collect — see below
  onEvent?: (event: FalconEvent) => void; // Optional, for your analytics — see §7
  onError?: (error: FalconError) => void; // Optional, for your logging — see §7
}

interface Identity {
  hashedEmail?: string;
  hashedPhone?: string;
}
```

Two required props, five optional. That is the entire API.

The shipped files carry no TypeScript types. Copy the interface above into your own code, and copy the event and error types from [§7](#7-events-and-errors).

The public key and the placement id are scoped to one environment and are never interchangeable. A staging key with `environment="production"`, or a thank-you placement id on the order-status page, both fail as an empty render.

`FalconOffers` reads the order and the shopper from the extension's `shopify` global, so you must mount it inside one of these targets:

- `purchase.thank-you.block.render`
- `customer-account.order-status.block.render`

Mount it once per extension, at the top level of what you render. It renders its own `<s-query-container>`, so do not add one around it. When there is nothing to show it renders nothing; [§7](#7-events-and-errors) lists every case.

### Identifying the shopper

You don't have to hash anything. The unit sends the raw email and phone, and Falcon hashes them itself. Pass hashes in `identity` only when you deny the raw value but still want Falcon to recognise a returning shopper. The prop and every field in it are optional, and a hash you pass takes priority over the raw value. The unit itself hashes nothing, because Shopify's extension sandbox has no Web Crypto; compute the hashes wherever suits you.

```tsx
<FalconOffers
  publicKey={publicKey}
  placementId={placementId}
  identity={{
    hashedEmail: sha256(normalize(email)),
    hashedPhone: sha256(normalizePhone(phone)),
  }}
/>
```

The rules, which Falcon applies on its own surfaces and which your hashes must match exactly, or a returning shopper is never recognised:

- **SHA-256**, output as lower-case hex.
- **Email**: trim whitespace, then lower-case. `" Ann@Example.com "` hashes as `ann@example.com`.
- **Phone**: E.164, digits with a leading `+` and nothing else. `+1 (555) 000-1234` hashes as `+15550001234`.

Check your implementation against this pair before going live: `ann@example.com` must hash to `71d4f55f72fa128dfb468a1a3901507c804b74316488744d769d7f4b16696476`.

Any SHA-256 implementation works — your server, or `crypto.subtle` outside the extension sandbox. Inside it there is no Web Crypto, so here is a self-contained version you can paste as is, normalizers included:

```typescript
/** Trim, lower-case. `" Ann@Example.com "` → `ann@example.com`. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** E.164: a leading `+` and digits, nothing else. `+1 (555) 000-1234` → `+15550001234`. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}
```

And the SHA-256 itself, pure JS for use inside the sandbox:

```typescript
export function sha256Hex(str: string): string {
  const K: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  function rotr(n: number, x: number): number {
    return (x >>> n) | (x << (32 - n));
  }

  // Convert string to UTF-8 byte array
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = str.charCodeAt(++i);
      const cp = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    } else {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }

  // Pre-processing: padding
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) {
    bytes.push(0);
  }

  // Append length as 64-bit big-endian
  for (let i = 56; i >= 0; i -= 8) {
    bytes.push((bitLength / Math.pow(2, i)) & 0xff);
  }

  // Initialize hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  // Process each 512-bit block
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w: number[] = new Array(64);

    for (let i = 0; i < 16; i++) {
      w[i] =
        (bytes[offset + i * 4] << 24) |
        (bytes[offset + i * 4 + 1] << 16) |
        (bytes[offset + i * 4 + 2] << 8) |
        bytes[offset + i * 4 + 3];
    }

    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => (v >>> 0).toString(16).padStart(8, '0'))
    .join('');
}
```

A missing identifier costs you targeting, not rendering. `hashedEmail` matters most: it is how Falcon recognises a returning shopper across orders. `hashedPhone` is the fallback when there is no email. When you pass no hash but the raw value is sent, Falcon hashes it itself by these rules. With neither the hash nor the raw value, every order is treated as a new shopper.

### Denying shopper fields

By default the unit sends what Shopify gives it. Name any field in `deny` and it is dropped before anything leaves the page:

```tsx
<FalconOffers
  publicKey={publicKey}
  placementId={placementId}
  deny={['phoneNumber', 'lastName']}
/>
```

| Field                                       | What it is                 |
| ------------------------------------------- | -------------------------- |
| `email`                                     | Shopper email              |
| `phoneNumber`                               | Shopper phone              |
| `customerId`                                | Shopify customer id        |
| `firstName`, `lastName`                     | Shopper name               |
| `billingAddress`                            | Both billing address lines |
| `city`, `billingZipcode`, `shippingZipcode` | City and postal codes      |
| `country`, `provinceCode`                   | Country and region         |

Order facts always travel and cannot be denied: `orderId`, `amount`, `shippingAmount`, `currency`, `language`, `paymentType` and the cart line items. They are what lets the unit run, and none of them identify the shopper.

What denying costs you, so the choice is an informed one:

- `firstName` appears in the unit's own copy, so without it the offer reads generically.
- `email` and `phoneNumber` are the raw values. Falcon recognises a returning shopper by the hash you pass in `identity`, or by hashing the raw value itself. Denying the raw field does not stop recognition while you still pass its hash; leave the hash out of `identity` too if you want the shopper anonymous.
- `customerId` travels as is and has no hash. Denying it removes it completely.
- `country`, `provinceCode` and `billingZipcode` decide which regional campaigns are eligible, so denying them narrows the pool of offers.
- `lastName`, `city`, `shippingZipcode` and `billingAddress` change little on their own.

`deny` and `identity` are independent. `deny` decides which raw values leave the page; `identity` is the only source of hashes. Every combination is valid:

| Raw value (`deny`) | Hash (`identity`) | What Falcon gets                                                                                                     |
| ------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| Sent               | Passed            | Both. The fullest targeting.                                                                                         |
| Denied             | Passed            | The hash only. Falcon still recognises a returning shopper without ever receiving the raw value. Often the best fit. |
| Sent               | Not passed        | The raw value. Falcon hashes it itself, so the shopper is still recognised across orders.                            |
| Denied             | Not passed        | Nothing. The shopper is anonymous to Falcon.                                                                         |

An unknown name is ignored rather than rejected, so a typo cannot break your checkout. Falcon can also narrow collection from its side, and the two run together: a field travels only when both allow it.

## 6. Entry files

Store the public key, the placement ids and the environment wherever your app keeps configuration, one set per environment. The example reads the key and the placement id from app-owned metafields; a constant works too.

```tsx
// extensions/thank-you/src/ThankYouBlock.tsx
import '@shopify/ui-extensions/preact';

import { useAppMetafields } from '@shopify/ui-extensions/checkout/preact';

import { FalconOffers } from '../../../falcon-templates/full/offers';
import { logFalconError, track } from '../../../src/falcon/track';
import { render } from 'preact';

export default function () {
  render(<Extension />, document.body);
}

function Extension() {
  const [publicKeyMetafield] = useAppMetafields({
    namespace: '$app:settings',
    key: 'falcon_public_key',
  });
  const [placementIdMetafield] = useAppMetafields({
    namespace: '$app:settings',
    key: 'falcon_thank_you_placement_id',
  });

  const publicKey = String(publicKeyMetafield?.metafield?.value ?? '');
  const placementId = String(placementIdMetafield?.metafield?.value ?? '');
  if (!publicKey || !placementId) return null;

  return (
    <FalconOffers
      publicKey={publicKey}
      placementId={placementId}
      environment="staging" // 'production' (the default) for the release build
      onEvent={track}
      onError={logFalconError}
    />
  );
}
```

`falcon-templates` is the templates folder from [§3](#3-installation). Keep your own files (`track.ts`, config) outside it, because `falcon:sync` overwrites anything inside.

`useAppMetafields` returns only metafields you declared in that extension's `shopify.extension.toml`, and the declaration needs all three fields:

```toml
[[extensions.metafields]]
namespace = "$app:settings"
key = "falcon_public_key"
owner_type = "SHOP"
```

Leave out `owner_type` and the values come back empty, so the guard above returns `null` and nothing renders, with no error to tell you why.

The order-status entry is the same file with three changes: import `useAppMetafields` from `@shopify/ui-extensions/customer-account/preact`, read the order-status placement id, and register it under `customer-account.order-status.block.render`.

## 7. Events and errors

`onEvent` and `onError` are both optional. Successful events build a funnel: `offers_loaded` → `impression` (per showing) → `click` / `decline` (per click) → `end`. Anything that goes wrong arrives on `onError` instead, once per mount.

### Events

```typescript
type FalconEvent =
  | { type: 'offers_loaded'; count: number; template: number }
  | { type: 'impression'; bannerId: string; position: number } // position is 1-based
  | { type: 'click'; bannerId: string; position: number }
  | { type: 'decline'; bannerId: string; position: number }
  | { type: 'end' };
```

- `offers_loaded` — the offers request succeeded. The unit renders once the configuration request completes as well.
- `impression` — an offer was put on screen. Fires for every showing, including when an offer comes back after a restart.
- `click` — the shopper clicked the primary CTA on that offer.
- `decline` — the shopper declined that offer.
- `end` — the carousel ran out, or the shopper closed the offer overlay. It can fire more than once per mount, because the unit can restart.

`bannerId` identifies the offer creative. Each `click` and `decline` you receive is one real user action.

Do not fire your own impression pixel. The unit already reports impressions.

### Errors

```typescript
type FalconError = { code: FalconErrorCode; message?: string };
```

Errors arrive on `onError`, never on `onEvent`, and each one is reported once per mount.

| Code              | Meaning                                                                                        | What renders                              |
| ----------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `no_order`        | No order id on this page, or a target the unit does not support                                | Nothing                                   |
| `offers_failed`   | The offers request failed. `message` carries the detail, `HTTP <status>: <text>` for a non-2xx | Nothing                                   |
| `site_inactive`   | Falcon has not switched this site live yet. The Shopify editor still renders                   | Nothing                                   |
| `no_offers`       | The request returned no offers: HTTP 204, or a 200 with an empty list                          | Nothing                                   |
| `features_failed` | The configuration request failed                                                               | The offers, in English, default behaviour |

Only `features_failed` leaves the unit on screen. A `401` or `403` on `offers_failed` usually means the public key does not match `environment`; a `404` usually means the placement id is unknown for that key.

### Declaring the types

The shipped files are untyped, so paste the two type blocks above into your own code next to your handlers:

```typescript
// src/falcon/track.ts
export function track(event: FalconEvent) {
  switch (event.type) {
    case 'impression':
    case 'click':
    case 'decline':
      analytics.track(`falcon_${event.type}`, {
        bannerId: event.bannerId,
        position: event.position,
      });
      break;
    default:
      analytics.track(`falcon_${event.type}`);
  }
}

export function logFalconError(error: FalconError) {
  logger.warn('falcon', error.code, error.message);
}
```

## 8. Verify on staging

Keep the public key, the placement ids and the environment in one config object per environment, so a release switches them together. Never edit the files in the templates folder; the next `falcon:sync` overwrites them.

1. Mount with `environment="staging"`, your staging public key and placement ids.
2. Place a test order on your dev store and open the thank-you page.
3. Open the Network tab. You should see, in order:
   - one `POST /api/features/evaluate` (on a reload within a few minutes this one is cached and will not appear). It goes first because its response decides which shopper fields the offers request may carry;
   - one `POST /api/odata`, status 200, with `at.orderid`, `at.language` and `at.lineItems` in the body, and `isTestMode: true` in the response. That flag confirms the placement is still serving mock offers, which is what you want on staging;
   - one `GET` for the first offer's tracking URL.
4. Decline every offer in turn. Each decline fires one more tracking `GET`. After the last one, `onEvent` receives `{ type: 'end' }` and the unit disappears. On some placements a redeem card replaces it instead, and on some the first decline opens the offer overlay. Ask your Falcon contact which of these are switched on for your placements, so you know which outcome is the correct one.
5. Repeat on the order-status page.
6. Release build: `environment="production"` (or omit the prop), production public key and placement ids. CI can fetch the folder on its own, see [§11](#11-cicd-setup).

The Shopify editor previews the page with a sample order, so the unit renders there too, even before Falcon switches the site live.

## 9. Go-live checklist

- Production public key and placement ids in place.
- `environment` is `production` or omitted.
- Protected customer data approved for the production app.
- `network_access = true` in both extensions.
- `onError` reaches your logging, so a silent unit is visible to you.
- Falcon has switched your production placements out of test mode. Ask your contact, then confirm on a real order that the response no longer reports test mode.

## 10. Updating the templates folder

Read `CHANGELOG.md` in the folder, then run:

```bash
npm run falcon:sync
```

This pulls the latest version from the templates repository using your deploy key.

`falcon:sync` moves the submodule pointer, so commit it:

```bash
git add <your-preferred-path> && git commit -m "chore: sync falcon templates"
```

Without that commit your CI and your production build keep using the previous version, and nothing warns you.

To pin a specific version instead, check it out inside the folder and commit the pointer the same way.

## 11. CI/CD setup

Your CI/CD environment has no access to the private repository by default, so the deploy key has to be available there too. Before your build runs `git submodule update`, store the key in your provider's secrets manager, write it to a file at build time, and point SSH at it.

### Example: AWS CodeBuild

1. Store the key in Secrets Manager:

   ```bash
   aws secretsmanager create-secret \
     --name "falcon-deploy-key" \
     --secret-string file://falcon_deploy_key
   ```

2. Add to your `buildspec.yml`:

   ```yaml
   env:
     secrets-manager:
       DEPLOY_KEY: 'falcon-deploy-key'

   phases:
     install:
       commands:
         - mkdir -p ~/.ssh
         - printf '%s\n' "$DEPLOY_KEY" > ~/.ssh/falcon_deploy_key
         - chmod 600 ~/.ssh/falcon_deploy_key
         - export GIT_SSH_COMMAND="ssh -i ~/.ssh/falcon_deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=no"
         - git submodule update --init --recursive
   ```

### Example: GitHub Actions

1. Store the key as a repository secret. Go to your repo → Settings → Secrets and variables → Actions → **New repository secret**:
   - **Name:** `FALCON_DEPLOY_KEY`
   - **Value:** paste the full contents of `falcon_deploy_key`

2. Add to your workflow (e.g. `.github/workflows/deploy.yml`):

   ```yaml
   steps:
     - name: Setup deploy key
       run: |
         mkdir -p ~/.ssh
         printf '%s\n' "${{ secrets.FALCON_DEPLOY_KEY }}" > ~/.ssh/falcon_deploy_key
         chmod 600 ~/.ssh/falcon_deploy_key

     - name: Checkout
       uses: actions/checkout@v4

     - name: Fetch submodules
       run: |
         GIT_SSH_COMMAND="ssh -i ~/.ssh/falcon_deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" \
           git submodule update --init --recursive
   ```

> **Note:** Do not use `submodules: recursive` in `actions/checkout` — it overrides SSH with its own HTTPS authentication, which has no access to the private repository.

`printf` matters in both examples: a key written without its trailing newline makes SSH fail with `invalid format`. If the build reports `Permission denied (publickey)` instead, the key is not being picked up, so check `GIT_SSH_COMMAND`.

## 12. What the unit does for you

It reads the order, the shopper's contact details, the address, the cart lines, the amount and the language from `shopify`, and sends them to `/api/odata` together with the hashes you passed in `identity`.

It requests offers and configuration, renders Template 15 or Template 17 as Falcon serves it for the placement, and runs the carousel. Some placements open the remaining offers in an overlay, and return to the same position when the page loads again after a click. Some shoppers see a countdown strip above the card, and a redeem card once it expires; tapping that card restarts the carousel.

Static labels render in the shopper's language when the configuration request succeeds, and in English when it does not.

## 13. Support

For questions or issues, contact **Falcon Labs**.
