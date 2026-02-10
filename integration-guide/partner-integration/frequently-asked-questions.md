## Frequently Asked Questions

### Q: What’s the difference between public and private keys?

**A**: The **public key** is used exclusively for fetching offers via the OData API (customer-facing operations). The **private key** is used for all management operations (creating sites, placements, accessing reports). Never expose the private key in client-side code.

### Q: Can I use the same placement for multiple pages?

**A**: No, create separate placements for each page type (thank you page, order status page, etc.). Each placement has specific configuration and tracking.

### Q: What happens when an offer is clicked?

**A**: When a customer clicks an offer, they are redirected to the `clickUrl` provided in the offer object. This URL includes tracking parameters for attribution.

### Q: How do I customize the appearance of offers?

**A**: For Shopify integrations, use the Adjustable Template component with the 84 configuration parameters. For other platforms, implement your own rendering using the offer data from the OData API.

### Q: How long are offers valid?

**A**: Offers returned from the OData API should be displayed immediately. Cache duration is managed internally by the system.

### Q: What should I do if I hit rate limits?

**A**: Implement exponential backoff for retries, cache data where possible, and monitor the `X-RateLimit-*` headers. If you consistently hit limits, contact support to discuss increasing your limits.

### Q: Can I create publishers on behalf of my merchants?

**A**: Yes, that’s the intended use case. Use your platform token to create publisher accounts for each merchant on your platform.

### Q: Do I need to implement impression tracking?

**A**: Yes, call the `beaconUrl` when an offer is displayed to track impressions. This is critical for accurate reporting and campaign optimization.
