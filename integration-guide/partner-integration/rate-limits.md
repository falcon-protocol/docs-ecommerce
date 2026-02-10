## Rate Limits

### API Rate Limiting Policy

Falcon implements rate limiting to ensure service stability and fair usage across all partners.

### Rate Limit Tiers

| Endpoint Type                                   | Requests per Minute | Requests per Hour |
| ----------------------------------------------- | ------------------- | ----------------- |
| Management APIs (Publishers, Sites, Placements) | 60                  | 1,000             |
| OData API (Offer Fetching)                      | 300                 | 10,000            |
| Reporting API                                   | 30                  | 500               |

### Rate Limit Headers

All API responses include rate limit information in headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2024-01-15T10:45:00.000Z
```

- `X-RateLimit-Limit`: Maximum requests allowed in the current window
- `X-RateLimit-Remaining`: Requests remaining in the current window
- `X-RateLimit-Reset`: ISO 8601 timestamp when the rate limit resets

### Rate Limit Exceeded Response

When you exceed rate limits, the API returns HTTP 429:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "retryAfter": 45
  }
}
```

### Best Practices for Rate Limits

- Implement exponential backoff for retries
- Cache publisher, site, and placement IDs to reduce API calls
- Use batch operations when available
- Monitor rate limit headers and adjust request frequency
- Distribute requests evenly throughout the time window
