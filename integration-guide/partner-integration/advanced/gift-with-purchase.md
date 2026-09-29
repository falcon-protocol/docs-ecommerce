---
title: "Gift with Purchase — Integration Guide"
---

# Gift with Purchase — Integration Guide

How to show a Gift with Purchase offer on the checkout page and then render the **same**
offer on the thank-you page after purchase.

This is done with two [`/api/odata`](../odata-api) calls linked by a shared `sessionId`, both
carrying a `previewFlow` param:

1. **Checkout page** — request an offer with `previewFlow`. Show it as a **non-clickable
   preview** (a teaser of the gift the shopper will get).
2. **Thank-you page** — replay that same offer with `previewFlow` + `hasPreview`. Here it
   becomes the **clickable / redeemable** gift, and the purchase is attributed to it.

> **Prerequisites:** a working publisher **Public Key** and a **`placementId`** for the
> checkout and thank-you placements. See [Prerequisites](../prerequisites) for credentials,
> [Placements API](../placements-api) for provisioning placements, and [OData API](../odata-api)
> for the base request contract (auth, `POST` vs `GET`, `at.*` attributes). This guide covers
> the Gift-with-Purchase-specific behavior on top of that.

---

## Preview flows (`previewFlow`)

A single param, `previewFlow`, marks a request as a preview **and** declares how the offer is
stored between the two calls and for how long. Pick the value that matches your funnel:

| `previewFlow` | Storage | Server TTL | On a render miss |
|---|---|---|---|
| `client` | Client-side cache (localStorage) — no server storage | — | Returns an empty body; render from your own client cache |
| `checkout` | Server-side pin + replay | 3 hours | Falls through to a fresh carousel |
| `email` | Server-side pin + replay | 1 week | Falls through to a fresh carousel |

- Use **`checkout`** for a normal checkout → thank-you flow, and **`email`** when the two calls
  can be far apart (e.g. an email → landing page → thank-you journey) and you need the longer
  window. Use **`client`** only if you'd rather cache and re-render the offer yourself with no
  server-side storage.
- **The TTL is server-controlled** — it's fixed per flow and can't be supplied by the
  publisher.

There are two kinds of call, distinguished by whether `hasPreview` is present:

- **Compute call** — `previewFlow=<value>` **without** `hasPreview`. Generates the offer, saves
  the preview, and (for the `checkout` and `email` flows) pins it in Redis against the
  `sessionId`. This is **idempotent**: a repeated compute call with the same `sessionId` replays
  the pinned offer instead of generating a new one.
- **Render call** — `previewFlow=<value>` **+ `hasPreview=true`**. Replays the pinned offer on a
  hit. This is the thank-you call.

Use the **same `previewFlow` value** on both calls, and note that `previewFlow` requires a
`sessionId`.

---

## How it works

The offer shown at checkout must survive to the thank-you page — both to render the same
offer the shopper already saw, and to attribute the purchase to it. Two calls that share one
`sessionId` do this:

```text
Checkout page (compute)                    Thank-you page (render)
───────────────────────                    ───────────────────────
POST /api/odata                            POST /api/odata
  previewFlow=checkout                       previewFlow=checkout
  isCheckout=true                            hasPreview=true
  count=1                                    sessionId=abc123     ← SAME sessionId
  sessionId=abc123          ───────────────→ → replays the same offer
  → returns 1 offer                            (render as the redeemable gift)
    (render as non-clickable preview)
```

- The **compute** call generates and returns the offer, and (for `checkout` / `email`) pins it
  against the `sessionId`.
- The **render** call, with the same `sessionId` and `hasPreview=true`, replays that exact
  offer — no new offer is generated, so the shopper sees the same one and the purchase
  attributes to it.

---

## Step 1 — Checkout page

Make the **compute** call: request one offer with `previewFlow=checkout` and `count=1`, and no
`hasPreview`. Because this call happens on the checkout page, also send `isCheckout=true` to
mark it as a checkout-page event. Keep the routing params (`placementId`, `sessionId`, `count`,
`previewFlow`, `isCheckout`) in the query string; put customer data (`at.*`) in the JSON body.

```bash
curl -X POST "https://pr-api.falconlabs.us/api/odata?placementId=<CHECKOUT_PLACEMENT_ID>&sessionId=abc123&count=1&previewFlow=checkout&isCheckout=true" \
  -H "X-Falcon-Public-Key: PUBLIC_KEY" \
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

Make the **render** call: replay the same offer with `previewFlow=checkout`, `hasPreview=true`,
and the **same `sessionId`**. Resend the same customer data (including `at.email`) so both calls
carry a consistent identity.

```bash
curl -X POST "https://pr-api.falconlabs.us/api/odata?placementId=<THANKYOU_PLACEMENT_ID>&sessionId=abc123&previewFlow=checkout&hasPreview=true" \
  -H "X-Falcon-Public-Key: PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
  -d '{
        "at.email": "buyer@shop.com",
        "at.orderid": "1234",
        "at.clientIp": "203.0.113.7",
        "at.userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
      }'
