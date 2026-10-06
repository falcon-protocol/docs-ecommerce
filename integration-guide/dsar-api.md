---
title: "DSAR API Guide"
---

# DSAR API Guide

Falcon's **DSAR (Data Subject Access Request) API** lets you forward consumer
data-deletion requests to Falcon on behalf of your users — for example, when a
shopper exercises their right to erasure ("right to be forgotten") under GDPR,
CCPA, or a comparable privacy regulation.

The API records each incoming request against the matching consumer and routes
it into Falcon's data-deletion workflow. It gives you an auditable, programmatic
way to track and submit DSARs instead of handling them manually over email.

## Base Endpoint

```
https://pr-api.falconlabs.us/api/v1/dsar
```

## Authentication

A DSAR can be submitted with either a **PUBLISHER** token or a **SERVICE**
(platform) token. Pass it as a bearer token:

```
Authorization: Bearer <YOUR_TOKEN>
```

The requester is always derived from the token itself and is **never** read from
the request body, so you cannot file a request on behalf of another party. The
identity of the submitting publisher or platform is attached to the request
automatically for audit purposes.

### Choosing the right token for the scope

Submit the request with the token whose scope matches the data the DSAR should
be processed against:

- **PUBLISHER token** — scopes the request to that single publisher's data. Use
  this when the DSAR should be processed for one specific publisher.
- **SERVICE (platform) token** — scopes the request across your entire partner
  platform. Use this when the DSAR should be processed for the whole partner,
  across all of its publishers.

## Submit a Deletion Request

Records a consumer data-deletion request and enters it into Falcon's deletion
workflow.

### Endpoint

```
POST /api/v1/dsar/deletion-requests
```

### Authentication

Bearer token (PUBLISHER or SERVICE):

```
Authorization: Bearer <YOUR_TOKEN>
```

### Request Body

Identify the consumer with one or more of the identifiers below. These are the
same identity fields used by the [OData API](/integration-guide/partner-integration/odata-api),
so you can reuse the values you already send at offer time.

**At least one identifier is required.**

```json
{
  "email": "shopper@example.com",
  "phone": "+15551234567",
  "notes": "Deletion requested via support ticket #4821"
}
```

- `email` (string): Consumer email, plain text. Preferred — gives the best match.
- `phone` (string): Consumer phone, plain text (10–15 digits).
- `hashedEmail` (string): SHA-256 hash of the email (trim → lowercase → hash). Use when you cannot send plaintext.
- `hashedPhone` (string): SHA-256 hash of the phone, hashed the same way as `hashedEmail`.
- `notes` (string): Optional. Free-text context for the request, e.g. a ticket or case reference.

> **Email / phone hashing:** Send plaintext `email` when you can — it gives the
> best match. If privacy or compliance requirements mean you can't, hash the
> value yourself using SHA-256 (trim → lowercase → hash) and send it via
> `hashedEmail` / `hashedPhone`.
>
> Example: `shopper@example.com` → SHA-256 → `a1b2c3d4e5f6...` (64-character hex string).

### Example Request

```bash
curl -X POST https://pr-api.falconlabs.us/api/v1/dsar/deletion-requests \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shopper@example.com",
    "notes": "Deletion requested via support ticket #4821"
  }'
```

### Success Response (201 Created)

The request is recorded and tracked. For the consumer's privacy, **the response
never contains any personal information** — only a reference to the tracked
request.

```json
{
  "success": true,
  "data": {
    "id": "clx1a2b3c4d5e6f7g8h9i0j1k",
    "status": "pending",
    "createdAt": "2026-10-06T16:30:00.000Z"
  }
}
```

**Response Fields:**

- `id`: Reference for the tracked DSAR. Store it alongside your own case record.
- `status`: Current state of the request in Falcon's workflow.
- `createdAt`: ISO-8601 UTC timestamp of when the request was recorded.

### Error Responses

All errors share a common envelope: a human-readable `error`, a machine-readable
`code`, a `timestamp`, and a `requestId` you can quote to support. Validation
errors (400) also return a `details` array.

**400 Bad Request — No identifier supplied**

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "details": ["At least one identifier (email, phone, hashedEmail, or hashedPhone) is required"],
  "timestamp": "2026-10-06T16:30:00.000Z",
  "requestId": "req_8f3c2a1b9d0e"
}
```

**401 Unauthorized — Invalid or missing token**

```json
{
  "error": "Invalid authentication token",
  "code": "INVALID_TOKEN",
  "timestamp": "2026-10-06T16:30:00.000Z",
  "requestId": "req_8f3c2a1b9d0e"
}
```

**429 Too Many Requests — Rate limit exceeded**

Includes a `Retry-After` response header and a `details.retryAfter` hint (in
seconds) telling you when to retry.

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "details": { "retryAfter": 42 },
  "timestamp": "2026-10-06T16:30:00.000Z",
  "requestId": "req_8f3c2a1b9d0e"
}
```

## Rate Limits

The endpoint is rate-limited per token:

- **100 requests/minute** for standard tokens.
- **150 requests/minute** for elevated (SERVICE / ADMIN) tokens.

Exceeding the limit returns **429 Too Many Requests**. For bulk backfills,
spread submissions across time or request an elevated token from your Falcon
representative.

## Data Handling

Identifiers you submit are transmitted securely and stored encrypted at rest.
Falcon matches the identifiers to the corresponding consumer and processes the
deletion through its data-deletion workflow. The DSAR record itself is retained
(in pseudonymized form) as the audit trail required under GDPR Art. 17(3).

> **Note:** This API is for **consumer data-deletion requests**. For questions
> about data access or portability requests, contact your Falcon representative
> or email [privacy@falconlabs.com](mailto:privacy@falconlabs.com).
