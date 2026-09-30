---
title: "Gift with Purchase — Integration Guide"
---

# Gift with Purchase — Integration Guide

Compute an offer at one point in a shopper's journey (e.g. the checkout page) and render the
**same** offer later (e.g. the thank-you page). It's a two-call flow over
[`/api/odata`](../odata-api), linked by a `sessionId` you supply:

| Call | Param | What it does |
|---|---|---|
| **Compute** | `isPreview=true` | Generates the offer, stores it server-side against your `sessionId`, and returns it. |
| **Render** | `hasPreview=true` | Echoes the stored offer for that `sessionId`. |

> **Prerequisites:** a publisher **Public Key** and a **`placementId`** for each page. See
> [Prerequisites](../prerequisites), [Placements API](../placements-api), and
> [OData API](../odata-api) for the base request contract.

## Request parameters

| Param | Required | Notes |
|---|---|---|
| `isPreview` | compute call | `true` = generate, store, and return the offer. |
| `hasPreview` | render call | `true` = echo the stored offer. |
| `sessionId` | both calls | Unique per shopper session (e.g. a checkout token), sent **identically** on both calls so the render finds what compute stored. Missing → `400`. |
| `count` | optional | Number of offers to return; defaults to the placement setting. |

## Behavior

**Compute (`isPreview=true`)**

- Stores the offer server-side against your `sessionId`.
- Idempotent — a repeat compute call with the same `sessionId` replays the stored offer, so the
  shopper sees the identical one.
- On a checkout placement type we fire a checkout event for holdout or funnel-increase analysis.

**Render (`hasPreview=true`)**

- **Hit** → the stored offer.
- **Miss** (nothing stored — the TTL expired, or the compute call never ran) → an empty `offers`
  array (render nothing). Falcon can optionally serve fresh offers on a miss if the partner
  reaches out to their account manager and requests this behavior for their account.

## Requests

Keep routing params (`placementId`, `sessionId`, `isPreview`/`hasPreview`) in the query string
and customer data (`at.*`) in the JSON body.

**Step 1 — Compute** (e.g. checkout page) — render the result as a non-clickable preview:

```bash
curl -X POST "https://pr-api.falconlabs.us/api/odata?placementId=<COMPUTE_PLACEMENT_ID>&sessionId=abc123&isPreview=true" \
  -H "X-Falcon-Public-Key: PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
  -d '{ "at.email": "buyer@shop.com", "at.orderid": "1234" }'
```

**Step 2 — Render** (e.g. thank-you page) — same `sessionId`, resend the same customer data;
render the result as the clickable, redeemable gift:

```bash
curl -X POST "https://pr-api.falconlabs.us/api/odata?placementId=<RENDER_PLACEMENT_ID>&sessionId=abc123&hasPreview=true" \
  -H "X-Falcon-Public-Key: PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
  -d '{ "at.email": "buyer@shop.com", "at.orderid": "1234" }'
```

## Response

Always HTTP `200`. When `offers` is non-empty, render it; when it's `[]`, there's no gift for
this shopper — render nothing (it's not an error). Each offer carries its copy and imagery plus
`beaconUrl` (GET on display), `clickUrl` (navigate on redeem), and `closeUrl` (GET on dismiss);
see [OData API](../odata-api) for the full field list. Fire tracking on the render page only.

## Requirements

- Send identifiers as **strings** (`"1234"`, not `1234`).
- Send `at.orderid` on both calls so the purchase attributes to the offer.
- Make sure the compute call completes before the render call, or the render will miss.
- Calling server-side? Pass the shopper's `at.clientIp` and a real browser-style `at.userAgent`
  (or `User-Agent` header) — without them, bot detection returns a silent `204`.
- Auth uses the `X-Falcon-Public-Key` header. (`Authorization: Bearer PUBLIC_KEY` still works but
  is being phased out.)
- Testing: use `https://staging-pr-api.falconlabs.us/api/odata` with your staging Public Key —
  see [Staging Environment](../staging-environment).
