## Best Practices

### 1. Secure Key Storage

- Store **Platform Token**, **Public Key**, and **Private Key** securely
- Never expose keys in client-side code or public repositories
- Use environment variables or secure configuration management
- Rotate keys periodically for security

### 2. Error Handling

- Implement proper error handling for all API calls
- Log errors for debugging but avoid exposing sensitive information
- Provide user-friendly error messages
- Implement retry logic with exponential backoff for transient errors

### 3. Session Management

- Generate a unique `sessionId` for each customer session
- Use consistent session IDs across multiple API calls
- Include customer and order data for better targeting

### 4. Testing

- All initial development and testing should happen on the [Staging Environment](./staging-environment) — production credentials are only issued after a successful staging review.
- Newly created placements default to **test mode** (`isLiveMode: false`), which returns mock offers from OData. This is the expected default on staging and for initial UA / test stores in production. Real production publishers must explicitly pass `isLiveMode: true` when creating the placement (or update it later via the [Placements API](./placements-api)) — forgetting this is the most common reason real offers don't appear.
- Verify ad display and tracking are working correctly
- Test error scenarios and edge cases

### 5. Performance

- Cache placement IDs and publisher keys to reduce API calls
- Implement proper loading states in your UI
- Consider lazy loading the SDK to improve page load times
- Monitor rate limit headers and adjust request frequency

### 6. Customer Data & Privacy

- Only collect and pass customer data with proper consent
- Follow privacy regulations (GDPR, CCPA, etc.)
- Use customer data parameters to improve ad targeting
- Provide clear privacy policies and opt-out mechanisms

### 7. Monitoring & Analytics

- Track API response times and error rates
- Monitor rate limit consumption
- Set up alerts for critical errors
- Review reporting data regularly to optimize performance

### 8. Client Context for Targeting

- Always pass `at.clientIp` and `at.userAgent` on OData requests. Without them, geo and device targeting are disabled, which significantly degrades offer relevance and placement performance.
- If you call OData from a backend or proxy rather than directly from the customer's browser, read the original client IP from the `X-Forwarded-For` header (typically the first entry) and the original `User-Agent` from the inbound request, and forward them via the `at.` parameters. Otherwise every request appears to come from your server and targeting breaks for all users.

---
