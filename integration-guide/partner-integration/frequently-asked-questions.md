## Frequently Asked Questions

### Q: What’s the difference between public and private keys?

**A**: The **public key** is used exclusively for fetching offers via the OData API (customer-facing operations). The **private key** is used for all management operations (creating sites, placements, accessing reports). Never expose the private key in client-side code.

### Q: Can I use the same placement for multiple pages?

**A**: No, create separate placements for each page type (thank you page, order status page, etc.). Each placement has specific configuration and tracking.

### Q: What happens when an offer is clicked?

**A**: When a customer clicks an offer, they are redirected to the `clickUrl` provided in the offer object. This URL includes tracking parameters for attribution.

### Q: How do I customize the appearance of offers?

**A**: For Shopify Checkout, use our maintained ad unit components — see [Shopify Ad Unit (React)](./shopify-ad-unit-react) or [Shopify Ad Unit (Preact)](./shopify-ad-unit-preact). For surfaces where you control the page, use the [Embedded Web SDK](/integration-guide/embedded). If you need full control over rendering, call [OData](./odata-api) directly and render the offer data yourself — but remember you'll then own firing impressions and wrapping CTAs in the click URL (see the [Complete Custom Integration Example](./complete-integration-example)).

### Q: How long are offers valid?

**A**: Offers returned from the OData API should be displayed immediately. Cache duration is managed internally by the system.

### Q: What should I do if I hit rate limits?

**A**: Implement exponential backoff for retries, cache data where possible, and monitor the `X-RateLimit-*` headers. If you consistently hit limits, contact support to discuss increasing your limits.

### Q: Can I create publishers on behalf of my merchants?

**A**: Yes, that’s the intended use case. Use your platform token to create publisher accounts for each merchant on your platform.

### Q: Do I need to implement impression tracking?

**A**: Yes, call the `beaconUrl` when an offer is displayed to track impressions. This is critical for accurate reporting and campaign optimization.

### Q: Why am I only seeing test/mock offers instead of real ones?

**A**: Your placement is in **test mode**. Newly created placements default to `isLiveMode: false`, which returns mock offers — that's the expected default on staging and for initial UA / test stores. To serve real offers from the Falcon network, set `isLiveMode: true` when creating the placement, or update an existing placement via the [Placements API](./placements-api).

### Q: Should I call OData from my backend or directly from the browser?

**A**: Either works. If you call directly from the browser, the customer's IP and User-Agent are picked up automatically. If you proxy through a backend, the request's source IP and User-Agent will be your server's, not the customer's — you must read the original client IP from the `X-Forwarded-For` header (typically the first entry) and the original `User-Agent` from the inbound request, and forward them via the `at.clientIp` and `at.userAgent` parameters. Without this, geo and device targeting break for every user.

### Q: What's the difference between staging and production?

**A**: Staging (`https://staging-pr-api.falconlabs.us`) is for initial development and end-to-end verification of your integration; production credentials are only issued after a successful staging review. All early development and testing must happen on staging to avoid polluting production metrics. See the [Staging Environment](./staging-environment) page for details.
