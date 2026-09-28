---
title: "Gift with Purchase — Integration Guide"
---

# Gift with Purchase — Integration Guide

How to show a Gift with Purchase offer on the checkout page and then render the **same**
offer on the thank-you page after purchase.

This is done with two [`/api/odata`](../odata-api) calls linked by a shared `sessionId`:

1. **Checkout page** — request an offer with `isPreview` + `isCheckout`. Show it as a
   **non-clickable preview** (a teaser of the gift the shopper will get).
2. **Thank-you page** — replay that same offer with `hasPreview`. Here it becomes the
   **clickable / redeemable** gift, and the purchase is attributed to it.

> **Prerequisites:** a working publisher **Public Key** and a **`placementId`** for the
> checkout and thank-you placements. See [Prerequisites](../prerequisites) for credentials,
> [Placements API](../placements-api) for provisioning placements, and [OData API](../odata-api)
> for the base request contract (auth, `POST` vs `GET`, `at.*` attributes). This guide covers
> the Gift-with-Purchase-specific behavior on top of that.
>
> **One-time setup required:** so that the thank-you call returns the full offer for you to
> render (rather than an empty body), **ask the Falcon team to enable server-side preview
> replay for your publisher.** Without it, `hasPreview` returns no offer and you would only get
> one back if you cached it yourself on the checkout page. See
> [Rendering the thank-you offer](#rendering-the-thank-you-offer).

---

## How it works

The offer shown at checkout must survive to the thank-you page — both to render the same
offer the shopper already saw, and to attribute the purchase to it. Two calls that share one
`sessionId` do this:

```text
Checkout page                              Thank-you page
─────────────                              ──────────────
POST /api/odata                            POST /api/odata
  isCheckout=true                            hasPreview=true
  isPreview=true                             sessionId=abc123    ← SAME sessionId
  count=1
  sessionId=abc123          ───────────────→ replays the identical offer
  → returns 1 offer                          → returns the same offer
    (render as non-clickable preview)          (render as the redeemable gift)
```

- The **first** call generates and returns the offer, and pins it against the `sessionId`.
- The **second** call, with the same `sessionId`, replays that exact offer — no new offer is
  generated, so the shopper sees the same one and the purchase attributes to it.

---

## Step 1 — Checkout page

Request one offer with `isCheckout=true`, `isPreview=true`, and `count=1`. Keep the routing
params (`placementId`, `sessionId`, `count`, and the flags) in the query string; put customer
data (`at.*`) in the JSON body.

```bash
curl -X POST "https://pr-api.falconlabs.us/api/odata?placementId=<CHECKOUT_PLACEMENT_ID>&sessionId=abc123&count=1&isCheckout=true&isPreview=true" \
  -H "Authorization: Bearer PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
  -d '{
        "at.email": "buyer@shop.com",
        "at.orderid": "1234",
        "at.clientIp": "203.0.113.7",
        "at.userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
      }'
```

Render the returned offer as a **non-clickable preview** — a teaser of the gift. Do not make
it redeemable and do not fire tracking here; the offer is only actioned on the thank-you page.

## Step 2 — Thank-you page

Replay the same offer with `hasPreview=true` and the **same `sessionId`**.

```bash
curl -X POST "https://pr-api.falconlabs.us/api/odata?placementId=<THANKYOU_PLACEMENT_ID>&sessionId=abc123&hasPreview=true" \
  -H "Authorization: Bearer PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
  -d '{
        "at.orderid": "1234",
        "at.clientIp": "203.0.113.7",
        "at.userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
      }'
```

Render the returned offer as the **clickable / redeemable** gift, and fire tracking (see
[Tracking](#tracking)). It is the same offer shown at checkout, now attributed to the purchase.

---

## Rendering the thank-you offer

**By default, the thank-you (`hasPreview`) call does not replay the full offer** — it returns
an empty response, and the client is expected to render the gift from its own cache of the
checkout offer. Returning the full offer on the thank-you call is an opt-in mode:
**server-side preview replay**, a one-time Falcon-side config keyed to your publisher. Request
it as part of onboarding this feature.

- **Replay enabled (recommended):** the thank-you response contains the same offer, and you
  render it directly. Nothing needs to persist in the browser.
- **Replay not enabled (default):** the thank-you response comes back with **no offers**. You
  only have a gift to show if you cached the checkout offer yourself and re-rendered it. Either
  enable replay, or handle the caching on your side.

> **Replay window:** when server-side preview replay is enabled, the checkout offer is cached
> server-side for **1 week**. The thank-you call must arrive within that window to replay the
> offer; after it expires, `hasPreview` returns no offer. This comfortably covers a normal
> checkout → thank-you flow, but keep it in mind for delayed funnels (e.g. email → landing page
> → thank-you).

---

## Response shape

Both calls return the same JSON object — the standard OData response (see
[OData API](../odata-api) for the complete contract). For Gift with Purchase you request
`count=1`, so `offers` holds a single offer:

```jsonc
{
  "offers": [ /* one offer for count=1 */ ],
  "template": 21,            // numeric template id
  "templateData": { "brandName": "...", "privacyUrl": "..." },
  "siteStatus": "active",
  "siteImages": [ /* ... */ ],
  "withOverlayTrigger": false
}
```

Each offer carries what you need to render the gift plus its tracking URLs:

| Field | Purpose |
|---|---|
| `title`, `header`, `description`, `shortDescription` | Copy for the gift. |
| `value` | Numeric value of the offer (nullable). |
| `icon`, `iconSvg`, `hero`, `images` | Imagery. |
| `code` | The gift / coupon code, when applicable. |
| `ctaText` | Call-to-action button label. |
| `termsUrl`, `additionalTermsUrl`, `disclaimer`, `declineButtonText` | Terms / dismiss copy. |
| `beaconUrl` | Impression tracking URL — GET it when the offer is shown. |
| `clickUrl` | Redemption URL — navigate the shopper here on click. |
| `closeUrl` | Dismiss tracking URL — GET it if the shopper dismisses the offer. |

## Tracking

Tracking is driven by the URLs on the offer object, and is done **on the thank-you page**
(the checkout preview is not tracked). See [Impression API](../impression-api) and
[Click API](../click-api) for the full event contract.

- **Impression:** issue an unauthenticated `GET` to `beaconUrl` when you display the gift.
- **Click / redeem:** navigate the shopper to `clickUrl` (the click is recorded on that
  redirect — there is no separate click beacon to fire).
- **Dismiss:** issue an unauthenticated `GET` to `closeUrl` if the shopper closes the offer.

---

## Rules

- **`sessionId` is the link.** Send the exact same value on both calls (required on both — a
  missing `sessionId` returns `400`). Use any opaque string you can reproduce on both pages
  (e.g. a cart token); it must be under 128 characters and may not contain `' " ; \` `` ` `` or
  `--`. If checkout and thank-you happen in different contexts (email → landing page →
  thank-you), carry the same `sessionId` across all of them.
- **`isPreview` / `hasPreview` / `isCheckout` are top-level params**, not `at.*` attributes.
- **Auth:** use the publisher Public Key in either header — `Authorization: Bearer PUBLIC_KEY`
  or `X-Falcon-Public-Key: PUBLIC_KEY`. Bearer is the usual choice; `X-Falcon-Public-Key` is for
  hosts that can't set an `Authorization` header (e.g. Shopify UI extensions). Bearer wins when
  both are present.
- **Use `POST`** and put customer data (`at.*`) in the body; keep routing params
  (`placementId`, `sessionId`, `count`, flags) in the query string. Send identifiers as
  **strings** (`"1234"`, not `1234`) — a raw JSON number is silently rounded by `JSON.parse`
  before the server sees it.
- **Send a real browser-style `User-Agent`** (header or `at.userAgent`) and the shopper's
  `at.clientIp`. Server-to-server calls without these are attributed to your server and get a
  silent `204 No Content` from bot detection.
- **Send `at.orderid` on both calls** so the purchase joins to the offer.
- **Make sure the checkout call has completed before the thank-you call.** The thank-you call
  replays what the checkout call persisted; if it arrives first the offer won't be found. The
  server retries the lookup once after a few seconds, but leave a gap where you can.

> **Staging:** Use `https://staging-pr-api.falconlabs.us/api/odata` with your staging Public
> Key while testing. See [Staging Environment](../staging-environment) for the full environment
> reference.

---

## Checklist

1. Confirm you have a publisher Public Key and both placement IDs (checkout + thank-you).
2. Ask Falcon to enable **server-side preview replay** for your publisher.
3. Generate a stable `sessionId` for the shopper's journey.
4. Checkout: `POST /api/odata?...&count=1&isCheckout=true&isPreview=true` → render a
   non-clickable preview.
5. Thank-you: `POST /api/odata?...&hasPreview=true` (same `sessionId`) → render the redeemable
   gift and fire impression/dismiss tracking.
6. Verify the thank-you page returns and shows the same offer and the purchase attributes to it.
