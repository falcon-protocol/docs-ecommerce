# Publisher Integration

## Overview

This guide is for **publishers** implementing Falcon's promotional ad unit on their own site or app. It covers the three customer-facing endpoints you'll need to integrate:

1. **[OData API](./odata-api)** — fetch promotional offers to display to a customer.
2. **[Click API](./click-api)** — record when a customer clicks an offer and redirect them to the advertiser.
3. **[Impression API](./impression-api)** — record when an offer becomes visible to the customer.

If you're a platform partner creating publishers, sites, and placements on behalf of merchants, see the [Partner Integration](../partner-integration/overview) guide instead. The Partner guide includes everything here plus management APIs, webhooks, and reporting.

## Authentication

The OData API uses the publisher's **Public Key**. The Click and Impression APIs use signed URLs returned by OData, so they don't require separate authentication.

## Typical flow

1. Call the **OData API** with a placement ID and session/customer data to retrieve one or more offers.
2. Render the offers in your UI.
3. When an offer is shown to the customer, fire the **Impression API** URL (the `beaconUrl` field on the offer).
4. When the customer clicks an offer, navigate them to the **Click API** URL (the `clickUrl` field on the offer) — this records the click and redirects to the advertiser.
