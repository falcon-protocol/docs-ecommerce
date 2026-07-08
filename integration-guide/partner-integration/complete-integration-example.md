---
title: "Complete Integration Example"
---

## Complete Custom Integration Example

This is a complete walkthrough of the **custom integration path** — creating the entity hierarchy as a partner, then rendering offers yourself by calling OData directly and wiring up the click and impression URLs returned in the response. If you have full control over the surface and don't need to customize rendering, prefer the [Embedded Web SDK](/integration-guide/embedded) — it handles fetching, rendering, impression tracking, and click handling for you. This guide is for cases where you're rendering offers in your own UI.

### 1. Create the entity hierarchy

```bash
#!/bin/bash

BASE_URL="https://pr-api.falconlabs.us"
PLATFORM_TOKEN="plat_1234567890abcdef1234567890abcdef"

# Step 1: Create Publisher
echo "Step 1: Creating publisher..."
PUBLISHER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/publishers" \
  -H "Authorization: Bearer${PLATFORM_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Fashion Store",
    "contactName": "John Doe",
    "contactEmail": "john@myfashionstore.com",
    "contactPhone": "+1-555-0123"
  }')

# Extract keys
PUBLIC_KEY=$(echo $PUBLISHER_RESPONSE | jq -r '.data.publicKeys[0]')
PRIVATE_KEY=$(echo $PUBLISHER_RESPONSE | jq -r '.data.privateKeys[0].bearer')

echo "Public Key:$PUBLIC_KEY"
echo "Private Key:$PRIVATE_KEY"

# Step 2: Create Site
echo ""
echo "Step 2: Creating site..."
SITE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/site" \
  -H "Authorization: Bearer${PRIVATE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Fashion Store",
    "domain": "myfashionstore.com",
    "status": "active"
  }')

SITE_ID=$(echo $SITE_RESPONSE | jq -r '.data.id')
echo "Site ID:$SITE_ID"

# Step 3: Create Placement (defaults to test mode)
echo ""
echo "Step 3: Creating placement..."
PLACEMENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/placements" \
  -H "Authorization: Bearer${PRIVATE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thank You Page Ad",
    "siteId": "'${SITE_ID}'",
    "pageType": "THANK_YOU_PAGE",
    "isLiveMode": false
  }')

PLACEMENT_ID=$(echo $PLACEMENT_RESPONSE | jq -r '.data.id')
echo "Placement ID:$PLACEMENT_ID"
```

> Test mode reminder: Step 3 omits `isLiveMode` (defaulting to `false`), which puts the placement in **test mode** — OData will return mock offers, not real ones from the network. Production publishers that should serve real offers must pass `isLiveMode: true`. See the [Placements API](./placements-api) for details.

### 2. Fetch offers via OData

```bash
echo ""
echo "Step 4: Fetching offers..."
curl -s -X GET "${BASE_URL}/api/odata?placementId=${PLACEMENT_ID}&sessionId=test_session_123&count=4&at.email=customer@example.com&at.orderid=ORDER-12345&at.clientIp=203.0.113.42&at.userAgent=Mozilla%2F5.0" \
  -H "Authorization: Bearer${PUBLIC_KEY}" | jq '.'

echo ""
echo "Integration complete!"
echo "Public Key:$PUBLIC_KEY"
echo "Private Key:$PRIVATE_KEY"
echo "Placement ID:$PLACEMENT_ID"
```

Each offer in the response includes three URLs you'll wire up in the next step:

- `clickUrl` — navigate the customer here when they click the offer
- `beaconUrl` — call this when the offer becomes visible (impression)
- `closeUrl` — call this when the customer dismisses the offer

> Backend proxy reminder: If your backend is calling OData on behalf of the browser, pass the customer's real IP and User-Agent via `at.clientIp` (read from `X-Forwarded-For`, typically the first entry) and `at.userAgent` (read from the inbound `User-Agent` header). Without these, every request looks like it's coming from your server and geo/device targeting breaks for all users.

See the [OData API](./odata-api) docs for the full response shape and parameter reference.

### 3. Render offers and wire up impression + click tracking

Once you have the offer payload, render each offer in your UI and:

1. **Fire the impression beacon (`beaconUrl`)** the first time the offer becomes visible to the customer.
2. **Use the click URL (`clickUrl`)** as the navigation target when the customer clicks the offer's CTA — that endpoint records the click and redirects to the advertiser.

A minimal browser-side example (framework-agnostic):

```js
// `offers` is the `offers` array from the OData response.
function renderOffer(offer, container) {
  const card = document.createElement("a");
  card.href = offer.clickUrl;          // wraps the offer in the click URL
  card.rel = "noopener";
  card.innerHTML = `
    <h3>${offer.title}</h3>
    <p>${offer.description}</p>
    <button>${offer.ctaText}</button>
  `;

  // Fire the impression beacon the first time the card is on screen.
  const observer = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        navigator.sendBeacon(offer.beaconUrl);   // impression
        obs.disconnect();
      }
    }
  }, { threshold: 0.5 });
  observer.observe(card);

  container.appendChild(card);
}
```

> Important: Skipping the impression beacon means Falcon never records that the offer was viewed, which breaks attribution and reporting. Skipping the click URL means clicks aren't recorded and the customer won't be redirected to the advertiser. Both are required for a custom integration to be considered complete.

For the full event semantics — including the JSON variants and required parameters — see the [Impression API](./impression-api) and [Click API](./click-api) docs.
