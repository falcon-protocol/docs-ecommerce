# Custom Publisher Integration

## Overview

This guide is for **publishers** implementing Falcon's promotional ad unit on their own site or app via direct API integration. It covers the three customer-facing endpoints you'll need to wire up:

1. **[OData API](./odata-api)** — fetch promotional offers to display to a customer.
2. **[Click API](./click-api)** — record when a customer clicks an offer and redirect them to the advertiser.
3. **[Impression API](./impression-api)** — record when an offer becomes visible to the customer.

If you're a platform partner creating publishers, sites, and placements on behalf of merchants, see the [Partner Integration](../partner-integration/overview) guide instead. The Partner guide includes everything here plus management APIs, webhooks, and reporting.

> Prefer the Embedded SDK where you can: If you have full control over the surface the ad renders on, you'll save yourself a lot of work by using our [Embedded Web SDK](/integration-guide/embedded) instead of integrating these endpoints directly. The SDK handles fetching, rendering, impression tracking, and click handling for you. This custom guide is for cases where you need to render offers in your own UI — custom layouts, or environments where the SDK can't run.

## Credentials

To make OData requests you need two things, both of which are provided by your Falcon representative:

- **Public Key** — your publisher-specific bearer token for the OData endpoint. This is the only credential OData uses, and it's safe to ship to the browser.
- **Placement ID** — identifies the specific ad unit location (e.g., a thank you page) you want to render offers for. You'll typically have one placement ID per surface.

If you don't have either of these yet, reach out to your Falcon rep before starting development.

## Authentication

The OData API uses the publisher's **Public Key**. The Click and Impression APIs use signed URLs returned by OData, so they don't require separate authentication.

## Typical flow

1. Call the **OData API** with the placement ID and session/customer data to retrieve one or more offers.
2. Render the offers in your UI.
3. When an offer becomes visible to the customer, fire the **Impression API** URL (the `beaconUrl` field on the offer).
4. When the customer clicks an offer, navigate them to the **Click API** URL (the `clickUrl` field on the offer) — this records the click and redirects to the advertiser.

> Calling OData from a backend? If you proxy OData through your own server rather than calling it directly from the customer's browser, the request's source IP and `User-Agent` will be your server's, not the customer's. Read the original client IP from the `X-Forwarded-For` header (typically the first entry) and the original `User-Agent` from the inbound request, and forward them via the `at.clientIp` and `at.userAgent` parameters. Skipping this disables geo and device targeting and significantly degrades placement performance.