```

Render the returned offer as the **clickable / redeemable** gift, and fire tracking (see
[Tracking](#tracking)). It is the same offer shown at checkout, now attributed to the purchase.

> **Not just checkout.** The two-call preview/replay flow isn't limited to the checkout →
> thank-you path. For journeys where the render call can be much later — e.g. an email → landing
> page → thank-you flow — use `previewFlow=email` on both calls to get the 1-week window instead
> of the 3-hour `checkout` window. In that case the first call isn't a checkout-page event, so
> omit `isCheckout=true` from it.

---

## Rendering the thank-you offer

What the render (`hasPreview`) call returns depends on the `previewFlow` you chose:

- **`checkout` / `email` (server-side pin + replay):** on a hit, the thank-you response contains
  the same offer and you render it directly — nothing needs to persist in the browser. On a
  **miss** (the pin expired past its TTL, or the compute call never landed), the render call
  **falls through to a fresh carousel** rather than the pinned gift — so guard for the offer
  being different from, or absent relative to, the one shown at checkout.
- **`client` (no server storage):** the thank-you response comes back with an **empty body**.
  You render the gift from the offer you cached in `localStorage` on the checkout page.

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

- **`sessionId` is the link.** `previewFlow` requires a `sessionId`, and you must send the exact
  same value on both calls (a missing `sessionId` returns `400`). Use any opaque string you can
  reproduce on both pages (e.g. a cart token); it must be under 128 characters and may not
  contain `' " ; \` `` ` `` or `--`. If checkout and thank-you happen in different contexts
  (email → landing page → thank-you), carry the same `sessionId` across all of them.
- **`previewFlow`, `hasPreview`, and `isCheckout` are top-level params**, not `at.*` attributes.
  Send the same `previewFlow` value on both calls; add `hasPreview=true` only on the render
  (thank-you) call.
- **`isCheckout=true` marks a checkout-page event.** Send it on the call that happens on the
  checkout page so the event is attributed to that surface. Omit it where the call isn't on the
  checkout page — the thank-you render call, or the first call of an `email` flow that starts
  somewhere other than checkout.
- **Auth:** send the publisher Public Key in the `X-Falcon-Public-Key: PUBLIC_KEY` header.
  (`Authorization: Bearer PUBLIC_KEY` is still accepted and takes precedence when both are sent,
  but it is being phased out — prefer `X-Falcon-Public-Key`.)
- **Use `POST`** and put customer data (`at.*`) in the body; keep routing params
  (`placementId`, `sessionId`, `count`, `previewFlow`, `hasPreview`, `isCheckout`) in the query
  string. Send
  identifiers as **strings** (`"1234"`, not `1234`) — a raw JSON number is silently rounded by
  `JSON.parse` before the server sees it.
- **Send a real browser-style `User-Agent`** (header or `at.userAgent`) and the shopper's
  `at.clientIp`. Server-to-server calls without these are attributed to your server and get a
  silent `204 No Content` from bot detection.
- **Send `at.orderid` on both calls** so the purchase joins to the offer.
- **Make sure the checkout call has completed before the thank-you call.** The thank-you call
  replays what the checkout call persisted; if it arrives first the offer won't be found (and a
  server-side flow will fall through to a fresh carousel). The server retries the lookup once
  after a few seconds, but leave a gap where you can.

> **Staging:** Use `https://staging-pr-api.falconlabs.us/api/odata` with your staging Public
> Key while testing. See [Staging Environment](../staging-environment) for the full environment
> reference.

---

## Checklist

1. Confirm you have a publisher Public Key and both placement IDs (checkout + thank-you).
2. Choose your `previewFlow`: `checkout` (3h), `email` (1 week), or `client` (self-cached).
3. Generate a stable `sessionId` for the shopper's journey.
4. Checkout (compute): `POST /api/odata?...&count=1&previewFlow=<flow>&isCheckout=true` → render
   a non-clickable preview. (Drop `isCheckout=true` if the first call isn't on the checkout page.)
5. Thank-you (render): `POST /api/odata?...&previewFlow=<flow>&hasPreview=true` (same
   `sessionId`) → render the redeemable gift and fire impression/dismiss tracking.
6. Verify the thank-you page returns and shows the same offer and the purchase attributes to it.
