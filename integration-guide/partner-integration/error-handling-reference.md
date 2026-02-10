## Error Handling Reference

### **Error Response Format**

All API errors follow a standardized response structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "value",
    "additionalInfo": "..."
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_abc123xyz"
}
```

**Response Fields:**

- `error`: Human-readable error message describing what went wrong
- `code`: Machine-readable error code (see table below)
- `details`: Optional object with additional error context (only in development, omitted in production for security)
- `timestamp`: ISO 8601 timestamp when the error occurred
- `requestId`: Optional request identifier for debugging and support

### Common HTTP Status Codes

| HTTP Status | Error Code                    | Description                                             | Common Causes                                                                           |
| ----------- | ----------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 400         | `VALIDATION_FAILED`           | Request validation failed                               | Multiple validation errors; see response `details` array for field-level messages.      |
| 400         | `MISSING_REQUIRED_FIELD`      | A required field was not provided.                      | Required parameter was omitted or empty.                                                |
| 400         | `INVALID_FIELD_VALUE`         | Invalid field value                                     | Enum value not in allowed list, wrong data type, or format (e.g. email, category name). |
| 400         | `INVALID_JSON`                | The request body is not valid JSON.                     | Malformed JSON or syntax error in request body.                                         |
| 400         | `INVALID_PAYLOAD`             | The payload structure is invalid.                       | Web-hook or request payload does not match expected structure.                          |
| 401         | `UNAUTHORIZED`                | Invalid or missing auth token                           | Expired token, wrong token type                                                         |
| 401         | `INVALID_TOKEN`               | The authentication token is invalid.                    | Token expired, malformed, or revoked.                                                   |
| 401         | `MISSING_TOKEN`               | No authorization token was provided.                    | No `Authorization: Bearer` … header in request.                                         |
| 401         | `INVALID_SIGNATURE`           | Web-hook signature verification failed.                 | Invalid HMAC signature or wrong web-hook secret.                                        |
| 403         | `INSUFFICIENT_PERMISSIONS`    | The token does not have permission for this operation.  | Using public key for management operations, or wrong token type.                        |
| 403         | `SITE_INACTIVE`               | The site is inactive.                                   | Attempting operations on a deactivated site.                                            |
| 404         | `RESOURCE_NOT_FOUND`          | The requested resource was not found.                   | Invalid ID, resource deleted, or resource belongs to another publisher.                 |
| 404         | `PLACEMENT_NOT_FOUND`         | The requested placement was not found.                  | Invalid placement ID or placement was deleted.                                          |
| 409         | `RESOURCE_CONFLICT`           | A resource with this value already exists.              | Duplicate email, name already taken, or unique constraint violation.                    |
| 429         | `RATE_LIMIT_EXCEEDED`         | Rate limit for this token was exceeded.                 | Too many requests in the time window; use Retry-After before retrying.                  |
| 500         | `INTERNAL_ERROR`              | An unexpected internal server error occurred.           | Unexpected error or database failure; contact support with timestamp and requestId.     |
| 500         | `DATABASE_ERROR`              | A database operation failed.                            | Database connection issue or query failure.                                             |
| 500         | `ATOMIC_OPERATION_FAILED`     | A multi-step operation failed partway.                  | Transaction rollback or partial failure.                                                |
| 500         | `SERVICE_AUTH_NOT_CONFIGURED` | Service authentication is not configured on the server. | Backend misconfiguration; contact support.                                              |
