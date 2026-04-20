## Impression API - Recording Ad Views

### Overview

The Impression API records when a promotional offer is displayed to the customer. It captures view/impression events used for analytics, reporting, and billing.

### Endpoint

```text
GET https://pr-api.falconlabs.us/vdata?...
```

The full URL — including all signed tracking parameters — is returned by the [OData API](./odata-api) as the `beaconUrl` field on each offer. **Callers never construct this URL themselves.**

### When to fire

Fire when an offer is shown to the user. If you can detect viewport visibility (e.g., `IntersectionObserver` on web, visibility hooks on mobile), prefer that — but in environments where you can't reliably observe what's on-screen (for example, some embedded Shopify contexts), it's better to fire when the offer becomes the active/displayed offer than to skip impressions entirely.

The one rule: don't fire an impression for every offer in a carousel on page load. Fire as each new offer is shown.

### How to fire

Issue a `GET` request to `beaconUrl`. Any standard mechanism works — an image pixel, `fetch`, `sendBeacon`, or a platform-native HTTP client.

### Authentication

None. Tracking parameters are signed into the URL itself.

### Response

- **`200 OK`** — usually an empty body or a 1×1 transparent pixel. Discard.
