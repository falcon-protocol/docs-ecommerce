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

- Always test in **test mode** (`isLiveMode: false`) before going live
- Verify ad display and tracking are working correctly
- Test error scenarios and edge cases
- Use the sandbox environment if available

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

---
