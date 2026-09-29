---
title: "Gift with Purchase — Integration Guide"
---

# Gift with Purchase — Integration Guide

How to compute an offer at one point in a shopper's journey (e.g. the checkout page) and render
the **same** offer later (e.g. the thank-you page after purchase).

It's a two-call flow over [`/api/odata`](../odata-api), linked by a single `sessionId` you
supply:

| Call | Param | Where it runs | What it does |
|---|---|---|---|
| **Compute** | `isPreview=true` | e.g. checkout page | Generates the offer, stores it server-side, and returns it. |
| **Render** | `hasPreview=true` | e.g. thank-you page | Echoes the previously computed offer. |

> `previewFlow` is no longer used — ignore any older docs that reference it. `isPreview` /
> `hasPreview` are the only preview params.

> **Prerequisites:** a working publisher **Public Key** and a **`placementId`** for the
> checkout and thank-you placements. See [Prerequisites](../prerequisites) for credentials,
> [Placements API](../placements-api) for provisioning placements, and [OData API](../odata-api)
> for the base request contract (auth, `POST` vs `GET`, `at.*` attributes). This guide covers
> the preview-specific behavior on top of that.

---

## Request parameters

| Param | Required | Notes |
|---|---|---|
| `isPreview` | on the compute call | `true` = generate + store + return the offer. |
| `hasPreview` | on the render call | `true` = echo the stored offer. |
| `sessionId` | yes, on every preview and checkout-placement request | A value that's **unique per shopper session** (e.g. a checkout token), sent **identically** on the compute and render calls. Missing → `400`. |
| `count` | optional | Number of offers to return. Honored as sent, and falls back to the placement/template default when omitted — **not** fixed to 1. |

There is **no `isCheckout` request parameter** — checkout tracking is derived from the
placement type instead (see below).

---

## How it works

The offer computed on the first page must survive to the second, both to render the same offer
the shopper already saw and to attribute the purchase to it. Two calls that share one
`sessionId` do this:

```text
Compute (e.g. checkout)                    Render (e.g. thank-you)
───────────────────────                    ───────────────────────
POST /api/odata                            POST /api/odata
  isPreview=true                             hasPreview=true
  sessionId=abc123          ───────────────→ sessionId=abc123     ← SAME sessionId
  → generates, stores,                       → echoes the stored offer
    and returns the offer                      (render as the redeemable gift)
    (render as non-clickable preview)
```

### Compute (`isPreview=true`)

- Generates the offer and returns it in the response (your client may also cache it locally).
- **Stores the offer server-side** against your `sessionId` — this is the default behavior, with
  a server-controlled TTL (default **1 day**).
- **Idempotent:** a second compute call with the same `sessionId` replays the stored offer
  instead of regenerating, so the shopper sees the identical offer.
- On a [Checkout placement](#tracking-checkout-events), emits the `ad_checkout` analytics event.

### Render (`hasPreview=true`)

- Looks up the offer stored for that `sessionId` and echoes it.
- **Hit** → the stored offer.
- **Miss** (nothing stored — the TTL expired, or the compute call never ran) → an **empty
  `offers` array** (render nothing). Falcon can optionally enable "serve a fresh offer on miss"
  per publisher; it's **off by default**.

---

## Tracking checkout events

The `ad_checkout` analytics event is derived from the **placement type**, not a request flag.
It fires automatically whenever a request hits a placement whose type is `CHECKOUT_PAGE`.

To track checkout events for your preview flow, the compute call must target a placement created
as a **Checkout placement** (`type = CHECKOUT_PAGE`).

- ✅ Compute call (`isPreview=true`) on a Checkout placement → generates the offer **and** emits
  `ad_checkout`.
- ⚠️ Compute call on a non-checkout placement → still generates / stores / returns the offer, but
  **no** `ad_checkout` event is recorded.
- A request to a Checkout placement **without** `isPreview` (e.g. a control shopper, or a plain
  checkout load) still emits `ad_checkout` and returns an empty `offers` array — this is what
  makes checkout-entry measurable for **every** shopper.

Checkout placements require `sessionId` on every request (the derived checkout state makes
`sessionId` mandatory). Send the same `sessionId` you'll use on the thank-you render.

> If you don't need checkout-event tracking, use any placement type — the preview compute/echo
> still works. The flow is not limited to checkout; it works for checkout and non-checkout
> journeys alike.

---

## Step 1 — Compute (e.g. checkout page)

Make the compute call with `isPreview=true` and a `sessionId` you can reproduce later. Keep
routing params (`placementId`, `sessionId`) in the query string; put customer data (`at.*`) in
the JSON body.

```bash
curl -X POST "https://pr-api.falconlabs.us/api/odata?placementId=<CHECKOUT_PLACEMENT_ID>&sessionId=abc123&isPreview=true" \
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
it redeemable and do not fire tracking here; the offer is only actioned on the render page.
(Want exactly one offer? Add `&count=1` — otherwise the placement default applies.)

## Step 2 — Render (e.g. thank-you page)

Make the render call with `hasPreview=true` and the **same `sessionId`**. Resend the same
customer data (including `at.email`) so both calls carry a consistent identity.

```bash
curl -X POST "https://pr-api.falconlabs.us/api/odata?placementId=<THANKYOU_PLACEMENT_ID>&sessionId=abc123&hasPreview=true" \
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
[Tracking](#tracking)). It is the same offer shown on the compute page, now attributed to the
purchase. If `offers` comes back empty, there's no gift for this shopper — render nothing.

---

## Response shape

Preview calls always return **HTTP `200`** with the standard offer-response body — never `204`
or `404`. See [OData API](../odata-api) for the complete contract.

**Offer present:**

```jsonc
{
  "offers": [ { /* ...offer... */ } ],
  "siteStatus": "active",
  "template": 10,            // numeric template id
  "templateData": { /* ... */ },
  "siteImages": [],
  "withOverlayTrigger": false,
  "ttl": 300,
  "isTestMode": false
}
```

**Empty** (no stored offer, or a suppressed / control shopper):

```jsonc
{ "offers": [], "siteStatus": "active" }
```

`offers: []` renders nothing — treat it as "no gift for this shopper," **not** an error.

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

Tracking is driven by the URLs on the offer object, and is done **on the render page**
(the compute-page preview is not tracked). See [Impression API](../impression-api) and
[Click API](../click-api) for the full event contract.

- **Impression:** issue an unauthenticated `GET` to `beaconUrl` when you display the gift.
- **Click / redeem:** navigate the shopper to `clickUrl` (the click is recorded on that
  redirect — there is no separate click beacon to fire).
- **Dismiss:** issue an unauthenticated `GET` to `closeUrl` if the shopper dismisses the offer.

---

## Linking the two calls

The compute and render calls are tied together **only by `sessionId`** — the value must be the
**same** where the offer is previewed and where it's rendered, and it's also what links the
recorded request back to the checkout exposure for attribution. Use a value that's **unique per
shopper session**, such as a checkout token.

- **Shopify:** the `checkoutToken` is a good fit — it's present on both the checkout and
  thank-you pages and survives the handoff (`localStorage` does not).
- `sessionId` must be under 128 characters and may not contain `' " ; \` `` ` `` or `--`.
- If the two calls happen in different contexts (email → landing page → thank-you), carry the
  same `sessionId` across all of them.

## Configuration (Falcon-side, not request params)

These are set by Falcon per publisher, never passed in the request:

| Setting | Default | Meaning |
|---|---|---|
| Stored-offer TTL | 1 day | How long the computed offer is retained for the render call. |
| Serve-on-miss | off (empty) | Whether a render miss falls back to a fresh offer instead of an empty response. |

---

## Rules

- **`sessionId` is the link.** `isPreview` / `hasPreview` (and Checkout placements) require a
  `sessionId`, and you must send the exact same value on both calls — a missing `sessionId`
  returns `400`.
- **`isPreview` and `hasPreview` are top-level params**, not `at.*` attributes. Send
  `isPreview=true` on the compute call and `hasPreview=true` on the render call.
- **Auth:** send the publisher Public Key in the `X-Falcon-Public-Key: PUBLIC_KEY` header.
  (`Authorization: Bearer PUBLIC_KEY` is still accepted and takes precedence when both are sent,
  but it is being phased out — prefer `X-Falcon-Public-Key`.)
- **Use `POST`** and put customer data (`at.*`) in the body; keep routing params
  (`placementId`, `sessionId`, `isPreview` / `hasPreview`, `count`) in the query string. Send
  identifiers as **strings** (`"1234"`, not `1234`) — a raw JSON number is silently rounded by
  `JSON.parse` before the server sees it.
- **Send a real browser-style `User-Agent`** (header or `at.userAgent`) and the shopper's
  `at.clientIp`. Server-to-server calls without these are attributed to your server and get a
  silent `204 No Content` from bot detection.
- **Send `at.orderid` on both calls** so the purchase joins to the offer.
- **Make sure the compute call has completed before the render call.** The render call echoes
  what the compute call stored; if it arrives first the lookup misses and returns an empty
  `offers` array. The server retries the lookup once after a few seconds, but leave a gap where
  you can.

> **Staging:** Use `https://staging-pr-api.falconlabs.us/api/odata` with your staging Public
> Key while testing. See [Staging Environment](../staging-environment) for the full environment
> reference.

---

## Checklist

1. Confirm you have a publisher Public Key and both placement IDs. For checkout-event tracking,
   create the compute placement as a **Checkout placement** (`type = CHECKOUT_PAGE`).
2. Generate a stable `sessionId` for the shopper's journey (Shopify: use the `checkoutToken`).
3. Compute: `POST /api/odata?...&isPreview=true` (same `sessionId`) → render a non-clickable
   preview.
4. Render: `POST /api/odata?...&hasPreview=true` (same `sessionId`) → render the redeemable gift
   and fire impression/dismiss tracking. Handle an empty `offers` array as "no gift."
5. Verify the render page shows the same offer and the purchase attributes to it.
